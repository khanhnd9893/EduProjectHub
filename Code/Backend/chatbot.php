<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
session_set_cookie_params([
    'httponly' => true,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax',
]);
session_start();
require_once __DIR__ . '/api_common.php';

/** Chuẩn hóa câu hỏi thành các từ khóa để so khớp câu hỏi thường gặp. */
function chatbotNormalize(string $text): array
{
    static $map = null;
    if ($map === null) {
        // Không dùng iconv //TRANSLIT vì libiconv trên XAMPP Windows làm hỏng tiếng Việt.
        $from = mb_str_split('àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 1, 'UTF-8');
        $to = str_split(
            str_repeat('a', 17) . str_repeat('e', 11) . str_repeat('i', 5) . str_repeat('o', 17)
            . str_repeat('u', 11) . str_repeat('y', 5) . 'd'
        );
        $map = array_combine($from, $to);
    }
    $text = mb_strtolower($text, 'UTF-8');
    $text = preg_replace('/\p{Mn}/u', '', $text) ?? $text;
    $words = preg_split('/[^a-z0-9]+/', strtr($text, $map), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $stopWords = ['lam', 'sao', 'de', 'toi', 'o', 'dau', 'khi', 'nao', 'the', 'va', 'cho', 'cua'];
    return array_values(array_diff(array_unique($words), $stopWords));
}

/** Chuyển tin nhắn từ cấu trúc cơ sở dữ liệu sang định dạng API. */
function chatbotMessage(array $message): array
{
    return [
        'id' => (int) $message['id'],
        'sessionId' => (int) $message['session_id'],
        'sender' => $message['sender'],
        'content' => $message['content'],
        'createdAt' => $message['created_at'],
    ];
}

/** Đọc và kiểm tra các trường FAQ; $partial chỉ xử lý những trường có trong yêu cầu cập nhật. */
function chatbotFaqValues(array $body, bool $partial): array
{
    $values = [];
    foreach (['question' => 500, 'answer' => 5000] as $field => $limit) {
        if ($partial && !array_key_exists($field, $body)) {
            continue;
        }
        $value = $body[$field] ?? null;
        apiRequire(is_string($value) && trim($value) !== '', 400, "$field không được để trống.");
        apiRequire(mb_strlen(trim($value), 'UTF-8') <= $limit, 400, "$field vượt quá giới hạn $limit ký tự.");
        $values[$field] = trim($value);
    }
    if (array_key_exists('category', $body)) {
        $category = $body['category'];
        apiRequire($category === null || is_string($category), 400, 'category phải là chuỗi hoặc null.');
        $category = $category === null ? '' : trim($category);
        apiRequire(mb_strlen($category, 'UTF-8') <= 100, 400, 'category vượt quá giới hạn 100 ký tự.');
        $values['category'] = $category === '' ? null : $category;
    }
    $enums = [
        'visibility' => ['all', 'admin', 'student', 'team_leader', 'lecturer', 'training_manager'],
        'status' => ['draft', 'published', 'archived'],
    ];
    foreach ($enums as $field => $allowed) {
        if (array_key_exists($field, $body)) {
            apiRequire(in_array($body[$field], $allowed, true), 400, "$field không hợp lệ.");
            $values[$field] = $body[$field];
        }
    }
    return $values;
}

/** Thực thi câu lệnh ghi FAQ và đổi lỗi trùng câu hỏi thành HTTP 409. */
function chatbotExecuteFaqWrite(PDOStatement $statement, array $params): void
{
    try {
        $statement->execute($params);
    } catch (PDOException $exception) {
        if ($exception->getCode() === '23000') {
            throw new RuntimeException('Câu hỏi này đã có trong danh sách FAQ.', 409);
        }
        throw $exception;
    }
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;
    $actor = apiRequireActor($pdo);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? '';

    if ($method === 'GET' && $action === 'faqs') {
        $visibilities = apiFaqVisibilities($actor);
        $sql = "SELECT id, question, answer, category, visibility, status, created_at, updated_at
                FROM chatbot_faqs
                WHERE status = 'published' AND visibility IN ("
            . implode(', ', array_fill(0, count($visibilities), '?'))
            . ') ORDER BY category, id';
        $statement = $pdo->prepare($sql);
        $statement->execute($visibilities);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'GET' && $action === 'sessions') {
        $statement = $pdo->prepare(
            'SELECT id, user_id, title, created_at, updated_at
             FROM chat_sessions WHERE user_id = ?
             ORDER BY updated_at DESC, id DESC'
        );
        $statement->execute([$actor['id']]);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'GET' && $action === 'messages') {
        $sessionId = filter_var($_GET['session_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        apiRequire($sessionId !== false, 400, 'session_id phải là số nguyên dương.');
        $statement = $pdo->prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?');
        $statement->execute([(int) $sessionId, $actor['id']]);
        apiRequire($statement->fetchColumn() !== false, 404, 'Không tìm thấy hội thoại.');
        $statement = $pdo->prepare(
            'SELECT id, session_id, sender, content, created_at
             FROM chat_messages WHERE session_id = ?
             ORDER BY created_at, id'
        );
        $statement->execute([(int) $sessionId]);
        $messages = array_map('chatbotMessage', $statement->fetchAll(PDO::FETCH_ASSOC));
        apiRespond(200, ['data' => $messages]);
    }

    if ($method === 'POST' && $action === 'send') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        $content = $body['content'] ?? null;
        apiRequire(is_string($content), 400, 'content phải là chuỗi.');
        $content = trim($content);
        apiRequire($content !== '' && mb_strlen($content, 'UTF-8') <= 2000, 400, 'Câu hỏi phải có từ 1 đến 2000 ký tự.');
        $sessionId = null;
        if (array_key_exists('session_id', $body) && $body['session_id'] !== null) {
            $sessionId = filter_var($body['session_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            apiRequire($sessionId !== false, 400, 'session_id không hợp lệ.');
        }

        $questionWords = chatbotNormalize($content);
        $visibilities = apiFaqVisibilities($actor);
        $sql = "SELECT question, answer FROM chatbot_faqs
                WHERE status = 'published' AND visibility IN ("
            . implode(', ', array_fill(0, count($visibilities), '?'))
            . ')';
        $statement = $pdo->prepare($sql);
        $statement->execute($visibilities);
        $bestAnswer = 'Xin lỗi, mình chưa có thông tin cho câu hỏi này. Bạn hãy liên hệ giảng viên hướng dẫn nhé.';
        $bestScore = 0;
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $faq) {
            $score = count(array_intersect($questionWords, chatbotNormalize($faq['question'])));
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestAnswer = $faq['answer'];
            }
        }
        if ($bestScore < 2) {
            $bestAnswer = 'Xin lỗi, mình chưa có thông tin cho câu hỏi này. Bạn hãy liên hệ giảng viên hướng dẫn nhé.';
        }

        $pdo->beginTransaction();
        if ($sessionId === null) {
            $statement = $pdo->prepare('INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)');
            $statement->execute([$actor['id'], mb_substr($content, 0, 200, 'UTF-8')]);
            $sessionId = (int) $pdo->lastInsertId();
        } else {
            $statement = $pdo->prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ? FOR UPDATE');
            $statement->execute([(int) $sessionId, $actor['id']]);
            apiRequire($statement->fetchColumn() !== false, 404, 'Không tìm thấy hội thoại.');
        }

        $insert = $pdo->prepare('INSERT INTO chat_messages (session_id, sender, content) VALUES (?, ?, ?)');
        $insert->execute([(int) $sessionId, 'user', $content]);
        $userMessageId = (int) $pdo->lastInsertId();
        $insert->execute([(int) $sessionId, 'assistant', $bestAnswer]);
        $assistantMessageId = (int) $pdo->lastInsertId();
        $pdo->prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([(int) $sessionId]);
        $pdo->commit();

        $createdAt = date('Y-m-d H:i:s');
        apiRespond(201, [
            'data' => [
                'sessionId' => (int) $sessionId,
                'userMessage' => [
                    'id' => $userMessageId,
                    'sessionId' => (int) $sessionId,
                    'sender' => 'user',
                    'content' => $content,
                    'createdAt' => $createdAt,
                ],
                'assistantMessage' => [
                    'id' => $assistantMessageId,
                    'sessionId' => (int) $sessionId,
                    'sender' => 'assistant',
                    'content' => $bestAnswer,
                    'createdAt' => $createdAt,
                ],
            ],
        ]);
    }

    if ($method === 'GET' && $action === 'manage_faqs') {
        apiRequireRole($actor, ['admin', 'lecturer'], 'Chỉ quản trị viên hoặc giảng viên mới được quản lý FAQ.');
        $statement = $pdo->query(
            'SELECT f.id, f.question, f.answer, f.category, f.visibility, f.status,
                    f.created_by, creator.full_name AS created_by_name, f.created_at, f.updated_at
             FROM chatbot_faqs f
             LEFT JOIN users creator ON creator.id = f.created_by
             ORDER BY f.updated_at DESC, f.id DESC'
        );
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'POST' && $action === 'create_faq') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        apiRequireRole($actor, ['admin', 'lecturer'], 'Chỉ quản trị viên hoặc giảng viên mới được quản lý FAQ.');
        $values = chatbotFaqValues($body, false);
        $values['created_by'] = $actor['id'];
        $statement = $pdo->prepare(
            'INSERT INTO chatbot_faqs (' . implode(', ', array_keys($values)) . ')
             VALUES (' . implode(', ', array_fill(0, count($values), '?')) . ')'
        );
        chatbotExecuteFaqWrite($statement, array_values($values));
        apiRespond(201, ['data' => ['id' => (int) $pdo->lastInsertId()]]);
    }

    if ($method === 'PATCH' && $action === 'update_faq') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        apiRequireRole($actor, ['admin', 'lecturer'], 'Chỉ quản trị viên hoặc giảng viên mới được quản lý FAQ.');
        $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        apiRequire($id !== false, 400, 'id phải là số nguyên dương.');
        $values = chatbotFaqValues($body, true);
        apiRequire($values !== [], 400, 'Không có trường nào để cập nhật.');
        $exists = $pdo->prepare('SELECT 1 FROM chatbot_faqs WHERE id = ?');
        $exists->execute([(int) $id]);
        apiRequire($exists->fetchColumn() !== false, 404, 'Không tìm thấy FAQ.');
        $statement = $pdo->prepare(
            'UPDATE chatbot_faqs SET ' . implode(', ', array_map(static fn ($column) => "$column = ?", array_keys($values))) . '
             WHERE id = ?'
        );
        chatbotExecuteFaqWrite($statement, [...array_values($values), (int) $id]);
        apiRespond(200, ['message' => 'Đã cập nhật FAQ.']);
    }

    apiRespond(404, ['error' => 'Không tìm thấy thao tác API.']);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (RuntimeException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $status = $exception->getCode();
    apiRespond($status >= 400 && $status <= 599 ? $status : 400, ['error' => $exception->getMessage()]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

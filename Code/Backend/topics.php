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

/** Validate a positive integer identifier from an API request. */
function topicId($value, string $field): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    apiRequire($id !== false, 400, "$field phải là số nguyên dương.");
    return (int) $id;
}

/** Validate and trim a required string field. */
function topicText(array $body, string $field, int $maxLength): string
{
    $value = $body[$field] ?? null;
    apiRequire(is_string($value), 400, "$field phải là chuỗi.");
    $value = trim($value);
    apiRequire($value !== '', 400, "$field không được để trống.");
    apiRequire(mb_strlen($value, 'UTF-8') <= $maxLength, 400, "$field vượt quá giới hạn $maxLength ký tự.");
    return $value;
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;
    $actor = apiRequireActor($pdo);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'topics' : '');
    $body = in_array($method, ['POST', 'PATCH'], true) ? apiReadJsonBody() : [];
    if (in_array($method, ['POST', 'PATCH'], true)) {
        apiRequireCsrf($body);
    }

    if ($method === 'GET' && $action === 'topics') {
        $sql = 'SELECT t.id, t.project_round_id, t.topic_code, t.title, t.description,
                       t.supervisor_user_id, supervisor.full_name AS supervisor_name,
                       t.max_groups, t.status, t.created_by, t.created_at, t.updated_at,
                       (SELECT COUNT(*) FROM topic_registrations tr
                        WHERE tr.topic_id = t.id AND tr.status = \'approved\') AS approved_groups
                FROM project_topics t
                LEFT JOIN users supervisor ON supervisor.id = t.supervisor_user_id';
        $params = [];
        $canViewAllTopics = apiIsTrainingManager($actor) || $actor['role'] === 'lecturer';
        if (!$canViewAllTopics) {
            $sql .= " WHERE t.status = 'open'";
        }
        if (isset($_GET['round_id'])) {
            $sql .= $canViewAllTopics ? ' WHERE' : ' AND';
            $sql .= ' t.project_round_id = ?';
            $params[] = topicId($_GET['round_id'], 'round_id');
        }
        $sql .= ' ORDER BY t.project_round_id DESC, t.title';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'GET' && $action === 'registrations') {
        $topicId = isset($_GET['topic_id']) ? topicId($_GET['topic_id'], 'topic_id') : null;
        $groupId = isset($_GET['group_id']) ? topicId($_GET['group_id'], 'group_id') : null;
        apiRequire(
            in_array($actor['role'], ['admin', 'training_manager', 'student', 'team_leader', 'lecturer'], true),
            403,
            'Không có quyền xem các đăng ký này.'
        );

        $sql = 'SELECT tr.id, tr.topic_id, t.topic_code, t.title AS topic_title,
                       tr.group_id, g.group_name, g.group_code, g.leader_user_id,
                       tr.registered_by, registrar.full_name AS registered_by_name,
                       tr.status, tr.note, tr.reviewed_by, reviewer.full_name AS reviewer_name,
                       tr.reviewed_at, tr.created_at, tr.updated_at
                FROM topic_registrations tr
                JOIN project_topics t ON t.id = tr.topic_id
                JOIN student_groups g ON g.id = tr.group_id
                JOIN users registrar ON registrar.id = tr.registered_by
                LEFT JOIN users reviewer ON reviewer.id = tr.reviewed_by';
        $conditions = [];
        $params = [];
        if ($topicId !== null) {
            $conditions[] = 'tr.topic_id = ?';
            $params[] = $topicId;
        }
        if ($groupId !== null) {
            $group = apiRequireGroupAccess($pdo, $groupId, $actor);
            $conditions[] = 'tr.group_id = ?';
            $params[] = $groupId;
        } elseif (apiIsStudentRole($actor)) {
            $conditions[] = 'g.leader_user_id = ?';
            $params[] = $actor['id'];
        } elseif ($actor['role'] === 'lecturer') {
            $conditions[] = 'EXISTS (
                SELECT 1 FROM group_lecturers gl
                WHERE gl.group_id = g.id AND gl.lecturer_user_id = ?
                  AND (SELECT COUNT(*) FROM group_lecturers workload
                       WHERE workload.lecturer_user_id = gl.lecturer_user_id) >= 2
            )';
            $params[] = $actor['id'];
        }
        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' ORDER BY tr.created_at DESC, tr.id DESC';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'POST' && $action === 'create') {
        apiRequire(
            apiIsTrainingManager($actor) || $actor['role'] === 'lecturer',
            403,
            'Chỉ người đào tạo, quản trị viên hoặc giảng viên mới được tạo đề tài.'
        );
        $roundId = topicId($body['project_round_id'] ?? null, 'project_round_id');
        $code = topicText($body, 'topic_code', 30);
        $title = topicText($body, 'title', 200);
        $description = $body['description'] ?? null;
        apiRequire($description === null || is_string($description), 400, 'description phải là chuỗi hoặc null.');
        $description = $description === null ? null : trim($description);
        $supervisorId = isset($body['supervisor_user_id']) && $body['supervisor_user_id'] !== ''
            ? topicId($body['supervisor_user_id'], 'supervisor_user_id')
            : null;
        if ($supervisorId !== null) {
            $statement = $pdo->prepare(
                "SELECT 1 FROM users WHERE id = ? AND role = 'lecturer' AND account_status = 'active'"
            );
            $statement->execute([$supervisorId]);
            apiRequire($statement->fetchColumn() !== false, 400, 'Người hướng dẫn phải là giảng viên đang hoạt động.');
        }
        $maxGroups = topicId($body['max_groups'] ?? 1, 'max_groups');
        apiRequire($maxGroups <= 65535, 400, 'max_groups không được vượt quá 65535.');
        $status = $body['status'] ?? 'draft';
        apiRequire(in_array($status, ['draft', 'open', 'closed'], true), 400, 'Trạng thái đề tài không hợp lệ.');
        $statement = $pdo->prepare(
            'INSERT INTO project_topics
                (project_round_id, topic_code, title, description, supervisor_user_id, max_groups, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([$roundId, $code, $title, $description, $supervisorId, $maxGroups, $status, $actor['id']]);
        apiRespond(201, ['data' => ['id' => (int) $pdo->lastInsertId()]]);
    }

    if ($method === 'PATCH' && $action === 'update') {
        apiRequire(
            apiIsTrainingManager($actor) || $actor['role'] === 'lecturer',
            403,
            'Chỉ người đào tạo, quản trị viên hoặc giảng viên mới được cập nhật đề tài.'
        );
        $id = topicId($body['id'] ?? null, 'id');
        $updates = [];
        $params = [];
        foreach (['topic_code' => 30, 'title' => 200] as $field => $limit) {
            if (array_key_exists($field, $body)) {
                $updates[] = "$field = ?";
                $params[] = topicText($body, $field, $limit);
            }
        }
        foreach (['description', 'supervisor_user_id', 'max_groups', 'status'] as $field) {
            if (!array_key_exists($field, $body)) {
                continue;
            }
            if ($field === 'description') {
                apiRequire($body[$field] === null || is_string($body[$field]), 400, 'description phải là chuỗi hoặc null.');
                $updates[] = 'description = ?';
                $params[] = $body[$field] === null ? null : trim($body[$field]);
            } elseif ($field === 'supervisor_user_id') {
                $updates[] = 'supervisor_user_id = ?';
                $supervisorId = $body[$field] === null || $body[$field] === ''
                    ? null
                    : topicId($body[$field], $field);
                if ($supervisorId !== null) {
                    $statement = $pdo->prepare(
                        "SELECT 1 FROM users WHERE id = ? AND role = 'lecturer' AND account_status = 'active'"
                    );
                    $statement->execute([$supervisorId]);
                    apiRequire($statement->fetchColumn() !== false, 400, 'Người hướng dẫn phải là giảng viên đang hoạt động.');
                }
                $params[] = $supervisorId;
            } elseif ($field === 'max_groups') {
                $statement = $pdo->prepare(
                    "SELECT COUNT(*) FROM topic_registrations
                     WHERE topic_id = ? AND status = 'approved'"
                );
                $statement->execute([$id]);
                apiRequire(
                    topicId($body[$field], $field) >= (int) $statement->fetchColumn()
                        && topicId($body[$field], $field) <= 65535,
                    409,
                    'Sức chứa phải từ số nhóm đã duyệt đến tối đa 65535.'
                );
                $updates[] = "$field = ?";
                $params[] = topicId($body[$field], $field);
            } else {
                apiRequire(in_array($body[$field], ['draft', 'open', 'closed'], true), 400, 'Trạng thái đề tài không hợp lệ.');
                $updates[] = 'status = ?';
                $params[] = $body[$field];
            }
        }
        apiRequire($updates !== [], 400, 'Không có trường nào để cập nhật.');
        $params[] = $id;
        $statement = $pdo->prepare('UPDATE project_topics SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $statement->execute($params);
        apiRequire($statement->rowCount() > 0, 404, 'Không tìm thấy đề tài hoặc không có thay đổi.');
        apiRespond(200, ['message' => 'Đã cập nhật đề tài.']);
    }

    if ($method === 'POST' && $action === 'register') {
        apiRequire(apiIsStudentRole($actor), 403, 'Chỉ sinh viên mới được đăng ký đề tài.');
        $topicId = topicId($body['topic_id'] ?? null, 'topic_id');
        $groupId = topicId($body['group_id'] ?? null, 'group_id');
        $note = $body['note'] ?? null;
        apiRequire($note === null || is_string($note), 400, 'note phải là chuỗi hoặc null.');
        $note = $note === null ? null : trim($note);

        $pdo->beginTransaction();
        $statement = $pdo->prepare('SELECT * FROM project_topics WHERE id = ? FOR UPDATE');
        $statement->execute([$topicId]);
        $topic = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($topic !== false && $topic['status'] === 'open', 409, 'Đề tài không còn nhận đăng ký.');
        $statement = $pdo->prepare('SELECT * FROM student_groups WHERE id = ? FOR UPDATE');
        $statement->execute([$groupId]);
        $group = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($group !== false, 404, 'Không tìm thấy nhóm.');
        apiRequire((int) $group['leader_user_id'] === (int) $actor['id'], 403, 'Chỉ trưởng nhóm mới được đăng ký đề tài.');
        apiRequire($group['status'] === 'forming' || $group['status'] === 'active', 409, 'Nhóm không thể đăng ký đề tài.');
        apiRequire((int) $group['project_round_id'] === (int) $topic['project_round_id'], 409, 'Đề tài thuộc đợt đồ án khác.');
        $statement = $pdo->prepare(
            "SELECT id FROM topic_registrations
             WHERE group_id = ? AND status IN ('pending', 'approved') FOR UPDATE"
        );
        $statement->execute([$groupId]);
        apiRequire($statement->fetchColumn() === false, 409, 'Nhóm đã có đăng ký đề tài đang chờ hoặc được duyệt.');
        $statement = $pdo->prepare(
            "SELECT COUNT(*) FROM topic_registrations WHERE topic_id = ? AND status = 'approved'"
        );
        $statement->execute([$topicId]);
        apiRequire((int) $statement->fetchColumn() < (int) $topic['max_groups'], 409, 'Đề tài đã đủ số nhóm đăng ký.');
        $statement = $pdo->prepare(
            'INSERT INTO topic_registrations (topic_id, group_id, registered_by, note)
             VALUES (?, ?, ?, ?)'
        );
        $statement->execute([$topicId, $groupId, $actor['id'], $note]);
        $registrationId = (int) $pdo->lastInsertId();
        $pdo->commit();
        apiRespond(201, ['data' => ['id' => $registrationId, 'status' => 'pending']]);
    }

    if ($method === 'PATCH' && $action === 'review') {
        apiRequire(
            in_array($actor['role'], ['admin', 'training_manager', 'lecturer'], true),
            403,
            'Chỉ người đào tạo, quản trị viên hoặc giảng viên mới được duyệt đăng ký.'
        );
        $registrationId = topicId($body['registration_id'] ?? null, 'registration_id');
        $status = $body['status'] ?? null;
        apiRequire(in_array($status, ['approved', 'rejected'], true), 400, 'Trạng thái duyệt không hợp lệ.');
        $note = $body['note'] ?? null;
        apiRequire($note === null || is_string($note), 400, 'note phải là chuỗi hoặc null.');

        $pdo->beginTransaction();
        $statement = $pdo->prepare('SELECT * FROM topic_registrations WHERE id = ?');
        $statement->execute([$registrationId]);
        $registration = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($registration !== false, 404, 'Không tìm thấy đăng ký đề tài.');
        $statement = $pdo->prepare('SELECT id, max_groups, status FROM project_topics WHERE id = ? FOR UPDATE');
        $statement->execute([$registration['topic_id']]);
        $topic = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($topic !== false, 404, 'Không tìm thấy đề tài.');
        $statement = $pdo->prepare('SELECT id FROM student_groups WHERE id = ? FOR UPDATE');
        $statement->execute([$registration['group_id']]);
        apiRequire($statement->fetchColumn() !== false, 404, 'Không tìm thấy nhóm.');
        $statement = $pdo->prepare('SELECT status FROM topic_registrations WHERE id = ? FOR UPDATE');
        $statement->execute([$registrationId]);
        $currentStatus = $statement->fetchColumn();
        apiRequire($currentStatus !== false, 404, 'Không tìm thấy đăng ký đề tài.');
        apiRequireGroupAccess($pdo, (int) $registration['group_id'], $actor);
        apiRequire($currentStatus === 'pending', 409, 'Đăng ký này đã được xử lý.');
        if ($status === 'approved') {
            apiRequire($topic['status'] === 'open', 409, 'Đề tài đã đóng đăng ký.');
            $statement = $pdo->prepare(
                "SELECT COUNT(*) FROM topic_registrations
                 WHERE group_id = ? AND status = 'approved' AND id <> ?"
            );
            $statement->execute([$registration['group_id'], $registrationId]);
            apiRequire((int) $statement->fetchColumn() === 0, 409, 'Nhóm đã được duyệt một đề tài khác.');
            $statement = $pdo->prepare(
                "SELECT COUNT(*) FROM topic_registrations
                 WHERE topic_id = ? AND status = 'approved'"
            );
            $statement->execute([$registration['topic_id']]);
            apiRequire((int) $statement->fetchColumn() < (int) $topic['max_groups'], 409, 'Đề tài đã đủ số nhóm đăng ký.');
        }
        $statement = $pdo->prepare(
            'UPDATE topic_registrations
             SET status = ?, note = COALESCE(?, note), reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
             WHERE id = ?'
        );
        $statement->execute([$status, $note, $actor['id'], $registrationId]);
        $pdo->commit();
        apiRespond(200, ['message' => $status === 'approved' ? 'Đã duyệt đăng ký đề tài.' : 'Đã từ chối đăng ký đề tài.']);
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

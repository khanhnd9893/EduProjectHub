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

/** Validate, trim, and limit a text field from the account request. */
function userText(array $body, string $field, int $maxLength, bool $required): ?string
{
    if (!array_key_exists($field, $body)) {
        apiRequire(!$required, 400, "$field không được để trống.");
        return null;
    }

    $value = $body[$field];
    if ($value === null && !$required) {
        return null;
    }
    apiRequire(is_string($value), 400, "$field phải là chuỗi.");
    $value = trim($value);
    apiRequire(!$required || $value !== '', 400, "$field không được để trống.");
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    apiRequire($length <= $maxLength, 400, "$field vượt quá giới hạn $maxLength ký tự.");
    return $value === '' ? null : $value;
}

/** Validate a role from the supported five account roles. */
function userRole($value): string
{
    $roles = ['admin', 'student', 'team_leader', 'lecturer', 'training_manager'];
    apiRequire(is_string($value) && in_array($value, $roles, true), 400, 'Vai trò tài khoản không hợp lệ.');
    return $value;
}

/** Validate a supported account status. */
function userStatus($value): string
{
    $statuses = ['active', 'locked', 'inactive'];
    apiRequire(is_string($value) && in_array($value, $statuses, true), 400, 'Trạng thái tài khoản không hợp lệ.');
    return $value;
}

/** Validate an email address and its database length. */
function userEmail(?string $value): string
{
    apiRequire(
        $value !== null
            && filter_var($value, FILTER_VALIDATE_EMAIL) !== false
            && strlen($value) <= 150,
        400,
        'Email không hợp lệ.'
    );
    return $value;
}

/** Validate the password supplied when creating or resetting an account. */
function userPassword($value): string
{
    apiRequire(is_string($value) && strlen($value) >= 8 && strlen($value) <= 255, 400, 'Mật khẩu phải có từ 8 đến 255 ký tự.');
    return $value;
}

/** Return public account columns only; never expose password hashes. */
function userPublicFields(): string
{
    return 'id, username, student_code, full_name, email, phone, department,
            role, account_status, last_login_at, created_at, updated_at';
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;
    $actor = apiRequireActor($pdo);
    apiRequireRole($actor, ['admin'], 'Chỉ quản trị viên mới được quản lý tài khoản.');
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'users' : '');

    if ($method === 'GET' && $action === 'users') {
        $query = $_GET['q'] ?? '';
        apiRequire(is_string($query), 400, 'Từ khóa tìm kiếm không hợp lệ.');
        $query = trim($query);
        $queryLength = function_exists('mb_strlen') ? mb_strlen($query, 'UTF-8') : strlen($query);
        apiRequire($queryLength <= 100, 400, 'Từ khóa tìm kiếm vượt quá giới hạn 100 ký tự.');
        $sql = 'SELECT ' . userPublicFields() . ' FROM users';
        $params = [];
        if ($query !== '') {
            $sql .= ' WHERE username LIKE ? OR student_code LIKE ?
                      OR full_name LIKE ? OR email LIKE ?';
            $pattern = '%' . $query . '%';
            $params = [$pattern, $pattern, $pattern, $pattern];
        }
        $sql .= ' ORDER BY id DESC';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'DELETE' && $action === 'delete') {
        apiRequireCsrf();
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        apiRequire($id !== false, 400, 'id phải là số nguyên dương.');
        apiRequire((int) $id !== (int) $actor['id'], 409, 'Không thể xóa tài khoản đang đăng nhập.');

        $pdo->beginTransaction();
        $statement = $pdo->prepare(
            'SELECT id, role, account_status FROM users WHERE id = ? FOR UPDATE'
        );
        $statement->execute([(int) $id]);
        $existing = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($existing !== false, 404, 'Không tìm thấy tài khoản.');

        if ($existing['role'] === 'admin' && $existing['account_status'] === 'active') {
            $activeAdmins = $pdo->query(
                "SELECT id FROM users WHERE role = 'admin' AND account_status = 'active' FOR UPDATE"
            )->fetchAll(PDO::FETCH_COLUMN);
            apiRequire(count($activeAdmins) > 1, 409, 'Không thể xóa quản trị viên đang hoạt động cuối cùng.');
        }

        $references = $pdo->query(
            "SELECT TABLE_NAME, COLUMN_NAME
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE()
               AND REFERENCED_TABLE_SCHEMA = DATABASE()
               AND REFERENCED_TABLE_NAME = 'users'
               AND REFERENCED_COLUMN_NAME = 'id'
             ORDER BY TABLE_NAME, COLUMN_NAME"
        )->fetchAll(PDO::FETCH_ASSOC);
        $linkedRecords = [];
        foreach ($references as $reference) {
            $table = (string) $reference['TABLE_NAME'];
            $column = (string) $reference['COLUMN_NAME'];
            apiRequire(
                preg_match('/^[A-Za-z0-9_]+$/D', $table) === 1
                    && preg_match('/^[A-Za-z0-9_]+$/D', $column) === 1,
                500,
                'Không thể xác minh các liên kết dữ liệu của tài khoản.'
            );
            $countStatement = $pdo->prepare(
                "SELECT COUNT(*) FROM `$table` WHERE `$column` = ?"
            );
            $countStatement->execute([(int) $id]);
            $count = (int) $countStatement->fetchColumn();
            if ($count > 0) {
                $linkedRecords[$table] = ($linkedRecords[$table] ?? 0) + $count;
            }
        }

        if ($linkedRecords !== []) {
            $labels = [
                'student_groups' => 'nhóm đồ án',
                'group_members' => 'thành viên nhóm',
                'group_invitations' => 'lời mời nhóm',
                'group_requests' => 'yêu cầu tham gia nhóm',
                'group_lecturers' => 'phân công giảng viên',
                'tasks' => 'nhiệm vụ',
                'reports' => 'báo cáo đồ án',
                'report_versions' => 'phiên bản báo cáo',
                'report_feedback' => 'phản hồi báo cáo',
                'defense_council_members' => 'thành viên hội đồng',
                'defense_scores' => 'điểm bảo vệ',
                'final_grades' => 'điểm tổng kết',
                'chatbot_faqs' => 'FAQ chatbot',
                'chat_sessions' => 'hội thoại chatbot',
                'project_topics' => 'đề tài đồ án',
                'topic_registrations' => 'đăng ký đề tài',
                'notifications' => 'thông báo',
            ];
            $descriptions = [];
            foreach ($linkedRecords as $table => $count) {
                $descriptions[] = ($labels[$table] ?? $table) . " ($count)";
            }
            apiRequire(
                false,
                409,
                'Không thể xóa tài khoản vì còn dữ liệu liên quan: '
                    . implode(', ', $descriptions)
                    . '. Hãy chuyển quyền hoặc xử lý các liên kết trước.'
            );
        }

        $statement = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $statement->execute([(int) $id]);
        $pdo->commit();
        apiRespond(200, ['data' => ['id' => (int) $id]]);
    }

    if ($method === 'POST' && $action === 'create') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        $username = userText($body, 'username', 50, true);
        apiRequire(strlen((string) $username) >= 3, 400, 'Tên đăng nhập phải có ít nhất 3 ký tự.');
        $studentCode = userText($body, 'student_code', 30, false);
        $fullName = userText($body, 'full_name', 150, true);
        $email = userEmail(userText($body, 'email', 150, true));
        $phone = userText($body, 'phone', 15, false);
        $department = userText($body, 'department', 100, false);
        $role = userRole($body['role'] ?? 'student');
        $status = userStatus($body['account_status'] ?? 'active');
        $passwordHash = password_hash(userPassword($body['password'] ?? null), PASSWORD_DEFAULT);
        apiRequire(is_string($passwordHash), 500, 'Không thể tạo mật khẩu cho tài khoản.');
        apiRequire(
            !in_array($role, ['student', 'team_leader'], true) || $studentCode !== null,
            400,
            'Sinh viên cần có mã sinh viên.'
        );

        $statement = $pdo->prepare(
            'INSERT INTO users
                (username, student_code, full_name, email, phone, department,
                 password_hash, role, account_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([
            $username,
            $studentCode,
            $fullName,
            $email,
            $phone,
            $department,
            $passwordHash,
            $role,
            $status,
        ]);
        $id = (int) $pdo->lastInsertId();
        $statement = $pdo->prepare('SELECT ' . userPublicFields() . ' FROM users WHERE id = ?');
        $statement->execute([$id]);
        apiRespond(201, ['data' => $statement->fetch(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'PATCH' && $action === 'update') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        apiRequire($id !== false, 400, 'id phải là số nguyên dương.');

        $pdo->beginTransaction();
        $statement = $pdo->prepare('SELECT id, role, account_status, student_code FROM users WHERE id = ? FOR UPDATE');
        $statement->execute([(int) $id]);
        $existing = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($existing !== false, 404, 'Không tìm thấy tài khoản.');

        $updates = [];
        $values = [];
        foreach ([
            'username' => ['username', 50, true],
            'student_code' => ['student_code', 30, false],
            'full_name' => ['full_name', 150, true],
            'email' => ['email', 150, true],
            'phone' => ['phone', 15, false],
            'department' => ['department', 100, false],
        ] as $field => [$column, $maxLength, $required]) {
            if (!array_key_exists($field, $body)) {
                continue;
            }
            $value = userText($body, $field, $maxLength, $required);
            if ($field === 'username') {
                apiRequire(strlen((string) $value) >= 3, 400, 'Tên đăng nhập phải có ít nhất 3 ký tự.');
            }
            if ($field === 'email') {
                $value = userEmail($value);
            }
            $updates[] = "$column = ?";
            $values[] = $value;
        }

        $role = array_key_exists('role', $body) ? userRole($body['role']) : $existing['role'];
        $status = array_key_exists('account_status', $body)
            ? userStatus($body['account_status'])
            : $existing['account_status'];
        $studentCode = array_key_exists('student_code', $body)
            ? userText($body, 'student_code', 30, false)
            : $existing['student_code'];
        apiRequire(
            !in_array($role, ['student', 'team_leader'], true) || $studentCode !== null,
            400,
            'Sinh viên cần có mã sinh viên.'
        );

        if (array_key_exists('role', $body)) {
            $updates[] = 'role = ?';
            $values[] = $role;
        }
        if (array_key_exists('account_status', $body)) {
            $updates[] = 'account_status = ?';
            $values[] = $status;
        }
        if (isset($body['password']) && $body['password'] !== '') {
            $passwordHash = password_hash(userPassword($body['password']), PASSWORD_DEFAULT);
            apiRequire(is_string($passwordHash), 500, 'Không thể cập nhật mật khẩu.');
            $updates[] = 'password_hash = ?';
            $values[] = $passwordHash;
        }

        if ((int) $id === (int) $actor['id']) {
            apiRequire(
                $role === 'admin' && $status === 'active',
                409,
                'Không thể tự hạ quyền hoặc khóa tài khoản quản trị viên đang đăng nhập.'
            );
        }
        if (
            $existing['role'] === 'admin'
            && $existing['account_status'] === 'active'
            && ($role !== 'admin' || $status !== 'active')
        ) {
            $activeAdmins = $pdo->query(
                "SELECT id FROM users WHERE role = 'admin' AND account_status = 'active' FOR UPDATE"
            )->fetchAll(PDO::FETCH_COLUMN);
            apiRequire(count($activeAdmins) > 1, 409, 'Không thể vô hiệu hóa quản trị viên đang hoạt động cuối cùng.');
        }

        apiRequire($updates !== [], 400, 'Không có thông tin nào để cập nhật.');
        $values[] = (int) $id;
        $statement = $pdo->prepare('UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $statement->execute($values);
        $pdo->commit();

        $statement = $pdo->prepare('SELECT ' . userPublicFields() . ' FROM users WHERE id = ?');
        $statement->execute([(int) $id]);
        apiRespond(200, ['data' => $statement->fetch(PDO::FETCH_ASSOC)]);
    }

    apiRespond(404, ['error' => 'Không tìm thấy thao tác API.']);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (($exception->errorInfo[1] ?? null) === 1062) {
        apiRespond(409, ['error' => 'Tên đăng nhập, email hoặc mã sinh viên đã được sử dụng.']);
    }
    if (($exception->errorInfo[1] ?? null) === 1451) {
        apiRespond(409, ['error' => 'Không thể xóa tài khoản vì dữ liệu liên quan vừa được tạo. Hãy xử lý các liên kết trước.']);
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

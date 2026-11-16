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

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? '';

    // 1. Đăng nhập hệ thống
    if ($method === 'POST' && $action === 'login') {
        $body = apiReadJsonBody();
        $username = $body['username'] ?? null;
        $password = $body['password'] ?? null;
        apiRequire(is_string($username) && trim($username) !== '', 400, 'Vui lòng nhập tài khoản.');
        apiRequire(is_string($password) && $password !== '', 400, 'Vui lòng nhập mật khẩu.');

        $statement = $pdo->prepare(
            "SELECT id, username, full_name, role, password_hash
             FROM users
             WHERE username = ? AND account_status = 'active'"
        );
        $statement->execute([trim($username)]);
        $user = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire(
            $user !== false && password_verify($password, $user['password_hash']),
            401,
            'Tài khoản hoặc mật khẩu không chính xác.'
        );

        $statement = $pdo->prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?');
        $statement->execute([(int) $user['id']]);
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        apiRespond(200, [
            'data' => [
                'user' => [
                    'id' => (int) $user['id'],
                    'username' => $user['username'],
                    'fullName' => $user['full_name'],
                    'role' => strtoupper($user['role']),
                ],
            ],
        ]);
    }

    // 2. Thông tin tài khoản đăng nhập rút gọn (me)
    if ($method === 'GET' && $action === 'me') {
        $actor = apiRequireActor($pdo);
        apiRespond(200, [
            'data' => [
                'id' => $actor['id'],
                'username' => $actor['username'],
                'fullName' => $actor['full_name'],
                'role' => strtoupper($actor['role']),
            ],
        ]);
    }

    // 3. Chi tiết hồ sơ cá nhân (profile)
    if ($method === 'GET' && $action === 'profile') {
        $actor = apiRequireActor($pdo);
        $statement = $pdo->prepare(
            'SELECT id, username, student_code, full_name, email, phone, department, avatar_url,
                    role, account_status, last_login_at, created_at, updated_at
             FROM users WHERE id = ?'
        );
        $statement->execute([$actor['id']]);
        $user = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($user !== false, 404, 'Không tìm thấy thông tin tài khoản.');

        apiRespond(200, [
            'data' => [
                'id' => (int) $user['id'],
                'username' => $user['username'],
                'studentCode' => $user['student_code'] ?? '',
                'student_code' => $user['student_code'] ?? '',
                'fullName' => $user['full_name'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'phone' => $user['phone'] ?? '',
                'department' => $user['department'] ?? '',
                'avatarUrl' => $user['avatar_url'] ?? '',
                'avatar_url' => $user['avatar_url'] ?? '',
                'role' => strtoupper($user['role']),
                'accountStatus' => $user['account_status'],
                'lastLoginAt' => $user['last_login_at'],
                'createdAt' => $user['created_at'],
                'updatedAt' => $user['updated_at'],
            ],
        ]);
    }

    // 4. Cập nhật hồ sơ cá nhân (profile)
    if ($method === 'PATCH' && $action === 'profile') {
        $actor = apiRequireActor($pdo);
        $body = apiReadJsonBody();
        apiRequireCsrf($body);

        // Họ tên (bắt buộc)
        $fullName = $body['fullName'] ?? ($body['full_name'] ?? null);
        apiRequire(is_string($fullName) && trim($fullName) !== '', 400, 'Họ và tên là bắt buộc.');
        $fullName = trim($fullName);
        apiRequire(mb_strlen($fullName, 'UTF-8') <= 150, 400, 'Họ và tên không được vượt quá 150 ký tự.');

        // Email (bắt buộc, hợp lệ)
        $email = $body['email'] ?? null;
        apiRequire(
            is_string($email)
                && filter_var(trim($email), FILTER_VALIDATE_EMAIL) !== false
                && strlen(trim($email)) <= 150,
            400,
            'Vui lòng nhập email hợp lệ.'
        );
        $email = trim($email);

        // Kiểm tra trùng email với tài khoản khác
        $statement = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
        $statement->execute([$email, $actor['id']]);
        apiRequire($statement->fetchColumn() === false, 409, 'Email này đã được sử dụng bởi tài khoản khác.');

        // Số điện thoại (tùy chọn)
        $phone = $body['phone'] ?? null;
        if ($phone !== null && is_string($phone) && trim($phone) !== '') {
            $phone = trim($phone);
            apiRequire(
                preg_match('/^[0-9+()\s-]{8,15}$/', $phone) === 1,
                400,
                'Số điện thoại không hợp lệ (từ 8 đến 15 ký tự số).'
            );
        } else {
            $phone = null;
        }

        // Khoa / đơn vị (tùy chọn)
        $department = $body['department'] ?? null;
        if ($department !== null && is_string($department) && trim($department) !== '') {
            $department = trim($department);
            apiRequire(mb_strlen($department, 'UTF-8') <= 100, 400, 'Khoa / đơn vị không được vượt quá 100 ký tự.');
        } else {
            $department = null;
        }

        // Avatar URL (tùy chọn)
        $avatarUrl = $body['avatarUrl'] ?? ($body['avatar_url'] ?? null);
        if ($avatarUrl !== null && is_string($avatarUrl) && trim($avatarUrl) !== '') {
            $avatarUrl = trim($avatarUrl);
            apiRequire(strlen($avatarUrl) <= 255, 400, 'Đường dẫn ảnh đại diện không được vượt quá 255 ký tự.');
        } else {
            $avatarUrl = null;
        }

        // LƯU Ý BẢO MẬT: Tuyệt đối không cho phép người dùng tự sửa role, account_status, username, password_hash
        $statement = $pdo->prepare(
            'UPDATE users
             SET full_name = ?, email = ?, phone = ?, department = ?, avatar_url = ?
             WHERE id = ?'
        );
        $statement->execute([$fullName, $email, $phone, $department, $avatarUrl, $actor['id']]);

        // Lấy lại hồ sơ đã cập nhật
        $statement = $pdo->prepare(
            'SELECT id, username, student_code, full_name, email, phone, department, avatar_url,
                    role, account_status, last_login_at, created_at, updated_at
             FROM users WHERE id = ?'
        );
        $statement->execute([$actor['id']]);
        $updatedUser = $statement->fetch(PDO::FETCH_ASSOC);

        apiRespond(200, [
            'data' => [
                'id' => (int) $updatedUser['id'],
                'username' => $updatedUser['username'],
                'studentCode' => $updatedUser['student_code'] ?? '',
                'student_code' => $updatedUser['student_code'] ?? '',
                'fullName' => $updatedUser['full_name'],
                'full_name' => $updatedUser['full_name'],
                'email' => $updatedUser['email'],
                'phone' => $updatedUser['phone'] ?? '',
                'department' => $updatedUser['department'] ?? '',
                'avatarUrl' => $updatedUser['avatar_url'] ?? '',
                'avatar_url' => $updatedUser['avatar_url'] ?? '',
                'role' => strtoupper($updatedUser['role']),
                'accountStatus' => $updatedUser['account_status'],
                'lastLoginAt' => $updatedUser['last_login_at'],
                'createdAt' => $updatedUser['created_at'],
                'updatedAt' => $updatedUser['updated_at'],
            ],
            'message' => 'Cập nhật hồ sơ thành công.',
        ]);
    }

    // 5. Đổi mật khẩu
    if (in_array($method, ['POST', 'PATCH'], true) && in_array($action, ['change_password', 'change-password'], true)) {
        $actor = apiRequireActor($pdo);
        $body = apiReadJsonBody();
        apiRequireCsrf($body);

        $currentPassword = $body['current_password'] ?? ($body['currentPassword'] ?? ($body['old_password'] ?? ($body['oldPassword'] ?? null)));
        $newPassword = $body['new_password'] ?? ($body['newPassword'] ?? null);
        $confirmPassword = $body['confirm_password'] ?? ($body['confirmPassword'] ?? null);

        apiRequire(is_string($currentPassword) && $currentPassword !== '', 400, 'Vui lòng nhập mật khẩu hiện tại.');
        apiRequire(is_string($newPassword) && strlen($newPassword) >= 6 && strlen($newPassword) <= 255, 400, 'Mật khẩu mới phải có từ 6 đến 255 ký tự.');

        if ($confirmPassword !== null && is_string($confirmPassword)) {
            apiRequire($newPassword === $confirmPassword, 400, 'Mật khẩu xác nhận không khớp.');
        }

        // Kiểm tra mật khẩu hiện tại trong CSDL
        $statement = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
        $statement->execute([$actor['id']]);
        $currentHash = $statement->fetchColumn();
        apiRequire(
            $currentHash !== false && password_verify($currentPassword, (string) $currentHash),
            400,
            'Mật khẩu hiện tại không chính xác.'
        );

        // Băm mật khẩu mới và lưu
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $statement = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $statement->execute([$newHash, $actor['id']]);

        apiRespond(200, ['message' => 'Đổi mật khẩu thành công.']);
    }

    // 6. Đăng xuất
    if ($method === 'POST' && $action === 'logout') {
        $body = apiReadJsonBody();
        apiRequireActor($pdo);
        apiRequireCsrf($body);
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        apiRespond(200, ['message' => 'Đăng xuất thành công.']);
    }

    apiRespond(404, ['error' => 'Không tìm thấy thao tác API.']);
} catch (PDOException $exception) {
    if (($exception->errorInfo[1] ?? null) === 1062) {
        apiRespond(409, ['error' => 'Email này đã được sử dụng bởi tài khoản khác.']);
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (RuntimeException $exception) {
    apiRespond($exception->getCode() >= 400 && $exception->getCode() <= 599 ? $exception->getCode() : 400, [
        'error' => $exception->getMessage(),
    ]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

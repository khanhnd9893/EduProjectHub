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

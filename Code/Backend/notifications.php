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
    $actor = apiRequireActor($pdo);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'notifications' : '');

    if ($method === 'GET' && $action === 'notifications') {
        $limit = filter_var($_GET['limit'] ?? 50, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]);
        apiRequire($limit !== false, 400, 'limit phải từ 1 đến 100.');
        $statement = $pdo->prepare(
            'SELECT id, type, title, body, entity_type, entity_id, actor_user_id, is_read, created_at
             FROM notifications WHERE user_id = ?
             ORDER BY created_at DESC, id DESC LIMIT ?'
        );
        $statement->bindValue(1, (int) $actor['id'], PDO::PARAM_INT);
        $statement->bindValue(2, (int) $limit, PDO::PARAM_INT);
        $statement->execute();
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'PATCH' && $action === 'read') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        apiRequire($id !== false, 400, 'id phải là số nguyên dương.');
        $statement = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
        $statement->execute([(int) $id, (int) $actor['id']]);
        apiRequire($statement->rowCount() === 1, 404, 'Không tìm thấy thông báo chưa đọc.');
        apiRespond(200, ['message' => 'Đã đánh dấu thông báo đã đọc.']);
    }

    if ($method === 'PATCH' && $action === 'read_all') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        $statement = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
        $statement->execute([(int) $actor['id']]);
        apiRespond(200, ['data' => ['updated' => $statement->rowCount()]]);
    }

    apiRespond(404, ['error' => 'Không tìm thấy thao tác API.']);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (RuntimeException $exception) {
    $status = $exception->getCode();
    apiRespond($status >= 400 && $status <= 599 ? $status : 400, ['error' => $exception->getMessage()]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

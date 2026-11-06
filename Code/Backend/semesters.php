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
    apiRequireActor($pdo);
    apiRequire(strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET', 405, 'API học kỳ chỉ hỗ trợ GET.');
    apiRequire(($_GET['action'] ?? 'semesters') === 'semesters', 404, 'Không tìm thấy thao tác API.');

    $statement = $pdo->query(
        'SELECT id, round_code, round_name, semester, academic_year,
                start_date, end_date, min_members, max_members, status
         FROM project_rounds
         ORDER BY start_date DESC, id DESC'
    );
    apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
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

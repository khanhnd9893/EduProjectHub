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

/** Validate a round date in YYYY-MM-DD format. */
function semesterDate($value, string $field): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    apiRequire(is_string($value), 400, "$field phải là ngày hợp lệ.");
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    apiRequire(
        $date !== false && $date->format('Y-m-d') === $value,
        400,
        "$field phải có định dạng YYYY-MM-DD."
    );
    return $value;
}

/** Validate and normalize all editable project-round fields. */
function semesterValues(array $body): array
{
    $textFields = [
        'round_code' => ['roundCode', 30, true],
        'round_name' => ['roundName', 150, true],
        'semester' => ['semester', 50, false],
        'academic_year' => ['academicYear', 20, false],
    ];
    $values = [];
    foreach ($textFields as $column => [$field, $maxLength, $required]) {
        $value = $body[$column] ?? null;
        apiRequire($value === null || is_string($value), 400, "$field phải là chuỗi.");
        $value = $value === null ? '' : trim($value);
        apiRequire(!$required || $value !== '', 400, "$field không được để trống.");
        apiRequire(mb_strlen($value, 'UTF-8') <= $maxLength, 400, "$field vượt quá giới hạn $maxLength ký tự.");
        $values[$column] = $value === '' ? null : $value;
    }

    $values['start_date'] = semesterDate($body['start_date'] ?? null, 'startDate');
    $values['end_date'] = semesterDate($body['end_date'] ?? null, 'endDate');
    apiRequire(
        $values['start_date'] === null
            || $values['end_date'] === null
            || $values['end_date'] >= $values['start_date'],
        400,
        'Ngày kết thúc phải từ ngày bắt đầu trở đi.'
    );

    $minMembers = filter_var(
        $body['min_members'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 255]]
    );
    $maxMembers = filter_var(
        $body['max_members'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 255]]
    );
    apiRequire($minMembers !== false, 400, 'minMembers phải nằm trong khoảng 1 đến 255.');
    apiRequire($maxMembers !== false && $maxMembers >= $minMembers, 400, 'maxMembers phải lớn hơn hoặc bằng minMembers.');
    $values['min_members'] = (int) $minMembers;
    $values['max_members'] = (int) $maxMembers;

    $status = $body['status'] ?? null;
    apiRequire(in_array($status, ['draft', 'open', 'in_progress', 'closed'], true), 400, 'Trạng thái đợt đồ án không hợp lệ.');
    $values['status'] = $status;
    return $values;
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;
    $actor = apiRequireActor($pdo);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'semesters' : '');

    if ($method === 'GET' && $action === 'semesters') {
        $sql = 'SELECT id, round_code, round_name, semester, academic_year,
                       start_date, end_date, min_members, max_members, status
                FROM project_rounds';
        if (!apiCanViewAllData($actor) && $actor['role'] !== 'lecturer') {
            $sql .= " WHERE status IN ('open', 'in_progress')";
        }
        $sql .= ' ORDER BY start_date DESC, id DESC';
        $statement = $pdo->query($sql);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'POST' && $action === 'create') {
        apiRequire(apiIsTrainingManager($actor), 403, 'Chỉ người đào tạo mới được tạo đợt đồ án.');
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        $values = semesterValues($body);
        $statement = $pdo->prepare(
            'INSERT INTO project_rounds
                (round_code, round_name, semester, academic_year, start_date, end_date,
                 min_members, max_members, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute(array_values($values));
        $id = (int) $pdo->lastInsertId();
        $statement = $pdo->prepare(
            'SELECT id, round_code, round_name, semester, academic_year,
                    start_date, end_date, min_members, max_members, status
             FROM project_rounds WHERE id = ?'
        );
        $statement->execute([$id]);
        apiRespond(201, ['data' => $statement->fetch(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'PATCH' && $action === 'update') {
        apiRequire(apiIsTrainingManager($actor), 403, 'Chỉ người đào tạo mới được cập nhật đợt đồ án.');
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        apiRequire($id !== false, 400, 'id phải là số nguyên dương.');
        $statement = $pdo->prepare('SELECT 1 FROM project_rounds WHERE id = ?');
        $statement->execute([(int) $id]);
        apiRequire($statement->fetchColumn() !== false, 404, 'Không tìm thấy đợt đồ án.');
        $values = semesterValues($body);
        $statement = $pdo->prepare(
            'UPDATE project_rounds
             SET round_code = ?, round_name = ?, semester = ?, academic_year = ?,
                 start_date = ?, end_date = ?, min_members = ?, max_members = ?, status = ?
             WHERE id = ?'
        );
        $statement->execute([...array_values($values), (int) $id]);
        $statement = $pdo->prepare(
            'SELECT id, round_code, round_name, semester, academic_year,
                    start_date, end_date, min_members, max_members, status
             FROM project_rounds WHERE id = ?'
        );
        $statement->execute([(int) $id]);
        apiRespond(200, ['data' => $statement->fetch(PDO::FETCH_ASSOC)]);
    }

    apiRespond(404, ['error' => 'Không tìm thấy thao tác API.']);
} catch (PDOException $exception) {
    if (($exception->errorInfo[1] ?? null) === 1062) {
        apiRespond(409, ['error' => 'Mã đợt đồ án đã được sử dụng.']);
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (RuntimeException $exception) {
    $status = $exception->getCode();
    apiRespond($status >= 400 && $status <= 599 ? $status : 400, ['error' => $exception->getMessage()]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

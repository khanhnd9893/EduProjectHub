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

/** Kiểm tra và chuyển giá trị thành ID báo cáo nguyên dương. */
function reportId($value, string $field = 'report_id'): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    apiRequire($id !== false, 400, "$field phải là số nguyên dương.");
    return (int) $id;
}

/** Chuẩn hóa chuỗi văn bản của đợt báo cáo; trả null nếu trường tùy chọn để trống. */
function reportText(array $body, string $field, int $maxLength, bool $required): ?string
{
    $value = $body[$field] ?? null;
    if (!$required && $value === null) {
        return null;
    }
    apiRequire(is_string($value), 400, "$field phải là chuỗi.");
    $value = trim($value);
    apiRequire(!$required || $value !== '', 400, "$field không được để trống.");
    apiRequire(mb_strlen($value, 'UTF-8') <= $maxLength, 400, "$field vượt quá giới hạn $maxLength ký tự.");
    return $value === '' ? null : $value;
}

/** Chuẩn hóa hạn nộp sang định dạng DATETIME; null nghĩa là không có hạn. */
function reportDeadline($value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    apiRequire(
        is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/', $value) === 1,
        400,
        'deadline phải có dạng YYYY-MM-DD HH:MM.'
    );
    $normalized = str_replace('T', ' ', $value);
    if (strlen($normalized) === 16) {
        $normalized .= ':00';
    }
    $date = DateTime::createFromFormat('Y-m-d H:i:s', $normalized);
    $errors = DateTime::getLastErrors();
    apiRequire(
        $date !== false && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0)),
        400,
        'deadline không phải ngày giờ hợp lệ.'
    );
    return $date->format('Y-m-d H:i:s');
}

/** Chỉ người đào tạo được tạo hoặc chỉnh sửa đợt báo cáo. */
function reportRequireManager(array $actor): void
{
    apiRequireRole(
        $actor,
        ['training_manager'],
        'Chỉ người đào tạo mới được quản lý đợt báo cáo.'
    );
}

/** Xác thực quyền truy cập báo cáo dựa trên quyền truy cập nhóm. */
function reportCanAccess(PDO $pdo, int $groupId, array $actor): array
{
    return apiRequireGroupAccess($pdo, $groupId, $actor);
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;
    $actor = apiRequireActor($pdo);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'reports' : '');

    if ($method === 'GET' && $action === 'reports') {
        $sql = 'SELECT r.id, r.group_id, g.group_name, r.title, r.report_type,
                       r.description, r.deadline, r.status, r.created_by,
                       r.created_at, r.updated_at
                FROM reports r
                JOIN student_groups g ON g.id = r.group_id';
        $params = [];
        if (apiIsStudentRole($actor)) {
            $sql .= " WHERE (g.leader_user_id = ? OR EXISTS (
                SELECT 1 FROM group_members gm
                WHERE gm.group_id = g.id AND gm.user_id = ? AND gm.status = 'active'
            ))";
            $params = [$actor['id'], $actor['id']];
        } elseif ($actor['role'] === 'lecturer') {
            $sql .= ' WHERE EXISTS (
                SELECT 1 FROM group_lecturers gl
                WHERE gl.group_id = g.id AND gl.lecturer_user_id = ?
                  AND (SELECT COUNT(*) FROM group_lecturers workload
                       WHERE workload.lecturer_user_id = gl.lecturer_user_id) >= 2
            )';
            $params = [$actor['id']];
        }
        if (isset($_GET['group_id'])) {
            $groupId = reportId($_GET['group_id']);
            $sql .= $params === [] ? ' WHERE r.group_id = ?' : ' AND r.group_id = ?';
            $params[] = $groupId;
        }
        $sql .= ' ORDER BY r.deadline IS NULL, r.deadline, r.id DESC';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'GET' && $action === 'report') {
        $id = reportId($_GET['id'] ?? null);
        $statement = $pdo->prepare(
            'SELECT r.*, g.group_name
             FROM reports r JOIN student_groups g ON g.id = r.group_id
             WHERE r.id = ?'
        );
        $statement->execute([$id]);
        $report = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($report !== false, 404, 'Không tìm thấy đợt báo cáo.');
        reportCanAccess($pdo, (int) $report['group_id'], $actor);

        $statement = $pdo->prepare(
            'SELECT rv.id, rv.report_id, rv.version_no, rv.submitted_by,
                    submitter.full_name AS submitted_by_name, rv.original_filename,
                    rv.stored_filename, rv.mime_type, rv.file_size, rv.note, rv.submitted_at
             FROM report_versions rv
             JOIN users submitter ON submitter.id = rv.submitted_by
             WHERE rv.report_id = ?
             ORDER BY rv.version_no DESC'
        );
        $statement->execute([$id]);
        $versions = $statement->fetchAll(PDO::FETCH_ASSOC);
        $feedbackQuery = $pdo->prepare(
            'SELECT rf.id, rf.report_version_id, rf.lecturer_user_id,
                    lecturer.full_name AS lecturer_name, rf.content, rf.score, rf.created_at
             FROM report_feedback rf
             JOIN users lecturer ON lecturer.id = rf.lecturer_user_id
             WHERE rf.report_version_id = ?
             ORDER BY rf.created_at DESC'
        );
        foreach ($versions as &$version) {
            $version['feedback'] = [];
            $feedbackQuery->execute([(int) $version['id']]);
            $version['feedback'] = $feedbackQuery->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($version);
        $report['versions'] = $versions;
        apiRespond(200, ['data' => $report]);
    }

    if ($method === 'POST' && $action === 'submit') {
        apiRequireCsrf();
        apiRequire(apiIsStudentRole($actor), 403, 'Chỉ sinh viên mới được nộp báo cáo.');
        $id = reportId($_POST['report_id'] ?? null);
        apiRequire(isset($_FILES['file']) && is_array($_FILES['file']), 400, 'Vui lòng chọn tệp báo cáo.');
        $file = $_FILES['file'];
        apiRequire($file['error'] === UPLOAD_ERR_OK, 400, 'Không thể nhận tệp tải lên.');
        apiRequire($file['size'] > 0 && $file['size'] <= 10 * 1024 * 1024, 400, 'Tệp phải có dung lượng tối đa 10 MB.');

        $statement = $pdo->prepare(
            'SELECT *, (deadline IS NULL OR deadline >= CURRENT_TIMESTAMP) AS deadline_open
             FROM reports WHERE id = ?'
        );
        $statement->execute([$id]);
        $report = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($report !== false, 404, 'Không tìm thấy đợt báo cáo.');
        reportCanAccess($pdo, (int) $report['group_id'], $actor);
        apiRequire(
            $report['status'] === 'open' && (bool) $report['deadline_open'],
            409,
            'Đợt báo cáo đã đóng hoặc quá hạn.'
        );

        $membership = $pdo->prepare(
            "SELECT 1 FROM group_members
             WHERE group_id = ? AND user_id = ? AND status = 'active'"
        );
        $membership->execute([(int) $report['group_id'], $actor['id']]);
        apiRequire($membership->fetchColumn() !== false, 403, 'Bạn không phải thành viên đang hoạt động của nhóm.');

        $originalName = basename((string) $file['name']);
        $originalName = preg_replace('/[\x00-\x1F\x7F]/u', '', $originalName) ?? '';
        apiRequire($originalName !== '', 400, 'Tên tệp không hợp lệ.');
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $allowedTypes = [
            'pdf' => ['application/pdf'],
            'doc' => ['application/msword', 'application/x-ole-storage'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        ];
        apiRequire(isset($allowedTypes[$extension]), 400, 'Chỉ chấp nhận tệp PDF, DOC hoặc DOCX.');
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        apiRequire(
            is_string($mimeType) && in_array($mimeType, $allowedTypes[$extension], true),
            400,
            'Định dạng nội dung tệp không khớp với phần mở rộng.'
        );

        $storage = __DIR__ . '/storage/reports';
        if (!is_dir($storage) && !mkdir($storage, 0750, true) && !is_dir($storage)) {
            throw new RuntimeException('Không thể tạo thư mục lưu báo cáo.', 500);
        }
        // Thư mục nằm trong web root nên phải chặn tải trực tiếp và liệt kê tệp qua Apache.
        $guard = __DIR__ . '/storage/.htaccess';
        if (!is_file($guard)) {
            file_put_contents($guard, "Require all denied\n");
        }
        $storedName = bin2hex(random_bytes(24)) . '.' . $extension;
        $destination = $storage . DIRECTORY_SEPARATOR . $storedName;

        $pdo->beginTransaction();
        $lock = $pdo->prepare(
            'SELECT id, status, (deadline IS NULL OR deadline >= CURRENT_TIMESTAMP) AS deadline_open
             FROM reports WHERE id = ? FOR UPDATE'
        );
        $lock->execute([$id]);
        $lockedReport = $lock->fetch(PDO::FETCH_ASSOC);
        apiRequire(
            $lockedReport !== false
                && $lockedReport['status'] === 'open'
                && (bool) $lockedReport['deadline_open'],
            409,
            'Đợt báo cáo đã đóng hoặc quá hạn.'
        );
        $versionQuery = $pdo->prepare('SELECT COALESCE(MAX(version_no), 0) + 1 FROM report_versions WHERE report_id = ?');
        $versionQuery->execute([$id]);
        $versionNo = (int) $versionQuery->fetchColumn();

        apiRequire(move_uploaded_file($file['tmp_name'], $destination), 500, 'Không thể lưu tệp báo cáo.');
        $note = $_POST['note'] ?? null;
        apiRequire($note === null || is_string($note), 400, 'Ghi chú không hợp lệ.');
        $note = $note === null ? null : trim($note);
        apiRequire(
            $note === null
                || (mb_strlen($note, 'UTF-8') <= 1000 && strlen($note) <= 65535),
            400,
            'Ghi chú không được vượt quá 1000 ký tự.'
        );
        $insert = $pdo->prepare(
            'INSERT INTO report_versions
                (report_id, version_no, submitted_by, original_filename, stored_filename, mime_type, file_size, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $insert->execute([
            $id,
            $versionNo,
            $actor['id'],
            mb_substr($originalName, 0, 255, 'UTF-8'),
            $storedName,
            $mimeType,
            (int) $file['size'],
            $note,
        ]);
        $versionId = (int) $pdo->lastInsertId();
        $pdo->commit();
        apiRespond(201, ['data' => ['id' => $versionId, 'report_id' => $id, 'version_no' => $versionNo]]);
    }

    if ($method === 'POST' && $action === 'create') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        reportRequireManager($actor);
        $groupId = reportId($body['group_id'] ?? null, 'group_id');
        $group = reportCanAccess($pdo, $groupId, $actor);
        apiRequire($group['status'] !== 'dissolved', 409, 'Nhóm đã giải thể, không thể tạo đợt báo cáo.');
        $title = reportText($body, 'title', 255, true);
        $reportType = $body['report_type'] ?? 'other';
        apiRequire(
            in_array($reportType, ['weekly', 'midterm', 'final', 'other'], true),
            400,
            'Loại báo cáo không hợp lệ.'
        );
        $description = reportText($body, 'description', 5000, false);
        $deadline = reportDeadline($body['deadline'] ?? null);
        $status = $body['status'] ?? 'open';
        apiRequire(in_array($status, ['open', 'closed'], true), 400, 'Trạng thái ban đầu chỉ có thể là open hoặc closed.');
        $statement = $pdo->prepare(
            'INSERT INTO reports (group_id, title, report_type, description, deadline, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([$groupId, $title, $reportType, $description, $deadline, $status, $actor['id']]);
        apiRespond(201, ['data' => ['id' => (int) $pdo->lastInsertId()]]);
    }

    if ($method === 'PATCH' && $action === 'update') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        reportRequireManager($actor);
        $id = reportId($body['id'] ?? null);
        $statement = $pdo->prepare('SELECT group_id FROM reports WHERE id = ?');
        $statement->execute([$id]);
        $groupId = $statement->fetchColumn();
        apiRequire($groupId !== false, 404, 'Không tìm thấy đợt báo cáo.');
        reportCanAccess($pdo, (int) $groupId, $actor);

        $updates = [];
        $params = [];
        if (array_key_exists('title', $body)) {
            $updates[] = 'title = ?';
            $params[] = reportText($body, 'title', 255, true);
        }
        if (array_key_exists('report_type', $body)) {
            apiRequire(
                in_array($body['report_type'], ['weekly', 'midterm', 'final', 'other'], true),
                400,
                'Loại báo cáo không hợp lệ.'
            );
            $updates[] = 'report_type = ?';
            $params[] = $body['report_type'];
        }
        if (array_key_exists('description', $body)) {
            $updates[] = 'description = ?';
            $params[] = reportText($body, 'description', 5000, false);
        }
        if (array_key_exists('deadline', $body)) {
            $updates[] = 'deadline = ?';
            $params[] = reportDeadline($body['deadline']);
        }
        if (array_key_exists('status', $body)) {
            apiRequire(
                in_array($body['status'], ['open', 'closed', 'graded'], true),
                400,
                'Trạng thái đợt báo cáo không hợp lệ.'
            );
            $updates[] = 'status = ?';
            $params[] = $body['status'];
        }
        apiRequire($updates !== [], 400, 'Không có trường nào để cập nhật.');
        $params[] = $id;
        $pdo->prepare('UPDATE reports SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
        apiRespond(200, ['message' => 'Đã cập nhật đợt báo cáo.']);
    }

    if ($method === 'POST' && $action === 'feedback') {
        $body = apiReadJsonBody();
        apiRequireCsrf($body);
        apiRequireRole($actor, ['lecturer'], 'Chỉ giảng viên mới được nhận xét báo cáo.');
        $versionId = reportId($body['report_version_id'] ?? null);
        $content = $body['content'] ?? null;
        apiRequire(is_string($content), 400, 'content phải là chuỗi.');
        $content = trim($content);
        apiRequire($content !== '' && mb_strlen($content, 'UTF-8') <= 5000, 400, 'Nhận xét phải có từ 1 đến 5000 ký tự.');
        $score = $body['score'] ?? null;
        apiRequire(
            $score === null || (is_numeric($score) && (float) $score >= 0 && (float) $score <= 10),
            400,
            'Điểm phải nằm trong khoảng từ 0 đến 10.'
        );
        $statement = $pdo->prepare(
            'SELECT r.group_id
             FROM report_versions rv
             JOIN reports r ON r.id = rv.report_id
             WHERE rv.id = ?'
        );
        $statement->execute([$versionId]);
        $reportVersion = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($reportVersion !== false, 404, 'Không tìm thấy phiên bản báo cáo.');
        reportCanAccess($pdo, (int) $reportVersion['group_id'], $actor);
        $statement = $pdo->prepare(
            'INSERT INTO report_feedback (report_version_id, lecturer_user_id, content, score)
             VALUES (?, ?, ?, ?)'
        );
        $statement->execute([$versionId, $actor['id'], $content, $score === null ? null : (float) $score]);
        apiRespond(201, ['data' => ['id' => (int) $pdo->lastInsertId()]]);
    }

    if ($method === 'GET' && $action === 'grades') {
        $sql = 'SELECT fg.group_id, g.group_name,
                       fg.student_user_id AS student_id, u.full_name AS student_name,
                       fg.total_score, fg.status, fg.note, fg.published_at, fg.updated_at
                FROM final_grades fg
                JOIN student_groups g ON g.id = fg.group_id
                JOIN users u ON u.id = fg.student_user_id';
        $params = [];
        if (apiIsStudentRole($actor)) {
            $sql .= " WHERE fg.student_user_id = ? AND fg.status = 'published'
                      AND EXISTS (
                          SELECT 1 FROM group_members gm
                          WHERE gm.group_id = fg.group_id AND gm.user_id = fg.student_user_id
                            AND gm.status = 'active'
                      )";
            $params[] = $actor['id'];
        } elseif ($actor['role'] === 'lecturer') {
            $sql .= " WHERE fg.status = 'published' AND EXISTS (
                SELECT 1 FROM group_lecturers gl
                WHERE gl.group_id = fg.group_id AND gl.lecturer_user_id = ?
                  AND (SELECT COUNT(*) FROM group_lecturers workload
                       WHERE workload.lecturer_user_id = gl.lecturer_user_id) >= 2
            )";
            $params[] = $actor['id'];
        }
        if (isset($_GET['group_id'])) {
            $groupId = reportId($_GET['group_id']);
            $sql .= $params === [] ? ' WHERE fg.group_id = ?' : ' AND fg.group_id = ?';
            $params[] = $groupId;
        }
        $sql .= ' ORDER BY g.group_name, u.full_name';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    apiRespond(404, ['error' => 'Không tìm thấy thao tác API.']);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (isset($destination) && is_file($destination)) {
        unlink($destination);
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (RuntimeException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (isset($destination) && is_file($destination)) {
        unlink($destination);
    }
    $status = $exception->getCode();
    apiRespond($status >= 400 && $status <= 599 ? $status : 400, ['error' => $exception->getMessage()]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (isset($destination) && is_file($destination)) {
        unlink($destination);
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

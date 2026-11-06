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

function reportId($value): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    apiRequire($id !== false, 400, 'report_id phải là số nguyên dương.');
    return (int) $id;
}

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
        if ($actor['role'] === 'student') {
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
        apiRequire($actor['role'] === 'student', 403, 'Chỉ sinh viên mới được nộp báo cáo.');
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

    if ($method === 'GET' && $action === 'grades') {
        $sql = 'SELECT fg.group_id, g.group_name,
                       fg.student_user_id AS student_id, u.full_name AS student_name,
                       fg.total_score, fg.status, fg.note, fg.published_at, fg.updated_at
                FROM final_grades fg
                JOIN student_groups g ON g.id = fg.group_id
                JOIN users u ON u.id = fg.student_user_id';
        $params = [];
        if ($actor['role'] === 'student') {
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

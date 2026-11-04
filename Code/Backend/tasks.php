<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

session_start();

class TaskApiException extends RuntimeException
{
    public $httpStatus;

    public function __construct(int $httpStatus, string $message)
    {
        parent::__construct($message);
        $this->httpStatus = $httpStatus;
    }
}

function taskRespond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function taskRequire(bool $condition, int $status, string $message): void
{
    if (!$condition) {
        throw new TaskApiException($status, $message);
    }
}

function taskId($value, string $field): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    taskRequire($id !== false, 400, "$field phải là số nguyên dương.");
    return (int) $id;
}

function taskBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    taskRequire(is_array($body), 400, 'Nội dung yêu cầu phải là JSON hợp lệ.');
    return $body;
}

function taskCsrf(array $body): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($body['csrf_token'] ?? '');
    taskRequire(
        is_string($token)
            && isset($_SESSION['csrf_token'])
            && hash_equals($_SESSION['csrf_token'], $token),
        403,
        'CSRF token không hợp lệ hoặc đã hết hạn.'
    );
}

function taskText(array $body, string $field, int $maxLength, bool $required): ?string
{
    if (!array_key_exists($field, $body)) {
        taskRequire(!$required, 400, "Thiếu trường $field.");
        return null;
    }

    if (!$required && $body[$field] === null) {
        return null;
    }

    taskRequire(is_string($body[$field]), 400, "$field phải là chuỗi.");
    $value = trim($body[$field]);
    taskRequire(!$required || $value !== '', 400, "$field không được để trống.");
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    taskRequire($length <= $maxLength, 400, "$field vượt quá giới hạn $maxLength ký tự.");
    if ($field === 'description' || $field === 'completion_criteria') {
        taskRequire(strlen($value) <= $maxLength, 400, "$field vượt quá giới hạn lưu trữ.");
    }
    return $value;
}

function taskDueDate(array $body, string $field = 'due_at'): ?string
{
    if (!array_key_exists($field, $body)) {
        return null;
    }
    if ($body[$field] === null || $body[$field] === '') {
        return null;
    }

    taskRequire(is_string($body[$field]), 400, "$field phải là chuỗi ngày giờ hoặc null.");
    $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $body[$field]);
    $errors = DateTimeImmutable::getLastErrors();
    taskRequire(
        $date !== false
            && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0))
            && $date->format('Y-m-d H:i:s') === $body[$field],
        400,
        "$field phải có định dạng YYYY-MM-DD HH:MM:SS."
    );
    return $date->format('Y-m-d H:i:s');
}

function taskGroup(PDO $pdo, int $groupId): array
{
    $statement = $pdo->prepare(
        'SELECT id, leader_user_id, status FROM student_groups WHERE id = ?'
    );
    $statement->execute([$groupId]);
    $group = $statement->fetch();
    taskRequire($group !== false, 404, 'Không tìm thấy nhóm.');
    return $group;
}

function taskIsMember(PDO $pdo, int $groupId, int $userId): bool
{
    $statement = $pdo->prepare(
        "SELECT 1 FROM group_members
         WHERE group_id = ? AND user_id = ? AND status = 'active'"
    );
    $statement->execute([$groupId, $userId]);
    return $statement->fetchColumn() !== false;
}

function taskRequireViewer(PDO $pdo, array $group, array $actor): void
{
    taskRequire(
        $actor['role'] === 'admin'
            || (int) $group['leader_user_id'] === (int) $actor['id']
            || taskIsMember($pdo, (int) $group['id'], (int) $actor['id']),
        403,
        'Bạn không có quyền truy cập nhiệm vụ của nhóm này.'
    );
}

function taskRequireManager(array $group, array $actor): void
{
    taskRequire(
        $actor['role'] === 'admin'
            || (int) $group['leader_user_id'] === (int) $actor['id'],
        403,
        'Chỉ trưởng nhóm hoặc quản trị viên mới được quản lý nhiệm vụ.'
    );
}

function taskAssignedMember(PDO $pdo, int $groupId, ?int $userId): void
{
    if ($userId === null) {
        return;
    }
    taskRequire(
        taskIsMember($pdo, $groupId, $userId),
        400,
        'Người được giao phải là thành viên đang hoạt động của nhóm.'
    );
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;

    $sessionUserId = filter_var(
        $_SESSION['user_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    taskRequire($sessionUserId !== false, 401, 'Vui lòng đăng nhập để sử dụng API.');

    $statement = $pdo->prepare(
        "SELECT id, role FROM users WHERE id = ? AND account_status = 'active'"
    );
    $statement->execute([(int) $sessionUserId]);
    $actor = $statement->fetch();
    taskRequire($actor !== false, 401, 'Tài khoản không tồn tại hoặc đã bị khóa.');

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'tasks' : '');

    if ($method === 'GET' && $action === 'csrf') {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        taskRespond(200, ['csrf_token' => $_SESSION['csrf_token']]);
    }

    $body = in_array($method, ['POST', 'PATCH', 'DELETE'], true) ? taskBody() : [];
    if (in_array($method, ['POST', 'PATCH', 'DELETE'], true)) {
        taskCsrf($body);
    }

    if ($method === 'GET' && $action === 'tasks') {
        $groupId = taskId($_GET['group_id'] ?? null, 'group_id');
        $group = taskGroup($pdo, $groupId);
        taskRequireViewer($pdo, $group, $actor);

        $sql = 'SELECT t.id, t.group_id, t.title, t.description,
                       t.completion_criteria, t.assigned_to,
                       assignee.full_name AS assignee_name, t.created_by,
                       creator.full_name AS creator_name, t.priority, t.status,
                       t.due_at, t.completed_at, t.created_at, t.updated_at
                FROM tasks t
                LEFT JOIN users assignee ON assignee.id = t.assigned_to
                JOIN users creator ON creator.id = t.created_by
                WHERE t.group_id = ?';
        $params = [$groupId];

        if (isset($_GET['status'])) {
            $statuses = ['todo', 'in_progress', 'completed', 'cancelled'];
            taskRequire(in_array($_GET['status'], $statuses, true), 400, 'Trạng thái nhiệm vụ không hợp lệ.');
            $sql .= ' AND t.status = ?';
            $params[] = $_GET['status'];
        }
        $sql .= ' ORDER BY t.due_at IS NULL, t.due_at ASC, t.created_at DESC';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        taskRespond(200, ['data' => $statement->fetchAll()]);
    }

    if ($method === 'GET' && $action === 'task') {
        $taskId = taskId($_GET['id'] ?? null, 'id');
        $statement = $pdo->prepare('SELECT * FROM tasks WHERE id = ?');
        $statement->execute([$taskId]);
        $task = $statement->fetch();
        taskRequire($task !== false, 404, 'Không tìm thấy nhiệm vụ.');
        $group = taskGroup($pdo, (int) $task['group_id']);
        taskRequireViewer($pdo, $group, $actor);
        taskRespond(200, ['data' => $task]);
    }

    if ($method === 'POST' && $action === 'create') {
        $groupId = taskId($body['group_id'] ?? null, 'group_id');
        $group = taskGroup($pdo, $groupId);
        taskRequireManager($group, $actor);
        taskRequire(in_array($group['status'], ['forming', 'active'], true), 409, 'Không thể giao nhiệm vụ cho nhóm đã kết thúc hoặc giải tán.');

        $title = taskText($body, 'title', 200, true);
        $description = taskText($body, 'description', 65535, false);
        $criteria = taskText($body, 'completion_criteria', 65535, false);
        $assigneeId = array_key_exists('assigned_to', $body) && $body['assigned_to'] !== null
            ? taskId($body['assigned_to'], 'assigned_to')
            : null;
        taskAssignedMember($pdo, $groupId, $assigneeId);
        $priority = $body['priority'] ?? 'normal';
        taskRequire(in_array($priority, ['low', 'normal', 'high'], true), 400, 'Mức ưu tiên không hợp lệ.');
        $dueAt = taskDueDate($body);

        $statement = $pdo->prepare(
            'INSERT INTO tasks
                (group_id, title, description, completion_criteria, assigned_to, created_by, priority, due_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([
            $groupId, $title, $description, $criteria, $assigneeId,
            $actor['id'], $priority, $dueAt,
        ]);
        taskRespond(201, ['message' => 'Tạo nhiệm vụ thành công.', 'data' => ['id' => (int) $pdo->lastInsertId()]]);
    }

    if ($method === 'PATCH' && $action === 'update') {
        $taskId = taskId($body['id'] ?? null, 'id');
        $statement = $pdo->prepare('SELECT * FROM tasks WHERE id = ?');
        $statement->execute([$taskId]);
        $task = $statement->fetch();
        taskRequire($task !== false, 404, 'Không tìm thấy nhiệm vụ.');
        $group = taskGroup($pdo, (int) $task['group_id']);
        taskRequireManager($group, $actor);
        taskRequire(in_array($group['status'], ['forming', 'active'], true), 409, 'Không thể sửa nhiệm vụ của nhóm đã kết thúc hoặc giải tán.');
        taskRequire($task['status'] !== 'cancelled', 409, 'Không thể sửa nhiệm vụ đã hủy.');

        $updates = [];
        $params = [];
        foreach ([
            'title' => ['type' => 'text', 'max' => 200, 'required' => true],
            'description' => ['type' => 'text', 'max' => 65535, 'required' => false],
            'completion_criteria' => ['type' => 'text', 'max' => 65535, 'required' => false],
        ] as $field => $rules) {
            if (array_key_exists($field, $body)) {
                $updates[] = "$field = ?";
                $params[] = taskText($body, $field, $rules['max'], $rules['required']);
            }
        }

        if (array_key_exists('assigned_to', $body)) {
            $assigneeId = $body['assigned_to'] === null ? null : taskId($body['assigned_to'], 'assigned_to');
            taskAssignedMember($pdo, (int) $task['group_id'], $assigneeId);
            $updates[] = 'assigned_to = ?';
            $params[] = $assigneeId;
        }
        if (array_key_exists('priority', $body)) {
            taskRequire(in_array($body['priority'], ['low', 'normal', 'high'], true), 400, 'Mức ưu tiên không hợp lệ.');
            $updates[] = 'priority = ?';
            $params[] = $body['priority'];
        }
        if (array_key_exists('due_at', $body)) {
            $updates[] = 'due_at = ?';
            $params[] = taskDueDate($body);
        }

        taskRequire($updates !== [], 400, 'Không có trường nào để cập nhật.');
        $params[] = $taskId;
        $statement = $pdo->prepare('UPDATE tasks SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $statement->execute($params);
        taskRespond(200, ['message' => 'Cập nhật nhiệm vụ thành công.']);
    }

    if ($method === 'PATCH' && $action === 'status') {
        $taskId = taskId($body['id'] ?? null, 'id');
        $status = $body['status'] ?? null;
        $statuses = ['todo', 'in_progress', 'completed', 'cancelled'];
        taskRequire(in_array($status, $statuses, true), 400, 'Trạng thái nhiệm vụ không hợp lệ.');

        $statement = $pdo->prepare('SELECT * FROM tasks WHERE id = ?');
        $statement->execute([$taskId]);
        $task = $statement->fetch();
        taskRequire($task !== false, 404, 'Không tìm thấy nhiệm vụ.');
        $group = taskGroup($pdo, (int) $task['group_id']);
        taskRequireViewer($pdo, $group, $actor);
        taskRequire(in_array($group['status'], ['forming', 'active'], true), 409, 'Không thể cập nhật nhiệm vụ của nhóm đã kết thúc hoặc giải tán.');
        taskRequire($task['status'] !== 'cancelled', 409, 'Nhiệm vụ đã hủy không thể thay đổi trạng thái.');

        if ($status === 'cancelled') {
            taskRequireManager($group, $actor);
        } else {
            taskRequire(
                $actor['role'] === 'admin'
                    || (int) $group['leader_user_id'] === (int) $actor['id']
                    || $task['assigned_to'] === null
                    || (int) $task['assigned_to'] === (int) $actor['id'],
                403,
                'Chỉ người được giao nhiệm vụ, trưởng nhóm hoặc quản trị viên mới được cập nhật trạng thái.'
            );
        }

        $completedAt = $status === 'completed' ? date('Y-m-d H:i:s') : null;
        $statement = $pdo->prepare('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?');
        $statement->execute([$status, $completedAt, $taskId]);
        taskRespond(200, ['message' => 'Cập nhật trạng thái nhiệm vụ thành công.']);
    }

    if ($method === 'DELETE' && $action === 'delete') {
        $taskId = taskId($body['id'] ?? null, 'id');
        $statement = $pdo->prepare('SELECT id, group_id FROM tasks WHERE id = ?');
        $statement->execute([$taskId]);
        $task = $statement->fetch();
        taskRequire($task !== false, 404, 'Không tìm thấy nhiệm vụ.');
        $group = taskGroup($pdo, (int) $task['group_id']);
        taskRequireManager($group, $actor);

        $statement = $pdo->prepare('DELETE FROM tasks WHERE id = ?');
        $statement->execute([$taskId]);
        taskRespond(200, ['message' => 'Xóa nhiệm vụ thành công.']);
    }

    throw new TaskApiException(404, 'Không tìm thấy thao tác API.');
} catch (TaskApiException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    taskRespond($exception->httpStatus, ['error' => $exception->getMessage()]);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    if ((string) $exception->getCode() === '23000') {
        taskRespond(409, ['error' => 'Dữ liệu vi phạm ràng buộc cơ sở dữ liệu.']);
    }
    taskRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    taskRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

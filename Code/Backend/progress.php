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

class ProgressApiException extends RuntimeException
{
    public $httpStatus;

    /** Khởi tạo lỗi API tiến độ kèm mã trạng thái HTTP. */
    public function __construct(int $httpStatus, string $message)
    {
        parent::__construct($message);
        $this->httpStatus = $httpStatus;
    }
}

/** Trả phản hồi JSON với mã HTTP đã chỉ định rồi kết thúc yêu cầu. */
function progressRespond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Ném lỗi API tiến độ nếu điều kiện kiểm tra không đạt. */
function progressRequire(bool $condition, int $status, string $message): void
{
    if (!$condition) {
        throw new ProgressApiException($status, $message);
    }
}

/** Kiểm tra và chuyển giá trị thành ID nhóm nguyên dương. */
function progressId($value): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    progressRequire($id !== false, 400, 'group_id phải là số nguyên dương.');
    return (int) $id;
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;

    $sessionUserId = filter_var(
        $_SESSION['user_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    progressRequire($sessionUserId !== false, 401, 'Vui lòng đăng nhập để sử dụng API.');

    $statement = $pdo->prepare(
        "SELECT id, role FROM users WHERE id = ? AND account_status = 'active'"
    );
    $statement->execute([(int) $sessionUserId]);
    $actor = $statement->fetch();
    progressRequire($actor !== false, 401, 'Tài khoản không tồn tại hoặc đã bị khóa.');

    progressRequire(
        strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET',
        405,
        'API tiến độ chỉ hỗ trợ phương thức GET.'
    );
    $action = $_GET['action'] ?? 'group';
    progressRequire($action === 'group', 404, 'Không tìm thấy thao tác API.');
    $groupId = progressId($_GET['group_id'] ?? null);

    $statement = $pdo->prepare(
        'SELECT id, group_code, group_name, leader_user_id, status
         FROM student_groups
         WHERE id = ?'
    );
    $statement->execute([$groupId]);
    $group = $statement->fetch();
    progressRequire($group !== false, 404, 'Không tìm thấy nhóm.');

    if (!apiCanViewAllData($actor)) {
        if ($actor['role'] === 'lecturer') {
            $statement = $pdo->prepare(
                'SELECT 1 FROM group_lecturers gl
                 WHERE gl.group_id = ? AND gl.lecturer_user_id = ?
                   AND (
                     SELECT COUNT(*) FROM group_lecturers workload
                     WHERE workload.lecturer_user_id = gl.lecturer_user_id
                   ) >= 2'
            );
            $statement->execute([$groupId, $actor['id']]);
        } else {
            $statement = $pdo->prepare(
                "SELECT 1 FROM group_members
                 WHERE group_id = ? AND user_id = ? AND status = 'active'
                 UNION
                 SELECT 1 FROM student_groups
                 WHERE id = ? AND leader_user_id = ?"
            );
            $statement->execute([$groupId, $actor['id'], $groupId, $actor['id']]);
        }
        progressRequire($statement->fetchColumn() !== false, 403, 'Bạn không có quyền xem tiến độ của nhóm này.');
    }

    $statement = $pdo->prepare(
        "SELECT
            COUNT(*) AS total_tasks,
            COALESCE(SUM(status = 'todo'), 0) AS todo_tasks,
            COALESCE(SUM(status = 'in_progress'), 0) AS in_progress_tasks,
            COALESCE(SUM(status = 'completed'), 0) AS completed_tasks,
            COALESCE(SUM(status = 'cancelled'), 0) AS cancelled_tasks,
            COALESCE(SUM(
                status IN ('todo', 'in_progress')
                AND due_at IS NOT NULL
                AND due_at < CURRENT_TIMESTAMP
            ), 0) AS overdue_tasks,
            COALESCE(SUM(assigned_to IS NULL), 0) AS unassigned_tasks,
            MAX(updated_at) AS last_updated_at
         FROM tasks
         WHERE group_id = ?"
    );
    $statement->execute([$groupId]);
    $summary = $statement->fetch();

    foreach ([
        'total_tasks',
        'todo_tasks',
        'in_progress_tasks',
        'completed_tasks',
        'cancelled_tasks',
        'overdue_tasks',
        'unassigned_tasks',
    ] as $field) {
        $summary[$field] = (int) $summary[$field];
    }
    $eligibleTasks = $summary['total_tasks'] - $summary['cancelled_tasks'];
    $summary['completion_percentage'] = $eligibleTasks === 0
        ? 0
        : round(($summary['completed_tasks'] / $eligibleTasks) * 100, 2);

    $statement = $pdo->prepare(
        "SELECT
            u.id AS user_id,
            u.full_name,
            COUNT(t.id) AS assigned_tasks,
            COALESCE(SUM(t.status = 'todo'), 0) AS todo_tasks,
            COALESCE(SUM(t.status = 'in_progress'), 0) AS in_progress_tasks,
            COALESCE(SUM(t.status = 'completed'), 0) AS completed_tasks,
            COALESCE(SUM(t.status = 'cancelled'), 0) AS cancelled_tasks,
            COALESCE(SUM(
                t.status IN ('todo', 'in_progress')
                AND t.due_at IS NOT NULL
                AND t.due_at < CURRENT_TIMESTAMP
            ), 0) AS overdue_tasks
         FROM group_members gm
         JOIN users u ON u.id = gm.user_id
         LEFT JOIN tasks t ON t.group_id = gm.group_id AND t.assigned_to = gm.user_id
         WHERE gm.group_id = ? AND gm.status = 'active'
         GROUP BY u.id, u.full_name
         ORDER BY u.full_name ASC"
    );
    $statement->execute([$groupId]);
    $members = $statement->fetchAll();

    foreach ($members as &$member) {
        foreach ([
            'user_id',
            'assigned_tasks',
            'todo_tasks',
            'in_progress_tasks',
            'completed_tasks',
            'cancelled_tasks',
            'overdue_tasks',
        ] as $field) {
            $member[$field] = (int) $member[$field];
        }
    }
    unset($member);

    progressRespond(200, [
        'data' => [
            'group' => [
                'id' => (int) $group['id'],
                'group_code' => $group['group_code'],
                'group_name' => $group['group_name'],
                'status' => $group['status'],
            ],
            'progress' => $summary,
            'members' => $members,
        ],
    ]);
} catch (ProgressApiException $exception) {
    progressRespond($exception->httpStatus, ['error' => $exception->getMessage()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    if ((string) $exception->getCode() === '42S02') {
        progressRespond(500, ['error' => 'Thiếu bảng nhiệm vụ hoặc phân công giảng viên. Hãy import quan_ly_nhiem_vu.sql và phan_cong_giang_vien.sql trước.']);
    }
    progressRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    progressRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

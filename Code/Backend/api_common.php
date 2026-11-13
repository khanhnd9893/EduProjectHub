<?php
declare(strict_types=1);

/** Trả phản hồi JSON với mã HTTP đã chỉ định rồi kết thúc yêu cầu. */
function apiRespond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Ném lỗi HTTP nếu điều kiện kiểm tra không đạt. */
function apiRequire(bool $condition, int $status, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message, $status);
    }
}

/** Kiểm tra tài khoản thuộc nhóm sinh viên, gồm cả trưởng nhóm. */
function apiIsStudentRole(array $actor): bool
{
    return in_array($actor['role'], ['student', 'team_leader'], true);
}

/** Kiểm tra tài khoản có quyền điều phối nghiệp vụ đào tạo. */
function apiIsTrainingManager(array $actor): bool
{
    return in_array($actor['role'], ['admin', 'training_manager'], true);
}

/** Trả các phạm vi FAQ mà vai trò hiện tại được phép đọc. */
function apiFaqVisibilities(array $actor): array
{
    $visibilities = ['all', $actor['role']];
    if ($actor['role'] === 'team_leader') {
        $visibilities[] = 'student';
    }
    return array_values(array_unique($visibilities));
}

/** Đọc và xác thực phần thân JSON của yêu cầu hiện tại. */
function apiReadJsonBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    apiRequire(is_array($body), 400, 'Nội dung yêu cầu phải là JSON hợp lệ.');
    return $body;
}

/** Xác thực CSRF token nhận từ header hoặc phần thân yêu cầu. */
function apiRequireCsrf(array $body = []): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($body['csrf_token'] ?? '');
    apiRequire(
        is_string($provided)
            && isset($_SESSION['csrf_token'])
            && hash_equals($_SESSION['csrf_token'], $provided),
        403,
        'CSRF token không hợp lệ hoặc đã hết hạn.'
    );
}

/** Xác thực phiên đăng nhập và trả thông tin tài khoản đang hoạt động. */
function apiRequireActor(PDO $pdo): array
{
    $userId = filter_var(
        $_SESSION['user_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    apiRequire($userId !== false, 401, 'Vui lòng đăng nhập để sử dụng API.');

    $statement = $pdo->prepare(
        "SELECT id, username, full_name, role
         FROM users WHERE id = ? AND account_status = 'active'"
    );
    $statement->execute([(int) $userId]);
    $actor = $statement->fetch(PDO::FETCH_ASSOC);
    apiRequire($actor !== false, 401, 'Tài khoản không tồn tại hoặc đã bị khóa.');
    $actor['id'] = (int) $actor['id'];
    return $actor;
}

/** Xác thực quyền truy cập nhóm và trả thông tin nhóm. */
function apiRequireGroupAccess(PDO $pdo, int $groupId, array $actor): array
{
    $statement = $pdo->prepare(
        'SELECT id, group_name, project_round_id, leader_user_id, status
         FROM student_groups WHERE id = ?'
    );
    $statement->execute([$groupId]);
    $group = $statement->fetch(PDO::FETCH_ASSOC);
    apiRequire($group !== false, 404, 'Không tìm thấy nhóm.');

    if (apiIsTrainingManager($actor)) {
        return $group;
    }

    if ($actor['role'] === 'lecturer') {
        $statement = $pdo->prepare(
            'SELECT 1 FROM group_lecturers gl
             WHERE gl.group_id = ? AND gl.lecturer_user_id = ?
               AND (SELECT COUNT(*) FROM group_lecturers workload
                    WHERE workload.lecturer_user_id = gl.lecturer_user_id) >= 2'
        );
        $statement->execute([$groupId, $actor['id']]);
    } else {
        $statement = $pdo->prepare(
            "SELECT 1 FROM student_groups sg
             WHERE sg.id = ? AND (
                 sg.leader_user_id = ?
                 OR EXISTS (
                     SELECT 1 FROM group_members gm
                     WHERE gm.group_id = sg.id AND gm.user_id = ? AND gm.status = 'active'
                 )
             )"
        );
        $statement->execute([$groupId, $actor['id'], $actor['id']]);
    }

    apiRequire($statement->fetchColumn() !== false, 403, 'Bạn không có quyền truy cập dữ liệu nhóm này.');
    return $group;
}

/** Yêu cầu người gọi là quản trị viên hoặc trưởng nhóm. */
function apiRequireGroupManager(array $group, array $actor): void
{
    apiRequire(
        $actor['role'] === 'admin'
            || (apiIsStudentRole($actor) && (int) $group['leader_user_id'] === $actor['id']),
        403,
        'Chỉ trưởng nhóm hoặc quản trị viên mới được thực hiện thao tác này.'
    );
}

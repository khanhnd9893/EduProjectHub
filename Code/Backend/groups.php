<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

session_start();

class ApiException extends RuntimeException
{
    public $httpStatus;

    public function __construct(int $httpStatus, string $message)
    {
        parent::__construct($message);
        $this->httpStatus = $httpStatus;
    }
}

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireValue(bool $condition, int $status, string $message): void
{
    if (!$condition) {
        throw new ApiException($status, $message);
    }
}

function positiveId($value, string $field): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    requireValue($id !== false, 400, "$field phải là số nguyên dương.");
    return (int) $id;
}

function textLength(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    $count = preg_match_all('/./us', $value);
    return $count === false ? strlen($value) : $count;
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    $body = json_decode($rawBody, true);
    requireValue(is_array($body), 400, 'Nội dung yêu cầu phải là JSON hợp lệ.');
    return $body;
}

function requireCsrfToken(array $body): void
{
    $providedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($body['csrf_token'] ?? '');
    requireValue(
        is_string($providedToken)
            && isset($_SESSION['csrf_token'])
            && hash_equals($_SESSION['csrf_token'], $providedToken),
        403,
        'CSRF token không hợp lệ hoặc đã hết hạn.'
    );
}

function getGroup(PDO $pdo, int $groupId, bool $forUpdate = false): array
{
    $sql = 'SELECT id, group_code, group_name, description, project_round_id,
                   leader_user_id, created_by, status, created_at, updated_at, dissolved_at
            FROM student_groups WHERE id = ?';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $statement = $pdo->prepare($sql);
    $statement->execute([$groupId]);
    $group = $statement->fetch(PDO::FETCH_ASSOC);
    requireValue($group !== false, 404, 'Không tìm thấy nhóm.');
    return $group;
}

function requireGroupManager(array $group, array $actor): void
{
    requireValue(
        $actor['role'] === 'admin'
            || (
                $actor['role'] === 'student'
                && (int) $group['leader_user_id'] === (int) $actor['id']
            ),
        403,
        'Chỉ trưởng nhóm hoặc quản trị viên mới được thực hiện thao tác này.'
    );
}

function requireGroupViewer(PDO $pdo, array $group, array $actor): void
{
    if ($actor['role'] === 'admin') {
        return;
    }

    if ($actor['role'] === 'lecturer') {
        $sql = 'SELECT 1 FROM group_lecturers gl
                WHERE gl.group_id = ? AND gl.lecturer_user_id = ?
                  AND (
                    SELECT COUNT(*) FROM group_lecturers workload
                    WHERE workload.lecturer_user_id = gl.lecturer_user_id
                  ) >= 2';
    } else {
        $sql = "SELECT 1 FROM student_groups sg_access
                WHERE sg_access.id = ?
                  AND (
                    sg_access.leader_user_id = ?
                    OR EXISTS (
                        SELECT 1 FROM group_members gm_access
                        WHERE gm_access.group_id = sg_access.id
                          AND gm_access.user_id = ?
                          AND gm_access.status = 'active'
                    )
                  )";
    }
    $statement = $pdo->prepare($sql);
    $params = $actor['role'] === 'lecturer'
        ? [$group['id'], $actor['id']]
        : [$group['id'], $actor['id'], $actor['id']];
    $statement->execute($params);
    requireValue(
        $statement->fetchColumn() !== false,
        403,
        'Bạn không có quyền xem thông tin nhóm này.'
    );
}

function validateGroupText(array $body, string $field, int $maxLength, bool $required): ?string
{
    if (!array_key_exists($field, $body)) {
        requireValue(!$required, 400, "Thiếu trường $field.");
        return null;
    }

    if ($field === 'description' && $body[$field] === null) {
        return null;
    }

    requireValue(is_string($body[$field]), 400, "$field phải là chuỗi.");
    $value = trim($body[$field]);
    requireValue(!$required || $value !== '', 400, "$field không được để trống.");
    requireValue(textLength($value) <= $maxLength, 400, "$field vượt quá $maxLength ký tự.");
    if ($field === 'description') {
        requireValue(strlen($value) <= $maxLength, 400, "$field vượt quá giới hạn lưu trữ.");
    }
    return $value;
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;

    $userId = filter_var(
        $_SESSION['user_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    requireValue($userId !== false, 401, 'Vui lòng đăng nhập để sử dụng API.');

    $statement = $pdo->prepare(
        "SELECT id, role FROM users WHERE id = ? AND account_status = 'active'"
    );
    $statement->execute([(int) $userId]);
    $actor = $statement->fetch();
    requireValue($actor !== false, 401, 'Tài khoản không tồn tại hoặc đã bị khóa.');

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'groups' : '');

    if ($method === 'GET' && $action === 'csrf') {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        respond(200, ['csrf_token' => $_SESSION['csrf_token']]);
    }

    $body = in_array($method, ['POST', 'PATCH', 'DELETE'], true) ? readJsonBody() : [];
    if (in_array($method, ['POST', 'PATCH', 'DELETE'], true)) {
        requireCsrfToken($body);
    }

    if ($method === 'GET' && $action === 'groups') {
        $where = [];
        $params = [];

        if ($actor['role'] === 'student') {
            $where[] = '(sg.leader_user_id = ? OR EXISTS (
                SELECT 1 FROM group_members gm_access
                WHERE gm_access.group_id = sg.id
                  AND gm_access.user_id = ?
                  AND gm_access.status = \'active\'
            ))';
            $params[] = $actor['id'];
            $params[] = $actor['id'];
        } elseif ($actor['role'] === 'lecturer') {
            $where[] = 'EXISTS (
                SELECT 1 FROM group_lecturers gl_access
                WHERE gl_access.group_id = sg.id
                  AND gl_access.lecturer_user_id = ?
                  AND (
                    SELECT COUNT(*) FROM group_lecturers gl_workload
                    WHERE gl_workload.lecturer_user_id = gl_access.lecturer_user_id
                  ) >= 2
            )';
            $params[] = $actor['id'];
        }

        if (isset($_GET['round_id'])) {
            $where[] = 'sg.project_round_id = ?';
            $params[] = positiveId($_GET['round_id'], 'round_id');
        }
        if (isset($_GET['status'])) {
            $allowedStatuses = ['forming', 'active', 'completed', 'dissolved'];
            requireValue(in_array($_GET['status'], $allowedStatuses, true), 400, 'Trạng thái nhóm không hợp lệ.');
            $where[] = 'sg.status = ?';
            $params[] = $_GET['status'];
        }

        $sql = 'SELECT sg.id, sg.group_code, sg.group_name, sg.description,
                       sg.project_round_id, pr.round_name, sg.leader_user_id,
                       leader.full_name AS leader_name, sg.status,
                       (SELECT COUNT(*) FROM group_members gm
                        WHERE gm.group_id = sg.id AND gm.status = \'active\') AS active_member_count,
                       sg.created_at, sg.updated_at
                FROM student_groups sg
                JOIN project_rounds pr ON pr.id = sg.project_round_id
                JOIN users leader ON leader.id = sg.leader_user_id';
        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY sg.created_at DESC';

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        respond(200, ['data' => $statement->fetchAll()]);
    }

    if ($method === 'GET' && $action === 'group') {
        $groupId = positiveId($_GET['id'] ?? null, 'id');
        $group = getGroup($pdo, $groupId);
        requireGroupViewer($pdo, $group, $actor);
        $statement = $pdo->prepare(
            "SELECT gm.id AS group_member_id, u.id AS user_id,
                    u.full_name, gm.member_role, gm.status,
                    gm.joined_at, gm.left_at
             FROM group_members gm
             JOIN users u ON u.id = gm.user_id
             WHERE gm.group_id = ? AND gm.status = 'active'
             ORDER BY gm.member_role DESC, gm.joined_at ASC"
        );
        $statement->execute([$groupId]);
        $group['members'] = $statement->fetchAll();
        respond(200, ['data' => $group]);
    }

    if ($method === 'POST' && $action === 'assign_lecturer') {
        requireValue($actor['role'] === 'admin', 403, 'Chỉ quản trị viên mới được phân công giảng viên.');

        $lecturerId = positiveId($body['lecturer_user_id'] ?? null, 'lecturer_user_id');
        requireValue(
            isset($body['group_ids'])
                && is_array($body['group_ids'])
                && array_is_list($body['group_ids']),
            400,
            'group_ids phải là danh sách ID nhóm.'
        );
        requireValue(count($body['group_ids']) >= 2, 400, 'Mỗi giảng viên phải được phân công ít nhất 2 nhóm.');

        $groupIds = [];
        foreach ($body['group_ids'] as $value) {
            $groupIds[] = positiveId($value, 'group_ids');
        }
        $groupIds = array_values(array_unique($groupIds));
        requireValue(count($groupIds) >= 2, 400, 'Cần ít nhất 2 nhóm khác nhau cho mỗi giảng viên.');

        $pdo->beginTransaction();
        $statement = $pdo->prepare(
            "SELECT id FROM users WHERE id = ? AND role = 'lecturer' AND account_status = 'active' FOR UPDATE"
        );
        $statement->execute([$lecturerId]);
        requireValue($statement->fetch() !== false, 404, 'Không tìm thấy tài khoản giảng viên đang hoạt động.');

        $placeholders = implode(', ', array_fill(0, count($groupIds), '?'));
        $statement = $pdo->prepare(
            "SELECT id FROM student_groups WHERE id IN ($placeholders) ORDER BY id FOR UPDATE"
        );
        $statement->execute($groupIds);
        requireValue(
            count($statement->fetchAll(PDO::FETCH_COLUMN)) === count($groupIds),
            400,
            'Một hoặc nhiều nhóm không tồn tại.'
        );

        $statement = $pdo->prepare('DELETE FROM group_lecturers WHERE lecturer_user_id = ?');
        $statement->execute([$lecturerId]);
        $statement = $pdo->prepare(
            'INSERT INTO group_lecturers (group_id, lecturer_user_id, assigned_by)
             VALUES (?, ?, ?)'
        );
        foreach ($groupIds as $assignedGroupId) {
            $statement->execute([$assignedGroupId, $lecturerId, $actor['id']]);
        }
        $pdo->commit();
        respond(200, [
            'message' => 'Cập nhật phân công giảng viên thành công.',
            'data' => ['lecturer_user_id' => $lecturerId, 'group_ids' => $groupIds],
        ]);
    }

    if ($method === 'POST' && $action === 'create') {
        requireValue($actor['role'] === 'student', 403, 'Chỉ sinh viên mới được tạo nhóm.');
        $groupCode = validateGroupText($body, 'group_code', 30, true);
        $groupName = validateGroupText($body, 'group_name', 150, true);
        $description = validateGroupText($body, 'description', 65535, false);
        $roundId = positiveId($body['project_round_id'] ?? null, 'project_round_id');

        $pdo->beginTransaction();
        $statement = $pdo->prepare("SELECT id FROM project_rounds WHERE id = ? AND status = 'open' FOR UPDATE");
        $statement->execute([$roundId]);
        requireValue($statement->fetch() !== false, 409, 'Đợt đồ án không tồn tại hoặc chưa mở đăng ký.');

        $statement = $pdo->prepare(
            "INSERT INTO student_groups
                (group_code, group_name, description, project_round_id, leader_user_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $statement->execute([$groupCode, $groupName, $description, $roundId, $actor['id'], $actor['id']]);
        $groupId = (int) $pdo->lastInsertId();

        $statement = $pdo->prepare(
            "INSERT INTO group_members (group_id, user_id, member_role, status)
             VALUES (?, ?, 'leader', 'active')"
        );
        $statement->execute([$groupId, $actor['id']]);
        $pdo->commit();
        respond(201, ['message' => 'Tạo nhóm thành công.', 'data' => ['id' => $groupId]]);
    }

    if ($method === 'PATCH' && $action === 'update') {
        $groupId = positiveId($body['id'] ?? null, 'id');
        $group = getGroup($pdo, $groupId);
        requireGroupManager($group, $actor);
        requireValue(in_array($group['status'], ['forming', 'active'], true), 409, 'Không thể sửa nhóm đã kết thúc hoặc giải tán.');

        $updates = [];
        $params = [];
        foreach (['group_code' => 30, 'group_name' => 150, 'description' => 65535] as $field => $maxLength) {
            if (array_key_exists($field, $body)) {
                $value = validateGroupText($body, $field, $maxLength, $field !== 'description');
                $updates[] = "$field = ?";
                $params[] = $value;
            }
        }
        requireValue($updates !== [], 400, 'Không có trường nào để cập nhật.');
        $params[] = $groupId;
        $statement = $pdo->prepare('UPDATE student_groups SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $statement->execute($params);
        respond(200, ['message' => 'Cập nhật nhóm thành công.']);
    }

    if ($method === 'POST' && $action === 'add_member') {
        $groupId = positiveId($body['group_id'] ?? null, 'group_id');
        $memberId = positiveId($body['user_id'] ?? null, 'user_id');
        $group = getGroup($pdo, $groupId);
        requireGroupManager($group, $actor);
        requireValue(in_array($group['status'], ['forming', 'active'], true), 409, 'Nhóm không còn nhận thành viên.');

        $statement = $pdo->prepare(
            "SELECT id, status FROM group_members WHERE group_id = ? AND user_id = ?"
        );
        $statement->execute([$groupId, $memberId]);
        $membership = $statement->fetch();

        if ($membership === false) {
            $statement = $pdo->prepare(
                "INSERT INTO group_members (group_id, user_id, member_role, status)
                 VALUES (?, ?, 'member', 'active')"
            );
            $statement->execute([$groupId, $memberId]);
        } else {
            requireValue($membership['status'] !== 'active', 409, 'Sinh viên đã là thành viên của nhóm.');
            $statement = $pdo->prepare(
                "UPDATE group_members SET status = 'active', joined_at = CURRENT_TIMESTAMP,
                                          left_at = NULL, member_role = 'member'
                 WHERE id = ?"
            );
            $statement->execute([$membership['id']]);
        }
        respond(201, ['message' => 'Thêm thành viên thành công.']);
    }

    if ($method === 'DELETE' && $action === 'remove_member') {
        $groupId = positiveId($body['group_id'] ?? null, 'group_id');
        $memberId = positiveId($body['user_id'] ?? null, 'user_id');
        $group = getGroup($pdo, $groupId);
        requireGroupManager($group, $actor);
        requireValue((int) $group['leader_user_id'] !== $memberId, 409, 'Hãy chuyển trưởng nhóm trước khi xóa thành viên này.');

        $statement = $pdo->prepare(
            "UPDATE group_members
             SET status = 'removed', left_at = CURRENT_TIMESTAMP
             WHERE group_id = ? AND user_id = ? AND status = 'active'"
        );
        $statement->execute([$groupId, $memberId]);
        requireValue($statement->rowCount() === 1, 404, 'Không tìm thấy thành viên đang hoạt động trong nhóm.');
        respond(200, ['message' => 'Đã xóa thành viên khỏi nhóm.']);
    }

    if ($method === 'PATCH' && $action === 'transfer_leader') {
        $groupId = positiveId($body['group_id'] ?? null, 'group_id');
        $newLeaderId = positiveId($body['user_id'] ?? null, 'user_id');

        $pdo->beginTransaction();
        $group = getGroup($pdo, $groupId, true);
        requireGroupManager($group, $actor);
        requireValue(in_array($group['status'], ['forming', 'active'], true), 409, 'Không thể đổi trưởng nhóm đã kết thúc hoặc giải tán.');
        requireValue((int) $group['leader_user_id'] !== $newLeaderId, 400, 'Sinh viên này hiện đã là trưởng nhóm.');

        $statement = $pdo->prepare(
            "SELECT id FROM group_members
             WHERE group_id = ? AND user_id = ? AND status = 'active' FOR UPDATE"
        );
        $statement->execute([$groupId, $newLeaderId]);
        $newLeaderMembership = $statement->fetch();
        requireValue($newLeaderMembership !== false, 400, 'Trưởng nhóm mới phải là thành viên đang hoạt động.');

        $statement = $pdo->prepare(
            "UPDATE group_members SET member_role = 'member'
             WHERE group_id = ? AND member_role = 'leader' AND status = 'active'"
        );
        $statement->execute([$groupId]);
        $statement = $pdo->prepare(
            "UPDATE group_members SET member_role = 'leader' WHERE id = ? AND status = 'active'"
        );
        $statement->execute([$newLeaderMembership['id']]);
        requireValue($statement->rowCount() === 1, 409, 'Không thể cập nhật trưởng nhóm.');
        $pdo->commit();
        respond(200, ['message' => 'Chuyển trưởng nhóm thành công.']);
    }

    if ($method === 'POST' && $action === 'activate') {
        $groupId = positiveId($body['group_id'] ?? null, 'group_id');

        $pdo->beginTransaction();
        $group = getGroup($pdo, $groupId, true);
        requireGroupManager($group, $actor);
        requireValue($group['status'] === 'forming', 409, 'Chỉ nhóm đang thành lập mới có thể được kích hoạt.');

        $statement = $pdo->prepare('SELECT min_members FROM project_rounds WHERE id = ?');
        $statement->execute([$group['project_round_id']]);
        $limits = $statement->fetch();
        $statement = $pdo->prepare(
            "SELECT COUNT(*) FROM group_members WHERE group_id = ? AND status = 'active'"
        );
        $statement->execute([$groupId]);
        $memberCount = (int) $statement->fetchColumn();
        requireValue(
            $limits !== false && $memberCount >= (int) $limits['min_members'],
            409,
            'Nhóm chưa đủ số thành viên tối thiểu để kích hoạt.'
        );

        $statement = $pdo->prepare("UPDATE student_groups SET status = 'active' WHERE id = ?");
        $statement->execute([$groupId]);
        $pdo->commit();
        respond(200, ['message' => 'Kích hoạt nhóm thành công.']);
    }

    if ($method === 'DELETE' && $action === 'dissolve') {
        $groupId = positiveId($body['id'] ?? null, 'id');

        $pdo->beginTransaction();
        $group = getGroup($pdo, $groupId, true);
        requireGroupManager($group, $actor);
        requireValue(in_array($group['status'], ['forming', 'active'], true), 409, 'Chỉ nhóm đang thành lập hoặc hoạt động mới có thể giải tán.');

        $statement = $pdo->prepare(
            "UPDATE student_groups SET status = 'dissolved', dissolved_at = CURRENT_TIMESTAMP
             WHERE id = ?"
        );
        $statement->execute([$groupId]);
        $statement = $pdo->prepare(
            "UPDATE group_members SET status = 'removed', left_at = CURRENT_TIMESTAMP
             WHERE group_id = ? AND status = 'active'"
        );
        $statement->execute([$groupId]);
        $statement = $pdo->prepare(
            "UPDATE group_invitations SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP
             WHERE group_id = ? AND status = 'pending'"
        );
        $statement->execute([$groupId]);
        $statement = $pdo->prepare(
            "UPDATE group_requests SET status = 'cancelled', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
             WHERE group_id = ? AND status = 'pending'"
        );
        $statement->execute([$actor['id'], $groupId]);
        $pdo->commit();
        respond(200, ['message' => 'Giải tán nhóm thành công.']);
    }

    throw new ApiException(404, 'Không tìm thấy thao tác API.');
} catch (ApiException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respond($exception->httpStatus, ['error' => $exception->getMessage()]);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());

    $sqlState = (string) $exception->getCode();
    if ($sqlState === '23000' || $sqlState === '45000') {
        respond(409, ['error' => 'Dữ liệu vi phạm ràng buộc hoặc quy tắc nghiệp vụ của cơ sở dữ liệu.']);
    }
    if ($sqlState === '42S02') {
        respond(500, ['error' => 'Thiếu bảng phân công giảng viên. Hãy import phan_cong_giang_vien.sql trước.']);
    }
    respond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    respond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

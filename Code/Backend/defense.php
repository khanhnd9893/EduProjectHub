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

// Điểm gợi ý = 40% điểm báo cáo + 60% điểm bảo vệ; người có quyền vẫn nhập điểm cuối cùng.
const DEFENSE_REPORT_WEIGHT = 0.4;
const DEFENSE_DEFENSE_WEIGHT = 0.6;

/** Kiểm tra và chuyển giá trị thành ID nguyên dương. */
function defenseId($value, string $field): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    apiRequire($id !== false, 400, "$field phải là số nguyên dương.");
    return (int) $id;
}

/** Chuẩn hóa chuỗi văn bản; trả null nếu trường tùy chọn để trống. */
function defenseText(array $body, string $field, int $maxLength, bool $required): ?string
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

/** Chuẩn hóa chuỗi ngày giờ (YYYY-MM-DD HH:MM[:SS], cho phép chữ T) sang DATETIME; null hoặc chuỗi rỗng trả về null. */
function defenseDateTime($value, string $field): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    apiRequire(
        is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/', $value) === 1,
        400,
        "$field phải có dạng YYYY-MM-DD HH:MM."
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
        "$field không phải ngày giờ hợp lệ."
    );
    return $date->format('Y-m-d H:i:s');
}

/** Kiểm tra điểm trong thang 0–10 và làm tròn 2 chữ số thập phân. */
function defenseScore($value, string $field): float
{
    apiRequire(
        is_int($value) || is_float($value) || (is_string($value) && is_numeric($value)),
        400,
        "$field phải là số từ 0 đến 10."
    );
    $score = (float) $value;
    apiRequire($score >= 0 && $score <= 10, 400, "$field phải nằm trong khoảng từ 0 đến 10.");
    return round($score, 2);
}

/** Yêu cầu người gọi có một trong các vai trò được phép. */
function defenseRequireRole(array $actor, array $roles, string $message): void
{
    apiRequire(in_array($actor['role'], $roles, true), 403, $message);
}

/** Lấy hội đồng theo ID hoặc trả 404. */
function defenseLoadCouncil(PDO $pdo, int $id): array
{
    $statement = $pdo->prepare(
        'SELECT c.id, c.project_round_id, pr.round_name, c.name, c.created_at
         FROM defense_councils c
         JOIN project_rounds pr ON pr.id = c.project_round_id
         WHERE c.id = ?'
    );
    $statement->execute([$id]);
    $council = $statement->fetch(PDO::FETCH_ASSOC);
    apiRequire($council !== false, 404, 'Không tìm thấy hội đồng bảo vệ.');
    return $council;
}

/** Danh sách thành viên của một hội đồng. */
function defenseCouncilMembers(PDO $pdo, int $councilId): array
{
    $statement = $pdo->prepare(
        'SELECT m.lecturer_user_id, u.full_name AS lecturer_name, m.council_role, m.assigned_at
         FROM defense_council_members m
         JOIN users u ON u.id = m.lecturer_user_id
         WHERE m.council_id = ?
         ORDER BY FIELD(m.council_role, \'chair\', \'secretary\', \'member\'), u.full_name'
    );
    $statement->execute([$councilId]);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

/** Vai trò của người dùng trong hội đồng; null nếu không phải thành viên. */
function defenseCouncilRole(PDO $pdo, int $councilId, int $userId): ?string
{
    $statement = $pdo->prepare(
        'SELECT council_role FROM defense_council_members WHERE council_id = ? AND lecturer_user_id = ?'
    );
    $statement->execute([$councilId, $userId]);
    $role = $statement->fetchColumn();
    return $role === false ? null : (string) $role;
}

/**
 * Kiểm tra danh sách thành viên hội đồng và trả về map [ID giảng viên => vai trò].
 * Hội đồng cần đúng một chủ tịch, tối đa một thư ký và chỉ gồm giảng viên đang hoạt động.
 */
function defenseNormalizeMembers(PDO $pdo, $members): array
{
    apiRequire(is_array($members) && $members !== [] && count($members) <= 20, 400, 'Hội đồng cần từ 1 đến 20 thành viên.');
    $normalized = [];
    $chairs = 0;
    $secretaries = 0;
    foreach ($members as $member) {
        apiRequire(is_array($member), 400, 'Thành viên hội đồng không hợp lệ.');
        $lecturerId = defenseId($member['lecturer_user_id'] ?? null, 'lecturer_user_id');
        apiRequire(!isset($normalized[$lecturerId]), 400, 'Một giảng viên không được xuất hiện hai lần trong hội đồng.');
        $role = $member['council_role'] ?? 'member';
        apiRequire(in_array($role, ['chair', 'secretary', 'member'], true), 400, 'Vai trò trong hội đồng không hợp lệ.');
        $chairs += $role === 'chair' ? 1 : 0;
        $secretaries += $role === 'secretary' ? 1 : 0;
        $normalized[$lecturerId] = $role;
    }
    apiRequire($chairs === 1, 400, 'Hội đồng phải có đúng một chủ tịch.');
    apiRequire($secretaries <= 1, 400, 'Hội đồng chỉ được có tối đa một thư ký.');

    $placeholders = implode(', ', array_fill(0, count($normalized), '?'));
    $statement = $pdo->prepare(
        "SELECT COUNT(*) FROM users
         WHERE role = 'lecturer' AND account_status = 'active' AND id IN ($placeholders)"
    );
    $statement->execute(array_keys($normalized));
    apiRequire(
        (int) $statement->fetchColumn() === count($normalized),
        400,
        'Tất cả thành viên hội đồng phải là giảng viên đang hoạt động.'
    );
    return $normalized;
}

/** Lấy lịch bảo vệ kèm tên hội đồng, nhóm và đợt đồ án hoặc trả 404. */
function defenseLoadSchedule(PDO $pdo, int $id): array
{
    $statement = $pdo->prepare(
        'SELECT s.id, s.council_id, c.name AS council_name, c.project_round_id,
                s.group_id, g.group_name, g.group_code, s.defense_at, s.location,
                s.status, s.note, s.created_at, s.updated_at
         FROM defense_schedules s
         JOIN defense_councils c ON c.id = s.council_id
         JOIN student_groups g ON g.id = s.group_id
         WHERE s.id = ?'
    );
    $statement->execute([$id]);
    $schedule = $statement->fetch(PDO::FETCH_ASSOC);
    apiRequire($schedule !== false, 404, 'Không tìm thấy lịch bảo vệ.');
    return $schedule;
}

/** Quyền xem lịch: admin, thành viên hội đồng, giảng viên được phân công nhóm hoặc thành viên nhóm. */
function defenseCanViewSchedule(PDO $pdo, array $schedule, array $actor): bool
{
    if ($actor['role'] === 'admin') {
        return true;
    }
    if ($actor['role'] === 'lecturer'
        && defenseCouncilRole($pdo, (int) $schedule['council_id'], $actor['id']) !== null) {
        return true;
    }
    try {
        apiRequireGroupAccess($pdo, (int) $schedule['group_id'], $actor);
        return true;
    } catch (RuntimeException $exception) {
        if ($exception->getCode() === 403) {
            return false;
        }
        throw $exception;
    }
}

/** Sinh viên đang hoạt động của nhóm (gồm cả trưởng nhóm). */
function defenseGroupStudents(PDO $pdo, int $groupId): array
{
    $statement = $pdo->prepare(
        "SELECT u.id AS user_id, u.full_name, u.student_code
         FROM group_members gm
         JOIN users u ON u.id = gm.user_id
         WHERE gm.group_id = ? AND gm.status = 'active'
         ORDER BY u.full_name"
    );
    $statement->execute([$groupId]);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

/** Quyền quản lý điểm tổng kết: quản trị viên hoặc chủ tịch hội đồng bảo vệ của nhóm. */
function defenseRequireGradeManager(PDO $pdo, int $groupId, array $actor): array
{
    $statement = $pdo->prepare('SELECT id, group_name, project_round_id, status FROM student_groups WHERE id = ?');
    $statement->execute([$groupId]);
    $group = $statement->fetch(PDO::FETCH_ASSOC);
    apiRequire($group !== false, 404, 'Không tìm thấy nhóm.');
    if ($actor['role'] === 'admin') {
        return $group;
    }
    $isChair = false;
    if ($actor['role'] === 'lecturer') {
        $statement = $pdo->prepare(
            "SELECT 1
             FROM defense_schedules s
             JOIN defense_council_members m ON m.council_id = s.council_id
             WHERE s.group_id = ? AND s.status <> 'cancelled'
               AND m.lecturer_user_id = ? AND m.council_role = 'chair'"
        );
        $statement->execute([$groupId, $actor['id']]);
        $isChair = $statement->fetchColumn() !== false;
    }
    apiRequire(
        $isChair,
        403,
        'Chỉ quản trị viên hoặc chủ tịch hội đồng bảo vệ của nhóm mới được quản lý điểm tổng kết.'
    );
    return $group;
}

/** Kiểm tra nhóm chỉ có một lịch bảo vệ còn hiệu lực và hội đồng không trùng khung giờ. */
function defenseAssertNoConflict(
    PDO $pdo,
    int $groupId,
    int $councilId,
    string $defenseAt,
    string $status,
    ?int $ignoreScheduleId
): void {
    $ignore = $ignoreScheduleId ?? 0;
    if ($status !== 'cancelled') {
        $statement = $pdo->prepare(
            "SELECT 1 FROM defense_schedules WHERE group_id = ? AND status <> 'cancelled' AND id <> ? LIMIT 1"
        );
        $statement->execute([$groupId, $ignore]);
        apiRequire(
            $statement->fetchColumn() === false,
            409,
            'Nhóm này đã có lịch bảo vệ. Hãy cập nhật lịch hiện có thay vì tạo thêm.'
        );
    }
    if (!in_array($status, ['cancelled', 'postponed'], true)) {
        $statement = $pdo->prepare(
            "SELECT 1 FROM defense_schedules
             WHERE council_id = ? AND defense_at = ? AND status NOT IN ('cancelled', 'postponed') AND id <> ?
             LIMIT 1"
        );
        $statement->execute([$councilId, $defenseAt, $ignore]);
        apiRequire($statement->fetchColumn() === false, 409, 'Hội đồng đã có lịch bảo vệ vào thời điểm này.');
    }
}

/** Điểm gợi ý theo trọng số; null nếu chưa có điểm bảo vệ. */
function defenseSuggestedTotal(?float $reportScore, ?float $defenseScore): ?float
{
    if ($defenseScore === null) {
        return null;
    }
    if ($reportScore === null) {
        return round($defenseScore, 2);
    }
    return round(DEFENSE_REPORT_WEIGHT * $reportScore + DEFENSE_DEFENSE_WEIGHT * $defenseScore, 2);
}

try {
    require_once __DIR__ . '/../../database/database.php';
    $pdo = $conn;
    $actor = apiRequireActor($pdo);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? ($method === 'GET' ? 'schedules' : '');
    $body = in_array($method, ['POST', 'PATCH'], true) ? apiReadJsonBody() : [];
    if (in_array($method, ['POST', 'PATCH'], true)) {
        apiRequireCsrf($body);
    }

    if ($method === 'GET' && $action === 'lecturers') {
        defenseRequireRole($actor, ['admin'], 'Chỉ quản trị viên mới xem được danh sách giảng viên.');
        $statement = $pdo->query(
            "SELECT id, full_name FROM users
             WHERE role = 'lecturer' AND account_status = 'active'
             ORDER BY full_name"
        );
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'GET' && $action === 'councils') {
        defenseRequireRole($actor, ['admin', 'lecturer'], 'Sinh viên không có quyền xem hội đồng bảo vệ.');
        $sql = 'SELECT c.id, c.project_round_id, pr.round_name, c.name, c.created_at
                FROM defense_councils c
                JOIN project_rounds pr ON pr.id = c.project_round_id';
        $conditions = [];
        $params = [];
        if ($actor['role'] === 'lecturer') {
            $conditions[] = 'EXISTS (
                SELECT 1 FROM defense_council_members m
                WHERE m.council_id = c.id AND m.lecturer_user_id = ?
            )';
            $params[] = $actor['id'];
        }
        if (isset($_GET['round_id'])) {
            $conditions[] = 'c.project_round_id = ?';
            $params[] = defenseId($_GET['round_id'], 'round_id');
        }
        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' ORDER BY c.project_round_id DESC, c.name';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $councils = $statement->fetchAll(PDO::FETCH_ASSOC);
        foreach ($councils as &$council) {
            $council['members'] = defenseCouncilMembers($pdo, (int) $council['id']);
        }
        unset($council);
        apiRespond(200, ['data' => $councils]);
    }

    if ($method === 'POST' && $action === 'create_council') {
        defenseRequireRole($actor, ['admin'], 'Chỉ quản trị viên mới được tạo hội đồng bảo vệ.');
        $roundId = defenseId($body['project_round_id'] ?? null, 'project_round_id');
        $name = defenseText($body, 'name', 150, true);
        $statement = $pdo->prepare('SELECT 1 FROM project_rounds WHERE id = ?');
        $statement->execute([$roundId]);
        apiRequire($statement->fetchColumn() !== false, 404, 'Không tìm thấy đợt đồ án.');
        $members = defenseNormalizeMembers($pdo, $body['members'] ?? null);

        $pdo->beginTransaction();
        $pdo->prepare('INSERT INTO defense_councils (project_round_id, name) VALUES (?, ?)')->execute([$roundId, $name]);
        $councilId = (int) $pdo->lastInsertId();
        $insert = $pdo->prepare(
            'INSERT INTO defense_council_members (council_id, lecturer_user_id, council_role) VALUES (?, ?, ?)'
        );
        foreach ($members as $lecturerId => $role) {
            $insert->execute([$councilId, $lecturerId, $role]);
        }
        $pdo->commit();
        apiRespond(201, ['data' => ['id' => $councilId]]);
    }

    if ($method === 'PATCH' && $action === 'update_council') {
        defenseRequireRole($actor, ['admin'], 'Chỉ quản trị viên mới được cập nhật hội đồng bảo vệ.');
        $id = defenseId($body['id'] ?? null, 'id');
        defenseLoadCouncil($pdo, $id);
        apiRequire(
            array_key_exists('name', $body) || array_key_exists('members', $body),
            400,
            'Không có trường nào để cập nhật.'
        );

        $pdo->beginTransaction();
        $pdo->prepare('SELECT id FROM defense_councils WHERE id = ? FOR UPDATE')->execute([$id]);
        if (array_key_exists('name', $body)) {
            $pdo->prepare('UPDATE defense_councils SET name = ? WHERE id = ?')
                ->execute([defenseText($body, 'name', 150, true), $id]);
        }
        if (array_key_exists('members', $body)) {
            $members = defenseNormalizeMembers($pdo, $body['members']);
            $scored = $pdo->prepare(
                'SELECT DISTINCT ds.lecturer_user_id
                 FROM defense_scores ds
                 JOIN defense_schedules s ON s.id = ds.schedule_id
                 WHERE s.council_id = ?'
            );
            $scored->execute([$id]);
            foreach ($scored->fetchAll(PDO::FETCH_COLUMN) as $scorerId) {
                apiRequire(
                    isset($members[(int) $scorerId]),
                    409,
                    'Giảng viên đã chấm điểm bảo vệ không thể bị loại khỏi hội đồng.'
                );
            }
            $pdo->prepare('DELETE FROM defense_council_members WHERE council_id = ?')->execute([$id]);
            $insert = $pdo->prepare(
                'INSERT INTO defense_council_members (council_id, lecturer_user_id, council_role) VALUES (?, ?, ?)'
            );
            foreach ($members as $lecturerId => $role) {
                $insert->execute([$id, $lecturerId, $role]);
            }
        }
        $pdo->commit();
        apiRespond(200, ['message' => 'Đã cập nhật hội đồng bảo vệ.']);
    }

    if ($method === 'GET' && $action === 'schedules') {
        $sql = 'SELECT s.id, s.council_id, c.name AS council_name, s.group_id, g.group_name, g.group_code,
                       s.defense_at, s.location, s.status, s.note, s.created_at, s.updated_at,
                       (SELECT m.council_role FROM defense_council_members m
                        WHERE m.council_id = s.council_id AND m.lecturer_user_id = ?) AS my_council_role
                FROM defense_schedules s
                JOIN defense_councils c ON c.id = s.council_id
                JOIN student_groups g ON g.id = s.group_id';
        $params = [$actor['id']];
        $conditions = [];
        if ($actor['role'] === 'student') {
            $conditions[] = "(g.leader_user_id = ? OR EXISTS (
                SELECT 1 FROM group_members gm
                WHERE gm.group_id = g.id AND gm.user_id = ? AND gm.status = 'active'
            ))";
            array_push($params, $actor['id'], $actor['id']);
        } elseif ($actor['role'] === 'lecturer') {
            $conditions[] = '(EXISTS (
                SELECT 1 FROM defense_council_members cm
                WHERE cm.council_id = s.council_id AND cm.lecturer_user_id = ?
            ) OR EXISTS (
                SELECT 1 FROM group_lecturers gl
                WHERE gl.group_id = g.id AND gl.lecturer_user_id = ?
                  AND (SELECT COUNT(*) FROM group_lecturers workload
                       WHERE workload.lecturer_user_id = gl.lecturer_user_id) >= 2
            ))';
            array_push($params, $actor['id'], $actor['id']);
        }
        if (isset($_GET['group_id'])) {
            $conditions[] = 's.group_id = ?';
            $params[] = defenseId($_GET['group_id'], 'group_id');
        }
        if (isset($_GET['council_id'])) {
            $conditions[] = 's.council_id = ?';
            $params[] = defenseId($_GET['council_id'], 'council_id');
        }
        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' ORDER BY s.defense_at, s.id';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        apiRespond(200, ['data' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'GET' && $action === 'schedule') {
        $schedule = defenseLoadSchedule($pdo, defenseId($_GET['id'] ?? null, 'id'));
        apiRequire(
            defenseCanViewSchedule($pdo, $schedule, $actor),
            403,
            'Bạn không có quyền xem lịch bảo vệ này.'
        );
        $councilRole = $actor['role'] === 'lecturer'
            ? defenseCouncilRole($pdo, (int) $schedule['council_id'], $actor['id'])
            : null;
        $schedule['my_council_role'] = $councilRole;
        $schedule['council_members'] = defenseCouncilMembers($pdo, (int) $schedule['council_id']);
        $schedule['students'] = defenseGroupStudents($pdo, (int) $schedule['group_id']);
        $schedule['scores'] = [];
        if ($actor['role'] === 'admin' || $councilRole !== null) {
            $statement = $pdo->prepare(
                'SELECT ds.id, ds.student_user_id, student.full_name AS student_name,
                        ds.lecturer_user_id, lecturer.full_name AS lecturer_name,
                        ds.score, ds.comment, ds.graded_at
                 FROM defense_scores ds
                 JOIN users student ON student.id = ds.student_user_id
                 JOIN users lecturer ON lecturer.id = ds.lecturer_user_id
                 WHERE ds.schedule_id = ?
                 ORDER BY student.full_name, lecturer.full_name'
            );
            $statement->execute([(int) $schedule['id']]);
            $schedule['scores'] = $statement->fetchAll(PDO::FETCH_ASSOC);
        }
        apiRespond(200, ['data' => $schedule]);
    }

    if ($method === 'POST' && $action === 'create_schedule') {
        defenseRequireRole($actor, ['admin'], 'Chỉ quản trị viên mới được lên lịch bảo vệ.');
        $councilId = defenseId($body['council_id'] ?? null, 'council_id');
        $groupId = defenseId($body['group_id'] ?? null, 'group_id');
        $defenseAt = defenseDateTime($body['defense_at'] ?? null, 'defense_at');
        apiRequire($defenseAt !== null, 400, 'defense_at không được để trống.');
        $location = defenseText($body, 'location', 150, false);
        $note = defenseText($body, 'note', 2000, false);
        $status = $body['status'] ?? 'scheduled';
        apiRequire(
            in_array($status, ['scheduled', 'completed', 'postponed', 'cancelled'], true),
            400,
            'Trạng thái lịch bảo vệ không hợp lệ.'
        );

        $pdo->beginTransaction();
        $statement = $pdo->prepare('SELECT id, project_round_id, status FROM student_groups WHERE id = ? FOR UPDATE');
        $statement->execute([$groupId]);
        $group = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($group !== false, 404, 'Không tìm thấy nhóm.');
        apiRequire($group['status'] !== 'dissolved', 409, 'Nhóm đã giải thể, không thể lên lịch bảo vệ.');
        $statement = $pdo->prepare('SELECT id, project_round_id FROM defense_councils WHERE id = ? FOR UPDATE');
        $statement->execute([$councilId]);
        $council = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($council !== false, 404, 'Không tìm thấy hội đồng bảo vệ.');
        apiRequire(
            (int) $council['project_round_id'] === (int) $group['project_round_id'],
            400,
            'Nhóm và hội đồng phải thuộc cùng một đợt đồ án.'
        );
        defenseAssertNoConflict($pdo, $groupId, $councilId, $defenseAt, $status, null);
        $pdo->prepare(
            'INSERT INTO defense_schedules (council_id, group_id, defense_at, location, status, note)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([$councilId, $groupId, $defenseAt, $location, $status, $note]);
        $scheduleId = (int) $pdo->lastInsertId();
        $pdo->commit();
        apiRespond(201, ['data' => ['id' => $scheduleId]]);
    }

    if ($method === 'PATCH' && $action === 'update_schedule') {
        defenseRequireRole($actor, ['admin'], 'Chỉ quản trị viên mới được cập nhật lịch bảo vệ.');
        $id = defenseId($body['id'] ?? null, 'id');
        $pdo->beginTransaction();
        $statement = $pdo->prepare(
            'SELECT id, council_id, group_id, defense_at, status FROM defense_schedules WHERE id = ? FOR UPDATE'
        );
        $statement->execute([$id]);
        $current = $statement->fetch(PDO::FETCH_ASSOC);
        apiRequire($current !== false, 404, 'Không tìm thấy lịch bảo vệ.');

        $updates = [];
        $params = [];
        $defenseAt = $current['defense_at'];
        $status = $current['status'];
        if (array_key_exists('defense_at', $body)) {
            $defenseAt = defenseDateTime($body['defense_at'], 'defense_at');
            apiRequire($defenseAt !== null, 400, 'defense_at không được để trống.');
            $updates[] = 'defense_at = ?';
            $params[] = $defenseAt;
        }
        if (array_key_exists('location', $body)) {
            $updates[] = 'location = ?';
            $params[] = defenseText($body, 'location', 150, false);
        }
        if (array_key_exists('note', $body)) {
            $updates[] = 'note = ?';
            $params[] = defenseText($body, 'note', 2000, false);
        }
        if (array_key_exists('status', $body)) {
            apiRequire(
                in_array($body['status'], ['scheduled', 'completed', 'postponed', 'cancelled'], true),
                400,
                'Trạng thái lịch bảo vệ không hợp lệ.'
            );
            $status = $body['status'];
            $updates[] = 'status = ?';
            $params[] = $status;
        }
        apiRequire($updates !== [], 400, 'Không có trường nào để cập nhật.');
        defenseAssertNoConflict(
            $pdo,
            (int) $current['group_id'],
            (int) $current['council_id'],
            (string) $defenseAt,
            (string) $status,
            $id
        );
        $params[] = $id;
        $pdo->prepare('UPDATE defense_schedules SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
        $pdo->commit();
        apiRespond(200, ['message' => 'Đã cập nhật lịch bảo vệ.']);
    }

    if ($method === 'POST' && $action === 'score') {
        defenseRequireRole($actor, ['lecturer'], 'Chỉ giảng viên trong hội đồng mới được chấm điểm bảo vệ.');
        $scheduleId = defenseId($body['schedule_id'] ?? null, 'schedule_id');
        $studentId = defenseId($body['student_user_id'] ?? null, 'student_user_id');
        $score = defenseScore($body['score'] ?? null, 'score');
        $comment = defenseText($body, 'comment', 2000, false);

        $schedule = defenseLoadSchedule($pdo, $scheduleId);
        apiRequire(
            defenseCouncilRole($pdo, (int) $schedule['council_id'], $actor['id']) !== null,
            403,
            'Bạn không thuộc hội đồng của lịch bảo vệ này.'
        );
        apiRequire(
            in_array($schedule['status'], ['scheduled', 'completed'], true),
            409,
            'Lịch bảo vệ đã hoãn hoặc đã hủy nên chưa thể chấm điểm.'
        );
        $statement = $pdo->prepare(
            "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
        );
        $statement->execute([(int) $schedule['group_id'], $studentId]);
        apiRequire($statement->fetchColumn() !== false, 400, 'Sinh viên không phải thành viên đang hoạt động của nhóm.');

        $pdo->beginTransaction();
        $statement = $pdo->prepare(
            'SELECT status FROM final_grades WHERE group_id = ? AND student_user_id = ? FOR UPDATE'
        );
        $statement->execute([(int) $schedule['group_id'], $studentId]);
        apiRequire(
            $statement->fetchColumn() !== 'published',
            409,
            'Điểm tổng kết đã được công bố nên không thể sửa điểm bảo vệ.'
        );
        $pdo->prepare(
            'INSERT INTO defense_scores (schedule_id, student_user_id, lecturer_user_id, score, comment)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE score = VALUES(score), comment = VALUES(comment), graded_at = CURRENT_TIMESTAMP'
        )->execute([$scheduleId, $studentId, $actor['id'], $score, $comment]);
        $pdo->commit();
        apiRespond(200, ['data' => ['schedule_id' => $scheduleId, 'student_user_id' => $studentId, 'score' => $score]]);
    }

    if ($method === 'GET' && $action === 'grade_summary') {
        $groupId = defenseId($_GET['group_id'] ?? null, 'group_id');
        $group = defenseRequireGradeManager($pdo, $groupId, $actor);

        $statement = $pdo->prepare(
            'SELECT AVG(rf.score)
             FROM report_feedback rf
             JOIN report_versions rv ON rv.id = rf.report_version_id
             JOIN reports r ON r.id = rv.report_id
             WHERE r.group_id = ? AND rf.score IS NOT NULL
               AND rv.version_no = (SELECT MAX(latest.version_no) FROM report_versions latest WHERE latest.report_id = r.id)'
        );
        $statement->execute([$groupId]);
        $reportAverage = $statement->fetchColumn();
        $reportScore = $reportAverage === false || $reportAverage === null ? null : round((float) $reportAverage, 2);

        $statement = $pdo->prepare(
            'SELECT ds.student_user_id, AVG(ds.score) AS defense_score, COUNT(*) AS score_count
             FROM defense_scores ds
             JOIN defense_schedules s ON s.id = ds.schedule_id
             WHERE s.group_id = ?
             GROUP BY ds.student_user_id'
        );
        $statement->execute([$groupId]);
        $defenseScores = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $defenseScores[(int) $row['student_user_id']] = $row;
        }

        $statement = $pdo->prepare(
            'SELECT student_user_id, total_score, status, note, published_at, updated_at
             FROM final_grades WHERE group_id = ?'
        );
        $statement->execute([$groupId]);
        $grades = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $grades[(int) $row['student_user_id']] = $row;
        }

        $statement = $pdo->prepare(
            "SELECT (SELECT COUNT(*) FROM defense_council_members m WHERE m.council_id = s.council_id)
             FROM defense_schedules s
             WHERE s.group_id = ? AND s.status <> 'cancelled'
             ORDER BY s.defense_at DESC, s.id DESC LIMIT 1"
        );
        $statement->execute([$groupId]);
        $councilSize = $statement->fetchColumn();

        $students = [];
        foreach (defenseGroupStudents($pdo, $groupId) as $student) {
            $studentId = (int) $student['user_id'];
            $defenseRow = $defenseScores[$studentId] ?? null;
            $defenseScore = $defenseRow === null ? null : round((float) $defenseRow['defense_score'], 2);
            $students[] = [
                'user_id' => $studentId,
                'full_name' => $student['full_name'],
                'student_code' => $student['student_code'],
                'defense_score' => $defenseScore,
                'defense_score_count' => $defenseRow === null ? 0 : (int) $defenseRow['score_count'],
                'suggested_total' => defenseSuggestedTotal($reportScore, $defenseScore),
                'grade' => $grades[$studentId] ?? null,
            ];
        }
        apiRespond(200, [
            'data' => [
                'group_id' => $groupId,
                'group_name' => $group['group_name'],
                'report_score' => $reportScore,
                'council_member_count' => $councilSize === false ? null : (int) $councilSize,
                'weights' => ['report' => DEFENSE_REPORT_WEIGHT, 'defense' => DEFENSE_DEFENSE_WEIGHT],
                'students' => $students,
            ],
        ]);
    }

    if ($method === 'POST' && $action === 'save_grade') {
        $groupId = defenseId($body['group_id'] ?? null, 'group_id');
        $studentId = defenseId($body['student_user_id'] ?? null, 'student_user_id');
        defenseRequireGradeManager($pdo, $groupId, $actor);
        $totalScore = defenseScore($body['total_score'] ?? null, 'total_score');
        $note = defenseText($body, 'note', 2000, false);
        $status = $body['status'] ?? 'draft';
        apiRequire(in_array($status, ['draft', 'published'], true), 400, 'Trạng thái điểm không hợp lệ.');
        $statement = $pdo->prepare(
            "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
        );
        $statement->execute([$groupId, $studentId]);
        apiRequire($statement->fetchColumn() !== false, 400, 'Sinh viên không phải thành viên đang hoạt động của nhóm.');

        $isPublished = $status === 'published';
        $pdo->prepare(
            'INSERT INTO final_grades (group_id, student_user_id, total_score, status, note, published_at)
             VALUES (?, ?, ?, ?, ?, ' . ($isPublished ? 'CURRENT_TIMESTAMP' : 'NULL') . ')
             ON DUPLICATE KEY UPDATE total_score = VALUES(total_score), status = VALUES(status), note = VALUES(note),
                 published_at = ' . ($isPublished ? 'COALESCE(published_at, CURRENT_TIMESTAMP)' : 'NULL')
        )->execute([$groupId, $studentId, $totalScore, $status, $note]);
        apiRespond(200, ['data' => [
            'group_id' => $groupId,
            'student_user_id' => $studentId,
            'total_score' => $totalScore,
            'status' => $status,
        ]]);
    }

    if ($method === 'POST' && $action === 'publish_grades') {
        $groupId = defenseId($body['group_id'] ?? null, 'group_id');
        defenseRequireGradeManager($pdo, $groupId, $actor);
        $students = defenseGroupStudents($pdo, $groupId);
        apiRequire($students !== [], 409, 'Nhóm chưa có sinh viên đang hoạt động.');

        $pdo->beginTransaction();
        $statement = $pdo->prepare('SELECT student_user_id FROM final_grades WHERE group_id = ? FOR UPDATE');
        $statement->execute([$groupId]);
        $graded = array_map('intval', $statement->fetchAll(PDO::FETCH_COLUMN));
        $missing = array_filter(
            $students,
            static fn (array $student): bool => !in_array((int) $student['user_id'], $graded, true)
        );
        apiRequire(
            $missing === [],
            409,
            'Còn ' . count($missing) . ' sinh viên chưa có điểm tổng kết nên chưa thể công bố.'
        );
        $placeholders = implode(', ', array_fill(0, count($students), '?'));
        $update = $pdo->prepare(
            "UPDATE final_grades
             SET status = 'published', published_at = COALESCE(published_at, CURRENT_TIMESTAMP)
             WHERE group_id = ? AND status = 'draft' AND student_user_id IN ($placeholders)"
        );
        $update->execute([$groupId, ...array_map(static fn (array $student): int => (int) $student['user_id'], $students)]);
        $published = $update->rowCount();
        $pdo->commit();
        apiRespond(200, ['data' => ['published' => $published]]);
    }

    apiRespond(404, ['error' => 'Không tìm thấy thao tác API.']);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.']);
} catch (RuntimeException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $status = $exception->getCode();
    apiRespond($status >= 400 && $status <= 599 ? $status : 400, ['error' => $exception->getMessage()]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($exception->getMessage());
    apiRespond(500, ['error' => 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.']);
}

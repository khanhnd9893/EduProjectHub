<?php
declare(strict_types=1);

const CHATBOT_CONTEXT_LIMIT = 20;

/** Thu gọn văn bản trên một dòng để đưa vào prompt. */
function chatbotContextText(?string $text, int $max = 200): string
{
    $text = trim(preg_replace('/\s+/u', ' ', (string) $text) ?? '');
    return mb_strlen($text, 'UTF-8') > $max ? mb_substr($text, 0, $max, 'UTF-8') . '…' : $text;
}

/** @return list<array<string, mixed>> */
function chatbotContextRows(PDO $pdo, string $sql, array $params = []): array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Tổng hợp dữ liệu thật mà người dùng hiện tại được phép xem, dưới dạng văn bản cho AI.
 * Phạm vi quyền giữ nguyên quy tắc của các API khác: sinh viên chỉ thấy nhóm của mình,
 * giảng viên chỉ thấy nhóm được phân công (đủ 2 nhóm trở lên), điểm chỉ của chính sinh viên.
 */
function chatbotBuildUserContext(PDO $pdo, array $actor): string
{
    $lines = ['Thời gian hiện tại: ' . $pdo->query('SELECT NOW()')->fetchColumn() . '.'];
    $role = $actor['role'];
    $isStudent = in_array($role, ['student', 'team_leader'], true);
    $limit = CHATBOT_CONTEXT_LIMIT;

    $rounds = chatbotContextRows(
        $pdo,
        "SELECT round_name, semester, academic_year, start_date, end_date, status FROM project_rounds
         WHERE status IN ('open', 'in_progress') ORDER BY end_date LIMIT $limit"
    );
    $lines[] = "\nĐợt đồ án đang diễn ra:";
    foreach ($rounds as $r) {
        $lines[] = "- {$r['round_name']} ({$r['semester']} {$r['academic_year']}), {$r['start_date']} → {$r['end_date']}, trạng thái {$r['status']}";
    }
    if (!$rounds) {
        $lines[] = '- (không có)';
    }

    $topics = chatbotContextRows(
        $pdo,
        "SELECT t.topic_code, t.title, t.description, t.max_groups, u.full_name AS supervisor
         FROM project_topics t LEFT JOIN users u ON u.id = t.supervisor_user_id
         WHERE t.status = 'open' ORDER BY t.id LIMIT $limit"
    );
    $lines[] = "\nĐề tài đang mở đăng ký:";
    foreach ($topics as $t) {
        $lines[] = "- [{$t['topic_code']}] {$t['title']} — GVHD: " . ($t['supervisor'] ?: 'chưa có')
            . ", tối đa {$t['max_groups']} nhóm. " . chatbotContextText($t['description']);
    }
    if (!$topics) {
        $lines[] = '- (không có)';
    }

    if ($role === 'admin' || $role === 'training_manager') {
        $stats = chatbotContextRows(
            $pdo,
            "SELECT (SELECT COUNT(*) FROM student_groups WHERE status <> 'dissolved') AS groups_count,
                    (SELECT COUNT(*) FROM topic_registrations WHERE status = 'pending') AS pending_registrations,
                    (SELECT COUNT(*) FROM tasks WHERE status IN ('todo', 'in_progress')) AS open_tasks,
                    (SELECT COUNT(*) FROM users WHERE role IN ('student', 'team_leader') AND account_status = 'active') AS students"
        )[0];
        $lines[] = "\nThống kê toàn hệ thống: {$stats['students']} sinh viên, {$stats['groups_count']} nhóm, "
            . "{$stats['pending_registrations']} đăng ký đề tài chờ duyệt, {$stats['open_tasks']} nhiệm vụ chưa xong.";
        return implode("\n", $lines);
    }

    if ($isStudent) {
        $groups = chatbotContextRows(
            $pdo,
            "SELECT DISTINCT g.id, g.group_code, g.group_name, g.status, g.leader_user_id, r.round_name
             FROM student_groups g
             LEFT JOIN project_rounds r ON r.id = g.project_round_id
             WHERE g.status <> 'dissolved' AND (
                 g.leader_user_id = ?
                 OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = ? AND gm.status = 'active')
             ) LIMIT $limit",
            [$actor['id'], $actor['id']]
        );
    } else {
        $groups = chatbotContextRows(
            $pdo,
            "SELECT g.id, g.group_code, g.group_name, g.status, g.leader_user_id, r.round_name
             FROM student_groups g
             JOIN group_lecturers gl ON gl.group_id = g.id AND gl.lecturer_user_id = ?
             LEFT JOIN project_rounds r ON r.id = g.project_round_id
             WHERE g.status <> 'dissolved'
               AND (SELECT COUNT(*) FROM group_lecturers w WHERE w.lecturer_user_id = gl.lecturer_user_id) >= 2
             LIMIT $limit",
            [$actor['id']]
        );
    }

    $lines[] = $isStudent ? "\nNhóm của người dùng:" : "\nNhóm người dùng đang hướng dẫn:";
    foreach ($groups as $g) {
        $lines[] = "- {$g['group_code']} “{$g['group_name']}” (đợt {$g['round_name']}, trạng thái {$g['status']})"
            . ($isStudent && (int) $g['leader_user_id'] === $actor['id'] ? ' — người dùng là trưởng nhóm' : '');
    }
    if (!$groups) {
        $lines[] = '- (chưa có nhóm nào)';
        return implode("\n", $lines);
    }

    $groupIds = array_map(static fn (array $g) => (int) $g['id'], $groups);
    $marks = implode(', ', array_fill(0, count($groupIds), '?'));
    $groupCodes = array_column($groups, 'group_code', 'id');

    $lines[] = "\nĐăng ký đề tài của các nhóm:";
    $registrations = chatbotContextRows(
        $pdo,
        "SELECT tr.group_id, t.topic_code, t.title, tr.status FROM topic_registrations tr
         JOIN project_topics t ON t.id = tr.topic_id
         WHERE tr.group_id IN ($marks) AND tr.status IN ('pending', 'approved')",
        $groupIds
    );
    foreach ($registrations as $x) {
        $lines[] = "- Nhóm {$groupCodes[$x['group_id']]}: [{$x['topic_code']}] {$x['title']} — {$x['status']}";
    }
    if (!$registrations) {
        $lines[] = '- (chưa đăng ký đề tài nào)';
    }

    $lines[] = "\nNhiệm vụ chưa hoàn thành (sắp xếp theo hạn):";
    $tasks = chatbotContextRows(
        $pdo,
        "SELECT t.group_id, t.title, t.status, t.priority, t.due_at, u.full_name AS assignee
         FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
         WHERE t.group_id IN ($marks) AND t.status IN ('todo', 'in_progress')
         ORDER BY t.due_at IS NULL, t.due_at LIMIT $limit",
        $groupIds
    );
    foreach ($tasks as $x) {
        $lines[] = "- Nhóm {$groupCodes[$x['group_id']]}: {$x['title']} — {$x['status']}, ưu tiên {$x['priority']}, hạn "
            . ($x['due_at'] ?: 'chưa đặt') . ', giao cho ' . ($x['assignee'] ?: 'chưa ai');
    }
    if (!$tasks) {
        $lines[] = '- (không có)';
    }

    $lines[] = "\nBáo cáo và hạn nộp:";
    $reports = chatbotContextRows(
        $pdo,
        "SELECT group_id, title, report_type, deadline, status FROM reports
         WHERE group_id IN ($marks) ORDER BY deadline DESC LIMIT $limit",
        $groupIds
    );
    foreach ($reports as $x) {
        $lines[] = "- Nhóm {$groupCodes[$x['group_id']]}: {$x['title']} ({$x['report_type']}), hạn "
            . ($x['deadline'] ?: 'chưa đặt') . ", trạng thái {$x['status']}";
    }
    if (!$reports) {
        $lines[] = '- (không có)';
    }

    if ($isStudent) {
        $grades = chatbotContextRows(
            $pdo,
            "SELECT total_score, note FROM final_grades WHERE student_user_id = ? AND status = 'published'",
            [$actor['id']]
        );
        $lines[] = "\nĐiểm tổng kết đã công bố của người dùng:";
        foreach ($grades as $x) {
            $lines[] = "- {$x['total_score']}/10" . ($x['note'] ? ' — ' . chatbotContextText($x['note']) : '');
        }
        if (!$grades) {
            $lines[] = '- (chưa có điểm được công bố)';
        }
    }

    return implode("\n", $lines);
}

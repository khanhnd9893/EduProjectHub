USE eduprojecthub;

-- =========================================================
-- VIEWS: truy van du lieu thuong dung cho giao dien.
-- Chi chay sau khi da tao student_groups va group_members.
-- =========================================================

CREATE OR REPLACE VIEW vw_group_list AS
SELECT
    sg.id,
    sg.group_code,
    sg.group_name,
    sg.description,
    sg.status,
    sg.project_round_id,
    pr.round_name,
    sg.leader_user_id,
    leader.full_name AS leader_name,
    COUNT(CASE WHEN gm.status = 'active' THEN 1 END) AS active_member_count,
    sg.created_at
FROM student_groups sg
JOIN project_rounds pr ON pr.id = sg.project_round_id
JOIN users leader ON leader.id = sg.leader_user_id
LEFT JOIN group_members gm ON gm.group_id = sg.id
GROUP BY
    sg.id, sg.group_code, sg.group_name, sg.description, sg.status,
    sg.project_round_id, pr.round_name, sg.leader_user_id,
    leader.full_name, sg.created_at;

CREATE OR REPLACE VIEW vw_group_member_details AS
SELECT
    gm.id AS group_member_id,
    sg.id AS group_id,
    sg.group_code,
    sg.group_name,
    u.id AS user_id,
    u.student_code,
    u.full_name,
    u.email,
    gm.member_role,
    gm.status AS membership_status,
    gm.joined_at,
    gm.left_at
FROM group_members gm
JOIN student_groups sg ON sg.id = gm.group_id
JOIN users u ON u.id = gm.user_id;

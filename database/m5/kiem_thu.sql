USE eduprojecthub;

-- =========================================================
-- CAC TRUY VAN KIEM THU / THAM KHAO CHO BACKEND
-- =========================================================

-- 1. Danh sach nhom va so thanh vien dang hoat dong.
SELECT * FROM vw_group_list ORDER BY created_at DESC;

-- 2. Danh sach thanh vien cua mot nhom.
SELECT *
FROM vw_group_member_details
WHERE group_id = 1 AND membership_status = 'active';

-- 3. Tim nhom cua mot sinh vien trong mot dot do an.
SELECT sg.*
FROM student_groups sg
JOIN group_members gm ON gm.group_id = sg.id
WHERE gm.user_id = 1
  AND gm.status = 'active'
  AND sg.project_round_id = 1;

-- 4. Danh sach loi moi dang cho cua mot sinh vien.
SELECT gi.*, sg.group_name, inviter.full_name AS invited_by_name
FROM group_invitations gi
JOIN student_groups sg ON sg.id = gi.group_id
JOIN users inviter ON inviter.id = gi.invited_by
WHERE gi.invited_user_id = 4 AND gi.status = 'pending';

-- 5. Danh sach yeu cau tham gia dang cho cua mot nhom.
SELECT gr.*, u.full_name, u.student_code
FROM group_requests gr
JOIN users u ON u.id = gr.user_id
WHERE gr.group_id = 1 AND gr.status = 'pending';

-- 6. Thong ke so nhom theo trang thai.
SELECT status, COUNT(*) AS total_groups
FROM student_groups
GROUP BY status;

-- 7. Sinh vien chua tham gia nhom nao trong dot 1.
SELECT u.id, u.student_code, u.full_name
FROM users u
WHERE u.role = 'student'
  AND NOT EXISTS (
      SELECT 1
      FROM group_members gm
      JOIN student_groups sg ON sg.id = gm.group_id
      WHERE gm.user_id = u.id
        AND gm.status = 'active'
        AND sg.project_round_id = 1
        AND sg.status IN ('forming', 'active')
  );

-- 8. Cap nhat thanh vien roi nhom (khong xoa vat ly).
UPDATE group_members
SET status = 'left', left_at = CURRENT_TIMESTAMP
WHERE group_id = 1 AND user_id = 3 AND status = 'active';

-- 9. Doi truong nhom: chay trong transaction.
-- Thay user_id = 2 bang ID thanh vien moi.
START TRANSACTION;
UPDATE group_members
SET member_role = 'member'
WHERE group_id = 1 AND member_role = 'leader' AND status = 'active';

UPDATE group_members
SET member_role = 'leader'
WHERE group_id = 1 AND user_id = 2 AND status = 'active';
COMMIT;

-- 10. Xem ket qua dong bo truong nhom.
SELECT sg.group_name, sg.leader_user_id, u.full_name AS leader_name
FROM student_groups sg
JOIN users u ON u.id = sg.leader_user_id
WHERE sg.id = 1;

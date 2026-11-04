USE eduprojecthub;

-- =========================================================
-- DU LIEU MAU DE KIEM THU
-- Chi chay mot lan tren database moi.
-- =========================================================

INSERT INTO users
(student_code, full_name, email, password_hash, role)
VALUES
('SV001', 'Nguyen Van An', 'sv001@example.com', '$2y$example_hash_001', 'student'),
('SV002', 'Tran Thi Binh', 'sv002@example.com', '$2y$example_hash_002', 'student'),
('SV003', 'Le Van Cuong', 'sv003@example.com', '$2y$example_hash_003', 'student'),
('SV004', 'Pham Thi Dung', 'sv004@example.com', '$2y$example_hash_004', 'student'),
('GV001', 'Nguyen Van Giang', 'gv001@example.com', '$2y$example_hash_005', 'lecturer'),
('AD001', 'Quan tri he thong', 'admin@example.com', '$2y$example_hash_006', 'admin');

INSERT INTO project_rounds
(round_code, round_name, semester, academic_year, start_date, end_date, min_members, max_members, status)
VALUES
('DA_HK1_2026', 'Do an hoc ky 1 nam 2026', 'Hoc ky 1', '2026-2027',
 '2026-09-01', '2027-01-31', 2, 5, 'open');

-- Tao nhom: leader_user_id tam thoi la SV001.
INSERT INTO student_groups
(group_code, group_name, description, project_round_id, leader_user_id, created_by, status)
VALUES
('GR001', 'Nhom EduProjectHub', 'Nhom phat trien he thong quan ly do an sinh vien',
 1, 1, 1, 'active');

-- Them truong nhom va thanh vien.
INSERT INTO group_members (group_id, user_id, member_role, status)
VALUES
(1, 1, 'leader', 'active'),
(1, 2, 'member', 'active'),
(1, 3, 'member', 'active');

-- Loi moi mau: moi SV004 vao nhom.
INSERT INTO group_invitations
(group_id, invited_user_id, invited_by, message, status)
VALUES
(1, 4, 1, 'Moi ban tham gia nhom do an', 'pending');

-- Yeu cau tham gia mau (minh hoa trang thai).
INSERT INTO group_requests
(group_id, user_id, message, status)
VALUES
(1, 4, 'Toi muon tham gia nhom', 'pending');

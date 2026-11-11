-- Du lieu demo cho schema eduprojecthub. Chi import mot lan tren database moi.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT INTO users
(id, username, student_code, full_name, email, password_hash, role, account_status)
VALUES
(1, 'sv', 'SV001', 'Nguyễn Văn A', 'sv@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(2, 'gv', NULL, 'TS. Trần Thị B', 'gv@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'lecturer', 'active'),
(3, 'admin', NULL, 'Quản trị viên', 'admin@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'admin', 'active'),
(4, 'sv2', 'SV002', 'Lê Thị Cúc', 'sv2@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(5, 'sv3', 'SV003', 'Phạm Minh Đức', 'sv3@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(6, 'sv4', 'SV004', 'Võ Thanh Hà', 'sv4@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(7, 'sv5', 'SV005', 'Trần Minh Phúc', 'sv5@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(8, 'sv6', 'SV006', 'Hoàng Gia Bảo', 'sv6@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active');

INSERT INTO project_rounds
(id, round_code, round_name, semester, academic_year, start_date, end_date, min_members, max_members, status)
VALUES
(1, 'DA_HK1_2026', 'Đồ án học kỳ 1 năm 2026', 'Học kỳ 1', '2026-2027',
 '2026-09-01', '2027-01-31', 2, 7, 'open');

INSERT INTO student_groups
(id, group_code, group_name, description, project_round_id, leader_user_id, created_by, status)
VALUES
(1, 'N01', 'Nhóm EduProjectHub', 'Xây dựng hệ thống quản lý đồ án sinh viên.', 1, 1, 1, 'active'),
(2, 'N02', 'Nhóm Thư viện số', 'Ứng dụng tra cứu tài liệu.', 1, 6, 6, 'forming');

INSERT INTO group_members (group_id, user_id, member_role, status) VALUES
(1, 5, 'member', 'active'),
(1, 4, 'member', 'active'),
(2, 7, 'member', 'active');

INSERT INTO group_lecturers (group_id, lecturer_user_id, assigned_by) VALUES
(1, 2, 3),
(2, 2, 3);

INSERT INTO tasks
(id, group_id, title, description, assigned_to, created_by, priority, status, due_at, completed_at)
VALUES
(1, 1, 'Phân tích yêu cầu', 'Tổng hợp yêu cầu hệ thống.', 1, 1, 'high', 'in_progress', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), NULL);

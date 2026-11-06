-- Du lieu demo cho hoi dong bao ve va diem so (FR06).
-- Chay SAU khi import database/seed.sql va database/schema-m6.sql.
-- Use only in local development.
USE spms;
SET NAMES utf8mb4;

-- Hoi dong bao ve cua hoc ky demo (semester_id = 1)
INSERT INTO defense_councils (id, semester_id, name) VALUES
(1, 1, 'Hoi dong bao ve 01');

-- Giang vien demo (lecturer_id = 1) lam chu tich hoi dong
INSERT INTO defense_council_members (council_id, lecturer_id, council_role) VALUES
(1, 1, 'chair');

-- Lich bao ve cho do an demo
INSERT INTO defense_schedules (id, council_id, project_id, defense_at, location, status, note) VALUES
(1, 1, 1, '2027-01-20 08:00:00', 'Phong A101', 'scheduled', 'Nhom chuan bi slide va demo he thong');

-- Diem bao ve (demo sau khi bao ve hoan thanh)
INSERT INTO defense_scores (schedule_id, student_id, lecturer_id, score, comment) VALUES
(1, 1, 1, 8.50, 'Nam vung de tai, tra loi tot, phan demo on');

-- Diem tong ket (ban nhap, chua cong bo)
INSERT INTO final_grades (project_id, student_id, total_score, status, note) VALUES
(1, 1, 8.30, 'draft', 'Tong hop diem qua trinh va diem bao ve');

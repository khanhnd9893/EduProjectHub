-- Du lieu demo cho phan bao cao (FR06).
-- Chay SAU khi import database/seed.sql va database/schema-m6.sql.
-- Use only in local development.
USE spms;
SET NAMES utf8mb4;

-- Dot bao cao cho do an demo (project_id = 1, tao boi giang vien user_id = 2)
INSERT INTO reports (id, project_id, title, report_type, description, deadline, status, created_by) VALUES
(1, 1, 'Bao cao tien do giua ky', 'midterm',
 'Bao cao ket qua dat duoc, ke hoach con lai va tai lieu kem theo.',
 '2026-11-20 23:59:00', 'open', 2),
(2, 1, 'Bao cao cuoi ky', 'final',
 'Bao cao tong ket toan bo do an, kem ma nguon va huong dan cai dat.',
 '2027-01-10 23:59:00', 'open', 2);

-- Sinh vien demo (student_id = 1) nop 2 phien ban bao cao giua ky
INSERT INTO report_versions (id, report_id, version_no, submitted_by, original_filename, stored_filename, mime_type, file_size, note) VALUES
(1, 1, 1, 1, 'bao-cao-giua-ky-v1.pdf', 'uploads/reports/1/v1_bao-cao-giua-ky.pdf', 'application/pdf', 245000, 'Nop lan dau'),
(2, 1, 2, 1, 'bao-cao-giua-ky-v2.pdf', 'uploads/reports/1/v2_bao-cao-giua-ky.pdf', 'application/pdf', 260000, 'Bo sung so do kien truc theo gop y');

-- Giang vien phan hoi phien ban 1 va cham phien ban 2 (thang 10)
INSERT INTO report_feedback (report_version_id, lecturer_id, content, score) VALUES
(1, 1, 'Bao cao day du nhung thieu so do kien truc he thong. Hay bo sung va nop lai.', NULL),
(2, 1, 'Da bo sung day du. Noi dung tot, can chinh sua loi chinh ta.', 8.00);

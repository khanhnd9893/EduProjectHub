-- Demo data cho phan M6 (FR06-FR07): bao cao, bao ve, diem so, chatbot FAQ.
-- Chay SAU khi da import database/seed.sql va database/schema-m6.sql.
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

-- FAQ chatbot: 2 cau da duyet, 1 cau ban nhap
INSERT INTO chatbot_faqs (question, answer, category, status, created_by) VALUES
('Khi nao het han dang ky de tai?',
 'Thoi han dang ky de tai duoc cong bo theo tung dot trong hoc ky. Ban xem chi tiet tai muc De tai sau khi dang nhap.',
 'De tai', 'published', 1),
('Toi nop bao cao o dau?',
 'Vao muc Bao cao cua do an, chon dot bao cao dang mo va tai tep len. He thong luu lai tung phien ban da nop.',
 'Bao cao', 'published', 1),
('Diem bao ve duoc tinh the nao?',
 'Cau tra loi dang duoc bien soan boi giang vien phu trach.',
 'Diem so', 'draft', 1);

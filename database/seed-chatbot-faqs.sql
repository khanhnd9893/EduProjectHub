-- Du lieu demo FAQ chatbot (FR07).
-- Chay SAU khi import database/seed.sql va database/schema-m6.sql.
-- Use only in local development.
USE spms;
SET NAMES utf8mb4;

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

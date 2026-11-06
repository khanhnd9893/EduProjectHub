-- Du lieu FAQ mau; import sau file examp.sql va schema-chatbot-faqs.sql.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT INTO chatbot_faqs (question, answer, category, status, created_by) VALUES
('Khi nào hết hạn đăng ký đề tài?',
 'Thời hạn đăng ký được công bố theo từng đợt trong học kỳ. Hãy xem mục Học kỳ để biết hạn cụ thể.',
 'Học kỳ', 'published', 3),
('Tôi nộp báo cáo ở đâu?',
 'Vào mục Báo cáo, chọn đợt đang mở và tải tệp PDF hoặc Word lên.',
 'Báo cáo', 'published', 3),
('Làm sao để xem điểm đồ án?',
 'Vào mục Điểm số để xem điểm tổng kết sau khi giảng viên công bố.',
 'Điểm số', 'published', 3),
('Làm sao để tham gia nhóm đồ án?',
 'Liên hệ trưởng nhóm hoặc giảng viên để được thêm vào nhóm đồ án.',
 'Nhóm', 'published', 3)
ON DUPLICATE KEY UPDATE answer = VALUES(answer);

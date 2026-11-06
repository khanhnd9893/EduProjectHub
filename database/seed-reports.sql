-- Du lieu mau bao cao; import sau file examp.sql va schema-reports.sql.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT IGNORE INTO reports
(id, group_id, title, report_type, description, deadline, status, created_by)
VALUES
(1, 1, 'Báo cáo giữa kỳ', 'midterm',
 'Tổng kết tiến độ, kết quả và kế hoạch thực hiện tiếp theo.',
 '2026-11-20 23:59:00', 'open', 2),
(2, 1, 'Báo cáo cuối kỳ', 'final',
 'Báo cáo hoàn chỉnh kèm phụ lục minh chứng.',
 '2027-01-10 23:59:00', 'open', 2);

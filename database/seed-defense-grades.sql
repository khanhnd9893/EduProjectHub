-- Du lieu mau bao ve va diem; import sau file examp.sql va schema-defense-grades.sql.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT IGNORE INTO defense_councils (id, project_round_id, name) VALUES
(1, 1, 'Hội đồng bảo vệ 01');

INSERT IGNORE INTO defense_council_members (council_id, lecturer_user_id, council_role) VALUES
(1, 2, 'chair');

INSERT IGNORE INTO defense_schedules
(id, council_id, group_id, defense_at, location, status, note) VALUES
(1, 1, 1, '2027-01-20 08:00:00', 'Phòng A101', 'scheduled', 'Chuẩn bị slide và demo hệ thống.');

INSERT IGNORE INTO defense_scores
(schedule_id, student_user_id, lecturer_user_id, score, comment) VALUES
(1, 1, 2, 8.50, 'Nắm vững đề tài, trả lời tốt.');

INSERT IGNORE INTO final_grades
(group_id, student_user_id, total_score, status, note, published_at) VALUES
(1, 1, 8.30, 'published', 'Tổng hợp điểm quá trình và điểm bảo vệ.', CURRENT_TIMESTAMP);

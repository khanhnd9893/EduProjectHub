USE eduprojecthub;

-- ========================================================
-- Module M4: Quản lý học kỳ / Đợt đồ án (FR02)
-- Bảng: project_rounds
-- ========================================================

CREATE TABLE IF NOT EXISTS project_rounds (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    round_code      VARCHAR(30) NOT NULL,
    round_name      VARCHAR(150) NOT NULL,
    semester        VARCHAR(50) NULL,
    academic_year   VARCHAR(20) NULL,
    start_date      DATE NULL,
    end_date        DATE NULL,
    min_members     TINYINT UNSIGNED NOT NULL DEFAULT 2,
    max_members     TINYINT UNSIGNED NOT NULL DEFAULT 5,
    status          ENUM('draft', 'open', 'in_progress', 'closed') NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_round_code (round_code),
    CONSTRAINT chk_round_member_limits CHECK (min_members >= 1 AND max_members >= min_members),
    CONSTRAINT chk_round_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu kiểm thử đợt đồ án / học kỳ
INSERT INTO project_rounds (round_code, round_name, semester, academic_year, start_date, end_date, min_members, max_members, status)
VALUES
('DA_HK1_2026', 'Đồ án tốt nghiệp Học kỳ 1 năm học 2026-2027', 'Học kỳ 1', '2026-2027', '2026-09-01', '2027-01-31', 2, 5, 'open'),
('DA_HK2_2026', 'Đồ án tốt nghiệp Học kỳ 2 năm học 2026-2027', 'Học kỳ 2', '2026-2027', '2027-02-15', '2027-06-30', 2, 5, 'draft'),
('DA_HK3_2025', 'Đồ án chuyên ngành Học kỳ Hè năm 2025-2026', 'Học kỳ Hè', '2025-2026', '2026-06-01', '2026-08-31', 1, 3, 'closed')
ON DUPLICATE KEY UPDATE round_name = VALUES(round_name);

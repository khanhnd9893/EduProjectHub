USE eduprojecthub;

-- =========================================================
-- PROJECT_ROUNDS: dot do an / hoc ky.
-- Can bang nay de rang buoc: mot sinh vien chi thuoc mot nhom
-- dang hoat dong trong cung mot dot do an.
-- Neu du an da co bang hoc_ky / project_rounds, hay dieu chinh FK.
-- =========================================================

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
) ENGINE=InnoDB;

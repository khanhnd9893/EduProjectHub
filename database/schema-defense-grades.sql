-- Lich bao ve va diem so, dung chung users/project_rounds/student_groups.
-- Can import cac schema nen trong database/README.md truoc.
USE eduprojecthub;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS defense_councils (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_round_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_defense_councils_round (project_round_id),
    CONSTRAINT fk_defense_councils_round FOREIGN KEY (project_round_id) REFERENCES project_rounds(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS defense_council_members (
    council_id BIGINT UNSIGNED NOT NULL,
    lecturer_user_id BIGINT UNSIGNED NOT NULL,
    council_role ENUM('chair','secretary','member') NOT NULL DEFAULT 'member',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (council_id, lecturer_user_id),
    CONSTRAINT fk_defense_council_members_council FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_council_members_lecturer FOREIGN KEY (lecturer_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS defense_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    council_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    defense_at DATETIME NOT NULL,
    location VARCHAR(150) NULL,
    status ENUM('scheduled','completed','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
    note TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_defense_schedules_group (group_id, status),
    INDEX idx_defense_schedules_time (council_id, defense_at),
    CONSTRAINT fk_defense_schedules_council FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_schedules_group FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS defense_scores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT UNSIGNED NOT NULL,
    student_user_id BIGINT UNSIGNED NOT NULL,
    lecturer_user_id BIGINT UNSIGNED NOT NULL,
    score DECIMAL(4,2) NOT NULL,
    comment TEXT NULL,
    graded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_defense_scores (schedule_id, student_user_id, lecturer_user_id),
    CONSTRAINT fk_defense_scores_schedule FOREIGN KEY (schedule_id) REFERENCES defense_schedules(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_scores_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_scores_lecturer FOREIGN KEY (lecturer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_defense_scores_score CHECK (score >= 0 AND score <= 10)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS final_grades (
    group_id BIGINT UNSIGNED NOT NULL,
    student_user_id BIGINT UNSIGNED NOT NULL,
    total_score DECIMAL(4,2) NOT NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    note TEXT NULL,
    published_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, student_user_id),
    CONSTRAINT fk_final_grades_group FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_final_grades_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_final_grades_score CHECK (total_score >= 0 AND total_score <= 10)
) ENGINE=InnoDB;

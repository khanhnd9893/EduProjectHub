-- Schema hoi dong bao ve va diem so (FR06).
-- Target: MySQL 8.x; use InnoDB and utf8mb4.
-- Chay sau schema nen co cac bang semesters, projects, students va lecturers.
USE spms;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS final_grades;
DROP TABLE IF EXISTS defense_scores;
DROP TABLE IF EXISTS defense_schedules;
DROP TABLE IF EXISTS defense_council_members;
DROP TABLE IF EXISTS defense_councils;

CREATE TABLE defense_councils (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    semester_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_defense_councils_semester (semester_id),
    CONSTRAINT fk_defense_councils_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE defense_council_members (
    council_id BIGINT UNSIGNED NOT NULL,
    lecturer_id BIGINT UNSIGNED NOT NULL,
    council_role ENUM('chair','secretary','member') NOT NULL DEFAULT 'member',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (council_id, lecturer_id),
    CONSTRAINT fk_defense_council_members_council FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_council_members_lecturer FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE defense_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    council_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    defense_at DATETIME NOT NULL,
    location VARCHAR(150) NULL,
    status ENUM('scheduled','completed','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
    note TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_defense_schedules_project (project_id, status),
    INDEX idx_defense_schedules_time (council_id, defense_at),
    CONSTRAINT fk_defense_schedules_council FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_schedules_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE defense_scores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    lecturer_id BIGINT UNSIGNED NOT NULL,
    score DECIMAL(4,2) NOT NULL,
    comment TEXT NULL,
    graded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_defense_scores (schedule_id, student_id, lecturer_id),
    CONSTRAINT fk_defense_scores_schedule FOREIGN KEY (schedule_id) REFERENCES defense_schedules(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_scores_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_scores_lecturer FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),
    CONSTRAINT chk_defense_scores_score CHECK (score >= 0 AND score <= 10)
) ENGINE=InnoDB;

CREATE TABLE final_grades (
    project_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    total_score DECIMAL(4,2) NOT NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    note TEXT NULL,
    published_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, student_id),
    CONSTRAINT fk_final_grades_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_final_grades_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT chk_final_grades_score CHECK (total_score >= 0 AND total_score <= 10)
) ENGINE=InnoDB;

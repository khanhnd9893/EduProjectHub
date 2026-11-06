-- SPMS database schema - Phan mo rong FR06-FR07 (Bao cao, Bao ve, Diem so, Chatbot FAQ)
-- Target: MySQL 8.x; use InnoDB and utf8mb4.
-- Chay file nay SAU khi da import database/schema.sql.
-- M3 tong hop vao schema.sql chung sau khi nhom thong nhat.
USE spms;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS final_grades;
DROP TABLE IF EXISTS defense_scores;
DROP TABLE IF EXISTS defense_schedules;
DROP TABLE IF EXISTS defense_council_members;
DROP TABLE IF EXISTS defense_councils;
DROP TABLE IF EXISTS report_feedback;
DROP TABLE IF EXISTS report_versions;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS chatbot_faqs;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. BAO CAO VA PHAN HOI (FR06)
-- Bao cao do an theo dot (tuan/giua ky/cuoi ky), gan voi project.
-- Mot dot bao cao co nhieu phien ban nop; phan hoi gan voi phien ban.
-- ============================================================

CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    report_type ENUM('weekly','midterm','final','other') NOT NULL DEFAULT 'other',
    description TEXT NULL,
    deadline DATETIME NULL,
    status ENUM('open','closed','graded') NOT NULL DEFAULT 'open',
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reports_project_status (project_id, status),
    CONSTRAINT fk_reports_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE report_versions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT UNSIGNED NOT NULL,
    version_no INT UNSIGNED NOT NULL DEFAULT 1,
    submitted_by BIGINT UNSIGNED NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    note TEXT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_report_versions (report_id, version_no),
    INDEX idx_report_versions_submitter (submitted_by, submitted_at),
    CONSTRAINT fk_report_versions_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_versions_student FOREIGN KEY (submitted_by) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE report_feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_version_id BIGINT UNSIGNED NOT NULL,
    lecturer_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    score DECIMAL(4,2) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_feedback_version (report_version_id, created_at),
    CONSTRAINT fk_report_feedback_version FOREIGN KEY (report_version_id) REFERENCES report_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_feedback_lecturer FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),
    CONSTRAINT chk_report_feedback_score CHECK (score IS NULL OR (score >= 0 AND score <= 10))
) ENGINE=InnoDB;

-- ============================================================
-- 2. BAO VE VA DIEM SO (FR06)
-- Hoi dong bao ve theo hoc ky; moi hoi dong co nhieu giang vien.
-- Lich bao ve gan do an voi hoi dong; diem thanh phan do tung
-- giang vien trong hoi dong cham cho tung sinh vien (thang 10).
-- final_grades luu diem tong ket chinh thuc duoc cong bo.
-- ============================================================

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

-- ============================================================
-- 3. CHATBOT FAQ (FR07)
-- Noi dung hoi dap do giang vien/admin quan ly; chatbot chi tra
-- loi tu cac FAQ co trang thai 'published' (FR-13).
-- Lich su hoi thoai dung bang chat_sessions/chat_messages co san.
-- ============================================================

CREATE TABLE chatbot_faqs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_chatbot_faqs_status (status, category),
    CONSTRAINT fk_chatbot_faqs_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

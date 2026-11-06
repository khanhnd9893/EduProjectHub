-- Schema bao cao va phan hoi (FR06).
-- Target: MySQL 8.x; use InnoDB and utf8mb4.
-- Chay sau schema nen co cac bang projects, users, students va lecturers.
USE spms;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS report_feedback;
DROP TABLE IF EXISTS report_versions;
DROP TABLE IF EXISTS reports;

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

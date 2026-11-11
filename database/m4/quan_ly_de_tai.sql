-- ========================================================
-- Module M4: Quản lý đề tài (FR02-FR03)
-- File: quan_ly_de_tai.sql
-- ========================================================

CREATE TABLE IF NOT EXISTS `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `requirements` TEXT NULL,
    `semester_id` INT NULL,
    `lecturer_id` INT NULL COMMENT 'Mô phỏng FOREIGN KEY liên kết với người tạo (users/lecturers)',
    `max_groups` INT NOT NULL DEFAULT 1,
    `status` ENUM('waiting', 'approved', 'full', 'rejected') NOT NULL DEFAULT 'waiting',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_projects_lecturer_id` (`lecturer_id`),
    CONSTRAINT `fk_projects_semesters` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

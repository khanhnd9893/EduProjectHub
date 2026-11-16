USE eduprojecthub;

-- ========================================================
-- Module M4: Quản lý đề tài & Đăng ký đề tài (FR03)
-- Bảng: project_topics & topic_registrations
-- ========================================================

CREATE TABLE IF NOT EXISTS project_topics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_round_id BIGINT UNSIGNED NOT NULL,
    topic_code VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    supervisor_user_id BIGINT UNSIGNED NULL,
    max_groups SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('draft', 'open', 'closed') NOT NULL DEFAULT 'draft',
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_project_topics_round_code (project_round_id, topic_code),
    KEY idx_project_topics_round_status (project_round_id, status),
    CONSTRAINT fk_project_topics_round FOREIGN KEY (project_round_id) REFERENCES project_rounds(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_topics_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_project_topics_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_project_topics_max_groups CHECK (max_groups >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topic_registrations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    topic_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    registered_by BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    note VARCHAR(1000) NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_topic_registrations_topic_status (topic_id, status),
    KEY idx_topic_registrations_group_status (group_id, status),
    CONSTRAINT fk_topic_registrations_topic FOREIGN KEY (topic_id) REFERENCES project_topics(id) ON DELETE CASCADE,
    CONSTRAINT fk_topic_registrations_group FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_topic_registrations_user FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_topic_registrations_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu đề tài
INSERT INTO project_topics (project_round_id, topic_code, title, description, supervisor_user_id, max_groups, status, created_by)
VALUES
(1, 'DT_001', 'Xây dựng hệ thống quản lý đồ án sinh viên EduProjectHub', 'Phát triển nền tảng web hỗ trợ quản lý đề tài, tiến độ và đánh giá đồ án theo kỳ.', 3, 2, 'open', 3),
(1, 'DT_002', 'Nghiên cứu và ứng dụng Trí tuệ nhân tạo trong hỗ trợ học tập', 'Tích hợp mô hình ngôn ngữ lớn để trả lời câu hỏi và hướng dẫn sinh viên làm đồ án.', 3, 1, 'open', 2),
(1, 'DT_003', 'Hệ thống điểm danh sinh viên bằng nhận diện khuôn mặt', 'Ứng dụng Computer Vision và OpenCV để điểm danh tự động trong lớp học.', 3, 1, 'draft', 3)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Dữ liệu mẫu đăng ký đề tài (nhóm 1 đăng ký đề tài 1)
INSERT INTO topic_registrations (topic_id, group_id, registered_by, status, note, reviewed_by, reviewed_at)
VALUES
(1, 1, 4, 'approved', 'Nhóm mong muốn được thầy hướng dẫn đề tài này.', 3, NOW())
ON DUPLICATE KEY UPDATE note = VALUES(note);

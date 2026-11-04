USE eduprojecthub;

-- =========================================================
-- GROUP_REQUESTS: sinh vien chu dong gui yeu cau vao nhom.
-- =========================================================

CREATE TABLE IF NOT EXISTS group_requests (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id        BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    message         VARCHAR(500) NULL,
    status          ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    requested_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by     BIGINT UNSIGNED NULL,
    reviewed_at     DATETIME NULL,
    review_note     VARCHAR(500) NULL,

    KEY idx_request_user_status (user_id, status),
    KEY idx_request_group_status (group_id, status),

    CONSTRAINT fk_request_group
      FOREIGN KEY (group_id) REFERENCES student_groups(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_request_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_request_reviewer
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

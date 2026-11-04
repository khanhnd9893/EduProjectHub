USE eduprojecthub;

-- =========================================================
-- GROUP_INVITATIONS: loi moi vao nhom do truong nhom gui.
-- =========================================================

CREATE TABLE IF NOT EXISTS group_invitations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id        BIGINT UNSIGNED NOT NULL,
    invited_user_id BIGINT UNSIGNED NOT NULL,
    invited_by      BIGINT UNSIGNED NOT NULL,
    message         VARCHAR(500) NULL,
    status          ENUM('pending', 'accepted', 'rejected', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
    sent_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at    DATETIME NULL,
    expires_at      DATETIME NULL,

    KEY idx_invitation_user_status (invited_user_id, status),
    KEY idx_invitation_group_status (group_id, status),

    CONSTRAINT fk_invitation_group
      FOREIGN KEY (group_id) REFERENCES student_groups(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_invitation_invited_user
      FOREIGN KEY (invited_user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_invitation_inviter
      FOREIGN KEY (invited_by) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

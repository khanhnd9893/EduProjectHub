USE eduprojecthub;

-- =========================================================
-- GROUP_MEMBERS: lich su tham gia nhom.
-- Khong xoa vat ly khi thanh vien roi/bi xoa; cap nhat status.
-- Mot sinh vien chi co mot ban ghi trong cung mot nhom.
-- Trigger o file 08 kiem tra mot sinh vien khong tham gia
-- hai nhom dang hoat dong trong cung mot dot do an.
-- =========================================================

CREATE TABLE IF NOT EXISTS group_members (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id        BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    member_role     ENUM('leader', 'member') NOT NULL DEFAULT 'member',
    status          ENUM('active', 'left', 'removed') NOT NULL DEFAULT 'active',
    joined_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at         DATETIME NULL,
    note            VARCHAR(500) NULL,

    UNIQUE KEY uq_group_user (group_id, user_id),
    KEY idx_members_user_status (user_id, status),
    KEY idx_members_group_status (group_id, status),

    CONSTRAINT fk_members_group
      FOREIGN KEY (group_id) REFERENCES student_groups(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_members_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

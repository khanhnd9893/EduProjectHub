USE eduprojecthub;

-- =========================================================
-- STUDENT_GROUPS: thong tin nhom do an
-- leader_user_id la truong nhom duoc chi dinh.
-- =========================================================

CREATE TABLE IF NOT EXISTS student_groups (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_code          VARCHAR(30) NOT NULL,
    group_name          VARCHAR(150) NOT NULL,
    description         TEXT NULL,
    project_round_id    BIGINT UNSIGNED NOT NULL,
    leader_user_id      BIGINT UNSIGNED NOT NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    status              ENUM('forming', 'active', 'completed', 'dissolved') NOT NULL DEFAULT 'forming',
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    dissolved_at        DATETIME NULL,

    UNIQUE KEY uq_group_code_per_round (project_round_id, group_code),
    KEY idx_groups_round_status (project_round_id, status),
    KEY idx_groups_leader (leader_user_id),

    CONSTRAINT fk_groups_round
      FOREIGN KEY (project_round_id) REFERENCES project_rounds(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_groups_leader
      FOREIGN KEY (leader_user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_groups_creator
      FOREIGN KEY (created_by) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

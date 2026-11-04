USE eduprojecthub;

-- NHIEM_VU: cong viec duoc giao trong mot nhom do an.
CREATE TABLE IF NOT EXISTS tasks (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id            BIGINT UNSIGNED NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NULL,
    completion_criteria TEXT NULL,
    assigned_to         BIGINT UNSIGNED NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    priority            ENUM('low', 'normal', 'high') NOT NULL DEFAULT 'normal',
    status              ENUM('todo', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'todo',
    due_at              DATETIME NULL,
    completed_at        DATETIME NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_tasks_group_status_due (group_id, status, due_at),
    KEY idx_tasks_assignee_status (assigned_to, status),
    KEY idx_tasks_creator (created_by),

    CONSTRAINT fk_tasks_group
      FOREIGN KEY (group_id) REFERENCES student_groups(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee
      FOREIGN KEY (assigned_to) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_tasks_creator
      FOREIGN KEY (created_by) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

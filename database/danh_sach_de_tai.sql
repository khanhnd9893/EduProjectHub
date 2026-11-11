USE eduprojecthub;

-- Back up the database before applying. This migration is intended to run once.

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id BIGINT UNSIGNED NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_notifications_user_read_created (user_id, is_read, created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET @faq_visibility_sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'chatbot_faqs'
          AND COLUMN_NAME = 'visibility'
    ),
    'SELECT 1',
    'ALTER TABLE chatbot_faqs ADD COLUMN visibility ENUM(''all'', ''admin'', ''lecturer'', ''student'') NOT NULL DEFAULT ''all'' AFTER category'
);
PREPARE faq_visibility_stmt FROM @faq_visibility_sql;
EXECUTE faq_visibility_stmt;
DEALLOCATE PREPARE faq_visibility_stmt;

DROP TRIGGER IF EXISTS trg_group_members_guard_leader_update;
DROP TRIGGER IF EXISTS trg_group_members_guard_leader_delete;
DROP TRIGGER IF EXISTS trg_student_groups_create_leader;
DROP TRIGGER IF EXISTS trg_student_groups_guard_leader_update;
DROP TRIGGER IF EXISTS trg_group_member_after_insert;
DROP TRIGGER IF EXISTS trg_group_member_after_update;
DROP TRIGGER IF EXISTS trg_tasks_notify_insert;
DROP TRIGGER IF EXISTS trg_tasks_notify_update;
DROP TRIGGER IF EXISTS trg_report_feedback_notify_insert;
DROP TRIGGER IF EXISTS trg_topic_registrations_notify_update;
DROP TRIGGER IF EXISTS trg_defense_schedules_notify_insert;
DROP TRIGGER IF EXISTS trg_defense_schedules_notify_update;

-- Backfill leader memberships before installing the trigger that updates student_groups.
INSERT INTO group_members (group_id, user_id, member_role, status)
SELECT sg.id, sg.leader_user_id, 'leader', 'active'
FROM student_groups sg
LEFT JOIN group_members gm ON gm.group_id = sg.id AND gm.user_id = sg.leader_user_id
WHERE gm.id IS NULL
  AND sg.status IN ('forming', 'active');

UPDATE group_members gm
JOIN student_groups sg ON sg.id = gm.group_id
SET gm.member_role = 'leader'
WHERE gm.user_id = sg.leader_user_id
  AND gm.status = 'active'
  AND sg.status IN ('forming', 'active');

UPDATE group_members gm
JOIN student_groups sg ON sg.id = gm.group_id
SET gm.member_role = 'member'
WHERE gm.member_role = 'leader'
  AND gm.status = 'active'
  AND gm.user_id <> sg.leader_user_id
  AND sg.status IN ('forming', 'active');

DELIMITER $$

CREATE TRIGGER trg_group_member_after_update
AFTER UPDATE ON group_members
FOR EACH ROW
BEGIN
    IF NEW.member_role = 'leader' AND NEW.status = 'active' THEN
        UPDATE student_groups
        SET leader_user_id = NEW.user_id
        WHERE id = NEW.group_id AND leader_user_id <> NEW.user_id;
    END IF;
END$$

CREATE TRIGGER trg_group_members_guard_leader_update
BEFORE UPDATE ON group_members
FOR EACH ROW
BEGIN
    IF (NEW.group_id <> OLD.group_id OR NEW.status <> 'active' OR NEW.member_role <> 'leader')
       AND EXISTS (
           SELECT 1 FROM student_groups
           WHERE id = OLD.group_id AND leader_user_id = OLD.user_id
       )
       AND NOT EXISTS (
           SELECT 1 FROM group_members
           WHERE group_id = OLD.group_id AND user_id <> OLD.user_id
             AND member_role = 'leader' AND status = 'active'
       ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Khong the roi hoac ha quyen truong nhom truoc khi chuyen quyen';
    END IF;
END$$

CREATE TRIGGER trg_group_members_guard_leader_delete
BEFORE DELETE ON group_members
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM student_groups
        WHERE id = OLD.group_id AND leader_user_id = OLD.user_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Khong the xoa thanh vien dang la truong nhom';
    END IF;
END$$

CREATE TRIGGER trg_student_groups_create_leader
AFTER INSERT ON student_groups
FOR EACH ROW
BEGIN
    INSERT INTO group_members (group_id, user_id, member_role, status)
    VALUES (NEW.id, NEW.leader_user_id, 'leader', 'active');
END$$

CREATE TRIGGER trg_student_groups_guard_leader_update
BEFORE UPDATE ON student_groups
FOR EACH ROW
BEGIN
    IF NEW.leader_user_id <> OLD.leader_user_id
       AND NOT EXISTS (
           SELECT 1 FROM group_members
           WHERE group_id = NEW.id AND user_id = NEW.leader_user_id
             AND status = 'active' AND member_role = 'leader'
       ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Truong nhom phai la thanh vien dang hoat dong';
    END IF;
END$$

CREATE TRIGGER trg_tasks_notify_insert
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to <> NEW.created_by THEN
        INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, actor_user_id)
        VALUES (NEW.assigned_to, 'task_assigned', 'Bạn được giao nhiệm vụ',
                NEW.title, 'task', NEW.id, NEW.created_by);
    END IF;
END$$

CREATE TRIGGER trg_tasks_notify_update
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status AND NEW.created_by <> COALESCE(NEW.assigned_to, 0) THEN
        INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, actor_user_id)
        VALUES (NEW.created_by, 'task_updated', 'Nhiệm vụ được cập nhật',
                CONCAT(NEW.title, ': ', NEW.status), 'task', NEW.id, NEW.assigned_to);
    END IF;
END$$

CREATE TRIGGER trg_report_feedback_notify_insert
AFTER INSERT ON report_feedback
FOR EACH ROW
BEGIN
    INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, actor_user_id)
    SELECT gm.user_id, 'report_feedback', 'Báo cáo có nhận xét mới',
           NEW.content, 'report_version', NEW.report_version_id, NEW.lecturer_user_id
    FROM report_versions rv
    JOIN reports r ON r.id = rv.report_id
    JOIN group_members gm ON gm.group_id = r.group_id AND gm.status = 'active'
    WHERE rv.id = NEW.report_version_id
      AND gm.user_id <> NEW.lecturer_user_id;
END$$

CREATE TRIGGER trg_topic_registrations_notify_update
AFTER UPDATE ON topic_registrations
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, actor_user_id)
        SELECT gm.user_id, 'topic_registration', 'Đăng ký đề tài được cập nhật',
               CONCAT(t.title, ': ', NEW.status), 'topic_registration', NEW.id, NEW.reviewed_by
        FROM project_topics t
        JOIN group_members gm ON gm.group_id = NEW.group_id AND gm.status = 'active'
        WHERE t.id = NEW.topic_id
          AND gm.user_id <> COALESCE(NEW.reviewed_by, 0);
    END IF;
END$$

CREATE TRIGGER trg_defense_schedules_notify_insert
AFTER INSERT ON defense_schedules
FOR EACH ROW
BEGIN
    INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
    SELECT gm.user_id, 'defense_scheduled', 'Lịch bảo vệ đồ án',
           CONCAT(DATE_FORMAT(NEW.defense_at, '%d/%m/%Y %H:%i'),
                  IF(NEW.location IS NULL, '', CONCAT(' - ', NEW.location))),
           'defense_schedule', NEW.id
    FROM group_members gm
    WHERE gm.group_id = NEW.group_id AND gm.status = 'active';
END$$

CREATE TRIGGER trg_defense_schedules_notify_update
AFTER UPDATE ON defense_schedules
FOR EACH ROW
BEGIN
    IF NEW.defense_at <> OLD.defense_at
       OR NOT (NEW.location <=> OLD.location)
       OR NEW.status <> OLD.status THEN
        INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
        SELECT gm.user_id, 'defense_schedule_updated', 'Lịch bảo vệ được cập nhật',
               CONCAT(DATE_FORMAT(NEW.defense_at, '%d/%m/%Y %H:%i'),
                      IF(NEW.location IS NULL, '', CONCAT(' - ', NEW.location))),
               'defense_schedule', NEW.id
        FROM group_members gm
        WHERE gm.group_id = NEW.group_id AND gm.status = 'active';
    END IF;
END$$

DELIMITER ;

-- Additive migration for report links/replies, secure report downloads,
-- chatbot answer feedback, and per-session message counts.
USE eduprojecthub;

SET @has_attachment_link = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'report_versions'
      AND column_name = 'attachment_link'
);
SET @ddl = IF(
    @has_attachment_link = 0,
    'ALTER TABLE report_versions ADD COLUMN attachment_link VARCHAR(2048) NULL AFTER note',
    'SELECT 1'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

CREATE TABLE IF NOT EXISTS report_feedback_replies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    feedback_id BIGINT UNSIGNED NOT NULL,
    student_user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_feedback_replies_feedback (feedback_id, created_at),
    CONSTRAINT fk_report_feedback_replies_feedback FOREIGN KEY (feedback_id) REFERENCES report_feedback(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_feedback_replies_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

SET @has_answer_feedback = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'chat_messages'
      AND column_name = 'answer_feedback'
);
SET @ddl = IF(
    @has_answer_feedback = 0,
    'ALTER TABLE chat_messages ADD COLUMN answer_feedback ENUM(''incorrect'') NULL AFTER content',
    'SELECT 1'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

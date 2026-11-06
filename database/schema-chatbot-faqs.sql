-- Schema FAQ chatbot (FR07).
-- Target: MySQL 8.x; use InnoDB and utf8mb4.
-- Lich su hoi thoai dung cac bang chat_sessions/chat_messages co san.
-- Chay sau schema nen co bang users.
USE spms;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS chatbot_faqs;

CREATE TABLE chatbot_faqs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_chatbot_faqs_status (status, category),
    CONSTRAINT fk_chatbot_faqs_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

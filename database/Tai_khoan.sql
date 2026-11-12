CREATE DATABASE IF NOT EXISTS eduprojecthub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eduprojecthub;

-- =========================================================
-- USERS: tai khoan theo 5 vai tro nghiep vu cua he thong
-- Neu du an da co bang users, khong chay CREATE TABLE nay.
-- Hay dam bao bang hien co co cac cot duoc cac bang khac tham chieu.
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50) NOT NULL,
    student_code    VARCHAR(30) NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    phone           VARCHAR(15) NULL,
    department      VARCHAR(100) NULL,
    avatar_url      VARCHAR(255) NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin', 'student', 'team_leader', 'lecturer', 'training_manager')
                    NOT NULL DEFAULT 'student'
                    COMMENT 'Vai tro tai khoan; quyen truong nhom van phu thuoc group_members trong tung nhom',
    account_status  ENUM('active', 'locked', 'inactive') NOT NULL DEFAULT 'active',
    last_login_at   DATETIME NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_student_code (student_code),
    KEY idx_users_role_status (role, account_status)
) ENGINE=InnoDB;

-- Với database đã tạo trước đây, sao lưu trước rồi thêm username cho từng tài khoản.

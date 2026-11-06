CREATE DATABASE IF NOT EXISTS eduprojecthub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eduprojecthub;

-- =========================================================
-- USERS: tai khoan sinh vien, giang vien, quan tri vien
-- Neu du an da co bang users, khong chay CREATE TABLE nay.
-- Hay dam bao bang hien co co cac cot duoc cac bang khac tham chieu.
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_code    VARCHAR(30) NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin', 'lecturer', 'student') NOT NULL DEFAULT 'student',
    account_status  ENUM('active', 'locked', 'inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_student_code (student_code),
    KEY idx_users_role_status (role, account_status)
) ENGINE=InnoDB;

-- Du lieu minh hoa: password_hash chi la chuoi gia lap.
-- Khi tich hop that, tao hash bang bcrypt/Argon2 trong Backend.

-- ============================================================================
-- DU AN: HE THONG QUAN LY DO AN SINH VIEN KET HOP CHATBOT (EDUPROJECTHUB)
-- PHAN HE: FR01 - XAC THUC, PHAN QUYEN VA QUAN LY TAI KHOAN
-- PHU TRACH: Mai Xuan Thinh (M3 - Backend 1)
-- HE QUAN TRI CSDL: MySQL 8.0+ / MariaDB 10.4+ (XAMPP)
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Khoi tao Database neu chua ton tai
CREATE DATABASE IF NOT EXISTS `eduprojecthub_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `eduprojecthub_db`;

-- ============================================================================
-- 1. XOA BANG CU (NEU CO) DE CHAY LAI SACH SE
-- ============================================================================
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

-- ============================================================================
-- 2. BANG ROLES: QUAN LY DANH MUC VAI TRO HE THONG
-- ============================================================================
CREATE TABLE `roles` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_code` ENUM('ADMIN', 'LECTURER', 'STUDENT') NOT NULL COMMENT 'Ma dinh danh vai tro co dinh de kiem tra quyen RBAC',
    `role_name` VARCHAR(50) NOT NULL COMMENT 'Ten hien thi vai tro (Tieng Viet)',
    `description` VARCHAR(255) DEFAULT NULL COMMENT 'Mo ta pham vi quyen han cua vai tro',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_roles_role_code` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bang phan quyen vai tro nguoi dung';

-- ============================================================================
-- 3. BANG USERS: QUAN LY TAI KHOAN VA HO SO CA NHAN
-- ============================================================================
CREATE TABLE `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_id` INT UNSIGNED NOT NULL COMMENT 'Khoa ngoai tham chieu bang roles',
    `username` VARCHAR(50) NOT NULL COMMENT 'Ten dang nhap duy nhat',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Mat khau da ma hoa bang Bcrypt',
    `full_name` VARCHAR(100) NOT NULL COMMENT 'Ho va ten day du',
    `email` VARCHAR(100) NOT NULL COMMENT 'Email hoc vu / lien he duy nhat',
    `phone` VARCHAR(15) DEFAULT NULL COMMENT 'So dien thoai lien he',
    `user_code` VARCHAR(20) DEFAULT NULL COMMENT 'MSSV hoac Ma Giang vien',
    `department` VARCHAR(100) DEFAULT 'Viện CNTT và Điện, điện tử' COMMENT 'Khoa / Vien truc thuoc',
    `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT 'Duong dan anh dai dien (neu co)',
    `status` ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE: Dang hoat dong, LOCKED: Bi khoa truy cap',
    `last_login_at` DATETIME DEFAULT NULL COMMENT 'Thoi diem dang nhap thanh cong gan nhat',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_username` (`username`),
    UNIQUE KEY `uk_users_email` (`email`),
    UNIQUE KEY `uk_users_user_code` (`user_code`),
    KEY `idx_users_role_id` (`role_id`),
    KEY `idx_users_status` (`status`),
    CONSTRAINT `fk_users_role`
        FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bang tai khoan nguoi dung toan he thong';

-- ============================================================================
-- 4. BANG USER_SESSIONS: QUAN LY PHIEN DANG NHAP VA TOKEN XAC THUC
-- ============================================================================
CREATE TABLE `user_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'Tai khoan so huu phien dang nhap',
    `token` VARCHAR(255) NOT NULL COMMENT 'Chuoi Bearer Token hoac Session ID duy nhat',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Dia chi IP khi dang nhap (IPv4/IPv6)',
    `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'Thong tin trinh duyet / thiet bi',
    `expires_at` DATETIME NOT NULL COMMENT 'Thoi diem phien het han',
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Dang hieu luc, 1: Da thu hoi (Dang xuat / Khoa TK)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_sessions_token` (`token`),
    KEY `idx_sessions_user_id` (`user_id`),
    KEY `idx_sessions_valid` (`token`, `is_revoked`, `expires_at`),
    CONSTRAINT `fk_sessions_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bang quan ly phien xac thuc va dang xuat';

-- ============================================================================
-- 5. DU LIEU MAU (SEED DATA) PHUC VU PHAT TRIEN VA KIEM THU (TEST CASES)
-- Luu y: Mat khau mac dinh cua tat ca tai khoan mau ben duoi la: 123456
-- Chuoi hash Bcrypt ($2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- ============================================================================

-- 5.1. Them 3 vai tro co ban
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`) VALUES
(1, 'ADMIN', 'Quản trị viên', 'Quản lý toàn bộ tài khoản, phân quyền, học kỳ và cấu hình hệ thống'),
(2, 'LECTURER', 'Giảng viên', 'Quản lý đề tài, duyệt nhóm đăng ký, theo dõi tiến độ, nhận xét báo cáo và chấm điểm'),
(3, 'STUDENT', 'Sinh viên', 'Đăng ký đề tài, tạo/tham gia nhóm, cập nhật nhiệm vụ, nộp báo cáo và hỏi đáp Chatbot');

-- 5.2. Them danh sach tai khoan mau (Admin, Giang vien, 6 thanh vien Nhom 4 & 1 tai khoan bi khoa de test)
INSERT INTO `users` (`id`, `role_id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `user_code`, `status`) VALUES
-- Quan tri vien (role_id = 1)
(1, 1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản Trị Hệ Thống LIC', 'admin.lic@ut.edu.vn', '0901000001', 'AD001', 'ACTIVE'),

-- Giang vien huong dan & Mentor (role_id = 2)
(2, 2, 'gv_nhancach', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Đặng Nhân Cách', 'cach.dn@ut.edu.vn', '0902000001', 'GV001', 'ACTIVE'),
(3, 2, 'pm_philong', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Phạm Văn Phi Long', 'long.pvp@ut.edu.vn', '0902000002', 'GV002', 'ACTIVE'),

-- Sinh vien Nhom 4 (role_id = 3)
(4, 3, 'sv_duckhanh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Đức Khánh', 'khanh.nd@ut.edu.vn', '0903000001', 'SV2026001', 'ACTIVE'),
(5, 3, 'sv_xuanthinh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mai Xuân Thịnh', 'thinh.mx@ut.edu.vn', '0903000002', 'SV2026002', 'ACTIVE'),
(6, 3, 'sv_vanhuy', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Hồ Văn Huy', 'huy.hv@ut.edu.vn', '0903000003', 'SV2026003', 'ACTIVE'),
(7, 3, 'sv_phatdat', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Phát Đạt', 'dat.tp@ut.edu.vn', '0903000004', 'SV2026004', 'ACTIVE'),
(8, 3, 'sv_ducninh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Huỳnh Đức Ninh', 'ninh.thd@ut.edu.vn', '0903000005', 'SV2026005', 'ACTIVE'),
(9, 3, 'sv_lequang', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Lê Quang', 'quang.tl@ut.edu.vn', '0903000006', 'SV2026006', 'ACTIVE'),

-- Tai khoan bi khoa phuc vu Test Case TC_FR01_04 (status = 'LOCKED')
(10, 3, 'sv_locked', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sinh Viên Bị Khóa', 'locked.sv@ut.edu.vn', '0903000099', 'SV2026099', 'LOCKED');

-- 5.3. Them phien dang nhap mau phuc vu kiem thu Middleware (TC_FR01_05 -> TC_FR01_07)
INSERT INTO `user_sessions` (`user_id`, `token`, `ip_address`, `user_agent`, `expires_at`, `is_revoked`) VALUES
(1, 'sample_admin_token_active_2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_ADD(NOW(), INTERVAL 7 DAY), 0),
(2, 'sample_lecturer_token_active_2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_ADD(NOW(), INTERVAL 7 DAY), 0),
(5, 'sample_student_token_active_2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_ADD(NOW(), INTERVAL 7 DAY), 0),
(5, 'sample_student_token_revoked_2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_ADD(NOW(), INTERVAL 7 DAY), 1);

SET FOREIGN_KEY_CHECKS = 1;
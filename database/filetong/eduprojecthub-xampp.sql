-- EduProjectHub: one-file fresh-install package for XAMPP/phpMyAdmin.
-- Includes all application schemas and demo data.
-- Import ONLY into a new/empty eduprojecthub database. This file is not a migration.
-- For an existing database, back it up and import only the missing schema files.
SET NAMES utf8mb4;

-- ===== Tai_khoan.sql =====
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
    username        VARCHAR(50) NOT NULL,
    student_code    VARCHAR(30) NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin', 'lecturer', 'student') NOT NULL DEFAULT 'student',
    account_status  ENUM('active', 'locked', 'inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_student_code (student_code),
    KEY idx_users_role_status (role, account_status)
) ENGINE=InnoDB;

-- Với database đã tạo trước đây, sao lưu trước rồi thêm username cho từng tài khoản.

-- ===== quan_ly_do_an.sql =====
USE eduprojecthub;

-- =========================================================
-- PROJECT_ROUNDS: dot do an / hoc ky.
-- Can bang nay de rang buoc: mot sinh vien chi thuoc mot nhom
-- dang hoat dong trong cung mot dot do an.
-- Neu du an da co bang hoc_ky / project_rounds, hay dieu chinh FK.
-- =========================================================

CREATE TABLE IF NOT EXISTS project_rounds (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    round_code      VARCHAR(30) NOT NULL,
    round_name      VARCHAR(150) NOT NULL,
    semester        VARCHAR(50) NULL,
    academic_year   VARCHAR(20) NULL,
    start_date      DATE NULL,
    end_date        DATE NULL,
    min_members     TINYINT UNSIGNED NOT NULL DEFAULT 2,
    max_members     TINYINT UNSIGNED NOT NULL DEFAULT 5,
    status          ENUM('draft', 'open', 'in_progress', 'closed') NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_round_code (round_code),
    CONSTRAINT chk_round_member_limits CHECK (min_members >= 1 AND max_members >= min_members),
    CONSTRAINT chk_round_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

-- ===== quan_ly_nhom.sql =====
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

-- ===== quan_ly_thanh_vien.sql =====
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

-- ===== quan_ly_loi_moi.sql =====
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

-- ===== quan_ly_yeu_cau.sql =====
USE eduprojecthub;

-- =========================================================
-- GROUP_REQUESTS: sinh vien chu dong gui yeu cau vao nhom.
-- =========================================================

CREATE TABLE IF NOT EXISTS group_requests (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id        BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    message         VARCHAR(500) NULL,
    status          ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    requested_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by     BIGINT UNSIGNED NULL,
    reviewed_at     DATETIME NULL,
    review_note     VARCHAR(500) NULL,

    KEY idx_request_user_status (user_id, status),
    KEY idx_request_group_status (group_id, status),

    CONSTRAINT fk_request_group
      FOREIGN KEY (group_id) REFERENCES student_groups(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_request_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_request_reviewer
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ===== phan_cong_giang_vien.sql =====
USE eduprojecthub;

-- Nhom duoc phan cong cho giang vien. API admin thay the danh sach
-- phan cong trong transaction va chi chap nhan it nhat 2 nhom/giang vien.
CREATE TABLE IF NOT EXISTS group_lecturers (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id            BIGINT UNSIGNED NOT NULL,
    lecturer_user_id    BIGINT UNSIGNED NOT NULL,
    assigned_by         BIGINT UNSIGNED NOT NULL,
    assigned_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_group_lecturer (group_id, lecturer_user_id),
    KEY idx_group_lecturers_lecturer (lecturer_user_id),

    CONSTRAINT fk_group_lecturers_group
      FOREIGN KEY (group_id) REFERENCES student_groups(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_group_lecturers_user
      FOREIGN KEY (lecturer_user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_group_lecturers_assigner
      FOREIGN KEY (assigned_by) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ===== quan_ly_nhiem_vu.sql =====
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

-- ===== kiem_tra_tien_do.sql =====
USE eduprojecthub;

-- =========================================================
-- TRIGGERS KIEM TRA NGHIEP VU
-- Luu y: chay file nay sau khi da tao day du cac bang.
-- =========================================================

DROP TRIGGER IF EXISTS trg_group_member_before_insert;
DROP TRIGGER IF EXISTS trg_group_member_before_update;
DROP TRIGGER IF EXISTS trg_group_member_after_insert;
DROP TRIGGER IF EXISTS trg_group_member_after_update;

DELIMITER $$

-- 1. Kiem tra tai khoan la sinh vien, nhom con hoat dong,
--    va khong vuot so thanh vien toi da / trung dot do an.
CREATE TRIGGER trg_group_member_before_insert
BEFORE INSERT ON group_members
FOR EACH ROW
BEGIN
    DECLARE v_role VARCHAR(20);
    DECLARE v_group_status VARCHAR(20);
    DECLARE v_round_id BIGINT UNSIGNED;
    DECLARE v_max_members INT;
    DECLARE v_current_count INT;
    DECLARE v_other_group_count INT;

    SELECT role INTO v_role
    FROM users WHERE id = NEW.user_id;

    IF v_role IS NULL OR v_role <> 'student' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chi tai khoan sinh vien moi duoc tham gia nhom';
    END IF;

    SELECT sg.status, sg.project_round_id, pr.max_members
      INTO v_group_status, v_round_id, v_max_members
    FROM student_groups sg
    JOIN project_rounds pr ON pr.id = sg.project_round_id
    WHERE sg.id = NEW.group_id;

    IF v_group_status IS NULL OR v_group_status = 'completed' OR v_group_status = 'dissolved' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nhom khong ton tai hoac khong con nhan thanh vien';
    END IF;

    IF NEW.status = 'active' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM group_members
        WHERE group_id = NEW.group_id AND status = 'active';

        IF v_current_count >= v_max_members THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nhom da dat so luong thanh vien toi da';
        END IF;

        SELECT COUNT(*) INTO v_other_group_count
        FROM group_members gm
        JOIN student_groups sg ON sg.id = gm.group_id
        WHERE gm.user_id = NEW.user_id
          AND gm.status = 'active'
          AND sg.project_round_id = v_round_id
          AND sg.status IN ('forming', 'active');

        IF v_other_group_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Sinh vien da thuoc mot nhom khac trong dot do an nay';
        END IF;
    END IF;
END$$

-- 2. Kiem tra khi cap nhat trang thai / chuyen nhom / vai tro.
CREATE TRIGGER trg_group_member_before_update
BEFORE UPDATE ON group_members
FOR EACH ROW
BEGIN
    DECLARE v_role VARCHAR(20);
    DECLARE v_round_id BIGINT UNSIGNED;
    DECLARE v_max_members INT;
    DECLARE v_count INT;
    DECLARE v_other_count INT;

    SELECT role INTO v_role FROM users WHERE id = NEW.user_id;

    IF NEW.status = 'active' AND (v_role IS NULL OR v_role <> 'student') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chi tai khoan sinh vien moi duoc tham gia nhom';
    END IF;

    IF NEW.status = 'active' AND
       (NEW.group_id <> OLD.group_id OR OLD.status <> 'active') THEN

        SELECT sg.project_round_id, pr.max_members
          INTO v_round_id, v_max_members
        FROM student_groups sg
        JOIN project_rounds pr ON pr.id = sg.project_round_id
        WHERE sg.id = NEW.group_id;

        SELECT COUNT(*) INTO v_count
        FROM group_members
        WHERE group_id = NEW.group_id
          AND status = 'active'
          AND id <> OLD.id;

        IF v_count >= v_max_members THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nhom da dat so luong thanh vien toi da';
        END IF;

        SELECT COUNT(*) INTO v_other_count
        FROM group_members gm
        JOIN student_groups sg ON sg.id = gm.group_id
        WHERE gm.user_id = NEW.user_id
          AND gm.status = 'active'
          AND gm.id <> OLD.id
          AND sg.project_round_id = v_round_id
          AND sg.status IN ('forming', 'active');

        IF v_other_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Sinh vien da thuoc mot nhom khac trong dot do an nay';
        END IF;
    END IF;

    IF NEW.status IN ('left', 'removed') AND NEW.left_at IS NULL THEN
        SET NEW.left_at = CURRENT_TIMESTAMP;
    END IF;
END$$

-- 3. Dong bo leader_user_id cua nhom khi them truong nhom.
CREATE TRIGGER trg_group_member_after_insert
AFTER INSERT ON group_members
FOR EACH ROW
BEGIN
    IF NEW.member_role = 'leader' AND NEW.status = 'active' THEN
        UPDATE student_groups
        SET leader_user_id = NEW.user_id
        WHERE id = NEW.group_id;
    END IF;
END$$

-- 4. Dong bo leader_user_id khi cap nhat vai tro.
CREATE TRIGGER trg_group_member_after_update
AFTER UPDATE ON group_members
FOR EACH ROW
BEGIN
    IF NEW.member_role = 'leader' AND NEW.status = 'active' THEN
        UPDATE student_groups
        SET leader_user_id = NEW.user_id
        WHERE id = NEW.group_id;
    END IF;
END$$

DELIMITER ;

-- QUY TAC BO SUNG:
-- Khi doi truong nhom, Backend nen thuc hien trong mot transaction:
-- 1) UPDATE group_members SET member_role='member' WHERE group_id=? AND member_role='leader';
-- 2) UPDATE group_members SET member_role='leader' WHERE group_id=? AND user_id=? AND status='active';
-- Trigger se cap nhat student_groups.leader_user_id.
-- Backend phai dam bao buoc 2 thanh cong; khong de nhom khong co truong nhom.

-- ===== tao_view.sql =====
USE eduprojecthub;

-- =========================================================
-- VIEWS: truy van du lieu thuong dung cho giao dien.
-- Chi chay sau khi da tao student_groups va group_members.
-- =========================================================

CREATE OR REPLACE VIEW vw_group_list AS
SELECT
    sg.id,
    sg.group_code,
    sg.group_name,
    sg.description,
    sg.status,
    sg.project_round_id,
    pr.round_name,
    sg.leader_user_id,
    leader.full_name AS leader_name,
    COUNT(CASE WHEN gm.status = 'active' THEN 1 END) AS active_member_count,
    sg.created_at
FROM student_groups sg
JOIN project_rounds pr ON pr.id = sg.project_round_id
JOIN users leader ON leader.id = sg.leader_user_id
LEFT JOIN group_members gm ON gm.group_id = sg.id
GROUP BY
    sg.id, sg.group_code, sg.group_name, sg.description, sg.status,
    sg.project_round_id, pr.round_name, sg.leader_user_id,
    leader.full_name, sg.created_at;

CREATE OR REPLACE VIEW vw_group_member_details AS
SELECT
    gm.id AS group_member_id,
    sg.id AS group_id,
    sg.group_code,
    sg.group_name,
    u.id AS user_id,
    u.student_code,
    u.full_name,
    u.email,
    gm.member_role,
    gm.status AS membership_status,
    gm.joined_at,
    gm.left_at
FROM group_members gm
JOIN student_groups sg ON sg.id = gm.group_id
JOIN users u ON u.id = gm.user_id;

-- ===== file examp.sql =====
-- Du lieu demo cho schema eduprojecthub. Chi import mot lan tren database moi.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT INTO users
(id, username, student_code, full_name, email, password_hash, role, account_status)
VALUES
(1, 'sv', 'SV001', 'Nguyễn Văn A', 'sv@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(2, 'gv', NULL, 'TS. Trần Thị B', 'gv@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'lecturer', 'active'),
(3, 'admin', NULL, 'Quản trị viên', 'admin@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'admin', 'active'),
(4, 'sv2', 'SV002', 'Lê Thị Cúc', 'sv2@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(5, 'sv3', 'SV003', 'Phạm Minh Đức', 'sv3@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(6, 'sv4', 'SV004', 'Võ Thanh Hà', 'sv4@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(7, 'sv5', 'SV005', 'Trần Minh Phúc', 'sv5@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active'),
(8, 'sv6', 'SV006', 'Hoàng Gia Bảo', 'sv6@example.com', '$2y$12$1WpK276evKl3axMgnB97ke0BQAUCECdTwIp7lPeCtSPt1S/uioKGy', 'student', 'active');

INSERT INTO project_rounds
(id, round_code, round_name, semester, academic_year, start_date, end_date, min_members, max_members, status)
VALUES
(1, 'DA_HK1_2026', 'Đồ án học kỳ 1 năm 2026', 'Học kỳ 1', '2026-2027',
 '2026-09-01', '2027-01-31', 2, 7, 'open');

INSERT INTO student_groups
(id, group_code, group_name, description, project_round_id, leader_user_id, created_by, status)
VALUES
(1, 'N01', 'Nhóm EduProjectHub', 'Xây dựng hệ thống quản lý đồ án sinh viên.', 1, 1, 1, 'active'),
(2, 'N02', 'Nhóm Thư viện số', 'Ứng dụng tra cứu tài liệu.', 1, 6, 6, 'forming');

INSERT INTO group_members (group_id, user_id, member_role, status) VALUES
(1, 1, 'leader', 'active'),
(1, 5, 'member', 'active'),
(1, 4, 'member', 'active'),
(2, 6, 'leader', 'active'),
(2, 7, 'member', 'active');

INSERT INTO group_lecturers (group_id, lecturer_user_id, assigned_by) VALUES
(1, 2, 3),
(2, 2, 3);

INSERT INTO tasks
(id, group_id, title, description, assigned_to, created_by, priority, status, due_at, completed_at)
VALUES
(1, 1, 'Phân tích yêu cầu', 'Tổng hợp yêu cầu hệ thống.', 1, 1, 'high', 'in_progress', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), NULL);

-- ===== schema-reports.sql =====
-- Bao cao cua nhom do an trong schema eduprojecthub.
-- Can import Tai_khoan.sql, quan_ly_do_an.sql, quan_ly_nhom.sql va quan_ly_thanh_vien.sql truoc.
USE eduprojecthub;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    report_type ENUM('weekly','midterm','final','other') NOT NULL DEFAULT 'other',
    description TEXT NULL,
    deadline DATETIME NULL,
    status ENUM('open','closed','graded') NOT NULL DEFAULT 'open',
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reports_group_status (group_id, status),
    CONSTRAINT fk_reports_group FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS report_versions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT UNSIGNED NOT NULL,
    version_no INT UNSIGNED NOT NULL,
    submitted_by BIGINT UNSIGNED NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    note TEXT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_report_versions (report_id, version_no),
    INDEX idx_report_versions_submitter (submitted_by, submitted_at),
    CONSTRAINT fk_report_versions_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_versions_submitter FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS report_feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_version_id BIGINT UNSIGNED NOT NULL,
    lecturer_user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    score DECIMAL(4,2) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_feedback_version (report_version_id, created_at),
    CONSTRAINT fk_report_feedback_version FOREIGN KEY (report_version_id) REFERENCES report_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_feedback_lecturer FOREIGN KEY (lecturer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_report_feedback_score CHECK (score IS NULL OR (score >= 0 AND score <= 10))
) ENGINE=InnoDB;

-- ===== schema-defense-grades.sql =====
-- Lich bao ve va diem so, dung chung users/project_rounds/student_groups.
-- Can import cac schema nen trong database/README.md truoc.
USE eduprojecthub;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS defense_councils (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_round_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_defense_councils_round (project_round_id),
    CONSTRAINT fk_defense_councils_round FOREIGN KEY (project_round_id) REFERENCES project_rounds(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS defense_council_members (
    council_id BIGINT UNSIGNED NOT NULL,
    lecturer_user_id BIGINT UNSIGNED NOT NULL,
    council_role ENUM('chair','secretary','member') NOT NULL DEFAULT 'member',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (council_id, lecturer_user_id),
    CONSTRAINT fk_defense_council_members_council FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_council_members_lecturer FOREIGN KEY (lecturer_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS defense_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    council_id BIGINT UNSIGNED NOT NULL,
    group_id BIGINT UNSIGNED NOT NULL,
    defense_at DATETIME NOT NULL,
    location VARCHAR(150) NULL,
    status ENUM('scheduled','completed','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
    note TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_defense_schedules_group (group_id, status),
    INDEX idx_defense_schedules_time (council_id, defense_at),
    CONSTRAINT fk_defense_schedules_council FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_schedules_group FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS defense_scores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT UNSIGNED NOT NULL,
    student_user_id BIGINT UNSIGNED NOT NULL,
    lecturer_user_id BIGINT UNSIGNED NOT NULL,
    score DECIMAL(4,2) NOT NULL,
    comment TEXT NULL,
    graded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_defense_scores (schedule_id, student_user_id, lecturer_user_id),
    CONSTRAINT fk_defense_scores_schedule FOREIGN KEY (schedule_id) REFERENCES defense_schedules(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_scores_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_defense_scores_lecturer FOREIGN KEY (lecturer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_defense_scores_score CHECK (score >= 0 AND score <= 10)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS final_grades (
    group_id BIGINT UNSIGNED NOT NULL,
    student_user_id BIGINT UNSIGNED NOT NULL,
    total_score DECIMAL(4,2) NOT NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    note TEXT NULL,
    published_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, student_user_id),
    CONSTRAINT fk_final_grades_group FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_final_grades_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_final_grades_score CHECK (total_score >= 0 AND total_score <= 10)
) ENGINE=InnoDB;

-- ===== schema-chatbot-faqs.sql =====
-- FAQ va lich su chatbot trong database eduprojecthub.
USE eduprojecthub;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS chatbot_faqs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_chatbot_faqs_question (question),
    INDEX idx_chatbot_faqs_status (status, category),
    CONSTRAINT fk_chatbot_faqs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_chat_sessions_user_updated (user_id, updated_at),
    CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    sender ENUM('user','assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_messages_session (session_id, created_at),
    CONSTRAINT fk_chat_messages_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== seed-reports.sql =====
-- Du lieu mau bao cao; import sau file examp.sql va schema-reports.sql.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT IGNORE INTO reports
(id, group_id, title, report_type, description, deadline, status, created_by)
VALUES
(1, 1, 'Báo cáo giữa kỳ', 'midterm',
 'Tổng kết tiến độ, kết quả và kế hoạch thực hiện tiếp theo.',
 '2026-11-20 23:59:00', 'open', 2),
(2, 1, 'Báo cáo cuối kỳ', 'final',
 'Báo cáo hoàn chỉnh kèm phụ lục minh chứng.',
 '2027-01-10 23:59:00', 'open', 2);

-- ===== seed-defense-grades.sql =====
-- Du lieu mau bao ve va diem; import sau file examp.sql va schema-defense-grades.sql.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT IGNORE INTO defense_councils (id, project_round_id, name) VALUES
(1, 1, 'Hội đồng bảo vệ 01');

INSERT IGNORE INTO defense_council_members (council_id, lecturer_user_id, council_role) VALUES
(1, 2, 'chair');

INSERT IGNORE INTO defense_schedules
(id, council_id, group_id, defense_at, location, status, note) VALUES
(1, 1, 1, '2027-01-20 08:00:00', 'Phòng A101', 'scheduled', 'Chuẩn bị slide và demo hệ thống.');

INSERT IGNORE INTO defense_scores
(schedule_id, student_user_id, lecturer_user_id, score, comment) VALUES
(1, 1, 2, 8.50, 'Nắm vững đề tài, trả lời tốt.');

INSERT IGNORE INTO final_grades
(group_id, student_user_id, total_score, status, note, published_at) VALUES
(1, 1, 8.30, 'published', 'Tổng hợp điểm quá trình và điểm bảo vệ.', CURRENT_TIMESTAMP);

-- ===== seed-chatbot-faqs.sql =====
-- Du lieu FAQ mau; import sau file examp.sql va schema-chatbot-faqs.sql.
USE eduprojecthub;
SET NAMES utf8mb4;

INSERT INTO chatbot_faqs (question, answer, category, status, created_by) VALUES
('Khi nào hết hạn đăng ký đề tài?',
 'Thời hạn đăng ký được công bố theo từng đợt trong học kỳ. Hãy xem mục Học kỳ để biết hạn cụ thể.',
 'Học kỳ', 'published', 3),
('Tôi nộp báo cáo ở đâu?',
 'Vào mục Báo cáo, chọn đợt đang mở và tải tệp PDF hoặc Word lên.',
 'Báo cáo', 'published', 3),
('Làm sao để xem điểm đồ án?',
 'Vào mục Điểm số để xem điểm tổng kết sau khi giảng viên công bố.',
 'Điểm số', 'published', 3),
('Làm sao để tham gia nhóm đồ án?',
 'Liên hệ trưởng nhóm hoặc giảng viên để được thêm vào nhóm đồ án.',
 'Nhóm', 'published', 3)
ON DUPLICATE KEY UPDATE answer = VALUES(answer);

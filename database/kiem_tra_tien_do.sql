USE eduprojecthub;

-- =========================================================
-- TRIGGERS KIEM TRA NGHIEP VU
-- Luu y: chay file nay sau khi da tao day du cac bang.
-- =========================================================

DROP TRIGGER IF EXISTS trg_group_member_before_insert;
DROP TRIGGER IF EXISTS trg_group_member_before_update;
DROP TRIGGER IF EXISTS trg_group_member_after_insert;
DROP TRIGGER IF EXISTS trg_group_member_after_update;
DROP TRIGGER IF EXISTS trg_group_members_guard_leader_update;
DROP TRIGGER IF EXISTS trg_group_members_guard_leader_delete;
DROP TRIGGER IF EXISTS trg_student_groups_create_leader;
DROP TRIGGER IF EXISTS trg_student_groups_guard_leader_update;

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

    IF v_role IS NULL OR v_role NOT IN ('student', 'team_leader') THEN
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

    IF NEW.status = 'active' AND (v_role IS NULL OR v_role NOT IN ('student', 'team_leader')) THEN
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

-- 3. Dong bo leader_user_id khi cap nhat vai tro.
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
             AND status = 'active'
             AND member_role = 'leader'
       ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Truong nhom phai la thanh vien dang hoat dong';
    END IF;
END$$

DELIMITER ;

-- QUY TAC BO SUNG:
-- Khi doi truong nhom, Backend nen thuc hien trong mot transaction:
-- 1) Promote the active member to leader, then demote the previous leader.
-- Trigger se cap nhat student_groups.leader_user_id.
-- Backend phai dam bao buoc 2 thanh cong; khong de nhom khong co truong nhom.

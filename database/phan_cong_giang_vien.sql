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
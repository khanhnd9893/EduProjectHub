USE eduprojecthub;

-- Back up the database before applying this migration.
ALTER TABLE users
    MODIFY COLUMN role ENUM('admin','student','team_leader','lecturer','training_manager')
    NOT NULL DEFAULT 'student'
    COMMENT 'Vai tro tai khoan; quyen truong nhom van phu thuoc group_members trong tung nhom';

ALTER TABLE chatbot_faqs
    MODIFY COLUMN visibility ENUM('all','admin','student','team_leader','lecturer','training_manager')
    NOT NULL DEFAULT 'all';

-- One-time migration for an existing eduprojecthub.users table created before username was added.
-- Back up the database before running this file. Do not run it after the updated Tai_khoan.sql.
USE eduprojecthub;

ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER id;
UPDATE users SET username = CONCAT('user', id) WHERE username IS NULL OR username = '';
ALTER TABLE users
    MODIFY username VARCHAR(50) NOT NULL,
    ADD UNIQUE KEY uq_users_username (username);

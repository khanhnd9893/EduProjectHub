USE eduprojecthub;

-- Run once on an existing database; back up the database before applying.
ALTER TABLE group_invitations
    ADD COLUMN invite_code CHAR(16) NULL AFTER invited_by;

UPDATE group_invitations
SET invite_code = UPPER(SUBSTRING(SHA2(CONCAT(UUID(), ':', id), 256), 1, 16))
WHERE invite_code IS NULL;

ALTER TABLE group_invitations
    MODIFY invite_code CHAR(16) NOT NULL,
    ADD UNIQUE KEY uq_invitation_code (invite_code);

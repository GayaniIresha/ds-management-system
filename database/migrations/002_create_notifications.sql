CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    application_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'application_update',
    event_key VARCHAR(190) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    KEY ix_notifications_user_read_created (user_id, is_read, created_at),
    KEY ix_notifications_application (application_id),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_application
        FOREIGN KEY (application_id) REFERENCES applications (application_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'notifications'
       AND COLUMN_NAME = 'notification_type') = 0,
    'ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) NOT NULL DEFAULT ''application_update''',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'notifications'
       AND INDEX_NAME = 'ix_notifications_user_read_created') = 0,
    'CREATE INDEX ix_notifications_user_read_created ON notifications (user_id, is_read, created_at)',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'notifications'
       AND CONSTRAINT_NAME = 'fk_notifications_user') = 0,
    'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'notifications'
       AND CONSTRAINT_NAME = 'fk_notifications_application') = 0,
    'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_application FOREIGN KEY (application_id) REFERENCES applications (application_id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'notifications'
       AND COLUMN_NAME = 'event_key') = 0,
    'ALTER TABLE notifications ADD COLUMN event_key VARCHAR(190) NULL',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE notifications
SET event_key = CONCAT('legacy:', notification_id)
WHERE event_key IS NULL OR event_key = '';

ALTER TABLE notifications
    MODIFY COLUMN event_key VARCHAR(190) NOT NULL;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'notifications'
       AND INDEX_NAME = 'uq_notifications_event_recipient') = 0,
    'CREATE UNIQUE INDEX uq_notifications_event_recipient ON notifications (event_key, user_id)',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'applications'
       AND COLUMN_NAME = 'assigned_officer_id') = 0,
    'ALTER TABLE applications ADD COLUMN assigned_officer_id INT NULL',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'applications'
       AND INDEX_NAME = 'ix_applications_assigned_officer') = 0,
    'CREATE INDEX ix_applications_assigned_officer ON applications (assigned_officer_id)',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_ddl = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'applications'
       AND CONSTRAINT_NAME = 'fk_applications_assigned_officer') = 0,
    'ALTER TABLE applications ADD CONSTRAINT fk_applications_assigned_officer FOREIGN KEY (assigned_officer_id) REFERENCES users (user_id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

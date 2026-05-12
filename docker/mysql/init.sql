-- ================================================
-- HRMS Narwasthu Group - MySQL Initialization
-- ================================================

CREATE DATABASE IF NOT EXISTS `hrm_saas` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Note: 'hrms_user' is created automatically by Docker's MYSQL_USER/MYSQL_PASSWORD env vars.
-- We only need to ensure replication user and proper grants exist.

-- Create replication user
CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED WITH 'mysql_native_password' BY 'ReplicaPass2026!';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'%';

-- Ensure hrms_user has full privileges (Docker creates user but may not grant all)
GRANT ALL PRIVILEGES ON `hrm_saas`.* TO 'hrms_user'@'%';

-- Allow root from any host (for cross-container management)
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- ================================================
-- HRMS Narwasthu Group - MySQL Initialization
-- ================================================

CREATE DATABASE IF NOT EXISTS `hrm_saas` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Create user with native password for compatibility
CREATE USER IF NOT EXISTS 'hrms_user'@'%' IDENTIFIED WITH 'mysql_native_password' BY 'HrmsSecure2026!';

-- Create replication user
CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED WITH 'mysql_native_password' BY 'ReplicaPass2026!';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'%';

-- Grant privileges
GRANT ALL PRIVILEGES ON `hrm_saas`.* TO 'hrms_user'@'%';
FLUSH PRIVILEGES;

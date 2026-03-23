-- ================================================
-- HRMS Narwasthu Group - MySQL Initialization
-- ================================================

CREATE DATABASE IF NOT EXISTS `hrm_saas` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Grant privileges
GRANT ALL PRIVILEGES ON `hrm_saas`.* TO 'hrms_user'@'%';
FLUSH PRIVILEGES;

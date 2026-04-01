-- ================================================
-- HRMS Narwasthu Group - MySQL Slave Initialization
-- ================================================
-- Script ini akan otomatis dieksekusi HANYA 1x saat pertama kali
-- database Slave dibuat dari nol (blank volume).
-- Sehingga developer lain tidak perlu copy-paste command di terminal lagi.

CHANGE REPLICATION SOURCE TO 
    SOURCE_HOST='mysql-master', 
    SOURCE_USER='repl_user', 
    SOURCE_PASSWORD='ReplicaPass2026!', 
    SOURCE_AUTO_POSITION=1;

START REPLICA;

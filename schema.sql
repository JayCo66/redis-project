-- สร้าง Database
CREATE DATABASE IF NOT EXISTS `redis_project`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `redis_project`;

-- สร้างตาราง users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ข้อมูลทดสอบ (username: admin, password: password123)
INSERT IGNORE INTO `users` (`username`, `password`)
VALUES ('admin', '$2b$10$rL4mXYK6qJrxS8Dz/yVbD.LMGLCcRqZgPXbn4dnxLY7Vtt1tq9AR6');

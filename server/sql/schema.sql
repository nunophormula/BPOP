-- Schema completo da base de dados "pdl1" (estrutura apenas, sem dados).
-- Gerado a partir da instância de desenvolvimento local em 2026-08-13.
-- Para popular referências depois de criar as tabelas: plataformas/anticorpos
-- em server/scripts/seed-reference-data.js, biomarcadores/resultados em
-- server/sql/seed-biomarkers.sql.

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `hospitals`;
CREATE TABLE `hospitals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `distrito` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `login`;
CREATE TABLE `login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `token` varchar(255) DEFAULT NULL,
  `role` enum('admin','adminHospital','repHospitalar') NOT NULL DEFAULT 'repHospitalar',
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `idx_hospital` (`hospital_id`),
  KEY `fk_login_created_by` (`created_by`),
  CONSTRAINT `fk_login_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_login_hospitais` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `platforms`;
CREATE TABLE `platforms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `status` enum('approved','pending','rejected') NOT NULL DEFAULT 'approved',
  `admin_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome_unique` (`nome`),
  KEY `admin_id` (`admin_id`),
  KEY `fk_platforms_created_by` (`created_by`),
  KEY `fk_platforms_hospital_id` (`hospital_id`),
  KEY `fk_platforms_reviewed_by` (`reviewed_by`),
  KEY `idx_platforms_status` (`status`),
  CONSTRAINT `fk_platforms_admin` FOREIGN KEY (`admin_id`) REFERENCES `login` (`id`),
  CONSTRAINT `fk_platforms_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_platforms_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_platforms_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `login` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `antibodies`;
CREATE TABLE `antibodies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `status` enum('approved','pending','rejected') NOT NULL DEFAULT 'approved',
  `admin_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome_unique` (`nome`),
  KEY `admin_id` (`admin_id`),
  KEY `fk_antibodies_created_by` (`created_by`),
  KEY `fk_antibodies_hospital_id` (`hospital_id`),
  KEY `fk_antibodies_reviewed_by` (`reviewed_by`),
  KEY `idx_antibodies_status` (`status`),
  CONSTRAINT `fk_antibodies_admin` FOREIGN KEY (`admin_id`) REFERENCES `login` (`id`),
  CONSTRAINT `fk_antibodies_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_antibodies_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_antibodies_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `login` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `biomarkers`;
CREATE TABLE `biomarkers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`keywords`)),
  `admin_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome_unique` (`nome`),
  KEY `fk_biomarkers_admin` (`admin_id`),
  KEY `fk_biomarkers_created_by` (`created_by`),
  CONSTRAINT `fk_biomarkers_admin` FOREIGN KEY (`admin_id`) REFERENCES `login` (`id`),
  CONSTRAINT `fk_biomarkers_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `biomarker_results`;
CREATE TABLE `biomarker_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `biomarker_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`keywords`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_biomarker_results_biomarker` (`biomarker_id`),
  CONSTRAINT `fk_biomarker_results_biomarker` FOREIGN KEY (`biomarker_id`) REFERENCES `biomarkers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `hospital_technical`;
CREATE TABLE `hospital_technical` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hospital_id` int(11) NOT NULL,
  `biomarcador` varchar(100) NOT NULL,
  `topografia` varchar(255) DEFAULT NULL,
  `plataforma` varchar(255) DEFAULT NULL,
  `plataforma_id` int(11) DEFAULT NULL,
  `anticorpo` varchar(255) DEFAULT NULL,
  `anticorpo_id` int(11) DEFAULT NULL,
  `technical_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hospital_id` (`hospital_id`),
  KEY `fk_hospital_technical_plataforma` (`plataforma_id`),
  KEY `fk_hospital_technical_anticorpo` (`anticorpo_id`),
  CONSTRAINT `fk_hospital_technical_anticorpo` FOREIGN KEY (`anticorpo_id`) REFERENCES `antibodies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hospital_technical_plataforma` FOREIGN KEY (`plataforma_id`) REFERENCES `platforms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `submissions`;
CREATE TABLE `submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient` varchar(100) DEFAULT NULL,
  `diagnostic` varchar(100) DEFAULT NULL,
  `hospital_id` int(11) NOT NULL,
  `login_id` int(11) NOT NULL,
  `type` varchar(10) DEFAULT NULL,
  `biomarcador` varchar(50) DEFAULT NULL,
  `topografia` varchar(255) DEFAULT NULL,
  `plataforma` varchar(255) DEFAULT NULL,
  `plataforma_id` int(11) DEFAULT NULL,
  `anticorpo` varchar(255) DEFAULT NULL,
  `anticorpo_id` int(11) DEFAULT NULL,
  `produto` varchar(255) DEFAULT NULL,
  `resultado` varchar(255) DEFAULT NULL,
  `technical_data` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_submission_her2_hospital` (`hospital_id`),
  KEY `fk_submission_her2_login` (`login_id`),
  KEY `process_number_2` (`patient`),
  KEY `fk_submissions_plataforma` (`plataforma_id`),
  KEY `fk_submissions_anticorpo` (`anticorpo_id`),
  CONSTRAINT `fk_submission_her2_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  CONSTRAINT `fk_submission_her2_login` FOREIGN KEY (`login_id`) REFERENCES `login` (`id`),
  CONSTRAINT `fk_submissions_anticorpo` FOREIGN KEY (`anticorpo_id`) REFERENCES `antibodies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_submissions_plataforma` FOREIGN KEY (`plataforma_id`) REFERENCES `platforms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=349 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `submission_items`;
CREATE TABLE `submission_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `submission_id` int(11) NOT NULL,
  `item_data` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_submission_items_submission` (`submission_id`),
  CONSTRAINT `fk_submission_items_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `user_email` varchar(100) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hospital_id` (`hospital_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS=1;

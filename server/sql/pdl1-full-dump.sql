-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 19, 2026 at 01:34 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pdl1`
--

-- --------------------------------------------------------

--
-- Table structure for table `antibodies`
--

CREATE TABLE `antibodies` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `status` enum('approved','pending','rejected') NOT NULL DEFAULT 'approved',
  `admin_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `antibodies`
--

INSERT INTO `antibodies` (`id`, `nome`, `status`, `admin_id`, `created_by`, `hospital_id`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(3, 'VENTANA anti-HER2/neu (4B5)', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(4, 'HercepTest™ mAb pharmDx (D4D4)', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(5, 'Bond Oracle HER2 IHC System', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(6, 'PD-L1 IHC 22C3 pharmDx', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(7, 'VENTANA PD-L1 (SP263)', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(8, 'VENTANA PD-L1 (SP142)', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(9, 'PD-L1 IHC 28-8 pharmDx', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(10, 'novo anticorpo', 'rejected', NULL, 1, 4, 5, '2026-07-22 10:09:23', '2026-07-21 09:35:50'),
(11, 'novo teste', 'rejected', NULL, 1, 4, 5, '2026-07-22 10:09:26', '2026-07-21 09:54:20'),
(12, 'teste', 'rejected', NULL, 1, 4, 5, '2026-07-22 10:09:22', '2026-07-21 09:54:52'),
(13, 'testee', 'rejected', NULL, 1, 4, 5, '2026-07-22 10:09:19', '2026-07-22 08:59:49'),
(14, 'anticorpo', 'pending', NULL, 1, 4, NULL, NULL, '2026-07-23 13:11:55');

-- --------------------------------------------------------

--
-- Table structure for table `biomarkers`
--

CREATE TABLE `biomarkers` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`keywords`)),
  `admin_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `biomarkers`
--

INSERT INTO `biomarkers` (`id`, `nome`, `keywords`, `admin_id`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 'HER2', '[\"her2\",\"her-2\",\"her 2\",\"erbb2\",\"erb-b2\",\"c-erbb2\",\"cerb-2\",\"cerb2\",\"c erb b2\"]', 5, 5, '2026-07-23 14:13:32', '2026-07-23 14:13:32'),
(3, 'PD-L1', '[\"pd-l1\",\"pdl1\",\"pd l1\",\"programmed death ligand 1\",\"22c3\",\"28-8\",\"sp263\",\"sp142\"]', 5, 5, '2026-07-23 14:13:32', '2026-07-23 14:13:32'),
(4, 'RE', '[\"recetor de estrogenio\",\"receptor de estrogenio\",\"recetor estrogenico\",\"receptor estrogenico\",\"estrogen receptor\",\"receptores de estrogenio\",\"re imuno-histoquimica\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(5, 'RP', '[\"recetor de progesterona\",\"receptor de progesterona\",\"progesterone receptor\",\"recetor progestativo\",\"receptor progestativo\",\"receptores de progesterona\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(6, 'Ki67', '[\"ki67\",\"ki-67\",\"ki 67\",\"indice de proliferacao\",\"indice proliferativo\",\"mib-1\",\"mib1\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(7, 'MLH1', '[\"mlh1\",\"mlh-1\",\"mlh 1\",\"mutl homolog 1\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(8, 'PMS2', '[\"pms2\",\"pms-2\",\"pms 2\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(9, 'MSH2', '[\"msh2\",\"msh-2\",\"msh 2\",\"muts homolog 2\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(10, 'MSH6', '[\"msh6\",\"msh-6\",\"msh 6\",\"muts homolog 6\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(11, 'Claudina 18.2', '[\"claudina 18.2\",\"claudin 18.2\",\"cldn18.2\",\"cldn18\",\"claudina-18.2\",\"claudina 18\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(12, 'EBER', '[\"eber\",\"eber-ish\",\"epstein-barr encoding region\",\"hibridizacao in situ eber\",\"eber ish\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(13, 'p53', '[\"p53\",\"tp53\",\"proteina p53\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12'),
(14, 'FOLR1', '[\"folr1\",\"folr-1\",\"folate receptor alpha\",\"receptor de folato alfa\",\"receptor do folato\"]', 5, 5, '2026-07-23 14:22:12', '2026-07-23 14:22:12');

-- --------------------------------------------------------

--
-- Table structure for table `biomarker_results`
--

CREATE TABLE `biomarker_results` (
  `id` int(11) NOT NULL,
  `biomarker_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`keywords`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `biomarker_results`
--

INSERT INTO `biomarker_results` (`id`, `biomarker_id`, `value`, `keywords`, `created_at`) VALUES
(4, 2, 'Negativo', '[\"negativo\"]', '2026-07-23 14:15:07'),
(5, 2, 'Negativo (score 0)', '[\"negativo (score 0)\"]', '2026-07-23 14:15:07'),
(6, 2, 'Negativo (score 0+)', '[\"negativo (score 0+)\"]', '2026-07-23 14:15:07'),
(7, 2, 'Score 1+', '[\"score 1+\"]', '2026-07-23 14:15:07'),
(8, 2, 'Equívoco (Score 2+)', '[\"equívoco (score 2+)\"]', '2026-07-23 14:15:07'),
(9, 2, 'Positivo (Score 3+)', '[\"positivo (score 3+)\"]', '2026-07-23 14:15:07'),
(10, 2, 'Positivo', '[\"positivo\"]', '2026-07-23 14:15:07'),
(11, 2, 'Inadequado para avaliação', '[\"inadequado para avaliação\"]', '2026-07-23 14:15:07'),
(12, 4, 'Positivo', '[\"positivo\",\"re positivo\"]', '2026-07-23 14:22:12'),
(13, 4, 'Negativo', '[\"negativo\",\"re negativo\"]', '2026-07-23 14:22:12'),
(14, 4, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(15, 5, 'Positivo', '[\"positivo\",\"rp positivo\"]', '2026-07-23 14:22:12'),
(16, 5, 'Negativo', '[\"negativo\",\"rp negativo\"]', '2026-07-23 14:22:12'),
(17, 5, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(18, 6, 'Baixo (<10%)', '[\"baixo\",\"ki67 baixo\"]', '2026-07-23 14:22:12'),
(19, 6, 'Intermédio (10-20%)', '[\"intermedio\",\"ki67 intermedio\"]', '2026-07-23 14:22:12'),
(20, 6, 'Alto (≥20%)', '[\"alto\",\"ki67 alto\",\"elevado\"]', '2026-07-23 14:22:12'),
(21, 7, 'Preservado (retido)', '[\"preservado\",\"retido\",\"expressao mantida\",\"nuclear positivo\"]', '2026-07-23 14:22:12'),
(22, 7, 'Perdido (ausente)', '[\"perdido\",\"ausente\",\"perda de expressao\",\"nuclear negativo\"]', '2026-07-23 14:22:12'),
(23, 7, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(24, 8, 'Preservado (retido)', '[\"preservado\",\"retido\",\"expressao mantida\",\"nuclear positivo\"]', '2026-07-23 14:22:12'),
(25, 8, 'Perdido (ausente)', '[\"perdido\",\"ausente\",\"perda de expressao\",\"nuclear negativo\"]', '2026-07-23 14:22:12'),
(26, 8, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(27, 9, 'Preservado (retido)', '[\"preservado\",\"retido\",\"expressao mantida\",\"nuclear positivo\"]', '2026-07-23 14:22:12'),
(28, 9, 'Perdido (ausente)', '[\"perdido\",\"ausente\",\"perda de expressao\",\"nuclear negativo\"]', '2026-07-23 14:22:12'),
(29, 9, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(30, 10, 'Preservado (retido)', '[\"preservado\",\"retido\",\"expressao mantida\",\"nuclear positivo\"]', '2026-07-23 14:22:12'),
(31, 10, 'Perdido (ausente)', '[\"perdido\",\"ausente\",\"perda de expressao\",\"nuclear negativo\"]', '2026-07-23 14:22:12'),
(32, 10, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(33, 11, 'Positivo (≥75%)', '[\"positivo\"]', '2026-07-23 14:22:12'),
(34, 11, 'Negativo (<75%)', '[\"negativo\"]', '2026-07-23 14:22:12'),
(35, 11, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(36, 12, 'Positivo', '[\"positivo\"]', '2026-07-23 14:22:12'),
(37, 12, 'Negativo', '[\"negativo\"]', '2026-07-23 14:22:12'),
(38, 12, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(39, 13, 'Padrão selvagem (wild-type)', '[\"padrao selvagem\",\"wild-type\",\"wild type\"]', '2026-07-23 14:22:12'),
(40, 13, 'Sobrexpressão (mutante)', '[\"sobrexpressao\",\"overexpression\"]', '2026-07-23 14:22:12'),
(41, 13, 'Ausência completa (nulo/mutante)', '[\"ausencia completa\",\"nulo\",\"null pattern\"]', '2026-07-23 14:22:12'),
(42, 13, 'Padrão citoplasmático (mutante)', '[\"citoplasmatico\",\"padrao citoplasmatico\"]', '2026-07-23 14:22:12'),
(43, 13, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(44, 14, 'Positivo (≥75%)', '[\"positivo\"]', '2026-07-23 14:22:12'),
(45, 14, 'Negativo (<75%)', '[\"negativo\"]', '2026-07-23 14:22:12'),
(46, 14, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\",\"nao interpretavel\"]', '2026-07-23 14:22:12'),
(47, 3, 'TPS < 1%', '[\"tps < 1\",\"tps negativo\"]', '2026-07-23 14:22:12'),
(48, 3, 'TPS 1-49%', '[\"tps 1-49\",\"tps intermedio\"]', '2026-07-23 14:22:12'),
(49, 3, 'TPS ≥ 50%', '[\"tps >= 50\",\"tps alto\",\"tps elevado\"]', '2026-07-23 14:22:12'),
(50, 3, 'CPS < 1', '[\"cps < 1\",\"cps negativo\"]', '2026-07-23 14:22:12'),
(51, 3, 'CPS 1-9', '[\"cps 1-9\"]', '2026-07-23 14:22:12'),
(52, 3, 'CPS ≥ 10', '[\"cps >= 10\",\"cps elevado\"]', '2026-07-23 14:22:12'),
(53, 3, 'Positivo', '[\"positivo\"]', '2026-07-23 14:22:12'),
(54, 3, 'Negativo', '[\"negativo\"]', '2026-07-23 14:22:12'),
(55, 3, 'Não avaliável', '[\"nao avaliavel\",\"inadequado\"]', '2026-07-23 14:22:12');

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `distrito` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`id`, `nome`, `email`, `telefone`, `distrito`, `created_at`, `updated_at`) VALUES
(1, 'IPO Lisboa', 'ipolisboa@teste.pt', '911111111111', 'Lisboa', '2026-01-27 11:29:36', '2026-05-19 13:11:32'),
(2, 'IPO Faro', 'ipoporto@teste.pt', '911111111111', 'Faro', '2026-01-27 11:29:36', '2026-02-04 10:35:16'),
(4, 'IPO Aveiro', 'nunosimorees.dev@gmail.comm', '916673019', 'Aveiro', '2026-05-22 09:12:37', '2026-07-01 14:26:57');

-- --------------------------------------------------------

--
-- Table structure for table `hospital_technical`
--

CREATE TABLE `hospital_technical` (
  `id` int(11) NOT NULL,
  `hospital_id` int(11) NOT NULL,
  `biomarcador` varchar(100) NOT NULL,
  `topografia` varchar(255) DEFAULT NULL,
  `plataforma` varchar(255) DEFAULT NULL,
  `plataforma_id` int(11) DEFAULT NULL,
  `anticorpo` varchar(255) DEFAULT NULL,
  `anticorpo_id` int(11) DEFAULT NULL,
  `technical_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hospital_technical`
--

INSERT INTO `hospital_technical` (`id`, `hospital_id`, `biomarcador`, `topografia`, `plataforma`, `plataforma_id`, `anticorpo`, `anticorpo_id`, `technical_data`, `created_at`) VALUES
(1, 4, 'PD-L1', 'Estômago', 'Roche BenchMark', NULL, 'VENTANA anti-HER2/neu (4B5)', NULL, '{\"hospital_id\":4,\"biomarcador\":\"PD-L1\",\"topografia\":\"Estômago\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"VENTANA anti-HER2/neu (4B5)\"}', '2026-07-06 15:25:40'),
(2, 4, 'HER2', 'Cólon e recto', 'Leica BOND', NULL, 'HercepTest™ mAb pharmDx (D4D4)', NULL, '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Cólon e recto\",\"plataforma\":\"Leica BOND\",\"anticorpo\":\"HercepTest™ mAb pharmDx (D4D4)\"}', '2026-07-06 16:18:45'),
(3, 4, 'PD-L1', 'Ovário', 'Roche BenchMark', NULL, 'HercepTest™ mAb pharmDx (D4D4)', NULL, '{\"hospital_id\":4,\"biomarcador\":\"PD-L1\",\"topografia\":\"Ovário\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"HercepTest™ mAb pharmDx (D4D4)\"}', '2026-07-06 16:20:19'),
(4, 4, 'PD-L1', 'Ovário', 'Leica BOND', NULL, 'HercepTest™ mAb pharmDx (D4D4)', NULL, '{\"hospital_id\":4,\"biomarcador\":\"PD-L1\",\"topografia\":\"Ovário\",\"plataforma\":\"Leica BOND\",\"anticorpo\":\"HercepTest™ mAb pharmDx (D4D4)\"}', '2026-07-06 17:07:53'),
(6, 4, 'PD-L1', 'Gânglio', 'Master/iONtite', NULL, 'HercepTest™ mAb pharmDx (D4D4)', NULL, '{\"hospital_id\":4,\"biomarcador\":\"PD-L1\",\"topografia\":\"Gânglio\",\"plataforma\":\"Master/iONtite\",\"anticorpo\":\"HercepTest™ mAb pharmDx (D4D4)\"}', '2026-07-08 08:46:26'),
(7, 4, 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-08 15:39:07'),
(9, 4, 'HER2', 'Estômago', 'nobo', NULL, 'testee', NULL, '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Estômago\",\"plataforma\":\"nobo\",\"anticorpo\":\"testee\",\"plataforma_id\":null,\"anticorpo_id\":null,\"criteriosUtilizados\":\"Destiny Breast 08 (mama)\",\"temperaturaBanhos\":10}', '2026-07-22 09:07:47'),
(10, 4, 'HER2', 'Bexiga', 'plataforma123', 10, 'anticorpo', 14, '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Bexiga\",\"plataforma\":\"plataforma123\",\"anticorpo\":\"anticorpo\",\"plataforma_id\":10,\"anticorpo_id\":14}', '2026-07-23 13:13:08');

-- --------------------------------------------------------

--
-- Table structure for table `login`
--

CREATE TABLE `login` (
  `id` int(11) NOT NULL,
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
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login`
--

INSERT INTO `login` (`id`, `nome`, `email`, `password`, `avatar`, `expires_at`, `cargo`, `telefone`, `hospital_id`, `is_admin`, `created_at`, `updated_at`, `token`, `role`, `created_by`) VALUES
(1, 'Nuno', 'nunosimoes.dev@gmail.com', '$2a$10$/.Vcd0A/p6CMInE2dybVT.RfwUZIPlMQoEVYSdvVjj2ZVwMylb4PK', '/uploads/avatars/avatar_1769681366210.jpeg', NULL, 'web developer', '916673019', 4, 0, '2026-01-28 10:55:38', '2026-07-21 09:35:10', NULL, 'repHospitalar', NULL),
(5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', '$2a$10$/.Vcd0A/p6CMInE2dybVT.RfwUZIPlMQoEVYSdvVjj2ZVwMylb4PK', '/uploads/avatars/avatar_1770201447944.png', NULL, 'web developer', '916673019', NULL, 1, '2026-01-28 11:15:42', '2026-07-14 10:31:07', NULL, 'admin', NULL),
(6, 'Hugo Oliveira', 'hugo.oliveira@phormulagroup.com', '$2a$10$/.Vcd0A/p6CMInE2dybVT.RfwUZIPlMQoEVYSdvVjj2ZVwMylb4PK', NULL, NULL, 'TESTE', '912107695', 4, 0, '2026-01-28 11:34:01', '2026-07-16 13:44:48', NULL, 'adminHospital', NULL),
(9, 'Nuno Simões', 'nunosimoeees.dev@gmail.com', NULL, NULL, NULL, 'cargo', '916673019', NULL, 1, '2026-02-03 11:54:48', '2026-07-14 10:31:07', NULL, 'admin', NULL),
(10, 'Carlos Cunha', 'carlos.cunha@phormulagroup.com', '$2a$10$/.Vcd0A/p6CMInE2dybVT.RfwUZIPlMQoEVYSdvVjj2ZVwMylb4PK', NULL, NULL, NULL, NULL, 1, 0, '2026-02-04 10:24:50', '2026-07-15 08:48:57', NULL, 'adminHospital', NULL),
(16, 'Nuno Simões', 'nunosim321oes.dev@gmail.com', NULL, NULL, NULL, 'teste', '916673019', 4, 0, '2026-05-22 09:17:44', '2026-07-14 10:31:07', NULL, 'adminHospital', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `logs`
--

INSERT INTO `logs` (`id`, `user_id`, `user_name`, `user_email`, `role`, `hospital_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(6, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-15 08:42:34'),
(7, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'logout', NULL, NULL, NULL, NULL, '2026-07-15 08:49:02'),
(8, 10, 'Carlos Cunha', 'carlos.cunha@phormulagroup.com', 'adminHospital', 1, 'login_success', NULL, NULL, NULL, NULL, '2026-07-15 08:49:17'),
(9, 10, 'Carlos Cunha', 'carlos.cunha@phormulagroup.com', 'adminHospital', 1, 'logout', NULL, NULL, NULL, NULL, '2026-07-15 08:50:34'),
(10, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 1, 'login_success', NULL, NULL, NULL, NULL, '2026-07-15 08:50:41'),
(11, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 1, 'logout', NULL, NULL, NULL, NULL, '2026-07-15 08:52:03'),
(13, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-15 09:13:21'),
(14, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 254, '{\"patient\":\"998836AA09\"}', NULL, '2026-07-15 15:14:48'),
(15, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 251, '{\"patient\":\"1BEFEB6FA0\"}', NULL, '2026-07-15 15:14:48'),
(16, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 249, '{\"patient\":\"28B8C9FE72\"}', NULL, '2026-07-15 15:14:48'),
(18, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 252, '{\"patient\":\"33172254D8\"}', NULL, '2026-07-15 15:14:48'),
(19, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 253, '{\"patient\":\"E552F587F1\"}', NULL, '2026-07-15 15:14:48'),
(20, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 255, '{\"patient\":\"8B4B7EA2DC\"}', NULL, '2026-07-15 15:14:48'),
(21, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 257, '{\"patient\":\"FC1543EB72\"}', NULL, '2026-07-15 15:14:48'),
(22, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 256, '{\"patient\":\"184A9BC1B3\"}', NULL, '2026-07-15 15:14:48'),
(23, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 259, '{\"patient\":\"302F7CCC1E\"}', NULL, '2026-07-15 15:14:48'),
(24, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 260, '{\"patient\":\"4D4016F9B8\"}', NULL, '2026-07-15 15:14:48'),
(25, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 261, '{\"patient\":\"F088CCF328\"}', NULL, '2026-07-15 15:14:48'),
(26, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 262, '{\"patient\":\"6BE6C41D4A\"}', NULL, '2026-07-15 15:14:48'),
(27, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 258, '{\"patient\":\"06DEC91AD5\"}', NULL, '2026-07-15 15:14:48'),
(29, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 264, '{\"patient\":\"5ABBDD0B05\"}', NULL, '2026-07-15 15:14:48'),
(30, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 265, '{\"patient\":\"15516BECE0\"}', NULL, '2026-07-15 15:14:48'),
(31, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 266, '{\"patient\":\"BDDA6D5B09\"}', NULL, '2026-07-15 15:14:48'),
(32, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 267, '{\"patient\":\"0ED4F27B59\"}', NULL, '2026-07-15 15:14:48'),
(33, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 268, '{\"patient\":\"DFC1FDE3DB\"}', NULL, '2026-07-15 15:14:48'),
(34, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 269, '{\"patient\":\"BCE75100CD\"}', NULL, '2026-07-15 15:14:48'),
(35, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 270, '{\"patient\":\"DF8822B0C4\"}', NULL, '2026-07-15 15:14:48'),
(36, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 271, '{\"patient\":\"0672E3FA18\"}', NULL, '2026-07-15 15:14:48'),
(37, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 272, '{\"patient\":\"1ADE16B7B8\"}', NULL, '2026-07-15 15:14:48'),
(39, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 274, '{\"patient\":\"BDF4A27BC7\"}', NULL, '2026-07-15 15:14:48'),
(40, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 275, '{\"patient\":\"0196553E3F\"}', NULL, '2026-07-15 15:14:48'),
(41, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_create', 'submission', 318, '{\"patient\":\"117CD9737F\"}', NULL, '2026-07-16 09:32:46'),
(42, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'submission_override', 'submission', 318, '{\"patient\":\"117CD9737F\"}', NULL, '2026-07-16 09:33:23'),
(43, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'logout', NULL, NULL, NULL, NULL, '2026-07-16 12:38:11'),
(44, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 1, 'login_success', NULL, NULL, NULL, NULL, '2026-07-16 12:38:21'),
(45, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 1, 'logout', NULL, NULL, NULL, NULL, '2026-07-16 12:42:07'),
(46, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_success', NULL, NULL, NULL, NULL, '2026-07-16 12:42:11'),
(47, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'logout', NULL, NULL, NULL, NULL, '2026-07-16 13:44:53'),
(48, 6, 'Hugo Oliveira', 'hugo.oliveira@phormulagroup.com', 'adminHospital', 4, 'login_success', NULL, NULL, NULL, NULL, '2026-07-16 13:45:05'),
(49, 6, 'Hugo Oliveira', 'hugo.oliveira@phormulagroup.com', 'adminHospital', 4, 'logout', NULL, NULL, NULL, NULL, '2026-07-21 09:10:56'),
(50, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-21 09:11:04'),
(51, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'logout', NULL, NULL, NULL, NULL, '2026-07-21 09:25:53'),
(52, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_failed', NULL, NULL, NULL, NULL, '2026-07-21 09:26:02'),
(53, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_failed', NULL, NULL, NULL, NULL, '2026-07-21 09:26:03'),
(54, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_failed', NULL, NULL, NULL, NULL, '2026-07-21 09:26:05'),
(55, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_failed', NULL, NULL, NULL, NULL, '2026-07-21 09:34:48'),
(56, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_failed', NULL, NULL, NULL, NULL, '2026-07-21 09:34:51'),
(57, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-21 09:34:58'),
(58, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'logout', NULL, NULL, NULL, NULL, '2026-07-21 09:35:14'),
(59, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_success', NULL, NULL, NULL, NULL, '2026-07-21 09:35:23'),
(60, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'antibody', 10, '{\"nome\":\"novo anticorpo\"}', NULL, '2026-07-21 09:35:50'),
(61, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'antibody', 11, '{\"nome\":\"novo teste\"}', NULL, '2026-07-21 09:54:20'),
(62, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'antibody', 12, '{\"nome\":\"teste\"}', NULL, '2026-07-21 09:54:52'),
(63, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'platform', 8, '{\"nome\":\"plataforma\"}', NULL, '2026-07-21 09:55:02'),
(64, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'antibody', 13, '{\"nome\":\"testee\"}', NULL, '2026-07-22 08:59:49'),
(65, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'platform', 9, '{\"nome\":\"nobo\"}', NULL, '2026-07-22 08:59:55'),
(66, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'logout', NULL, NULL, NULL, NULL, '2026-07-22 09:08:37'),
(67, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-22 09:08:53'),
(68, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'reject', 'antibody', 13, '{\"nome\":\"testee\",\"reason\":null}', NULL, '2026-07-22 09:09:19'),
(69, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'reject', 'antibody', 12, '{\"nome\":\"teste\",\"reason\":null}', NULL, '2026-07-22 09:09:22'),
(70, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'reject', 'antibody', 10, '{\"nome\":\"novo anticorpo\",\"reason\":null}', NULL, '2026-07-22 09:09:23'),
(71, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'reject', 'antibody', 11, '{\"nome\":\"novo teste\",\"reason\":null}', NULL, '2026-07-22 09:09:26'),
(72, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'logout', NULL, NULL, NULL, NULL, '2026-07-23 12:39:09'),
(73, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_success', NULL, NULL, NULL, NULL, '2026-07-23 12:39:14'),
(74, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_success', NULL, NULL, NULL, NULL, '2026-07-23 12:58:34'),
(75, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'logout', NULL, NULL, NULL, NULL, '2026-07-23 12:58:47'),
(76, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-23 12:58:51'),
(77, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'platform', 10, '{\"nome\":\"plataforma123\"}', NULL, '2026-07-23 13:11:36'),
(78, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'antibody', 14, '{\"nome\":\"anticorpo\"}', NULL, '2026-07-23 13:11:55'),
(79, 22, 'QA Smoke Test', 'qa-smoke-test@example.com', 'adminHospital', 1, 'login_success', NULL, NULL, NULL, NULL, '2026-07-27 08:48:34'),
(80, 22, 'QA Smoke Test', 'qa-smoke-test@example.com', 'adminHospital', 1, 'login_success', NULL, NULL, NULL, NULL, '2026-07-27 08:54:08'),
(81, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'logout', NULL, NULL, NULL, NULL, '2026-07-29 10:09:11'),
(82, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_success', NULL, NULL, NULL, NULL, '2026-07-29 10:09:35'),
(83, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'platform', 11, '{\"nome\":\"novotearaer\"}', NULL, '2026-07-29 10:10:00'),
(84, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'platform', 12, '{\"nome\":\"carlos\"}', NULL, '2026-07-29 10:10:45'),
(85, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'logout', NULL, NULL, NULL, NULL, '2026-07-29 10:30:37'),
(86, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-29 10:30:46'),
(87, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'logout', NULL, NULL, NULL, NULL, '2026-07-29 10:36:36'),
(88, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'login_success', NULL, NULL, NULL, NULL, '2026-07-29 10:36:42'),
(89, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'suggest', 'platform', 13, '{\"nome\":\"novaplataforma\"}', NULL, '2026-07-29 10:37:33'),
(90, 1, 'Nuno', 'nunosimoes.dev@gmail.com', 'repHospitalar', 4, 'logout', NULL, NULL, NULL, NULL, '2026-07-29 10:37:54'),
(91, 5, 'Nuno Simõess', 'nuno.simoes@phormulagroup.com', 'admin', NULL, 'login_success', NULL, NULL, NULL, NULL, '2026-07-29 10:38:00');

-- --------------------------------------------------------

--
-- Table structure for table `platforms`
--

CREATE TABLE `platforms` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `status` enum('approved','pending','rejected') NOT NULL DEFAULT 'approved',
  `admin_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `platforms`
--

INSERT INTO `platforms` (`id`, `nome`, `status`, `admin_id`, `created_by`, `hospital_id`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(1, 'Teste', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-10 15:29:29'),
(3, 'Roche BenchMark', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(4, 'Leica BOND', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(5, 'Dako Omnis', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(6, 'Master/iONtite', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-15 09:27:03'),
(7, 'teste123', 'approved', 5, 5, NULL, NULL, NULL, '2026-07-16 13:07:32'),
(8, 'plataforma', 'pending', NULL, 1, 4, NULL, NULL, '2026-07-21 09:55:02'),
(9, 'nobo', 'pending', NULL, 1, 4, NULL, NULL, '2026-07-22 08:59:55'),
(10, 'plataforma123', 'pending', NULL, 1, 4, NULL, NULL, '2026-07-23 13:11:36'),
(11, 'novotearaer', 'pending', NULL, 1, 4, NULL, NULL, '2026-07-29 10:10:00'),
(12, 'carlos', 'pending', NULL, 1, 4, NULL, NULL, '2026-07-29 10:10:45'),
(13, 'novaplataforma', 'pending', NULL, 1, 4, NULL, NULL, '2026-07-29 10:37:33');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `patient`, `diagnostic`, `hospital_id`, `login_id`, `type`, `biomarcador`, `topografia`, `plataforma`, `plataforma_id`, `anticorpo`, `anticorpo_id`, `produto`, `resultado`, `technical_data`, `created_at`, `updated_at`) VALUES
(70, '3B36329AAC', '67D601F8C9', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(71, '8B637B9045', 'C6E02F238B', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(72, 'FE78BE7208', '13F06A6B7A', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(73, '5777635EE8', 'F248A532E7', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(74, '06EDD6C10E', 'F402CC377A', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(76, '2A86173274', '7497744884', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(77, 'B4F8845879', '0BC33E96CB', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(78, 'D38542C8F5', 'EF5DD64415', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(79, 'D0A6556F56', '237FB2B65D', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(80, '4A890FF878', '02B854971E', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(82, 'F4896E9BBF', '6ACBEC9359', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(83, '402D5ECB00', '469BD3C173', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(84, '0E6B3B1B7C', '19A3C38280', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(85, '3E4E7C39AE', 'C49824E403', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(86, '576081F858', 'C7EB088E66', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(88, '5065B49B83', '9AF47B1DE7', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(89, 'BFC6778EA9', '25587D61A4', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(90, '8204357914', '73065A6CF7', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(91, '65F86E8038', '233DDAD835', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(92, 'CBFCE88B95', '1E260E201E', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(94, '301D61F068', 'AF9C9FBEAA', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(95, '4C9E1C7015', 'EB7AC8E027', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(96, 'C62E9A3354', '00DEBD63D2', 4, 5, 'PDF', 'HER2', 'Gânglio', NULL, 3, NULL, 5, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-10 16:19:31', '2026-07-15 12:03:00'),
(249, '28B8C9FE72', 'C59BB84A56', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(250, 'A9E28E52A9', '2594E5E1F8', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(251, '1BEFEB6FA0', '6C71E58E1F', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(252, '33172254D8', '606CE04847', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(253, 'E552F587F1', 'EB127CDDC7', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(255, '8B4B7EA2DC', '6313E41FE9', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(256, '184A9BC1B3', '26801A54DA', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(257, 'FC1543EB72', '834430B9EA', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(258, '06DEC91AD5', 'C9E3BADD31', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(259, '302F7CCC1E', '28A8B1370A', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(261, 'F088CCF328', 'AF8C99207E', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(262, '6BE6C41D4A', '32B7FED7CE', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(263, '5DC245C5B5', 'F51FE31137', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(264, '5ABBDD0B05', '4337508340', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(265, '15516BECE0', 'ED41B1387C', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(267, '0ED4F27B59', '834898626D', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(268, 'DFC1FDE3DB', '96250F2232', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(269, 'BCE75100CD', '310FFD5E29', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(270, 'DF8822B0C4', '6923EB3FCB', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(271, '0672E3FA18', '9C6122179B', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(273, '1FC038C60E', '80CB7330FC', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(274, 'BDF4A27BC7', '0CF6856FB0', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Biópsia', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(275, '0196553E3F', '91FE0E769F', 4, 5, 'PDF', 'HER2', 'Gânglio', 'Roche BenchMark', NULL, 'Bond Oracle HER2 IHC System', NULL, 'Peça cirúrgica', 'Negativo (0)', '{\"hospital_id\":4,\"biomarcador\":\"HER2\",\"topografia\":\"Gânglio\",\"plataforma\":\"Roche BenchMark\",\"anticorpo\":\"Bond Oracle HER2 IHC System\"}', '2026-07-15 15:14:48', '2026-07-15 15:14:48'),
(319, 'A9E28E52A9', 'A18BC01B75', 1, 10, 'PDF', 'PD-L1', 'Estômago', NULL, 3, NULL, 9, 'Peça cirúrgica', 'Positivo (CPS ≥20)', NULL, '2026-07-16 12:01:58', '2026-07-16 13:01:58'),
(320, 'BF666F4BD5', '257A360A2D', 1, 10, 'PDF', 'PD-L1', 'Melanoma', NULL, 5, NULL, 9, 'Peça cirúrgica', 'Negativo (TPS <1%)', NULL, '2026-07-16 09:01:58', '2026-07-16 13:01:58'),
(321, '51D0F23D77', '5CA494825A', 1, 10, 'PDF', 'PD-L1', 'Mama', NULL, 5, NULL, 9, 'Peça cirúrgica', 'Negativo (CPS <5)', NULL, '2026-06-21 06:01:58', '2026-07-16 13:01:58'),
(322, '51D0F23D77', 'D0DAC32842', 1, 10, 'PDF', 'PD-L1', 'Bexiga', NULL, 3, NULL, 6, 'Biópsia', 'Positivo (TPS ≥1%)', NULL, '2026-05-08 11:01:58', '2026-07-16 13:01:58'),
(323, '5FAE998418', '6687DC9564', 1, 10, 'PDF', 'PD-L1', 'Colo do útero', NULL, 5, NULL, 6, 'Biópsia', 'Positivo (CPS ≥10)', NULL, '2026-06-18 02:01:58', '2026-07-16 13:01:58'),
(324, '1BEFEB6FA0', 'C6DE644779', 1, 10, 'PDF', 'PD-L1', 'Indeterminado', NULL, 3, NULL, 6, 'Biópsia', 'Negativo (TPS <1%)', NULL, '2026-06-01 09:01:58', '2026-07-16 13:01:58'),
(325, 'BF666F4BD5', 'D0B07BB396', 1, 10, 'PDF', 'PD-L1', 'Bexiga', NULL, 5, NULL, 7, 'Peça cirúrgica', 'Positivo (TPS ≥1%)', NULL, '2026-04-19 12:01:58', '2026-07-16 13:01:58'),
(326, '33172254D8', '397CE9933C', 1, 10, 'PDF', 'PD-L1', 'Colo do útero', NULL, 5, NULL, 9, 'Peça cirúrgica', 'Negativo (CPS <1)', NULL, '2026-05-30 04:01:58', '2026-07-16 13:01:58'),
(327, '51D0F23D77', '8905DAD397', 1, 10, 'PDF', 'PD-L1', 'Estômago', NULL, 3, NULL, 7, 'Peça cirúrgica', 'Negativo (CPS <5)', NULL, '2026-05-18 02:01:58', '2026-07-16 13:01:58'),
(328, '3FDC0A9EA6', 'FAE6C1C4A1', 1, 10, 'PDF', 'PD-L1', 'Colo do útero', NULL, 3, NULL, 7, 'Biópsia', 'Negativo (CPS <1)', NULL, '2026-04-18 06:01:58', '2026-07-16 13:01:58'),
(329, 'E591A32014', 'D1E4687BC1', 2, 6, 'PDF', 'PD-L1', 'Pulmão', NULL, 3, NULL, 6, 'Biópsia', 'Positivo ligeiro / intermédio (TPS 1-49%)', NULL, '2026-07-16 10:01:58', '2026-07-16 13:01:58'),
(330, '28B8C9FE72', 'C5396E984A', 2, 6, 'PDF', 'PD-L1', 'Mesotelioma', NULL, 3, NULL, 8, 'Biópsia', 'Positivo (TPS ≥5%)', NULL, '2026-05-15 07:01:58', '2026-07-16 13:01:58'),
(331, 'E591A32014', '05C7A7EF0D', 2, 6, 'PDF', 'PD-L1', 'Melanoma', NULL, 5, NULL, 9, 'Biópsia', 'Positivo (TPS ≥5%)', NULL, '2026-06-10 08:01:58', '2026-07-16 13:01:58'),
(332, '331DC66078', '136FBB5FE9', 2, 6, 'PDF', 'PD-L1', 'Pulmão', NULL, 5, NULL, 9, 'Peça cirúrgica', 'Negativo (TPS <1%)', NULL, '2026-07-07 01:01:58', '2026-07-16 13:01:58'),
(333, 'BF666F4BD5', '1E9F9C0E15', 2, 6, 'PDF', 'PD-L1', 'Colo do útero', NULL, 5, NULL, 6, 'Biópsia', 'Positivo (CPS ≥1 e <20)', NULL, '2026-07-08 00:01:58', '2026-07-16 13:01:58'),
(334, 'E552F587F1', '3C06E0E796', 2, 6, 'PDF', 'PD-L1', 'Junção gastro-esofágica', NULL, 3, NULL, 8, 'Peça cirúrgica', 'Positivo (CPS ≥1 e <20)', NULL, '2026-06-04 11:01:58', '2026-07-16 13:01:58'),
(335, '3FDC0A9EA6', '93721FE208', 2, 6, 'PDF', 'PD-L1', 'Cabeça e pescoço', NULL, 5, NULL, 8, 'Biópsia', 'Positivo (CPS ≥5 e <10)', NULL, '2026-07-12 01:01:58', '2026-07-16 13:01:58'),
(336, '998836AA09', 'DA56CA3E72', 2, 6, 'PDF', 'PD-L1', 'Esófago', NULL, 5, NULL, 8, 'Peça cirúrgica', 'Negativo (CPS <1)', NULL, '2026-04-25 10:01:58', '2026-07-16 13:01:58'),
(337, '8FB7A5B29A', 'E1DACA5A4B', 2, 6, 'PDF', 'PD-L1', 'Mama', NULL, 3, NULL, 9, 'Peça cirúrgica', 'Positivo (CPS ≥1 e <20)', NULL, '2026-06-02 11:01:58', '2026-07-16 13:01:58'),
(338, '51D0F23D77', '0FC22B5555', 2, 6, 'PDF', 'PD-L1', 'Estômago', NULL, 5, NULL, 6, 'Biópsia', 'Positivo (CPS ≥20)', NULL, '2026-06-04 03:01:58', '2026-07-16 13:01:58'),
(339, 'E591A32014', 'E628A8D6CA', 4, 16, 'PDF', 'PD-L1', 'Mama', NULL, 3, NULL, 7, 'Biópsia', 'Positivo (CPS ≥1 e <20)', NULL, '2026-04-25 06:01:58', '2026-07-16 13:01:58'),
(340, '1B475659A1', 'A7AC3AD6D7', 4, 16, 'PDF', 'PD-L1', 'Colo do útero', NULL, 5, NULL, 8, 'Biópsia', 'Positivo (CPS ≥10)', NULL, '2026-06-30 11:01:58', '2026-07-16 13:01:58'),
(341, '56F35628AC', '0D3C20D401', 4, 1, 'PDF', 'PD-L1', 'Esófago', NULL, 3, NULL, 6, 'Peça cirúrgica', 'Negativo (CPS <1)', NULL, '2026-06-17 00:01:58', '2026-07-16 13:01:58'),
(342, '51D0F23D77', 'F1EDD21C8E', 4, 16, 'PDF', 'PD-L1', 'Indeterminado', NULL, 3, NULL, 7, 'Biópsia', 'Positivo (TPS ≥1%)', NULL, '2026-07-16 00:01:58', '2026-07-16 13:01:58'),
(343, '73172AC511', 'C2AAB57A40', 4, 16, 'PDF', 'PD-L1', 'Pulmão', NULL, 3, NULL, 8, 'Peça cirúrgica', 'Positivo forte (TPS ≥50%)', NULL, '2026-05-02 00:01:58', '2026-07-16 13:01:58'),
(344, 'E91E9064AC', '3B450AF269', 4, 1, 'PDF', 'PD-L1', 'Mama', NULL, 5, NULL, 8, 'Peça cirúrgica', 'Negativo (CPS <1)', NULL, '2026-07-16 05:01:58', '2026-07-16 13:01:58'),
(345, '331DC66078', 'B8411DAA6A', 4, 16, 'PDF', 'PD-L1', 'Mesotelioma', NULL, 5, NULL, 8, 'Biópsia', 'Negativo (TPS <1%)', NULL, '2026-05-26 01:01:58', '2026-07-16 13:01:58'),
(346, '1BEFEB6FA0', '56E49A3AB7', 4, 1, 'PDF', 'PD-L1', 'Mama', NULL, 3, NULL, 9, 'Peça cirúrgica', 'Positivo (CPS ≥5 e <10)', NULL, '2026-05-29 01:01:58', '2026-07-16 13:01:58'),
(347, '5851DC1B99', '6CC6E708D8', 4, 16, 'PDF', 'PD-L1', 'Indeterminado', NULL, 3, NULL, 6, 'Biópsia', 'Positivo (TPS ≥5%)', NULL, '2026-06-15 06:01:58', '2026-07-16 13:01:58'),
(348, '33172254D8', '397C40BF65', 4, 1, 'PDF', 'PD-L1', 'Colo do útero', NULL, 5, NULL, 7, 'Biópsia', 'Negativo (CPS <5)', NULL, '2026-07-16 12:01:58', '2026-07-16 13:01:58');

-- --------------------------------------------------------

--
-- Table structure for table `submission_items`
--

CREATE TABLE `submission_items` (
  `id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `item_data` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `submission_items`
--

INSERT INTO `submission_items` (`id`, `submission_id`, `item_data`, `created_at`) VALUES
(1, 1, '{\"TITLE\":\"HT-Histologia/InclusãoTotal\",\"CONTENT\":[{\"text\":\"Dados Internos\",\"x\":2.413,\"level\":\"subtitle\",\"contentInside\":[]},{\"level\":\"table\",\"rows\":[{\"Título\":\"Idade\",\"Valor\":\"69\",\"Descrição\":\"\"},{\"Título\":\"Sexo\",\"Valor\":\"M\",\"Descrição\":\"\"},{\"Título\":\"Data de Entrada\",\"Valor\":\"2024/03/04\",\"Descrição\":\"\"},{\"Título\":\"Data de Saída\",\"Valor\":\"2024/03/14\",\"Descrição\":\"\"},{\"Título\":\"Destino\",\"Valor\":\"IPO\",\"Descrição\":\"IPO de Francisco Gentil do Porto\"},{\"Título\":\"Se rviço\",\"Valor\":\"Radiologia de Intervenção-Geral (TAC)\",\"Descrição\":\"\"},{\"Título\":\"Subsistema\",\"Valor\":\"ACSS-ADMINISTRAÇÃO CENTRAL\",\"Descrição\":\"\"}]}]}', '2026-01-29 10:41:09'),
(2, 1, '{\"TITLE\":\"Natureza do Produto\",\"CONTENT\":[{\"text\":\"Não extemporâneo\",\"level\":\"text\"},{\"text\":\"Efetuada biópsia guiada por TC a lesão espiculada no pulmão direito referenciada, rode ada de bolhas de enfisema expressivas.\",\"level\":\"text\"},{\"text\":\"Coplhido 1 fragmento em agulha 18G.\",\"level\":\"text\"}]}', '2026-01-29 10:41:09'),
(3, 1, '{\"TITLE\":\"Diagnóstico\",\"CONTENT\":[{\"text\":\"Descrição Macroscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Nº de fragmentos: 2\",\"level\":\"text\"},{\"text\":\"Tamanho do maior fragmento (cm): 0,4x0,2\",\"level\":\"text\"},{\"text\":\"Hora de colheita dos fragmentos:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de entrada dos fragmento s em formol:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de saída dos fragmentos do formol: 18h do dia 04/03/2024\",\"level\":\"text\"},{\"text\":\"Elaborado por: Elisabete Pacheco\",\"level\":\"text\"}]},{\"text\":\"Descrição Microscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Observa-se parênquima pulmonar com envolvimento por neoplasia com características morfológicas e imuno-h istoquímicas (p63+ forte e difusa, CK7-e TTF1-) compatíveis com o diagnóstico de carcinoma epidermóide com focos de queratinização e necrose.\",\"level\":\"text\"},{\"text\":\"Avaliação de imunoexpressão de PD-L1\\n*Anticorpo utilizado: 22C3 (Dako)\\n*Plataforma de realização do teste: Venta na BenchMark Ultra\\n*Protocolo técnico: protocolo normalizado desenvolvido para a plataforma utilizada\\n*Avaliação da imunorreactividade:\",\"level\":\"text\"},{\"text\":\"Células neoplásicas\\n-Número de células neoplásicas avaliáveis: > 100\\n-Parâmetro(s) avaliado(s): percentagem de células   neoplásicas imunorreactivas (TPS, tumor proportion score)\\n-Resultado: 30-<40%\\n-Categorização: Positivo [ligeiro/intermédio (1-<50%)]\\n-Score de proporção (Índice de Colónia): Positivo (score 4)\",\"level\":\"text\"},{\"text\":\"Células imunitárias infiltrantes: não aplicável\",\"level\":\"text\"}]}]}', '2026-01-29 10:41:09'),
(4, 1, '{\"TITLE\":\"Codificação\",\"CONTENT\":[{\"level\":\"table\",\"rows\":[{\"000\":\"000\",\"IPOP\":\"IPOP\",\"T.C34.9-M.8070.3-G.9\":\"T.C34.9-M.5024.0-G.9\"}]}]}', '2026-01-29 10:41:09'),
(5, 3, '{\"TITLE\":\"HT-Histologia/InclusãoTotal\",\"CONTENT\":[{\"text\":\"Dados Internos\",\"x\":2.413,\"level\":\"subtitle\",\"contentInside\":[]},{\"level\":\"table\",\"rows\":[{\"Título\":\"Idade\",\"Valor\":\"69\",\"Descrição\":\"\"},{\"Título\":\"Sexo\",\"Valor\":\"M\",\"Descrição\":\"\"},{\"Título\":\"Data de Entrada\",\"Valor\":\"2024/03/04\",\"Descrição\":\"\"},{\"Título\":\"Data de Saída\",\"Valor\":\"2024/03/14\",\"Descrição\":\"\"},{\"Título\":\"Destino\",\"Valor\":\"IPO\",\"Descrição\":\"IPO de Francisco Gentil do Porto\"},{\"Título\":\"Se rviço\",\"Valor\":\"Radiologia de Intervenção-Geral (TAC)\",\"Descrição\":\"\"},{\"Título\":\"Subsistema\",\"Valor\":\"ACSS-ADMINISTRAÇÃO CENTRAL\",\"Descrição\":\"\"}]}]}', '2026-03-04 10:40:12'),
(6, 3, '{\"TITLE\":\"Natureza do Produto\",\"CONTENT\":[{\"text\":\"Não extemporâneo\",\"level\":\"text\"},{\"text\":\"Efetuada biópsia guiada por TC a lesão espiculada no pulmão direito referenciada, rode ada de bolhas de enfisema expressivas.\",\"level\":\"text\"},{\"text\":\"Coplhido 1 fragmento em agulha 18G.\",\"level\":\"text\"}]}', '2026-03-04 10:40:12'),
(7, 3, '{\"TITLE\":\"Diagnóstico\",\"CONTENT\":[{\"text\":\"Descrição Macroscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Nº de fragmentos: 2\",\"level\":\"text\"},{\"text\":\"Tamanho do maior fragmento (cm): 0,4x0,2\",\"level\":\"text\"},{\"text\":\"Hora de colheita dos fragmentos:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de entrada dos fragmento s em formol:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de saída dos fragmentos do formol: 18h do dia 04/03/2024\",\"level\":\"text\"},{\"text\":\"Elaborado por: Elisabete Pacheco\",\"level\":\"text\"}]},{\"text\":\"Descrição Microscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Observa-se parênquima pulmonar com envolvimento por neoplasia com características morfológicas e imuno-h istoquímicas (p63+ forte e difusa, CK7-e TTF1-) compatíveis com o diagnóstico de carcinoma epidermóide com focos de queratinização e necrose.\",\"level\":\"text\"},{\"text\":\"Avaliação de imunoexpressão de PD-L1\\n*Anticorpo utilizado: 22C3 (Dako)\\n*Plataforma de realização do teste: Venta na BenchMark Ultra\\n*Protocolo técnico: protocolo normalizado desenvolvido para a plataforma utilizada\\n*Avaliação da imunorreactividade:\",\"level\":\"text\"},{\"text\":\"Células neoplásicas\\n-Número de células neoplásicas avaliáveis: > 100\\n-Parâmetro(s) avaliado(s): percentagem de células   neoplásicas imunorreactivas (TPS, tumor proportion score)\\n-Resultado: 30-<40%\\n-Categorização: Positivo [ligeiro/intermédio (1-<50%)]\\n-Score de proporção (Índice de Colónia): Positivo (score 4)\",\"level\":\"text\"},{\"text\":\"Células imunitárias infiltrantes: não aplicável\",\"level\":\"text\"}]}]}', '2026-03-04 10:40:12'),
(8, 3, '{\"TITLE\":\"Codificação\",\"CONTENT\":[{\"level\":\"table\",\"rows\":[{\"000\":\"000\",\"IPOP\":\"IPOP\",\"T.C34.9-M.8070.3-G.9\":\"T.C34.9-M.5024.0-G.9\"}]}]}', '2026-03-04 10:40:12'),
(9, 4, '{\"TITLE\":\"HT-Histologia/InclusãoTotal\",\"CONTENT\":[{\"text\":\"Dados Internos\",\"x\":2.413,\"level\":\"subtitle\",\"contentInside\":[]},{\"level\":\"table\",\"rows\":[{\"Título\":\"Idade\",\"Valor\":\"69\",\"Descrição\":\"\"},{\"Título\":\"Sexo\",\"Valor\":\"M\",\"Descrição\":\"\"},{\"Título\":\"Data de Entrada\",\"Valor\":\"2024/03/04\",\"Descrição\":\"\"},{\"Título\":\"Data de Saída\",\"Valor\":\"2024/03/14\",\"Descrição\":\"\"},{\"Título\":\"Destino\",\"Valor\":\"IPO\",\"Descrição\":\"IPO de Francisco Gentil do Porto\"},{\"Título\":\"Se rviço\",\"Valor\":\"Radiologia de Intervenção-Geral (TAC)\",\"Descrição\":\"\"},{\"Título\":\"Subsistema\",\"Valor\":\"ACSS-ADMINISTRAÇÃO CENTRAL\",\"Descrição\":\"\"}]}]}', '2026-03-04 10:40:43'),
(10, 4, '{\"TITLE\":\"Natureza do Produto\",\"CONTENT\":[{\"text\":\"Não extemporâneo\",\"level\":\"text\"},{\"text\":\"Efetuada biópsia guiada por TC a lesão espiculada no pulmão direito referenciada, rode ada de bolhas de enfisema expressivas.\",\"level\":\"text\"},{\"text\":\"Coplhido 1 fragmento em agulha 18G.\",\"level\":\"text\"}]}', '2026-03-04 10:40:43'),
(11, 4, '{\"TITLE\":\"Diagnóstico\",\"CONTENT\":[{\"text\":\"Descrição Macroscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Nº de fragmentos: 2\",\"level\":\"text\"},{\"text\":\"Tamanho do maior fragmento (cm): 0,4x0,2\",\"level\":\"text\"},{\"text\":\"Hora de colheita dos fragmentos:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de entrada dos fragmento s em formol:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de saída dos fragmentos do formol: 18h do dia 04/03/2024\",\"level\":\"text\"},{\"text\":\"Elaborado por: Elisabete Pacheco\",\"level\":\"text\"}]},{\"text\":\"Descrição Microscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Observa-se parênquima pulmonar com envolvimento por neoplasia com características morfológicas e imuno-h istoquímicas (p63+ forte e difusa, CK7-e TTF1-) compatíveis com o diagnóstico de carcinoma epidermóide com focos de queratinização e necrose.\",\"level\":\"text\"},{\"text\":\"Avaliação de imunoexpressão de PD-L1\\n*Anticorpo utilizado: 22C3 (Dako)\\n*Plataforma de realização do teste: Venta na BenchMark Ultra\\n*Protocolo técnico: protocolo normalizado desenvolvido para a plataforma utilizada\\n*Avaliação da imunorreactividade:\",\"level\":\"text\"},{\"text\":\"Células neoplásicas\\n-Número de células neoplásicas avaliáveis: > 100\\n-Parâmetro(s) avaliado(s): percentagem de células   neoplásicas imunorreactivas (TPS, tumor proportion score)\\n-Resultado: 30-<40%\\n-Categorização: Positivo [ligeiro/intermédio (1-<50%)]\\n-Score de proporção (Índice de Colónia): Positivo (score 4)\",\"level\":\"text\"},{\"text\":\"Células imunitárias infiltrantes: não aplicável\",\"level\":\"text\"}]}]}', '2026-03-04 10:40:43'),
(12, 4, '{\"TITLE\":\"Codificação\",\"CONTENT\":[{\"level\":\"table\",\"rows\":[{\"000\":\"000\",\"IPOP\":\"IPOP\",\"T.C34.9-M.8070.3-G.9\":\"T.C34.9-M.5024.0-G.9\"}]}]}', '2026-03-04 10:40:43'),
(13, 5, '{\"TITLE\":\"HT-Histologia/InclusãoTotal\",\"CONTENT\":[{\"text\":\"Dados Internos\",\"x\":2.413,\"level\":\"subtitle\",\"contentInside\":[]},{\"level\":\"table\",\"rows\":[{\"Título\":\"Idade\",\"Valor\":\"63\",\"Descrição\":\"\"},{\"Título\":\"Sexo\",\"Valor\":\"M\",\"Descrição\":\"\"},{\"Título\":\"Data de Entrada\",\"Valor\":\"2023/12/11\",\"Descrição\":\"\"},{\"Título\":\"Data de Saída\",\"Valor\":\"2023/12/18\",\"Descrição\":\"\"},{\"Título\":\"Destino\",\"Valor\":\"IPO\",\"Descrição\":\"IPO de Francisco Gentil do Porto\"},{\"Título\":\"Serviço\",\"Valor\":\"Radiolo gia de Intervenção-Geral (TAC)\",\"Descrição\":\"\"},{\"Título\":\"Subsistema\",\"Valor\":\"ACSS-ADMINISTRAÇÃO CENTRAL\",\"Descrição\":\"\"}]}]}', '2026-03-04 10:41:28'),
(14, 5, '{\"TITLE\":\"Natureza do Produto\",\"CONTENT\":[{\"text\":\"Biópsia pulmão\",\"level\":\"text\"}]}', '2026-03-04 10:41:28'),
(15, 5, '{\"TITLE\":\"Diagnóstico\",\"CONTENT\":[{\"text\":\"Descrição Macroscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Nº de fragmentos: 2\",\"level\":\"text\"},{\"text\":\"Tamanho do maior fragmento (cm):1,1\",\"level\":\"text\"},{\"text\":\"Hora de c olheita dos fragmentos: ?\",\"level\":\"text\"},{\"text\":\"Hora de entrada em formol: ?\",\"level\":\"text\"},{\"text\":\"Hora e dia de saída do formol: 18h, 12/12/2023\",\"level\":\"text\"},{\"text\":\"Elaborado por: Cristina Silva\",\"level\":\"text\"}]},{\"text\":\"Descrição Microscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Fragmentos de parênquima pulmonar com envolvimento por carcinoma espinocelular pouco diferenci ado, com extensa necrose-primário? metastático?\",\"level\":\"text\"},{\"text\":\"Avaliação de imunoexpressão de PD-L1:\\n*Anticorpo utilizado: 22C3 (Dako)\\n*Plataforma de realização do teste: Ventana BenchMark Ultra\\n*Protocolo técnico: protocolo normalizado desenvolvido para a plata forma utilizada\\n*Avaliação da imunorreactividade:\",\"level\":\"text\"},{\"text\":\"Células neoplásicas\\n-Número de células neoplásicas avaliáveis: >100\\n-Parâmetro(s) avaliado(s): percentagem de células neoplásicas imunorreactivas (TPS, tumor proportion score)\\n-Resultado : 50-<60%\\n-Categorização: Positivo [forte (> 50%)]\\n-Score de proporção (Índice de Colónia): Positivo (score 5)\",\"level\":\"text\"},{\"text\":\"Células imunitárias infiltrantes: não aplicável.\",\"level\":\"text\"},{\"text\":\"Avaliação de imunoexpressão de PD-L1:\\n* Anticorpo utilizado: 22C3 (Dako)\\n* Plata forma de realização do teste: Ventana BenchMark Ultra\\n* Protocolo técnico: protocolo normalizado desenvolvido para a plataforma utilizada\\n* Avaliação da imunorreactividade:\\n-Número de células neoplásicas avaliáveis: >= 100\\n-Parâmetro(s) avaliado( s): CPS (Combined positive score)\\n-Resultado: 80\\n-Categorização: CPS>=1.\",\"level\":\"text\"}]}]}', '2026-03-04 10:41:28'),
(16, 5, '{\"TITLE\":\"Codificação\",\"CONTENT\":[{\"level\":\"table\",\"rows\":[{\"000\":\"000\",\"IPOP\":\"IPOP\",\"T.C34.9-M.5025.0-G.0\":\"T.C34.9-M.8070.9-G.9\"},{\"000\":\"000\",\"IPOP\":\"IPOP\",\"T.C34.9-M.5025.0-G.0\":\"T.C34.9-M.5037.0-G.0\"}]}]}', '2026-03-04 10:41:28'),
(17, 6, '{\"TITLE\":\"HT-Histologia/InclusãoTotal\",\"CONTENT\":[{\"text\":\"Dados Internos\",\"x\":2.413,\"level\":\"subtitle\",\"contentInside\":[]},{\"level\":\"table\",\"rows\":[{\"Título\":\"Idade\",\"Valor\":\"69\",\"Descrição\":\"\"},{\"Título\":\"Sexo\",\"Valor\":\"M\",\"Descrição\":\"\"},{\"Título\":\"Data de Entrada\",\"Valor\":\"2024/03/04\",\"Descrição\":\"\"},{\"Título\":\"Data de Saída\",\"Valor\":\"2024/03/14\",\"Descrição\":\"\"},{\"Título\":\"Destino\",\"Valor\":\"IPO\",\"Descrição\":\"IPO de Francisco Gentil do Porto\"},{\"Título\":\"Se rviço\",\"Valor\":\"Radiologia de Intervenção-Geral (TAC)\",\"Descrição\":\"\"},{\"Título\":\"Subsistema\",\"Valor\":\"ACSS-ADMINISTRAÇÃO CENTRAL\",\"Descrição\":\"\"}]}]}', '2026-03-04 10:41:45'),
(18, 6, '{\"TITLE\":\"Natureza do Produto\",\"CONTENT\":[{\"text\":\"Não extemporâneo\",\"level\":\"text\"},{\"text\":\"Efetuada biópsia guiada por TC a lesão espiculada no pulmão direito referenciada, rode ada de bolhas de enfisema expressivas.\",\"level\":\"text\"},{\"text\":\"Coplhido 1 fragmento em agulha 18G.\",\"level\":\"text\"}]}', '2026-03-04 10:41:45'),
(19, 6, '{\"TITLE\":\"Diagnóstico\",\"CONTENT\":[{\"text\":\"Descrição Macroscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Nº de fragmentos: 2\",\"level\":\"text\"},{\"text\":\"Tamanho do maior fragmento (cm): 0,4x0,2\",\"level\":\"text\"},{\"text\":\"Hora de colheita dos fragmentos:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de entrada dos fragmento s em formol:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de saída dos fragmentos do formol: 18h do dia 04/03/2024\",\"level\":\"text\"},{\"text\":\"Elaborado por: Elisabete Pacheco\",\"level\":\"text\"}]},{\"text\":\"Descrição Microscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Observa-se parênquima pulmonar com envolvimento por neoplasia com características morfológicas e imuno-h istoquímicas (p63+ forte e difusa, CK7-e TTF1-) compatíveis com o diagnóstico de carcinoma epidermóide com focos de queratinização e necrose.\",\"level\":\"text\"},{\"text\":\"Avaliação de imunoexpressão de PD-L1\\n*Anticorpo utilizado: 22C3 (Dako)\\n*Plataforma de realização do teste: Venta na BenchMark Ultra\\n*Protocolo técnico: protocolo normalizado desenvolvido para a plataforma utilizada\\n*Avaliação da imunorreactividade:\",\"level\":\"text\"},{\"text\":\"Células neoplásicas\\n-Número de células neoplásicas avaliáveis: > 100\\n-Parâmetro(s) avaliado(s): percentagem de células   neoplásicas imunorreactivas (TPS, tumor proportion score)\\n-Resultado: 30-<40%\\n-Categorização: Positivo [ligeiro/intermédio (1-<50%)]\\n-Score de proporção (Índice de Colónia): Positivo (score 4)\",\"level\":\"text\"},{\"text\":\"Células imunitárias infiltrantes: não aplicável\",\"level\":\"text\"}]}]}', '2026-03-04 10:41:45'),
(20, 6, '{\"TITLE\":\"Codificação\",\"CONTENT\":[{\"level\":\"table\",\"rows\":[{\"000\":\"000\",\"IPOP\":\"IPOP\",\"T.C34.9-M.8070.3-G.9\":\"T.C34.9-M.5024.0-G.9\"}]}]}', '2026-03-04 10:41:45'),
(21, 7, '{\"TITLE\":\"HT-Histologia/InclusãoTotal\",\"CONTENT\":[{\"text\":\"Dados Internos\",\"x\":2.413,\"level\":\"subtitle\",\"contentInside\":[]},{\"level\":\"table\",\"rows\":[{\"Título\":\"Idade\",\"Valor\":\"69\",\"Descrição\":\"\"},{\"Título\":\"Sexo\",\"Valor\":\"M\",\"Descrição\":\"\"},{\"Título\":\"Data de Entrada\",\"Valor\":\"2024/03/04\",\"Descrição\":\"\"},{\"Título\":\"Data de Saída\",\"Valor\":\"2024/03/14\",\"Descrição\":\"\"},{\"Título\":\"Destino\",\"Valor\":\"IPO\",\"Descrição\":\"IPO de Francisco Gentil do Porto\"},{\"Título\":\"Se rviço\",\"Valor\":\"Radiologia de Intervenção-Geral (TAC)\",\"Descrição\":\"\"},{\"Título\":\"Subsistema\",\"Valor\":\"ACSS-ADMINISTRAÇÃO CENTRAL\",\"Descrição\":\"\"}]}]}', '2026-03-06 14:38:34'),
(22, 7, '{\"TITLE\":\"Natureza do Produto\",\"CONTENT\":[{\"text\":\"Não extemporâneo\",\"level\":\"text\"},{\"text\":\"Efetuada biópsia guiada por TC a lesão espiculada no pulmão direito referenciada, rode ada de bolhas de enfisema expressivas.\",\"level\":\"text\"},{\"text\":\"Coplhido 1 fragmento em agulha 18G.\",\"level\":\"text\"}]}', '2026-03-06 14:38:34'),
(23, 7, '{\"TITLE\":\"Diagnóstico\",\"CONTENT\":[{\"text\":\"Descrição Macroscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Nº de fragmentos: 2\",\"level\":\"text\"},{\"text\":\"Tamanho do maior fragmento (cm): 0,4x0,2\",\"level\":\"text\"},{\"text\":\"Hora de colheita dos fragmentos:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de entrada dos fragmento s em formol:----01/03/2024\",\"level\":\"text\"},{\"text\":\"Hora de saída dos fragmentos do formol: 18h do dia 04/03/2024\",\"level\":\"text\"},{\"text\":\"Elaborado por: Elisabete Pacheco\",\"level\":\"text\"}]},{\"text\":\"Descrição Microscópica\",\"fontSize\":16,\"x\":4.537,\"level\":\"subtitle\",\"contentInside\":[{\"text\":\"Observa-se parênquima pulmonar com envolvimento por neoplasia com características morfológicas e imuno-h istoquímicas (p63+ forte e difusa, CK7-e TTF1-) compatíveis com o diagnóstico de carcinoma epidermóide com focos de queratinização e necrose.\",\"level\":\"text\"},{\"text\":\"Avaliação de imunoexpressão de PD-L1\\n*Anticorpo utilizado: 22C3 (Dako)\\n*Plataforma de realização do teste: Venta na BenchMark Ultra\\n*Protocolo técnico: protocolo normalizado desenvolvido para a plataforma utilizada\\n*Avaliação da imunorreactividade:\",\"level\":\"text\"},{\"text\":\"Células neoplásicas\\n-Número de células neoplásicas avaliáveis: > 100\\n-Parâmetro(s) avaliado(s): percentagem de células   neoplásicas imunorreactivas (TPS, tumor proportion score)\\n-Resultado: 30-<40%\\n-Categorização: Positivo [ligeiro/intermédio (1-<50%)]\\n-Score de proporção (Índice de Colónia): Positivo (score 4)\",\"level\":\"text\"},{\"text\":\"Células imunitárias infiltrantes: não aplicável\",\"level\":\"text\"}]}]}', '2026-03-06 14:38:34'),
(24, 7, '{\"TITLE\":\"Codificação\",\"CONTENT\":[{\"level\":\"table\",\"rows\":[{\"000\":\"000\",\"IPOP\":\"IPOP\",\"T.C34.9-M.8070.3-G.9\":\"T.C34.9-M.5024.0-G.9\"}]}]}', '2026-03-06 14:38:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `antibodies`
--
ALTER TABLE `antibodies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome_unique` (`nome`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `fk_antibodies_created_by` (`created_by`),
  ADD KEY `fk_antibodies_hospital_id` (`hospital_id`),
  ADD KEY `fk_antibodies_reviewed_by` (`reviewed_by`),
  ADD KEY `idx_antibodies_status` (`status`);

--
-- Indexes for table `biomarkers`
--
ALTER TABLE `biomarkers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome_unique` (`nome`),
  ADD KEY `fk_biomarkers_admin` (`admin_id`),
  ADD KEY `fk_biomarkers_created_by` (`created_by`);

--
-- Indexes for table `biomarker_results`
--
ALTER TABLE `biomarker_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_biomarker_results_biomarker` (`biomarker_id`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hospital_technical`
--
ALTER TABLE `hospital_technical`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hospital_id` (`hospital_id`),
  ADD KEY `fk_hospital_technical_plataforma` (`plataforma_id`),
  ADD KEY `fk_hospital_technical_anticorpo` (`anticorpo_id`);

--
-- Indexes for table `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_email` (`email`),
  ADD KEY `idx_hospital` (`hospital_id`),
  ADD KEY `fk_login_created_by` (`created_by`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hospital_id` (`hospital_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `platforms`
--
ALTER TABLE `platforms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome_unique` (`nome`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `fk_platforms_created_by` (`created_by`),
  ADD KEY `fk_platforms_hospital_id` (`hospital_id`),
  ADD KEY `fk_platforms_reviewed_by` (`reviewed_by`),
  ADD KEY `idx_platforms_status` (`status`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_submission_her2_hospital` (`hospital_id`),
  ADD KEY `fk_submission_her2_login` (`login_id`),
  ADD KEY `process_number_2` (`patient`),
  ADD KEY `fk_submissions_plataforma` (`plataforma_id`),
  ADD KEY `fk_submissions_anticorpo` (`anticorpo_id`);

--
-- Indexes for table `submission_items`
--
ALTER TABLE `submission_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_submission_items_submission` (`submission_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `antibodies`
--
ALTER TABLE `antibodies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `biomarkers`
--
ALTER TABLE `biomarkers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `biomarker_results`
--
ALTER TABLE `biomarker_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `hospitals`
--
ALTER TABLE `hospitals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `hospital_technical`
--
ALTER TABLE `hospital_technical`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `platforms`
--
ALTER TABLE `platforms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=349;

--
-- AUTO_INCREMENT for table `submission_items`
--
ALTER TABLE `submission_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `antibodies`
--
ALTER TABLE `antibodies`
  ADD CONSTRAINT `fk_antibodies_admin` FOREIGN KEY (`admin_id`) REFERENCES `login` (`id`),
  ADD CONSTRAINT `fk_antibodies_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_antibodies_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_antibodies_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `login` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `biomarkers`
--
ALTER TABLE `biomarkers`
  ADD CONSTRAINT `fk_biomarkers_admin` FOREIGN KEY (`admin_id`) REFERENCES `login` (`id`),
  ADD CONSTRAINT `fk_biomarkers_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `biomarker_results`
--
ALTER TABLE `biomarker_results`
  ADD CONSTRAINT `fk_biomarker_results_biomarker` FOREIGN KEY (`biomarker_id`) REFERENCES `biomarkers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hospital_technical`
--
ALTER TABLE `hospital_technical`
  ADD CONSTRAINT `fk_hospital_technical_anticorpo` FOREIGN KEY (`anticorpo_id`) REFERENCES `antibodies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_hospital_technical_plataforma` FOREIGN KEY (`plataforma_id`) REFERENCES `platforms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `login`
--
ALTER TABLE `login`
  ADD CONSTRAINT `fk_login_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_login_hospitais` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `platforms`
--
ALTER TABLE `platforms`
  ADD CONSTRAINT `fk_platforms_admin` FOREIGN KEY (`admin_id`) REFERENCES `login` (`id`),
  ADD CONSTRAINT `fk_platforms_created_by` FOREIGN KEY (`created_by`) REFERENCES `login` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_platforms_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_platforms_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `login` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_submission_her2_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  ADD CONSTRAINT `fk_submission_her2_login` FOREIGN KEY (`login_id`) REFERENCES `login` (`id`),
  ADD CONSTRAINT `fk_submissions_anticorpo` FOREIGN KEY (`anticorpo_id`) REFERENCES `antibodies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_submissions_plataforma` FOREIGN KEY (`plataforma_id`) REFERENCES `platforms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `submission_items`
--
ALTER TABLE `submission_items`
  ADD CONSTRAINT `fk_submission_items_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

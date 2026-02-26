-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 26-02-2026 a las 14:21:34
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `escuela`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(100) NOT NULL,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `name`, `type`, `active`) VALUES
(1, 'Clases de fútbol', 'SERVICE', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL,
  `tutor_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `grado` enum('Pre-Kinder','Kinder','1er','2do','3ro','4to','5to','6to') NOT NULL,
  `paralelo` enum('A','B','C') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id`, `tutor_id`, `nombre`, `grado`, `paralelo`) VALUES
(1, 1, 'Carlos Perez', 'Pre-Kinder', 'A'),
(2, 1, 'Pedro', '5to', 'B'),
(3, 4, 'Luis Ramírez EDIT', '2do', 'A'),
(4, 4, 'Ana Ramírez', '3ro', 'B'),
(5, 4, 'Paquito jr', 'Pre-Kinder', 'C'),
(6, 4, 'Romina Mendoza', '3ro', 'A'),
(7, 1, 'Rosa Perez', '1er', 'A'),
(8, 5, 'daniel soliz', '2do', 'B');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiante_servicio`
--

CREATE TABLE `estudiante_servicio` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `mes` varchar(20) DEFAULT NULL,
  `anio` int(11) NOT NULL,
  `base_amount` decimal(10,2) NOT NULL,
  `extra_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiante_servicio`
--

INSERT INTO `estudiante_servicio` (`id`, `estudiante_id`, `servicio_id`, `mes`, `anio`, `base_amount`, `extra_amount`, `discount_amount`, `total`, `estado`) VALUES
(1, 3, 1, '3', 2026, 50.00, 5.00, 10.00, 45.00, 'PENDIENTE'),
(2, 4, 3, '3', 2026, 50.00, 5.00, 10.00, 45.00, 'PENDIENTE'),
(3, 4, 2, '3', 2026, 50.00, 5.00, 10.00, 45.00, 'PAGADO'),
(4, 8, 3, '3', 2026, 60.00, 0.00, 0.00, 60.00, 'CANCELADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id` int(11) NOT NULL,
  `evento` varchar(120) NOT NULL,
  `concepto` varchar(120) NOT NULL,
  `destino` varchar(50) NOT NULL,
  `monto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `activo` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id`, `evento`, `concepto`, `destino`, `monto`, `activo`) VALUES
(1, 'Kermesse', 'Entrada', 'Caja', 0.00, 1),
(2, 'Graduacion', 'Entrada', 'Banco', 0.00, 1),
(3, 'Carnaval', 'Mojazon', 'caja', 15.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensualidades`
--

CREATE TABLE `mensualidades` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `mes` varchar(20) DEFAULT NULL,
  `anio` int(11) DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `base_amount` decimal(10,2) DEFAULT 490.00,
  `extra_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) DEFAULT 490.00,
  `tipo` enum('MENSUALIDAD','SERVICIO') NOT NULL DEFAULT 'MENSUALIDAD',
  `nombre_servicio` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensualidades`
--

INSERT INTO `mensualidades` (`id`, `estudiante_id`, `mes`, `anio`, `monto`, `estado`, `base_amount`, `extra_amount`, `discount_amount`, `total`, `tipo`, `nombre_servicio`) VALUES
(1, 1, 'Febrero', 2026, 350.00, 'PARCIAL', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(2, 2, '2', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(3, 5, '2', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(4, 3, '2', 2026, NULL, 'PENDIENTE', 490.00, 50.00, 20.00, 520.00, 'MENSUALIDAD', NULL),
(5, 6, '2', 2026, NULL, 'PAGADO', 490.00, 40.00, 10.00, 520.00, 'MENSUALIDAD', NULL),
(6, 1, '2', 2026, 490.00, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(9, 4, '2', 2026, 490.00, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(102, 4, '4', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(109, 4, '5', 2026, NULL, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(110, 4, '6', 2026, NULL, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(111, 4, '7', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(112, 4, '1', 2026, NULL, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(118, 4, '8', 2026, NULL, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(125, 7, '1', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(126, 7, '2', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(127, 7, '3', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(128, 7, '4', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(129, 7, '5', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(130, 7, '6', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(131, 7, '7', 2026, NULL, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(132, 7, '8', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(133, 7, '9', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(134, 7, '10', 2026, NULL, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(282, 6, '1', 2026, NULL, 'PENDIENTE', 100.00, 0.00, 0.00, 100.00, 'MENSUALIDAD', NULL),
(311, 6, '3', 2026, NULL, 'PARCIAL', 80.00, 0.00, 0.00, 80.00, 'SERVICIO', 'Danza'),
(376, 6, '4', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(391, 1, '3', 2026, NULL, 'PENDIENTE', 200.00, 0.00, 10.00, 190.00, 'SERVICIO', 'Clases de fútbol'),
(392, 1, '4', 2026, NULL, 'PENDIENTE', 200.00, 0.00, 10.00, 190.00, 'SERVICIO', 'Clases de fútbol'),
(393, 8, '4', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(402, 8, '2', 2026, 490.00, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(620, 4, '3', 2026, NULL, 'PENDIENTE', 490.00, 40.00, 10.00, 520.00, 'MENSUALIDAD', NULL),
(639, 4, '9', 2026, NULL, 'PENDIENTE', 490.00, 40.00, 10.00, 520.00, 'MENSUALIDAD', NULL),
(654, 4, '2', 2027, NULL, 'PENDIENTE', 490.00, 0.00, 40.00, 450.00, 'MENSUALIDAD', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos`
--

CREATE TABLE `movimientos` (
  `id` int(11) NOT NULL,
  `tipo` enum('INGRESO','GASTO') NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `encargado` varchar(100) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos`
--

INSERT INTO `movimientos` (`id`, `tipo`, `concepto`, `monto`, `encargado`, `fecha`) VALUES
(1, 'GASTO', 'Gastos luz', 100.00, 'Administrador', '2026-02-17 22:22:52'),
(2, 'INGRESO', 'Pago mensualidad ID 1', 10.00, 'Caja', '2026-02-17 22:29:00'),
(3, 'INGRESO', 'Pago mensualidad ID 102', 490.00, 'admin', '2026-02-18 00:39:31'),
(4, 'INGRESO', 'Pago mensualidad ID 9', 490.00, 'admin', '2026-02-18 00:56:26'),
(5, 'INGRESO', 'Pago mensualidad ID 111', 490.00, 'admin', '2026-02-18 00:58:50'),
(6, 'INGRESO', 'Pago mensualidad ID 125', 490.00, 'admin', '2026-02-18 01:10:20'),
(7, 'INGRESO', 'Pago mensualidad ID 126', 490.00, 'admin', '2026-02-18 01:10:23'),
(8, 'INGRESO', 'Pago mensualidad ID 127', 490.00, 'admin', '2026-02-18 01:10:27'),
(9, 'INGRESO', 'Pago mensualidad ID 128', 490.00, 'admin', '2026-02-18 01:10:30'),
(10, 'INGRESO', 'Pago mensualidad ID 129', 490.00, 'admin', '2026-02-18 01:10:34'),
(11, 'INGRESO', 'Pago mensualidad ID 130', 490.00, 'admin', '2026-02-18 01:10:37'),
(12, 'INGRESO', 'Pago mensualidad ID 132', 490.00, 'admin', '2026-02-18 01:27:43'),
(13, 'INGRESO', 'Pago mensualidad ID 133', 490.00, 'admin', '2026-02-18 01:30:42'),
(14, 'INGRESO', 'Pago mensualidad ID 3', 70.00, 'admin', '2026-02-18 03:12:50'),
(15, 'INGRESO', 'Pago mensualidad ID 376', 490.00, 'admin', '2026-02-18 13:38:54'),
(16, 'INGRESO', 'Pago mensualidad ID 311', 40.00, 'admin', '2026-02-18 13:39:22'),
(17, 'INGRESO', 'Pago mensualidad ID 311', 20.00, 'admin', '2026-02-18 13:43:49'),
(18, 'INGRESO', 'Pago mensualidad ID 6', 400.00, 'admin', '2026-02-18 15:41:20'),
(19, 'INGRESO', 'Pago mensualidad ID 393', 490.00, 'admin', '2026-02-18 15:55:45'),
(20, 'INGRESO', 'Pago MENSUALIDAD ID 620', 200.00, 'Caja', '2026-02-23 19:32:22'),
(21, 'INGRESO', 'Pago MENSUALIDAD ID 620', 200.00, 'Caja', '2026-02-23 19:34:57'),
(22, 'INGRESO', 'Pago SERVICIO ID 1', 40.00, 'Caja', '2026-02-23 19:36:37'),
(23, 'INGRESO', 'Pago SERVICIO ID 1', 5.00, 'Caja', '2026-02-23 19:38:30'),
(24, 'INGRESO', 'Pago SERVICIO ID 2', 20.00, 'Caja', '2026-02-23 19:49:56'),
(25, 'INGRESO', 'Pago SERVICIO ID 2', 25.00, 'Caja', '2026-02-23 19:54:28'),
(26, 'INGRESO', 'Pago MENSUALIDAD ID 620', 120.00, 'Caja', '2026-02-23 20:00:09'),
(27, 'INGRESO', 'Pago SERVICIO ID 3', 45.00, 'Caja', '2026-02-24 11:39:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `monto` decimal(10,2) DEFAULT NULL,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `responsable` varchar(100) DEFAULT NULL,
  `nota` varchar(100) DEFAULT NULL,
  `reversed` tinyint(4) DEFAULT 0,
  `tipo` enum('MENSUALIDAD','SERVICIO') NOT NULL,
  `referencia_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `fecha`, `monto`, `descuento`, `responsable`, `nota`, `reversed`, `tipo`, `referencia_id`) VALUES
(1, '2026-02-07 12:45:06', 350.00, 0.00, NULL, NULL, 0, 'MENSUALIDAD', 0),
(2, '2026-02-11 00:00:00', 100.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(3, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(4, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(5, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(6, '2026-02-12 00:00:00', 90.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(7, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(8, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(9, '2026-02-12 00:00:00', 40.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(10, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(11, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(12, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(13, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(14, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(15, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0, 'MENSUALIDAD', 0),
(16, '2026-02-17 00:00:00', 100.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 0),
(17, '2026-02-17 00:00:00', 150.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 0),
(18, '2026-02-17 00:00:00', 250.00, 20.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 0),
(19, '2026-02-17 00:00:00', 10.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 0),
(20, '2026-02-17 00:00:00', 40.00, 10.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 0),
(21, '2026-02-18 00:00:00', 10.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 0),
(22, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(23, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(24, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(25, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(26, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(27, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(28, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(29, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(30, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(31, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', 'Pago en efectivo', 0, 'MENSUALIDAD', 0),
(32, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', 'Pago en efectivo', 0, 'MENSUALIDAD', 0),
(33, '2026-02-18 00:00:00', 70.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(34, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(35, '2026-02-18 00:00:00', 40.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(36, '2026-02-18 00:00:00', 20.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(37, '2026-02-18 00:00:00', 400.00, 90.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(38, '2026-02-18 00:00:00', 490.00, 0.00, 'admin', NULL, 0, 'MENSUALIDAD', 0),
(39, '2026-02-23 00:00:00', 200.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 620),
(40, '2026-02-23 00:00:00', 200.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 620),
(41, '2026-02-23 00:00:00', 40.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'SERVICIO', 1),
(42, '2026-02-23 00:00:00', 5.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'SERVICIO', 1),
(43, '2026-02-23 00:00:00', 20.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'SERVICIO', 2),
(44, '2026-02-23 00:00:00', 25.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'SERVICIO', 2),
(45, '2026-02-24 00:00:00', 120.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'MENSUALIDAD', 620),
(46, '2026-02-24 00:00:00', 45.00, 0.00, 'Caja', 'Abono en efectivo', 0, 'SERVICIO', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id`, `nombre`, `descripcion`, `activo`) VALUES
(1, 'ingles', 'Clases de ingles', 1),
(2, 'ingles', 'Clases de ingles', 1),
(3, 'Futsal', NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tutores`
--

CREATE TABLE `tutores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `correo` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tutores`
--

INSERT INTO `tutores` (`id`, `nombre`, `telefono`, `direccion`, `correo`) VALUES
(1, 'Juan Perez', '7777777', 'Centro', 'jaelaleavendano24@gmail.com'),
(3, 'Maria Perez', '777777', 'Centro', 'maria@gmail.com'),
(4, 'Carlos Ramírez EDITADO', '70000000', NULL, 'mauricioramoscrespo@gmail.com'),
(5, 'carlos soliz', '76767676', NULL, 'sajama.cristian20@gmail.com');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `rol` varchar(50) DEFAULT NULL,
  `ping` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `username`, `email`, `rol`, `ping`) VALUES
(1, '', 'admin', NULL, 'ADMIN', '1234'),
(2, 'Mauricio Ramos', 'mau', 'mauri.mdc.24@mail.com', 'ADMIN', '0'),
(4, 'Mauri Racre', 'Admi', 'mauri.mdc.24@gmail.com', 'ADMIN', '7906'),
(6, 'MauriRacre', 'AdmiMau', 'mauri.mdc.24@gmail.com', 'ADMIN', 'ZYQRAB'),
(7, 'Cristian Sajama', 'Cris', 'sajama.cristian20@gmail.com', 'ADMIN', 'NLA3BL'),
(8, 'Jael Avendaño', 'JaAv', 'SECRETARIA', 'USER', 'jaelaleave'),
(9, 'Carlos Ruiz', 'cruiz', 'SECRETARIA', 'USER', 'mauri.mdc.'),
(13, 'Ramos mauricio', 'RamMau', 'mauricioramoscrespo@gmail.com', 'USER', '8046');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_id` (`tutor_id`);

--
-- Indices de la tabla `estudiante_servicio`
--
ALTER TABLE `estudiante_servicio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estudiante_id` (`estudiante_id`),
  ADD KEY `servicio_id` (`servicio_id`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_mensualidad` (`estudiante_id`,`anio`,`mes`);

--
-- Indices de la tabla `movimientos`
--
ALTER TABLE `movimientos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_referencia` (`tipo`,`referencia_id`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tutores`
--
ALTER TABLE `tutores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `estudiante_servicio`
--
ALTER TABLE `estudiante_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1431;

--
-- AUTO_INCREMENT de la tabla `movimientos`
--
ALTER TABLE `movimientos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tutores`
--
ALTER TABLE `tutores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutores` (`id`);

--
-- Filtros para la tabla `estudiante_servicio`
--
ALTER TABLE `estudiante_servicio`
  ADD CONSTRAINT `estudiante_servicio_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`),
  ADD CONSTRAINT `estudiante_servicio_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`);

--
-- Filtros para la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  ADD CONSTRAINT `mensualidades_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

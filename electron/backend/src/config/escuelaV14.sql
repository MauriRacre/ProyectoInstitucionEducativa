-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-03-2026 a las 05:42:57
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL,
  `tutor_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `grado` enum('Sala Cuna','Maternal','Preparatorio','Taller Inicial','Pre-Kinder','Kinder','1er','2do','3ro','4to','5to','6to') NOT NULL,
  `paralelo` enum('A','B','C') NOT NULL,
  `monto` decimal(10,2) DEFAULT 490.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id`, `tutor_id`, `nombre`, `grado`, `paralelo`, `monto`) VALUES
(9, 6, 'Ainhoa Medrano Orellana', '1er', 'A', 490.00),
(10, 6, 'Cris Junior', '2do', 'A', 490.00),
(11, 7, 'Paquito Perez', '5to', 'A', 490.00),
(12, 8, 'Antonio Ramirez', '1er', 'A', 490.00),
(15, 8, 'Carlos', '2do', 'B', 390.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiante_servicio`
--

CREATE TABLE `estudiante_servicio` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `mes` varchar(20) DEFAULT NULL,
  `anio` int(11) NOT NULL,
  `base_amount` decimal(10,2) NOT NULL,
  `extra_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `evento_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiante_servicio`
--

INSERT INTO `estudiante_servicio` (`id`, `estudiante_id`, `servicio_id`, `mes`, `anio`, `base_amount`, `extra_amount`, `discount_amount`, `total`, `estado`, `evento_id`) VALUES
(5, 9, 4, '2', 2026, 50.00, 0.00, 0.00, 50.00, 'PAGADO', NULL),
(12, 9, 4, '3', 2026, 0.00, 0.00, 0.00, 50.00, 'PAGADO', NULL),
(16, 10, 4, '2', 2026, 50.00, 0.00, 0.00, 50.00, 'PAGADO', NULL),
(18, 10, 4, '3', 2026, 0.00, 0.00, 0.00, 50.00, 'PENDIENTE', NULL),
(72, 9, NULL, NULL, 0, 0.00, 0.00, 0.00, 20.00, 'EVENTO_PAGADO', 9),
(76, 9, NULL, NULL, 0, 0.00, 0.00, 0.00, 10.00, 'EVENTO_PAGADO', 10),
(113, 10, NULL, NULL, 0, 0.00, 0.00, 0.00, 5.00, 'EVENTO_PAGADO', 11),
(114, 9, NULL, NULL, 0, 0.00, 0.00, 0.00, 70.00, 'EVENTO_PAGADO', 12),
(115, 9, 5, '3', 2026, 40.00, 0.00, 0.00, 40.00, 'PAGADO', NULL),
(116, 11, 5, '3', 2026, 50.00, 0.00, 0.00, 50.00, 'PAGADO', NULL),
(117, 11, NULL, NULL, 0, 0.00, 0.00, 0.00, 75.00, 'EVENTO_PAGADO', 13),
(118, 11, 5, '4', 2026, 250.00, 0.00, 0.00, 250.00, 'PAGADO', NULL);

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
(9, 'Kermese', 'Evento de recaudacion', '1er A', 20.00, 1),
(10, 'Carnaval', 'Mojazon', '1er A', 10.00, 1),
(11, 'Maraton ', 'Carrera', '2do A', 5.00, 1),
(12, 'Feria', 'Feria gastronomica', '1er A', 70.00, 1),
(13, 'Kermese', 'Evento de recaudacion', '5to A', 75.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gastos_ocacionales`
--

CREATE TABLE `gastos_ocacionales` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) DEFAULT NULL,
  `concepto` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` date NOT NULL,
  `base_amount` decimal(10,2) NOT NULL,
  `extra_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `encargado` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `gastos_ocacionales`
--

INSERT INTO `gastos_ocacionales` (`id`, `estudiante_id`, `concepto`, `descripcion`, `fecha`, `base_amount`, `extra_amount`, `discount_amount`, `total`, `estado`, `encargado`, `created_at`) VALUES
(1, 15, 'Material feria científica', 'Cartulinas y marcadores', '2026-03-12', 40.00, 0.00, 0.00, 40.00, 'PENDIENTE', 'Administración', '2026-03-12 15:54:22');

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
(1431, 9, '2', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1432, 9, '3', 2026, 490.00, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1447, 10, '2', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1449, 10, '3', 2026, 490.00, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1490, 9, '4', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1561, 11, '3', 2026, 490.00, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1751, 10, '4', 2026, NULL, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1755, 9, '5', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1840, 12, '3', 2026, 490.00, 'PENDIENTE', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL),
(1881, 12, '4', 2026, NULL, 'PENDIENTE', 900.00, 0.00, 0.00, 900.00, 'MENSUALIDAD', NULL),
(1926, 15, '3', 2026, NULL, 'PENDIENTE', 390.00, 0.00, 0.00, 390.00, 'MENSUALIDAD', NULL),
(1997, 11, '4', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00, 'MENSUALIDAD', NULL);

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
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `metodo_pago` enum('EFECTIVO','QR') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos`
--

INSERT INTO `movimientos` (`id`, `tipo`, `concepto`, `monto`, `encargado`, `fecha`, `metodo_pago`) VALUES
(28, 'INGRESO', 'Pago MENSUALIDAD ID 1431', 490.00, 'Admin', '2026-03-01 17:33:54', NULL),
(29, 'INGRESO', 'Pago MENSUALIDAD ID 1432', 490.00, 'Admin', '2026-03-01 17:57:10', NULL),
(30, 'INGRESO', 'Pago SERVICIO ID 5', 50.00, 'Admin', '2026-03-01 17:57:19', NULL),
(31, 'INGRESO', 'Pago SERVICIO ID 12', 50.00, 'Admin', '2026-03-01 20:38:58', NULL),
(32, 'INGRESO', 'Pago MENSUALIDAD ID 1447', 490.00, 'Admin', '2026-03-01 20:52:22', NULL),
(33, 'GASTO', 'Reverso MENSUALIDAD ID 1447', 490.00, 'Admin', '2026-03-01 20:54:55', NULL),
(34, 'INGRESO', 'Pago SERVICIO ID 16', 50.00, 'Admin', '2026-03-01 21:02:32', NULL),
(35, 'GASTO', 'Factura de luz', 100.00, 'Admin', '2026-03-01 21:38:26', NULL),
(36, 'INGRESO', 'Pago SERVICIO ID 76', 10.00, 'Admin', '2026-03-02 00:24:44', NULL),
(37, 'INGRESO', 'Pago SERVICIO ID 72', 20.00, 'Admin', '2026-03-02 01:09:28', NULL),
(38, 'INGRESO', 'Pago SERVICIO ID 113', 5.00, 'Admin', '2026-03-02 01:15:37', NULL),
(39, 'INGRESO', 'Pago SERVICIO ID 114', 70.00, 'Admin', '2026-03-02 01:23:27', NULL),
(40, 'INGRESO', 'Pago SERVICIO ID 115', 20.00, 'Admin', '2026-03-02 14:39:45', NULL),
(41, 'INGRESO', 'Pago SERVICIO ID 115', 20.00, 'Admin', '2026-03-02 14:42:00', NULL),
(42, 'INGRESO', 'Pago SERVICIO ID 116', 10.00, 'Admin', '2026-03-02 21:09:37', NULL),
(43, 'INGRESO', 'Pago SERVICIO ID 117', 10.00, 'Admin', '2026-03-02 21:34:12', NULL),
(44, 'INGRESO', 'Pago SERVICIO ID 117', 20.00, 'Admin', '2026-03-02 21:35:15', NULL),
(45, 'INGRESO', 'Pago SERVICIO ID 116', 20.00, 'Admin', '2026-03-02 21:54:10', NULL),
(46, 'GASTO', 'Reverso SERVICIO ID 116', 10.00, 'Admin', '2026-03-02 21:54:28', NULL),
(47, 'INGRESO', 'Pago MENSUALIDAD ID 1561', 100.00, 'Admin', '2026-03-02 21:59:41', NULL),
(48, 'GASTO', 'Reverso SERVICIO ID 116', 20.00, 'Admin', '2026-03-02 22:29:19', NULL),
(49, 'GASTO', 'Reverso SERVICIO ID 117', 20.00, 'Admin', '2026-03-02 22:29:45', NULL),
(50, 'GASTO', 'Reverso SERVICIO ID 117', 10.00, 'Admin', '2026-03-02 22:29:57', NULL),
(51, 'INGRESO', 'Pago SERVICIO ID 117', 75.00, 'Admin', '2026-03-03 08:09:59', NULL),
(52, 'INGRESO', 'Pago MENSUALIDAD ID 1755', 490.00, 'Admin', '2026-03-03 12:09:44', NULL),
(53, 'INGRESO', 'Pago MENSUALIDAD ID 1490', 490.00, 'Admin', '2026-03-03 12:10:06', NULL),
(54, 'INGRESO', 'Pago SERVICIO ID 116', 50.00, 'Admin', '2026-03-03 16:47:36', NULL),
(55, 'INGRESO', 'Pago MENSUALIDAD ID 1840', 440.00, 'Admin', '2026-03-04 11:07:28', NULL),
(56, 'INGRESO', 'Pago MENSUALIDAD ID 1449', 100.00, 'Admin', '2026-03-04 20:32:30', NULL),
(57, 'GASTO', 'Reverso MENSUALIDAD ID 1755', 490.00, 'Admin', '2026-03-04 21:10:43', NULL),
(58, 'INGRESO', 'Pago GASTO_OCASIONAL ID 1', 40.00, 'Administración', '2026-03-15 21:18:16', NULL),
(59, 'INGRESO', 'Pago MENSUALIDAD ID 1997', 490.00, 'Admin', '2026-03-15 21:19:35', NULL),
(60, 'INGRESO', 'Pago SERVICIO ID 118', 250.00, 'Admin', '2026-03-15 21:20:22', NULL),
(61, 'INGRESO', 'Pago GASTO_OCASIONAL ID 1', 20.00, 'Administración', '2026-03-15 21:21:31', NULL),
(62, 'INGRESO', 'Pago GASTO_OCASIONAL ID 1', 20.00, 'Administración', '2026-03-15 21:41:03', NULL),
(63, 'GASTO', 'Pago de gas', 30.00, 'Admin', '2026-03-17 00:18:01', 'QR');

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
  `tipo` enum('MENSUALIDAD','SERVICIO','EVENTO','GASTO_OCASIONAL') NOT NULL,
  `referencia_id` int(11) NOT NULL,
  `metodo_pago` enum('EFECTIVO','QR') DEFAULT 'EFECTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `fecha`, `monto`, `descuento`, `responsable`, `nota`, `reversed`, `tipo`, `referencia_id`, `metodo_pago`) VALUES
(47, '2026-03-01 00:00:00', 490.00, 0.00, 'Admin', NULL, 0, 'MENSUALIDAD', 1431, 'EFECTIVO'),
(48, '2026-03-01 00:00:00', 490.00, 0.00, 'Admin', NULL, 0, 'MENSUALIDAD', 1432, 'EFECTIVO'),
(49, '2026-03-01 00:00:00', 50.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 5, 'EFECTIVO'),
(50, '2026-03-02 00:00:00', 50.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 12, 'EFECTIVO'),
(51, '2026-03-02 00:00:00', 490.00, 0.00, 'Admin', NULL, 1, 'MENSUALIDAD', 1447, 'EFECTIVO'),
(52, '2026-03-02 00:00:00', -490.00, 0.00, 'Admin', 'Reversión manual', 0, 'MENSUALIDAD', 1447, 'EFECTIVO'),
(53, '2026-03-02 00:00:00', 50.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 16, 'EFECTIVO'),
(54, '2026-03-02 00:00:00', 10.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 76, 'EFECTIVO'),
(55, '2026-03-02 00:00:00', 20.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 72, 'EFECTIVO'),
(56, '2026-03-02 00:00:00', 5.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 113, 'EFECTIVO'),
(57, '2026-03-02 00:00:00', 70.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 114, 'EFECTIVO'),
(58, '2026-03-02 00:00:00', 20.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 115, 'EFECTIVO'),
(59, '2026-03-02 00:00:00', 20.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 115, 'EFECTIVO'),
(60, '2026-03-03 00:00:00', 10.00, 0.00, 'Admin', NULL, 1, 'SERVICIO', 116, 'EFECTIVO'),
(61, '2026-03-03 00:00:00', 10.00, 0.00, 'Admin', NULL, 1, 'SERVICIO', 117, 'EFECTIVO'),
(62, '2026-03-03 00:00:00', 20.00, 0.00, 'Admin', NULL, 1, 'SERVICIO', 117, 'EFECTIVO'),
(63, '2026-03-03 00:00:00', 20.00, 0.00, 'Admin', NULL, 1, 'SERVICIO', 116, 'EFECTIVO'),
(64, '2026-03-03 00:00:00', -10.00, 0.00, 'Admin', 'Reversión manual', 1, 'SERVICIO', 116, 'EFECTIVO'),
(65, '2026-03-03 00:00:00', 100.00, 20.00, 'Admin', NULL, 0, 'MENSUALIDAD', 1561, 'EFECTIVO'),
(66, '2026-03-03 00:00:00', -20.00, 0.00, 'Admin', 'Reversión manual', 1, 'SERVICIO', 116, 'EFECTIVO'),
(67, '2026-03-03 00:00:00', -20.00, 0.00, 'Admin', 'Reversión manual', 1, 'SERVICIO', 117, 'EFECTIVO'),
(68, '2026-03-03 00:00:00', -10.00, 0.00, 'Admin', 'Reversión manual', 1, 'SERVICIO', 117, 'EFECTIVO'),
(69, '2026-03-03 00:00:00', 75.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 117, 'EFECTIVO'),
(70, '2026-03-03 00:00:00', 490.00, 0.00, 'Admin', NULL, 1, 'MENSUALIDAD', 1755, 'EFECTIVO'),
(71, '2026-03-03 00:00:00', 490.00, 0.00, 'Admin', NULL, 0, 'MENSUALIDAD', 1490, 'EFECTIVO'),
(72, '2026-03-03 00:00:00', 50.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 116, 'EFECTIVO'),
(73, '2026-03-04 00:00:00', 440.00, 10.00, 'Admin', NULL, 0, 'MENSUALIDAD', 1840, 'EFECTIVO'),
(74, '2026-03-05 00:00:00', 100.00, 0.00, 'Admin', NULL, 0, 'MENSUALIDAD', 1449, 'EFECTIVO'),
(75, '2026-03-05 00:00:00', -490.00, 0.00, 'Admin', 'Reversión manual', 1, 'MENSUALIDAD', 1755, 'EFECTIVO'),
(77, '2026-03-16 00:00:00', 490.00, 0.00, 'Admin', NULL, 0, 'MENSUALIDAD', 1997, 'EFECTIVO'),
(78, '2026-03-16 00:00:00', 250.00, 0.00, 'Admin', NULL, 0, 'SERVICIO', 118, 'EFECTIVO'),
(80, '2026-03-16 00:00:00', 20.00, 0.00, 'Administración', 'Pago gasto material', 0, 'GASTO_OCASIONAL', 1, 'QR');

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
(4, 'Ingles', 'SERVICIO', 1),
(5, 'Futsal', 'SERVICIO', 1),
(6, 'Danza', 'SERVICIO', 1);

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
(6, 'Cristan Sajama', '60388220', NULL, 'sajama.cristian20@gmail.com'),
(7, 'Juan Perez', '60775755', NULL, 'mauricioramoscrespo@gmail.com'),
(8, 'Maria Ramirez', '60775755', NULL, 'mariaramireznnnnnnnnn@gmail.com');

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
(1, 'Admin', 'simonsp', NULL, 'ADMIN', '3795');

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
  ADD UNIQUE KEY `unique_servicio_mes` (`estudiante_id`,`servicio_id`,`mes`,`anio`),
  ADD KEY `estudiante_id` (`estudiante_id`),
  ADD KEY `servicio_id` (`servicio_id`),
  ADD KEY `fk_evento` (`evento_id`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `gastos_ocacionales`
--
ALTER TABLE `gastos_ocacionales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_gasto_estudiante` (`estudiante_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `estudiante_servicio`
--
ALTER TABLE `estudiante_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=119;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `gastos_ocacionales`
--
ALTER TABLE `gastos_ocacionales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2103;

--
-- AUTO_INCREMENT de la tabla `movimientos`
--
ALTER TABLE `movimientos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `tutores`
--
ALTER TABLE `tutores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  ADD CONSTRAINT `estudiante_servicio_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`),
  ADD CONSTRAINT `fk_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`);

--
-- Filtros para la tabla `gastos_ocacionales`
--
ALTER TABLE `gastos_ocacionales`
  ADD CONSTRAINT `fk_gasto_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  ADD CONSTRAINT `mensualidades_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

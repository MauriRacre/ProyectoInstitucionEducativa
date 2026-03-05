-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-02-2026 a las 04:41:04
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
(6, 4, 'Romina Mendoza', '3ro', 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id` int(11) NOT NULL,
  `evento` varchar(120) NOT NULL,
  `concepto` varchar(120) NOT NULL,
  `destino` varchar(50) NOT NULL,
  `activo` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id`, `evento`, `concepto`, `destino`, `activo`) VALUES
(1, 'Kermesse', 'Entrada', 'Caja', 1),
(2, 'Graduacion', 'Entrada', 'Banco', 1);

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
  `total` decimal(10,2) DEFAULT 490.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensualidades`
--

INSERT INTO `mensualidades` (`id`, `estudiante_id`, `mes`, `anio`, `monto`, `estado`, `base_amount`, `extra_amount`, `discount_amount`, `total`) VALUES
(1, 1, 'Febrero', 2026, 350.00, 'PAGADO', 490.00, 0.00, 0.00, 490.00),
(2, 2, '2', 2026, NULL, 'PAGADO', 490.00, 0.00, 0.00, 490.00),
(3, 5, '2', 2026, NULL, 'PARCIAL', 490.00, 0.00, 0.00, 490.00),
(4, 3, '2', 2026, NULL, 'PENDIENTE', 490.00, 50.00, 20.00, 520.00),
(5, 6, '2', 2026, NULL, 'PAGADO', 490.00, 40.00, 10.00, 520.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `mensualidad_id` int(11) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `monto` decimal(10,2) DEFAULT NULL,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `responsable` varchar(100) DEFAULT NULL,
  `nota` varchar(100) DEFAULT NULL,
  `reversed` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `mensualidad_id`, `fecha`, `monto`, `descuento`, `responsable`, `nota`, `reversed`) VALUES
(1, 1, '2026-02-07 12:45:06', 350.00, 0.00, NULL, NULL, 0),
(2, 2, '2026-02-11 00:00:00', 100.00, 0.00, 'caja', 'abono', 0),
(3, 2, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0),
(4, 2, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0),
(5, 2, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0),
(6, 2, '2026-02-12 00:00:00', 90.00, 0.00, 'caja', 'abono', 0),
(7, 3, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0),
(8, 3, '2026-02-12 00:00:00', 100.00, 0.00, 'caja', 'abono', 0),
(9, 3, '2026-02-12 00:00:00', 40.00, 0.00, 'caja', 'abono', 0),
(10, 3, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0),
(11, 3, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0),
(12, 3, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0),
(13, 3, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0),
(14, 3, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0),
(15, 3, '2026-02-12 00:00:00', 30.00, 0.00, 'caja', 'abono', 0),
(16, 5, '2026-02-17 00:00:00', 100.00, 0.00, 'Caja', 'Abono en efectivo', 0),
(17, 5, '2026-02-17 00:00:00', 150.00, 0.00, 'Caja', 'Abono en efectivo', 0),
(18, 5, '2026-02-17 00:00:00', 250.00, 20.00, 'Caja', 'Abono en efectivo', 0);

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
(1, 'Juan Perez', '777777', 'Centro', 'juan@gmail.com'),
(3, 'Maria Perez', '777777', 'Centro', 'maria@gmail.com'),
(4, 'Carlos Ramírez EDITADO', '70000000', NULL, 'mauricioramoscrespo@gmail.com');

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
(1, '', 'admin', NULL, 'ADMIN', '0'),
(2, 'Mauricio Ramos', 'mau', 'mauri.mdc.24@mail.com', 'ADMIN', '0'),
(4, 'Mauri Racre', 'Admi', 'mauri.mdc.24@gmail.com', 'ADMIN', 'DCF2AZ'),
(6, 'MauriRacre', 'AdmiMau', 'mauri.mdc.24@gmail.com', 'ADMIN', 'ZYQRAB'),
(7, 'Cristian Sajama', 'Cris', 'sajama.cristian20@gmail.com', 'ADMIN', 'NLA3BL');

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
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estudiante_id` (`estudiante_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mensualidad_id` (`mensualidad_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `tutores`
--
ALTER TABLE `tutores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutores` (`id`);

--
-- Filtros para la tabla `mensualidades`
--
ALTER TABLE `mensualidades`
  ADD CONSTRAINT `mensualidades_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`mensualidad_id`) REFERENCES `mensualidades` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

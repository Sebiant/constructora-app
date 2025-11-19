-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 18-11-2025 a las 12:07:49
-- Versión del servidor: 10.11.11-MariaDB
-- Versión de PHP: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gesconjm_sgicontrol`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `capitulos`
--

CREATE TABLE `capitulos` (
  `id_capitulo` int(11) NOT NULL,
  `id_presupuesto` int(11) NOT NULL,
  `nombre_cap` varchar(200) NOT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `idusuario` int(4) NOT NULL,
  `fechareg` date NOT NULL,
  `fechaupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `capitulos`
--

INSERT INTO `capitulos` (`id_capitulo`, `id_presupuesto`, `nombre_cap`, `estado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 'BYPASS SAN JERONIMO', 1, 1, '2025-10-13', '2025-10-13'),
(2, 1, 'BYPASS EL CARMELO', 1, 1, '2025-10-13', '2025-10-13'),
(3, 2, 'Capitulo 1', 1, 1, '2025-10-14', '2025-10-14'),
(4, 2, 'capitulo 2', 1, 1, '2025-10-14', '2025-10-14'),
(5, 2, 'Capitulo 3', 1, 1, '2025-10-14', '2025-10-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `nit` varchar(20) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `estado` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `nit`, `nombre`, `estado`) VALUES
(1, '123456789', 'Pruebas', 1),
(2, '94475178', 'Hector Hernan', 1),
(3, '852174235', 'PEDRO PEREZ', 1),
(4, '900001999', 'Gobernación del Valle del Cauca', 1),
(5, '7899', 'Carlos', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `coop_perfiles`
--

CREATE TABLE `coop_perfiles` (
  `codigo_perfil` varchar(50) NOT NULL DEFAULT '',
  `descripcion_perfil` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `coop_perfiles`
--

INSERT INTO `coop_perfiles` (`codigo_perfil`, `descripcion_perfil`) VALUES
('1', 'Administrador'),
('2', 'Encargado del proceso'),
('3', 'Usuario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `coop_permisoperfil`
--

CREATE TABLE `coop_permisoperfil` (
  `idpermisoperfil` int(11) NOT NULL,
  `idpemisoperfil` int(11) NOT NULL,
  `idusuario` int(11) NOT NULL,
  `estado` int(11) NOT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `coop_permisoperfil`
--

INSERT INTO `coop_permisoperfil` (`idpermisoperfil`, `idpemisoperfil`, `idusuario`, `estado`, `created_at`, `updated_at`) VALUES
(3, 5, 26, 1, '2025-05-23', '2025-05-23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `costos_ind`
--

CREATE TABLE `costos_ind` (
  `idcostosind` int(3) NOT NULL,
  `desccostoind` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `porcentaje` decimal(15,2) NOT NULL,
  `tipo_costo` int(1) NOT NULL,
  `id_estado` int(1) NOT NULL,
  `costoiva` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `costos_ind`
--

INSERT INTO `costos_ind` (`idcostosind`, `desccostoind`, `porcentaje`, `tipo_costo`, `id_estado`, `costoiva`) VALUES
(1, 'Administración', 21.00, 1, 1, 0),
(2, 'Imprevistos', 1.00, 1, 1, 0),
(3, 'Utilidad', 8.00, 1, 1, 1),
(4, 'IVA', 19.00, 2, 1, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `det_presupuesto`
--

CREATE TABLE `det_presupuesto` (
  `id_det_presupuesto` int(11) NOT NULL,
  `id_presupuesto` int(11) NOT NULL,
  `id_material` int(11) DEFAULT NULL,
  `id_item` int(11) NOT NULL,
  `id_capitulo` int(11) NOT NULL,
  `id_mat_precio` int(11) DEFAULT NULL,
  `cantidad` decimal(12,2) NOT NULL,
  `idestado` int(1) NOT NULL,
  `idusuario` int(4) NOT NULL,
  `fechareg` date NOT NULL,
  `fechaupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `det_presupuesto`
--

INSERT INTO `det_presupuesto` (`id_det_presupuesto`, `id_presupuesto`, `id_material`, `id_item`, `id_capitulo`, `id_mat_precio`, `cantidad`, `idestado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 1, 3, 1, 1, 7.00, 1, 2025, '2025-09-30', '2025-09-30'),
(2, 1, 2, 4, 1, 2, 25.00, 1, 2025, '2025-09-30', '2025-09-30'),
(3, 1, 3, 5, 1, 3, 51.00, 1, 2025, '2025-09-30', '2025-09-30'),
(4, 1, 4, 6, 1, 4, 20.40, 1, 2025, '2025-09-30', '2025-09-30'),
(5, 1, 5, 7, 1, 5, 50.60, 1, 2025, '2025-09-30', '2025-09-30'),
(6, 1, 6, 8, 1, 6, 3.15, 1, 2025, '2025-09-30', '2025-09-30'),
(7, 1, 7, 9, 1, 7, 26.00, 1, 2025, '2025-09-30', '2025-09-30'),
(8, 1, 8, 10, 1, 8, 1.00, 1, 2025, '2025-09-30', '2025-09-30'),
(9, 1, 9, 11, 1, 9, 1.00, 1, 2025, '2025-09-30', '2025-09-30'),
(10, 1, 10, 12, 1, 10, 26.00, 1, 2025, '2025-09-30', '2025-09-30'),
(11, 1, 11, 13, 1, 11, 12.48, 1, 2025, '2025-09-30', '2025-09-30'),
(12, 1, 12, 14, 1, 12, 16.64, 1, 2025, '2025-09-30', '2025-09-30'),
(13, 1, 13, 15, 1, 13, 6.24, 1, 2025, '2025-09-30', '2025-09-30'),
(14, 1, 14, 16, 1, 14, 4.16, 1, 2025, '2025-09-30', '2025-09-30'),
(15, 1, 15, 17, 1, 15, 53.40, 1, 2025, '2025-09-30', '2025-09-30'),
(16, 1, 16, 18, 1, 16, 1.00, 1, 2025, '2025-09-30', '2025-09-30'),
(17, 1, 17, 19, 1, 17, 30.16, 1, 2025, '2025-09-30', '2025-09-30'),
(18, 1, 18, 20, 1, 18, 443.35, 1, 2025, '2025-09-30', '2025-09-30'),
(19, 1, 19, 3, 2, 19, 10.00, 1, 2025, '2025-09-30', '2025-09-30'),
(20, 1, 20, 4, 2, 20, 30.00, 1, 2025, '2025-09-30', '2025-09-30'),
(21, 1, 21, 21, 2, 21, 480.00, 1, 2025, '2025-09-30', '2025-09-30'),
(22, 1, 22, 22, 2, 22, 480.00, 1, 2025, '2025-09-30', '2025-09-30'),
(23, 1, 23, 23, 2, 23, 30.00, 1, 2025, '2025-09-30', '2025-09-30'),
(24, 1, 24, 5, 2, 24, 162.00, 1, 2025, '2025-09-30', '2025-09-30'),
(25, 1, 25, 6, 2, 25, 57.60, 1, 2025, '2025-09-30', '2025-09-30'),
(26, 1, 26, 7, 2, 26, 194.83, 1, 2025, '2025-09-30', '2025-09-30'),
(27, 1, 27, 8, 2, 27, 12.96, 1, 2025, '2025-09-30', '2025-09-30'),
(28, 1, 28, 24, 2, 28, 76.00, 1, 2025, '2025-09-30', '2025-09-30'),
(29, 1, 29, 10, 2, 29, 1.00, 1, 2025, '2025-09-30', '2025-09-30'),
(30, 1, 30, 25, 2, 30, 6.00, 1, 2025, '2025-09-30', '2025-09-30'),
(31, 1, 31, 26, 2, 31, 76.00, 1, 2025, '2025-09-30', '2025-09-30'),
(32, 1, 32, 13, 2, 32, 51.84, 1, 2025, '2025-09-30', '2025-09-30'),
(33, 1, 33, 14, 2, 33, 69.12, 1, 2025, '2025-09-30', '2025-09-30'),
(34, 1, 34, 15, 2, 34, 25.92, 1, 2025, '2025-09-30', '2025-09-30'),
(35, 1, 35, 16, 2, 35, 17.28, 1, 2025, '2025-09-30', '2025-09-30'),
(36, 1, 36, 17, 2, 36, 154.00, 1, 2025, '2025-09-30', '2025-09-30'),
(37, 1, 37, 18, 2, 37, 1.00, 1, 2025, '2025-09-30', '2025-09-30'),
(38, 1, 38, 19, 2, 38, 142.99, 1, 2025, '2025-09-30', '2025-09-30'),
(39, 1, 39, 20, 2, 39, 2101.98, 1, 2025, '2025-09-30', '2025-09-30'),
(40, 2, 17, 19, 3, 40, 50.00, 1, 1, '2025-09-30', '2025-10-14'),
(41, 2, 16, 18, 4, 16, 100.00, 1, 1, '2025-10-14', '2025-10-14'),
(42, 2, 28, 24, 3, 28, 76.00, 1, 1, '2025-10-24', '2025-10-24'),
(43, 2, 29, 10, 3, 29, 1.00, 1, 1, '2025-10-24', '2025-10-24'),
(44, 2, 30, 25, 3, 30, 6.00, 1, 1, '2025-10-24', '2025-10-24'),
(45, 2, 31, 26, 3, 31, 76.00, 1, 1, '2025-10-24', '2025-10-24'),
(46, 2, 32, 13, 3, 32, 51.84, 1, 1, '2025-10-24', '2025-10-24'),
(47, 2, 33, 14, 3, 33, 69.12, 1, 1, '2025-10-24', '2025-10-24'),
(48, 2, 34, 15, 3, 34, 25.92, 1, 1, '2025-10-24', '2025-10-24'),
(49, 2, 35, 16, 3, 35, 17.28, 1, 1, '2025-10-24', '2025-10-24'),
(50, 2, 36, 17, 3, 36, 154.00, 1, 1, '2025-10-24', '2025-10-24'),
(51, 2, 37, 18, 3, 37, 1.00, 1, 1, '2025-10-24', '2025-10-24'),
(52, 2, 38, 19, 3, 38, 142.99, 1, 1, '2025-10-24', '2025-10-24'),
(53, 2, 39, 20, 3, 39, 2101.98, 1, 1, '2025-10-24', '2025-10-24'),
(54, 1, NULL, 1, 1, NULL, 1.00, 1, 1, '2025-11-10', '2025-11-10'),
(55, 1, NULL, 2, 1, NULL, 2.00, 1, 1, '2025-11-10', '2025-11-10'),
(56, 1, NULL, 3, 1, NULL, 3.00, 1, 1, '2025-11-10', '2025-11-10'),
(57, 1, NULL, 4, 2, NULL, 4.00, 1, 1, '2025-11-10', '2025-11-10'),
(58, 1, NULL, 5, 2, NULL, 5.00, 1, 1, '2025-11-10', '2025-11-10'),
(59, 1, NULL, 21, 2, NULL, 6.00, 1, 1, '2025-11-10', '2025-11-10'),
(60, 1, NULL, 22, 2, NULL, 7.00, 1, 1, '2025-11-10', '2025-11-10'),
(61, 1, NULL, 23, 2, NULL, 8.00, 1, 1, '2025-11-10', '2025-11-10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

CREATE TABLE `empresa` (
  `idempresa` int(11) NOT NULL,
  `descripcion` varchar(90) NOT NULL DEFAULT '',
  `estado` tinyint(4) DEFAULT 1
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado`
--

CREATE TABLE `estado` (
  `id_estado` int(10) UNSIGNED NOT NULL,
  `estado` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `estado`
--

INSERT INTO `estado` (`id_estado`, `estado`) VALUES
(0, 'Inactivo'),
(1, 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_pedido`
--

CREATE TABLE `estado_pedido` (
  `id_estado_pedido` int(3) NOT NULL COMMENT 'ID del estado',
  `desc_estado` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL COMMENT 'Descripción del estado',
  `color` varchar(20) DEFAULT NULL COMMENT 'Color para UI (ej: success, warning, danger)',
  `id_estado` int(1) NOT NULL DEFAULT 1 COMMENT 'Estado activo/inactivo'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Catálogo de estados de pedidos';

--
-- Volcado de datos para la tabla `estado_pedido`
--

INSERT INTO `estado_pedido` (`id_estado_pedido`, `desc_estado`, `color`, `id_estado`) VALUES
(1, 'Pendiente', 'warning', 1),
(2, 'Aprobado', 'info', 1),
(3, 'En Proceso', 'primary', 1),
(4, 'Entregado Parcial', 'secondary', 1),
(5, 'Entregado Total', 'success', 1),
(6, 'Rechazado', 'danger', 1),
(7, 'Cancelado', 'dark', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_auth_reset_password`
--

CREATE TABLE `gr_auth_reset_password` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Volcado de datos para la tabla `gr_auth_reset_password`
--

INSERT INTO `gr_auth_reset_password` (`id`, `user_id`, `token`, `created_at`) VALUES
(2, 2, '8b8d8d71bc8130f55fa4d3c2ae683ee751fc1a813554a8fb2ed7fe154d364a65', '2025-09-30 19:17:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_paginaperfil`
--

CREATE TABLE `gr_paginaperfil` (
  `Id` int(11) NOT NULL,
  `idpagina` int(11) NOT NULL DEFAULT 0,
  `perfil` int(11) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `gr_paginaperfil`
--

INSERT INTO `gr_paginaperfil` (`Id`, `idpagina`, `perfil`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 1, 2),
(5, 2, 2),
(6, 3, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_tipodoc`
--

CREATE TABLE `gr_tipodoc` (
  `idtipodoc` int(3) NOT NULL,
  `desctipdoc` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `gr_tipodoc`
--

INSERT INTO `gr_tipodoc` (`idtipodoc`, `desctipdoc`, `id_estado`) VALUES
(1, 'Cédula de Ciudadanía', 1),
(2, 'Pasaporte', 1),
(3, 'Cédula de Extranjería', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_unidad`
--

CREATE TABLE `gr_unidad` (
  `idunidad` int(11) NOT NULL,
  `unidesc` varchar(50) NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `gr_unidad`
--

INSERT INTO `gr_unidad` (`idunidad`, `unidesc`, `id_estado`) VALUES
(1, 'UND', 1),
(2, 'DÍA', 1),
(3, 'M', 1),
(4, 'M2', 1),
(5, 'M3', 1),
(6, 'M3 - KM', 1),
(7, 'H', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_usuarios`
--

CREATE TABLE `gr_usuarios` (
  `u_id` int(11) NOT NULL,
  `u_login` varchar(60) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL DEFAULT '',
  `u_password` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL DEFAULT '',
  `u_nombre` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL DEFAULT '',
  `u_apellido` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci DEFAULT NULL,
  `u_email` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL DEFAULT '',
  `tipodoc` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `cedula` int(11) NOT NULL DEFAULT 0,
  `u_activo` int(11) NOT NULL DEFAULT 0,
  `codigo_perfil` int(11) NOT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `deactivate_at` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `gr_usuarios`
--

INSERT INTO `gr_usuarios` (`u_id`, `u_login`, `u_password`, `u_nombre`, `u_apellido`, `u_email`, `tipodoc`, `cedula`, `u_activo`, `codigo_perfil`, `created_at`, `updated_at`, `deactivate_at`) VALUES
(1, 'hhramirez@gmail.com', '$2y$10$MAet5DE1KwZceWdaiGAVW..XqWXoajdaYHDRz.E0V210G93OVlwuK', 'Juan Pablo', 'Ramírez Reyes', 'hhramirez@gmail.com', '1', 123456789, 1, 1, '2022-04-27', '2025-09-30', NULL),
(2, 'hhramirez2@gmail.com', '$2y$10$mHQ8IpgGNe/LcozHDdxsSuUUQ2wAGdOzsiSUoL1qFGQRIR4Pea7eq', 'Hector Hernan', 'Ramirez Reyes', 'hhramirez2@gmail.com', '1', 94475178, 1, 1, '2025-09-30', '2025-09-30', NULL),
(3, 'usuario@gmail.com', '$2y$10$/ECK94yVays1RyRYXj/cxO30weTMqFtbCVUSpGeybTfWVh7B9mhNG', 'NATALIA', 'Ramírez Reyes', 'usuario@gmail.com', '1', 8529633, 1, 3, '2025-10-06', '2025-10-06', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `items`
--

CREATE TABLE `items` (
  `id_item` int(11) NOT NULL,
  `codigo_item` varchar(50) NOT NULL COMMENT 'Código único del ítem (ej: APU-001)',
  `nombre_item` text NOT NULL COMMENT 'Nombre del ítem (ej: Instalación de cinta reflectiva)',
  `unidad` varchar(20) NOT NULL COMMENT 'Unidad de medida (m, m2, m3, un, etc)',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción detallada del ítem',
  `precio_unitario` decimal(14,2) DEFAULT 0.00 COMMENT 'Precio calculado automáticamente',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `idusuario` int(4) NOT NULL,
  `idestado` int(1) DEFAULT 1,
  `es_compuesto` tinyint(1) DEFAULT 0 COMMENT '0=Simple, 1=Compuesto (puede tener sub-items)',
  `id_item_padre` int(11) DEFAULT NULL COMMENT 'Para items que son sub-componentes de otros items'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `items`
--

INSERT INTO `items` (`id_item`, `codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `fecha_creacion`, `idusuario`, `idestado`, `es_compuesto`, `id_item_padre`) VALUES
(1, 'ME0109', 'MEZCLA CONCRETO 1:2:4 2500 PSI - 17,5 Mpa', 'M3', 'Mezcla de concreto con resistencia de 2500 PSI (17.5 MPa)', 388523.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(2, 'ME0201', 'MORTERO 1:3', 'M3', 'Mortero con proporción 1:3 (cemento:arena)', 409265.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(3, '330301', 'CINTA SEGURIDAD PREVENTIVA A=8CM-250MTS', 'UND', 'Instalación de cinta de seguridad preventiva con ancho 8cm, longitud 250 metros', 200842.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(4, '330306', 'BARRICADA Y DESVIO TIPO SR-102', 'DIA', 'Suministro e instalación de barricada y desvío de tráfico tipo SR-102', 21948.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(5, '330127', 'CORTADORA DE PAVIMENTO DE 4 A 7 CM', 'M', 'Corte de pavimento con profundidad de 4 a 7 cm', 9675.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(6, '100424', 'DEMOLICION PAVIMENTO CONCRETO E=20CM', 'M2', 'Demolición de pavimento de concreto con espesor de 20 cm', 36890.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(7, '100602', 'EXCAVACION EN CONGLOMERADO (MANUAL)', 'M3', 'Excavación manual en material conglomerado', 49642.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(8, '110906', 'COLCHON ARENA GRUESA E=5-7CM', 'M3', 'Colchón de arena gruesa con espesor de 5-7 cm', 88188.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(9, '165905', 'INST.TUB.PVC UM 6\"', 'M', 'Instalación de tubería PVC Unión Mecánica 6 pulgadas', 11317.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(10, '165110-17P', 'TEE PVC UM 3\" x3\" x3\"', 'UND', 'Tee de PVC Unión Mecánica 3\"x3\"x3\"', 252989.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(11, '165304-18P', 'REDUCC PVC UM 6\" x3\"', 'UND', 'Reducción de PVC Unión Mecánica 6\"x3\"', 472849.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(12, '165008', 'TUBERIA PVC ALTA PRESION 6\" RDE 13.5 UM', 'M', 'Tubería PVC alta presión 6 pulgadas RDE 13.5 Unión Mecánica', 281462.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(13, '100618', 'RELLENO MATERIAL SITIO COMPACTADO-RANA', 'M3', 'Relleno con material del sitio compactado con vibrocompactador tipo rana', 44867.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(14, '100620', 'RELLENO ROCAMUERTA COMPACT-SALTARIN', 'M3', 'Relleno con roca muerta compactado con vibrocompactador saltarín', 105317.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(15, '083303', 'BASE GRANULAR CLASE B (NT2, BG 38, clase B)', 'M3', 'Base granular clase B analizada para tipo NT2, de gradación BG 38', 125168.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(16, '085002', 'PAVIMENTO DE CONCRETO HIDRÁULICO PREMEZCLADO NT2', 'M3', 'Pavimento de concreto hidráulico premezclado para tránsito NT2, no incluye acero ni barras de transferencia', 920116.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(17, '321003', 'SELLADOR ELASTICO (JUNTA 1 X 1 CM)', 'M', 'Aplicación de sellador elástico de poliuretano en juntas de 1x1 cm', 50950.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(18, '020430-15P', 'EMPALME TUB 3\"-6\" CAMARA CONCRETO', 'UND', 'Empalme de tubería 3\"-6\" en cámara de concreto', 381664.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(19, '010209', 'CARGUE MAT. EXCAV. A MAQUINA (SIN TRANSP)', 'M3', 'Cargue de material excavado a máquina sin transporte', 7594.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(20, '089003', 'TRANSPORTE MATERIAL EXCAVACIÓN >1000m (Volqueta 6m3)', 'M3-KM', 'Transporte de materiales de excavación para distancias mayores de 1000m, medidos desde 100m, en volqueta de 6 m3', 2764.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(21, '330311', 'PALETERO DIURNO', 'H', 'Personal paletero para control de tráfico en jornada diurna', 18861.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(22, '330312', 'PALETERO NOCTURNO', 'H', 'Personal paletero para control de tráfico en jornada nocturna', 22635.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(23, '330309', 'SENAL DE PARE-SIGA PARA PALETERO', 'DIA', 'Suministro de señal de pare-siga para paletero', 4370.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(24, '165903', 'INST.TUB.PVC UM 3\"', 'M', 'Instalación de tubería PVC Unión Mecánica 3 pulgadas', 7110.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(25, '165718', 'CODO PVC UM 3\" x 45 RDE-13.5', 'UND', 'Codo de PVC Unión Mecánica 3 pulgadas x 45 grados RDE-13.5', 151906.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(26, '165004', 'TUBERIA PVC ALTA PRESION 3\" RDE 13.5 UM', 'M', 'Tubería PVC alta presión 3 pulgadas RDE 13.5 Unión Mecánica', 116360.00, '2025-11-06 23:01:53', 1, 1, 0, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_componentes`
--

CREATE TABLE `item_componentes` (
  `id_componente` int(11) NOT NULL,
  `id_item` int(11) NOT NULL COMMENT 'Ítem al que pertenece',
  `tipo_componente` enum('material','mano_obra','equipo','transporte','otro') NOT NULL,
  `id_material` int(11) DEFAULT NULL COMMENT 'Si es material, referencia a materiales',
  `descripcion` text NOT NULL COMMENT 'Descripción del componente',
  `unidad` varchar(20) NOT NULL,
  `cantidad` decimal(10,4) NOT NULL COMMENT 'Cantidad por unidad del ítem',
  `precio_unitario` decimal(14,2) NOT NULL,
  `subtotal` decimal(14,2) GENERATED ALWAYS AS (`cantidad` * `precio_unitario`) STORED,
  `idestado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `item_componentes`
--

INSERT INTO `item_componentes` (`id_componente`, `id_item`, `tipo_componente`, `id_material`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(1, 1, 'material', NULL, 'AGUA', 'LT', 164.8000, 74.00, 1),
(2, 1, 'material', NULL, 'ARENA DE TRITURACIÓN Y/O ARENA GRUESA DE RIO', 'M3', 0.5356, 52278.00, 1),
(3, 1, 'material', NULL, 'GRAVA TRITURADA 3/4\"', 'M3', 0.9682, 87600.00, 1),
(4, 1, 'material', NULL, 'GASOLINA CORRIENTE', 'GLN', 0.1000, 16758.00, 1),
(5, 1, 'material', NULL, 'CEMENTO GRIS PORTLAND', 'KG', 272.9500, 650.00, 1),
(6, 1, 'material', NULL, 'ACEITE MOTOR 4 TIEMPOS', 'GLN', 0.0060, 117290.00, 1),
(7, 1, 'mano_obra', NULL, 'M.O. 3 AYUDANTES (Jornal 191,217 + 180% Prestaciones)', 'DIA', 0.1852, 344190.00, 1),
(8, 1, 'mano_obra', NULL, 'M.O. 1 OFICIAL (Jornal 108,356 + 180% Prestaciones)', 'DIA', 0.0625, 195040.00, 1),
(9, 1, 'equipo', NULL, 'MEZCLADORA DE 9 PIES CUBICOS', 'H', 0.4800, 5151.00, 1),
(10, 1, 'equipo', NULL, 'HERRAMIENTA MENOR (7% de Mano de Obra)', 'GL', 0.0700, 75928.88, 1),
(11, 2, 'material', NULL, 'AGUA', 'LT', 220.0000, 74.00, 1),
(12, 2, 'material', NULL, 'ARENA MEDIA DE RIO Y/O DE TRITURACIÓN', 'M3', 1.0900, 56993.00, 1),
(13, 2, 'material', NULL, 'CEMENTO GRIS PORTLAND', 'KG', 450.0000, 650.00, 1),
(14, 2, 'mano_obra', NULL, 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.1563, 229460.00, 1),
(15, 2, 'equipo', NULL, 'HERRAMIENTA MENOR (7% de Mano de Obra)', 'GL', 0.0700, 35853.12, 1),
(16, 3, 'material', NULL, 'CINTA SEGURIDAD PREVENTIVA 300 M', 'ROLLO', 1.0000, 38991.00, 1),
(17, 3, 'material', NULL, 'ACERO DE REFUERZO 60.000 PSI 420 MPA', 'KG', 12.0000, 4250.00, 1),
(18, 3, 'material', NULL, 'MEZCLA CONCRETO 1:2.5:4 2500 PSI-17.5MPa', 'M3', 0.1250, 388523.00, 1),
(19, 3, 'mano_obra', NULL, 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0500, 114730.00, 1),
(20, 3, 'mano_obra', NULL, 'M.O. 1 AYUDANTE + 1 OFICIAL (Jornal 172,095 + 180% Prestaciones)', 'DIA', 0.0250, 309771.00, 1),
(21, 3, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 13477.90, 1),
(22, 4, 'mano_obra', NULL, 'AUXILIAR OFICIOS VARIOS DIURNO (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0126, 114730.00, 1),
(23, 4, 'equipo', NULL, 'BARRICADA Y DESVIO TIPO SR-102', 'DIA', 1.0000, 15247.00, 1),
(24, 5, 'equipo', NULL, 'CORTADORA DE PAVIMENTO DE 4 A 7 CM', 'M', 1.0000, 7356.00, 1),
(25, 6, 'mano_obra', NULL, 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0250, 114730.00, 1),
(26, 6, 'equipo', NULL, 'COMPRESOR DE DOS MARTILLOS', 'H', 0.2000, 125188.00, 1),
(27, 6, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 2868.25, 1),
(28, 7, 'mano_obra', NULL, 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.3257, 114730.00, 1),
(29, 7, 'equipo', NULL, 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 37371.33, 1),
(30, 8, 'material', NULL, 'ARENA DE TRITURACIÓN Y/O ARENA GRUESA DE RIO (+ 5% desperdicio)', 'M3', 1.0500, 52278.00, 1),
(31, 8, 'mano_obra', NULL, 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.0500, 229460.00, 1),
(32, 8, 'equipo', NULL, 'HERRAMIENTA MENOR (6% de Mano de Obra)', 'GL', 0.0600, 11473.00, 1),
(33, 9, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0600, 31595.00, 1),
(34, 9, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0188, 340749.00, 1),
(35, 9, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 6389.44, 1),
(36, 10, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0600, 31595.00, 1),
(37, 10, 'material', NULL, 'TEE PVC UM 3\" X 2\" X 3\" (+ 2% desperdicio)', 'UND', 1.0200, 180150.00, 1),
(38, 10, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0188, 340749.00, 1),
(39, 10, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 6389.44, 1),
(40, 11, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0400, 31595.00, 1),
(41, 11, 'material', NULL, 'REDUCCION PVC UM 6\" X 3\"', 'UND', 1.0000, 351553.00, 1),
(42, 11, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0188, 340749.00, 1),
(43, 11, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 6389.44, 1),
(44, 12, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0300, 31595.00, 1),
(45, 12, 'material', NULL, 'TUBO PRESION RDE-13.5 EU - 6\" (+ 2% desperdicio)', 'M', 1.0200, 195850.00, 1),
(46, 12, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0375, 340749.00, 1),
(47, 12, 'equipo', NULL, 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 12781.28, 1),
(48, 13, 'material', NULL, 'AGUA', 'LT', 7.0000, 74.00, 1),
(49, 13, 'material', NULL, 'GASOLINA CORRIENTE', 'GLN', 0.0500, 16758.00, 1),
(50, 13, 'material', NULL, 'ACEITE MOTOR 4 TIEMPOS', 'GLN', 0.0150, 117290.00, 1),
(51, 13, 'mano_obra', NULL, 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.1126, 229460.00, 1),
(52, 13, 'equipo', NULL, 'COMPACTADOR MANUAL VIBRATORIO (RANA) CON MOTOR DE 6 HP', 'H', 0.8000, 6125.00, 1),
(53, 13, 'equipo', NULL, 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 25840.09, 1),
(54, 14, 'material', NULL, 'ROCA MUERTA', 'M3', 1.3000, 38640.00, 1),
(55, 14, 'material', NULL, 'GASOLINA CORRIENTE', 'GLN', 0.0500, 16758.00, 1),
(56, 14, 'material', NULL, 'ACEITE MOTOR 4 TIEMPOS', 'GLN', 0.0100, 117290.00, 1),
(57, 14, 'mano_obra', NULL, 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.1000, 229460.00, 1),
(58, 14, 'equipo', NULL, 'VIBROCOMPACTADOR SALTARIN', 'DIA', 0.0800, 58230.00, 1),
(59, 14, 'equipo', NULL, 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 22946.00, 1),
(60, 15, 'material', NULL, 'MATERIAL DE BASE CLASE B (NT2) GRADACIÓN FINA BG 38', 'M3', 1.3000, 65550.00, 1),
(61, 15, 'material', NULL, 'AGUA', 'LT', 80.0000, 74.00, 1),
(62, 15, 'mano_obra', NULL, 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.0067, 229460.00, 1),
(63, 15, 'equipo', NULL, 'CARROTANQUE DE AGUA (1000 GALONES)', 'H', 0.0533, 118000.00, 1),
(64, 15, 'equipo', NULL, 'MOTONIVELADORA POTENCIA 215 HP, ANCHO DE CUCHILLA 4,27 M, PESO 18 TON', 'H', 0.0533, 306624.00, 1),
(65, 15, 'equipo', NULL, 'VIBROCOMPACTADOR, POTENCIA 153 HP, PESO 10 TON', 'H', 0.0533, 145557.00, 1),
(66, 15, 'equipo', NULL, 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 1529.73, 1),
(67, 15, 'transporte', NULL, 'TRANSPORTE DE MATERIAL DE BASE (1.3 M3 x 1 Km)', 'M3-KM', 1.3000, 1613.00, 1),
(68, 16, 'material', NULL, 'SELLO DE POLIURETANO EN CINTA PARA JUNTAS EN PAVIMENTOS', 'M', 1.8080, 1569.00, 1),
(69, 16, 'material', NULL, 'SELLO DE SILICONA O SELLADOR AUTONIVELANTE', 'M', 1.2900, 16366.00, 1),
(70, 16, 'material', NULL, 'EMULSION ACUOSA DE PARAFINA PARA CURADO DE CONCRETO', 'KG', 1.3160, 8715.00, 1),
(71, 16, 'material', NULL, 'CONCRETO HIDRÁULICO PREMEZCLADO PARA PAVIMENTO MR-41 (4.0 MPA)', 'M3', 1.0100, 707563.00, 1),
(72, 16, 'mano_obra', NULL, 'M.O. PAVIMENTO, ALISTADO Y ENCOFRADO: 4 AYUDANTES + 2 OFICIALES', 'DIA', 0.0417, 849002.00, 1),
(73, 16, 'mano_obra', NULL, 'M.O. PAVIMENTO, INSTALACIÓN: 6 AYUDANTES + 3 OFICIALES', 'DIA', 0.0417, 1273503.00, 1),
(74, 16, 'mano_obra', NULL, 'M.O. PAVIMENTO, TERMINADO: 2 AYUDANTES + 3 OFICIALES', 'DIA', 0.0417, 814582.00, 1),
(75, 16, 'equipo', NULL, 'EQUIPO DE ACABADO SUPERFICIAL', 'DIA', 0.0417, 30906.00, 1),
(76, 16, 'equipo', NULL, 'ASPERSOR MANUAL DE 20 LITROS', 'H', 0.3333, 3745.00, 1),
(77, 16, 'equipo', NULL, 'COMPRESOR (BARRIDO Y SOPLADO)', 'H', 0.3333, 77886.00, 1),
(78, 16, 'equipo', NULL, 'CORTADORA DE PAVIMENTO, PROFUNDIDAD DE CORTE: 16-19 CM', 'H', 0.3333, 14534.00, 1),
(79, 16, 'equipo', NULL, 'FORMALETA METÁLICA PARA PAVIMENTO EN CONCRETO HIDRÁULICO', 'H', 0.3333, 1109.00, 1),
(80, 16, 'equipo', NULL, 'REGLA VIBRATORIA DE CONCRETO, LONGITUD 3 A 5 M', 'H', 0.3333, 7395.00, 1),
(81, 16, 'equipo', NULL, 'VIBRADOR DE CONCRETO, POTENCIA 3 HP', 'H', 0.3333, 6051.00, 1),
(82, 16, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 122378.61, 1),
(83, 16, 'transporte', NULL, 'TRANSPORTE DE CONCRETO (1.01 M3 x 1 Km)', 'M3-KM', 1.0100, 3337.00, 1),
(84, 17, 'material', NULL, 'SELLO POLIURETANO', 'M', 1.0000, 9361.00, 1),
(85, 17, 'material', NULL, 'SELLADOR POLIURETANO ELASTICO 300 ML (+ 1% desperdicio)', 'UND', 0.3232, 69524.00, 1),
(86, 17, 'mano_obra', NULL, 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0563, 114730.00, 1),
(87, 17, 'equipo', NULL, 'HERRAMIENTA MENOR (7% de Mano de Obra)', 'GL', 0.0700, 6456.38, 1),
(88, 18, 'material', NULL, 'MORTERO 1:3', 'M3', 0.0080, 409265.00, 1),
(89, 18, 'mano_obra', NULL, 'M.O. HIDROSANIT. 2 AYUDANTES + 1 OFICIAL (Jornal 259,417 + 180% Prestaciones)', 'DIA', 0.6024, 466950.00, 1),
(90, 18, 'equipo', NULL, 'HERRAMIENTA MENOR (2% de Mano de Obra)', 'GL', 0.0200, 281295.18, 1),
(91, 19, 'mano_obra', NULL, 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0043, 114730.00, 1),
(92, 19, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 491.91, 1),
(93, 19, 'equipo', NULL, 'RETROEXCAVADORA CARGADORA JD-510', 'H', 0.0350, 150226.00, 1),
(94, 20, 'transporte', NULL, 'TRANSPORTE DE MATERIAL DE EXCAVACIÓN Y/O PETREOS (VOLQUETA 6 M3)', 'M3-KM', 1.3000, 2126.00, 1),
(95, 21, 'mano_obra', NULL, 'AUXILIAR OFICIOS VARIOS DIURNO (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.1250, 114730.00, 1),
(96, 22, 'mano_obra', NULL, 'AUXILIAR OFICIOS VARIOS NOCTURNO (Jornal 76,487 + 180% Prestaciones)', 'DIA', 0.1250, 137676.00, 1),
(97, 23, 'equipo', NULL, 'SENAL DE PARE - SIGA', 'DIA', 1.0000, 3323.00, 1),
(98, 24, 'material', NULL, 'LUBRICANTE TUB PVC 500GR (+ 3% desperdicio)', 'UND', 0.0309, 31595.00, 1),
(99, 24, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 1),
(100, 24, 'equipo', NULL, 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 4259.36, 1),
(101, 25, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0300, 31595.00, 1),
(102, 25, 'material', NULL, 'CODO PRS R13 45 X 3\"', 'UND', 1.0000, 110080.00, 1),
(103, 25, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 1),
(104, 25, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 4259.36, 1),
(105, 26, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0200, 31595.00, 1),
(106, 26, 'material', NULL, 'TUBO PRESION RDE-13.5 UM - 3\" (+ 1% desperdicio)', 'M', 1.0100, 74690.00, 1),
(107, 26, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0350, 340749.00, 1),
(108, 26, 'equipo', NULL, 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 11926.81, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_composicion`
--

CREATE TABLE `item_composicion` (
  `id_composicion` int(11) NOT NULL,
  `id_item_compuesto` int(11) NOT NULL COMMENT 'Item padre (compuesto)',
  `id_item_componente` int(11) NOT NULL COMMENT 'Item hijo (componente)',
  `cantidad` decimal(10,4) NOT NULL DEFAULT 1.0000 COMMENT 'Cantidad del componente por unidad del compuesto',
  `nivel` int(11) DEFAULT 1 COMMENT 'Nivel en la jerarquía',
  `observaciones` text DEFAULT NULL,
  `idusuario` int(11) NOT NULL,
  `fechareg` datetime DEFAULT current_timestamp(),
  `fechaupdate` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `idestado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `item_composicion`
--

INSERT INTO `item_composicion` (`id_composicion`, `id_item_compuesto`, `id_item_componente`, `cantidad`, `nivel`, `observaciones`, `idusuario`, `fechareg`, `fechaupdate`, `idestado`) VALUES
(1, 3, 1, 0.1250, 1, NULL, 1, '2025-11-16 00:49:29', '2025-11-16 00:49:29', 1),
(2, 3, 17, 12.0000, 1, NULL, 1, '2025-11-16 00:49:29', '2025-11-16 00:49:29', 1),
(3, 16, 1, 1.0100, 1, NULL, 1, '2025-11-16 00:49:29', '2025-11-16 00:49:29', 1),
(4, 16, 17, 1.8080, 1, NULL, 1, '2025-11-16 00:49:29', '2025-11-16 00:49:29', 1),
(5, 18, 1, 0.5000, 1, NULL, 1, '2025-11-16 00:49:29', '2025-11-16 00:49:29', 1),
(6, 18, 2, 0.1000, 1, NULL, 1, '2025-11-16 00:49:29', '2025-11-16 00:49:29', 1),
(7, 18, 9, 2.5000, 1, NULL, 1, '2025-11-16 00:49:29', '2025-11-16 00:49:29', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logsql`
--

CREATE TABLE `logsql` (
  `idlogsql` int(11) NOT NULL,
  `log` blob NOT NULL,
  `usuario` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `ip` varchar(20) NOT NULL,
  `sitio` varchar(200) NOT NULL,
  `pagina` varchar(200) NOT NULL,
  `referencia` varchar(200) NOT NULL,
  `navegador` varchar(200) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materiales`
--

CREATE TABLE `materiales` (
  `id_material` int(11) NOT NULL,
  `cod_material` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `nombremat` blob NOT NULL,
  `id_tipo_material` int(11) NOT NULL,
  `idunidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idusuario` int(11) NOT NULL,
  `matfchreg` date NOT NULL,
  `idestado` int(1) NOT NULL,
  `matfupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `materiales`
--

INSERT INTO `materiales` (`id_material`, `cod_material`, `nombremat`, `id_tipo_material`, `idunidad`, `idusuario`, `matfchreg`, `idestado`, `matfupdate`) VALUES
(1, '330301', 0x43494e5441205345475552494441442050524556454e5449564120413d38434d2d3235304d54532e, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(2, '330306', 0x42415252494341444120592044455356494f205449504f2053522d313032, 2, '2', 1, '2025-09-30', 1, '2025-09-30'),
(3, '330127', 0x434f525441444f524120444520504156494d454e544f20444520342041203720434d, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(4, '100424', 0x44454d4f4c4943494f4e20504156494d454e544f20434f4e435245544f20453d3230434d, 2, '4', 1, '2025-09-30', 1, '2025-09-30'),
(5, '100602', 0x45584341564143494f4e20454e20434f4e474c4f4d455241444f28204d414e55414c29, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(6, '110906', 0x434f4c43484f4e204152454e412047525545534120453d352d37434d, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(7, '165905', 0x494e53542e5455422e50564320554d203622, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(8, '165110-17P', 0x5445452050564320554d2033222078332220783322, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(9, '165304-18P', 0x5245445543432050564320554d20362220783322, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(10, '165008', 0x545542455249412050564320414c54412050524553494f4e203622205244452031332e3520554d, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(11, '100618', 0x52454c4c454e4f204d4154455249414c20534954494f20434f4d5041435441444f2d52414e41, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(12, '100620', 0x52454c4c454e4f20524f43414d554552544120434f4d504143542d53414c544152494e, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(13, '083303', 0x2242415345204752414e554c415220434c4153452042200d0a28416e616c697a6164612070617261207469706f204e54322c20646520677261646163696f6e2042472033382c20636c61736520422922, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(14, '085002', 0x22504156494d454e544f20444520434f4e435245544f2048494452c381554c49434f205052454d455a434c41444f2c204e4f20494e434c55594520414345524f204e4920424152524153204445205452414e53464552454e4349410d0a28414e414c495a41444f205041524120554e205452c3814e5349544f204e5432292022, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(15, '321003', 0x53454c4c41444f5220454c41535449434f20284a554e544120312058203120434d29, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(16, '020430-15P', 0x454d50414c4d4520545542202033222d36222043414d41524120434f4e435245544f, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(17, '010209', 0x434152475545204d41542e2045584341562e2041204d415155494e41202853494e205452414e535029, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(18, '089003', 0x225452414e53504f525445204445204d4154455249414c45532050524f56454e49454e544553204445204c41204558434156414349c3934e204445204c41204558504c414e414349c3934e2c2043414e414c45532059205052c3895354414d4f5320504152412044495354414e43494153204d41594f524553204445204d494c204d4554524f532028312e303030206d29204d454449444f53204120504152544952204445204349454e204d4554524f532028313030206d290d0a28416e616c697a61646f207061726120766f6c71756574612064652036206d332922, 2, '6', 1, '2025-09-30', 1, '2025-09-30'),
(19, '330301-20', 0x43494e5441205345475552494441442050524556454e5449564120413d38434d2d3235304d54532e, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(20, '330306-21', 0x42415252494341444120592044455356494f205449504f2053522d313032, 2, '2', 1, '2025-09-30', 1, '2025-09-30'),
(21, '330311', 0x50414c455445524f20444955524e4f, 2, '7', 1, '2025-09-30', 1, '2025-09-30'),
(22, '330312', 0x50414c455445524f204e4f435455524e4f, 2, '7', 1, '2025-09-30', 1, '2025-09-30'),
(23, '330309', 0x53454e414c20444520504152452d5349474120504152412050414c455445524f, 2, '2', 1, '2025-09-30', 1, '2025-09-30'),
(24, '330127-1', 0x434f525441444f524120444520504156494d454e544f20444520342041203720434d, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(25, '100424-2', 0x44454d4f4c4943494f4e20504156494d454e544f20434f4e435245544f20453d3230434d, 2, '4', 1, '2025-09-30', 1, '2025-09-30'),
(26, '100602-3', 0x45584341564143494f4e20454e20434f4e474c4f4d455241444f28204d414e55414c29, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(27, '110906-4', 0x434f4c43484f4e204152454e412047525545534120453d352d37434d, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(28, '165903', 0x494e53542e5455422e50564320554d203322, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(29, '165110-19', 0x5445452050564320554d2033222078332220783322, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(30, '165718', 0x434f444f2050564320554d2033222078203435205244452d31332e35, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(31, '165004', 0x545542455249412050564320414c54412050524553494f4e203322205244452031332e3520554d, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(32, '100618-7', 0x52454c4c454e4f204d4154455249414c20534954494f20434f4d5041435441444f2d52414e41, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(33, '100620-8', 0x52454c4c454e4f20524f43414d554552544120434f4d504143542d53414c544152494e, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(34, '083303-9', 0x2242415345204752414e554c415220434c4153452042200d0a28416e616c697a6164612070617261207469706f204e54322c20646520677261646163696f6e2042472033382c20636c61736520422922, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(35, '085002-10', 0x22504156494d454e544f20444520434f4e435245544f2048494452c381554c49434f205052454d455a434c41444f2c204e4f20494e434c55594520414345524f204e4920424152524153204445205452414e53464552454e4349410d0a28414e414c495a41444f205041524120554e205452c3814e5349544f204e5432292022, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(36, '321003-11', 0x53454c4c41444f5220454c41535449434f20284a554e544120312058203120434d29, 2, '3', 1, '2025-09-30', 1, '2025-09-30'),
(37, '020430-12-16P', 0x454d50414c4d4520545542202033222d36222043414d41524120434f4e435245544f, 2, '1', 1, '2025-09-30', 1, '2025-09-30'),
(38, '010209-13', 0x434152475545204d41542e2045584341562e2041204d415155494e41202853494e205452414e535029, 2, '5', 1, '2025-09-30', 1, '2025-09-30'),
(39, '089003-14', 0x225452414e53504f525445204445204d4154455249414c45532050524f56454e49454e544553204445204c41204558434156414349c3934e204445204c41204558504c414e414349c3934e2c2043414e414c45532059205052c3895354414d4f5320504152412044495354414e43494153204d41594f524553204445204d494c204d4554524f532028312e303030206d29204d454449444f53204120504152544952204445204349454e204d4554524f532028313030206d290d0a28416e616c697a61646f207061726120766f6c71756574612064652036206d332922, 2, '6', 1, '2025-09-30', 1, '2025-09-30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `material_precio`
--

CREATE TABLE `material_precio` (
  `id_mat_precio` int(11) NOT NULL,
  `id_material` int(11) NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `fecha` date NOT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `idusuario` int(3) NOT NULL,
  `fechareg` date NOT NULL,
  `fechaupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `material_precio`
--

INSERT INTO `material_precio` (`id_mat_precio`, `id_material`, `valor`, `fecha`, `estado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 152708.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(2, 2, 16688.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(3, 3, 7356.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(4, 4, 28049.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(5, 5, 37745.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(6, 6, 67053.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(7, 7, 8605.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(8, 8, 192358.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(9, 9, 359526.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(10, 10, 214007.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(11, 11, 34114.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(12, 12, 80077.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(13, 13, 125168.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(14, 14, 920116.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(15, 15, 38739.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(16, 16, 290195.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(17, 17, 5774.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(18, 18, 2764.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(19, 19, 152708.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(20, 20, 16688.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(21, 21, 14341.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(22, 22, 17210.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(23, 23, 3323.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(24, 24, 7356.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(25, 25, 28049.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(26, 26, 37745.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(27, 27, 67053.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(28, 28, 5406.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(29, 29, 192358.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(30, 30, 115500.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(31, 31, 88473.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(32, 32, 34114.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(33, 33, 80077.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(34, 34, 125168.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(35, 35, 920116.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(36, 36, 38739.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(37, 37, 182330.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(38, 38, 5774.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(39, 39, 2764.00, '2025-09-30', 1, 1, '2025-09-30', '2025-09-30'),
(40, 17, 6700.00, '2025-10-14', 1, 1, '2025-10-14', '2025-10-14'),
(41, 4, 30000.00, '2025-10-15', 1, 1, '2025-10-14', '2025-10-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mes`
--

CREATE TABLE `mes` (
  `idmes` int(11) NOT NULL,
  `mes` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;

--
-- Volcado de datos para la tabla `mes`
--

INSERT INTO `mes` (`idmes`, `mes`) VALUES
(1, 'Enero'),
(2, 'Febrero'),
(3, 'Marzo'),
(4, 'Abril'),
(5, 'Mayo'),
(6, 'Junio'),
(7, 'Julio'),
(8, 'Agosto'),
(9, 'Septiembre'),
(10, 'Octubre'),
(11, 'Noviembre'),
(12, 'Diciembre');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagina`
--

CREATE TABLE `pagina` (
  `Idpagina` int(11) NOT NULL,
  `url` varchar(50) DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paginaperfil`
--

CREATE TABLE `paginaperfil` (
  `Id` int(11) NOT NULL,
  `idpagina` int(11) NOT NULL DEFAULT 0,
  `perfil` int(11) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `paginaperfil`
--

INSERT INTO `paginaperfil` (`Id`, `idpagina`, `perfil`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 4, 1),
(5, 5, 1),
(6, 6, 1),
(7, 7, 1),
(8, 8, 1),
(9, 9, 1),
(10, 10, 1),
(11, 11, 1),
(12, 12, 1),
(13, 13, 1),
(14, 14, 1),
(15, 15, 1),
(16, 16, 1),
(17, 17, 1),
(18, 18, 1),
(19, 19, 1),
(20, 20, 1),
(21, 21, 1),
(22, 22, 1),
(23, 23, 1),
(24, 24, 1),
(25, 25, 1),
(26, 26, 1),
(27, 27, 1),
(28, 28, 1),
(29, 29, 1),
(30, 30, 1),
(31, 31, 1),
(32, 32, 1),
(33, 33, 1),
(34, 34, 1),
(35, 35, 1),
(36, 36, 1),
(37, 37, 1),
(38, 38, 1),
(39, 39, 1),
(40, 40, 1),
(41, 41, 1),
(42, 42, 1),
(43, 43, 1),
(44, 1, 2),
(45, 2, 2),
(46, 3, 2),
(48, 5, 2),
(49, 6, 2),
(50, 7, 2),
(51, 8, 2),
(52, 9, 2),
(53, 10, 2),
(54, 11, 2),
(55, 12, 2),
(56, 18, 2),
(57, 13, 2),
(58, 20, 2),
(59, 21, 2),
(60, 22, 2),
(61, 23, 2),
(62, 24, 2),
(63, 25, 2),
(76, 1, 4),
(77, 2, 4),
(78, 3, 4),
(79, 4, 4),
(80, 5, 4),
(81, 6, 4),
(82, 7, 4),
(83, 8, 4),
(84, 9, 4),
(85, 10, 4),
(86, 11, 4),
(87, 12, 4),
(88, 13, 4),
(89, 14, 4),
(90, 15, 4),
(91, 16, 4),
(92, 17, 4),
(93, 18, 4),
(94, 19, 4),
(95, 20, 4),
(96, 21, 4),
(97, 22, 4),
(98, 23, 4),
(99, 24, 4),
(100, 25, 4),
(101, 26, 4),
(102, 27, 4),
(103, 28, 4),
(104, 29, 4),
(105, 30, 4),
(106, 31, 4),
(107, 32, 4),
(108, 33, 4),
(109, 34, 4),
(110, 35, 4),
(111, 36, 4),
(112, 37, 4),
(113, 38, 4),
(114, 39, 4),
(115, 40, 4),
(116, 41, 4),
(117, 42, 4),
(118, 43, 4),
(128, 1, 3),
(129, 2, 3),
(130, 3, 3),
(131, 4, 3),
(132, 5, 3),
(133, 6, 3),
(134, 7, 3),
(135, 8, 3),
(136, 9, 3),
(137, 10, 3),
(138, 11, 3),
(139, 12, 3),
(140, 13, 3),
(141, 14, 3),
(144, 17, 3),
(145, 18, 3),
(146, 19, 3),
(147, 20, 3),
(148, 21, 3),
(149, 22, 3),
(150, 23, 3),
(151, 24, 3),
(152, 25, 3),
(153, 26, 3),
(154, 27, 3),
(155, 28, 3),
(156, 29, 3),
(157, 30, 3),
(158, 31, 3),
(163, 36, 3),
(164, 37, 3),
(165, 38, 3),
(166, 32, 3),
(167, 19, 2),
(168, 39, 3),
(169, 40, 3),
(170, 14, 2),
(171, 105, 1),
(172, 105, 4),
(173, 44, 1),
(174, 45, 1),
(175, 46, 1),
(176, 47, 1),
(177, 48, 1),
(178, 49, 1),
(179, 50, 1),
(180, 51, 1),
(181, 52, 1),
(182, 53, 1),
(183, 54, 1),
(184, 55, 1),
(185, 56, 1),
(186, 57, 1),
(187, 58, 1),
(188, 59, 1),
(189, 60, 1),
(190, 61, 1),
(191, 62, 1),
(192, 63, 1),
(193, 64, 1),
(194, 65, 1),
(195, 66, 1),
(196, 67, 1),
(197, 68, 1),
(198, 69, 1),
(199, 70, 1),
(200, 71, 1),
(201, 72, 1),
(202, 73, 1),
(203, 74, 1),
(204, 75, 1),
(205, 76, 1),
(206, 77, 1),
(207, 78, 1),
(208, 79, 1),
(209, 80, 1),
(210, 81, 1),
(211, 82, 1),
(212, 83, 1),
(213, 84, 1),
(214, 85, 1),
(215, 86, 1),
(216, 87, 1),
(217, 88, 1),
(218, 89, 1),
(219, 90, 1),
(220, 91, 1),
(221, 92, 1),
(222, 93, 1),
(223, 94, 1),
(224, 95, 1),
(225, 96, 1),
(226, 97, 1),
(227, 98, 1),
(228, 99, 1),
(229, 100, 1),
(230, 101, 1),
(231, 102, 1),
(232, 103, 1),
(233, 105, 1),
(234, 105, 2),
(235, 105, 3),
(236, 105, 3),
(237, 41, 3),
(238, 42, 3),
(239, 43, 3),
(240, 33, 3),
(241, 34, 3),
(242, 35, 3),
(243, 15, 3),
(244, 16, 3),
(245, 4, 2),
(246, 75, 2),
(247, 75, 3),
(248, 75, 4),
(249, 107, 2),
(250, 107, 3),
(251, 107, 4),
(252, 45, 3),
(253, 45, 2),
(254, 45, 4),
(255, 108, 1),
(256, 107, 1),
(257, 109, 1),
(258, 115, 1),
(259, 113, 1),
(260, 114, 1),
(261, 114, 2),
(262, 114, 3),
(263, 114, 4),
(264, 113, 3),
(265, 113, 2),
(266, 113, 4),
(267, 84, 4),
(268, 116, 1),
(269, 116, 4),
(270, 166, 1),
(271, 166, 4),
(272, 44, 4),
(273, 47, 4),
(274, 72, 4),
(275, 47, 4),
(276, 200, 1),
(277, 200, 2),
(278, 200, 3),
(279, 200, 4),
(280, 201, 1),
(281, 201, 2),
(282, 201, 3),
(283, 201, 4),
(284, 205, 1),
(285, 205, 4),
(286, 204, 1),
(287, 204, 4),
(288, 204, 3),
(289, 204, 2),
(290, 205, 3),
(291, 205, 2),
(292, 202, 1),
(293, 202, 2),
(294, 203, 2),
(295, 203, 3),
(296, 203, 4),
(297, 202, 3),
(298, 202, 4),
(299, 203, 1),
(300, 76, 4),
(301, 117, 1),
(302, 118, 1),
(304, 120, 1),
(303, 119, 1),
(305, 121, 1),
(306, 122, 1),
(307, 123, 1),
(308, 124, 1),
(309, 125, 1),
(310, 126, 1),
(311, 127, 1),
(312, 128, 1),
(313, 129, 1),
(314, 130, 1),
(315, 131, 1),
(316, 132, 1),
(317, 133, 1),
(318, 134, 1),
(319, 135, 1),
(320, 136, 1),
(321, 137, 1),
(322, 138, 1),
(323, 139, 1),
(324, 140, 1),
(325, 117, 2),
(326, 125, 2),
(327, 126, 2),
(328, 61, 2),
(329, 62, 3),
(330, 139, 2),
(331, 201, 2),
(332, 1, 5),
(333, 2, 5),
(334, 3, 5),
(335, 4, 5),
(336, 5, 5),
(337, 6, 5),
(338, 7, 5),
(339, 8, 5),
(340, 9, 5),
(341, 10, 5),
(342, 11, 5),
(343, 12, 5),
(344, 13, 5),
(345, 14, 5),
(346, 15, 5),
(347, 16, 5),
(348, 17, 5),
(349, 18, 5),
(350, 19, 5),
(351, 20, 5),
(352, 21, 5),
(353, 22, 5),
(354, 23, 5),
(355, 24, 5),
(356, 25, 5),
(357, 26, 5),
(358, 27, 5),
(359, 28, 5),
(360, 29, 5),
(361, 30, 5),
(362, 31, 5),
(363, 32, 5),
(364, 33, 5),
(365, 34, 5),
(366, 35, 5),
(367, 36, 5),
(368, 37, 5),
(369, 38, 5),
(370, 39, 5),
(371, 40, 5),
(372, 41, 5),
(373, 42, 5),
(374, 43, 5),
(375, 105, 5),
(376, 75, 5),
(377, 107, 5),
(378, 45, 5),
(379, 114, 5),
(380, 113, 5),
(381, 84, 5),
(382, 116, 5),
(383, 166, 5),
(384, 44, 5),
(385, 47, 5),
(386, 72, 5),
(387, 47, 5),
(388, 200, 5),
(389, 201, 5),
(390, 205, 5),
(391, 204, 5),
(392, 203, 5),
(393, 202, 5),
(394, 76, 5),
(395, 17, 2),
(396, 17, 2),
(397, 1, 6),
(398, 2, 6),
(399, 3, 6),
(400, 4, 6),
(401, 5, 6),
(402, 6, 6),
(403, 7, 6),
(404, 8, 6),
(405, 9, 6),
(406, 10, 6),
(407, 11, 6),
(408, 12, 6),
(409, 13, 6),
(410, 14, 6),
(411, 15, 6),
(412, 16, 6),
(413, 17, 6),
(414, 18, 6),
(415, 19, 6),
(416, 20, 6),
(417, 21, 6),
(418, 22, 6),
(419, 23, 6),
(420, 24, 6),
(421, 25, 6),
(422, 26, 6),
(423, 27, 6),
(424, 28, 6),
(425, 29, 6),
(426, 30, 6),
(427, 31, 6),
(428, 32, 6),
(429, 33, 6),
(430, 34, 6),
(431, 35, 6),
(432, 36, 6),
(433, 37, 6),
(434, 38, 6),
(435, 39, 6),
(436, 40, 6),
(437, 41, 6),
(438, 42, 6),
(439, 43, 6),
(440, 105, 6),
(441, 75, 6),
(442, 107, 6),
(443, 45, 6),
(444, 114, 6),
(445, 113, 6),
(446, 84, 6),
(447, 116, 6),
(448, 166, 6),
(449, 44, 6),
(450, 47, 6),
(451, 72, 6),
(452, 47, 6),
(453, 200, 6),
(454, 201, 6),
(455, 205, 6),
(456, 204, 6),
(457, 203, 6),
(458, 202, 6),
(459, 76, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL COMMENT 'ID único del pedido',
  `id_presupuesto` int(11) NOT NULL COMMENT 'Referencia al presupuesto',
  `fecha_pedido` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora del pedido',
  `estado` varchar(50) NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del pedido: pendiente, aprobado, rechazado, entregado',
  `total` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto total del pedido',
  `observaciones` text DEFAULT NULL COMMENT 'Observaciones adicionales del pedido',
  `idusuario` int(4) NOT NULL COMMENT 'Usuario que creó el pedido',
  `fechareg` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de registro',
  `fechaupdate` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Fecha de última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Pedidos de materiales';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos_detalle`
--

CREATE TABLE `pedidos_detalle` (
  `id_det_pedido` int(11) NOT NULL COMMENT 'ID único del detalle',
  `id_pedido` int(11) NOT NULL COMMENT 'Referencia al pedido',
  `id_componente` int(11) DEFAULT NULL,
  `tipo_componente` enum('material','mano_obra','equipo','transporte','otro') NOT NULL,
  `id_item` int(11) DEFAULT NULL,
  `cantidad` decimal(12,2) NOT NULL COMMENT 'Cantidad solicitada',
  `precio_unitario` decimal(12,2) NOT NULL COMMENT 'Precio unitario al momento del pedido',
  `subtotal` decimal(14,2) NOT NULL COMMENT 'Subtotal (cantidad * precio_unitario)',
  `fechareg` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de registro'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Detalle de pedidos';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perfiles`
--

CREATE TABLE `perfiles` (
  `codigo_perfil` varchar(50) NOT NULL DEFAULT '',
  `descripcion_perfil` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `perfiles`
--

INSERT INTO `perfiles` (`codigo_perfil`, `descripcion_perfil`) VALUES
('1', 'Administrador'),
('2', 'Gestor Presupuesto'),
('3', 'Usuario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perfilprov`
--

CREATE TABLE `perfilprov` (
  `idperfilprov` int(11) NOT NULL,
  `perfilprov` varchar(50) NOT NULL,
  `estado` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisoperfil`
--

CREATE TABLE `permisoperfil` (
  `idpermisoperfil` int(11) NOT NULL,
  `idpemisoperfil` int(11) NOT NULL,
  `idusuario` int(11) NOT NULL,
  `estado` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `permisoperfil`
--

INSERT INTO `permisoperfil` (`idpermisoperfil`, `idpemisoperfil`, `idusuario`, `estado`) VALUES
(1, 1, 1, 1),
(3, 13, 2, 0),
(4, 13, 14, 0),
(5, 13, 18, 0),
(6, 15, 27, 0),
(7, 15, 26, 0),
(8, 15, 6, 0),
(9, 9, 59, 1),
(10, 13, 17, 0),
(11, 12, 6, 1),
(12, 15, 64, 1),
(13, 12, 65, 1),
(14, 10, 70, 1),
(15, 12, 62, 1),
(16, 12, 75, 1),
(17, 15, 75, 0),
(18, 16, 91, 1),
(19, 2, 91, 1),
(20, 2, 87, 1),
(21, 10, 87, 1),
(22, 16, 87, 1),
(23, 17, 1, 1),
(24, 17, 62, 1),
(25, 18, 1, 1),
(26, 18, 27, 0),
(27, 18, 174, 0),
(28, 18, 26, 0),
(29, 18, 6, 0),
(30, 2, 1, 1),
(31, 2, 3, 1),
(32, 10, 3, 1),
(33, 16, 3, 1),
(34, 18, 196, 0),
(35, 18, 222, 0),
(36, 18, 223, 1),
(37, 14, 17, 1),
(38, 2, 216, 1),
(39, 18, 234, 1),
(40, 18, 230, 1),
(41, 16, 216, 1),
(42, 18, 241, 1),
(45, 16, 249, 1),
(46, 2, 249, 1),
(47, 2, 252, 1),
(48, 16, 252, 1),
(49, 9, 49, 1),
(50, 18, 85, 1),
(51, 16, 267, 1),
(52, 2, 269, 1),
(53, 19, 1, 1),
(54, 19, 230, 1),
(55, 15, 176, 1),
(56, 20, 200, 1),
(57, 16, 295, 1),
(58, 2, 295, 1),
(59, 20, 274, 1),
(60, 20, 49, 1),
(61, 21, 8, 1),
(62, 21, 128, 1),
(63, 16, 85, 1),
(64, 21, 28, 1),
(65, 21, 79, 1),
(66, 21, 1, 1),
(67, 13, 296, 0),
(68, 14, 296, 1),
(69, 21, 85, 1),
(70, 21, 292, 1),
(71, 2, 304, 1),
(72, 16, 304, 1),
(73, 23, 85, 1),
(74, 9, 53, 1),
(75, 13, 313, 1),
(76, 20, 85, 1),
(77, 15, 230, 1),
(78, 15, 223, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presupuestos`
--

CREATE TABLE `presupuestos` (
  `id_presupuesto` int(11) NOT NULL,
  `id_proyecto` int(11) NOT NULL,
  `fecha_creacion` date NOT NULL,
  `monto_total` decimal(14,2) DEFAULT 0.00,
  `porcentaje_administracion` decimal(5,2) DEFAULT 21.00 COMMENT 'Porcentaje de administración para este presupuesto',
  `porcentaje_imprevistos` decimal(5,2) DEFAULT 1.00 COMMENT 'Porcentaje de imprevistos para este presupuesto',
  `porcentaje_utilidad` decimal(5,2) DEFAULT 8.00 COMMENT 'Porcentaje de utilidad para este presupuesto',
  `porcentaje_iva` decimal(5,2) DEFAULT 19.00 COMMENT 'Porcentaje de IVA (se aplica solo sobre utilidad)',
  `observaciones` blob NOT NULL,
  `idusuario` int(4) NOT NULL,
  `fchreg` date NOT NULL,
  `idestado` int(1) NOT NULL,
  `fupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `presupuestos`
--

INSERT INTO `presupuestos` (`id_presupuesto`, `id_proyecto`, `fecha_creacion`, `monto_total`, `porcentaje_administracion`, `porcentaje_imprevistos`, `porcentaje_utilidad`, `porcentaje_iva`, `observaciones`, `idusuario`, `fchreg`, `idestado`, `fupdate`) VALUES
(1, 2, '2025-10-01', 125458523.00, 21.00, 1.00, 8.00, 19.00, 0x657374657320657320756e20707265737570756573746f20696e696369616c, 1, '2025-10-13', 1, '2025-10-13'),
(2, 1, '2025-10-15', 200000000.00, 21.00, 1.00, 8.00, 19.00, 0x507275656261, 1, '2025-10-14', 1, '2025-10-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proyectos`
--

CREATE TABLE `proyectos` (
  `id_proyecto` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `objeto` text DEFAULT NULL,
  `numero_contrato` varchar(100) DEFAULT NULL,
  `valor` decimal(14,2) DEFAULT 0.00,
  `id_cliente` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `proyectos`
--

INSERT INTO `proyectos` (`id_proyecto`, `nombre`, `objeto`, `numero_contrato`, `valor`, `id_cliente`, `fecha_inicio`, `fecha_fin`, `estado`, `observaciones`) VALUES
(1, 'proyecto de prueba', NULL, NULL, 0.00, 1, '2025-10-01', '2025-12-31', 1, 'prueba\n'),
(2, 'Proyecto 2', NULL, NULL, 0.00, 3, '2025-01-01', '2025-12-31', 1, 'Este es el proyecto');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `resp_proyecto`
--

CREATE TABLE `resp_proyecto` (
  `id_resp_proyecto` int(11) NOT NULL,
  `id_proyecto` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `idtiporesp` int(3) NOT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `idusuario` int(3) NOT NULL,
  `fechareg` date NOT NULL,
  `fechaupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `resp_proyecto`
--

INSERT INTO `resp_proyecto` (`id_resp_proyecto`, `id_proyecto`, `id_usuario`, `idtiporesp`, `estado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 2, 1, 1, 1, '2025-10-13', '2025-10-13'),
(2, 2, 2, 1, 1, 1, '2025-10-14', '2025-10-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `soporteproy`
--

CREATE TABLE `soporteproy` (
  `idsoporteproy` int(6) NOT NULL,
  `id_proyecto` int(6) NOT NULL,
  `idtiposopproy` int(3) NOT NULL,
  `observacion` blob NOT NULL,
  `idusuario` int(6) NOT NULL,
  `archivo` blob NOT NULL,
  `fechareg` date NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `soporteproy`
--

INSERT INTO `soporteproy` (`idsoporteproy`, `id_proyecto`, `idtiposopproy`, `observacion`, `idusuario`, `archivo`, `fechareg`, `id_estado`) VALUES
(1, 2, 10, 0x646664666466, 1, 0x363865653739663361653865315f616d617a6f6e2e6a7067, '2025-10-14', 1),
(2, 1, 2, 0x4163746120646520696e6963696f2064656c2070726f796563746f, 1, 0x363865656165626134656163355f3133333536383933383339383636333639392e6a7067, '2025-10-14', 1),
(3, 2, 7, 0x666764676466676467, 1, '', '2025-10-30', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tiposopproy`
--

CREATE TABLE `tiposopproy` (
  `idtiposopproy` int(3) NOT NULL,
  `desctiposoport` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `tiposopproy`
--

INSERT INTO `tiposopproy` (`idtiposopproy`, `desctiposoport`, `id_estado`) VALUES
(1, 'Contrato', 1),
(2, 'Acta de Inicio', 1),
(3, 'Pólizas', 1),
(4, 'Acta de Suspensión', 1),
(5, 'Acta de Reinicio', 1),
(6, 'Prórrogas - Otrosí (Tiempo)', 1),
(7, 'Adición - Otrosí (Valor)', 1),
(8, 'Adición y Prórrogas - Otrosí (Valor y Tiempo)', 1),
(9, 'Informes Mensuales', 1),
(10, 'Acta de Cobro', 1),
(11, 'Balance de Obra', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_material`
--

CREATE TABLE `tipo_material` (
  `id_tipo_material` int(11) NOT NULL,
  `desc_tipo` varchar(150) NOT NULL,
  `estado` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `tipo_material`
--

INSERT INTO `tipo_material` (`id_tipo_material`, `desc_tipo`, `estado`) VALUES
(1, 'Mano de Obra', 1),
(2, 'Materiales', 1),
(3, 'Equipo', 1),
(4, 'Otros', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_respo`
--

CREATE TABLE `tipo_respo` (
  `idtiporesp` int(3) NOT NULL,
  `desctiporesp` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `tipo_respo`
--

INSERT INTO `tipo_respo` (`idtiporesp`, `desctiporesp`, `id_estado`) VALUES
(1, 'Cargue de Presupuesto', 1),
(2, 'Modificar Presupuesto', 1),
(3, 'Consultar Presupuesto', 1);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_componentes_presupuesto_corregido`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_componentes_presupuesto_corregido` (
`id_componente` int(11)
,`nombre_componente` text
,`tipo_componente` enum('material','mano_obra','equipo','transporte','otro')
,`unidad_componente` varchar(20)
,`precio_unitario` decimal(14,2)
,`id_presupuesto` int(11)
,`id_proyecto` int(11)
,`id_capitulo` int(11)
,`nombre_cap` varchar(200)
,`cantidad_por_unidad` decimal(10,4)
,`cantidad_item_presupuesto` decimal(12,2)
,`total_necesario_corregido` decimal(21,4)
,`id_item` int(11)
,`codigo_item` varchar(50)
,`nombre_item` text
,`unidad_item` varchar(20)
,`relacion_unidades` varchar(54)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_resumen_componentes_pedido`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_resumen_componentes_pedido` (
`id_componente` int(11)
,`nombre_componente` text
,`tipo_componente` enum('material','mano_obra','equipo','transporte','otro')
,`unidad_componente` varchar(20)
,`precio_unitario` decimal(14,2)
,`id_presupuesto` int(11)
,`total_necesario` decimal(43,4)
,`ya_pedido` decimal(5,4)
,`disponible` decimal(43,4)
,`capitulos` mediumtext
,`cantidad_items` bigint(21)
,`cantidad_capitulos` bigint(21)
,`detalle_serializado` mediumtext
);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `capitulos`
--
ALTER TABLE `capitulos`
  ADD PRIMARY KEY (`id_capitulo`),
  ADD KEY `fk_cap_presupuesto` (`id_presupuesto`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `nit` (`nit`);

--
-- Indices de la tabla `costos_ind`
--
ALTER TABLE `costos_ind`
  ADD PRIMARY KEY (`idcostosind`);

--
-- Indices de la tabla `det_presupuesto`
--
ALTER TABLE `det_presupuesto`
  ADD PRIMARY KEY (`id_det_presupuesto`),
  ADD KEY `fk_det_presupuesto` (`id_presupuesto`),
  ADD KEY `fk_det_material` (`id_material`),
  ADD KEY `fk_det_capitulo` (`id_capitulo`),
  ADD KEY `fk_det_mat_precio` (`id_mat_precio`),
  ADD KEY `idx_item` (`id_item`);

--
-- Indices de la tabla `estado_pedido`
--
ALTER TABLE `estado_pedido`
  ADD PRIMARY KEY (`id_estado_pedido`);

--
-- Indices de la tabla `gr_auth_reset_password`
--
ALTER TABLE `gr_auth_reset_password`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `gr_paginaperfil`
--
ALTER TABLE `gr_paginaperfil`
  ADD PRIMARY KEY (`Id`);

--
-- Indices de la tabla `gr_tipodoc`
--
ALTER TABLE `gr_tipodoc`
  ADD PRIMARY KEY (`idtipodoc`);

--
-- Indices de la tabla `gr_unidad`
--
ALTER TABLE `gr_unidad`
  ADD PRIMARY KEY (`idunidad`);

--
-- Indices de la tabla `gr_usuarios`
--
ALTER TABLE `gr_usuarios`
  ADD PRIMARY KEY (`u_id`);

--
-- Indices de la tabla `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id_item`),
  ADD UNIQUE KEY `codigo_item` (`codigo_item`),
  ADD KEY `idx_estado` (`idestado`),
  ADD KEY `idx_item_padre` (`id_item_padre`);

--
-- Indices de la tabla `item_componentes`
--
ALTER TABLE `item_componentes`
  ADD PRIMARY KEY (`id_componente`),
  ADD KEY `idx_item` (`id_item`),
  ADD KEY `idx_material` (`id_material`),
  ADD KEY `idx_tipo` (`tipo_componente`);

--
-- Indices de la tabla `item_composicion`
--
ALTER TABLE `item_composicion`
  ADD PRIMARY KEY (`id_composicion`),
  ADD UNIQUE KEY `uk_composicion` (`id_item_compuesto`,`id_item_componente`),
  ADD KEY `idx_compuesto` (`id_item_compuesto`),
  ADD KEY `idx_componente` (`id_item_componente`);

--
-- Indices de la tabla `materiales`
--
ALTER TABLE `materiales`
  ADD PRIMARY KEY (`id_material`),
  ADD KEY `fk_material_tipo` (`id_tipo_material`);

--
-- Indices de la tabla `material_precio`
--
ALTER TABLE `material_precio`
  ADD PRIMARY KEY (`id_mat_precio`),
  ADD KEY `fk_mat_precio_material` (`id_material`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `idx_pedido_presupuesto` (`id_presupuesto`),
  ADD KEY `idx_pedido_estado` (`estado`),
  ADD KEY `idx_pedido_fecha` (`fecha_pedido`),
  ADD KEY `idx_pedido_usuario` (`idusuario`);

--
-- Indices de la tabla `pedidos_detalle`
--
ALTER TABLE `pedidos_detalle`
  ADD PRIMARY KEY (`id_det_pedido`),
  ADD KEY `idx_detpedido_pedido` (`id_pedido`),
  ADD KEY `idx_detpedido_componente` (`id_componente`),
  ADD KEY `idx_detpedido_item` (`id_item`);

--
-- Indices de la tabla `perfiles`
--
ALTER TABLE `perfiles`
  ADD PRIMARY KEY (`codigo_perfil`);

--
-- Indices de la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD PRIMARY KEY (`id_presupuesto`),
  ADD KEY `fk_presup_proyecto` (`id_proyecto`),
  ADD KEY `idx_presupuesto_estado` (`idestado`),
  ADD KEY `idx_presupuesto_proyecto` (`id_proyecto`);

--
-- Indices de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD PRIMARY KEY (`id_proyecto`),
  ADD KEY `fk_proyecto_cliente` (`id_cliente`);

--
-- Indices de la tabla `resp_proyecto`
--
ALTER TABLE `resp_proyecto`
  ADD PRIMARY KEY (`id_resp_proyecto`),
  ADD KEY `fk_resp_proyecto` (`id_proyecto`);

--
-- Indices de la tabla `soporteproy`
--
ALTER TABLE `soporteproy`
  ADD PRIMARY KEY (`idsoporteproy`);

--
-- Indices de la tabla `tiposopproy`
--
ALTER TABLE `tiposopproy`
  ADD PRIMARY KEY (`idtiposopproy`);

--
-- Indices de la tabla `tipo_material`
--
ALTER TABLE `tipo_material`
  ADD PRIMARY KEY (`id_tipo_material`);

--
-- Indices de la tabla `tipo_respo`
--
ALTER TABLE `tipo_respo`
  ADD PRIMARY KEY (`idtiporesp`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `capitulos`
--
ALTER TABLE `capitulos`
  MODIFY `id_capitulo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `costos_ind`
--
ALTER TABLE `costos_ind`
  MODIFY `idcostosind` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `det_presupuesto`
--
ALTER TABLE `det_presupuesto`
  MODIFY `id_det_presupuesto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT de la tabla `estado_pedido`
--
ALTER TABLE `estado_pedido`
  MODIFY `id_estado_pedido` int(3) NOT NULL AUTO_INCREMENT COMMENT 'ID del estado', AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `gr_auth_reset_password`
--
ALTER TABLE `gr_auth_reset_password`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `gr_paginaperfil`
--
ALTER TABLE `gr_paginaperfil`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `gr_tipodoc`
--
ALTER TABLE `gr_tipodoc`
  MODIFY `idtipodoc` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `gr_unidad`
--
ALTER TABLE `gr_unidad`
  MODIFY `idunidad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `gr_usuarios`
--
ALTER TABLE `gr_usuarios`
  MODIFY `u_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `items`
--
ALTER TABLE `items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `item_componentes`
--
ALTER TABLE `item_componentes`
  MODIFY `id_componente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT de la tabla `item_composicion`
--
ALTER TABLE `item_composicion`
  MODIFY `id_composicion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `materiales`
--
ALTER TABLE `materiales`
  MODIFY `id_material` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT de la tabla `material_precio`
--
ALTER TABLE `material_precio`
  MODIFY `id_mat_precio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único del pedido';

--
-- AUTO_INCREMENT de la tabla `pedidos_detalle`
--
ALTER TABLE `pedidos_detalle`
  MODIFY `id_det_pedido` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único del detalle';

--
-- AUTO_INCREMENT de la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  MODIFY `id_presupuesto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  MODIFY `id_proyecto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `resp_proyecto`
--
ALTER TABLE `resp_proyecto`
  MODIFY `id_resp_proyecto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `soporteproy`
--
ALTER TABLE `soporteproy`
  MODIFY `idsoporteproy` int(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tiposopproy`
--
ALTER TABLE `tiposopproy`
  MODIFY `idtiposopproy` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `tipo_material`
--
ALTER TABLE `tipo_material`
  MODIFY `id_tipo_material` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tipo_respo`
--
ALTER TABLE `tipo_respo`
  MODIFY `idtiporesp` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_componentes_presupuesto_corregido`
--
DROP TABLE IF EXISTS `vw_componentes_presupuesto_corregido`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_ge9o9oes3e`@`localhost` SQL SECURITY DEFINER VIEW `vw_componentes_presupuesto_corregido`  AS SELECT `ic`.`id_componente` AS `id_componente`, `ic`.`descripcion` AS `nombre_componente`, `ic`.`tipo_componente` AS `tipo_componente`, `ic`.`unidad` AS `unidad_componente`, `ic`.`precio_unitario` AS `precio_unitario`, `p`.`id_presupuesto` AS `id_presupuesto`, `p`.`id_proyecto` AS `id_proyecto`, `c`.`id_capitulo` AS `id_capitulo`, `c`.`nombre_cap` AS `nombre_cap`, `ic`.`cantidad` AS `cantidad_por_unidad`, `dp`.`cantidad` AS `cantidad_item_presupuesto`, round(`dp`.`cantidad` * `ic`.`cantidad`,4) AS `total_necesario_corregido`, `i`.`id_item` AS `id_item`, `i`.`codigo_item` AS `codigo_item`, `i`.`nombre_item` AS `nombre_item`, `i`.`unidad` AS `unidad_item`, concat(`ic`.`cantidad`,' ',`ic`.`unidad`,'/',`i`.`unidad`) AS `relacion_unidades` FROM ((((`det_presupuesto` `dp` join `presupuestos` `p` on(`dp`.`id_presupuesto` = `p`.`id_presupuesto`)) join `capitulos` `c` on(`dp`.`id_capitulo` = `c`.`id_capitulo`)) join `items` `i` on(`dp`.`id_item` = `i`.`id_item`)) join `item_componentes` `ic` on(`i`.`id_item` = `ic`.`id_item`)) WHERE `dp`.`idestado` = 1 AND `ic`.`idestado` = 1 AND `p`.`idestado` = 1 ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_resumen_componentes_pedido`
--
DROP TABLE IF EXISTS `vw_resumen_componentes_pedido`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cpses_ge9o9oes3e`@`localhost` SQL SECURITY DEFINER VIEW `vw_resumen_componentes_pedido`  AS SELECT `ic`.`id_componente` AS `id_componente`, `ic`.`descripcion` AS `nombre_componente`, `ic`.`tipo_componente` AS `tipo_componente`, `ic`.`unidad` AS `unidad_componente`, `ic`.`precio_unitario` AS `precio_unitario`, `p`.`id_presupuesto` AS `id_presupuesto`, round(sum(`dp`.`cantidad` * `ic`.`cantidad`),4) AS `total_necesario`, 0.0000 AS `ya_pedido`, round(sum(`dp`.`cantidad` * `ic`.`cantidad`),4) AS `disponible`, group_concat(distinct `c`.`nombre_cap` separator ', ') AS `capitulos`, count(distinct `i`.`id_item`) AS `cantidad_items`, count(distinct `c`.`id_capitulo`) AS `cantidad_capitulos`, group_concat(distinct concat(`i`.`codigo_item`,'|',`i`.`nombre_item`,'|',`c`.`nombre_cap`,'|',`ic`.`cantidad`,'|',`ic`.`unidad`,'|',`i`.`unidad`,'|',`dp`.`cantidad`) separator '||') AS `detalle_serializado` FROM ((((`det_presupuesto` `dp` join `presupuestos` `p` on(`dp`.`id_presupuesto` = `p`.`id_presupuesto`)) join `capitulos` `c` on(`dp`.`id_capitulo` = `c`.`id_capitulo`)) join `items` `i` on(`dp`.`id_item` = `i`.`id_item`)) join `item_componentes` `ic` on(`i`.`id_item` = `ic`.`id_item`)) WHERE `dp`.`idestado` = 1 AND `ic`.`idestado` = 1 AND `p`.`idestado` = 1 GROUP BY `ic`.`id_componente`, `ic`.`descripcion`, `ic`.`tipo_componente`, `ic`.`unidad`, `ic`.`precio_unitario`, `p`.`id_presupuesto` ;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `capitulos`
--
ALTER TABLE `capitulos`
  ADD CONSTRAINT `fk_cap_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `det_presupuesto`
--
ALTER TABLE `det_presupuesto`
  ADD CONSTRAINT `fk_det_capitulo` FOREIGN KEY (`id_capitulo`) REFERENCES `capitulos` (`id_capitulo`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_det_mat_precio` FOREIGN KEY (`id_mat_precio`) REFERENCES `material_precio` (`id_mat_precio`),
  ADD CONSTRAINT `fk_det_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  ADD CONSTRAINT `fk_det_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_det_presupuesto_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`);

--
-- Filtros para la tabla `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_item_padre` FOREIGN KEY (`id_item_padre`) REFERENCES `items` (`id_item`) ON DELETE SET NULL;

--
-- Filtros para la tabla `item_componentes`
--
ALTER TABLE `item_componentes`
  ADD CONSTRAINT `fk_componente_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_componente_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`) ON DELETE SET NULL;

--
-- Filtros para la tabla `item_composicion`
--
ALTER TABLE `item_composicion`
  ADD CONSTRAINT `item_composicion_ibfk_1` FOREIGN KEY (`id_item_compuesto`) REFERENCES `items` (`id_item`) ON DELETE CASCADE,
  ADD CONSTRAINT `item_composicion_ibfk_2` FOREIGN KEY (`id_item_componente`) REFERENCES `items` (`id_item`) ON DELETE CASCADE;

--
-- Filtros para la tabla `materiales`
--
ALTER TABLE `materiales`
  ADD CONSTRAINT `fk_material_tipo` FOREIGN KEY (`id_tipo_material`) REFERENCES `tipo_material` (`id_tipo_material`);

--
-- Filtros para la tabla `material_precio`
--
ALTER TABLE `material_precio`
  ADD CONSTRAINT `fk_mat_precio_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedido_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pedidos_detalle`
--
ALTER TABLE `pedidos_detalle`
  ADD CONSTRAINT `fk_pedido_componente` FOREIGN KEY (`id_componente`) REFERENCES `item_componentes` (`id_componente`),
  ADD CONSTRAINT `fk_pedido_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`);

--
-- Filtros para la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD CONSTRAINT `fk_presup_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD CONSTRAINT `fk_proyecto_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`);

--
-- Filtros para la tabla `resp_proyecto`
--
ALTER TABLE `resp_proyecto`
  ADD CONSTRAINT `fk_resp_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 18, 2026 at 05:07 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gesconjm_sgicontrol`
--

-- --------------------------------------------------------

--
-- Table structure for table `capitulos`
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
-- Dumping data for table `capitulos`
--

INSERT INTO `capitulos` (`id_capitulo`, `id_presupuesto`, `nombre_cap`, `estado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 'BYPASS SAN JERONIMO', 1, 1, '2025-10-13', '2025-10-13'),
(2, 1, 'BYPASS EL CARMELO', 1, 1, '2025-10-13', '2025-10-13'),
(3, 2, 'Capitulo 1', 1, 1, '2025-10-14', '2025-10-14'),
(4, 2, 'capitulo 2', 1, 1, '2025-10-14', '2025-10-14'),
(5, 2, 'Capitulo 3', 1, 1, '2025-10-14', '2025-10-14');

-- --------------------------------------------------------

--
-- Table structure for table `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `nit` varchar(20) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `estado` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `nit`, `nombre`, `estado`) VALUES
(1, '123456789', 'Pruebas', 1),
(2, '94475178', 'Hector Hernan', 1),
(3, '852174235', 'PEDRO PEREZ', 1),
(4, '900001999', 'Gobernación del Valle del Cauca', 1),
(5, '7899', 'Carlos', 1);

-- --------------------------------------------------------

--
-- Table structure for table `compras`
--

CREATE TABLE `compras` (
  `id_compra` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_orden_compra` int(11) DEFAULT NULL,
  `id_provedor` int(11) NOT NULL,
  `fecha_compra` datetime NOT NULL DEFAULT current_timestamp(),
  `numero_factura` varchar(100) DEFAULT NULL,
  `total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `estado` varchar(30) NOT NULL DEFAULT 'pendiente',
  `observaciones` text DEFAULT NULL,
  `idusuario` int(11) DEFAULT NULL,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp(),
  `fechaupdate` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `compras`
--

INSERT INTO `compras` (`id_compra`, `id_pedido`, `id_orden_compra`, `id_provedor`, `fecha_compra`, `numero_factura`, `total`, `estado`, `observaciones`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 1, 1, '2026-01-17 01:26:02', '213123', 110080.00, 'completada', '', 1, '2026-01-17 01:26:02', '2026-01-17 01:26:02'),
(2, 1, 1, 1, '2026-01-17 01:27:24', '123123', 330240.00, 'completada', '', 1, '2026-01-17 01:27:24', '2026-01-17 01:27:24'),
(3, 1, 1, 1, '2026-01-17 01:27:31', '123123', 220160.00, 'completada', '', 1, '2026-01-17 01:27:31', '2026-01-17 01:27:31');

-- --------------------------------------------------------

--
-- Table structure for table `compras_detalle`
--

CREATE TABLE `compras_detalle` (
  `id_compra_detalle` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `id_det_pedido` int(11) DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `unidad` varchar(50) DEFAULT NULL,
  `cantidad` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `precio_unitario` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp(),
  `id_provedor` int(11) DEFAULT NULL,
  `numero_factura` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compras_finales`
--

CREATE TABLE `compras_finales` (
  `id_compra_final` int(11) NOT NULL,
  `id_orden_compra` int(11) NOT NULL,
  `fecha_compra` datetime NOT NULL DEFAULT current_timestamp(),
  `monto_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `numero_factura` varchar(100) DEFAULT NULL,
  `fecha_factura` date DEFAULT NULL,
  `idusuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compras_provedores`
--

CREATE TABLE `compras_provedores` (
  `id_compra` int(11) NOT NULL,
  `id_provedor` int(11) NOT NULL,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compras_proveedores`
--

CREATE TABLE `compras_proveedores` (
  `id_compra_proveedor` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `id_provedor` int(11) NOT NULL,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coop_perfiles`
--

CREATE TABLE `coop_perfiles` (
  `codigo_perfil` varchar(50) NOT NULL DEFAULT '',
  `descripcion_perfil` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `coop_perfiles`
--

INSERT INTO `coop_perfiles` (`codigo_perfil`, `descripcion_perfil`) VALUES
('1', 'Administrador'),
('2', 'Encargado del proceso'),
('3', 'Usuario');

-- --------------------------------------------------------

--
-- Table structure for table `coop_permisoperfil`
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
-- Dumping data for table `coop_permisoperfil`
--

INSERT INTO `coop_permisoperfil` (`idpermisoperfil`, `idpemisoperfil`, `idusuario`, `estado`, `created_at`, `updated_at`) VALUES
(3, 5, 26, 1, '2025-05-23', '2025-05-23');

-- --------------------------------------------------------

--
-- Table structure for table `costos_ind`
--

CREATE TABLE `costos_ind` (
  `idcostosind` int(3) NOT NULL,
  `desccostoind` varchar(50) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `porcentaje` decimal(15,2) NOT NULL,
  `tipo_costo` int(1) NOT NULL,
  `id_estado` int(1) NOT NULL,
  `costoiva` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `costos_ind`
--

INSERT INTO `costos_ind` (`idcostosind`, `desccostoind`, `porcentaje`, `tipo_costo`, `id_estado`, `costoiva`) VALUES
(1, 'Administración', 21.00, 1, 1, 0),
(2, 'Imprevistos', 1.00, 1, 1, 0),
(3, 'Utilidad', 8.00, 1, 1, 1),
(4, 'IVA', 19.00, 2, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `det_presupuesto`
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
-- Dumping data for table `det_presupuesto`
--

INSERT INTO `det_presupuesto` (`id_det_presupuesto`, `id_presupuesto`, `id_material`, `id_item`, `id_capitulo`, `id_mat_precio`, `cantidad`, `idestado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(21, 1, 21, 21, 2, 21, 480.00, 1, 2025, '2025-09-30', '2025-09-30'),
(22, 1, 22, 22, 2, 22, 480.00, 1, 2025, '2025-09-30', '2025-09-30'),
(23, 1, 23, 23, 2, 23, 30.00, 1, 2025, '2025-09-30', '2025-09-30'),
(28, 1, 28, 24, 2, 28, 76.00, 1, 2025, '2025-09-30', '2025-09-30'),
(30, 1, 30, 25, 2, 30, 6.00, 1, 2025, '2025-09-30', '2025-09-30'),
(31, 1, 31, 26, 2, 31, 76.00, 1, 2025, '2025-09-30', '2025-09-30'),
(42, 2, 28, 24, 3, 28, 76.00, 1, 1, '2025-10-24', '2025-10-24'),
(44, 2, 30, 25, 3, 30, 6.00, 1, 1, '2025-10-24', '2025-10-24'),
(45, 2, 31, 26, 3, 31, 76.00, 1, 1, '2025-10-24', '2025-10-24'),
(59, 1, NULL, 21, 2, NULL, 6.00, 1, 1, '2025-11-10', '2025-11-10'),
(60, 1, NULL, 22, 2, NULL, 7.00, 1, 1, '2025-11-10', '2025-11-10'),
(61, 1, NULL, 23, 2, NULL, 8.00, 1, 1, '2025-11-10', '2025-11-10');

-- --------------------------------------------------------

--
-- Table structure for table `empresa`
--

CREATE TABLE `empresa` (
  `idempresa` int(11) NOT NULL,
  `descripcion` varchar(90) NOT NULL DEFAULT '',
  `estado` tinyint(4) DEFAULT 1
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `estado`
--

CREATE TABLE `estado` (
  `id_estado` int(10) UNSIGNED NOT NULL,
  `estado` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `estado`
--

INSERT INTO `estado` (`id_estado`, `estado`) VALUES
(0, 'Inactivo'),
(1, 'Activo');

-- --------------------------------------------------------

--
-- Table structure for table `estado_pedido`
--

CREATE TABLE `estado_pedido` (
  `id_estado_pedido` int(3) NOT NULL COMMENT 'ID del estado',
  `desc_estado` varchar(50) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL COMMENT 'Descripción del estado',
  `color` varchar(20) DEFAULT NULL COMMENT 'Color para UI (ej: success, warning, danger)',
  `id_estado` int(1) NOT NULL DEFAULT 1 COMMENT 'Estado activo/inactivo'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Catálogo de estados de pedidos';

--
-- Dumping data for table `estado_pedido`
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
-- Table structure for table `gr_auth_reset_password`
--

CREATE TABLE `gr_auth_reset_password` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `gr_auth_reset_password`
--

INSERT INTO `gr_auth_reset_password` (`id`, `user_id`, `token`, `created_at`) VALUES
(2, 2, '8b8d8d71bc8130f55fa4d3c2ae683ee751fc1a813554a8fb2ed7fe154d364a65', '2025-09-30 19:17:31');

-- --------------------------------------------------------

--
-- Table structure for table `gr_paginaperfil`
--

CREATE TABLE `gr_paginaperfil` (
  `Id` int(11) NOT NULL,
  `idpagina` int(11) NOT NULL DEFAULT 0,
  `perfil` int(11) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Dumping data for table `gr_paginaperfil`
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
-- Table structure for table `gr_tipodoc`
--

CREATE TABLE `gr_tipodoc` (
  `idtipodoc` int(3) NOT NULL,
  `desctipdoc` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `gr_tipodoc`
--

INSERT INTO `gr_tipodoc` (`idtipodoc`, `desctipdoc`, `id_estado`) VALUES
(1, 'Cédula de Ciudadanía', 1),
(2, 'Pasaporte', 1),
(3, 'Cédula de Extranjería', 1);

-- --------------------------------------------------------

--
-- Table structure for table `gr_unidad`
--

CREATE TABLE `gr_unidad` (
  `idunidad` int(11) NOT NULL,
  `unidesc` varchar(50) NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `gr_unidad`
--

INSERT INTO `gr_unidad` (`idunidad`, `unidesc`, `id_estado`) VALUES
(1, 'UND', 1),
(2, 'DÍA', 1),
(3, 'M', 1),
(4, 'M2', 1),
(5, 'M3', 1),
(6, 'M3 - KM', 1),
(7, 'H', 1),
(8, 'GLN', 1),
(9, 'KG', 1),
(10, 'LT', 1),
(11, 'ROLLO', 1);

-- --------------------------------------------------------

--
-- Table structure for table `gr_usuarios`
--

CREATE TABLE `gr_usuarios` (
  `u_id` int(11) NOT NULL,
  `u_login` varchar(60) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL DEFAULT '',
  `u_password` varchar(100) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL DEFAULT '',
  `u_nombre` varchar(64) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL DEFAULT '',
  `u_apellido` varchar(64) CHARACTER SET utf8 COLLATE utf8_spanish_ci DEFAULT NULL,
  `u_email` varchar(64) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL DEFAULT '',
  `tipodoc` varchar(2) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `cedula` int(11) NOT NULL DEFAULT 0,
  `u_activo` int(11) NOT NULL DEFAULT 0,
  `codigo_perfil` int(11) NOT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `deactivate_at` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Dumping data for table `gr_usuarios`
--

INSERT INTO `gr_usuarios` (`u_id`, `u_login`, `u_password`, `u_nombre`, `u_apellido`, `u_email`, `tipodoc`, `cedula`, `u_activo`, `codigo_perfil`, `created_at`, `updated_at`, `deactivate_at`) VALUES
(1, 'hhramirez@gmail.com', '$2y$10$MAet5DE1KwZceWdaiGAVW..XqWXoajdaYHDRz.E0V210G93OVlwuK', 'Juan Pablo', 'Ramírez Reyes', 'hhramirez@gmail.com', '1', 123456789, 1, 1, '2022-04-27', '2025-09-30', NULL),
(2, 'hhramirez2@gmail.com', '$2y$10$mHQ8IpgGNe/LcozHDdxsSuUUQ2wAGdOzsiSUoL1qFGQRIR4Pea7eq', 'Hector Hernan', 'Ramirez Reyes', 'hhramirez2@gmail.com', '1', 94475178, 1, 1, '2025-09-30', '2025-09-30', NULL),
(3, 'usuario@gmail.com', '$2y$10$/ECK94yVays1RyRYXj/cxO30weTMqFtbCVUSpGeybTfWVh7B9mhNG', 'NATALIA', 'Ramírez Reyes', 'usuario@gmail.com', '1', 8529633, 1, 3, '2025-10-06', '2025-10-06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id_item` int(11) NOT NULL,
  `codigo_item` varchar(50) NOT NULL COMMENT 'Código único del ítem (ej: APU-001)',
  `nombre_item` text NOT NULL COMMENT 'Nombre del ítem (ej: Instalación de cinta reflectiva)',
  `unidad` varchar(20) NOT NULL COMMENT 'Unidad de medida (m, m2, m3, un, etc)',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción detallada del ítem',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `idusuario` int(4) NOT NULL,
  `idestado` int(1) DEFAULT 1,
  `es_compuesto` tinyint(1) DEFAULT 0 COMMENT '0=Simple, 1=Compuesto (puede tener sub-items o componentes)',
  `id_item_padre` int(11) DEFAULT NULL COMMENT 'Para items que son sub-componentes de otros items',
  `es_apu` tinyint(1) DEFAULT 0 COMMENT '1=Es APU (Análisis de Precio Unitario), 0=Item simple',
  `nivel` int(2) DEFAULT 1 COMMENT 'Nivel en la jerarquía (1=Item principal, 2=Sub-item, etc)',
  `ruta_jerarquia` varchar(500) DEFAULT NULL COMMENT 'Ruta completa de la jerarquía (ej: 1>5>10)',
  `id_tipo_item` int(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id_item`, `codigo_item`, `nombre_item`, `unidad`, `descripcion`, `fecha_creacion`, `idusuario`, `idestado`, `es_compuesto`, `id_item_padre`, `es_apu`, `nivel`, `ruta_jerarquia`, `id_tipo_item`) VALUES
(21, '330311', 'PALETERO DIURNO', 'H', 'Personal paletero para control de tráfico en jornada diurna', '2025-11-06 23:01:53', 1, 1, 0, NULL, 0, 1, NULL, 2),
(22, '330312', 'PALETERO NOCTURNO', 'H', 'Personal paletero para control de tráfico en jornada nocturna', '2025-11-06 23:01:53', 1, 1, 0, NULL, 0, 1, NULL, 2),
(23, '330309', 'SENAL DE PARE-SIGA PARA PALETERO', 'DIA', 'Suministro de señal de pare-siga para paletero', '2025-11-06 23:01:53', 1, 1, 0, NULL, 0, 1, NULL, 2),
(24, '165903', 'INST.TUB.PVC UM 3\"', 'M', 'Instalación de tubería PVC Unión Mecánica 3 pulgadas', '2025-11-06 23:01:53', 1, 1, 0, NULL, 0, 1, NULL, 4),
(25, '165718', 'CODO PVC UM 3\" x 45 RDE-13.5', 'UND', 'Codo de PVC Unión Mecánica 3 pulgadas x 45 grados RDE-13.5', '2025-11-06 23:01:53', 1, 1, 0, NULL, 0, 1, NULL, 4),
(26, '165004', 'TUBERIA PVC ALTA PRESION 3\" RDE 13.5 UM', 'M', 'Tubería PVC alta presión 3 pulgadas RDE 13.5 Unión Mecánica', '2025-11-06 23:01:53', 1, 1, 0, NULL, 0, 1, NULL, 4),
(27, 'ME0109', 'MEZCLA CONCRETO 1:2:4 2500 PSI - 17,5 Mpa', 'M3', 'Mezcla de concreto con resistencia de 2500 PSI', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 1),
(28, 'ME0201', 'MORTERO 1:3', 'M3', 'Mortero con proporción 1:3 (cemento:arena)', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 1),
(29, '330301', 'CINTA SEGURIDAD PREVENTIVA A=8CM-250MTS', 'UND', 'Cinta de seguridad preventiva', '2025-11-26 15:58:48', 1, 1, 1, NULL, 1, 1, NULL, 2),
(30, '330306', 'BARRICADA Y DESVIO TIPO SR-102', 'DIA', 'Barricada y desvío de tráfico', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 2),
(31, '330127', 'CORTADORA DE PAVIMENTO DE 4 A 7 CM', 'M', 'Corte de pavimento', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 2),
(32, '100424', 'DEMOLICION PAVIMENTO CONCRETO E=20CM', 'M2', 'Demolición de pavimento', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 3),
(33, '100602', 'EXCAVACION EN CONGLOMERADO (MANUAL)', 'M3', 'Excavación manual', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 3),
(34, '110906', 'COLCHON ARENA GRUESA E=5-7CM', 'M3', 'Colchón de arena gruesa', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(35, '165905', 'INST.TUB.PVC UM 6\"', 'M', 'Instalación tubería PVC 6\"', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(36, '165110-17P', 'TEE PVC UM 3\" x3\" x3\"', 'UND', 'Tee de PVC', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(37, '165304-18P', 'REDUCC PVC UM 6\" x3\"', 'UND', 'Reducción de PVC', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(38, '165008', 'TUBERIA PVC ALTA PRESION 6\" RDE 13.5 UM', 'M', 'Tubería PVC alta presión', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(39, '100618', 'RELLENO MATERIAL SITIO COMPACTADO-RANA', 'M3', 'Relleno compactado', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 3),
(40, '100620', 'RELLENO ROCAMUERTA COMPACT-SALTARIN', 'M3', 'Relleno con roca muerta', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 3),
(41, '083303', 'BASE GRANULAR CLASE B (NT2, BG 38)', 'M3', 'Base granular clase B', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(42, '085002', 'PAVIMENTO CONCRETO HIDRAULICO PREMEZCLADO', 'M3', 'Pavimento de concreto', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 5),
(43, '321003', 'SELLADOR ELASTICO (JUNTA 1 X 1 CM)', 'M', 'Sellador elástico', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(44, '020430-15P', 'EMPALME TUB 3\"-6\" CAMARA CONCRETO', 'UND', 'Empalme de tubería', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 6),
(45, '010209', 'CARGUE MAT. EXCAV. A MAQUINA', 'M3', 'Cargue de material', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4),
(46, '089003', 'TRANSPORTE MATERIALES EXCAVACION', 'M3-KM', 'Transporte de materiales', '2025-11-26 15:58:48', 1, 1, 0, NULL, 1, 1, NULL, 4);

-- --------------------------------------------------------

--
-- Table structure for table `items_backup_20251124`
--

CREATE TABLE `items_backup_20251124` (
  `id_item` int(11) NOT NULL DEFAULT 0,
  `codigo_item` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código único del ítem (ej: APU-001)',
  `nombre_item` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del ítem (ej: Instalación de cinta reflectiva)',
  `unidad` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unidad de medida (m, m2, m3, un, etc)',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripción detallada del ítem',
  `precio_unitario` decimal(14,2) DEFAULT 0.00 COMMENT 'Precio calculado automáticamente',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `idusuario` int(4) NOT NULL,
  `idestado` int(1) DEFAULT 1,
  `es_compuesto` tinyint(1) DEFAULT 0 COMMENT '0=Simple, 1=Compuesto (puede tener sub-items)',
  `id_item_padre` int(11) DEFAULT NULL COMMENT 'Para items que son sub-componentes de otros items'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items_backup_20251124`
--

INSERT INTO `items_backup_20251124` (`id_item`, `codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `fecha_creacion`, `idusuario`, `idestado`, `es_compuesto`, `id_item_padre`) VALUES
(21, '330311', 'PALETERO DIURNO', 'H', 'Personal paletero para control de tráfico en jornada diurna', 18861.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(22, '330312', 'PALETERO NOCTURNO', 'H', 'Personal paletero para control de tráfico en jornada nocturna', 22635.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(23, '330309', 'SENAL DE PARE-SIGA PARA PALETERO', 'DIA', 'Suministro de señal de pare-siga para paletero', 4370.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(24, '165903', 'INST.TUB.PVC UM 3\"', 'M', 'Instalación de tubería PVC Unión Mecánica 3 pulgadas', 7110.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(25, '165718', 'CODO PVC UM 3\" x 45 RDE-13.5', 'UND', 'Codo de PVC Unión Mecánica 3 pulgadas x 45 grados RDE-13.5', 151906.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(26, '165004', 'TUBERIA PVC ALTA PRESION 3\" RDE 13.5 UM', 'M', 'Tubería PVC alta presión 3 pulgadas RDE 13.5 Unión Mecánica', 116360.00, '2025-11-06 23:01:53', 1, 1, 0, NULL),
(27, 'ME0109', 'MEZCLA CONCRETO 1:2:4 2500 PSI - 17,5 Mpa', 'M3', 'Mezcla de concreto con resistencia de 2500 PSI', 388523.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(28, 'ME0201', 'MORTERO 1:3', 'M3', 'Mortero con proporción 1:3 (cemento:arena)', 409265.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(29, '330301', 'CINTA SEGURIDAD PREVENTIVA A=8CM-250MTS', 'UND', 'Cinta de seguridad preventiva', 200842.00, '2025-11-26 15:38:47', 0, 1, 1, NULL),
(30, '330306', 'BARRICADA Y DESVIO TIPO SR-102', 'DIA', 'Barricada y desvío de tráfico', 21948.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(31, '330127', 'CORTADORA DE PAVIMENTO DE 4 A 7 CM', 'M', 'Corte de pavimento', 9675.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(32, '100424', 'DEMOLICION PAVIMENTO CONCRETO E=20CM', 'M2', 'Demolición de pavimento', 36890.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(33, '100602', 'EXCAVACION EN CONGLOMERADO (MANUAL)', 'M3', 'Excavación manual', 49642.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(34, '110906', 'COLCHON ARENA GRUESA E=5-7CM', 'M3', 'Colchón de arena gruesa', 88188.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(35, '165905', 'INST.TUB.PVC UM 6\"', 'M', 'Instalación tubería PVC 6\"', 11317.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(36, '165110-17P', 'TEE PVC UM 3\" x3\" x3\"', 'UND', 'Tee de PVC', 252989.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(37, '165304-18P', 'REDUCC PVC UM 6\" x3\"', 'UND', 'Reducción de PVC', 472849.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(38, '165008', 'TUBERIA PVC ALTA PRESION 6\" RDE 13.5 UM', 'M', 'Tubería PVC alta presión', 281462.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(39, '100618', 'RELLENO MATERIAL SITIO COMPACTADO-RANA', 'M3', 'Relleno compactado', 44867.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(40, '100620', 'RELLENO ROCAMUERTA COMPACT-SALTARIN', 'M3', 'Relleno con roca muerta', 105317.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(41, '083303', 'BASE GRANULAR CLASE B (NT2, BG 38)', 'M3', 'Base granular clase B', 125168.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(42, '085002', 'PAVIMENTO CONCRETO HIDRAULICO PREMEZCLADO', 'M3', 'Pavimento de concreto', 920116.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(43, '321003', 'SELLADOR ELASTICO (JUNTA 1 X 1 CM)', 'M', 'Sellador elástico', 50950.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(44, '020430-15P', 'EMPALME TUB 3\"-6\" CAMARA CONCRETO', 'UND', 'Empalme de tubería', 381664.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(45, '010209', 'CARGUE MAT. EXCAV. A MAQUINA', 'M3', 'Cargue de material', 7594.00, '2025-11-26 15:38:47', 0, 1, 0, NULL),
(46, '089003', 'TRANSPORTE MATERIALES EXCAVACION', 'M3-KM', 'Transporte de materiales', 2500.00, '2025-11-26 15:38:47', 0, 1, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `item_componentes`
--

CREATE TABLE `item_componentes` (
  `id_componente` int(11) NOT NULL,
  `codigo_componente` varchar(50) DEFAULT NULL,
  `id_item` int(11) NOT NULL COMMENT 'Ítem al que pertenece',
  `tipo_componente` enum('material','mano_obra','equipo','transporte','otro') NOT NULL,
  `id_material` int(11) DEFAULT NULL COMMENT 'Si es material, referencia a materiales',
  `descripcion` text NOT NULL COMMENT 'Descripción del componente',
  `unidad` varchar(20) NOT NULL,
  `cantidad` decimal(10,4) NOT NULL COMMENT 'Cantidad por unidad del ítem',
  `precio_unitario` decimal(14,2) NOT NULL,
  `porcentaje_desperdicio` decimal(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de desperdicio',
  `subtotal` decimal(14,2) GENERATED ALWAYS AS (`cantidad` * `precio_unitario`) STORED,
  `idestado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `item_componentes`
--

INSERT INTO `item_componentes` (`id_componente`, `codigo_componente`, `id_item`, `tipo_componente`, `id_material`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `porcentaje_desperdicio`, `idestado`) VALUES
(95, '201000', 21, 'mano_obra', 133, 'AUXILIAR OFICIOS VARIOS DIURNO (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.1250, 114730.00, 0.00, 1),
(96, '201001', 22, 'mano_obra', 134, 'AUXILIAR OFICIOS VARIOS NOCTURNO (Jornal 76,487 + 180% Prestaciones)', 'DIA', 0.1250, 137676.00, 0.00, 1),
(97, '301019', 23, 'equipo', 104, 'SENAL DE PARE - SIGA', 'DIA', 1.0000, 3323.00, 0.00, 1),
(98, '101141', 24, 'material', 53, 'LUBRICANTE TUB PVC 500GR (+ 3% desperdicio)', 'UND', 0.0309, 31595.00, 3.00, 1),
(99, '200021', 24, 'mano_obra', 135, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 0.00, 1),
(100, '300026', 24, 'equipo', 117, 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 13477.90, 0.00, 1),
(101, '101141', 25, 'material', 52, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0300, 31595.00, 3.00, 1),
(102, '100692', 25, 'material', 49, 'CODO PRS R13 45 X 3\"', 'UND', 1.0000, 110080.00, 0.00, 1),
(103, '200021', 25, 'mano_obra', 137, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 0.00, 1),
(104, '300026', 25, 'equipo', 117, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 13477.90, 0.00, 1),
(105, '101141', 26, 'material', 52, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0200, 31595.00, 3.00, 1),
(106, '102042', 26, 'material', 54, 'TUBO PRESION RDE-13.5 UM - 3\" (+ 1% desperdicio)', 'M', 1.0100, 74690.00, 1.00, 1),
(107, '200021', 26, 'mano_obra', 152, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0350, 340749.00, 0.00, 1),
(108, '300026', 26, 'equipo', 117, 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 13477.90, 0.00, 1),
(109, '100053', 27, 'material', 44, 'AGUA', 'LT', 160.0000, 74.00, 3.00, 1),
(110, '100123', 27, 'material', 45, 'ARENA DE TRITURACIÓN Y/O ARENA GRUESA DE RIO', 'M3', 0.5200, 52278.00, 3.00, 1),
(111, '100962', 27, 'material', 51, 'GRAVA TRITURADA 3/4\"', 'M3', 0.9400, 87600.00, 3.00, 1),
(112, '100932', 27, 'material', 50, 'GASOLINA CORRIENTE', 'GLN', 0.1000, 16758.00, 0.00, 1),
(113, '100558', 27, 'material', 47, 'CEMENTO GRIS PORTLAND', 'KG', 265.0000, 650.00, 3.00, 1),
(114, '100011', 27, 'material', 42, 'ACEITE MOTOR 4 TIEMPOS', 'GLN', 0.0060, 117290.00, 0.00, 1),
(115, '200010', 27, 'mano_obra', 108, 'M.O. 3 AYUDANTES', 'DIA', 0.1852, 344190.00, 0.00, 1),
(116, '200100', 27, 'mano_obra', 109, 'M.O. 1 OFICIAL', 'DIA', 0.0625, 195040.00, 0.00, 1),
(117, '308003', 27, 'equipo', 113, 'MEZCLADORA DE 9 PIES CUBICOS', 'H', 0.4800, 5151.00, 0.00, 1),
(118, '300026', 27, 'equipo', 117, 'HERRAMIENTA MENOR', 'GL', 0.0700, 13477.90, 0.00, 1),
(119, '100053', 28, 'material', 44, 'AGUA', 'LT', 220.0000, 74.00, 0.00, 1),
(120, '100124', 28, 'material', 46, 'ARENA MEDIA DE RIO Y/O DE TRITURACIÓN', 'M3', 1.0900, 56993.00, 0.00, 1),
(121, '100558', 28, 'material', 47, 'CEMENTO GRIS PORTLAND', 'KG', 450.0000, 650.00, 0.00, 1),
(122, '200008', 28, 'mano_obra', 110, 'M.O. 2 AYUDANTES', 'DIA', 0.1563, 229460.00, 0.00, 1),
(123, '300026', 28, 'equipo', 117, 'HERRAMIENTA MENOR', 'GL', 0.0700, 13477.90, 0.00, 1),
(124, '105037', 29, 'material', 48, 'CINTA SEGURIDAD PREVENTIVA 300 M', 'ROLLO', 1.0000, 38991.00, 0.00, 1),
(125, '101008', 29, 'material', 43, 'ACERO DE REFUERZO 60.000 PSI 420 MPA', 'KG', 12.0000, 4250.00, 0.00, 1),
(126, '200006', 29, 'mano_obra', 111, 'M.O. 1 AYUDANTE', 'DIA', 0.0500, 114730.00, 0.00, 1),
(127, '200007', 29, 'mano_obra', 112, 'M.O. 1 AYUDANTE + 1 OFICIAL', 'DIA', 0.0250, 309771.00, 0.00, 1),
(128, '300026', 29, 'equipo', 117, 'HERRAMIENTA MENOR', 'GL', 0.0500, 13477.90, 0.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `item_componentes_backup_20251124`
--

CREATE TABLE `item_componentes_backup_20251124` (
  `id_componente` int(11) NOT NULL DEFAULT 0,
  `id_item` int(11) NOT NULL COMMENT 'Ítem al que pertenece',
  `tipo_componente` enum('material','mano_obra','equipo','transporte','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_material` int(11) DEFAULT NULL COMMENT 'Si es material, referencia a materiales',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripción del componente',
  `unidad` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,4) NOT NULL COMMENT 'Cantidad por unidad del ítem',
  `precio_unitario` decimal(14,2) NOT NULL,
  `subtotal` decimal(14,2) DEFAULT NULL,
  `idestado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_componentes_backup_20251124`
--

INSERT INTO `item_componentes_backup_20251124` (`id_componente`, `id_item`, `tipo_componente`, `id_material`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `subtotal`, `idestado`) VALUES
(95, 21, 'mano_obra', NULL, 'AUXILIAR OFICIOS VARIOS DIURNO (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.1250, 114730.00, 14341.25, 1),
(96, 22, 'mano_obra', NULL, 'AUXILIAR OFICIOS VARIOS NOCTURNO (Jornal 76,487 + 180% Prestaciones)', 'DIA', 0.1250, 137676.00, 17209.50, 1),
(97, 23, 'equipo', NULL, 'SENAL DE PARE - SIGA', 'DIA', 1.0000, 3323.00, 3323.00, 1),
(98, 24, 'material', NULL, 'LUBRICANTE TUB PVC 500GR (+ 3% desperdicio)', 'UND', 0.0309, 31595.00, 976.29, 1),
(99, 24, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 4259.36, 1),
(100, 24, 'equipo', NULL, 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 4259.36, 170.37, 1),
(101, 25, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0300, 31595.00, 947.85, 1),
(102, 25, 'material', NULL, 'CODO PRS R13 45 X 3\"', 'UND', 1.0000, 110080.00, 110080.00, 1),
(103, 25, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 4259.36, 1),
(104, 25, 'equipo', NULL, 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 4259.36, 212.97, 1),
(105, 26, 'material', NULL, 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0200, 31595.00, 631.90, 1),
(106, 26, 'material', NULL, 'TUBO PRESION RDE-13.5 UM - 3\" (+ 1% desperdicio)', 'M', 1.0100, 74690.00, 75436.90, 1),
(107, 26, 'mano_obra', NULL, 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0350, 340749.00, 11926.22, 1),
(108, 26, 'equipo', NULL, 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 11926.81, 477.07, 1);

-- --------------------------------------------------------

--
-- Table structure for table `item_composicion`
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
  `idestado` int(1) DEFAULT 1,
  `orden` int(4) DEFAULT 1 COMMENT 'Orden de visualización',
  `porcentaje_desperdicio` decimal(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de desperdicio',
  `es_referencia` tinyint(1) DEFAULT 0 COMMENT '1=Es referencia a otro item, 0=Componente directo'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `item_composicion`
--

INSERT INTO `item_composicion` (`id_composicion`, `id_item_compuesto`, `id_item_componente`, `cantidad`, `nivel`, `observaciones`, `idusuario`, `fechareg`, `fechaupdate`, `idestado`, `orden`, `porcentaje_desperdicio`, `es_referencia`) VALUES
(8, 29, 27, 0.1250, 2, NULL, 1, '2025-11-26 15:59:24', '2025-11-26 15:59:24', 1, 1, 0.00, 1),
(9, 44, 28, 0.0080, 2, NULL, 1, '2025-11-26 15:59:24', '2025-11-26 15:59:24', 1, 1, 0.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `item_composicion_backup_20251124`
--

CREATE TABLE `item_composicion_backup_20251124` (
  `id_composicion` int(11) NOT NULL DEFAULT 0,
  `id_item_compuesto` int(11) NOT NULL COMMENT 'Item padre (compuesto)',
  `id_item_componente` int(11) NOT NULL COMMENT 'Item hijo (componente)',
  `cantidad` decimal(10,4) NOT NULL DEFAULT 1.0000 COMMENT 'Cantidad del componente por unidad del compuesto',
  `nivel` int(11) DEFAULT 1 COMMENT 'Nivel en la jerarquía',
  `observaciones` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `idusuario` int(11) NOT NULL,
  `fechareg` datetime DEFAULT current_timestamp(),
  `fechaupdate` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `idestado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logsql`
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
-- Table structure for table `log_recepciones`
--

CREATE TABLE `log_recepciones` (
  `id_log` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `id_orden_compra` int(11) NOT NULL,
  `id_det_pedido` int(11) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `unidad` varchar(50) DEFAULT NULL,
  `cantidad_recibida` decimal(10,4) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal_item` decimal(10,2) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `log_recepciones`
--

INSERT INTO `log_recepciones` (`id_log`, `id_compra`, `id_orden_compra`, `id_det_pedido`, `descripcion`, `unidad`, `cantidad_recibida`, `precio_unitario`, `subtotal_item`, `fecha_registro`) VALUES
(1, 1, 1, 1, 'CODO PRS R13 45 X 3\"', 'UND', 1.0000, 110080.00, 110080.00, '2026-01-17 06:26:02'),
(2, 2, 1, 1, 'CODO PRS R13 45 X 3\"', 'UND', 3.0000, 110080.00, 330240.00, '2026-01-17 06:27:24'),
(3, 3, 1, 1, 'CODO PRS R13 45 X 3\"', 'UND', 2.0000, 110080.00, 220160.00, '2026-01-17 06:27:31');

-- --------------------------------------------------------

--
-- Table structure for table `materiales`
--

CREATE TABLE `materiales` (
  `id_material` int(11) NOT NULL,
  `cod_material` varchar(20) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `nombremat` blob NOT NULL,
  `id_tipo_material` int(11) NOT NULL,
  `idunidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idusuario` int(11) NOT NULL,
  `matfchreg` date NOT NULL,
  `idestado` int(1) NOT NULL,
  `matfupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `materiales`
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
(39, '089003-14', 0x225452414e53504f525445204445204d4154455249414c45532050524f56454e49454e544553204445204c41204558434156414349c3934e204445204c41204558504c414e414349c3934e2c2043414e414c45532059205052c3895354414d4f5320504152412044495354414e43494153204d41594f524553204445204d494c204d4554524f532028312e303030206d29204d454449444f53204120504152544952204445204349454e204d4554524f532028313030206d290d0a28416e616c697a61646f207061726120766f6c71756574612064652036206d332922, 2, '6', 1, '2025-09-30', 1, '2025-09-30'),
(40, '123', 0x6d6174657269616c20656a656d706c6f, 2, '3', 1, '2025-12-21', 1, '2025-12-21'),
(41, '23412341', 0x6e7565766f206d6174657269616c, 2, '3', 1, '2025-12-26', 1, '2025-12-26'),
(42, 'AUTO-1.000', 0x414345495445204d4f544f522034205449454d504f53, 2, '8', 1, '2025-12-28', 1, '2025-12-28'),
(43, 'AUTO-2.000', 0x414345524f204445205245465545525a4f2036302e3030302050534920343230204d5041, 2, '9', 1, '2025-12-28', 1, '2025-12-28'),
(44, 'AUTO-3.000', 0x41475541, 2, '10', 1, '2025-12-28', 1, '2025-12-28'),
(45, 'AUTO-4.000', 0x4152454e4120444520545249545552414349c3934e20592f4f204152454e41204752554553412044452052494f, 2, '5', 1, '2025-12-28', 1, '2025-12-28'),
(46, 'AUTO-5.000', 0x4152454e41204d454449412044452052494f20592f4f20444520545249545552414349c3934e, 2, '5', 1, '2025-12-28', 1, '2025-12-28'),
(47, 'AUTO-6.000', 0x43454d454e544f204752495320504f52544c414e44, 2, '9', 1, '2025-12-28', 1, '2025-12-28'),
(48, 'AUTO-7.000', 0x43494e5441205345475552494441442050524556454e5449564120333030204d, 2, '11', 1, '2025-12-28', 1, '2025-12-28'),
(49, 'AUTO-8.000', 0x434f444f20505253205231332034352058203322, 2, '1', 1, '2025-12-28', 1, '2025-12-28'),
(50, 'AUTO-9.000', 0x4741534f4c494e4120434f525249454e5445, 2, '8', 1, '2025-12-28', 1, '2025-12-28'),
(51, 'AUTO-10.00', 0x47524156412054524954555241444120332f3422, 2, '5', 1, '2025-12-28', 1, '2025-12-28'),
(52, 'AUTO-11.00', 0x4c5542524943414e54452054554220505643203530304752, 2, '1', 1, '2025-12-28', 1, '2025-12-28'),
(53, 'AUTO-12.00', 0x4c5542524943414e5445205455422050564320353030475220282b20332520646573706572646963696f29, 2, '1', 1, '2025-12-28', 1, '2025-12-28'),
(54, 'AUTO-13.00', 0x5455424f2050524553494f4e205244452d31332e3520554d202d20332220282b20312520646573706572646963696f29, 2, '3', 1, '2025-12-28', 1, '2025-12-28'),
(102, 'AUTO_MAN_95', 0x415558494c494152204f464943494f5320564152494f5320444955524e4f20284a6f726e616c2036332c373339202b20313830252050726573746163696f6e657329, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(103, 'AUTO_MAN_96', 0x415558494c494152204f464943494f5320564152494f53204e4f435455524e4f20284a6f726e616c2037362c343837202b20313830252050726573746163696f6e657329, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(104, 'AUTO_EQU_97', 0x53454e414c2044452050415245202d2053494741, 3, '2', 1, '2025-12-28', 1, '2025-12-28'),
(105, 'AUTO_MAN_99', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(106, 'AUTO_MAN_103', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(107, 'AUTO_MAN_107', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(108, 'AUTO_MAN_115', 0x4d2e4f2e20332041595544414e544553, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(109, 'AUTO_MAN_116', 0x4d2e4f2e2031204f46494349414c, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(110, 'AUTO_MAN_122', 0x4d2e4f2e20322041595544414e544553, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(111, 'AUTO_MAN_126', 0x4d2e4f2e20312041595544414e5445, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(112, 'AUTO_MAN_127', 0x4d2e4f2e20312041595544414e5445202b2031204f46494349414c, 2, '2', 1, '2025-12-28', 1, '2025-12-28'),
(113, 'AUTO_EQU_117', 0x4d455a434c41444f5241204445203920504945532043554249434f53, 3, '7', 1, '2025-12-28', 1, '2025-12-28'),
(114, 'AUTO_EQU_100', 0x48455252414d49454e5441204d454e4f5220283425206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(115, 'AUTO_EQU_104', 0x48455252414d49454e5441204d454e4f5220283525206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(116, 'AUTO_EQU_108', 0x48455252414d49454e5441204d454e4f5220283425206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(117, 'AUTO_EQU_118', 0x48455252414d49454e5441204d454e4f52, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(118, 'AUTO_EQU_123', 0x48455252414d49454e5441204d454e4f52, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(119, 'AUTO_EQU_128', 0x48455252414d49454e5441204d454e4f52, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(133, 'AUTO2_MAN_95', 0x415558494c494152204f464943494f5320564152494f5320444955524e4f20284a6f726e616c2036332c373339202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(134, 'AUTO2_MAN_96', 0x415558494c494152204f464943494f5320564152494f53204e4f435455524e4f20284a6f726e616c2037362c343837202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(135, 'AUTO2_MAN_99', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(136, 'AUTO2_MAN_103', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(137, 'AUTO2_MAN_107', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(138, 'AUTO2_EQU_100', 0x48455252414d49454e5441204d454e4f5220283425206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(139, 'AUTO2_EQU_104', 0x48455252414d49454e5441204d454e4f5220283525206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(140, 'AUTO2_EQU_108', 0x48455252414d49454e5441204d454e4f5220283425206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(148, 'AUTO2_MAN_95', 0x415558494c494152204f464943494f5320564152494f5320444955524e4f20284a6f726e616c2036332c373339202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(149, 'AUTO2_MAN_96', 0x415558494c494152204f464943494f5320564152494f53204e4f435455524e4f20284a6f726e616c2037362c343837202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(150, 'AUTO2_MAN_99', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(151, 'AUTO2_MAN_103', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(152, 'AUTO2_MAN_107', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(153, 'AUTO2_EQU_100', 0x48455252414d49454e5441204d454e4f5220283425206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(154, 'AUTO2_EQU_104', 0x48455252414d49454e5441204d454e4f5220283525206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(155, 'AUTO2_EQU_108', 0x48455252414d49454e5441204d454e4f5220283425206465204d616e6f206465204f62726129, 3, '1', 1, '2025-12-28', 1, '2025-12-28'),
(163, 'AUTO3_MAN_95', 0x415558494c494152204f464943494f5320564152494f5320444955524e4f20284a6f726e616c2036332c373339202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(164, 'AUTO3_MAN_96', 0x415558494c494152204f464943494f5320564152494f53204e4f435455524e4f20284a6f726e616c2037362c343837202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(165, 'AUTO3_MAN_99', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(166, 'AUTO3_MAN_103', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28'),
(167, 'AUTO3_MAN_107', 0x4d2e4f2e20484944524f53414e49542e20312041595544414e5445202b2031204f46494349414c20284a6f726e616c203138392c333035202b20313830252050726573746163696f6e657329, 1, '2', 1, '2025-12-28', 1, '2025-12-28');

-- --------------------------------------------------------

--
-- Table structure for table `materiales_extra_presupuesto`
--

CREATE TABLE `materiales_extra_presupuesto` (
  `id_material_extra` int(11) NOT NULL,
  `id_presupuesto` int(11) NOT NULL,
  `id_material` int(11) NOT NULL,
  `id_capitulo` int(11) DEFAULT NULL,
  `cantidad` decimal(10,4) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `justificacion` text NOT NULL,
  `estado` varchar(20) DEFAULT 'pendiente',
  `fecha_agregado` datetime DEFAULT current_timestamp(),
  `usuario_agrego` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `materiales_extra_presupuesto`
--

INSERT INTO `materiales_extra_presupuesto` (`id_material_extra`, `id_presupuesto`, `id_material`, `id_capitulo`, `cantidad`, `precio_unitario`, `justificacion`, `estado`, `fecha_agregado`, `usuario_agrego`) VALUES
(1, 2, 32, 3, 1.0000, 34114.00, 'algo', 'aprobado', '2025-12-18 12:07:40', 1);

-- --------------------------------------------------------

--
-- Table structure for table `material_precio`
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
-- Dumping data for table `material_precio`
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
(17, 17, 5774.00, '2025-09-30', 0, 1, '2025-09-30', '2025-09-30'),
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
(40, 17, 6700.00, '2025-10-14', 0, 1, '2025-10-14', '2025-10-14'),
(41, 4, 30000.00, '2025-10-15', 1, 1, '2025-10-14', '2025-10-14'),
(42, 40, 123000.00, '2025-12-21', 0, 1, '2025-12-21', '2025-12-21'),
(43, 41, 123231.00, '2025-12-26', 0, 1, '2025-12-26', '2025-12-26'),
(44, 41, 123231.00, '2025-12-26', 1, 1, '2025-12-26', '2025-12-26'),
(45, 40, 345.00, '2025-12-27', 1, 1, '2025-12-26', '2025-12-26'),
(46, 17, 123123.00, '2025-12-28', 0, 1, '2025-12-28', '2025-12-28'),
(47, 42, 117290.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(48, 43, 4250.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(49, 44, 74.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(50, 45, 52278.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(51, 46, 56993.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(52, 47, 650.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(53, 48, 38991.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(54, 49, 110080.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(55, 50, 16758.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(56, 51, 87600.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(57, 52, 31595.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(58, 53, 31595.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(59, 54, 74690.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(62, 133, 114730.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(63, 134, 137676.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(64, 104, 3323.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(65, 135, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(66, 117, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(67, 137, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(68, 152, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(69, 117, 11926.81, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(70, 108, 344190.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(71, 109, 195040.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(72, 113, 5151.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(73, 117, 75928.88, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(74, 110, 229460.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(75, 117, 35853.12, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(76, 111, 114730.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(77, 112, 309771.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(78, 117, 13477.90, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(93, 102, 114730.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(94, 103, 137676.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(95, 105, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(96, 106, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(97, 107, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(98, 114, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(99, 115, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(100, 116, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(101, 118, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(102, 119, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(103, 136, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(104, 138, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(105, 139, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(106, 140, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(107, 148, 114730.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(108, 149, 137676.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(109, 150, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(110, 151, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(111, 153, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(112, 154, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(113, 155, 4259.36, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(114, 163, 114730.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(115, 164, 137676.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(116, 165, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(117, 166, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(118, 167, 340749.00, '2025-12-28', 1, 1, '2025-12-28', '2025-12-28'),
(119, 17, 456789.00, '2025-12-31', 1, 1, '2025-12-31', '2025-12-31');

-- --------------------------------------------------------

--
-- Table structure for table `mes`
--

CREATE TABLE `mes` (
  `idmes` int(11) NOT NULL,
  `mes` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Dumping data for table `mes`
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
-- Table structure for table `ordenes_compra`
--

CREATE TABLE `ordenes_compra` (
  `id_orden_compra` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_provedor` int(11) DEFAULT NULL,
  `numero_orden` varchar(50) DEFAULT NULL,
  `fecha_orden` datetime NOT NULL DEFAULT current_timestamp(),
  `numero_factura` varchar(100) DEFAULT NULL,
  `fecha_factura` date DEFAULT NULL,
  `subtotal` decimal(14,2) DEFAULT 0.00,
  `impuestos` decimal(14,2) DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `estado` varchar(50) NOT NULL DEFAULT 'pendiente',
  `observaciones` text DEFAULT NULL,
  `fecha_aprobacion` datetime DEFAULT NULL,
  `aprobado_por` int(11) DEFAULT NULL,
  `idusuario` int(11) DEFAULT NULL,
  `id_orden_original` int(11) DEFAULT NULL COMMENT 'Para órdenes complementarias',
  `es_complementaria` tinyint(1) DEFAULT 0,
  `motivo_complementaria` text DEFAULT NULL,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp(),
  `fechaupdate` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ordenes_compra`
--

INSERT INTO `ordenes_compra` (`id_orden_compra`, `id_pedido`, `id_provedor`, `numero_orden`, `fecha_orden`, `numero_factura`, `fecha_factura`, `subtotal`, `impuestos`, `total`, `estado`, `observaciones`, `fecha_aprobacion`, `aprobado_por`, `idusuario`, `id_orden_original`, `es_complementaria`, `motivo_complementaria`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 1, 'OC-2026-0001', '2026-01-17 01:25:52', '123123', '2026-01-17', 660480.00, 105676.80, 766156.80, 'comprada', '', NULL, NULL, 1, NULL, 0, NULL, '2026-01-17 01:25:52', '2026-01-17 01:27:31');

--
-- Triggers `ordenes_compra`
--
DELIMITER $$
CREATE TRIGGER `tr_actualizar_estado_compra_pedido` AFTER UPDATE ON `ordenes_compra` FOR EACH ROW BEGIN
    UPDATE pedidos p
    SET p.estado_compra = (
        SELECT 
            CASE 
                WHEN COALESCE(SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END), 0) >= p.total THEN 'completado'
                WHEN COALESCE(SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END), 0) > 0 THEN 'parcialmente_comprado'
                ELSE 'pendiente'
            END
        FROM ordenes_compra oc
        WHERE oc.id_pedido = p.id_pedido
    )
    WHERE p.id_pedido = NEW.id_pedido;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `ordenes_compra_detalle`
--

CREATE TABLE `ordenes_compra_detalle` (
  `id_orden_detalle` int(11) NOT NULL,
  `id_orden_compra` int(11) NOT NULL,
  `id_det_pedido` int(11) DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `unidad` varchar(50) DEFAULT NULL,
  `cantidad_solicitada` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `cantidad_comprada` decimal(14,4) DEFAULT 0.0000,
  `cantidad_recibida` decimal(14,4) DEFAULT 0.0000,
  `fecha_recepcion` datetime DEFAULT NULL,
  `precio_unitario` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ordenes_compra_detalle`
--

INSERT INTO `ordenes_compra_detalle` (`id_orden_detalle`, `id_orden_compra`, `id_det_pedido`, `descripcion`, `unidad`, `cantidad_solicitada`, `cantidad_comprada`, `cantidad_recibida`, `fecha_recepcion`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 1, 'CODO PRS R13 45 X 3\"', 'UND', 6.0000, 6.0000, 6.0000, '2026-01-17 01:27:31', 110080.0000, 660480.00);

-- --------------------------------------------------------

--
-- Table structure for table `pagina`
--

CREATE TABLE `pagina` (
  `Idpagina` int(11) NOT NULL,
  `url` varchar(50) DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `paginaperfil`
--

CREATE TABLE `paginaperfil` (
  `Id` int(11) NOT NULL,
  `idpagina` int(11) NOT NULL DEFAULT 0,
  `perfil` int(11) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `paginaperfil`
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
-- Table structure for table `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL COMMENT 'ID único del pedido',
  `id_presupuesto` int(11) NOT NULL COMMENT 'Referencia al presupuesto',
  `fecha_pedido` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora del pedido',
  `estado` varchar(50) NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del pedido: pendiente, aprobado, rechazado, entregado',
  `estado_compra` varchar(50) DEFAULT 'pendiente',
  `total` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto total del pedido',
  `observaciones` text DEFAULT NULL COMMENT 'Observaciones adicionales del pedido',
  `idusuario` int(4) NOT NULL COMMENT 'Usuario que creó el pedido',
  `fechareg` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de registro',
  `fechaupdate` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Fecha de última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Pedidos de materiales';

--
-- Dumping data for table `pedidos`
--

INSERT INTO `pedidos` (`id_pedido`, `id_presupuesto`, `fecha_pedido`, `estado`, `estado_compra`, `total`, `observaciones`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 2, '2026-01-17 01:25:41', 'comprado', 'completado', 660480.00, 'Pedido normal (dentro de presupuesto) | Total componentes normales: 1', 1, '2026-01-17 01:25:41', '2026-01-17 01:27:31');

-- --------------------------------------------------------

--
-- Table structure for table `pedidos_detalle`
--

CREATE TABLE `pedidos_detalle` (
  `id_det_pedido` int(11) NOT NULL COMMENT 'ID único del detalle',
  `id_pedido` int(11) NOT NULL COMMENT 'Referencia al pedido',
  `id_componente` int(11) DEFAULT NULL,
  `tipo_componente` enum('material','mano_obra','equipo','transporte','otro') NOT NULL,
  `id_item` int(11) DEFAULT NULL,
  `id_material_extra` int(11) DEFAULT NULL,
  `cantidad` decimal(12,2) NOT NULL COMMENT 'Cantidad solicitada',
  `precio_unitario` decimal(12,2) NOT NULL COMMENT 'Precio unitario al momento del pedido',
  `subtotal` decimal(14,2) NOT NULL COMMENT 'Subtotal (cantidad * precio_unitario)',
  `fechareg` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de registro',
  `justificacion` text DEFAULT NULL COMMENT 'Justificación cuando se excede el presupuesto',
  `es_excedente` tinyint(1) DEFAULT 0 COMMENT '1 si es excedente del presupuesto, 0 si es pedido normal'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Detalle de pedidos';

--
-- Dumping data for table `pedidos_detalle`
--

INSERT INTO `pedidos_detalle` (`id_det_pedido`, `id_pedido`, `id_componente`, `tipo_componente`, `id_item`, `id_material_extra`, `cantidad`, `precio_unitario`, `subtotal`, `fechareg`, `justificacion`, `es_excedente`) VALUES
(1, 1, 102, 'material', 25, NULL, 6.00, 110080.00, 660480.00, '2026-01-17 01:25:41', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `perfiles`
--

CREATE TABLE `perfiles` (
  `codigo_perfil` varchar(50) NOT NULL DEFAULT '',
  `descripcion_perfil` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `perfiles`
--

INSERT INTO `perfiles` (`codigo_perfil`, `descripcion_perfil`) VALUES
('1', 'Administrador'),
('2', 'Gestor Presupuesto'),
('3', 'Usuario');

-- --------------------------------------------------------

--
-- Table structure for table `perfilprov`
--

CREATE TABLE `perfilprov` (
  `idperfilprov` int(11) NOT NULL,
  `perfilprov` varchar(50) NOT NULL,
  `estado` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permisoperfil`
--

CREATE TABLE `permisoperfil` (
  `idpermisoperfil` int(11) NOT NULL,
  `idpemisoperfil` int(11) NOT NULL,
  `idusuario` int(11) NOT NULL,
  `estado` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `permisoperfil`
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
-- Table structure for table `presupuestos`
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
-- Dumping data for table `presupuestos`
--

INSERT INTO `presupuestos` (`id_presupuesto`, `id_proyecto`, `fecha_creacion`, `monto_total`, `porcentaje_administracion`, `porcentaje_imprevistos`, `porcentaje_utilidad`, `porcentaje_iva`, `observaciones`, `idusuario`, `fchreg`, `idestado`, `fupdate`) VALUES
(1, 2, '2025-10-01', 125458523.00, 21.00, 1.00, 8.00, 19.00, 0x657374657320657320756e20707265737570756573746f20696e696369616c, 1, '2025-10-13', 1, '2025-10-13'),
(2, 1, '2025-10-15', 200000000.00, 21.00, 1.00, 8.00, 19.00, 0x507275656261, 1, '2025-10-14', 1, '2025-10-14');

-- --------------------------------------------------------

--
-- Table structure for table `provedores`
--

CREATE TABLE `provedores` (
  `id_provedor` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(50) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `idusuario` int(11) DEFAULT NULL,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp(),
  `fechaupdate` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `provedores`
--

INSERT INTO `provedores` (`id_provedor`, `nombre`, `telefono`, `email`, `whatsapp`, `direccion`, `contacto`, `estado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 'algo', '1231231233', 'algo@gmail.com', '1231231233333333', 'algo', 'provedor', 1, NULL, '2025-12-16 11:55:41', '2025-12-20 10:58:09'),
(2, 'algo 2', '2342342344', 'algo2gmail.com', '2342342344', 'algo2', 'provedor2', 1, NULL, '2025-12-16 11:58:40', '2025-12-20 10:58:19');

-- --------------------------------------------------------

--
-- Table structure for table `proyectos`
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
-- Dumping data for table `proyectos`
--

INSERT INTO `proyectos` (`id_proyecto`, `nombre`, `objeto`, `numero_contrato`, `valor`, `id_cliente`, `fecha_inicio`, `fecha_fin`, `estado`, `observaciones`) VALUES
(1, 'proyecto de prueba', NULL, NULL, 0.00, 1, '2025-10-01', '2025-12-31', 1, 'prueba\n'),
(2, 'Proyecto 2', NULL, NULL, 0.00, 3, '2025-01-01', '2025-12-31', 1, 'Este es el proyecto');

-- --------------------------------------------------------

--
-- Table structure for table `resp_proyecto`
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
-- Dumping data for table `resp_proyecto`
--

INSERT INTO `resp_proyecto` (`id_resp_proyecto`, `id_proyecto`, `id_usuario`, `idtiporesp`, `estado`, `idusuario`, `fechareg`, `fechaupdate`) VALUES
(1, 1, 2, 1, 1, 1, '2025-10-13', '2025-10-13'),
(2, 2, 2, 1, 1, 1, '2025-10-14', '2025-10-14');

-- --------------------------------------------------------

--
-- Table structure for table `soporteproy`
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
-- Dumping data for table `soporteproy`
--

INSERT INTO `soporteproy` (`idsoporteproy`, `id_proyecto`, `idtiposopproy`, `observacion`, `idusuario`, `archivo`, `fechareg`, `id_estado`) VALUES
(1, 2, 10, 0x646664666466, 1, 0x363865653739663361653865315f616d617a6f6e2e6a7067, '2025-10-14', 1),
(2, 1, 2, 0x4163746120646520696e6963696f2064656c2070726f796563746f, 1, 0x363865656165626134656163355f3133333536383933383339383636333639392e6a7067, '2025-10-14', 1),
(3, 2, 7, 0x666764676466676467, 1, '', '2025-10-30', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tiposopproy`
--

CREATE TABLE `tiposopproy` (
  `idtiposopproy` int(3) NOT NULL,
  `desctiposoport` varchar(50) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tiposopproy`
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
-- Table structure for table `tipo_item`
--

CREATE TABLE `tipo_item` (
  `id_tipo_item` int(3) NOT NULL,
  `desc_tipo` varchar(100) NOT NULL,
  `prefijo_codigo` varchar(10) DEFAULT NULL COMMENT 'Prefijo para códigos (ej: ME, 330, 100)',
  `id_estado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tipo_item`
--

INSERT INTO `tipo_item` (`id_tipo_item`, `desc_tipo`, `prefijo_codigo`, `id_estado`) VALUES
(1, 'Mezclas y Morteros', 'ME', 1),
(2, 'Señalización y Tráfico', '330', 1),
(3, 'Movimiento de Tierra', '100', 1),
(4, 'Tuberías y Accesorios PVC', '165', 1),
(5, 'Pavimentos', '085', 1),
(6, 'Estructuras y Obras Complementarias', '020', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tipo_material`
--

CREATE TABLE `tipo_material` (
  `id_tipo_material` int(11) NOT NULL,
  `desc_tipo` varchar(150) NOT NULL,
  `estado` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tipo_material`
--

INSERT INTO `tipo_material` (`id_tipo_material`, `desc_tipo`, `estado`) VALUES
(1, 'Mano de Obra', 1),
(2, 'Materiales', 1),
(3, 'Equipo', 1),
(4, 'Otros', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tipo_respo`
--

CREATE TABLE `tipo_respo` (
  `idtiporesp` int(3) NOT NULL,
  `desctiporesp` varchar(100) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tipo_respo`
--

INSERT INTO `tipo_respo` (`idtiporesp`, `desctiporesp`, `id_estado`) VALUES
(1, 'Cargue de Presupuesto', 1),
(2, 'Modificar Presupuesto', 1),
(3, 'Consultar Presupuesto', 1);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_pedidos_con_ordenes`
-- (See below for the actual view)
--
CREATE TABLE `vw_pedidos_con_ordenes` (
`id_pedido` int(11)
,`fecha_pedido` datetime
,`estado` varchar(50)
,`estado_compra` varchar(50)
,`total_pedido` decimal(14,2)
,`cantidad_ordenes` bigint(21)
,`total_comprado` decimal(36,2)
,`total_pendiente` decimal(36,2)
,`saldo_pendiente` decimal(37,2)
,`estado_calculado` varchar(21)
);

-- --------------------------------------------------------

--
-- Structure for view `vw_pedidos_con_ordenes`
--
DROP TABLE IF EXISTS `vw_pedidos_con_ordenes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_pedidos_con_ordenes`  AS SELECT `p`.`id_pedido` AS `id_pedido`, `p`.`fecha_pedido` AS `fecha_pedido`, `p`.`estado` AS `estado`, coalesce(`p`.`estado_compra`,'pendiente') AS `estado_compra`, `p`.`total` AS `total_pedido`, count(distinct `oc`.`id_orden_compra`) AS `cantidad_ordenes`, sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end) AS `total_comprado`, sum(case when `oc`.`estado` in ('pendiente','aprobada') then `oc`.`total` else 0 end) AS `total_pendiente`, `p`.`total`- coalesce(sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end),0) AS `saldo_pendiente`, CASE WHEN coalesce(sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end),0) >= `p`.`total` THEN 'completado' WHEN coalesce(sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end),0) > 0 THEN 'parcialmente_comprado' ELSE 'pendiente' END AS `estado_calculado` FROM (`pedidos` `p` left join `ordenes_compra` `oc` on(`p`.`id_pedido` = `oc`.`id_pedido`)) GROUP BY `p`.`id_pedido`, `p`.`fecha_pedido`, `p`.`estado`, `p`.`estado_compra`, `p`.`total` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `capitulos`
--
ALTER TABLE `capitulos`
  ADD PRIMARY KEY (`id_capitulo`),
  ADD KEY `fk_cap_presupuesto` (`id_presupuesto`);

--
-- Indexes for table `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `nit` (`nit`);

--
-- Indexes for table `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id_compra`),
  ADD KEY `idx_compras_pedido` (`id_pedido`),
  ADD KEY `idx_compras_provedor` (`id_provedor`),
  ADD KEY `idx_compras_estado` (`estado`),
  ADD KEY `idx_compras_fecha` (`fecha_compra`),
  ADD KEY `idx_orden_compra` (`id_orden_compra`);

--
-- Indexes for table `compras_detalle`
--
ALTER TABLE `compras_detalle`
  ADD PRIMARY KEY (`id_compra_detalle`),
  ADD KEY `idx_compra_detalle_compra` (`id_compra`),
  ADD KEY `idx_compra_detalle_pedido_detalle` (`id_det_pedido`),
  ADD KEY `id_provedor` (`id_provedor`);

--
-- Indexes for table `compras_finales`
--
ALTER TABLE `compras_finales`
  ADD PRIMARY KEY (`id_compra_final`),
  ADD KEY `idx_orden_compra` (`id_orden_compra`);

--
-- Indexes for table `compras_provedores`
--
ALTER TABLE `compras_provedores`
  ADD PRIMARY KEY (`id_compra`,`id_provedor`),
  ADD KEY `idx_cp_id_provedor` (`id_provedor`);

--
-- Indexes for table `compras_proveedores`
--
ALTER TABLE `compras_proveedores`
  ADD PRIMARY KEY (`id_compra_proveedor`),
  ADD KEY `idx_compras_proveedores_compra` (`id_compra`),
  ADD KEY `idx_compras_proveedores_proveedor` (`id_provedor`);

--
-- Indexes for table `costos_ind`
--
ALTER TABLE `costos_ind`
  ADD PRIMARY KEY (`idcostosind`);

--
-- Indexes for table `det_presupuesto`
--
ALTER TABLE `det_presupuesto`
  ADD PRIMARY KEY (`id_det_presupuesto`),
  ADD KEY `fk_det_presupuesto` (`id_presupuesto`),
  ADD KEY `fk_det_material` (`id_material`),
  ADD KEY `fk_det_capitulo` (`id_capitulo`),
  ADD KEY `fk_det_mat_precio` (`id_mat_precio`),
  ADD KEY `idx_item` (`id_item`);

--
-- Indexes for table `estado_pedido`
--
ALTER TABLE `estado_pedido`
  ADD PRIMARY KEY (`id_estado_pedido`);

--
-- Indexes for table `gr_auth_reset_password`
--
ALTER TABLE `gr_auth_reset_password`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gr_paginaperfil`
--
ALTER TABLE `gr_paginaperfil`
  ADD PRIMARY KEY (`Id`);

--
-- Indexes for table `gr_tipodoc`
--
ALTER TABLE `gr_tipodoc`
  ADD PRIMARY KEY (`idtipodoc`);

--
-- Indexes for table `gr_unidad`
--
ALTER TABLE `gr_unidad`
  ADD PRIMARY KEY (`idunidad`);

--
-- Indexes for table `gr_usuarios`
--
ALTER TABLE `gr_usuarios`
  ADD PRIMARY KEY (`u_id`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id_item`),
  ADD UNIQUE KEY `codigo_item` (`codigo_item`),
  ADD KEY `idx_estado` (`idestado`),
  ADD KEY `idx_item_padre` (`id_item_padre`),
  ADD KEY `fk_item_tipo` (`id_tipo_item`);

--
-- Indexes for table `item_componentes`
--
ALTER TABLE `item_componentes`
  ADD PRIMARY KEY (`id_componente`),
  ADD KEY `idx_item` (`id_item`),
  ADD KEY `idx_material` (`id_material`),
  ADD KEY `idx_tipo` (`tipo_componente`);

--
-- Indexes for table `item_composicion`
--
ALTER TABLE `item_composicion`
  ADD PRIMARY KEY (`id_composicion`),
  ADD UNIQUE KEY `uk_composicion` (`id_item_compuesto`,`id_item_componente`),
  ADD KEY `idx_compuesto` (`id_item_compuesto`),
  ADD KEY `idx_componente` (`id_item_componente`),
  ADD KEY `idx_compuesto_nivel` (`id_item_compuesto`,`nivel`),
  ADD KEY `idx_componente_nivel` (`id_item_componente`,`nivel`);

--
-- Indexes for table `log_recepciones`
--
ALTER TABLE `log_recepciones`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `idx_id_compra` (`id_compra`),
  ADD KEY `idx_id_orden_compra` (`id_orden_compra`),
  ADD KEY `idx_id_det_pedido` (`id_det_pedido`);

--
-- Indexes for table `materiales`
--
ALTER TABLE `materiales`
  ADD PRIMARY KEY (`id_material`),
  ADD KEY `fk_material_tipo` (`id_tipo_material`);

--
-- Indexes for table `materiales_extra_presupuesto`
--
ALTER TABLE `materiales_extra_presupuesto`
  ADD PRIMARY KEY (`id_material_extra`),
  ADD KEY `id_presupuesto` (`id_presupuesto`),
  ADD KEY `id_material` (`id_material`),
  ADD KEY `id_capitulo` (`id_capitulo`);

--
-- Indexes for table `material_precio`
--
ALTER TABLE `material_precio`
  ADD PRIMARY KEY (`id_mat_precio`),
  ADD KEY `fk_mat_precio_material` (`id_material`);

--
-- Indexes for table `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  ADD PRIMARY KEY (`id_orden_compra`),
  ADD KEY `idx_pedido` (`id_pedido`),
  ADD KEY `idx_provedor` (`id_provedor`);

--
-- Indexes for table `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  ADD PRIMARY KEY (`id_orden_detalle`),
  ADD KEY `idx_orden_compra` (`id_orden_compra`),
  ADD KEY `idx_det_pedido` (`id_det_pedido`);

--
-- Indexes for table `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `idx_pedido_presupuesto` (`id_presupuesto`),
  ADD KEY `idx_pedido_estado` (`estado`),
  ADD KEY `idx_pedido_fecha` (`fecha_pedido`),
  ADD KEY `idx_pedido_usuario` (`idusuario`);

--
-- Indexes for table `pedidos_detalle`
--
ALTER TABLE `pedidos_detalle`
  ADD PRIMARY KEY (`id_det_pedido`),
  ADD KEY `idx_detpedido_pedido` (`id_pedido`),
  ADD KEY `idx_detpedido_componente` (`id_componente`),
  ADD KEY `idx_detpedido_item` (`id_item`);

--
-- Indexes for table `perfiles`
--
ALTER TABLE `perfiles`
  ADD PRIMARY KEY (`codigo_perfil`);

--
-- Indexes for table `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD PRIMARY KEY (`id_presupuesto`),
  ADD KEY `fk_presup_proyecto` (`id_proyecto`),
  ADD KEY `idx_presupuesto_estado` (`idestado`),
  ADD KEY `idx_presupuesto_proyecto` (`id_proyecto`);

--
-- Indexes for table `provedores`
--
ALTER TABLE `provedores`
  ADD PRIMARY KEY (`id_provedor`),
  ADD KEY `idx_provedores_nombre` (`nombre`),
  ADD KEY `idx_provedores_estado` (`estado`);

--
-- Indexes for table `proyectos`
--
ALTER TABLE `proyectos`
  ADD PRIMARY KEY (`id_proyecto`),
  ADD KEY `fk_proyecto_cliente` (`id_cliente`);

--
-- Indexes for table `resp_proyecto`
--
ALTER TABLE `resp_proyecto`
  ADD PRIMARY KEY (`id_resp_proyecto`),
  ADD KEY `fk_resp_proyecto` (`id_proyecto`);

--
-- Indexes for table `soporteproy`
--
ALTER TABLE `soporteproy`
  ADD PRIMARY KEY (`idsoporteproy`);

--
-- Indexes for table `tiposopproy`
--
ALTER TABLE `tiposopproy`
  ADD PRIMARY KEY (`idtiposopproy`);

--
-- Indexes for table `tipo_item`
--
ALTER TABLE `tipo_item`
  ADD PRIMARY KEY (`id_tipo_item`);

--
-- Indexes for table `tipo_material`
--
ALTER TABLE `tipo_material`
  ADD PRIMARY KEY (`id_tipo_material`);

--
-- Indexes for table `tipo_respo`
--
ALTER TABLE `tipo_respo`
  ADD PRIMARY KEY (`idtiporesp`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `capitulos`
--
ALTER TABLE `capitulos`
  MODIFY `id_capitulo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `compras`
--
ALTER TABLE `compras`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `compras_detalle`
--
ALTER TABLE `compras_detalle`
  MODIFY `id_compra_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `compras_finales`
--
ALTER TABLE `compras_finales`
  MODIFY `id_compra_final` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `compras_proveedores`
--
ALTER TABLE `compras_proveedores`
  MODIFY `id_compra_proveedor` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `costos_ind`
--
ALTER TABLE `costos_ind`
  MODIFY `idcostosind` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `det_presupuesto`
--
ALTER TABLE `det_presupuesto`
  MODIFY `id_det_presupuesto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `estado_pedido`
--
ALTER TABLE `estado_pedido`
  MODIFY `id_estado_pedido` int(3) NOT NULL AUTO_INCREMENT COMMENT 'ID del estado', AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `gr_auth_reset_password`
--
ALTER TABLE `gr_auth_reset_password`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gr_paginaperfil`
--
ALTER TABLE `gr_paginaperfil`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `gr_tipodoc`
--
ALTER TABLE `gr_tipodoc`
  MODIFY `idtipodoc` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `gr_unidad`
--
ALTER TABLE `gr_unidad`
  MODIFY `idunidad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `gr_usuarios`
--
ALTER TABLE `gr_usuarios`
  MODIFY `u_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `item_componentes`
--
ALTER TABLE `item_componentes`
  MODIFY `id_componente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- AUTO_INCREMENT for table `item_composicion`
--
ALTER TABLE `item_composicion`
  MODIFY `id_composicion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `log_recepciones`
--
ALTER TABLE `log_recepciones`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `materiales`
--
ALTER TABLE `materiales`
  MODIFY `id_material` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- AUTO_INCREMENT for table `materiales_extra_presupuesto`
--
ALTER TABLE `materiales_extra_presupuesto`
  MODIFY `id_material_extra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `material_precio`
--
ALTER TABLE `material_precio`
  MODIFY `id_mat_precio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  MODIFY `id_orden_compra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  MODIFY `id_orden_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único del pedido', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pedidos_detalle`
--
ALTER TABLE `pedidos_detalle`
  MODIFY `id_det_pedido` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único del detalle', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `presupuestos`
--
ALTER TABLE `presupuestos`
  MODIFY `id_presupuesto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `provedores`
--
ALTER TABLE `provedores`
  MODIFY `id_provedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `proyectos`
--
ALTER TABLE `proyectos`
  MODIFY `id_proyecto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `resp_proyecto`
--
ALTER TABLE `resp_proyecto`
  MODIFY `id_resp_proyecto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `soporteproy`
--
ALTER TABLE `soporteproy`
  MODIFY `idsoporteproy` int(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tiposopproy`
--
ALTER TABLE `tiposopproy`
  MODIFY `idtiposopproy` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tipo_item`
--
ALTER TABLE `tipo_item`
  MODIFY `id_tipo_item` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tipo_material`
--
ALTER TABLE `tipo_material`
  MODIFY `id_tipo_material` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tipo_respo`
--
ALTER TABLE `tipo_respo`
  MODIFY `idtiporesp` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `capitulos`
--
ALTER TABLE `capitulos`
  ADD CONSTRAINT `fk_cap_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`) ON DELETE CASCADE;

--
-- Constraints for table `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `fk_compras_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compras_provedor` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`) ON UPDATE CASCADE;

--
-- Constraints for table `compras_detalle`
--
ALTER TABLE `compras_detalle`
  ADD CONSTRAINT `compras_detalle_ibfk_1` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`),
  ADD CONSTRAINT `fk_compras_detalle_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compras_detalle_pedido_detalle` FOREIGN KEY (`id_det_pedido`) REFERENCES `pedidos_detalle` (`id_det_pedido`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `compras_provedores`
--
ALTER TABLE `compras_provedores`
  ADD CONSTRAINT `fk_cp_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cp_provedor` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`) ON UPDATE CASCADE;

--
-- Constraints for table `compras_proveedores`
--
ALTER TABLE `compras_proveedores`
  ADD CONSTRAINT `fk_compras_proveedores_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compras_proveedores_proveedor` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `det_presupuesto`
--
ALTER TABLE `det_presupuesto`
  ADD CONSTRAINT `fk_det_capitulo` FOREIGN KEY (`id_capitulo`) REFERENCES `capitulos` (`id_capitulo`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_det_mat_precio` FOREIGN KEY (`id_mat_precio`) REFERENCES `material_precio` (`id_mat_precio`),
  ADD CONSTRAINT `fk_det_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  ADD CONSTRAINT `fk_det_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_det_presupuesto_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`);

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_item_padre` FOREIGN KEY (`id_item_padre`) REFERENCES `items` (`id_item`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_item_tipo` FOREIGN KEY (`id_tipo_item`) REFERENCES `tipo_item` (`id_tipo_item`);

--
-- Constraints for table `item_componentes`
--
ALTER TABLE `item_componentes`
  ADD CONSTRAINT `fk_componente_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_componente_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`) ON DELETE SET NULL;

--
-- Constraints for table `item_composicion`
--
ALTER TABLE `item_composicion`
  ADD CONSTRAINT `item_composicion_ibfk_1` FOREIGN KEY (`id_item_compuesto`) REFERENCES `items` (`id_item`) ON DELETE CASCADE,
  ADD CONSTRAINT `item_composicion_ibfk_2` FOREIGN KEY (`id_item_componente`) REFERENCES `items` (`id_item`) ON DELETE CASCADE;

--
-- Constraints for table `materiales`
--
ALTER TABLE `materiales`
  ADD CONSTRAINT `fk_material_tipo` FOREIGN KEY (`id_tipo_material`) REFERENCES `tipo_material` (`id_tipo_material`);

--
-- Constraints for table `materiales_extra_presupuesto`
--
ALTER TABLE `materiales_extra_presupuesto`
  ADD CONSTRAINT `materiales_extra_presupuesto_ibfk_1` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`),
  ADD CONSTRAINT `materiales_extra_presupuesto_ibfk_2` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  ADD CONSTRAINT `materiales_extra_presupuesto_ibfk_3` FOREIGN KEY (`id_capitulo`) REFERENCES `capitulos` (`id_capitulo`);

--
-- Constraints for table `material_precio`
--
ALTER TABLE `material_precio`
  ADD CONSTRAINT `fk_mat_precio_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`) ON DELETE CASCADE;

--
-- Constraints for table `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedido_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pedidos_detalle`
--
ALTER TABLE `pedidos_detalle`
  ADD CONSTRAINT `fk_pedido_componente` FOREIGN KEY (`id_componente`) REFERENCES `item_componentes` (`id_componente`),
  ADD CONSTRAINT `fk_pedido_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`);

--
-- Constraints for table `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD CONSTRAINT `fk_presup_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE;

--
-- Constraints for table `proyectos`
--
ALTER TABLE `proyectos`
  ADD CONSTRAINT `fk_proyecto_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`);

--
-- Constraints for table `resp_proyecto`
--
ALTER TABLE `resp_proyecto`
  ADD CONSTRAINT `fk_resp_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

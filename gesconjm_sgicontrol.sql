-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 06-11-2025 a las 00:01:25
-- Versión del servidor: 10.11.11-MariaDB
-- Versión de PHP: 8.4.13

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `coop_perfiles`
--

CREATE TABLE `coop_perfiles` (
  `codigo_perfil` varchar(50) NOT NULL DEFAULT '',
  `descripcion_perfil` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `det_presupuesto`
--

CREATE TABLE `det_presupuesto` (
  `id_det_presupuesto` int(11) NOT NULL,
  `id_presupuesto` int(11) NOT NULL,
  `id_material` int(11) NOT NULL,
  `id_item` int(11) DEFAULT NULL COMMENT 'Referencia al ítem (APU)',
  `id_capitulo` int(11) NOT NULL,
  `id_mat_precio` int(11) NOT NULL,
  `cantidad` decimal(12,2) NOT NULL,
  `idestado` int(1) NOT NULL,
  `idusuario` int(4) NOT NULL,
  `fechareg` date NOT NULL,
  `fechaupdate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_paginaperfil`
--

CREATE TABLE `gr_paginaperfil` (
  `Id` int(11) NOT NULL,
  `idpagina` int(11) NOT NULL DEFAULT 0,
  `perfil` int(11) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_tipodoc`
--

CREATE TABLE `gr_tipodoc` (
  `idtipodoc` int(3) NOT NULL,
  `desctipdoc` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gr_unidad`
--

CREATE TABLE `gr_unidad` (
  `idunidad` int(11) NOT NULL,
  `unidesc` varchar(50) NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
  `idestado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mes`
--

CREATE TABLE `mes` (
  `idmes` int(11) NOT NULL,
  `mes` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_spanish_ci;

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
  `id_det_presupuesto` int(11) NOT NULL COMMENT 'Referencia al detalle del presupuesto',
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tiposopproy`
--

CREATE TABLE `tiposopproy` (
  `idtiposopproy` int(3) NOT NULL,
  `desctiposoport` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_material`
--

CREATE TABLE `tipo_material` (
  `id_tipo_material` int(11) NOT NULL,
  `desc_tipo` varchar(150) NOT NULL,
  `estado` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
  ADD KEY `idx_estado` (`idestado`);

--
-- Indices de la tabla `item_componentes`
--
ALTER TABLE `item_componentes`
  ADD PRIMARY KEY (`id_componente`),
  ADD KEY `idx_item` (`id_item`),
  ADD KEY `idx_material` (`id_material`),
  ADD KEY `idx_tipo` (`tipo_componente`);

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
  ADD KEY `idx_detpedido_detpresupuesto` (`id_det_presupuesto`);

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
  MODIFY `id_capitulo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `costos_ind`
--
ALTER TABLE `costos_ind`
  MODIFY `idcostosind` int(3) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `det_presupuesto`
--
ALTER TABLE `det_presupuesto`
  MODIFY `id_det_presupuesto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estado_pedido`
--
ALTER TABLE `estado_pedido`
  MODIFY `id_estado_pedido` int(3) NOT NULL AUTO_INCREMENT COMMENT 'ID del estado';

--
-- AUTO_INCREMENT de la tabla `gr_auth_reset_password`
--
ALTER TABLE `gr_auth_reset_password`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gr_paginaperfil`
--
ALTER TABLE `gr_paginaperfil`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gr_tipodoc`
--
ALTER TABLE `gr_tipodoc`
  MODIFY `idtipodoc` int(3) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gr_unidad`
--
ALTER TABLE `gr_unidad`
  MODIFY `idunidad` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gr_usuarios`
--
ALTER TABLE `gr_usuarios`
  MODIFY `u_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `items`
--
ALTER TABLE `items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `item_componentes`
--
ALTER TABLE `item_componentes`
  MODIFY `id_componente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materiales`
--
ALTER TABLE `materiales`
  MODIFY `id_material` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `material_precio`
--
ALTER TABLE `material_precio`
  MODIFY `id_mat_precio` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id_presupuesto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  MODIFY `id_proyecto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `resp_proyecto`
--
ALTER TABLE `resp_proyecto`
  MODIFY `id_resp_proyecto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `soporteproy`
--
ALTER TABLE `soporteproy`
  MODIFY `idsoporteproy` int(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tiposopproy`
--
ALTER TABLE `tiposopproy`
  MODIFY `idtiposopproy` int(3) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipo_material`
--
ALTER TABLE `tipo_material`
  MODIFY `id_tipo_material` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipo_respo`
--
ALTER TABLE `tipo_respo`
  MODIFY `idtiporesp` int(3) NOT NULL AUTO_INCREMENT;

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
-- Filtros para la tabla `item_componentes`
--
ALTER TABLE `item_componentes`
  ADD CONSTRAINT `fk_componente_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_componente_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`) ON DELETE SET NULL;

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

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-01-2026 a las 14:38:48
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
-- Estructura de tabla para la tabla `compras`
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_detalle`
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
-- Estructura de tabla para la tabla `compras_finales`
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
-- Estructura de tabla para la tabla `compras_provedores`
--

CREATE TABLE `compras_provedores` (
  `id_compra` int(11) NOT NULL,
  `id_provedor` int(11) NOT NULL,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_proveedores`
--

CREATE TABLE `compras_proveedores` (
  `id_compra_proveedor` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `id_provedor` int(11) NOT NULL,
  `fechareg` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `desccostoind` varchar(50) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
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
  `desc_estado` varchar(50) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL COMMENT 'Descripción del estado',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `items_backup_20251124`
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_componentes`
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_componentes_backup_20251124`
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
  `idestado` int(1) DEFAULT 1,
  `orden` int(4) DEFAULT 1 COMMENT 'Orden de visualización',
  `porcentaje_desperdicio` decimal(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de desperdicio',
  `es_referencia` tinyint(1) DEFAULT 0 COMMENT '1=Es referencia a otro item, 0=Componente directo'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item_composicion_backup_20251124`
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
  `cod_material` varchar(20) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
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
-- Estructura de tabla para la tabla `materiales_extra_presupuesto`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_compra`
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
-- Disparadores `ordenes_compra`
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
-- Estructura de tabla para la tabla `ordenes_compra_detalle`
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
  `estado_compra` varchar(50) DEFAULT 'pendiente',
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
  `id_material_extra` int(11) DEFAULT NULL,
  `cantidad` decimal(12,2) NOT NULL COMMENT 'Cantidad solicitada',
  `precio_unitario` decimal(12,2) NOT NULL COMMENT 'Precio unitario al momento del pedido',
  `subtotal` decimal(14,2) NOT NULL COMMENT 'Subtotal (cantidad * precio_unitario)',
  `fechareg` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de registro',
  `justificacion` text DEFAULT NULL COMMENT 'Justificación cuando se excede el presupuesto',
  `es_excedente` tinyint(1) DEFAULT 0 COMMENT '1 si es excedente del presupuesto, 0 si es pedido normal'
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
-- Estructura de tabla para la tabla `provedores`
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
  `desctiposoport` varchar(50) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_item`
--

CREATE TABLE `tipo_item` (
  `id_tipo_item` int(3) NOT NULL,
  `desc_tipo` varchar(100) NOT NULL,
  `prefijo_codigo` varchar(10) DEFAULT NULL COMMENT 'Prefijo para códigos (ej: ME, 330, 100)',
  `id_estado` int(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `desctiporesp` varchar(100) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `id_estado` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_pedidos_con_ordenes`
-- (Véase abajo para la vista actual)
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
-- Estructura para la vista `vw_pedidos_con_ordenes`
--
DROP TABLE IF EXISTS `vw_pedidos_con_ordenes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_pedidos_con_ordenes`  AS SELECT `p`.`id_pedido` AS `id_pedido`, `p`.`fecha_pedido` AS `fecha_pedido`, `p`.`estado` AS `estado`, coalesce(`p`.`estado_compra`,'pendiente') AS `estado_compra`, `p`.`total` AS `total_pedido`, count(distinct `oc`.`id_orden_compra`) AS `cantidad_ordenes`, sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end) AS `total_comprado`, sum(case when `oc`.`estado` in ('pendiente','aprobada') then `oc`.`total` else 0 end) AS `total_pendiente`, `p`.`total`- coalesce(sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end),0) AS `saldo_pendiente`, CASE WHEN coalesce(sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end),0) >= `p`.`total` THEN 'completado' WHEN coalesce(sum(case when `oc`.`estado` = 'comprada' then `oc`.`total` else 0 end),0) > 0 THEN 'parcialmente_comprado' ELSE 'pendiente' END AS `estado_calculado` FROM (`pedidos` `p` left join `ordenes_compra` `oc` on(`p`.`id_pedido` = `oc`.`id_pedido`)) GROUP BY `p`.`id_pedido`, `p`.`fecha_pedido`, `p`.`estado`, `p`.`estado_compra`, `p`.`total` ;

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
-- Indices de la tabla `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id_compra`),
  ADD KEY `idx_compras_pedido` (`id_pedido`),
  ADD KEY `idx_compras_provedor` (`id_provedor`),
  ADD KEY `idx_compras_estado` (`estado`),
  ADD KEY `idx_compras_fecha` (`fecha_compra`),
  ADD KEY `idx_orden_compra` (`id_orden_compra`);

--
-- Indices de la tabla `compras_detalle`
--
ALTER TABLE `compras_detalle`
  ADD PRIMARY KEY (`id_compra_detalle`),
  ADD KEY `idx_compra_detalle_compra` (`id_compra`),
  ADD KEY `idx_compra_detalle_pedido_detalle` (`id_det_pedido`),
  ADD KEY `id_provedor` (`id_provedor`);

--
-- Indices de la tabla `compras_finales`
--
ALTER TABLE `compras_finales`
  ADD PRIMARY KEY (`id_compra_final`),
  ADD KEY `idx_orden_compra` (`id_orden_compra`);

--
-- Indices de la tabla `compras_provedores`
--
ALTER TABLE `compras_provedores`
  ADD PRIMARY KEY (`id_compra`,`id_provedor`),
  ADD KEY `idx_cp_id_provedor` (`id_provedor`);

--
-- Indices de la tabla `compras_proveedores`
--
ALTER TABLE `compras_proveedores`
  ADD PRIMARY KEY (`id_compra_proveedor`),
  ADD KEY `idx_compras_proveedores_compra` (`id_compra`),
  ADD KEY `idx_compras_proveedores_proveedor` (`id_provedor`);

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
  ADD KEY `idx_item_padre` (`id_item_padre`),
  ADD KEY `fk_item_tipo` (`id_tipo_item`);

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
  ADD KEY `idx_componente` (`id_item_componente`),
  ADD KEY `idx_compuesto_nivel` (`id_item_compuesto`,`nivel`),
  ADD KEY `idx_componente_nivel` (`id_item_componente`,`nivel`);

--
-- Indices de la tabla `materiales`
--
ALTER TABLE `materiales`
  ADD PRIMARY KEY (`id_material`),
  ADD KEY `fk_material_tipo` (`id_tipo_material`);

--
-- Indices de la tabla `materiales_extra_presupuesto`
--
ALTER TABLE `materiales_extra_presupuesto`
  ADD PRIMARY KEY (`id_material_extra`),
  ADD KEY `id_presupuesto` (`id_presupuesto`),
  ADD KEY `id_material` (`id_material`),
  ADD KEY `id_capitulo` (`id_capitulo`);

--
-- Indices de la tabla `material_precio`
--
ALTER TABLE `material_precio`
  ADD PRIMARY KEY (`id_mat_precio`),
  ADD KEY `fk_mat_precio_material` (`id_material`);

--
-- Indices de la tabla `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  ADD PRIMARY KEY (`id_orden_compra`),
  ADD KEY `idx_pedido` (`id_pedido`),
  ADD KEY `idx_provedor` (`id_provedor`);

--
-- Indices de la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  ADD PRIMARY KEY (`id_orden_detalle`),
  ADD KEY `idx_orden_compra` (`id_orden_compra`),
  ADD KEY `idx_det_pedido` (`id_det_pedido`);

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
-- Indices de la tabla `provedores`
--
ALTER TABLE `provedores`
  ADD PRIMARY KEY (`id_provedor`),
  ADD KEY `idx_provedores_nombre` (`nombre`),
  ADD KEY `idx_provedores_estado` (`estado`);

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
-- Indices de la tabla `tipo_item`
--
ALTER TABLE `tipo_item`
  ADD PRIMARY KEY (`id_tipo_item`);

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
-- AUTO_INCREMENT de la tabla `compras`
--
ALTER TABLE `compras`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compras_detalle`
--
ALTER TABLE `compras_detalle`
  MODIFY `id_compra_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compras_finales`
--
ALTER TABLE `compras_finales`
  MODIFY `id_compra_final` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compras_proveedores`
--
ALTER TABLE `compras_proveedores`
  MODIFY `id_compra_proveedor` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT de la tabla `item_composicion`
--
ALTER TABLE `item_composicion`
  MODIFY `id_composicion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materiales`
--
ALTER TABLE `materiales`
  MODIFY `id_material` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materiales_extra_presupuesto`
--
ALTER TABLE `materiales_extra_presupuesto`
  MODIFY `id_material_extra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `material_precio`
--
ALTER TABLE `material_precio`
  MODIFY `id_mat_precio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  MODIFY `id_orden_compra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  MODIFY `id_orden_detalle` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT de la tabla `provedores`
--
ALTER TABLE `provedores`
  MODIFY `id_provedor` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT de la tabla `tipo_item`
--
ALTER TABLE `tipo_item`
  MODIFY `id_tipo_item` int(3) NOT NULL AUTO_INCREMENT;

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
-- Filtros para la tabla `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `fk_compras_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compras_provedor` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `compras_detalle`
--
ALTER TABLE `compras_detalle`
  ADD CONSTRAINT `compras_detalle_ibfk_1` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`),
  ADD CONSTRAINT `fk_compras_detalle_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compras_detalle_pedido_detalle` FOREIGN KEY (`id_det_pedido`) REFERENCES `pedidos_detalle` (`id_det_pedido`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `compras_provedores`
--
ALTER TABLE `compras_provedores`
  ADD CONSTRAINT `fk_cp_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cp_provedor` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `compras_proveedores`
--
ALTER TABLE `compras_proveedores`
  ADD CONSTRAINT `fk_compras_proveedores_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compras_proveedores_proveedor` FOREIGN KEY (`id_provedor`) REFERENCES `provedores` (`id_provedor`) ON DELETE CASCADE ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_item_padre` FOREIGN KEY (`id_item_padre`) REFERENCES `items` (`id_item`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_item_tipo` FOREIGN KEY (`id_tipo_item`) REFERENCES `tipo_item` (`id_tipo_item`);

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
-- Filtros para la tabla `materiales_extra_presupuesto`
--
ALTER TABLE `materiales_extra_presupuesto`
  ADD CONSTRAINT `materiales_extra_presupuesto_ibfk_1` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`),
  ADD CONSTRAINT `materiales_extra_presupuesto_ibfk_2` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  ADD CONSTRAINT `materiales_extra_presupuesto_ibfk_3` FOREIGN KEY (`id_capitulo`) REFERENCES `capitulos` (`id_capitulo`);

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

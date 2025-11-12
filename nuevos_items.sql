-- =====================================================
-- SCRIPT DE MIGRACIÓN: APU A ESTRUCTURA ITEMS/COMPONENTES
-- Fecha: 2025-11-05
-- Descripción: Elimina datos antiguos y carga estructura correcta de ítems con componentes
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- PASO 1: LIMPIEZA DE DATOS ANTIGUOS
-- =====================================================

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tabla de componentes de ítems
TRUNCATE TABLE `item_componentes`;

-- Limpiar tabla de ítems
TRUNCATE TABLE `items`;

-- Limpiar detalle de presupuestos (relación con ítems antiguos)
DELETE FROM `det_presupuesto` WHERE `id_item` IS NOT NULL;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- PASO 2: INSERCIÓN DE ÍTEMS PRINCIPALES (APU)
-- =====================================================

-- Ítem 1: MEZCLA CONCRETO 1:2:4 2500 PSI - 17,5 Mpa
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('ME0109', 'MEZCLA CONCRETO 1:2:4 2500 PSI - 17,5 Mpa', 'M3', 'Mezcla de concreto con resistencia de 2500 PSI (17.5 MPa)', 388523.00, 1, 1);

SET @item_me0109 = LAST_INSERT_ID();

-- Componentes - Materiales
INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_me0109, 'material', 'AGUA', 'LT', 164.8000, 74.00, 1),
(@item_me0109, 'material', 'ARENA DE TRITURACIÓN Y/O ARENA GRUESA DE RIO', 'M3', 0.5356, 52278.00, 1),
(@item_me0109, 'material', 'GRAVA TRITURADA 3/4"', 'M3', 0.9682, 87600.00, 1),
(@item_me0109, 'material', 'GASOLINA CORRIENTE', 'GLN', 0.1000, 16758.00, 1),
(@item_me0109, 'material', 'CEMENTO GRIS PORTLAND', 'KG', 272.9500, 650.00, 1),
(@item_me0109, 'material', 'ACEITE MOTOR 4 TIEMPOS', 'GLN', 0.0060, 117290.00, 1);

-- Componentes - Mano de Obra
INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_me0109, 'mano_obra', 'M.O. 3 AYUDANTES (Jornal 191,217 + 180% Prestaciones)', 'DIA', 0.1852, 344190.00, 1),
(@item_me0109, 'mano_obra', 'M.O. 1 OFICIAL (Jornal 108,356 + 180% Prestaciones)', 'DIA', 0.0625, 195040.00, 1);

-- Componentes - Equipo
INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_me0109, 'equipo', 'MEZCLADORA DE 9 PIES CUBICOS', 'H', 0.4800, 5151.00, 1),
(@item_me0109, 'equipo', 'HERRAMIENTA MENOR (7% de Mano de Obra)', 'GL', 0.0700, 75928.88, 1);

-- =====================================================

-- Ítem 2: MORTERO 1:3
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('ME0201', 'MORTERO 1:3', 'M3', 'Mortero con proporción 1:3 (cemento:arena)', 409265.00, 1, 1);

SET @item_me0201 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_me0201, 'material', 'AGUA', 'LT', 220.0000, 74.00, 1),
(@item_me0201, 'material', 'ARENA MEDIA DE RIO Y/O DE TRITURACIÓN', 'M3', 1.0900, 56993.00, 1),
(@item_me0201, 'material', 'CEMENTO GRIS PORTLAND', 'KG', 450.0000, 650.00, 1),
(@item_me0201, 'mano_obra', 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.1563, 229460.00, 1),
(@item_me0201, 'equipo', 'HERRAMIENTA MENOR (7% de Mano de Obra)', 'GL', 0.0700, 35853.12, 1);

-- =====================================================

-- Ítem 3: CINTA SEGURIDAD PREVENTIVA
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('330301', 'CINTA SEGURIDAD PREVENTIVA A=8CM-250MTS', 'UND', 'Instalación de cinta de seguridad preventiva con ancho 8cm, longitud 250 metros', 200842.00, 1, 1);

SET @item_330301 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_330301, 'material', 'CINTA SEGURIDAD PREVENTIVA 300 M', 'ROLLO', 1.0000, 38991.00, 1),
(@item_330301, 'material', 'ACERO DE REFUERZO 60.000 PSI 420 MPA', 'KG', 12.0000, 4250.00, 1),
(@item_330301, 'material', 'MEZCLA CONCRETO 1:2.5:4 2500 PSI-17.5MPa', 'M3', 0.1250, 388523.00, 1),
(@item_330301, 'mano_obra', 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0500, 114730.00, 1),
(@item_330301, 'mano_obra', 'M.O. 1 AYUDANTE + 1 OFICIAL (Jornal 172,095 + 180% Prestaciones)', 'DIA', 0.0250, 309771.00, 1),
(@item_330301, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 13477.90, 1);

-- =====================================================

-- Ítem 4: BARRICADA Y DESVIO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('330306', 'BARRICADA Y DESVIO TIPO SR-102', 'DIA', 'Suministro e instalación de barricada y desvío de tráfico tipo SR-102', 21948.00, 1, 1);

SET @item_330306 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_330306, 'mano_obra', 'AUXILIAR OFICIOS VARIOS DIURNO (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0126, 114730.00, 1),
(@item_330306, 'equipo', 'BARRICADA Y DESVIO TIPO SR-102', 'DIA', 1.0000, 15247.00, 1);

-- =====================================================

-- Ítem 5: CORTADORA DE PAVIMENTO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('330127', 'CORTADORA DE PAVIMENTO DE 4 A 7 CM', 'M', 'Corte de pavimento con profundidad de 4 a 7 cm', 9675.00, 1, 1);

SET @item_330127 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_330127, 'equipo', 'CORTADORA DE PAVIMENTO DE 4 A 7 CM', 'M', 1.0000, 7356.00, 1);

-- =====================================================

-- Ítem 6: DEMOLICION PAVIMENTO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('100424', 'DEMOLICION PAVIMENTO CONCRETO E=20CM', 'M2', 'Demolición de pavimento de concreto con espesor de 20 cm', 36890.00, 1, 1);

SET @item_100424 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_100424, 'mano_obra', 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0250, 114730.00, 1),
(@item_100424, 'equipo', 'COMPRESOR DE DOS MARTILLOS', 'H', 0.2000, 125188.00, 1),
(@item_100424, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 2868.25, 1);

-- =====================================================

-- Ítem 7: EXCAVACION EN CONGLOMERADO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('100602', 'EXCAVACION EN CONGLOMERADO (MANUAL)', 'M3', 'Excavación manual en material conglomerado', 49642.00, 1, 1);

SET @item_100602 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_100602, 'mano_obra', 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.3257, 114730.00, 1),
(@item_100602, 'equipo', 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 37371.33, 1);

-- =====================================================

-- Ítem 8: COLCHON ARENA GRUESA
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('110906', 'COLCHON ARENA GRUESA E=5-7CM', 'M3', 'Colchón de arena gruesa con espesor de 5-7 cm', 88188.00, 1, 1);

SET @item_110906 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_110906, 'material', 'ARENA DE TRITURACIÓN Y/O ARENA GRUESA DE RIO (+ 5% desperdicio)', 'M3', 1.0500, 52278.00, 1),
(@item_110906, 'mano_obra', 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.0500, 229460.00, 1),
(@item_110906, 'equipo', 'HERRAMIENTA MENOR (6% de Mano de Obra)', 'GL', 0.0600, 11473.00, 1);

-- =====================================================

-- Ítem 9: INSTALACION TUBERIA PVC 6"
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('165905', 'INST.TUB.PVC UM 6"', 'M', 'Instalación de tubería PVC Unión Mecánica 6 pulgadas', 11317.00, 1, 1);

SET @item_165905 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_165905, 'material', 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0600, 31595.00, 1),
(@item_165905, 'mano_obra', 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0188, 340749.00, 1),
(@item_165905, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 6389.44, 1);

-- =====================================================

-- Ítem 10: TEE PVC UM 3"x3"x3"
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('165110-17P', 'TEE PVC UM 3" x3" x3"', 'UND', 'Tee de PVC Unión Mecánica 3"x3"x3"', 252989.00, 1, 1);

SET @item_16511017p = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_16511017p, 'material', 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0600, 31595.00, 1),
(@item_16511017p, 'material', 'TEE PVC UM 3" X 2" X 3" (+ 2% desperdicio)', 'UND', 1.0200, 180150.00, 1),
(@item_16511017p, 'mano_obra', 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0188, 340749.00, 1),
(@item_16511017p, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 6389.44, 1);

-- =====================================================

-- Ítem 11: REDUCCION PVC UM 6"x3"
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('165304-18P', 'REDUCC PVC UM 6" x3"', 'UND', 'Reducción de PVC Unión Mecánica 6"x3"', 472849.00, 1, 1);

SET @item_16530418p = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_16530418p, 'material', 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0400, 31595.00, 1),
(@item_16530418p, 'material', 'REDUCCION PVC UM 6" X 3"', 'UND', 1.0000, 351553.00, 1),
(@item_16530418p, 'mano_obra', 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0188, 340749.00, 1),
(@item_16530418p, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 6389.44, 1);

-- =====================================================

-- Ítem 12: TUBERIA PVC 6" RDE 13.5
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('165008', 'TUBERIA PVC ALTA PRESION 6" RDE 13.5 UM', 'M', 'Tubería PVC alta presión 6 pulgadas RDE 13.5 Unión Mecánica', 281462.00, 1, 1);

SET @item_165008 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_165008, 'material', 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0300, 31595.00, 1),
(@item_165008, 'material', 'TUBO PRESION RDE-13.5 EU - 6" (+ 2% desperdicio)', 'M', 1.0200, 195850.00, 1),
(@item_165008, 'mano_obra', 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0375, 340749.00, 1),
(@item_165008, 'equipo', 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 12781.28, 1);

-- =====================================================

-- Ítem 13: RELLENO MATERIAL SITIO COMPACTADO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('100618', 'RELLENO MATERIAL SITIO COMPACTADO-RANA', 'M3', 'Relleno con material del sitio compactado con vibrocompactador tipo rana', 44867.00, 1, 1);

SET @item_100618 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_100618, 'material', 'AGUA', 'LT', 7.0000, 74.00, 1),
(@item_100618, 'material', 'GASOLINA CORRIENTE', 'GLN', 0.0500, 16758.00, 1),
(@item_100618, 'material', 'ACEITE MOTOR 4 TIEMPOS', 'GLN', 0.0150, 117290.00, 1),
(@item_100618, 'mano_obra', 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.1126, 229460.00, 1),
(@item_100618, 'equipo', 'COMPACTADOR MANUAL VIBRATORIO (RANA) CON MOTOR DE 6 HP', 'H', 0.8000, 6125.00, 1),
(@item_100618, 'equipo', 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 25840.09, 1);

-- =====================================================

-- Ítem 14: RELLENO ROCAMUERTA
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('100620', 'RELLENO ROCAMUERTA COMPACT-SALTARIN', 'M3', 'Relleno con roca muerta compactado con vibrocompactador saltarín', 105317.00, 1, 1);

SET @item_100620 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_100620, 'material', 'ROCA MUERTA', 'M3', 1.3000, 38640.00, 1),
(@item_100620, 'material', 'GASOLINA CORRIENTE', 'GLN', 0.0500, 16758.00, 1),
(@item_100620, 'material', 'ACEITE MOTOR 4 TIEMPOS', 'GLN', 0.0100, 117290.00, 1),
(@item_100620, 'mano_obra', 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.1000, 229460.00, 1),
(@item_100620, 'equipo', 'VIBROCOMPACTADOR SALTARIN', 'DIA', 0.0800, 58230.00, 1),
(@item_100620, 'equipo', 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 22946.00, 1);

-- =====================================================

-- Ítem 15: BASE GRANULAR CLASE B
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('083303', 'BASE GRANULAR CLASE B (NT2, BG 38, clase B)', 'M3', 'Base granular clase B analizada para tipo NT2, de gradación BG 38', 125168.00, 1, 1);

SET @item_083303 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_083303, 'material', 'MATERIAL DE BASE CLASE B (NT2) GRADACIÓN FINA BG 38', 'M3', 1.3000, 65550.00, 1),
(@item_083303, 'material', 'AGUA', 'LT', 80.0000, 74.00, 1),
(@item_083303, 'mano_obra', 'M.O. 2 AYUDANTES (Jornal 127,478 + 180% Prestaciones)', 'DIA', 0.0067, 229460.00, 1),
(@item_083303, 'equipo', 'CARROTANQUE DE AGUA (1000 GALONES)', 'H', 0.0533, 118000.00, 1),
(@item_083303, 'equipo', 'MOTONIVELADORA POTENCIA 215 HP, ANCHO DE CUCHILLA 4,27 M, PESO 18 TON', 'H', 0.0533, 306624.00, 1),
(@item_083303, 'equipo', 'VIBROCOMPACTADOR, POTENCIA 153 HP, PESO 10 TON', 'H', 0.0533, 145557.00, 1),
(@item_083303, 'equipo', 'HERRAMIENTA MENOR (1% de Mano de Obra)', 'GL', 0.0100, 1529.73, 1),
(@item_083303, 'transporte', 'TRANSPORTE DE MATERIAL DE BASE (1.3 M3 x 1 Km)', 'M3-KM', 1.3000, 1613.00, 1);

-- =====================================================

-- Ítem 16: PAVIMENTO DE CONCRETO HIDRÁULICO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('085002', 'PAVIMENTO DE CONCRETO HIDRÁULICO PREMEZCLADO NT2', 'M3', 'Pavimento de concreto hidráulico premezclado para tránsito NT2, no incluye acero ni barras de transferencia', 920116.00, 1, 1);

SET @item_085002 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_085002, 'material', 'SELLO DE POLIURETANO EN CINTA PARA JUNTAS EN PAVIMENTOS', 'M', 1.8080, 1569.00, 1),
(@item_085002, 'material', 'SELLO DE SILICONA O SELLADOR AUTONIVELANTE', 'M', 1.2900, 16366.00, 1),
(@item_085002, 'material', 'EMULSION ACUOSA DE PARAFINA PARA CURADO DE CONCRETO', 'KG', 1.3160, 8715.00, 1),
(@item_085002, 'material', 'CONCRETO HIDRÁULICO PREMEZCLADO PARA PAVIMENTO MR-41 (4.0 MPA)', 'M3', 1.0100, 707563.00, 1),
(@item_085002, 'mano_obra', 'M.O. PAVIMENTO, ALISTADO Y ENCOFRADO: 4 AYUDANTES + 2 OFICIALES', 'DIA', 0.0417, 849002.00, 1),
(@item_085002, 'mano_obra', 'M.O. PAVIMENTO, INSTALACIÓN: 6 AYUDANTES + 3 OFICIALES', 'DIA', 0.0417, 1273503.00, 1),
(@item_085002, 'mano_obra', 'M.O. PAVIMENTO, TERMINADO: 2 AYUDANTES + 3 OFICIALES', 'DIA', 0.0417, 814582.00, 1),
(@item_085002, 'equipo', 'EQUIPO DE ACABADO SUPERFICIAL', 'DIA', 0.0417, 30906.00, 1),
(@item_085002, 'equipo', 'ASPERSOR MANUAL DE 20 LITROS', 'H', 0.3333, 3745.00, 1),
(@item_085002, 'equipo', 'COMPRESOR (BARRIDO Y SOPLADO)', 'H', 0.3333, 77886.00, 1),
(@item_085002, 'equipo', 'CORTADORA DE PAVIMENTO, PROFUNDIDAD DE CORTE: 16-19 CM', 'H', 0.3333, 14534.00, 1),
(@item_085002, 'equipo', 'FORMALETA METÁLICA PARA PAVIMENTO EN CONCRETO HIDRÁULICO', 'H', 0.3333, 1109.00, 1),
(@item_085002, 'equipo', 'REGLA VIBRATORIA DE CONCRETO, LONGITUD 3 A 5 M', 'H', 0.3333, 7395.00, 1),
(@item_085002, 'equipo', 'VIBRADOR DE CONCRETO, POTENCIA 3 HP', 'H', 0.3333, 6051.00, 1),
(@item_085002, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 122378.61, 1),
(@item_085002, 'transporte', 'TRANSPORTE DE CONCRETO (1.01 M3 x 1 Km)', 'M3-KM', 1.0100, 3337.00, 1);

-- =====================================================

-- Ítem 17: SELLADOR ELASTICO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('321003', 'SELLADOR ELASTICO (JUNTA 1 X 1 CM)', 'M', 'Aplicación de sellador elástico de poliuretano en juntas de 1x1 cm', 50950.00, 1, 1);

SET @item_321003 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_321003, 'material', 'SELLO POLIURETANO', 'M', 1.0000, 9361.00, 1),
(@item_321003, 'material', 'SELLADOR POLIURETANO ELASTICO 300 ML (+ 1% desperdicio)', 'UND', 0.3232, 69524.00, 1),
(@item_321003, 'mano_obra', 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0563, 114730.00, 1),
(@item_321003, 'equipo', 'HERRAMIENTA MENOR (7% de Mano de Obra)', 'GL', 0.0700, 6456.38, 1);

-- =====================================================

-- Ítem 18: EMPALME TUB 3"-6" CAMARA CONCRETO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('020430-15P', 'EMPALME TUB 3"-6" CAMARA CONCRETO', 'UND', 'Empalme de tubería 3"-6" en cámara de concreto', 381664.00, 1, 1);

SET @item_02043015p = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_02043015p, 'material', 'MORTERO 1:3', 'M3', 0.0080, 409265.00, 1),
(@item_02043015p, 'mano_obra', 'M.O. HIDROSANIT. 2 AYUDANTES + 1 OFICIAL (Jornal 259,417 + 180% Prestaciones)', 'DIA', 0.6024, 466950.00, 1),
(@item_02043015p, 'equipo', 'HERRAMIENTA MENOR (2% de Mano de Obra)', 'GL', 0.0200, 281295.18, 1);

-- =====================================================

-- Ítem 19: CARGUE MATERIAL EXCAVADO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('010209', 'CARGUE MAT. EXCAV. A MAQUINA (SIN TRANSP)', 'M3', 'Cargue de material excavado a máquina sin transporte', 7594.00, 1, 1);

SET @item_010209 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_010209, 'mano_obra', 'M.O. 1 AYUDANTE (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.0043, 114730.00, 1),
(@item_010209, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 491.91, 1),
(@item_010209, 'equipo', 'RETROEXCAVADORA CARGADORA JD-510', 'H', 0.0350, 150226.00, 1);

-- =====================================================

-- Ítem 20: TRANSPORTE DE MATERIALES EXCAVACIÓN
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('089003', 'TRANSPORTE MATERIAL EXCAVACIÓN >1000m (Volqueta 6m3)', 'M3-KM', 'Transporte de materiales de excavación para distancias mayores de 1000m, medidos desde 100m, en volqueta de 6 m3', 2764.00, 1, 1);

SET @item_089003 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_089003, 'transporte', 'TRANSPORTE DE MATERIAL DE EXCAVACIÓN Y/O PETREOS (VOLQUETA 6 M3)', 'M3-KM', 1.3000, 2126.00, 1);

-- =====================================================

-- Ítem 21: PALETERO DIURNO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('330311', 'PALETERO DIURNO', 'H', 'Personal paletero para control de tráfico en jornada diurna', 18861.00, 1, 1);

SET @item_330311 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_330311, 'mano_obra', 'AUXILIAR OFICIOS VARIOS DIURNO (Jornal 63,739 + 180% Prestaciones)', 'DIA', 0.1250, 114730.00, 1);

-- =====================================================

-- Ítem 22: PALETERO NOCTURNO
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('330312', 'PALETERO NOCTURNO', 'H', 'Personal paletero para control de tráfico en jornada nocturna', 22635.00, 1, 1);

SET @item_330312 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_330312, 'mano_obra', 'AUXILIAR OFICIOS VARIOS NOCTURNO (Jornal 76,487 + 180% Prestaciones)', 'DIA', 0.1250, 137676.00, 1);

-- =====================================================

-- Ítem 23: SEÑAL DE PARE-SIGA
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('330309', 'SENAL DE PARE-SIGA PARA PALETERO', 'DIA', 'Suministro de señal de pare-siga para paletero', 4370.00, 1, 1);

SET @item_330309 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_330309, 'equipo', 'SENAL DE PARE - SIGA', 'DIA', 1.0000, 3323.00, 1);

-- =====================================================

-- Ítem 24: INSTALACION TUBERIA PVC 3"
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('165903', 'INST.TUB.PVC UM 3"', 'M', 'Instalación de tubería PVC Unión Mecánica 3 pulgadas', 7110.00, 1, 1);

SET @item_165903 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_165903, 'material', 'LUBRICANTE TUB PVC 500GR (+ 3% desperdicio)', 'UND', 0.0309, 31595.00, 1),
(@item_165903, 'mano_obra', 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 1),
(@item_165903, 'equipo', 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 4259.36, 1);

-- =====================================================

-- Ítem 25: CODO PVC UM 3" x 45°
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('165718', 'CODO PVC UM 3" x 45 RDE-13.5', 'UND', 'Codo de PVC Unión Mecánica 3 pulgadas x 45 grados RDE-13.5', 151906.00, 1, 1);

SET @item_165718 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_165718, 'material', 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0300, 31595.00, 1),
(@item_165718, 'material', 'CODO PRS R13 45 X 3"', 'UND', 1.0000, 110080.00, 1),
(@item_165718, 'mano_obra', 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0125, 340749.00, 1),
(@item_165718, 'equipo', 'HERRAMIENTA MENOR (5% de Mano de Obra)', 'GL', 0.0500, 4259.36, 1);

-- =====================================================

-- Ítem 26: TUBERIA PVC 3" RDE 13.5
INSERT INTO `items` (`codigo_item`, `nombre_item`, `unidad`, `descripcion`, `precio_unitario`, `idusuario`, `idestado`) VALUES
('165004', 'TUBERIA PVC ALTA PRESION 3" RDE 13.5 UM', 'M', 'Tubería PVC alta presión 3 pulgadas RDE 13.5 Unión Mecánica', 116360.00, 1, 1);

SET @item_165004 = LAST_INSERT_ID();

INSERT INTO `item_componentes` (`id_item`, `tipo_componente`, `descripcion`, `unidad`, `cantidad`, `precio_unitario`, `idestado`) VALUES
(@item_165004, 'material', 'LUBRICANTE TUB PVC 500GR', 'UND', 0.0200, 31595.00, 1),
(@item_165004, 'material', 'TUBO PRESION RDE-13.5 UM - 3" (+ 1% desperdicio)', 'M', 1.0100, 74690.00, 1),
(@item_165004, 'mano_obra', 'M.O. HIDROSANIT. 1 AYUDANTE + 1 OFICIAL (Jornal 189,305 + 180% Prestaciones)', 'DIA', 0.0350, 340749.00, 1),
(@item_165004, 'equipo', 'HERRAMIENTA MENOR (4% de Mano de Obra)', 'GL', 0.0400, 11926.81, 1);

-- =====================================================
-- PASO 3: ACTUALIZAR REFERENCIAS EN DET_PRESUPUESTO
-- =====================================================

-- Nota: Esta sección actualiza los registros existentes en det_presupuesto
-- para que apunten a los nuevos ítems en lugar de a materiales directamente

-- Actualizar referencias del presupuesto 1 - BYPASS SAN JERONIMO
UPDATE `det_presupuesto` SET `id_item` = @item_330301 WHERE `id_det_presupuesto` = 1;
UPDATE `det_presupuesto` SET `id_item` = @item_330306 WHERE `id_det_presupuesto` = 2;
UPDATE `det_presupuesto` SET `id_item` = @item_330127 WHERE `id_det_presupuesto` = 3;
UPDATE `det_presupuesto` SET `id_item` = @item_100424 WHERE `id_det_presupuesto` = 4;
UPDATE `det_presupuesto` SET `id_item` = @item_100602 WHERE `id_det_presupuesto` = 5;
UPDATE `det_presupuesto` SET `id_item` = @item_110906 WHERE `id_det_presupuesto` = 6;
UPDATE `det_presupuesto` SET `id_item` = @item_165905 WHERE `id_det_presupuesto` = 7;
UPDATE `det_presupuesto` SET `id_item` = @item_16511017p WHERE `id_det_presupuesto` = 8;
UPDATE `det_presupuesto` SET `id_item` = @item_16530418p WHERE `id_det_presupuesto` = 9;
UPDATE `det_presupuesto` SET `id_item` = @item_165008 WHERE `id_det_presupuesto` = 10;
UPDATE `det_presupuesto` SET `id_item` = @item_100618 WHERE `id_det_presupuesto` = 11;
UPDATE `det_presupuesto` SET `id_item` = @item_100620 WHERE `id_det_presupuesto` = 12;
UPDATE `det_presupuesto` SET `id_item` = @item_083303 WHERE `id_det_presupuesto` = 13;
UPDATE `det_presupuesto` SET `id_item` = @item_085002 WHERE `id_det_presupuesto` = 14;
UPDATE `det_presupuesto` SET `id_item` = @item_321003 WHERE `id_det_presupuesto` = 15;
UPDATE `det_presupuesto` SET `id_item` = @item_02043015p WHERE `id_det_presupuesto` = 16;
UPDATE `det_presupuesto` SET `id_item` = @item_010209 WHERE `id_det_presupuesto` = 17;
UPDATE `det_presupuesto` SET `id_item` = @item_089003 WHERE `id_det_presupuesto` = 18;

-- Actualizar referencias del presupuesto 1 - BYPASS EL CARMELO
UPDATE `det_presupuesto` SET `id_item` = @item_330301 WHERE `id_det_presupuesto` = 19;
UPDATE `det_presupuesto` SET `id_item` = @item_330306 WHERE `id_det_presupuesto` = 20;
UPDATE `det_presupuesto` SET `id_item` = @item_330311 WHERE `id_det_presupuesto` = 21;
UPDATE `det_presupuesto` SET `id_item` = @item_330312 WHERE `id_det_presupuesto` = 22;
UPDATE `det_presupuesto` SET `id_item` = @item_330309 WHERE `id_det_presupuesto` = 23;
UPDATE `det_presupuesto` SET `id_item` = @item_330127 WHERE `id_det_presupuesto` = 24;
UPDATE `det_presupuesto` SET `id_item` = @item_100424 WHERE `id_det_presupuesto` = 25;
UPDATE `det_presupuesto` SET `id_item` = @item_100602 WHERE `id_det_presupuesto` = 26;
UPDATE `det_presupuesto` SET `id_item` = @item_110906 WHERE `id_det_presupuesto` = 27;
UPDATE `det_presupuesto` SET `id_item` = @item_165903 WHERE `id_det_presupuesto` = 28;
UPDATE `det_presupuesto` SET `id_item` = @item_16511017p WHERE `id_det_presupuesto` = 29;
UPDATE `det_presupuesto` SET `id_item` = @item_165718 WHERE `id_det_presupuesto` = 30;
UPDATE `det_presupuesto` SET `id_item` = @item_165004 WHERE `id_det_presupuesto` = 31;
UPDATE `det_presupuesto` SET `id_item` = @item_100618 WHERE `id_det_presupuesto` = 32;
UPDATE `det_presupuesto` SET `id_item` = @item_100620 WHERE `id_det_presupuesto` = 33;
UPDATE `det_presupuesto` SET `id_item` = @item_083303 WHERE `id_det_presupuesto` = 34;
UPDATE `det_presupuesto` SET `id_item` = @item_085002 WHERE `id_det_presupuesto` = 35;
UPDATE `det_presupuesto` SET `id_item` = @item_321003 WHERE `id_det_presupuesto` = 36;
UPDATE `det_presupuesto` SET `id_item` = @item_02043015p WHERE `id_det_presupuesto` = 37;
UPDATE `det_presupuesto` SET `id_item` = @item_010209 WHERE `id_det_presupuesto` = 38;
UPDATE `det_presupuesto` SET `id_item` = @item_089003 WHERE `id_det_presupuesto` = 39;

-- Actualizar referencias del presupuesto 2
UPDATE `det_presupuesto` SET `id_item` = @item_010209 WHERE `id_det_presupuesto` = 40;
UPDATE `det_presupuesto` SET `id_item` = @item_02043015p WHERE `id_det_presupuesto` = 41;
UPDATE `det_presupuesto` SET `id_item` = @item_165903 WHERE `id_det_presupuesto` = 42;
UPDATE `det_presupuesto` SET `id_item` = @item_16511017p WHERE `id_det_presupuesto` = 43;
UPDATE `det_presupuesto` SET `id_item` = @item_165718 WHERE `id_det_presupuesto` = 44;
UPDATE `det_presupuesto` SET `id_item` = @item_165004 WHERE `id_det_presupuesto` = 45;
UPDATE `det_presupuesto` SET `id_item` = @item_100618 WHERE `id_det_presupuesto` = 46;
UPDATE `det_presupuesto` SET `id_item` = @item_100620 WHERE `id_det_presupuesto` = 47;
UPDATE `det_presupuesto` SET `id_item` = @item_083303 WHERE `id_det_presupuesto` = 48;
UPDATE `det_presupuesto` SET `id_item` = @item_085002 WHERE `id_det_presupuesto` = 49;
UPDATE `det_presupuesto` SET `id_item` = @item_321003 WHERE `id_det_presupuesto` = 50;
UPDATE `det_presupuesto` SET `id_item` = @item_02043015p WHERE `id_det_presupuesto` = 51;
UPDATE `det_presupuesto` SET `id_item` = @item_010209 WHERE `id_det_presupuesto` = 52;
UPDATE `det_presupuesto` SET `id_item` = @item_089003 WHERE `id_det_presupuesto` = 53;

-- =====================================================
-- PASO 4: VERIFICACIÓN Y RESUMEN
-- =====================================================

-- Consulta de verificación: Contar ítems creados
SELECT 
    'Ítems creados' as Concepto,
    COUNT(*) as Cantidad 
FROM `items`;

-- Consulta de verificación: Contar componentes por tipo
SELECT 
    tipo_componente as 'Tipo de Componente',
    COUNT(*) as Cantidad 
FROM `item_componentes` 
GROUP BY tipo_componente 
ORDER BY tipo_componente;

-- Consulta de verificación: Resumen de ítems con sus componentes
SELECT 
    i.codigo_item as 'Código',
    i.nombre_item as 'Nombre del Ítem',
    i.unidad as 'Unidad',
    i.precio_unitario as 'Precio Unitario',
    COUNT(ic.id_componente) as 'Cantidad Componentes'
FROM `items` i
LEFT JOIN `item_componentes` ic ON i.id_item = ic.id_item
GROUP BY i.id_item
ORDER BY i.codigo_item;

-- Consulta de verificación: Detalle de presupuestos con ítems
SELECT 
    p.id_presupuesto,
    pr.nombre as 'Proyecto',
    c.nombre_cap as 'Capítulo',
    i.codigo_item as 'Código Ítem',
    i.nombre_item as 'Descripción',
    dp.cantidad as 'Cantidad',
    i.precio_unitario as 'Precio Unit.',
    (dp.cantidad * i.precio_unitario) as 'Subtotal'
FROM `det_presupuesto` dp
INNER JOIN `presupuestos` p ON dp.id_presupuesto = p.id_presupuesto
INNER JOIN `proyectos` pr ON p.id_proyecto = pr.id_proyecto
INNER JOIN `capitulos` c ON dp.id_capitulo = c.id_capitulo
LEFT JOIN `items` i ON dp.id_item = i.id_item
WHERE dp.id_item IS NOT NULL
ORDER BY p.id_presupuesto, c.id_capitulo, dp.id_det_presupuesto;

-- =====================================================
-- NOTAS FINALES
-- =====================================================

/*
RESUMEN DE LA MIGRACIÓN:
========================

1. Se eliminaron los datos anteriores de las tablas:
   - item_componentes (componentes antiguos)
   - items (ítems antiguos)
   - Referencias de id_item en det_presupuesto

2. Se crearon 26 ítems principales (APU) con sus códigos únicos:
   - ME0109, ME0201, 330301, 330306, 330127, 100424, 100602
   - 110906, 165905, 165110-17P, 165304-18P, 165008, 100618
   - 100620, 083303, 085002, 321003, 020430-15P, 010209, 089003
   - 330311, 330312, 330309, 165903, 165718, 165004

3. Se crearon todos los componentes asociados a cada ítem:
   - Materiales (con cantidades y porcentajes de desperdicio)
   - Mano de obra (con jornales y prestaciones sociales)
   - Equipos (con tarifas horarias o porcentuales)
   - Transportes (cuando aplica)

4. Se actualizaron las referencias en det_presupuesto para que:
   - Apunten a los nuevos ítems en lugar de materiales
   - Mantengan las cantidades originales
   - Preserven las relaciones con presupuestos y capítulos

5. Ventajas de la nueva estructura:
   - Trazabilidad completa de componentes por ítem
   - Facilidad para actualizar precios de componentes
   - Cálculos automáticos de subtotales
   - Mejor organización de la información de APU
   - Posibilidad de reutilizar ítems en múltiples proyectos

PRÓXIMOS PASOS RECOMENDADOS:
=============================

1. Verificar que los precios unitarios de los ítems coincidan
   con la suma de sus componentes

2. Actualizar los precios en material_precio para reflejar
   los precios de los componentes individuales

3. Crear procedimientos almacenados para:
   - Calcular automáticamente el precio de un ítem
   - Actualizar precios cuando cambian los componentes
   - Generar reportes de APU con todos sus componentes

4. Implementar triggers para:
   - Mantener sincronizados los precios
   - Auditar cambios en componentes
   - Validar cantidades y porcentajes

5. Crear vistas para:
   - Consultar ítems con todos sus componentes
   - Calcular costos directos e indirectos
   - Generar reportes de presupuestos completos
*/

COMMIT;

-- Mensaje de finalización
SELECT 
    '✓ Migración completada exitosamente' as Estado,
    NOW() as 'Fecha y Hora',
    (SELECT COUNT(*) FROM items) as 'Ítems Creados',
    (SELECT COUNT(*) FROM item_componentes) as 'Componentes Creados';
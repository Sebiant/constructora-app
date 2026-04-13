-- ============================================================
-- TABLA: pedidos_componentes_anexos
-- DESCRIPCIÓN: Almacena archivos adjuntos (anexos) para componentes
-- específicos dentro de un pedido, vinculados a la combinación
-- única de presupuesto + item + componente
-- ============================================================

-- Crear tabla de anexos de componentes
CREATE TABLE IF NOT EXISTS `pedidos_componentes_anexos` (
  `id_anexo` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único del anexo',
  `id_presupuesto` int(11) NOT NULL COMMENT 'Presupuesto al que pertenece (evita compartir entre presupuestos)',
  `id_item` int(11) NOT NULL COMMENT 'Ítem específico donde se usa el componente (evita compartir entre items)',
  `id_componente` int(11) NOT NULL COMMENT 'Componente específico del ítem',
  `nombre_archivo` varchar(255) NOT NULL COMMENT 'Nombre original del archivo subido',
  `ruta_archivo` varchar(500) NOT NULL COMMENT 'Ruta relativa donde se almacena el archivo en el servidor',
  `extension` varchar(10) NOT NULL COMMENT 'Extensión del archivo (pdf, doc, xlsx, etc.)',
  `tamanio_bytes` int(11) NOT NULL COMMENT 'Tamaño del archivo en bytes',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción opcional del contenido del anexo',
  `id_pedido` int(11) DEFAULT NULL COMMENT 'Pedido asociado (opcional, se llena cuando se confirma el pedido)',
  `estado` tinyint(1) DEFAULT 1 COMMENT '1: activo, 0: eliminado',
  `idusuario` int(11) NOT NULL COMMENT 'Usuario que subió el archivo',
  `fechareg` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de subida',
  `fechaupdate` datetime DEFAULT NULL ON UPDATE current_timestamp() COMMENT 'Fecha de última actualización',
  PRIMARY KEY (`id_anexo`),
  KEY `idx_presupuesto_item_componente` (`id_presupuesto`, `id_item`, `id_componente`),
  KEY `idx_presupuesto` (`id_presupuesto`),
  KEY `idx_item` (`id_item`),
  KEY `idx_componente` (`id_componente`),
  KEY `idx_pedido` (`id_pedido`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_anexo_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`) ON DELETE CASCADE,
  CONSTRAINT `fk_anexo_item` FOREIGN KEY (`id_item`) REFERENCES `items` (`id_item`) ON DELETE CASCADE,
  CONSTRAINT `fk_anexo_componente` FOREIGN KEY (`id_componente`) REFERENCES `item_componentes` (`id_componente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Archivos adjuntos a componentes de pedidos - vinculados específicamente a presupuesto+item+componente';

-- ============================================================
-- EJEMPLOS DE USO:
-- 
-- 1. El mismo componente (ej: ACERO) en diferentes items del
--    mismo presupuesto puede tener anexos diferentes:
--    - Item A (VIGAS): Anexo con especificaciones de vigas
--    - Item B (COLUMNAS): Anexo con especificaciones de columnas
--
-- 2. El mismo componente en diferentes presupuestos tiene
--    anexos completamente aislados
--
-- 3. Consultar anexos de un componente específico:
--    SELECT * FROM pedidos_componentes_anexos 
--    WHERE id_presupuesto = 1 
--      AND id_item = 730 
--      AND id_componente = 6454 
--      AND estado = 1;
-- ============================================================

-- Opcional: Vista para facilitar consultas de anexos con información relacionada
CREATE OR REPLACE VIEW `vw_pedidos_componentes_anexos` AS
SELECT 
  a.id_anexo,
  a.id_presupuesto,
  p.nombre as nombre_presupuesto,
  p.codigo as codigo_presupuesto,
  a.id_item,
  i.codigo_item,
  i.nombre_item,
  a.id_componente,
  ic.descripcion as descripcion_componente,
  ic.tipo_componente,
  a.nombre_archivo,
  a.ruta_archivo,
  a.extension,
  a.tamanio_bytes,
  a.descripcion as descripcion_anexo,
  a.id_pedido,
  a.estado,
  a.idusuario,
  a.fechareg,
  a.fechaupdate
FROM pedidos_componentes_anexos a
INNER JOIN presupuestos p ON a.id_presupuesto = p.id_presupuesto
INNER JOIN items i ON a.id_item = i.id_item
INNER JOIN item_componentes ic ON a.id_componente = ic.id_componente
WHERE a.estado = 1;

-- ============================================================
-- NOTA IMPORTANTE SOBRE EL SISTEMA DE ARCHIVOS:
-- 
-- Los archivos se almacenan físicamente en:
-- /uploads/pedidos_anexos/{id_presupuesto}/{id_item}/{id_anexo}_{nombre_archivo}
-- 
-- Esta estructura de carpetas garantiza:
-- - Aislamiento por presupuesto (carpeta nivel 1)
-- - Aislamiento por item (carpeta nivel 2)  
-- - Prevención de colisiones de nombres (prefijo id_anexo)
-- 
-- La combinación de esta estructura de archivos + la tabla SQL
-- asegura que los anexos nunca se compartan entre:
-- - Diferentes presupuestos
-- - Diferentes items del mismo presupuesto
-- - Diferentes componentes del mismo item
-- ============================================================

-- =====================================================
-- NUEVO ESQUEMA DE BASE DE DATOS: PEDIDO → ORDEN DE COMPRA → COMPRA
-- VERSIÓN CORREGIDA PARA COMPATIBILIDAD CON BD EXISTENTE
-- =====================================================

-- 1. TABLA DE ÓRDENES DE COMPRA (NUEVA ENTIDAD INTERMEDIA)
-- =====================================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id_orden_compra INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_provedor INT NOT NULL,
  
  -- Información básica
  numero_orden VARCHAR(50) NOT NULL UNIQUE COMMENT 'Número único de orden de compra',
  fecha_orden DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la orden',
  fecha_esperada DATE NULL COMMENT 'Fecha esperada de entrega',
  
  -- Información de facturación
  numero_factura VARCHAR(100) NULL COMMENT 'Número de factura asociado',
  fecha_factura DATE NULL COMMENT 'Fecha de emisión de factura',
  
  -- Totales
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Subtotal antes de impuestos',
  impuestos DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto de impuestos',
  total DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Total final de la orden',
  
  -- Estados
  estado ENUM('pendiente', 'aprobada', 'comprada', 'recibida', 'cancelada') NOT NULL DEFAULT 'pendiente' 
    COMMENT 'Estado de la orden de compra',
  
  -- Observaciones y control
  observaciones TEXT NULL COMMENT 'Observaciones de la orden',
  aprobado_por INT NULL COMMENT 'Usuario que aprobó la orden',
  fecha_aprobacion DATETIME NULL COMMENT 'Fecha de aprobación',
  
  -- Auditoría
  idusuario INT NOT NULL COMMENT 'Usuario que creó la orden',
  fechareg DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaupdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_oc_pedido (id_pedido),
  INDEX idx_oc_proveedor (id_provedor),
  INDEX idx_oc_estado (estado),
  INDEX idx_oc_fecha (fecha_orden),
  INDEX idx_oc_numero (numero_orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Órdenes de compra intermedias entre pedidos y compras finales';

-- 2. DETALLE DE ÓRDENES DE COMPRA
-- =====================================================
CREATE TABLE IF NOT EXISTS ordenes_compra_detalle (
  id_orden_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_orden_compra INT NOT NULL,
  id_det_pedido INT NULL COMMENT 'Referencia al detalle del pedido original',
  
  -- Información del producto
  descripcion VARCHAR(255) NOT NULL COMMENT 'Descripción del producto',
  unidad VARCHAR(50) NULL COMMENT 'Unidad de medida',
  cantidad_solicitada DECIMAL(14,4) NOT NULL DEFAULT 0.0000 COMMENT 'Cantidad solicitada original',
  cantidad_comprada DECIMAL(14,4) NOT NULL DEFAULT 0.0000 COMMENT 'Cantidad realmente comprada',
  
  -- Precios
  precio_unitario DECIMAL(14,4) NOT NULL DEFAULT 0.0000 COMMENT 'Precio unitario al momento de la orden',
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Subtotal del ítem',
  
  -- Control de recepción
  cantidad_recibida DECIMAL(14,4) NOT NULL DEFAULT 0.0000 COMMENT 'Cantidad recibida',
  fecha_recepcion DATETIME NULL COMMENT 'Fecha de recepción',
  recibido_por INT NULL COMMENT 'Usuario que recibió el producto',
  
  -- Auditoría
  fechareg DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaupdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_od_orden (id_orden_compra),
  INDEX idx_od_pedido_detalle (id_det_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Detalle de productos en órdenes de compra';

-- 3. MODIFICACIÓN A TABLA PEDIDOS (CAMPOS ADICIONALES)
-- =====================================================
-- Verificar si la columna existe antes de agregarla
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'gesconjm_sgicontrol'
    AND table_name = 'pedidos'
    AND column_name = 'estado_compra'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE pedidos ADD COLUMN estado_compra ENUM("pendiente", "parcialmente_comprado", "completado") NOT NULL DEFAULT "pendiente" COMMENT "Estado de compra del pedido"',
    'SELECT "Columna estado_compra ya existe" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índice si no existe
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = 'gesconjm_sgicontrol'
    AND table_name = 'pedidos'
    AND index_name = 'idx_pedidos_estado_compra'
);

SET @sql = IF(@index_exists = 0, 
    'ALTER TABLE pedidos ADD INDEX idx_pedidos_estado_compra (estado_compra)',
    'SELECT "Índice idx_pedidos_estado_compra ya existe" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. NUEVA TABLA DE COMPRAS FINALES
-- =====================================================
CREATE TABLE IF NOT EXISTS compras_finales (
  id_compra_final INT AUTO_INCREMENT PRIMARY KEY,
  id_orden_compra INT NOT NULL,
  
  -- Información de compra
  fecha_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha final de compra',
  monto_total DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto total pagado',
  
  -- Documentación
  numero_factura VARCHAR(100) NOT NULL COMMENT 'Número de factura final',
  fecha_factura DATE NOT NULL COMMENT 'Fecha de factura',
  url_documento VARCHAR(500) NULL COMMENT 'URL a documento digital',
  
  -- Estado
  estado ENUM('registrada', 'pagada', 'cancelada') NOT NULL DEFAULT 'registrada',
  
  -- Auditoría
  idusuario INT NOT NULL COMMENT 'Usuario que registró la compra',
  fechareg DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaupdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_cf_orden_compra (id_orden_compra),
  INDEX idx_cf_factura (numero_factura),
  INDEX idx_cf_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Compras finales registradas desde órdenes de compra';

-- 5. AGREGAR CLAVES FORÁNEAS DESPUÉS DE CREAR TABLAS
-- =====================================================
-- FK para ordenes_compra
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = 'gesconjm_sgicontrol'
    AND table_name = 'ordenes_compra'
    AND constraint_name = 'fk_oc_pedido'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE ordenes_compra ADD CONSTRAINT fk_oc_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT "FK fk_oc_pedido ya existe" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = 'gesconjm_sgicontrol'
    AND table_name = 'ordenes_compra'
    AND constraint_name = 'fk_oc_proveedor'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE ordenes_compra ADD CONSTRAINT fk_oc_proveedor FOREIGN KEY (id_provedor) REFERENCES provedores(id_provedor) ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT "FK fk_oc_proveedor ya existe" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK para ordenes_compra_detalle
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = 'gesconjm_sgicontrol'
    AND table_name = 'ordenes_compra_detalle'
    AND constraint_name = 'fk_od_orden_compra'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE ordenes_compra_detalle ADD CONSTRAINT fk_od_orden_compra FOREIGN KEY (id_orden_compra) REFERENCES ordenes_compra(id_orden_compra) ON UPDATE CASCADE ON DELETE CASCADE',
    'SELECT "FK fk_od_orden_compra ya existe" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = 'gesconjm_sgicontrol'
    AND table_name = 'ordenes_compra_detalle'
    AND constraint_name = 'fk_od_pedido_detalle'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE ordenes_compra_detalle ADD CONSTRAINT fk_od_pedido_detalle FOREIGN KEY (id_det_pedido) REFERENCES pedidos_detalle(id_det_pedido) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT "FK fk_od_pedido_detalle ya existe" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK para compras_finales
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = 'gesconjm_sgicontrol'
    AND table_name = 'compras_finales'
    AND constraint_name = 'fk_cf_orden_compra'
);

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE compras_finales ADD CONSTRAINT fk_cf_orden_compra FOREIGN KEY (id_orden_compra) REFERENCES ordenes_compra(id_orden_compra) ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT "FK fk_cf_orden_compra ya existe" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. VISTA PARA CONSULTAS COMPLEJAS
-- =====================================================
CREATE OR REPLACE VIEW vw_pedidos_con_ordenes AS
SELECT 
  p.id_pedido,
  p.fecha_pedido,
  p.estado,
  COALESCE(p.estado_compra, 'pendiente') as estado_compra,
  p.total as total_pedido,
  COUNT(DISTINCT oc.id_orden_compra) as cantidad_ordenes,
  SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END) as total_comprado,
  SUM(CASE WHEN oc.estado IN ('pendiente', 'aprobada') THEN oc.total ELSE 0 END) as total_pendiente,
  (p.total - COALESCE(SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END), 0)) as saldo_pendiente,
  CASE 
    WHEN COALESCE(SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END), 0) >= p.total THEN 'completado'
    WHEN COALESCE(SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END), 0) > 0 THEN 'parcialmente_comprado'
    ELSE 'pendiente'
  END as estado_calculado
FROM pedidos p
LEFT JOIN ordenes_compra oc ON p.id_pedido = oc.id_pedido
GROUP BY p.id_pedido, p.fecha_pedido, p.estado, p.estado_compra, p.total;

-- 7. TRIGGER PARA ACTUALIZAR ESTADO DE COMPRA DE PEDIDOS
-- =====================================================
-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS tr_actualizar_estado_compra_pedido;

-- Crear nuevo trigger
DELIMITER //
CREATE TRIGGER tr_actualizar_estado_compra_pedido
AFTER UPDATE ON ordenes_compra
FOR EACH ROW
BEGIN
    -- Actualizar estado de compra del pedido basado en sus órdenes
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
END//
DELIMITER ;

-- 8. VERIFICACIÓN FINAL
-- =====================================================
SELECT '=== VERIFICACIÓN DE TABLAS CREADAS ===' as mensaje;
SHOW TABLES LIKE '%ordenes%';
SHOW TABLES LIKE '%compras_finales%';

SELECT '=== VERIFICACIÓN DE ESTRUCTURA ===' as mensaje;
DESCRIBE ordenes_compra;
DESCRIBE ordenes_compra_detalle;
DESCRIBE compras_finales;

SELECT '=== VERIFICACIÓN DE COLUMNAS EN PEDIDOS ===' as mensaje;
SHOW COLUMNS FROM pedidos LIKE 'estado_compra';

-- =====================================================
-- RESUMEN DE CAMBIOS CORREGIDOS
-- =====================================================
/*
1. CORRECCIONES APLICADAS:
   - Referencia a tabla correcta: provedores (no proveedores)
   - Eliminadas FK a usuarios (no existe la tabla)
   - Verificación previa de columnas e índices antes de crear
   - Verificación previa de FK antes de agregar
   - Uso de COALESCE en vista para manejar nulos

2. TABLAS CREADAS:
   - ordenes_compra: Entidad intermedia principal
   - ordenes_compra_detalle: Productos de cada orden
   - compras_finales: Compras finales

3. MODIFICACIONES:
   - pedidos: Nuevo campo estado_compra (si no existe)
   - Índices agregados dinámicamente

4. RELACIONES:
   - pedidos (1) → ordenes_compra (N)
   - ordenes_compra (1) → ordenes_compra_detalle (N)
   - ordenes_compra (1) → compras_finales (1)

5. INTEGRIDAD:
   - Claves foráneas con verificación previa
   - Triggers para mantener consistencia
   - Vistas para consultas complejas
*/

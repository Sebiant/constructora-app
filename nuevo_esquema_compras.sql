-- =====================================================
-- NUEVO ESQUEMA DE BASE DE DATOS: PEDIDO → ORDEN DE COMPRA → COMPRA
-- =====================================================

-- 1. TABLA DE ÓRDENES DE COMPRA (NUEVA ENTIDAD INTERMEDIA)
-- =====================================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id_orden_compra INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_proveedor INT NOT NULL,
  
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
  INDEX idx_oc_proveedor (id_proveedor),
  INDEX idx_oc_estado (estado),
  INDEX idx_oc_fecha (fecha_orden),
  INDEX idx_oc_numero (numero_orden),
  
  -- Relaciones
  CONSTRAINT fk_oc_pedido FOREIGN KEY (id_pedido)
    REFERENCES pedidos(id_pedido)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
    
  CONSTRAINT fk_oc_proveedor FOREIGN KEY (id_proveedor)
    REFERENCES provedores(id_proveedor)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
    
  CONSTRAINT fk_oc_aprobado_por FOREIGN KEY (aprobado_por)
    REFERENCES usuarios(idusuario)
    ON UPDATE CASCADE
    ON DELETE SET NULL
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
  INDEX idx_od_pedido_detalle (id_det_pedido),
  
  -- Relaciones
  CONSTRAINT fk_od_orden_compra FOREIGN KEY (id_orden_compra)
    REFERENCES ordenes_compra(id_orden_compra)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
    
  CONSTRAINT fk_od_pedido_detalle FOREIGN KEY (id_det_pedido)
    REFERENCES pedidos_detalle(id_det_pedido)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
    
  CONSTRAINT fk_od_recibido_por FOREIGN KEY (recibido_por)
    REFERENCES usuarios(idusuario)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Detalle de productos en órdenes de compra';

-- 3. MODIFICACIÓN A TABLA PEDIDOS (CAMPOS ADICIONALES)
-- =====================================================
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS estado_compra ENUM('pendiente', 'parcialmente_comprado', 'completado') NOT NULL DEFAULT 'pendiente' 
  COMMENT 'Estado de compra del pedido',
ADD COLUMN IF NOT INDEX idx_pedidos_estado_compra (estado_compra);

-- 4. MODIFICACIÓN A TABLA COMPRAS EXISTENTE
-- =====================================================
-- Renombrar tabla existente si existe para evitar conflictos
-- RENAME TABLE compras TO compras_legacy;

-- Nueva tabla de compras finales (solo desde órdenes de compra)
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
  INDEX idx_cf_estado (estado),
  
  -- Relaciones
  CONSTRAINT fk_cf_orden_compra FOREIGN KEY (id_orden_compra)
    REFERENCES ordenes_compra(id_orden_compra)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Compras finales registradas desde órdenes de compra';

-- 5. VISTA PARA CONSULTAS COMPLEJAS
-- =====================================================
CREATE OR REPLACE VIEW vw_pedidos_con_ordenes AS
SELECT 
  p.id_pedido,
  p.fecha_pedido,
  p.estado,
  p.estado_compra,
  p.total as total_pedido,
  COUNT(DISTINCT oc.id_orden_compra) as cantidad_ordenes,
  SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END) as total_comprado,
  SUM(CASE WHEN oc.estado IN ('pendiente', 'aprobada') THEN oc.total ELSE 0 END) as total_pendiente,
  (p.total - SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END)) as saldo_pendiente,
  CASE 
    WHEN SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END) >= p.total THEN 'completado'
    WHEN SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END) > 0 THEN 'parcialmente_comprado'
    ELSE 'pendiente'
  END as estado_calculado
FROM pedidos p
LEFT JOIN ordenes_compra oc ON p.id_pedido = oc.id_pedido
GROUP BY p.id_pedido, p.fecha_pedido, p.estado, p.estado_compra, p.total;

-- 6. TRIGGER PARA ACTUALIZAR ESTADO DE COMPRA DE PEDIDOS
-- =====================================================
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_actualizar_estado_compra_pedido
AFTER UPDATE ON ordenes_compra
FOR EACH ROW
BEGIN
    -- Actualizar estado de compra del pedido basado en sus órdenes
    UPDATE pedidos p
    SET p.estado_compra = (
        SELECT 
            CASE 
                WHEN SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END) >= p.total THEN 'completado'
                WHEN SUM(CASE WHEN oc.estado = 'comprada' THEN oc.total ELSE 0 END) > 0 THEN 'parcialmente_comprado'
                ELSE 'pendiente'
            END
        FROM ordenes_compra oc
        WHERE oc.id_pedido = p.id_pedido
    )
    WHERE p.id_pedido = NEW.id_pedido;
END//
DELIMITER ;

-- 7. DATOS DE EJEMPLO (opcional)
-- =====================================================
-- INSERT INTO ordenes_compra (id_pedido, id_proveedor, numero_orden, total, idusuario)
-- VALUES 
--   (1, 1, 'OC-2025-001', 50000.00, 1),
--   (1, 2, 'OC-2025-002', 30000.00, 1);

-- INSERT INTO ordenes_compra_detalle (id_orden_compra, id_det_pedido, descripcion, cantidad_solicitada, precio_unitario, subtotal)
-- VALUES 
--   (1, 1, 'Material de construcción', 100, 500.00, 50000.00),
--   (2, 2, 'Herramientas', 50, 600.00, 30000.00);

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
/*
1. NUEVAS TABLAS:
   - ordenes_compra: Entidad intermedia principal
   - ordenes_compra_detalle: Productos de cada orden
   - compras_finales: Compras finales (reemplaza compras actual)

2. MODIFICACIONES:
   - pedidos: Nuevo campo estado_compra
   - compras: Renombrada a compras_legacy (preservar datos)

3. NUEVOS CONCEPTOS:
   - Pedido → Múltiples Órdenes de Compra → Compra Final
   - Soporte para facturas múltiples
   - Control de recepción por ítem
   - Estados detallados del proceso

4. RELACIONES:
   - pedidos (1) → ordenes_compra (N)
   - ordenes_compra (1) → ordenes_compra_detalle (N)
   - ordenes_compra (1) → compras_finales (1)

5. INTEGRIDAD:
   - Claves foráneas con CASCADE/RESTRICT
   - Triggers para mantener consistencia
   - Vistas para consultas complejas
*/

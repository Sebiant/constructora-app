-- Migration: Añadir campo para vincular órdenes complementarias con su orden original
-- Fecha: 2025-01-07
-- Propósito: Manejar entregas parciales y generar órdenes de compra complementarias

-- Añadir columna id_orden_original (auto-referencial)
ALTER TABLE ordenes_compra 
ADD COLUMN id_orden_original INT NULL COMMENT 'ID de la orden de compra original (para órdenes complementarias)';

-- Crear índice para mejor rendimiento
CREATE INDEX idx_ordenes_compra_orden_original ON ordenes_compra(id_orden_original);

-- Añadir constraint de clave foránea auto-referencial
ALTER TABLE ordenes_compra 
ADD CONSTRAINT fk_ordenes_compra_orden_original 
FOREIGN KEY (id_orden_original) REFERENCES ordenes_compra(id_orden_compra) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Añadir columna para indicar si es complementaria
ALTER TABLE ordenes_compra 
ADD COLUMN es_complementaria BOOLEAN DEFAULT FALSE COMMENT 'TRUE si es una orden complementaria por entrega parcial';

-- Añadir columna para registrar motivo de la complementaria
ALTER TABLE ordenes_compra 
ADD COLUMN motivo_complementaria VARCHAR(500) NULL COMMENT 'Motivo por el que se generó esta orden complementaria';

-- Actualizar órdenes existentes para marcarlas como no complementarias
UPDATE ordenes_compra SET es_complementaria = FALSE WHERE es_complementaria IS NULL;

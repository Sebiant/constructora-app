-- SQL para agregar el campo impuesto a la tabla materiales
-- Fecha: 2026-05-04

-- Agregar columna impuesto a la tabla materiales
ALTER TABLE `materiales`
ADD COLUMN `impuesto` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Porcentaje de impuesto para el material (ej: 19.00 para IVA 19%)';

-- Comentario de la tabla actualizada
-- La columna impuesto almacena el porcentaje de impuesto aplicable al material
-- Ejemplos: 0.00 = sin impuesto, 19.00 = IVA estándar, 5.00 = tarifa reducida

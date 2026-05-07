-- SQL para agregar el campo impuesto a la tabla ordenes_compra_detalle
-- Fecha: 2026-05-04

-- Agregar columna impuesto a la tabla ordenes_compra_detalle
ALTER TABLE `ordenes_compra_detalle`
ADD COLUMN `impuesto` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Porcentaje de impuesto aplicado al producto';

-- Nota: Este campo almacena el porcentaje de impuesto (ej: 19.00 para IVA 19%)
-- El valor del impuesto en dinero se calcula como: subtotal * (impuesto / 100)

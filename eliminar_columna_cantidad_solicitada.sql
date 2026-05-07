-- Eliminar columna cantidad_solicitada de la tabla ordenes_compra_detalle
-- Esta columna está causando confusión y no es necesaria

ALTER TABLE ordenes_compra_detalle 
DROP COLUMN IF EXISTS cantidad_solicitada;

-- Verificar que la columna ha sido eliminada
DESCRIBE ordenes_compra_detalle;

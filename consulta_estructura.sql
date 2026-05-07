-- Primero veamos la estructura de las tablas para saber los nombres correctos de las columnas

-- Estructura de pedidos_detalle
DESCRIBE pedidos_detalle;

-- Estructura de ordenes_compra_detalle  
DESCRIBE ordenes_compra_detalle;

-- Estructura de log_recepciones
DESCRIBE log_recepciones;

-- Ahora veamos los datos con las columnas correctas
-- Buscar en pedidos_detalle (probablemente la columna se llama diferente)
SELECT * FROM pedidos_detalle WHERE id_det_pedido IN (
    SELECT id_det_pedido FROM ordenes_compra_detalle 
    WHERE descripcion LIKE '%CAMIONETA%' OR descripcion LIKE '%CAMIONETA%'
) LIMIT 5;

-- Consulta para encontrar el problema del 33.86

-- Ver qué hay en ordenes_compra_detalle para CAMIONETA DE ESTACAS
SELECT 
    ocd.id_det_pedido,
    ocd.descripcion,
    ocd.cantidad_solicitada,
    ocd.cantidad_recibida,
    ocd.precio_unitario,
    ocd.subtotal,
    ocd.id_orden_compra
FROM ordenes_compra_detalle ocd
WHERE ocd.descripcion LIKE '%CAMIONETA DE ESTACAS%'
ORDER BY ocd.id_det_pedido;

-- Ver qué hay en el pedido original
SELECT 
    pd.id_det_pedido,
    pd.descripcion,
    pd.cantidad,
    pd.precio_unitario,
    pd.subtotal
FROM pedidos_detalle pd
WHERE pd.descripcion LIKE '%CAMIONETA DE ESTACAS%'
ORDER BY pd.id_det_pedido;

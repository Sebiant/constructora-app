-- Ahora que conocemos la estructura, busquemos los datos reales

-- 1. Ver los datos en ordenes_compra_detalle donde está el 33.86 incorrecto
SELECT 
    ocd.id_det_pedido,
    ocd.descripcion,
    ocd.cantidad_solicitada,
    ocd.cantidad_recibida,
    ocd.precio_unitario,
    ocd.subtotal
FROM ordenes_compra_detalle ocd
WHERE ocd.descripcion LIKE '%CAMIONETA%'
ORDER BY ocd.id_det_pedido;

-- 2. Ver los datos del pedido original usando el id_componente
SELECT 
    pd.id_det_pedido,
    pd.id_componente,
    pd.cantidad,
    pd.precio_unitario,
    pd.subtotal,
    ic.descripcion
FROM pedidos_detalle pd
LEFT JOIN item_componentes ic ON pd.id_componente = ic.id_componente
WHERE pd.id_det_pedido IN (
    SELECT ocd.id_det_pedido 
    FROM ordenes_compra_detalle ocd 
    WHERE ocd.descripcion LIKE '%CAMIONETA%'
)
ORDER BY pd.id_det_pedido;

-- 3. Ver si hay duplicados en ordenes_compra_detalle
SELECT 
    ocd.descripcion,
    COUNT(*) as num_registros,
    SUM(ocd.cantidad_solicitada) as suma_solicitada,
    AVG(ocd.cantidad_solicitada) as promedio_solicitada
FROM ordenes_compra_detalle ocd
WHERE ocd.descripcion LIKE '%CAMIONETA%'
GROUP BY ocd.descripcion;

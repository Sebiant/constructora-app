<?php
// Test directo para verificar la API de productos
header('Content-Type: application/json; charset=utf-8');

require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';

try {
    $db = new Database();
    $connection = $db->getConnection();

    $idPedido = 5; // ID del pedido aprobado

    // Probar getProductosPedido
    $sql = "SELECT 
                pd.id_det_pedido,
                CASE 
                    WHEN pd.tipo_componente = 'material' AND m.id_material IS NOT NULL THEN m.nombremat
                    WHEN pd.tipo_componente = 'item' AND i.id_item IS NOT NULL THEN i.nombre_item
                    WHEN pd.tipo_componente = 'material_extra' AND me.id_material IS NOT NULL THEN 
                        CONCAT('Material Extra #', me.id_material, ' (', m2.nombremat, ')')
                    ELSE CONCAT('Componente ', pd.tipo_componente, ' #', pd.id_componente)
                END as descripcion,
                CASE 
                    WHEN pd.tipo_componente = 'material' AND m.id_material IS NOT NULL THEN m.idunidad
                    WHEN pd.tipo_componente = 'item' AND i.id_item IS NOT NULL THEN i.unidad
                    WHEN pd.tipo_componente = 'material_extra' AND me.id_material IS NOT NULL THEN m2.idunidad
                    ELSE 'unidad'
                END as unidad,
                pd.cantidad,
                pd.precio_unitario,
                pd.subtotal,
                COALESCE(ocd.cantidad_comprada, 0) as cantidad_comprada,
                (pd.cantidad - COALESCE(ocd.cantidad_comprada, 0)) as cantidad_disponible,
                CASE 
                    WHEN COALESCE(ocd.cantidad_comprada, 0) >= pd.cantidad THEN 'comprado'
                    WHEN COALESCE(ocd.cantidad_comprada, 0) > 0 THEN 'parcialmente_comprado'
                    ELSE 'disponible'
                END as estado_producto,
                CASE 
                    WHEN COALESCE(ocd.cantidad_comprada, 0) >= pd.cantidad THEN 0
                    WHEN COALESCE(ocd.cantidad_comprada, 0) > 0 THEN (pd.cantidad - ocd.cantidad_comprada)
                    ELSE pd.cantidad
                END as cantidad_maxima_seleccionable
            FROM pedidos_detalle pd
            LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
            LEFT JOIN materiales m ON pd.tipo_componente = 'material' AND pd.id_componente = m.id_material
            LEFT JOIN items i ON pd.tipo_componente = 'item' AND pd.id_item = i.id_item
            LEFT JOIN materiales_extra_presupuesto me ON pd.tipo_componente = 'material_extra' AND pd.id_material_extra = me.id_material_extra
            LEFT JOIN materiales m2 ON pd.tipo_componente = 'material_extra' AND me.id_material = m2.id_material
            WHERE pd.id_pedido = ?
            AND (ocd.id_orden_detalle IS NULL OR ocd.cantidad_comprada < pd.cantidad)
            ORDER BY pd.tipo_componente, descripcion";

    $stmt = $connection->prepare($sql);
    $stmt->execute([$idPedido]);
    $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $productos,
        'count' => count($productos),
        'id_pedido' => $idPedido,
        'message' => 'API de productos funcionando'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Error en API de productos'
    ]);
}
?>

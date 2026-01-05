<?php
// Test directo para verificar la API de pedidos
header('Content-Type: application/json; charset=utf-8');

require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';

try {
    $db = new Database();
    $connection = $db->getConnection();

    // Probar getPedidosDisponibles
    $sql = "SELECT 
                p.id_pedido,
                p.fecha_pedido,
                p.total,
                p.estado,
                COALESCE(p.estado_compra, 'pendiente') as estado_compra,
                CONCAT('Pedido #', p.id_pedido, ' - Total: $', FORMAT(p.total, 2), ' - ', 
                       CASE 
                           WHEN COUNT(pd.id_det_pedido) > 0 THEN 
                               CONCAT(COUNT(DISTINCT CASE WHEN ocd.id_orden_detalle IS NULL OR ocd.cantidad_comprada < pd.cantidad THEN pd.id_det_pedido END), ' productos disponibles')
                           ELSE 'Sin productos disponibles'
                       END) as descripcion_pedido,
                COUNT(DISTINCT pd.id_det_pedido) as total_productos,
                COUNT(DISTINCT CASE WHEN ocd.id_orden_detalle IS NULL OR ocd.cantidad_comprada < pd.cantidad THEN pd.id_det_pedido END) as productos_disponibles
            FROM pedidos p
            LEFT JOIN pedidos_detalle pd ON p.id_pedido = pd.id_pedido
            LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
            WHERE p.estado = 'aprobado'
            GROUP BY p.id_pedido, p.fecha_pedido, p.total, p.estado, p.estado_compra
            HAVING productos_disponibles > 0
            ORDER BY p.fecha_pedido DESC";

    $stmt = $connection->prepare($sql);
    $stmt->execute();
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $pedidos,
        'count' => count($pedidos),
        'message' => 'API de pedidos funcionando'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Error en API de pedidos'
    ]);
}
?>

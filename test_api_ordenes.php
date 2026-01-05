<?php
// Archivo de prueba para la API de órdenes de compra
header('Content-Type: application/json; charset=utf-8');

require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';

try {
    $db = new Database();
    $connection = $db->getConnection();

    // Simular la llamada a getOrdenesCompra
    $sql = "SELECT 
                oc.id_orden_compra,
                oc.numero_orden,
                oc.id_pedido,
                p.nombre as nombre_proveedor,
                oc.fecha_orden,
                oc.fecha_esperada,
                oc.numero_factura,
                oc.fecha_factura,
                oc.subtotal,
                oc.impuestos,
                oc.total,
                oc.estado,
                oc.observaciones,
                oc.fecha_aprobacion,
                oc.fechareg,
                oc.fechaupdate
            FROM ordenes_compra oc
            LEFT JOIN provedores p ON oc.id_provedor = p.id_provedor
            ORDER BY oc.fecha_orden DESC";

    $stmt = $connection->prepare($sql);
    $stmt->execute();
    $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $ordenes,
        'count' => count($ordenes),
        'message' => 'API funcionando correctamente'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Error en la API'
    ]);
}
?>

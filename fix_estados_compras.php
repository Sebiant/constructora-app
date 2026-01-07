<?php
require_once 'config/database.php';

try {
    $connection = Database::getConnection();
    
    // Actualizar órdenes que tienen compras pero estado incorrecto
    $sql = "UPDATE ordenes_compra oc 
             SET oc.estado = CASE 
                 WHEN EXISTS (
                     SELECT 1 FROM compras_finales cf 
                     WHERE cf.id_orden_compra = oc.id_orden_compra
                 ) THEN 
                     CASE 
                         WHEN EXISTS (
                             SELECT 1 FROM ordenes_compra_detalle ocd 
                             WHERE ocd.id_orden_compra = oc.id_orden_compra 
                             AND ocd.cantidad_recibida < ocd.cantidad_comprada
                         ) THEN 'parcialmente_recibida'
                         ELSE 'recibida'
                     END
                 ELSE oc.estado
             END
             WHERE oc.estado IN ('pendiente', 'aprobada')
             AND EXISTS (
                 SELECT 1 FROM compras_finales cf 
                 WHERE cf.id_orden_compra = oc.id_orden_compra
             )";
    
    $stmt = $connection->prepare($sql);
    $stmt->execute();
    
    $affected = $stmt->rowCount();
    echo "Se actualizaron $affected órdenes con estado incorrecto\n";
    
    // Mostrar estados actualizados
    $stmt = $connection->query("
        SELECT oc.id_orden_compra, oc.numero_orden, oc.estado,
               COUNT(cf.id_compra_final) as compras_count
        FROM ordenes_compra oc
        LEFT JOIN compras_finales cf ON oc.id_orden_compra = cf.id_orden_compra
        WHERE cf.id_compra_final IS NOT NULL
        GROUP BY oc.id_orden_compra, oc.numero_orden, oc.estado
        ORDER BY oc.id_orden_compra
    ");
    
    echo "\nEstados actuales de órdenes con compras:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "OC {$row['numero_orden']} (ID: {$row['id_orden_compra']}) - Estado: {$row['estado']} - Compras: {$row['compras_count']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

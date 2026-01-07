<?php
require_once 'config/database.php';

try {
    $connection = Database::getConnection();
    
    // Actualizar órdenes con estado vacío a 'pendiente'
    $stmt = $connection->prepare('UPDATE ordenes_compra SET estado = ? WHERE estado = ? OR estado IS NULL');
    $stmt->execute(['pendiente', '']);
    
    $affected = $stmt->rowCount();
    echo "Se actualizaron $affected órdenes con estado vacío a 'pendiente'\n";
    
    // Verificar el resultado
    $stmt = $connection->query('SELECT COUNT(*) as total FROM ordenes_compra WHERE estado = "" OR estado IS NULL');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Quedan {$result['total']} órdenes con estado vacío\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

<?php
require_once 'config/database.php';

try {
    $connection = Database::getConnection();
    
    // Buscar la orden específica
    $stmt = $connection->prepare('SELECT id_orden_compra, numero_orden, estado FROM ordenes_compra WHERE numero_orden LIKE ?');
    $stmt->execute(['%OC-2026-0002%']);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Estados encontrados:\n";
    foreach ($result as $row) {
        echo "ID: {$row['id_orden_compra']}, Número: {$row['numero_orden']}, Estado: '{$row['estado']}'\n";
    }
    
    // Mostrar todos los estados únicos en la tabla
    $stmt = $connection->query('SELECT DISTINCT estado FROM ordenes_compra ORDER BY estado');
    $estados = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "\nTodos los estados en la BD:\n";
    foreach ($estados as $estado) {
        echo "- '$estado'\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

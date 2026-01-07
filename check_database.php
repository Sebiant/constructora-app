<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "Conexión exitosa a la base de datos\n";
    
    // Verificar si las columnas ya existen
    $stmt = $conn->prepare('DESCRIBE ordenes_compra');
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Columnas actuales en ordenes_compra: " . implode(', ', $columns) . "\n";
    
    if (in_array('id_orden_original', $columns)) {
        echo "La columna id_orden_original ya existe\n";
    } else {
        echo "La columna id_orden_original NO existe. Se necesita ejecutar el migration.\n";
    }
    
    if (in_array('es_complementaria', $columns)) {
        echo "La columna es_complementaria ya existe\n";
    } else {
        echo "La columna es_complementaria NO existe. Se necesita ejecutar el migration.\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

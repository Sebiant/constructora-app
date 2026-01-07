<?php
// Script para ejecutar el migration de órdenes complementarias
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "Conexión exitosa a la base de datos\n";
    
    // Verificar columnas existentes
    $stmt = $conn->prepare('DESCRIBE ordenes_compra');
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Ejecutando migration para añadir campos de órdenes complementarias...\n";
    
    // 1. Añadir columna id_orden_original si no existe
    if (!in_array('id_orden_original', $columns)) {
        echo "Añadiendo columna id_orden_original...\n";
        $conn->exec("ALTER TABLE ordenes_compra ADD COLUMN id_orden_original INT NULL COMMENT 'ID de la orden de compra original (para órdenes complementarias)'");
        echo "✓ Columna id_orden_original añadida\n";
    } else {
        echo "✓ Columna id_orden_original ya existe\n";
    }
    
    // 2. Crear índice si no existe
    try {
        $conn->exec("CREATE INDEX idx_ordenes_compra_orden_original ON ordenes_compra(id_orden_original)");
        echo "✓ Índice idx_ordenes_compra_orden_original creado\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "✓ Índice idx_ordenes_compra_orden_original ya existe\n";
        } else {
            throw $e;
        }
    }
    
    // 3. Añadir constraint FK si no existe
    try {
        $conn->exec("ALTER TABLE ordenes_compra ADD CONSTRAINT fk_ordenes_compra_orden_original FOREIGN KEY (id_orden_original) REFERENCES ordenes_compra(id_orden_compra) ON DELETE SET NULL ON UPDATE CASCADE");
        echo "✓ Constraint fk_ordenes_compra_orden_original añadida\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate constraint name') !== false || strpos($e->getMessage(), 'already exists') !== false) {
            echo "✓ Constraint fk_ordenes_compra_orden_original ya existe\n";
        } else {
            throw $e;
        }
    }
    
    // 4. Añadir columna es_complementaria si no existe
    if (!in_array('es_complementaria', $columns)) {
        echo "Añadiendo columna es_complementaria...\n";
        $conn->exec("ALTER TABLE ordenes_compra ADD COLUMN es_complementaria BOOLEAN DEFAULT FALSE COMMENT 'TRUE si es una orden complementaria por entrega parcial'");
        echo "✓ Columna es_complementaria añadida\n";
    } else {
        echo "✓ Columna es_complementaria ya existe\n";
    }
    
    // 5. Añadir columna motivo_complementaria si no existe
    if (!in_array('motivo_complementaria', $columns)) {
        echo "Añadiendo columna motivo_complementaria...\n";
        $conn->exec("ALTER TABLE ordenes_compra ADD COLUMN motivo_complementaria VARCHAR(500) NULL COMMENT 'Motivo por el que se generó esta orden complementaria'");
        echo "✓ Columna motivo_complementaria añadida\n";
    } else {
        echo "✓ Columna motivo_complementaria ya existe\n";
    }
    
    // 6. Actualizar órdenes existentes
    $conn->exec("UPDATE ordenes_compra SET es_complementaria = FALSE WHERE es_complementaria IS NULL");
    echo "✓ Órdenes existentes actualizadas\n";
    
    echo "\n✅ Migration completado exitosamente!\n";
    
    // Verificar estructura final
    $stmt = $conn->prepare('DESCRIBE ordenes_compra');
    $stmt->execute();
    $finalColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "\nColumnas finales en ordenes_compra: " . implode(', ', $finalColumns) . "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

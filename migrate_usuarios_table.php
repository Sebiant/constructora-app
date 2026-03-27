<?php
require_once 'config/database.php';
try {
    $db = Database::getConnection();
    echo "Verificando tabla gr_usuarios...\n";
    
    // Check if id_proyecto exists
    $res = $db->query("DESCRIBE gr_usuarios");
    $columns = $res->fetchAll(PDO::FETCH_ASSOC);
    $hasIdProyecto = false;
    foreach ($columns as $col) {
        if ($col['Field'] === 'id_proyecto') {
            $hasIdProyecto = true;
            break;
        }
    }
    
    if (!$hasIdProyecto) {
        echo "Agregando columna id_proyecto a gr_usuarios...\n";
        $db->exec("ALTER TABLE gr_usuarios ADD COLUMN id_proyecto INT NULL AFTER u_activo");
        echo "Columna agregada.\n";
    } else {
        echo "La columna id_proyecto ya existe.\n";
    }

    // Check gr_perfiles
    $res = $db->query("SHOW TABLES LIKE 'gr_perfiles'");
    if ($res->rowCount() === 0) {
        echo "Creando tabla gr_perfiles...\n";
        $db->exec("CREATE TABLE gr_perfiles (
            codigo_perfil INT PRIMARY KEY,
            nombre_perfil VARCHAR(50) NOT NULL,
            estado TINYINT DEFAULT 1
        )");
        $db->exec("INSERT INTO gr_perfiles (codigo_perfil, nombre_perfil) VALUES 
            (1, 'Administrador'),
            (2, 'Usuario'),
            (3, 'Consultor')
        ");
        echo "Tabla gr_perfiles creada con perfiles iniciales.\n";
    } else {
        echo "La tabla gr_perfiles ya existe.\n";
    }
    
    echo "\nMigración completada exitosamente.\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

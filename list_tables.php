<?php
require_once 'config/ConexionBD.php';
try {
    $db = new ConexionBD();
    $db->resolviendo_pregunta("SHOW TABLES");
    foreach ($db->obtenerResultados() as $table) {
        echo array_values($table)[0] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

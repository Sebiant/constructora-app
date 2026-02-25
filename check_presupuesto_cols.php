<?php
require_once 'config/ConexionBD.php';
try {
    $db = new ConexionBD();
    $db->resolviendo_pregunta("DESCRIBE presupuestos");
    foreach ($db->obtenerResultados() as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

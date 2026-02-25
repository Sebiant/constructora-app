<?php
require_once 'config/ConexionBD.php';
try {
    $db = new ConexionBD();
    $db->resolviendo_pregunta("DESCRIBE gr_usuarios");
    foreach ($db->obtenerResultados() as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

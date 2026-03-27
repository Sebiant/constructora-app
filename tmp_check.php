<?php
require_once 'config/ConexionBD.php';
try {
    $db = new ConexionBD();
    echo "COLUMNS FOR gr_usuarios:\n";
    $db->resolviendo_pregunta("DESCRIBE gr_usuarios");
    print_r($db->obtenerResultados());
    
    echo "\n\nTABLES:\n";
    $db->resolviendo_pregunta("SHOW TABLES");
    print_r($db->obtenerResultados());
} catch (Exception $e) {
    echo $e->getMessage();
}

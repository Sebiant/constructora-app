<?php
require_once 'config/ConexionBD.php';
try {
    $db = new ConexionBD();
    $db->resolviendo_pregunta("ALTER TABLE gr_usuarios ADD COLUMN u_ultimo_acceso DATETIME NULL AFTER u_activo");
    echo "Columna u_ultimo_acceso añadida exitosamente.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

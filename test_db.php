<?php
require_once 'config/ConexionBD.php';
try {
    $db = new ConexionBD();
    echo "Conexión exitosa";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

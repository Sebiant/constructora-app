<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=gesconjm_sgicontrol", "root", "");
    echo "Conexión exitosa";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

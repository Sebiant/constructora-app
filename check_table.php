<?php
require 'config/database.php';
try {
    $db = Database::getConnection();
    $res = $db->query("DESCRIBE gr_usuarios");
    $columns = $res->fetchAll(PDO::FETCH_ASSOC);
    print_r($columns);
} catch (Exception $e) {
    echo $e->getMessage();
}

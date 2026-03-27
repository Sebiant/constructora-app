<?php
require 'config/database.php';
try {
    $db = Database::getConnection();
    $res = $db->query("SHOW TABLES LIKE 'gr_perfiles'");
    if ($res->rowCount() > 0) {
        $res2 = $db->query("SELECT * FROM gr_perfiles");
        print_r($res2->fetchAll(PDO::FETCH_ASSOC));
    } else {
        echo "gr_perfiles doesn't exist";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}

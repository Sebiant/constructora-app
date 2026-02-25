<?php
require_once 'vendor/autoload.php';
require_once 'config/ConexionBD.php';
require_once 'src/Auth/Domain/Models/User.php';

$user = new Src\Auth\Domain\Models\User();
$result = $user->verifyCredentials('hhramirez@gmail.com', 'Gescon2025*');

if ($result) {
    echo "Login exitoso para: " . $result['u_nombre'];
} else {
    echo "Login fallido";
}
?>

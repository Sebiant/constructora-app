<?php
ini_set('display_errors', 1);  // Habilita la visualizaci�n de errores
error_reporting(E_ALL);        // Muestra todos los errores


//include ("ClaseHTML.php");
include ("ClaseUsuario.php");
//$index=new HTML();
$oUsuario=new Usuario();
$oUsuario->index();

?>

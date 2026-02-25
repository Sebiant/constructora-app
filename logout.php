<?php
/**
 * Logout Proxy
 * Redirige la solicitud al AuthController para manejar el cierre de sesión.
 */
header("Location: /sgigescomnew/src/Auth/Interfaces/Controllers/AuthController.php?action=logout");
exit;

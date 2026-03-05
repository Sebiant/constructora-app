<?php

namespace Src\Auth\Interfaces\Controllers;

use Src\Auth\Domain\Models\User;
use Src\Auth\Domain\Models\Session;

require_once __DIR__ . '/../../../../vendor/autoload.php';

session_start();

class AuthController
{
    private $user;
    
    public function __construct()
    {
        $this->user = new User();
    }
    
    public function login()
    {
        header('Content-Type: application/json');
        
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new \Exception('Método no permitido');
            }
            
            if (!isset($_POST["u_login"], $_POST["u_password"])) {
                throw new \Exception('Por favor, ingrese usuario y contraseña');
            }
            
            $email = trim($_POST["u_login"]);
            $password = trim($_POST["u_password"]);
            
            // Validar formato de correo electrónico
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \Exception('Por favor, ingrese un correo electrónico válido');
            }
            
            // Validar contraseña
            if (empty($password) || strlen($password) < 6) {
                throw new \Exception('La contraseña debe tener al menos 6 caracteres');
            }
            
            // Verificar credenciales
            $userData = $this->user->verifyCredentials($email, $password);
            
            if (!$userData) {
                throw new \Exception('El usuario o la contraseña son incorrectos');
            }
            
            // Crear sesión
            $session = new Session($userData);
            $_SESSION['seguridad'] = json_encode([
                'u_login' => $userData['u_login'],
                'u_perfil' => $userData['codigo_perfil'],
                'u_id' => $userData['u_id'],
                'u_nombre' => $userData['u_nombre'],
                'u_apellido' => $userData['u_apellido']
            ]);
            
            // Actualizar último acceso
            $this->user->updateLastAccess($userData['u_id']);
            
            // Configurar cookie de recordarme si se solicitó
            if (isset($_POST['remember']) && $_POST['remember'] == 'on') {
                $token = bin2hex(random_bytes(32));
                setcookie('remember_token', $token, time() + (30 * 24 * 60 * 60), '/', '', true, true);
                // Aquí podrías guardar el token en la base de datos
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'redirect' => '/sgigesconnew/src/Layout/Interfaces/Views/layoutView.php',
                'user' => [
                    'id' => $userData['u_id'],
                    'login' => $userData['u_login'],
                    'perfil' => $userData['codigo_perfil'],
                    'nombre' => $userData['u_nombre'],
                    'apellido' => $userData['u_apellido']
                ]
            ]);
            
        } catch (\Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
    
    public function logout()
    {
        // Obtener ID del usuario antes de destruir la sesión
        $userId = null;
        if (isset($_SESSION['seguridad'])) {
            $sessionData = json_decode($_SESSION['seguridad'], true);
            $userId = $sessionData['u_id'] ?? null;
        }
        
        // Destruir sesión
        session_destroy();
        
        // Eliminar cookies
        if (isset($_COOKIE['remember_token'])) {
            setcookie('remember_token', '', time() - 3600, '/', '', true, true);
            unset($_COOKIE['remember_token']);
        }
        
        // Registrar logout si tenemos el ID del usuario
        if ($userId) {
            $this->user->logout($userId);
        }
        
        // Redirigir al login
        header("Location: /sgigesconnew/src/Auth/Interfaces/Views/loginView.php");
        exit;
    }
    
    public function checkSession()
    {
        header('Content-Type: application/json');
        
        if (isset($_SESSION['seguridad'])) {
            $sessionData = json_decode($_SESSION['seguridad'], true);
            echo json_encode([
                'authenticated' => true,
                'user' => $sessionData
            ]);
        } else {
            echo json_encode([
                'authenticated' => false
            ]);
        }
    }
}

// Manejar las solicitudes
$action = $_GET['action'] ?? 'login';
$controller = new AuthController();

switch ($action) {
    case 'login':
        $controller->login();
        break;
    case 'logout':
        $controller->logout();
        break;
    case 'check':
        $controller->checkSession();
        break;
    default:
        header('Location: /sgigesconnew/src/Auth/Interfaces/Views/loginView.php');
        exit;
}
?>

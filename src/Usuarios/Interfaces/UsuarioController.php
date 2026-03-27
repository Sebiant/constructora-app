<?php

namespace Src\Usuarios\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Usuarios\Infrastructure\Persistence\MySqlUsuarioRepository;
use Src\Usuarios\Application\GetAllUsuarios;
use Src\Usuarios\Application\CreateUsuario;
use Src\Usuarios\Application\UpdateUsuario;
use Src\Usuarios\Application\DeleteUsuario;
use Src\Usuarios\Application\GetUsuarioById;
use Src\Usuarios\Domain\Usuario;

$connection = \Database::getConnection();
$repo = new MySqlUsuarioRepository($connection);

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {
        case 'getAll':
            $useCase = new GetAllUsuarios($repo);
            $usuarios = $useCase->execute();
            echo json_encode($usuarios);
            break;

        case 'getById':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                break;
            }
            $useCase = new GetUsuarioById($repo);
            $usuario = $useCase->execute((int)$id);
            if (!$usuario) {
                echo json_encode(['success' => false, 'error' => 'Usuario no encontrado']);
                break;
            }
            echo json_encode($usuario->toArray());
            break;

        case 'create':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['u_login']) || empty($data['u_password']) || empty($data['u_nombre'])) {
                echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
                break;
            }
            
            $usuario = Usuario::crear(
                $data['u_login'],
                $data['u_password'],
                $data['u_nombre'],
                $data['u_apellido'] ?? null,
                (int)($data['codigo_perfil'] ?? 2),
                (bool)($data['u_activo'] ?? true),
                isset($data['id_proyecto']) ? (int)$data['id_proyecto'] : null
            );
            
            $useCase = new CreateUsuario($repo);
            $nuevoUsuario = $useCase->execute($usuario);
            echo json_encode(['success' => true, 'usuario' => $nuevoUsuario->toArray()]);
            break;

        case 'update':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['u_id']) || empty($data['u_login']) || empty($data['u_nombre'])) {
                echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
                break;
            }
            
            $usuario = new Usuario(
                (int)$data['u_id'],
                $data['u_login'],
                $data['u_nombre'],
                null, // Password will be handled separately if provided
                $data['u_apellido'] ?? null,
                (int)($data['codigo_perfil'] ?? 2),
                (bool)($data['u_activo'] ?? true),
                isset($data['id_proyecto']) ? (int)$data['id_proyecto'] : null
            );
            
            if (!empty($data['u_password'])) {
                $usuario->updatePassword($data['u_password']);
            }
            
            $useCase = new UpdateUsuario($repo);
            $result = $useCase->execute($usuario);
            echo json_encode(['success' => $result]);
            break;

        case 'delete':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                break;
            }
            $useCase = new DeleteUsuario($repo);
            $result = $useCase->execute((int)$id);
            echo json_encode(['success' => $result]);
            break;

        case 'getRoles':
            echo json_encode(['success' => true, 'roles' => $repo->getRoles()]);
            break;

        case 'getProyectos':
            echo json_encode(['success' => true, 'proyectos' => $repo->getProyectos()]);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Acción no válida']);
            break;
    }
} catch (\Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

exit;

<?php
namespace Src\Provedores\Interfaces;

ob_start();
ini_set('display_errors', '0');

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Provedores\Infrastructure\ProvedorMySQLRepository;
use Src\Provedores\Application\GetAllProvedores;
use Src\Provedores\Application\CreateProvedor;
use Src\Provedores\Application\GetProvedorById;
use Src\Provedores\Application\UpdateProvedor;
use Src\Provedores\Application\DeleteProvedor;
use Src\Provedores\Domain\Provedor;

$connection = \Database::getConnection();
$repo = new ProvedorMySQLRepository($connection);

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {
        case 'create':
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['nombre'])) {
                echo json_encode(['success' => false, 'error' => 'Nombre es requerido']);
                exit;
            }

            $estado = true;
            if (isset($data['estado'])) {
                $estado = ($data['estado'] === '1' || $data['estado'] === 1 || $data['estado'] === true || $data['estado'] === 'true');
            }

            $provedor = Provedor::crear(
                $data['nombre'],
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['whatsapp'] ?? null,
                $data['direccion'] ?? null,
                $data['contacto'] ?? null,
                $estado
            );

            $useCase = new CreateProvedor($repo);
            $resultado = $useCase->execute($provedor);

            ob_clean();
            echo json_encode([
                'success' => true,
                'provedor' => $resultado->toArray()
            ]);
            break;

        case 'getAll':
            $useCase = new GetAllProvedores($repo);
            $data = $useCase->execute();

            ob_clean();
            echo json_encode($data);
            break;

        case 'getActivos':
            ob_clean();
            echo json_encode([
                'success' => true,
                'provedores' => $repo->getActivos()
            ]);
            break;

        case 'getById':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['error' => 'Se requiere el ID del provedor']);
                exit;
            }

            $useCase = new GetProvedorById($repo);
            $provedor = $useCase->execute((int)$id);

            if (empty($provedor)) {
                ob_clean();
                echo json_encode(['error' => 'Provedor no encontrado']);
                exit;
            }

            ob_clean();
            echo json_encode($provedor);
            break;

        case 'update':
            $input = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($input['id_provedor']) || !isset($input['nombre'])) {
                http_response_code(400);
                ob_clean();
                echo json_encode(['error' => 'Campos requeridos: id_provedor, nombre']);
                break;
            }

            try {
                $estado = true;
                if (isset($input['estado'])) {
                    $estado = ($input['estado'] === '1' || $input['estado'] === 1 || $input['estado'] === true || $input['estado'] === 'true');
                }

                $useCase = new UpdateProvedor($repo);
                $result = $useCase->execute(
                    (int)$input['id_provedor'],
                    $input['nombre'],
                    $input['telefono'] ?? null,
                    $input['email'] ?? null,
                    $input['whatsapp'] ?? null,
                    $input['direccion'] ?? null,
                    $input['contacto'] ?? null,
                    $estado
                );

                http_response_code(200);
                ob_clean();
                echo json_encode([
                    'success' => true,
                    'message' => 'Provedor actualizado exitosamente',
                    'data' => $result['provedor']->toArray()
                ]);

            } catch (\Exception $e) {
                http_response_code(400);
                ob_clean();
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'delete':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                $input = $_POST;
            }

            $id = $input['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                ob_clean();
                echo json_encode(['success' => false, 'error' => 'ID requerido']);
                break;
            }

            $useCase = new DeleteProvedor($repo);
            $ok = $useCase->execute((int)$id);

            ob_clean();
            echo json_encode(['success' => $ok]);
            break;

        default:
            http_response_code(404);
            ob_clean();
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'getAll' => 'Obtener todos los provedores',
                    'getActivos' => 'Obtener provedores activos',
                    'create' => 'Crear nuevo provedor',
                    'getById' => 'Obtener provedor por ID',
                    'update' => 'Actualizar provedor',
                    'delete' => 'Eliminar provedor'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    ob_clean();
    echo json_encode(['error' => $e->getMessage()]);
}

exit;

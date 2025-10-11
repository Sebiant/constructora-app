<?php
namespace Src\Clientes\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Clientes\Infrastructure\ClienteMySQLRepository;
use Src\Clientes\Application\GetAllClientes;
use Src\Clientes\Application\CreateCliente;
use Src\Clientes\Application\UpdateCliente;
use Src\Clientes\Application\DeleteCliente;
use Src\Clientes\Application\GetClienteById;

$db = new \Database();
$connection = $db->getConnection();
$repo = new ClienteMySQLRepository($connection);

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {
        case 'getAll':
            $getAllUseCase = new GetAllClientes($repo);
            $data = $getAllUseCase->execute();
            echo json_encode($data);
            break;

        case 'getById':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del cliente es requerido']);
                break;
            }
            
            try {
                $getByIdUseCase = new GetClienteById($repo);
                $clienteData = $getByIdUseCase->execute((int)$id);
                
                if (!empty($clienteData)) {
                    echo json_encode([
                        'success' => true,
                        'data' => $clienteData
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Cliente no encontrado'
                    ]);
                }
                
            } catch (\Exception $e) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'create':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['nit']) || !isset($input['nombre'])) {
                http_response_code(400);
                echo json_encode(['error' => 'NIT y nombre son requeridos']);
                break;
            }
            
            try {
                $estado = $input['estado'] ?? true;
                if (is_string($estado)) {
                    $estado = ($estado === 'true' || $estado === '1' || $estado === 'activo');
                }
                
                $createUseCase = new CreateCliente($repo);
                $cliente = $createUseCase->execute(
                    $input['nit'],
                    $input['nombre'],
                    $estado
                );
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Cliente creado exitosamente',
                    'data' => [
                        'id' => $cliente->getId(),
                        'nit' => $cliente->getNit(),
                        'nombre' => $cliente->getNombre(),
                        'estado' => $cliente->getEstado()
                    ]
                ]);
                
            } catch (\Exception $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        case 'update':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id']) || !isset($input['nit']) || !isset($input['nombre'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID, NIT y nombre son requeridos']);
                break;
            }
            
            try {
                $estado = $input['estado'] ?? true;
                if (is_string($estado)) {
                    $estado = ($estado === 'true' || $estado === '1' || $estado === 'activo');
                }

                $updateUseCase = new UpdateCliente($repo);
                $cliente = $updateUseCase->execute(
                    (int)$input['id'],
                    $input['nit'],
                    $input['nombre'],
                    $estado
                );
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Cliente actualizado exitosamente',
                    'data' => [
                        'id' => $cliente->getId(),
                        'nit' => $cliente->getNit(),
                        'nombre' => $cliente->getNombre(),
                        'estado' => $cliente->getEstado()
                    ]
                ]);
                
            } catch (\Exception $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        case 'delete':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID es requerido']);
                break;
            }
            
            try {
                $deleteUseCase = new DeleteCliente($repo);
                $result = $deleteUseCase->execute((int)$input['id']);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Cliente eliminado exitosamente',
                    'data' => $result
                ]);
                
            } catch (\Exception $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        case 'toggleEstado':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del cliente es requerido']);
                break;
            }

            try {
                $toggleUseCase = new \Src\Clientes\Application\ToggleClienteEstado($repo);
                $nuevoEstado = $toggleUseCase->execute((int)$input['id']);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Estado actualizado correctamente',
                    'nuevoEstado' => $nuevoEstado ? 'Activo' : 'Inactivo'
                ]);
            } catch (\Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'getAll' => 'Obtener todos los clientes',
                    'getById' => 'Obtener cliente por ID', 
                    'create' => 'Crear nuevo cliente',
                    'update' => 'Actualizar cliente',
                    'delete' => 'Eliminar cliente'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;
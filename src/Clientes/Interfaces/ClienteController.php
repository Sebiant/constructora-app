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
                throw new \Exception("ID del cliente es requerido");
            }
            
            $getByIdUseCase = new GetClienteById($repo);
            $clienteData = $getByIdUseCase->execute((int)$id);
            
            if (!empty($clienteData)) {
                echo json_encode($clienteData);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Cliente no encontrado']);
            }
            break;

        case 'create':
            //por implementar
            break;

        case 'update':
            //por implementar
            break;

        case 'delete':
            //por implementar
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
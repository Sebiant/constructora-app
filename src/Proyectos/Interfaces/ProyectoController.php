<?php
namespace Src\Proyectos\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Proyectos\Infrastructure\ProyectoMySQLRepository;
use Src\Proyectos\Application\GetAllProyectos;
use Src\Proyectos\Application\CreateProyecto;
use Src\Proyectos\Domain\Proyecto;

$db = new \Database();
$connection = $db->getConnection();
$repo = new ProyectoMySQLRepository($connection);

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {
        case 'create':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (empty($data['nombre']) || empty($data['id_cliente']) || empty($data['fecha_inicio'])) {
                echo json_encode(['success' => false, 'error' => 'Nombre, id_cliente y fecha_inicio son requeridos']);
                exit;
            }

            // Convertir el estado de '1'/'0' a 'activo'/'inactivo'
            $estado = 'activo'; // Por defecto activo - ¡DEFINIRLA ANTES DE USARLA!
            if (isset($data['estado'])) {
                $estado = ($data['estado'] === '1' || $data['estado'] === 'activo') ? 'activo' : 'inactivo';
            }

            $proyecto = Proyecto::crear(
                $data['nombre'],
                $data['objeto'] ?? null,
                $data['numero_contrato'] ?? null,
                isset($data['valor']) ? (float)$data['valor'] : null,
                $data['id_cliente'],
                $data['fecha_inicio'],
                $data['fecha_fin'] ?? null,
                $estado, // Usar el estado convertido
                $data['observaciones'] ?? null
            );

            $useCase = new CreateProyecto($repo);
            $resultado = $useCase->execute($proyecto);

            echo json_encode([
                'success' => true,
                'proyecto' => $resultado->toArray()
            ]);
            break;

        case 'getAll':
            $getAllUseCase = new GetAllProyectos($repo);
            $data = $getAllUseCase->execute();

            $proyectos = array_map(function ($p) {
                if ($p instanceof Proyecto) {
                    $arr = $p->toArray();
                    $arr['estado'] = (bool)$arr['estado'];
                    return $arr;
                }
                return $p;
            }, $data);

            echo json_encode($proyectos);
            break;

        case 'getById':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['error' => 'Se requiere el ID del proyecto']);
                exit;
            }

            $getByIdUseCase = new \Src\Proyectos\Application\GetProyectoById($repo);
            $proyecto = $getByIdUseCase->execute((int)$id);

            if (empty($proyecto)) {
                echo json_encode(['error' => 'Proyecto no encontrado']);
                exit;
            }

            echo json_encode($proyecto);
            break;

        case 'update':
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validaciones
            if (!isset($input['id_proyecto']) || !isset($input['nombre']) || 
                !isset($input['id_cliente']) || !isset($input['fecha_inicio'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Campos requeridos: id_proyecto, nombre, id_cliente, fecha_inicio']);
                break;
            }
            
            try {
                // Convertir el estado para el update
                $estado = true; // Por defecto activo
                if (isset($input['estado'])) {
                    $estado = ($input['estado'] === '1' || $input['estado'] === 'activo' || $input['estado'] === true);
                }

                $updateUseCase = new \Src\Proyectos\Application\UpdateProyecto($repo);
                $result = $updateUseCase->execute(
                    (int)$input['id_proyecto'],
                    $input['nombre'],
                    $input['objeto'] ?? null,
                    $input['numero_contrato'] ?? null,
                    isset($input['valor']) ? (float)$input['valor'] : null,
                    (int)$input['id_cliente'],
                    $input['fecha_inicio'],
                    $input['fecha_fin'] ?? null,
                    $input['observaciones'] ?? null,
                    $estado
                );
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Proyecto actualizado exitosamente',
                    'data' => [
                        'id_proyecto' => $result['proyecto']->getId(),
                        'nombre' => $result['proyecto']->getNombre(),
                        'objeto' => $result['proyecto']->getObjeto(),
                        'numero_contrato' => $result['proyecto']->getNumeroContrato(),
                        'valor' => $result['proyecto']->getValor(),
                        'id_cliente' => $result['proyecto']->getIdCliente(),
                        'fecha_inicio' => $result['proyecto']->getFechaInicio(),
                        'fecha_fin' => $result['proyecto']->getFechaFin(),
                        'estado' => $result['proyecto']->getEstado(),
                        'observaciones' => $result['proyecto']->getObservaciones()
                    ]
                ]);
                
            } catch (\Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'delete':
            echo json_encode(['message' => 'Funcionalidad no implementada aún']);
            break;

        case 'getClientes':
            $clientes = $repo->getClientes();
            echo json_encode([
                'success' => true,
                'clientes' => $clientes
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'getAll' => 'Obtener todos los proyectos',
                    'create' => 'Crear nuevo proyecto'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;
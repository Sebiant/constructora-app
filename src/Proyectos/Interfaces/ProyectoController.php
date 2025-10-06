<?php
namespace Src\Proyectos\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Proyectos\Infrastructure\ProyectoMySQLRepository;
use Src\Proyectos\Application\GetAllProyectos;
use Src\Proyectos\Application\CreateProyecto;
use Src\Proyectos\Domain\Proyecto;

// 🔥 Inicialización
$db = new \Database();
$connection = $db->getConnection();
$repo = new ProyectoMySQLRepository($connection);

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {
        case 'create':
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['nombre']) || empty($data['id_cliente']) || empty($data['fecha_inicio'])) {
                echo json_encode(['error' => 'Nombre, id_cliente y fecha_inicio son requeridos']);
                exit;
            }

            $proyecto = Proyecto::crear(
                $data['nombre'],
                $data['id_cliente'],
                $data['fecha_inicio'],
                $data['fecha_fin'] ?? null,
                $data['estado'] ?? 'activo',
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

        case 'update':
            echo json_encode(['message' => 'Funcionalidad no implementada aún']);
            break;

        case 'delete':
            echo json_encode(['message' => 'Funcionalidad no implementada aún']);
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

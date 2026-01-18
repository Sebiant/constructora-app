<?php
namespace Src\Capitulos\Interfaces;

// Habilitar reporte de errores para depuración
error_reporting(E_ALL);
ini_set('display_errors', '1');

ob_start();

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Capitulos\Infrastructure\CapituloMySQLRepository;
use Src\Capitulos\Application\GetAllCapitulos;
use Src\Capitulos\Application\CreateCapitulo;
use Src\Capitulos\Application\GetCapituloById;
use Src\Capitulos\Application\UpdateCapitulo;
use Src\Capitulos\Application\DeleteCapitulo;
use Src\Capitulos\Domain\Capitulo;

try {
    $connection = \Database::getConnection();
    $repo = new CapituloMySQLRepository($connection);
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {
        case 'getAll':
            $useCase = new GetAllCapitulos($repo);
            $data = $useCase->execute();

            ob_clean();
            // Formatear datos para DataTables
            $formattedData = array_map(function($item) {
                return [
                    'id_capitulo' => (int)$item['id_capitulo'],
                    'nombre_cap' => $item['nombre_cap'] ?? '',
                    'codigo' => (int)$item['id_capitulo'],
                    'id_presupuesto' => (int)$item['id_presupuesto'],
                    'presupuesto_proyecto' => $item['presupuesto_proyecto'] ?? 'Sin asignar',
                    'estado' => (int)$item['estado']
                ];
            }, $data);
            
            echo json_encode($formattedData);
            break;

        case 'create':
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['nombre_cap'])) {
                echo json_encode(['success' => false, 'error' => 'Nombre del capítulo es requerido']);
                exit;
            }

            $estado = true;
            if (isset($data['estado'])) {
                $estado = ($data['estado'] === '1' || $data['estado'] === 1 || $data['estado'] === true || $data['estado'] === 'true');
            }

            $capitulo = Capitulo::crear(
                $data['nombre_cap'],
                $data['id_presupuesto'] ?? null,
                $estado
            );

            $useCase = new CreateCapitulo($repo);
            $resultado = $useCase->execute($capitulo);

            ob_clean();
            echo json_encode([
                'success' => true,
                'capitulo' => $resultado->toArray()
            ]);
            break;

        case 'getById':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['error' => 'Se requiere el ID del capítulo']);
                exit;
            }

            $useCase = new GetCapituloById($repo);
            $capitulo = $useCase->execute((int)$id);

            if (empty($capitulo)) {
                ob_clean();
                echo json_encode(['error' => 'Capítulo no encontrado']);
                exit;
            }

            ob_clean();
            echo json_encode($capitulo->toArray());
            break;

        case 'update':
            $input = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($input['id_capitulo']) || !isset($input['nombre_cap'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID y nombre son requeridos']);
                exit;
            }

            $estado = true;
            if (isset($input['estado'])) {
                $estado = ($input['estado'] === '1' || $input['estado'] === 1 || $input['estado'] === true || $input['estado'] === 'true');
            }

            $capitulo = new Capitulo(
                (int)$input['id_capitulo'],
                $input['nombre_cap'],
                $input['id_presupuesto'] ?? null,
                $estado
            );

            $useCase = new UpdateCapitulo($repo);
            $result = $useCase->execute($capitulo);

            ob_clean();
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Capítulo actualizado correctamente' : 'Error al actualizar capítulo'
            ]);
            break;

        case 'delete':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['success' => false, 'error' => 'Se requiere el ID del capítulo']);
                exit;
            }

            $useCase = new DeleteCapitulo($repo);
            $result = $useCase->execute((int)$id);

            ob_clean();
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Capítulo eliminado correctamente' : 'Error al eliminar capítulo'
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'getAll' => 'Listar todos los capítulos',
                    'create' => 'Crear nuevo capítulo',
                    'getById' => 'Obtener capítulo por ID',
                    'update' => 'Actualizar capítulo',
                    'delete' => 'Eliminar capítulo (lógico)'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;

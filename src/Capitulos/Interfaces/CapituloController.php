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

        case 'getPresupuestos':
            $sql = "SELECT id_presupuesto, codigo, nombre, fecha_creacion 
                     FROM presupuestos 
                     ORDER BY fecha_creacion DESC";
            $stmt = $connection->prepare($sql);
            $stmt->execute();
            $presupuestos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            ob_clean();
            echo json_encode($presupuestos);
            break;

        case 'getProyectos':
            $sql = "SELECT id_proyecto, nombre 
                     FROM proyectos 
                     WHERE estado = 1
                     ORDER BY nombre ASC";
            $stmt = $connection->prepare($sql);
            $stmt->execute();
            $proyectos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            ob_clean();
            echo json_encode($proyectos);
            break;

        case 'getPresupuestosPorProyecto':
            $idProyecto = $_GET['id_proyecto'] ?? null;
            if (!$idProyecto) {
                echo json_encode([]);
                exit;
            }

            $sql = "SELECT id_presupuesto, fecha_creacion 
                     FROM presupuestos 
                     WHERE id_proyecto = :id_proyecto
                     ORDER BY fecha_creacion DESC";
            $stmt = $connection->prepare($sql);
            $stmt->execute(['id_proyecto' => (int)$idProyecto]);
            $presupuestos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            ob_clean();
            echo json_encode($presupuestos);
            break;

        case 'getProyectoDelPresupuesto':
            $idPresupuesto = $_GET['id_presupuesto'] ?? null;
            if (!$idPresupuesto) {
                echo json_encode([]);
                exit;
            }

            $sql = "SELECT p.id_proyecto, p.nombre 
                     FROM proyectos p
                     INNER JOIN presupuestos pr ON p.id_proyecto = pr.id_proyecto
                     WHERE pr.id_presupuesto = :id_presupuesto";
            $stmt = $connection->prepare($sql);
            $stmt->execute(['id_presupuesto' => (int)$idPresupuesto]);
            $proyecto = $stmt->fetch(\PDO::FETCH_ASSOC);

            ob_clean();
            echo json_encode($proyecto);
            break;

        case 'create':
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['nombre_cap'])) {
                echo json_encode(['success' => false, 'error' => 'Nombre del capítulo es requerido']);
                exit;
            }

            // Crear capítulo directamente sin usar la clase Capitulo
            $sql = "INSERT INTO capitulos (nombre_cap, id_presupuesto, estado, fechareg, idusuario) 
                    VALUES (:nombre_cap, :id_presupuesto, 1, NOW(), 1)";
            $stmt = $connection->prepare($sql);
            $result = $stmt->execute([
                'nombre_cap' => $data['nombre_cap'],
                'id_presupuesto' => $data['id_presupuesto'] ?? null,
            ]);

            ob_clean();
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Capítulo creado correctamente' : 'Error al crear capítulo'
            ]);
            break;

        case 'getById':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['error' => 'Se requiere el ID del capítulo']);
                exit;
            }

            // Obtener capítulo directamente sin usar la clase Capitulo
            $sql = "SELECT c.*, 
                            CONCAT('Presupuesto ', c.id_presupuesto, ' - ', IFNULL(pr.nombre, 'Sin proyecto')) AS presupuesto_proyecto
                     FROM capitulos c
                     LEFT JOIN presupuestos p ON c.id_presupuesto = p.id_presupuesto
                     LEFT JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                     WHERE c.id_capitulo = :id";
            $stmt = $connection->prepare($sql);
            $stmt->execute(['id' => (int)$id]);
            $capitulo = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (empty($capitulo)) {
                ob_clean();
                echo json_encode(['error' => 'Capítulo no encontrado']);
                exit;
            }

            ob_clean();
            echo json_encode($capitulo);
            break;

        case 'update':
            $input = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($input['id_capitulo'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID del capítulo es requerido']);
                exit;
            }

            // Para actualizar solo el estado, solo necesitamos id_capitulo y estado
            if (isset($input['estado']) && !isset($input['nombre_cap'])) {
                // Actualizar solo el estado
                $estado = ($input['estado'] === '1' || $input['estado'] === 1 || $input['estado'] === true || $input['estado'] === 'true');
                
                $sql = "UPDATE capitulos 
                        SET estado = :estado, fechaupdate = NOW() 
                        WHERE id_capitulo = :id_capitulo";
                $stmt = $connection->prepare($sql);
                $result = $stmt->execute([
                    'estado' => $estado,
                    'id_capitulo' => (int)$input['id_capitulo']
                ]);

                ob_clean();
                echo json_encode([
                    'success' => $result,
                    'message' => $result ? 'Capítulo actualizado correctamente' : 'Error al actualizar capítulo'
                ]);
                exit;
            }

            // Para actualización completa, necesitamos nombre_cap
            if (!isset($input['nombre_cap'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Nombre del capítulo es requerido']);
                exit;
            }

            // Actualizar capítulo completo
            $sql = "UPDATE capitulos 
                    SET nombre_cap = :nombre_cap, 
                        id_presupuesto = :id_presupuesto, 
                        fechaupdate = NOW() 
                    WHERE id_capitulo = :id_capitulo";
            $stmt = $connection->prepare($sql);
            $result = $stmt->execute([
                'nombre_cap' => $input['nombre_cap'],
                'id_presupuesto' => $input['id_presupuesto'] ?? null,
                'id_capitulo' => (int)$input['id_capitulo']
            ]);

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

            // Eliminar capítulo directamente sin usar la clase Capitulo
            $sql = "UPDATE capitulos 
                    SET estado = 0, fechaupdate = NOW() 
                    WHERE id_capitulo = :id";
            $stmt = $connection->prepare($sql);
            $result = $stmt->execute(['id' => (int)$id]);

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

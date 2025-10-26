<?php
namespace Src\Presupuesto\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository;
use Src\Presupuesto\Application\CreatePresupuesto;
use Src\Presupuesto\Application\GetAllPresupuestos;
use Src\Presupuesto\Domain\Presupuesto;
use PhpOffice\PhpSpreadsheet\IOFactory;

$db = new \Database();
$connection = $db->getConnection();
$repo = new PresupuestoMySQLRepository($connection);

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {

        case 'create':
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['id_proyecto']) || empty($data['fecha_creacion'])) {
                echo json_encode(['error' => 'id_proyecto y fecha_creacion son requeridos']);
                exit;
            }

            $monto_total = isset($data['monto_total']) ? (float)$data['monto_total'] : 0;

            $presupuesto = Presupuesto::crear(
                $data['id_proyecto'],
                $monto_total,
                $data['fecha_creacion']
            );

            $useCase = new CreatePresupuesto($repo);
            $resultado = $useCase->execute($presupuesto);

            echo json_encode([
                'success' => true,
                'message' => 'Presupuesto creado correctamente',
                'presupuesto' => $resultado->toArray()
            ]);
            break;

        case 'getAll':
            $useCase = new GetAllPresupuestos($repo);
            $presupuestos = $useCase->execute();

            echo json_encode([
                'success' => true,
                'data' => $presupuestos
            ]);
            break;

        case 'importPreview':
            try {
                if (!isset($_FILES['archivo_excel']) || $_FILES['archivo_excel']['error'] !== UPLOAD_ERR_OK) {
                    throw new \Exception('No se recibió el archivo Excel o hubo un error en la carga.');
                }

                $idProyectoSeleccionado = $_POST['id_proyecto'] ?? null;
                $idPresupuestoSeleccionado = $_POST['id_presupuesto'] ?? null;
                
                if (empty($idProyectoSeleccionado)) {
                    throw new \Exception('Proyecto no seleccionado.');
                }
                
                if (empty($idPresupuestoSeleccionado)) {
                    throw new \Exception('Presupuesto no seleccionado.');
                }

                $stmt = $connection->prepare("SELECT id_presupuesto FROM presupuestos WHERE id_presupuesto = ? AND id_proyecto = ?");
                $stmt->execute([$idPresupuestoSeleccionado, $idProyectoSeleccionado]);
                if (!$stmt->fetch()) {
                    throw new \Exception('El presupuesto seleccionado no pertenece al proyecto.');
                }

                $rutaTmp = $_FILES['archivo_excel']['tmp_name'];
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($rutaTmp);
                $hoja = $spreadsheet->getActiveSheet();
                $data = $hoja->toArray();

                $repository = new \Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository($connection);
                $filas = $repository->validateImportMasive($data, $idProyectoSeleccionado, $idPresupuestoSeleccionado);

                $totalFilas = count($filas);
                $filasValidas = count(array_filter($filas, fn($fila) => $fila['ok']));
                $filasConError = $totalFilas - $filasValidas;
                $valorTotal = array_sum(array_column($filas, 'valor_total'));

                echo json_encode([
                    'ok' => true,
                    'resumen' => [
                        'total_filas' => $totalFilas,
                        'filas_validas' => $filasValidas,
                        'filas_con_error' => $filasConError,
                        'valor_total' => $valorTotal
                    ],
                    'filas' => $filas,
                    'ids_seleccionados' => [
                        'proyecto' => $idProyectoSeleccionado,
                        'presupuesto' => $idPresupuestoSeleccionado
                    ]
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'ok' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getProyectos':
            try {
                $stmt = $connection->prepare("SELECT id_proyecto, nombre FROM proyectos ORDER BY nombre ASC");
                $stmt->execute();
                $proyectos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'data' => $proyectos
                ]);
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getMateriales':
            try {
                $repo = new PresupuestoMySQLRepository($connection);
                $materiales = $repo->getMaterialesConPrecios();

                echo json_encode([
                    'success' => true,
                    'data' => $materiales
                ]);
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getMultiplicadores':
            try {
                $sql = "SELECT desccostoind, porcentaje, tipo_costo, costoiva 
                        FROM costos_ind 
                        WHERE id_estado = 1 
                        ORDER BY idcostosind";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $multiplicadores = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $multiplicadores
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => "Error al cargar multiplicadores: " . $e->getMessage()
                ]);
            }
            break;

        case 'guardarPresupuestos':
            try {
                $presupuestosData = json_decode($_POST['presupuestos'], true);
                $idPresupuesto = $_POST['id_presupuesto'] ?? null;
                
                error_log("=== DEBUG guardarPresupuestos ===");
                error_log("ID Presupuesto recibido: " . $idPresupuesto);
                error_log("Total items recibidos: " . count($presupuestosData));
                
                if (empty($presupuestosData)) {
                    throw new \Exception('No se recibieron datos de presupuestos');
                }

                if (empty($idPresupuesto)) {
                    throw new \Exception('No se especificó el presupuesto destino');
                }

                $repository = new \Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository($connection);
                $resultado = $repository->guardarPresupuestosMasive($presupuestosData, $idPresupuesto);

                echo json_encode([
                    'ok' => true,
                    'mensaje' => 'Presupuestos guardados correctamente',
                    'total_filas' => count($presupuestosData),
                    'id_presupuesto' => $idPresupuesto
                ]);
                
            } catch (\Exception $e) {
                error_log("ERROR en guardarPresupuestos: " . $e->getMessage());
                echo json_encode([
                    'ok' => false,
                    'mensaje' => 'Error al guardar: ' . $e->getMessage()
                ]);
            }
            break;

        case 'getPresupuestosByProyecto':
            try {
                $proyectoId = $_POST['proyecto_id'] ?? $_GET['proyecto_id'] ?? null;
                
                error_log("=== DEBUG getPresupuestosByProyecto ===");
                error_log("Proyecto ID: " . $proyectoId);
                error_log("POST: " . print_r($_POST, true));
                error_log("GET: " . print_r($_GET, true));
                
                if (!$proyectoId || !is_numeric($proyectoId)) {
                    throw new \Exception('ID de proyecto inválido o no proporcionado. Recibido: ' . $proyectoId);
                }

                $query = "SELECT 
                            p.id_presupuesto,
                            p.id_proyecto,
                            p.fecha_creacion,
                            p.monto_total,
                            p.observaciones,
                            pr.nombre AS nombre_proyecto
                        FROM presupuestos p
                        INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                        WHERE p.id_proyecto = :proyecto_id 
                        AND p.idestado = 1
                        ORDER BY p.fecha_creacion DESC";

                $stmt = $connection->prepare($query);
                $stmt->execute(['proyecto_id' => (int)$proyectoId]);
                $presupuestos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                error_log("Presupuestos encontrados: " . count($presupuestos));
                
                echo json_encode([
                    'success' => true,
                    'data' => $presupuestos,
                    'debug' => [
                        'proyecto_id' => $proyectoId,
                        'total_presupuestos' => count($presupuestos)
                    ]
                ]);
                
            } catch (\Exception $e) {
                error_log("ERROR en getPresupuestosByProyecto: " . $e->getMessage());
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage(),
                    'debug' => [
                        'proyecto_id_recibido' => $proyectoId ?? 'null'
                    ]
                ]);
            }
            break;

        case 'getCapitulosByPresupuesto':
            try {
                $idPresupuesto = $_POST['id_presupuesto'] ?? null;
                
                if (!$idPresupuesto || !is_numeric($idPresupuesto)) {
                    throw new \Exception('ID de presupuesto inválido');
                }

                $query = "SELECT id_capitulo, nombre_cap 
                        FROM capitulos 
                        WHERE id_presupuesto = :id_presupuesto 
                        AND estado = 1
                        ORDER BY id_capitulo ASC";
                        
                $stmt = $connection->prepare($query);
                $stmt->execute(['id_presupuesto' => (int)$idPresupuesto]);
                $capitulos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'data' => $capitulos
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'create' => 'Crear nuevo presupuesto',
                    'getAll' => 'Listar todos los presupuestos',
                    'importPreview' => 'Leer archivo Excel y devolver vista previa',
                    'getProyectos' => 'Obtener lista de proyectos',
                    'getMateriales' => 'Obtener lista de materiales',
                    'getMultiplicadores' => 'Obtener porcentajes de costos indirectos',
                    'guardarPresupuestos' => 'Guardar presupuestos en base de datos'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;
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
                // 🧩 Validar archivo Excel
                if (!isset($_FILES['archivo_excel']) || $_FILES['archivo_excel']['error'] !== UPLOAD_ERR_OK) {
                    throw new \Exception('No se recibió el archivo Excel o hubo un error en la carga.');
                }

                // 🧩 Validar proyecto seleccionado
                $idProyectoSeleccionado = $_POST['id_proyecto'] ?? null;
                if (empty($idProyectoSeleccionado)) {
                    throw new \Exception('Proyecto no seleccionado.');
                }

                // 🧩 Cargar el Excel
                $rutaTmp = $_FILES['archivo_excel']['tmp_name'];
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($rutaTmp);
                $hoja = $spreadsheet->getActiveSheet();
                $data = $hoja->toArray();

                // 🧩 CORRECCIÓN: Usar Presupuesto (singular) en lugar de Presupuestos (plural)
                $repository = new \Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository($connection);

                // 🧩 Validar y preparar filas, pasando el proyecto seleccionado
                //    (el repo ahora valida internamente si el presupuesto pertenece al proyecto)
                $filas = $repository->validateImportMasive($data, $idProyectoSeleccionado);

                // 🧩 Calcular resumen de validación
                $totalFilas = count($filas);
                $filasValidas = count(array_filter($filas, fn($fila) => $fila['ok']));
                $filasConError = $totalFilas - $filasValidas;
                $valorTotal = array_sum(array_column($filas, 'valor_total'));

                // 🧩 Devolver respuesta JSON
                echo json_encode([
                    'ok' => true,
                    'resumen' => [
                        'total_filas' => $totalFilas,
                        'filas_validas' => $filasValidas,
                        'filas_con_error' => $filasConError,
                        'valor_total' => $valorTotal
                    ],
                    'filas' => $filas
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
                // Puedes usar el mismo repositorio de proyectos o hacer una consulta directa
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
                
                if (empty($presupuestosData)) {
                    throw new \Exception('No se recibieron datos de presupuestos');
                }

                // Aquí va la lógica para guardar en la base de datos
                // Por ahora solo devolvemos éxito
                echo json_encode([
                    'ok' => true,
                    'mensaje' => 'Presupuestos guardados correctamente',
                    'total_filas' => count($presupuestosData)
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'ok' => false,
                    'mensaje' => 'Error al guardar: ' . $e->getMessage()
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
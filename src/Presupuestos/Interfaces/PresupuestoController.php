<?php
namespace Src\Presupuestos\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Presupuestos\Infrastructure\PresupuestoMySQLRepository;
use Src\Presupuestos\Application\CreatePresupuesto;
use Src\Presupuestos\Application\GetAllPresupuestos;
use Src\Presupuestos\Domain\Presupuesto;
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
                // 1️⃣ Validar archivo
                if (!isset($_FILES['archivo_excel']) || $_FILES['archivo_excel']['error'] !== UPLOAD_ERR_OK) {
                    throw new \Exception('No se recibió el archivo Excel o hubo un error en la carga.');
                }

                // 2️⃣ Cargar Excel
                $rutaTmp = $_FILES['archivo_excel']['tmp_name'];
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($rutaTmp);
                $hoja = $spreadsheet->getActiveSheet();
                $data = $hoja->toArray();

                // 3️⃣ Instanciar repo
                $repository = new \Src\Presupuestos\Infrastructure\PresupuestoMySQLRepository($connection);

                // 4️⃣ Validar y preparar filas
                $filas = $repository->validateImportMasive($data);

                // 5️⃣ Calcular resumen
                $totalFilas = count($filas);
                $filasValidas = count(array_filter($filas, fn($fila) => $fila['ok']));
                $filasConError = $totalFilas - $filasValidas;
                $valorTotal = array_sum(array_column($filas, 'valor_total'));

                // 6️⃣ Devolver JSON
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
            
        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'create' => 'Crear nuevo presupuesto',
                    'getAll' => 'Listar todos los presupuestos',
                    'importPreview' => 'Leer archivo Excel y devolver vista previa'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;

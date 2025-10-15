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

        // 🔥 NUEVA ACCIÓN: importar y previsualizar Excel
        case 'importPreview':
            if (!isset($_FILES['archivo_excel']) || $_FILES['archivo_excel']['error'] !== UPLOAD_ERR_OK) {
                throw new \Exception('No se recibió el archivo Excel o hubo un error en la carga.');
            }

            $rutaTmp = $_FILES['archivo_excel']['tmp_name'];
            $spreadsheet = IOFactory::load($rutaTmp);
            $hoja = $spreadsheet->getActiveSheet();
            $data = $hoja->toArray();

            $filas = [];
            $encabezado = true;

            foreach ($data as $fila) {
                if ($encabezado) {
                    $encabezado = false;
                    continue;
                }

                // Lectura básica de columnas
                $cap = trim($fila[0] ?? '');
                $cod = trim($fila[1] ?? '');
                $cantidad = trim($fila[2] ?? '');

                if ($cap === '' && $cod === '' && $cantidad === '') continue;

                $errores = [];
                if (!is_numeric($cap)) $errores[] = 'CAP no numérico';
                if (!is_numeric($cod)) $errores[] = 'COD no numérico';
                if (!is_numeric($cantidad) || $cantidad <= 0) $errores[] = 'Cantidad inválida';

                $filas[] = [
                    'CAP' => $cap,
                    'COD' => $cod,
                    'Cantidad' => $cantidad,
                    'ok' => empty($errores),
                    'errores' => $errores
                ];
            }

            echo json_encode([
                'ok' => true,
                'filas' => $filas
            ]);
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

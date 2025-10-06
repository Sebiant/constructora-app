<?php
namespace Src\Presupuestos\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Presupuestos\Infrastructure\PresupuestoMySQLRepository;
use Src\Presupuestos\Application\CreatePresupuesto;
use Src\Presupuestos\Domain\Presupuesto;

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

            // Caso de uso
            $useCase = new CreatePresupuesto($repo);
            $resultado = $useCase->execute($presupuesto);

            echo json_encode([
                'success' => true,
                'message' => 'Presupuesto creado correctamente',
                'presupuesto' => $resultado->toArray()
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'create' => 'Crear nuevo presupuesto'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;

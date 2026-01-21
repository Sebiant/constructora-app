<?php
/**
 * limpiar_datos_pedidos_y_ordenes.php
 * Herramienta de mantenimiento para limpiar datos de negocio relacionados con:
 * - pedidos
 * - pedidos_detalle
 * - ordenes_compra
 * - ordenes_compra_detalle
 * - compras
 * - compras_finales (si existe)
 * - log_recepciones (historial de recepciones)
 *
 * Uso:
 *  - Abrir en el navegador: http://localhost/sgigescomnew/limpiar_datos_pedidos_y_ordenes.php
 *  - Vista previa de conteos y botón para limpiar todo.
 *  - Se puede solicitar en JSON con ?format=json
 */

header('X-Content-Type-Options: nosniff');

require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';

function getPDO() {
    $db = new Database();
    return $db->getConnection();
}

function tableExists(PDO $pdo, string $table): bool {
    $sql = "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$table]);
    return (bool)$stmt->fetchColumn();
}

function countRows(PDO $pdo, string $table): int {
    $stmt = $pdo->query("SELECT COUNT(*) FROM `{$table}`");
    return (int)$stmt->fetchColumn();
}

function responseJSON($data, int $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
    exit;
}

$pdo = getPDO();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$allTables = [
    'ordenes_compra_detalle',
    'ordenes_compra',
    'compras',            // tabla principal de compras
    'compras_finales',     // opcional si existe
    'log_recepciones',     // historial detallado de recepciones
    'pedidos_detalle',
    'pedidos',
];

// Detectar qué tablas existen en la BD actual
$existing = [];
foreach ($allTables as $t) {
    if (tableExists($pdo, $t)) {
        $existing[] = $t;
    }
}

$format = ($_GET['format'] ?? '') === 'json' ? 'json' : 'html';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST' && isset($_POST['action']) && $_POST['action'] === 'clean') {
    $resetAI = isset($_POST['reset_ai']) && $_POST['reset_ai'] === '1';

    $beforeCounts = [];
    foreach ($existing as $t) {
        $beforeCounts[$t] = countRows($pdo, $t);
    }

    $deletedCounts = [];
    $errors = [];

    try {
        // Deshabilitar claves foráneas para evitar problemas de orden
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        $pdo->beginTransaction();

        foreach ($existing as $t) {
            try {
                $stmt = $pdo->prepare("DELETE FROM `{$t}`");
                $stmt->execute();
                $deletedCounts[$t] = $stmt->rowCount();

                if ($resetAI) {
                    // Resetear autoincremento
                    $pdo->exec("ALTER TABLE `{$t}` AUTO_INCREMENT = 1");
                }
            } catch (Throwable $te) {
                $errors[] = "Error en tabla {$t}: " . $te->getMessage();
            }
        }

        $pdo->commit();
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

        $afterCounts = [];
        foreach ($existing as $t) {
            $afterCounts[$t] = countRows($pdo, $t);
        }

        $result = [
            'success' => count($errors) === 0,
            'message' => count($errors) ? 'Limpieza completada con algunos errores' : 'Limpieza completada correctamente',
            'tables_processed' => $existing,
            'before' => $beforeCounts,
            'deleted' => $deletedCounts,
            'after' => $afterCounts,
            'errors' => $errors,
        ];

        if ($format === 'json') {
            responseJSON($result, 200);
        }

    } catch (Throwable $e) {
        try { if ($pdo->inTransaction()) $pdo->rollBack(); } catch (Throwable $re) {}
        try { $pdo->exec('SET FOREIGN_KEY_CHECKS = 1'); } catch (Throwable $fe) {}

        $result = [
            'success' => false,
            'message' => 'Error al ejecutar la limpieza: ' . $e->getMessage(),
        ];
        if ($format === 'json') {
            responseJSON($result, 500);
        }
    }
} else {
    // Vista previa: conteo por tabla existente
    $counts = [];
    foreach ($existing as $t) {
        $counts[$t] = countRows($pdo, $t);
    }

    if ($format === 'json') {
        responseJSON([
            'success' => true,
            'tables' => $existing,
            'counts' => $counts,
            'message' => 'Vista previa de tablas y conteos. Enviar POST action=clean para limpiar.'
        ], 200);
    }
}

// Render HTML si no es JSON
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Limpieza de datos: Pedidos, Órdenes y Compras</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-danger text-white">
            <h5 class="mb-0">Limpieza de datos (Pedidos / Órdenes / Compras)</h5>
          </div>
          <div class="card-body">
            <div class="alert alert-warning" role="alert">
              Esta acción eliminará datos de negocio (pedidos, detalles, órdenes, detalles, compras, log de recepciones y compras finales si existen).
              No elimina catálogos como materiales, items, proyectos, presupuestos, proveedores. Úsalo con cuidado.
            </div>

            <h6>Tablas detectadas en la base actual</h6>
            <ul>
              <?php foreach ($existing as $t): ?>
                <li><code><?= htmlspecialchars($t) ?></code></li>
              <?php endforeach; ?>
            </ul>

            <h6>Conteo actual</h6>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Tabla</th>
                  <th class="text-end">Registros</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($existing as $t): ?>
                  <tr>
                    <td><code><?= htmlspecialchars($t) ?></code></td>
                    <td class="text-end"><?= number_format(countRows($pdo, $t)) ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>

            <form method="post" class="mt-4" onsubmit="return confirm('¿Seguro que deseas eliminar los datos listados? Esta acción no se puede deshacer.');">
              <input type="hidden" name="action" value="clean">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="reset_ai" name="reset_ai" value="1" checked>
                <label class="form-check-label" for="reset_ai">Reiniciar AUTO_INCREMENT de las tablas</label>
              </div>

              <div class="d-grid gap-2 mt-3">
                <button type="submit" class="btn btn-danger">
                  <i class="bi bi-trash"></i> Limpiar datos ahora
                </button>
              </div>
            </form>

            <hr>
            <div class="small text-muted">
              También puedes usar JSON: <code>?format=json</code>. Para ejecutar limpieza vía JSON, envía POST con <code>action=clean</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

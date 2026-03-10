<?php

declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);
set_time_limit(0);

header('X-Content-Type-Options: nosniff');

require __DIR__ . '/config/database.php';

function getPDO(): PDO
{
    return Database::getConnection();
}

function tableExists(PDO $pdo, string $table): bool
{
    $sql = "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$table]);
    return (bool)$stmt->fetchColumn();
}

function countRows(PDO $pdo, string $table): int
{
    $stmt = $pdo->query("SELECT COUNT(*) FROM `{$table}`");
    return (int)$stmt->fetchColumn();
}

function responseJSON($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
    exit;
}

$allowedModes = ['total', 'items_only'];
$format = (($_GET['format'] ?? '') === 'json') ? 'json' : 'html';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$mode = isset($_GET['mode']) ? (string)$_GET['mode'] : (isset($_POST['mode']) ? (string)$_POST['mode'] : 'total');
if (!in_array($mode, $allowedModes, true)) {
    $mode = 'total';
}

$resetAI = false;
if ($method === 'POST') {
    $resetAI = isset($_POST['reset_ai']) && $_POST['reset_ai'] === '1';
} else {
    $resetAI = isset($_GET['reset_ai']) && (string)$_GET['reset_ai'] === '1';
}

$allTablesByMode = [
    'items_only' => [
        'compras_detalle',
        'compras_provedores',
        'compras_proveedores',
        'compras',
        'ordenes_compra_detalle',
        'ordenes_compra',
        'log_recepciones',
        'pedidos_detalle',
        'pedidos',
        'det_presupuesto',
        'materiales_extra_presupuesto',
        'capitulos',
        'item_composicion',
        'item_componentes',
        'material_precio',
        'materiales',
        'items',
    ],
    'total' => [
        'compras_detalle',
        'compras_provedores',
        'compras_proveedores',
        'compras',
        'ordenes_compra_detalle',
        'ordenes_compra',
        'log_recepciones',
        'pedidos_detalle',
        'pedidos',
        'det_presupuesto',
        'materiales_extra_presupuesto',
        'capitulos',
        'item_composicion',
        'item_componentes',
        'material_precio',
        'materiales',
        'items',
        'presupuestos',
    ],
];

$candidateTables = $allTablesByMode[$mode];

function h(string $v): string
{
    return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

try {
    $pdo = getPDO();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $existing = [];
    foreach ($candidateTables as $t) {
        if (tableExists($pdo, $t)) {
            $existing[] = $t;
        }
    }

    if ($method === 'POST' && isset($_POST['action']) && $_POST['action'] === 'clean') {
        $beforeCounts = [];
        foreach ($existing as $t) {
            $beforeCounts[$t] = countRows($pdo, $t);
        }

        $deletedCounts = [];
        $errors = [];

        try {
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
            $pdo->beginTransaction();

            foreach ($existing as $t) {
                try {
                    $stmt = $pdo->prepare("DELETE FROM `{$t}`");
                    $stmt->execute();
                    $deletedCounts[$t] = $stmt->rowCount();
                } catch (Throwable $te) {
                    $errors[] = "Error en tabla {$t}: " . $te->getMessage();
                }
            }

            $pdo->commit();
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

            if ($resetAI) {
                foreach ($existing as $t) {
                    try {
                        $pdo->exec("ALTER TABLE `{$t}` AUTO_INCREMENT = 1");
                    } catch (Throwable $te) {
                        $errors[] = "No se pudo reiniciar AUTO_INCREMENT en {$t}: " . $te->getMessage();
                    }
                }
            }

            $afterCounts = [];
            foreach ($existing as $t) {
                $afterCounts[$t] = countRows($pdo, $t);
            }

            $result = [
                'success' => count($errors) === 0,
                'message' => count($errors) ? 'Limpieza completada con algunos errores' : 'Limpieza completada correctamente',
                'mode' => $mode,
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
        $counts = [];
        foreach ($existing as $t) {
            $counts[$t] = countRows($pdo, $t);
        }

        if ($format === 'json') {
            responseJSON([
                'success' => true,
                'mode' => $mode,
                'tables' => $existing,
                'counts' => $counts,
                'message' => 'Vista previa de tablas y conteos. Enviar POST action=clean para limpiar.'
            ], 200);
        }
    }
} catch (Throwable $e) {
    if ($format === 'json') {
        responseJSON([
            'success' => false,
            'message' => $e->getMessage(),
        ], 500);
    }
    $fatalError = $e->getMessage();
}

?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Limpieza de datos: Items y Materiales</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-9">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-danger text-white">
            <h5 class="mb-0">Limpieza de datos (Items / Materiales / Dependencias)</h5>
          </div>
          <div class="card-body">
            <?php if (!empty($fatalError ?? '')): ?>
              <div class="alert alert-danger" role="alert">
                <?= h($fatalError) ?>
              </div>
            <?php endif; ?>

            <div class="alert alert-warning" role="alert">
              Esta herramienta eliminará datos de negocio relacionados con <b>items</b> y <b>materiales</b>.
              Dependiendo del modo, también puede eliminar <b>presupuestos</b> y datos relacionados (pedidos, compras, órdenes, etc.).
              Úsala con cuidado y realiza un backup antes.
            </div>

            <form method="get" class="row g-2 align-items-end">
              <div class="col-md-5">
                <label class="form-label">Modo</label>
                <select class="form-select" name="mode">
                  <option value="items_only" <?= $mode === 'items_only' ? 'selected' : '' ?>>Borrar items/materiales y dependencias (sin borrar presupuestos)</option>
                  <option value="total" <?= $mode === 'total' ? 'selected' : '' ?>>Borrado total (incluye presupuestos)</option>
                </select>
              </div>
              <div class="col-md-4">
                <div class="form-check form-switch mt-4">
                  <input class="form-check-input" type="checkbox" role="switch" id="reset_ai_get" name="reset_ai" value="1" <?= $resetAI ? 'checked' : '' ?>>
                  <label class="form-check-label" for="reset_ai_get">Reiniciar AUTO_INCREMENT</label>
                </div>
              </div>
              <div class="col-md-3 d-grid">
                <button class="btn btn-outline-secondary" type="submit">Actualizar vista previa</button>
              </div>
            </form>

            <hr>

            <?php
              $pdoPreview = getPDO();
              $pdoPreview->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
              $existingPreview = [];
              foreach ($candidateTables as $t) {
                  if (tableExists($pdoPreview, $t)) {
                      $existingPreview[] = $t;
                  }
              }
            ?>

            <h6>Tablas detectadas en la base actual (según modo seleccionado)</h6>
            <ul>
              <?php foreach ($existingPreview as $t): ?>
                <li><code><?= h($t) ?></code></li>
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
                <?php foreach ($existingPreview as $t): ?>
                  <tr>
                    <td><code><?= h($t) ?></code></td>
                    <td class="text-end"><?= number_format(countRows($pdoPreview, $t)) ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>

            <form method="post" class="mt-4" onsubmit="return confirm('¿Seguro que deseas eliminar los datos listados? Esta acción no se puede deshacer.');">
              <input type="hidden" name="action" value="clean">
              <input type="hidden" name="mode" value="<?= h($mode) ?>">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="reset_ai" name="reset_ai" value="1" <?= $resetAI ? 'checked' : '' ?>>
                <label class="form-check-label" for="reset_ai">Reiniciar AUTO_INCREMENT de las tablas</label>
              </div>

              <div class="d-grid gap-2 mt-3">
                <button type="submit" class="btn btn-danger">Limpiar datos ahora</button>
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

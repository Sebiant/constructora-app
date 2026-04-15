<?php
/**
 * Script de migración: crea las tablas del carrito en BD.
 * Ejecutar UNA SOLA VEZ desde el navegador:
 *   http://localhost/sgigescon/database/migrate_carrito.php
 * 
 * Eliminar este archivo después de ejecutarlo.
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/database.php';

header('Content-Type: text/html; charset=utf-8');

$db = new \Database();
$pdo = $db->getConnection();

$sqls = [
    'presupuesto_carrito' => "
        CREATE TABLE IF NOT EXISTS `presupuesto_carrito` (
          `id_carrito`        INT(11)        NOT NULL AUTO_INCREMENT,
          `id_presupuesto`    INT(11)        NOT NULL COMMENT 'Presupuesto al que pertenece este carrito',
          `id_componente`     INT(11)        NOT NULL COMMENT 'Componente (material/mano de obra) pedido',
          `id_item`           INT(11)        DEFAULT NULL COMMENT 'Item del presupuesto. NULL = componente sin desglose',
          `cantidad`          DECIMAL(14,4)  NOT NULL DEFAULT 0.0000,
          `tipo_vista`        ENUM('agrupada','individual') NOT NULL DEFAULT 'agrupada',
          `idusuario`         INT(11)        DEFAULT NULL,
          `fechareg`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `fechaupdate`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id_carrito`),
          UNIQUE KEY `uq_carrito_presupuesto_comp_item` (`id_presupuesto`, `id_componente`, `id_item`),
          KEY `idx_carrito_presupuesto` (`id_presupuesto`),
          KEY `idx_carrito_componente`  (`id_componente`),
          CONSTRAINT `fk_carrito_presupuesto`
            FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`)
            ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          COMMENT='Carrito temporal de pedido por presupuesto. Reemplaza localStorage.'
    ",

    'presupuesto_carrito_extra' => "
        CREATE TABLE IF NOT EXISTS `presupuesto_carrito_extra` (
          `id_carrito_extra`  INT(11)        NOT NULL AUTO_INCREMENT,
          `id_presupuesto`    INT(11)        NOT NULL,
          `tipo`              ENUM('material_extra','pedido_fuera') NOT NULL DEFAULT 'material_extra',
          `id_material`       INT(11)        DEFAULT NULL,
          `id_componente`     INT(11)        DEFAULT NULL,
          `id_item`           INT(11)        DEFAULT NULL,
          `descripcion`       VARCHAR(500)   NOT NULL,
          `codigo`            VARCHAR(100)   DEFAULT NULL,
          `unidad`            VARCHAR(50)    DEFAULT 'UND',
          `cantidad`          DECIMAL(14,4)  NOT NULL DEFAULT 0.0000,
          `precio_unitario`   DECIMAL(14,4)  NOT NULL DEFAULT 0.0000,
          `justificacion`     TEXT           DEFAULT NULL,
          `datos_json`        JSON           DEFAULT NULL,
          `idusuario`         INT(11)        DEFAULT NULL,
          `fechareg`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `fechaupdate`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id_carrito_extra`),
          KEY `idx_carrito_extra_presupuesto` (`id_presupuesto`),
          CONSTRAINT `fk_carrito_extra_presupuesto`
            FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`)
            ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          COMMENT='Materiales extra y pedidos fuera de presupuesto del carrito.'
    ",
];

$resultados = [];

foreach ($sqls as $tabla => $sql) {
    try {
        $pdo->exec($sql);
        $resultados[] = ['tabla' => $tabla, 'estado' => 'OK ✅', 'error' => null];
    } catch (\PDOException $e) {
        $resultados[] = ['tabla' => $tabla, 'estado' => 'ERROR ❌', 'error' => $e->getMessage()];
    }
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Migración - Carrito en BD</title>
    <style>
        body { font-family: monospace; max-width: 800px; margin: 40px auto; background: #1a1a2e; color: #e0e0e0; }
        h1 { color: #7c83fd; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #16213e; padding: 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid #333; }
        .ok { color: #4caf50; }
        .error { color: #f44336; }
        .warning { background: #2a1a00; border-left: 4px solid #ff9800; padding: 16px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🛒 Migración: Carrito en Base de Datos</h1>
    <p>Creando tablas <code>presupuesto_carrito</code> y <code>presupuesto_carrito_extra</code>...</p>

    <table>
        <thead>
            <tr><th>Tabla</th><th>Estado</th><th>Error</th></tr>
        </thead>
        <tbody>
            <?php foreach ($resultados as $r): ?>
            <tr>
                <td><?= htmlspecialchars($r['tabla']) ?></td>
                <td class="<?= $r['estado'] === 'OK ✅' ? 'ok' : 'error' ?>"><?= $r['estado'] ?></td>
                <td><?= $r['error'] ? htmlspecialchars($r['error']) : '-' ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <div class="warning">
        ⚠️ <strong>Recuerda eliminar este archivo</strong> después de ejecutar la migración.<br>
        <code>c:\xampp\htdocs\sgigescon\database\migrate_carrito.php</code>
    </div>
</body>
</html>

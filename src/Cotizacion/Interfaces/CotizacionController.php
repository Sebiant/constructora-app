<?php
/**
 * CotizacionController.php
 * CRUD para cotizaciones de pedidos.
 * Acciones: getCotizacionesByPedido | importarCotizacion | getCotizacionDetalle | eliminarCotizacion
 */

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

header('Content-Type: application/json');

$db         = new Database();
$connection = $db->getConnection();

/* ── Auto-crear tablas si no existen ───────────────────────────── */
_crearTablasCotizacion($connection);

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {

        /* ── Lista de cotizaciones de un pedido ─────────────────── */
        case 'getCotizacionesByPedido':
            $idPedido = (int)($_GET['id_pedido'] ?? 0);
            if (!$idPedido) throw new Exception('id_pedido requerido');

            $sql = "SELECT
                        c.id_cotizacion,
                        c.nombre,
                        c.observaciones,
                        c.estado,
                        c.fecha_cotizacion,
                        c.fechareg,
                        COUNT(DISTINCT cp.id_cot_prov) AS total_proveedores,
                        COUNT(cd.id_det_cot)           AS total_recursos_cotizados
                    FROM cotizaciones c
                    LEFT JOIN cotizacion_proveedores cp ON cp.id_cotizacion = c.id_cotizacion
                    LEFT JOIN cotizacion_detalle cd ON cd.id_cot_prov = cp.id_cot_prov AND cd.precio_unitario > 0
                    WHERE c.id_pedido = ? AND c.estado != 'cancelada'
                    GROUP BY c.id_cotizacion
                    ORDER BY c.fechareg DESC";

            $stmt = $connection->prepare($sql);
            $stmt->execute([$idPedido]);
            $cotizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $cotizaciones]);
            break;

        /* ── Detalle completo de una cotización ─────────────────── */
        case 'getCotizacionDetalle':
            $idCot = (int)($_GET['id_cotizacion'] ?? 0);
            if (!$idCot) throw new Exception('id_cotizacion requerido');

            // Info básica
            $stmtC = $connection->prepare(
                "SELECT c.*, p.id_pedido FROM cotizaciones c
                 INNER JOIN cotizaciones c2 ON c2.id_cotizacion = c.id_cotizacion
                 LEFT JOIN pedidos p ON p.id_pedido = c.id_pedido
                 WHERE c.id_cotizacion = ? LIMIT 1"
            );
            // Simplified query:
            $stmtC = $connection->prepare(
                "SELECT * FROM cotizaciones WHERE id_cotizacion = ? LIMIT 1"
            );
            $stmtC->execute([$idCot]);
            $cotizacion = $stmtC->fetch(PDO::FETCH_ASSOC);
            if (!$cotizacion) throw new Exception('Cotización no encontrada');

            // Proveedores
            $stmtPv = $connection->prepare(
                "SELECT id_cot_prov, id_provedor, nombre_proveedor
                 FROM cotizacion_proveedores
                 WHERE id_cotizacion = ?
                 ORDER BY id_cot_prov"
            );
            $stmtPv->execute([$idCot]);
            $proveedores = $stmtPv->fetchAll(PDO::FETCH_ASSOC);

            // Precios por proveedor y recurso
            $stmtDet = $connection->prepare(
                "SELECT cd.id_cot_prov, cd.id_det_pedido, cd.precio_unitario
                 FROM cotizacion_detalle cd
                 INNER JOIN cotizacion_proveedores cp ON cp.id_cot_prov = cd.id_cot_prov
                 WHERE cp.id_cotizacion = ?"
            );
            $stmtDet->execute([$idCot]);
            $detalles = $stmtDet->fetchAll(PDO::FETCH_ASSOC);

            // Indexar precios: { id_cot_prov => { id_det_pedido => precio } }
            $preciosIndex = [];
            foreach ($detalles as $d) {
                $preciosIndex[$d['id_cot_prov']][$d['id_det_pedido']] = (float)$d['precio_unitario'];
            }
            foreach ($proveedores as &$pv) {
                $pv['precios'] = $preciosIndex[$pv['id_cot_prov']] ?? [];
            }
            unset($pv);

            echo json_encode([
                'success'    => true,
                'cotizacion' => $cotizacion,
                'proveedores' => $proveedores
            ]);
            break;

        /* ── Guardar cotización importada desde Excel ────────────── */
        case 'importarCotizacion':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) throw new Exception('Datos JSON inválidos');

            $idPedido    = (int)($input['id_pedido'] ?? 0);
            $nombre      = trim($input['nombre'] ?? 'Cotización ' . date('d/m/Y H:i'));
            $observ      = trim($input['observaciones'] ?? '');
            $proveedores = $input['proveedores'] ?? [];

            if (!$idPedido) throw new Exception('id_pedido requerido');
            if (empty($proveedores)) throw new Exception('No se recibieron datos de proveedores');

            // Resolver idusuario
            if (session_status() === PHP_SESSION_NONE) session_start();
            $idUsuario = (int)($_SESSION['u_id'] ?? 1);

            $connection->beginTransaction();

            // Insertar cabecera
            $stmtC = $connection->prepare(
                "INSERT INTO cotizaciones (id_pedido, nombre, observaciones, estado, fecha_cotizacion, idusuario, fechareg, fechaupdate)
                 VALUES (?, ?, ?, 'activa', CURDATE(), ?, NOW(), NOW())"
            );
            $stmtC->execute([$idPedido, $nombre, $observ, $idUsuario]);
            $idCotizacion = (int)$connection->lastInsertId();

            $totalPrecios = 0;

            foreach ($proveedores as $pv) {
                $nombreProv = trim($pv['nombre_proveedor'] ?? '');
                if (!$nombreProv) continue;

                $idProvDB = !empty($pv['id_provedor']) ? (int)$pv['id_provedor'] : null;

                // Insertar proveedor de la cotización
                $stmtPv = $connection->prepare(
                    "INSERT INTO cotizacion_proveedores (id_cotizacion, id_provedor, nombre_proveedor)
                     VALUES (?, ?, ?)"
                );
                $stmtPv->execute([$idCotizacion, $idProvDB, $nombreProv]);
                $idCotProv = (int)$connection->lastInsertId();

                // Insertar precios
                $precios = $pv['precios'] ?? [];
                $stmtDet = $connection->prepare(
                    "INSERT INTO cotizacion_detalle (id_cot_prov, id_det_pedido, precio_unitario)
                     VALUES (?, ?, ?)"
                );
                foreach ($precios as $idDetPedido => $precio) {
                    $precio = (float)$precio;
                    if ($precio <= 0) continue;
                    $stmtDet->execute([$idCotProv, (int)$idDetPedido, $precio]);
                    $totalPrecios++;
                }
            }

            if ($totalPrecios === 0) {
                $connection->rollBack();
                throw new Exception('No se encontraron precios válidos en la cotización. Verifique el archivo.');
            }

            $connection->commit();

            echo json_encode([
                'success'       => true,
                'id_cotizacion' => $idCotizacion,
                'mensaje'       => "Cotización guardada con {$totalPrecios} precio(s)",
                'total_precios' => $totalPrecios
            ]);
            break;

        /* ── Eliminar (cancelar) cotización ─────────────────────── */
        case 'eliminarCotizacion':
            $idCot = (int)($_POST['id_cotizacion'] ?? $_GET['id_cotizacion'] ?? 0);
            if (!$idCot) throw new Exception('id_cotizacion requerido');

            $stmt = $connection->prepare(
                "UPDATE cotizaciones SET estado = 'cancelada', fechaupdate = NOW() WHERE id_cotizacion = ?"
            );
            $stmt->execute([$idCot]);

            echo json_encode(['success' => true, 'mensaje' => 'Cotización eliminada']);
            break;

        default:
            echo json_encode(['success' => false, 'error' => "Acción '{$action}' no reconocida"]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/* ── Crear tablas si no existen ─────────────────────────────────── */
function _crearTablasCotizacion(PDO $conn): void {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS cotizaciones (
            id_cotizacion    INT          NOT NULL AUTO_INCREMENT,
            id_pedido        INT          NOT NULL,
            nombre           VARCHAR(255) NOT NULL DEFAULT '',
            observaciones    TEXT         NULL,
            estado           ENUM('activa','completada','cancelada') NOT NULL DEFAULT 'activa',
            fecha_cotizacion DATE         NOT NULL,
            idusuario        INT          NOT NULL DEFAULT 1,
            fechareg         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fechaupdate      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id_cotizacion),
            INDEX idx_pedido (id_pedido)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS cotizacion_proveedores (
            id_cot_prov      INT          NOT NULL AUTO_INCREMENT,
            id_cotizacion    INT          NOT NULL,
            id_provedor      INT          NULL,
            nombre_proveedor VARCHAR(255) NOT NULL,
            PRIMARY KEY (id_cot_prov),
            INDEX idx_cot (id_cotizacion)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS cotizacion_detalle (
            id_det_cot      INT           NOT NULL AUTO_INCREMENT,
            id_cot_prov     INT           NOT NULL,
            id_det_pedido   INT           NOT NULL,
            precio_unitario DECIMAL(15,4) NOT NULL DEFAULT 0,
            PRIMARY KEY (id_det_cot),
            INDEX idx_cot_prov (id_cot_prov),
            INDEX idx_det_pedido (id_det_pedido)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

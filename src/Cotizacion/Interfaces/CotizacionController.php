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
                        cc.id_cotizacion as id_cotizacion,
                        CONCAT('Cotización ', cc.id_cotizacion) as nombre,
                        '' as observaciones,
                        cc.estado,
                        cc.fecha_cotizacion,
                        cc.fechareg,
                        COUNT(DISTINCT cc.id_proveedor) AS total_proveedores,
                        COUNT(cc.id_cotizacion)           AS total_recursos_cotizados
                    FROM cotizaciones_componentes cc
                    WHERE cc.id_presupuesto = ? AND cc.estado = 'activa'
                    GROUP BY cc.id_cotizacion
                    ORDER BY cc.fechareg DESC";

            $stmt = $connection->prepare($sql);
            $stmt->execute([$idPedido]);
            $cotizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $cotizaciones]);
            break;

        /* ── Obtener todos los precios cotizados para un conjunto de items ── */
case 'getDetallePreciosRecurso':
    error_log("=== DEBUG: getDetallePreciosRecurso llamado ===");
    
    $idsStr = $_GET['ids'] ?? '';
    error_log("IDs recibidos: " . $idsStr);

    if (!$idsStr) {
        echo json_encode(['success' => false, 'error' => 'IDs requeridos']);
        break;
    }

    // Convertir a array (soporta "4150" o "4150,4151,4152")
    $ids = array_filter(array_map('intval', explode(',', $idsStr)));

    if (empty($ids)) {
        echo json_encode(['success' => false, 'error' => 'IDs inválidos']);
        break;
    }

    try {
        // Crear placeholders dinámicos (?, ?, ?)
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        $sql = "SELECT 
                    cc.id_componente,
                    cc.precio_unitario,
                    p.nombre,
                    p.id_provedor as id_real_proveedor,
                    cc.id_proveedor as id_cot_prov,
                    'Cotización Componente' as nombre_cotizacion,
                    cc.fecha_cotizacion
                FROM cotizaciones_componentes cc
                LEFT JOIN provedores p ON cc.id_proveedor = p.id_provedor
                WHERE cc.id_componente IN ($placeholders)
                AND cc.estado = 'activa' 
                AND cc.precio_unitario > 0
                ORDER BY cc.precio_unitario ASC";

        error_log("SQL: " . $sql);
        error_log("Parámetros: " . implode(',', $ids));

        $stmt = $connection->prepare($sql);
        $stmt->execute($ids);
        $precios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        error_log("Resultados encontrados: " . count($precios));

        echo json_encode([
            'success' => true,
            'data' => $precios
        ]);

    } catch (Exception $e) {
        error_log("ERROR en consulta: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }

    break;

        /* ── Detalle completo de una cotización ─────────────────── */
        case 'getCotizacionDetalle':
            $idCot = (int)($_GET['id_cotizacion'] ?? 0);
            if (!$idCot) throw new Exception('id_cotizacion requerido');

            // Info básica
            $stmtC = $connection->prepare(
                "SELECT cc.*, cc.id_presupuesto as id_pedido 
                 FROM cotizaciones_componentes cc 
                 WHERE cc.id_cotizacion = ? LIMIT 1"
            );
            $stmtC->execute([$idCot]);
            $cotizacion = $stmtC->fetch(PDO::FETCH_ASSOC);
            if (!$cotizacion) throw new Exception('Cotización no encontrada');

            // Proveedores agrupados
            $stmtPv = $connection->prepare(
                "SELECT DISTINCT 
                        cc.id_proveedor as id_cot_prov, 
                        cc.id_proveedor as id_provedor, 
                        p.nombre
                 FROM cotizaciones_componentes cc
                 INNER JOIN provedores p ON cc.id_proveedor = p.id_provedor
                 WHERE cc.id_cotizacion = ?
                 ORDER BY cc.id_proveedor"
            );
            $stmtPv->execute([$idCot]);
            $proveedores = $stmtPv->fetchAll(PDO::FETCH_ASSOC);

            // Precios por proveedor y recurso
            $stmtDet = $connection->prepare(
                "SELECT cc.id_proveedor as id_cot_prov, cc.id_componente as id_det_pedido, cc.precio_unitario
                 FROM cotizaciones_componentes cc
                 WHERE cc.id_cotizacion = ?"
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

            // ⚠️ ADICIÓN: Información sobre compras ya realizadas (recepciones)
            // Para bloquear cambios de precio en items ya comprados.
            $sqlComprados = "SELECT 
                                lr.id_componente as id_det_pedido,
                                oc.id_provedor as id_provedor_comprado,
                                lr.precio_unitario as precio_comprado,
                                SUM(lr.cantidad_recibida) as total_recibido
                             FROM log_recepciones lr
                             INNER JOIN ordenes_compra oc ON lr.id_orden_compra = oc.id_orden_compra
                             WHERE lr.id_componente IN (
                                 SELECT id_componente FROM cotizaciones_componentes WHERE id_presupuesto = ?
                             )
                             GROUP BY lr.id_componente, oc.id_provedor, lr.precio_unitario
                             HAVING total_recibido > 0";
            
            $stmtCmp = $connection->prepare($sqlComprados);
            $stmtCmp->execute([$cotizacion['id_pedido']]);
            $compradosRaw = $stmtCmp->fetchAll(PDO::FETCH_ASSOC);
            
            $compradosIndex = [];
            foreach ($compradosRaw as $cmp) {
                $compradosIndex[$cmp['id_det_pedido']] = [
                    'id_provedor' => (int)$cmp['id_provedor_comprado'],
                    'precio'     => (float)$cmp['precio_comprado'],
                    'recibido'   => (float)$cmp['total_recibido']
                ];
            }

            echo json_encode([
                'success'    => true,
                'cotizacion' => $cotizacion,
                'proveedores' => $proveedores,
                'comprados'   => $compradosIndex
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
    // Comentado: ya existe la tabla cotizaciones_componentes en tu base de datos
    /*
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
    */
}

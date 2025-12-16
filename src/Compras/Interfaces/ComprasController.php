<?php
/**
 * ComprasController.php
 * Controlador para gestión de compras sobre pedidos aprobados
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';

try {
    $db = new Database();
    $connection = $db->getConnection();

    $rawInput = file_get_contents('php://input');
    $jsonInput = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $jsonInput = null;
    }

    $action = $_GET['action'] ?? $_POST['action'] ?? ($jsonInput['action'] ?? '');

    switch ($action) {
        case 'getProyectos':
            try {
                $sql = "SELECT id_proyecto, nombre FROM proyectos WHERE estado = 1 ORDER BY nombre ASC";
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $proyectos = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $proyectos]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'getCompras':
            try {
                $proyectoId = $_GET['proyecto'] ?? '';
                $fechaDesde = $_GET['fechaDesde'] ?? '';
                $fechaHasta = $_GET['fechaHasta'] ?? '';
                $busqueda = $_GET['busqueda'] ?? '';

                $sql = "SELECT
                            c.id_compra,
                            c.id_pedido,
                            c.fecha_compra,
                            c.numero_factura,
                            c.total,
                            c.estado,
                            c.observaciones,
                            pr.nombre AS nombre_proyecto,
                            pr.id_proyecto,
                            pv.id_provedor,
                            pv.nombre AS nombre_provedor,
                            u.u_nombre AS nombre_usuario
                        FROM compras c
                        INNER JOIN pedidos p ON c.id_pedido = p.id_pedido
                        INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        INNER JOIN provedores pv ON c.id_provedor = pv.id_provedor
                        LEFT JOIN gr_usuarios u ON c.idusuario = u.u_id
                        WHERE 1=1";

                $params = [];

                if (!empty($proyectoId)) {
                    $sql .= " AND pr.id_proyecto = ?";
                    $params[] = $proyectoId;
                }

                if (!empty($fechaDesde)) {
                    $sql .= " AND DATE(c.fecha_compra) >= ?";
                    $params[] = $fechaDesde;
                }

                if (!empty($fechaHasta)) {
                    $sql .= " AND DATE(c.fecha_compra) <= ?";
                    $params[] = $fechaHasta;
                }

                if (!empty($busqueda)) {
                    $sql .= " AND (c.id_compra LIKE ? OR c.id_pedido LIKE ? OR c.numero_factura LIKE ? OR pv.nombre LIKE ? OR pr.nombre LIKE ?)";
                    $like = '%' . $busqueda . '%';
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                }

                $sql .= " ORDER BY c.fecha_compra DESC LIMIT 100";

                $stmt = $connection->prepare($sql);
                $stmt->execute($params);
                $compras = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'data' => $compras]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'getCompraDetalle':
            try {
                $idCompra = $_GET['id_compra'] ?? null;
                if (!$idCompra) {
                    throw new Exception('ID de compra requerido');
                }

                $sqlCompra = "SELECT
                                c.id_compra,
                                c.id_pedido,
                                c.fecha_compra,
                                c.numero_factura,
                                c.total,
                                c.estado,
                                c.observaciones,
                                pr.nombre AS nombre_proyecto,
                                pr.id_proyecto,
                                pv.id_provedor,
                                pv.nombre AS nombre_provedor,
                                pv.telefono,
                                pv.whatsapp,
                                pv.email,
                                pv.contacto,
                                u.u_nombre AS nombre_usuario
                              FROM compras c
                              INNER JOIN pedidos p ON c.id_pedido = p.id_pedido
                              INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                              INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                              INNER JOIN provedores pv ON c.id_provedor = pv.id_provedor
                              LEFT JOIN gr_usuarios u ON c.idusuario = u.u_id
                              WHERE c.id_compra = ?";

                $stmt = $connection->prepare($sqlCompra);
                $stmt->execute([(int)$idCompra]);
                $compra = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$compra) {
                    throw new Exception('Compra no encontrada');
                }

                $sqlDet = "SELECT
                                cd.id_compra_detalle,
                                cd.id_det_pedido,
                                cd.descripcion,
                                cd.unidad,
                                cd.cantidad,
                                cd.precio_unitario,
                                cd.subtotal
                           FROM compras_detalle cd
                           WHERE cd.id_compra = ?
                           ORDER BY cd.id_compra_detalle ASC";
                $stmtD = $connection->prepare($sqlDet);
                $stmtD->execute([(int)$idCompra]);
                $detalles = $stmtD->fetchAll(PDO::FETCH_ASSOC);

                $compra['detalles'] = $detalles;
                echo json_encode(['success' => true, 'data' => $compra]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'getProvedoresActivos':
            try {
                $sql = "SELECT id_provedor, nombre, telefono, email, whatsapp, direccion, contacto
                        FROM provedores
                        WHERE estado = 1
                        ORDER BY nombre ASC";
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $provedores = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $provedores]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'getPedidosAprobados':
            try {
                $proyectoId = $_GET['proyecto'] ?? '';
                $fechaDesde = $_GET['fechaDesde'] ?? '';
                $fechaHasta = $_GET['fechaHasta'] ?? '';
                $busqueda = $_GET['busqueda'] ?? '';

                $sql = "SELECT
                            p.id_pedido,
                            p.fecha_pedido,
                            p.estado,
                            p.total,
                            p.observaciones,
                            pr.nombre AS nombre_proyecto,
                            pr.id_proyecto,
                            pres.id_presupuesto,
                            COUNT(pd.id_det_pedido) AS total_items
                        FROM pedidos p
                        INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        LEFT JOIN pedidos_detalle pd ON p.id_pedido = pd.id_pedido
                        WHERE p.estado = 'aprobado'";

                $params = [];

                if (!empty($proyectoId)) {
                    $sql .= " AND pr.id_proyecto = ?";
                    $params[] = $proyectoId;
                }

                if (!empty($fechaDesde)) {
                    $sql .= " AND DATE(p.fecha_pedido) >= ?";
                    $params[] = $fechaDesde;
                }

                if (!empty($fechaHasta)) {
                    $sql .= " AND DATE(p.fecha_pedido) <= ?";
                    $params[] = $fechaHasta;
                }

                if (!empty($busqueda)) {
                    $sql .= " AND (p.id_pedido LIKE ? OR pr.nombre LIKE ? OR p.observaciones LIKE ?)";
                    $like = '%' . $busqueda . '%';
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                }

                $sql .= " GROUP BY p.id_pedido, p.fecha_pedido, p.estado, p.total, p.observaciones, pr.nombre, pr.id_proyecto, pres.id_presupuesto
                          ORDER BY p.fecha_pedido DESC";

                $stmt = $connection->prepare($sql);
                $stmt->execute($params);
                $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'data' => $pedidos]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'getPedidoDetalle':
            try {
                $idPedido = $_GET['id_pedido'] ?? null;
                if (!$idPedido) {
                    throw new Exception('ID de pedido requerido');
                }

                $sqlPedido = "SELECT
                                p.id_pedido,
                                p.fecha_pedido,
                                p.estado,
                                p.total,
                                p.observaciones,
                                pr.nombre AS nombre_proyecto,
                                pr.id_proyecto,
                                pres.id_presupuesto
                              FROM pedidos p
                              INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                              INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                              WHERE p.id_pedido = ?";

                $stmt = $connection->prepare($sqlPedido);
                $stmt->execute([$idPedido]);
                $pedido = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$pedido) {
                    throw new Exception('Pedido no encontrado');
                }

                $sqlDetalle = "SELECT
                                pd.id_det_pedido,
                                pd.id_componente,
                                pd.tipo_componente,
                                pd.id_item,
                                pd.id_material_extra,
                                pd.cantidad,
                                pd.precio_unitario,
                                pd.subtotal,
                                pd.justificacion,
                                pd.es_excedente,
                                COALESCE(ic.descripcion, CAST(m.nombremat AS CHAR)) AS descripcion,
                                COALESCE(ic.unidad, u.unidesc) AS unidad
                              FROM pedidos_detalle pd
                              LEFT JOIN item_componentes ic ON pd.id_componente = ic.id_componente
                              LEFT JOIN materiales_extra_presupuesto mep ON pd.id_material_extra = mep.id_material_extra
                              LEFT JOIN materiales m ON mep.id_material = m.id_material
                              LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
                              WHERE pd.id_pedido = ?
                              ORDER BY pd.es_excedente ASC, COALESCE(ic.descripcion, m.nombremat) ASC";

                $stmtD = $connection->prepare($sqlDetalle);
                $stmtD->execute([$idPedido]);
                $detalles = $stmtD->fetchAll(PDO::FETCH_ASSOC);

                $pedido['detalles'] = $detalles;

                echo json_encode(['success' => true, 'data' => $pedido]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'guardarCompra':
            try {
                $data = $jsonInput ?? [];

                $idPedido = $data['id_pedido'] ?? null;
                $idsProvedores = $data['id_provedores'] ?? null;

                if (!$idPedido) {
                    throw new Exception('ID de pedido requerido');
                }
                if (!is_array($idsProvedores) || count($idsProvedores) === 0) {
                    throw new Exception('Seleccione al menos un provedor');
                }

                $idsProvedores = array_values(array_unique(array_map('intval', $idsProvedores)));
                $idsProvedores = array_filter($idsProvedores, fn($v) => $v > 0);
                if (count($idsProvedores) === 0) {
                    throw new Exception('Seleccione al menos un provedor');
                }

                $idProvedorPrincipal = (int)$idsProvedores[0];

                // Validar que los provedores existan y estén activos
                $placeholders = implode(',', array_fill(0, count($idsProvedores), '?'));
                $sqlProv = "SELECT id_provedor FROM provedores WHERE estado = 1 AND id_provedor IN ($placeholders)";
                $stmtProv = $connection->prepare($sqlProv);
                $stmtProv->execute($idsProvedores);
                $provRows = $stmtProv->fetchAll(PDO::FETCH_COLUMN);

                if (count($provRows) !== count($idsProvedores)) {
                    throw new Exception('Uno o más provedores no existen o están inactivos');
                }

                // Validar que el pedido esté aprobado
                $stmtVal = $connection->prepare("SELECT id_pedido, total FROM pedidos WHERE id_pedido = ? AND estado = 'aprobado'");
                $stmtVal->execute([$idPedido]);
                $pedido = $stmtVal->fetch(PDO::FETCH_ASSOC);
                if (!$pedido) {
                    throw new Exception('El pedido no existe o no está aprobado');
                }

                session_start();
                $idUsuario = $_SESSION['u_id'] ?? null;

                $connection->beginTransaction();
                try {
                    $sql = "INSERT INTO compras
                            (id_pedido, id_provedor,
                             fecha_compra, numero_factura, total, estado, observaciones, idusuario)
                            VALUES
                            (?, ?, NOW(), ?, ?, ?, ?, ?)";

                    $stmt = $connection->prepare($sql);

                    $numeroFactura = $data['numero_factura'] ?? null;
                    $estadoCompra = $data['estado'] ?? 'pendiente';
                    $observaciones = $data['observaciones'] ?? null;

                    $total = isset($data['total']) ? (float)$data['total'] : (float)($pedido['total'] ?? 0);

                    $stmt->execute([
                        $idPedido,
                        $idProvedorPrincipal,
                        $numeroFactura,
                        $total,
                        $estadoCompra,
                        $observaciones,
                        $idUsuario,
                    ]);

                    $idCompra = $connection->lastInsertId();
                    if (!$idCompra) {
                        throw new Exception('No se pudo crear la compra');
                    }

                    // Registrar relación compra-provedores
                    $stmtCp = $connection->prepare("INSERT INTO compras_provedores (id_compra, id_provedor) VALUES (?, ?)");
                    foreach ($idsProvedores as $pid) {
                        $stmtCp->execute([(int)$idCompra, (int)$pid]);
                    }

                    $detalles = $data['detalles'] ?? [];
                    if (is_array($detalles) && count($detalles) > 0) {
                        $sqlDet = "INSERT INTO compras_detalle
                                   (id_compra, id_det_pedido, descripcion, unidad, cantidad, precio_unitario, subtotal)
                                   VALUES (?, ?, ?, ?, ?, ?, ?)";
                        $stmtDet = $connection->prepare($sqlDet);

                        foreach ($detalles as $d) {
                            $idDetPedido = $d['id_det_pedido'] ?? null;
                            $descripcion = $d['descripcion'] ?? '';
                            $unidad = $d['unidad'] ?? null;
                            $cantidad = (float)($d['cantidad'] ?? 0);
                            $precio = (float)($d['precio_unitario'] ?? 0);
                            $subtotal = (float)($d['subtotal'] ?? ($cantidad * $precio));

                            if (trim($descripcion) === '' || $cantidad <= 0) {
                                continue;
                            }

                            $stmtDet->execute([
                                $idCompra,
                                $idDetPedido,
                                $descripcion,
                                $unidad,
                                $cantidad,
                                $precio,
                                $subtotal,
                            ]);
                        }
                    }

                    // Actualizar estado del pedido a 'comprado'
                    // Solo si aún está en estado aprobado (evitar pisar cambios externos)
                    $stmtUpdPedido = $connection->prepare(
                        "UPDATE pedidos
                         SET estado = 'comprado', fechaupdate = NOW()
                         WHERE id_pedido = ? AND estado = 'aprobado'"
                    );
                    $stmtUpdPedido->execute([(int)$idPedido]);
                    if ($stmtUpdPedido->rowCount() === 0) {
                        throw new Exception('No se pudo actualizar el pedido a comprado (verifique que esté aprobado)');
                    }

                    $connection->commit();

                    echo json_encode([
                        'success' => true,
                        'message' => 'Compra registrada correctamente',
                        'data' => [
                            'id_compra' => $idCompra,
                            'id_pedido' => $idPedido,
                        ]
                    ]);
                } catch (Exception $e) {
                    $connection->rollBack();
                    throw $e;
                }

            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Acción no válida', 'action_received' => $action]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error interno del servidor: ' . $e->getMessage()]);
}

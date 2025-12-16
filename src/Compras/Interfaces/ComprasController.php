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
                $proveedorNombre = trim($data['proveedor_nombre'] ?? '');

                if (!$idPedido) {
                    throw new Exception('ID de pedido requerido');
                }
                if ($proveedorNombre === '') {
                    throw new Exception('Proveedor requerido');
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
                            (id_pedido, proveedor_nombre, proveedor_telefono, proveedor_email, proveedor_whatsapp, proveedor_direccion, proveedor_contacto,
                             fecha_compra, numero_factura, total, estado, observaciones, idusuario)
                            VALUES
                            (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)";

                    $stmt = $connection->prepare($sql);

                    $numeroFactura = $data['numero_factura'] ?? null;
                    $estadoCompra = $data['estado'] ?? 'pendiente';
                    $observaciones = $data['observaciones'] ?? null;

                    $proveedorTelefono = $data['proveedor_telefono'] ?? null;
                    $proveedorEmail = $data['proveedor_email'] ?? null;
                    $proveedorWhatsapp = $data['proveedor_whatsapp'] ?? null;
                    $proveedorDireccion = $data['proveedor_direccion'] ?? null;
                    $proveedorContacto = $data['proveedor_contacto'] ?? null;

                    $total = isset($data['total']) ? (float)$data['total'] : (float)($pedido['total'] ?? 0);

                    $stmt->execute([
                        $idPedido,
                        $proveedorNombre,
                        $proveedorTelefono,
                        $proveedorEmail,
                        $proveedorWhatsapp,
                        $proveedorDireccion,
                        $proveedorContacto,
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

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

                // Historial de compras finales vinculadas a órdenes de compra
                $sql = "SELECT
                            cf.id_compra_final AS id_compra,
                            oc.id_pedido,
                            cf.fecha_compra,
                            cf.numero_factura,
                            cf.monto_total AS total,
                            oc.estado,
                            oc.observaciones,
                            pr.nombre AS nombre_proyecto,
                            pr.id_proyecto,
                            pv.id_provedor,
                            pv.nombre AS nombre_provedor,
                            u.u_nombre AS nombre_usuario
                        FROM compras_finales cf
                        INNER JOIN ordenes_compra oc ON cf.id_orden_compra = oc.id_orden_compra
                        INNER JOIN pedidos p ON oc.id_pedido = p.id_pedido
                        INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        LEFT JOIN provedores pv ON oc.id_provedor = pv.id_provedor
                        LEFT JOIN gr_usuarios u ON cf.idusuario = u.u_id
                        WHERE 1=1";

                $params = [];

                if (!empty($proyectoId)) {
                    $sql .= " AND pr.id_proyecto = ?";
                    $params[] = $proyectoId;
                }

                if (!empty($fechaDesde)) {
                    $sql .= " AND DATE(cf.fecha_compra) >= ?";
                    $params[] = $fechaDesde;
                }

                if (!empty($fechaHasta)) {
                    $sql .= " AND DATE(cf.fecha_compra) <= ?";
                    $params[] = $fechaHasta;
                }

                if (!empty($busqueda)) {
                    $sql .= " AND (cf.id_compra_final LIKE ? OR oc.id_pedido LIKE ? OR cf.numero_factura LIKE ? OR pv.nombre LIKE ? OR pr.nombre LIKE ?)";
                    $like = '%' . $busqueda . '%';
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                }

                $sql .= " ORDER BY cf.fecha_compra DESC LIMIT 100";

                $stmt = $connection->prepare($sql);
                $stmt->execute($params);
                $compras = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'data' => $compras]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'getCompraDetalle':
            // Compatibilidad con compras antiguas (tabla compras). Si estás usando compras_finales, usa getCompraFinalDetalle.
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
                                cd.subtotal,
                                cd.id_provedor,
                                pv.nombre AS nombre_provedor
                           FROM compras_detalle cd
                           LEFT JOIN provedores pv ON cd.id_provedor = pv.id_provedor
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

        case 'getCompraFinalDetalle':
            try {
                $idCompra = isset($_GET['id_compra']) ? (int)$_GET['id_compra'] : 0;
                if (!$idCompra) {
                    throw new Exception('ID de compra requerido');
                }

                $sql = "SELECT
                            cf.id_compra_final AS id_compra,
                            cf.fecha_compra,
                            cf.numero_factura,
                            cf.monto_total AS total,
                            cf.id_orden_compra,
                            oc.numero_orden,
                            oc.estado,
                            oc.observaciones,
                            oc.id_pedido,
                            pv.id_provedor,
                            pv.nombre AS nombre_provedor,
                            pr.id_proyecto,
                            pr.nombre AS nombre_proyecto
                        FROM compras_finales cf
                        INNER JOIN ordenes_compra oc ON cf.id_orden_compra = oc.id_orden_compra
                        INNER JOIN pedidos p ON oc.id_pedido = p.id_pedido
                        INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        LEFT JOIN provedores pv ON oc.id_provedor = pv.id_provedor
                        WHERE cf.id_compra_final = ?";

                $stmt = $connection->prepare($sql);
                $stmt->execute([$idCompra]);
                $compra = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$compra) {
                    throw new Exception('Compra no encontrada');
                }

                $sqlDet = "SELECT
                              ocd.descripcion,
                              ocd.unidad,
                              ocd.cantidad_solicitada AS cantidad,
                              ocd.precio_unitario,
                              ocd.subtotal
                           FROM ordenes_compra_detalle ocd
                           WHERE ocd.id_orden_compra = ?
                           ORDER BY ocd.id_det_pedido ASC";

                $stmtD = $connection->prepare($sqlDet);
                $stmtD->execute([(int)$compra['id_orden_compra']]);
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

        case 'getOrdenesParaCompra':
            try {
                $proyectoId = $_GET['proyecto'] ?? '';
                $fechaDesde = $_GET['fechaDesde'] ?? '';
                $fechaHasta = $_GET['fechaHasta'] ?? '';
                $busqueda = $_GET['busqueda'] ?? '';

                $sql = "SELECT
                            oc.id_orden_compra,
                            oc.numero_orden,
                            oc.fecha_orden,
                            oc.estado,
                            oc.total,
                            oc.id_pedido,
                            pv.nombre AS nombre_provedor,
                            pr.nombre AS nombre_proyecto
                        FROM ordenes_compra oc
                        LEFT JOIN provedores pv ON oc.id_provedor = pv.id_provedor
                        LEFT JOIN pedidos p ON oc.id_pedido = p.id_pedido
                        LEFT JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        LEFT JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        WHERE oc.estado IN ('pendiente','aprobada','parcialmente_comprada')";

                $params = [];

                if (!empty($proyectoId)) {
                    $sql .= " AND pr.id_proyecto = ?";
                    $params[] = $proyectoId;
                }

                if (!empty($fechaDesde)) {
                    $sql .= " AND DATE(oc.fecha_orden) >= ?";
                    $params[] = $fechaDesde;
                }

                if (!empty($fechaHasta)) {
                    $sql .= " AND DATE(oc.fecha_orden) <= ?";
                    $params[] = $fechaHasta;
                }

                if (!empty($busqueda)) {
                    $sql .= " AND (oc.numero_orden LIKE ? OR oc.id_pedido LIKE ? OR pv.nombre LIKE ? OR pr.nombre LIKE ?)";
                    $like = '%' . $busqueda . '%';
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                }

                $sql .= " ORDER BY oc.fecha_orden DESC";

                $stmt = $connection->prepare($sql);
                $stmt->execute($params);
                $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'data' => $ordenes]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'getOrdenCompraDetalle':
            try {
                $idOrden = isset($_GET['id_orden_compra']) ? (int)$_GET['id_orden_compra'] : 0;
                if (!$idOrden) {
                    throw new Exception('ID de orden requerido');
                }

                $sqlO = "SELECT 
                            oc.id_orden_compra,
                            oc.numero_orden,
                            oc.fecha_orden,
                            oc.estado,
                            oc.subtotal,
                            oc.impuestos,
                            oc.total,
                            oc.observaciones,
                            oc.numero_factura,
                            oc.fecha_factura,
                            oc.id_pedido,
                            pv.nombre as nombre_provedor
                         FROM ordenes_compra oc
                         LEFT JOIN provedores pv ON oc.id_provedor = pv.id_provedor
                         WHERE oc.id_orden_compra = ?";
                $stmt = $connection->prepare($sqlO);
                $stmt->execute([$idOrden]);
                $orden = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$orden) {
                    throw new Exception('Orden no encontrada');
                }

                $sqlD = "SELECT 
                            ocd.id_det_pedido,
                            ocd.descripcion,
                            ocd.unidad,
                            ocd.cantidad_solicitada,
                            ocd.cantidad_comprada,
                            ocd.precio_unitario,
                            ocd.subtotal,
                            ocd.cantidad_recibida,
                            ocd.fecha_recepcion
                         FROM ordenes_compra_detalle ocd
                         WHERE ocd.id_orden_compra = ?";
                $stmtD = $connection->prepare($sqlD);
                $stmtD->execute([$idOrden]);
                $detalles = $stmtD->fetchAll(PDO::FETCH_ASSOC);
                $orden['detalles'] = $detalles;

                echo json_encode(['success' => true, 'data' => $orden]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'registrarCompraDeOrden':
            try {
                $data = $jsonInput ?? [];
                $idOrden = isset($data['id_orden_compra']) ? (int)$data['id_orden_compra'] : 0;
                $numeroFactura = $data['numero_factura'] ?? null;
                $total = $data['total'] ?? null;
                $observaciones = $data['observaciones'] ?? null;
                $itemsRecibidos = $data['items_recibidos'] ?? [];

                // Debug: Log de datos recibidos
                error_log("=== DEBUG REGISTRO COMPRA ===");
                error_log("ID Orden: " . $idOrden);
                error_log("Número Factura: " . $numeroFactura);
                error_log("Items Recibidos: " . json_encode($itemsRecibidos));
                error_log("Cantidad de items recibidos: " . count($itemsRecibidos));

                if (!$idOrden) throw new Exception('ID de orden requerido');
                if (!$numeroFactura) throw new Exception('Número de factura requerido');

                // Validar orden existente
                $stmtO = $connection->prepare("SELECT id_orden_compra, id_pedido, id_provedor FROM ordenes_compra WHERE id_orden_compra = ?");
                $stmtO->execute([$idOrden]);
                $orden = $stmtO->fetch(PDO::FETCH_ASSOC);
                if (!$orden) throw new Exception('Orden de compra no encontrada');

                session_start();
                $idUsuario = $_SESSION['u_id'] ?? 1;

                $connection->beginTransaction();

                // Actualizar cantidades recibidas según lo que llegó
                $hayFaltantes = false;
                $itemsParaOrdenComplementaria = [];
                
                error_log("=== PROCESANDO ITEMS RECIBIDOS ===");
                
                foreach ($itemsRecibidos as $index => $item) {
                    $idDetPedido = $item['id_det_pedido'];
                    $cantidadRecibida = (float)$item['cantidad_recibida'];
                    $cantidadEsperada = (float)$item['cantidad_esperada'];
                    
                    error_log("Item $index: ID=$idDetPedido, Recibida=$cantidadRecibida, Esperada=$cantidadEsperada");
                    
                    // Actualizar cantidad recibida en el detalle
                    $stmtUpdDet = $connection->prepare("UPDATE ordenes_compra_detalle SET cantidad_recibida = ?, fecha_recepcion = NOW() WHERE id_orden_compra = ? AND id_det_pedido = ?");
                    $stmtUpdDet->execute([$cantidadRecibida, $idOrden, $idDetPedido]);
                    
                    // Si hay faltantes, preparar para orden complementaria
                    if ($cantidadRecibida < $cantidadEsperada) {
                        $hayFaltantes = true;
                        $faltante = $cantidadEsperada - $cantidadRecibida;
                        
                        error_log("HAY FALTANTE: $faltante unidades para item $idDetPedido");
                        
                        // Obtener datos del item para la orden complementaria
                        $stmtItem = $connection->prepare("SELECT descripcion, unidad, precio_unitario FROM ordenes_compra_detalle WHERE id_orden_compra = ? AND id_det_pedido = ?");
                        $stmtItem->execute([$idOrden, $idDetPedido]);
                        $itemData = $stmtItem->fetch(PDO::FETCH_ASSOC);
                        
                        $itemsParaOrdenComplementaria[] = [
                            'id_det_pedido' => $idDetPedido,
                            'descripcion' => $itemData['descripcion'],
                            'unidad' => $itemData['unidad'],
                            'cantidad_faltante' => $faltante,
                            'precio_unitario' => $itemData['precio_unitario']
                        ];
                    }
                }

                // Si hay faltantes, generar orden complementaria automáticamente
                $idOrdenComplementaria = null;
                $mensajeObservaciones = $observaciones ?? '';
                
                if ($hayFaltantes && !empty($itemsParaOrdenComplementaria)) {
                    $idOrdenComplementaria = generarOrdenComplementaria($connection, $orden, $itemsParaOrdenComplementaria, $idUsuario);
                    if ($idOrdenComplementaria) {
                        $mensajeObservaciones .= "\n[ORDEN COMPLEMENTARIA] Se generó OC #$idOrdenComplementaria por items faltantes";
                    }
                }

                // Insertar en compras_finales
                $stmtCF = $connection->prepare("INSERT INTO compras_finales (id_orden_compra, fecha_compra, monto_total, numero_factura, fecha_factura, idusuario) VALUES (?, NOW(), ?, ?, CURDATE(), ?)");
                $stmtCF->execute([$idOrden, $total, $numeroFactura, $idUsuario]);

                // Actualizar estado de la orden con mensaje de referencia
                // Lógica mejorada para determinar el estado correcto
                if (empty($itemsRecibidos)) {
                    // Si no vienen items recibidos, mantener estado anterior o poner pendiente
                    $nuevoEstadoOrden = 'pendiente';
                    error_log("ERROR: No se recibieron datos de items del frontend");
                } elseif ($hayFaltantes) {
                    $nuevoEstadoOrden = 'parcialmente_recibida';
                    error_log("ESTADO: Orden parcialmente recibida (hay faltantes)");
                } else {
                    // No hay faltantes y se recibieron items correctamente
                    $nuevoEstadoOrden = 'recibida';
                    error_log("ESTADO: Orden recibida completamente");
                }
                
                error_log("=== DETERMINANDO ESTADO FINAL ===");
                error_log("Items recibidos: " . count($itemsRecibidos));
                error_log("Hay faltantes: " . ($hayFaltantes ? 'SÍ' : 'NO'));
                error_log("Nuevo estado orden: $nuevoEstadoOrden");
                
                $stmtUpdOrden = $connection->prepare("UPDATE ordenes_compra SET estado = ?, numero_factura = ?, fecha_factura = CURDATE(), observaciones = CONCAT(COALESCE(observaciones,''), '\n[COMPRA] ', ?, COALESCE(observaciones_complementaria, '')), fechaupdate = NOW() WHERE id_orden_compra = ?");
                $stmtUpdOrden->execute([$nuevoEstadoOrden, $numeroFactura, $mensajeObservaciones, $idOrden]);

                // Recalcular estado del pedido
                $idPedido = (int)$orden['id_pedido'];
                $sqlPend = "SELECT COUNT(*) AS faltantes
                            FROM pedidos_detalle pd
                            LEFT JOIN (
                              SELECT ocd.id_det_pedido, SUM(ocd.cantidad_recibida) AS recibida
                              FROM ordenes_compra_detalle ocd
                              INNER JOIN ordenes_compra oc ON oc.id_orden_compra = ocd.id_orden_compra
                              WHERE oc.id_pedido = ?
                              GROUP BY ocd.id_det_pedido
                            ) s ON s.id_det_pedido = pd.id_det_pedido
                            WHERE pd.id_pedido = ? AND (s.recibida IS NULL OR s.recibida < pd.cantidad)";
                $stmtPend = $connection->prepare($sqlPend);
                $stmtPend->execute([$idPedido, $idPedido]);
                $faltantes = (int)($stmtPend->fetch(PDO::FETCH_ASSOC)['faltantes'] ?? 0);

                $nuevoEstadoPedido = $faltantes === 0 ? 'recibido' : 'parcialmente_recibido';
                $stmtUpdPedido = $connection->prepare("UPDATE pedidos SET estado = ? WHERE id_pedido = ?");
                $stmtUpdPedido->execute([$nuevoEstadoPedido, $idPedido]);

                $connection->commit();

                $mensaje = 'Compra registrada correctamente';
                if ($idOrdenComplementaria) {
                    $mensaje .= '. Se generó automáticamente la orden complementaria #' . $idOrdenComplementaria . ' para los faltantes.';
                }

                echo json_encode(['success' => true, 'message' => $mensaje, 'id_orden_complementaria' => $idOrdenComplementaria]);
            } catch (Exception $e) {
                if (isset($connection) && $connection->inTransaction()) $connection->rollBack();
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

/**
 * Generar automáticamente una orden de compra complementaria para los faltantes
 */
function generarOrdenComplementaria($connection, $ordenOriginal, $itemsFaltantes, $idUsuario) {
    try {
        // Generar número de orden único
        $año = date('Y');
        $sqlCount = "SELECT COUNT(*) as count FROM ordenes_compra WHERE YEAR(fecha_orden) = ?";
        $stmtCount = $connection->prepare($sqlCount);
        $stmtCount->execute([$año]);
        $result = $stmtCount->fetch(PDO::FETCH_ASSOC);
        $secuencial = str_pad($result['count'] + 1, 4, '0', STR_PAD_LEFT);
        $numeroOrden = "OC-{$año}-{$secuencial}";

        // Calcular totales de la orden complementaria
        $subtotal = 0;
        foreach ($itemsFaltantes as $item) {
            $subtotal += $item['cantidad_faltante'] * $item['precio_unitario'];
        }
        $impuestos = 0; // Ajustar según lógica de impuestos
        $total = $subtotal + $impuestos;

        // Insertar orden complementaria
        $sqlOrden = "INSERT INTO ordenes_compra 
                    (id_pedido, id_provedor, numero_orden, subtotal, impuestos, total, estado, 
                     observaciones, idusuario, id_orden_original, es_complementaria, motivo_complementaria) 
                VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, TRUE, ?)";

        $stmtOrden = $connection->prepare($sqlOrden);
        $motivo = "Orden complementaria generada automáticamente por entrega parcial de la orden #" . $ordenOriginal['id_orden_compra'];
        $observacionesComplementaria = "Esta orden complementaria se generó debido a items faltantes de la orden original OC #" . $ordenOriginal['numero_orden'] . " (ID: " . $ordenOriginal['id_orden_compra'] . ")";
        $stmtOrden->execute([
            $ordenOriginal['id_pedido'],
            $ordenOriginal['id_provedor'],
            $numeroOrden,
            $subtotal,
            $impuestos,
            $total,
            $observacionesComplementaria,
            $idUsuario,
            $ordenOriginal['id_orden_compra'],
            $motivo
        ]);

        $idNuevaOrden = $connection->lastInsertId();

        // Insertar detalles de la orden complementaria
        foreach ($itemsFaltantes as $item) {
            $sqlDetalle = "INSERT INTO ordenes_compra_detalle 
                        (id_orden_compra, id_det_pedido, descripcion, unidad, 
                         cantidad_solicitada, cantidad_comprada, precio_unitario, subtotal) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            $stmtDetalle = $connection->prepare($sqlDetalle);
            $stmtDetalle->execute([
                $idNuevaOrden,
                $item['id_det_pedido'],
                $item['descripcion'],
                $item['unidad'],
                $item['cantidad_faltante'], // cantidad solicitada = faltante
                $item['cantidad_faltante'], // cantidad comprada = faltante
                $item['precio_unitario'],
                $item['cantidad_faltante'] * $item['precio_unitario']
            ]);
        }

        return $idNuevaOrden;
    } catch (Exception $e) {
        throw new Exception('Error al generar orden complementaria: ' . $e->getMessage());
    }
}

<?php
/**
 * ComprasController.php
 * Controlador para gestión de compras sobre pedidos aprobados
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Capturar cualquier salida antes de JSON
ob_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';

try {
    $connection = Database::getConnection();
    $jsonInput = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? '';

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
                // Limpiar buffer de salida para evitar contaminación JSON
                if (ob_get_length()) {
                    ob_clean();
                }
                
                // Validar que sea una llamada POST válida
                if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                    throw new Exception('Método no permitido');
                }
                
                $data = json_decode(file_get_contents('php://input'), true);
                $idOrden = isset($data['id_orden_compra']) ? (int)$data['id_orden_compra'] : 0;
                $numeroFactura = $data['numero_factura'] ?? null;
                $total = $data['total'] ?? null;
                $observaciones = $data['observaciones'] ?? null;
                $itemsRecibidos = $data['items_recibidos'] ?? [];

                if (!$idOrden) throw new Exception('ID de orden requerido');
                if (!$numeroFactura) throw new Exception('Número de factura requerido');
                if (empty($itemsRecibidos)) throw new Exception('Debe especificar los items recibidos');

                // Validar orden existente
                $stmtO = $connection->prepare("SELECT id_orden_compra, id_pedido, id_provedor, numero_orden FROM ordenes_compra WHERE id_orden_compra = ?");
                $stmtO->execute([$idOrden]);
                $orden = $stmtO->fetch(PDO::FETCH_ASSOC);
                if (!$orden) throw new Exception('Orden de compra no encontrada');

                session_start();
                $idUsuario = $_SESSION['u_id'] ?? 1;

                // Iniciar transacción
                $connection->beginTransaction();
                
                // Procesar items recibidos y detectar faltantes
                $itemsFaltantes = [];
                $todosCompletos = true;
                
                foreach ($itemsRecibidos as $item) {
                    $idDetPedido = $item['id_det_pedido'];
                    $cantidadEsperada = (float)$item['cantidad_esperada'];
                    $cantidadRecibida = (float)$item['cantidad_recibida'];
                    $precioUnitario = (float)$item['precio_unitario'];
                    
                    // Actualizar cantidad recibida en el detalle de la orden
                    $stmtUpdDet = $connection->prepare("UPDATE ordenes_compra_detalle SET cantidad_recibida = ?, fecha_recepcion = NOW() WHERE id_orden_compra = ? AND id_det_pedido = ?");
                    $stmtUpdDet->execute([$cantidadRecibida, $idOrden, $idDetPedido]);
                    
                    // Verificar si hay faltantes
                    $cantidadFaltante = $cantidadEsperada - $cantidadRecibida;
                    if ($cantidadFaltante > 0.01) { // Tolerancia para decimales
                        $todosCompletos = false;
                        
                        // Obtener descripción y unidad del item
                        $stmtItem = $connection->prepare("SELECT descripcion, unidad FROM ordenes_compra_detalle WHERE id_orden_compra = ? AND id_det_pedido = ?");
                        $stmtItem->execute([$idOrden, $idDetPedido]);
                        $itemInfo = $stmtItem->fetch(PDO::FETCH_ASSOC);
                        
                        $itemsFaltantes[] = [
                            'id_det_pedido' => $idDetPedido,
                            'descripcion' => $itemInfo['descripcion'],
                            'unidad' => $itemInfo['unidad'],
                            'cantidad_faltante' => $cantidadFaltante,
                            'precio_unitario' => $precioUnitario
                        ];
                    }
                }

                // Determinar estado de la orden
                $estadoOrden = $todosCompletos ? 'comprada' : 'parcialmente_comprada';
                
                // Actualizar orden de compra
                $obsCompleta = $observaciones ? "\n[COMPRA] " . $observaciones : '';
                $stmtUpdOrden = $connection->prepare("UPDATE ordenes_compra SET estado = ?, numero_factura = ?, fecha_factura = CURDATE(), observaciones = CONCAT(COALESCE(observaciones,''), ?), fechaupdate = NOW() WHERE id_orden_compra = ?");
                $stmtUpdOrden->execute([$estadoOrden, $numeroFactura, $obsCompleta, $idOrden]);

                // Insertar en compras_finales
                $stmtCF = $connection->prepare("INSERT INTO compras_finales (id_orden_compra, fecha_compra, monto_total, numero_factura, fecha_factura, idusuario) VALUES (?, NOW(), ?, ?, CURDATE(), ?)");
                $stmtCF->execute([$idOrden, $total, $numeroFactura, $idUsuario]);

                // Actualizar estado del pedido
                $idPedido = (int)$orden['id_pedido'];
                $estadoPedido = $todosCompletos ? 'comprado' : 'parcialmente_comprado';
                $stmtUpdPedido = $connection->prepare("UPDATE pedidos SET estado = ? WHERE id_pedido = ?");
                $stmtUpdPedido->execute([$estadoPedido, $idPedido]);

                // Generar orden complementaria si hay faltantes
                $idOrdenComplementaria = null;
                if (!empty($itemsFaltantes)) {
                    $idOrdenComplementaria = generarOrdenComplementaria($connection, $orden, $itemsFaltantes, $idUsuario);
                }

                $connection->commit();

                // Preparar respuesta
                $response = [
                    'success' => true,
                    'message' => 'Compra registrada correctamente',
                    'estado_orden' => $estadoOrden,
                    'items_recibidos' => count($itemsRecibidos),
                    'items_faltantes' => count($itemsFaltantes)
                ];

                if ($idOrdenComplementaria) {
                    $response['id_orden_complementaria'] = $idOrdenComplementaria;
                    $response['id_orden_original'] = $idOrden;
                }

                header('Content-Type: application/json');
                echo json_encode($response);
                
            } catch (Exception $e) {
                if ($connection->inTransaction()) {
                    $connection->rollBack();
                }
                
                // Limpiar buffer en caso de error
                if (ob_get_length()) {
                    ob_clean();
                }
                
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Acción no válida', 'action_received' => $action]);
            break;
    }
} catch (Exception $e) {
    // Limpiar cualquier salida previa
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error interno del servidor: ' . $e->getMessage()]);
}

// Obtener el contenido del buffer y limpiarlo
if (ob_get_length()) {
    ob_end_flush();
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
                     observaciones, idusuario, id_orden_original, es_complementaria, motivo_complementaria, fecha_orden) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())";
        
        $stmtOrden = $connection->prepare($sqlOrden);
        $stmtOrden->execute([
            $ordenOriginal['id_pedido'],
            $ordenOriginal['id_provedor'],
            $numeroOrden,
            $subtotal,
            $impuestos,
            $total,
            'pendiente',
            'Orden complementaria generada por recepción parcial de OC ' . ($ordenOriginal['numero_orden'] ?? $ordenOriginal['id_orden_compra']),
            $idUsuario,
            $ordenOriginal['id_orden_compra'],
            'Recepción parcial de orden #' . $ordenOriginal['id_orden_compra']
        ]);

        $idNuevaOrden = $connection->lastInsertId();

        // Insertar detalles de la orden complementaria
        foreach ($itemsFaltantes as $item) {
            $sqlDetalle = "INSERT INTO ordenes_compra_detalle 
                        (id_orden_compra, id_det_pedido, descripcion, unidad, 
                         cantidad_solicitada, cantidad_comprada, precio_unitario, subtotal) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmtDetalle = $connection->prepare($sqlDetalle);
            $subtotalItem = $item['cantidad_faltante'] * $item['precio_unitario'];
            $stmtDetalle->execute([
                $idNuevaOrden,
                $item['id_det_pedido'],
                $item['descripcion'],
                $item['unidad'],
                $item['cantidad_faltante'], // cantidad solicitada = faltante
                $item['cantidad_faltante'], // cantidad comprada = faltante
                $item['precio_unitario'],
                $subtotalItem
            ]);
        }

        return $idNuevaOrden;
    } catch (Exception $e) {
        throw new Exception('Error al generar orden complementaria: ' . $e->getMessage());
    }
}

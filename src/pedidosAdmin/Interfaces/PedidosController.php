<?php
/**
 * PedidosController.php
 * Controlador para la administración de pedidos
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

    /**
     * Actualiza el estado de los materiales extra asociados a un pedido
     */
    function actualizarEstadoMaterialesExtraPorPedido(\PDO $connection, $idPedido, $nuevoEstado)
    {
        if (!$idPedido || !$nuevoEstado) {
            return;
        }

        $sql = "UPDATE materiales_extra_presupuesto mep
                INNER JOIN pedidos_detalle pd ON pd.id_material_extra = mep.id_material_extra
                SET mep.estado = ?
                WHERE pd.id_pedido = ?";

        $stmt = $connection->prepare($sql);
        $stmt->execute([$nuevoEstado, $idPedido]);

        if ($stmt->rowCount() === 0) {
            $stmtPedido = $connection->prepare("SELECT observaciones FROM pedidos WHERE id_pedido = ?");
            $stmtPedido->execute([$idPedido]);
            $observaciones = $stmtPedido->fetch(\PDO::FETCH_COLUMN);

            if ($observaciones) {
                if (preg_match_all('/ID ME:\s*(\d+)/i', $observaciones, $matches) && !empty($matches[1])) {
                    $ids = array_unique($matches[1]);
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    $sqlFallback = "UPDATE materiales_extra_presupuesto 
                                    SET estado = ?
                                    WHERE id_material_extra IN ($placeholders)";
                    $stmtFallback = $connection->prepare($sqlFallback);
                    $stmtFallback->execute(array_merge([$nuevoEstado], $ids));
                }
            }
        }
    }

    switch ($action) {
        
        // ============================================
        // ENDPOINTS PARA ADMINISTRACIÓN DE PEDIDOS
        // ============================================

        case 'getAllPedidosAdmin':
            try {
                // Obtener parámetros de filtrado
                $proyectoId = $_GET['proyecto'] ?? '';
                $estado = $_GET['estado'] ?? '';
                $fechaDesde = $_GET['fechaDesde'] ?? '';
                $fechaHasta = $_GET['fechaHasta'] ?? '';
                $busqueda = $_GET['busqueda'] ?? '';
                $pagina = (int)($_GET['pagina'] ?? 1);
                $porPagina = 20;
                $offset = ($pagina - 1) * $porPagina;

                // Construir consulta base
                $sql = "SELECT 
                            p.id_pedido,
                            p.fecha_pedido,
                            p.estado,
                            p.total,
                            p.observaciones,
                            pr.nombre as nombre_proyecto,
                            pr.id_proyecto,
                            pres.id_presupuesto,
                            u.u_nombre as nombre_usuario,
                            u.u_id as id_usuario,
                            COUNT(pd.id_det_pedido) as total_items
                        FROM pedidos p
                        INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        LEFT JOIN gr_usuarios u ON p.idusuario = u.u_id
                        LEFT JOIN pedidos_detalle pd ON p.id_pedido = pd.id_pedido
                        WHERE 1=1";

                $params = [];

                // Aplicar filtros
                if (!empty($proyectoId)) {
                    $sql .= " AND pr.id_proyecto = ?";
                    $params[] = $proyectoId;
                }

                if (!empty($estado)) {
                    $sql .= " AND p.estado = ?";
                    $params[] = $estado;
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
                    $sql .= " AND (p.id_pedido LIKE ? OR u.u_nombre LIKE ? OR pr.nombre LIKE ?)";
                    $searchTerm = "%{$busqueda}%";
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }

                $sql .= " GROUP BY p.id_pedido, p.fecha_pedido, p.estado, p.total, p.observaciones,
                                   pr.nombre, pr.id_proyecto, pres.id_presupuesto, u.u_nombre, u.u_id
                          ORDER BY p.fecha_pedido DESC
                          LIMIT $porPagina OFFSET $offset";

                $stmt = $connection->prepare($sql);
                $stmt->execute($params);
                $pedidos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                // Contar total de pedidos (sin paginación)
                $sqlCount = "SELECT COUNT(DISTINCT p.id_pedido) as total
                             FROM pedidos p
                             INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                             INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                             LEFT JOIN gr_usuarios u ON p.idusuario = u.u_id
                             WHERE 1=1";

                $paramsCount = [];
                if (!empty($proyectoId)) {
                    $sqlCount .= " AND pr.id_proyecto = ?";
                    $paramsCount[] = $proyectoId;
                }
                if (!empty($estado)) {
                    $sqlCount .= " AND p.estado = ?";
                    $paramsCount[] = $estado;
                }
                if (!empty($fechaDesde)) {
                    $sqlCount .= " AND DATE(p.fecha_pedido) >= ?";
                    $paramsCount[] = $fechaDesde;
                }
                if (!empty($fechaHasta)) {
                    $sqlCount .= " AND DATE(p.fecha_pedido) <= ?";
                    $paramsCount[] = $fechaHasta;
                }
                if (!empty($busqueda)) {
                    $sqlCount .= " AND (p.id_pedido LIKE ? OR u.u_nombre LIKE ? OR pr.nombre LIKE ?)";
                    $paramsCount[] = $searchTerm;
                    $paramsCount[] = $searchTerm;
                    $paramsCount[] = $searchTerm;
                }

                $stmtCount = $connection->prepare($sqlCount);
                $stmtCount->execute($paramsCount);
                $totalPedidos = $stmtCount->fetch(\PDO::FETCH_ASSOC)['total'];
                $totalPaginas = ceil($totalPedidos / $porPagina);

                echo json_encode([
                    'success' => true,
                    'pedidos' => $pedidos,
                    'total' => $totalPedidos,
                    'totalPaginas' => $totalPaginas,
                    'paginaActual' => $pagina
                ]);

            } catch (\Exception $e) {
                error_log("ERROR en getAllPedidosAdmin: " . $e->getMessage());
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getEstadisticasPedidos':
            try {
                // Estadísticas generales
                $sql = "SELECT 
                            COUNT(*) as total,
                            SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                            SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
                            SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados
                        FROM pedidos";

                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'data' => $stats
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getPedidoDetalleAdmin':
            try {
                $idPedido = $_GET['id_pedido'] ?? null;

                if (!$idPedido) {
                    throw new \Exception('ID de pedido requerido');
                }

                // Obtener información del pedido
                $sql = "SELECT 
                            p.id_pedido,
                            p.fecha_pedido,
                            p.estado,
                            p.total,
                            p.observaciones,
                            pr.nombre as nombre_proyecto,
                            pr.id_proyecto,
                            pres.id_presupuesto,
                            u.u_nombre as nombre_usuario,
                            u.u_id as id_usuario
                        FROM pedidos p
                        INNER JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        INNER JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        LEFT JOIN gr_usuarios u ON p.idusuario = u.u_id
                        WHERE p.id_pedido = ?";

                $stmt = $connection->prepare($sql);
                $stmt->execute([$idPedido]);
                $pedido = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!$pedido) {
                    throw new \Exception('Pedido no encontrado');
                }

                // Obtener componentes del pedido
                $sqlComponentes = "SELECT 
                                    pd.id_det_pedido,
                                    pd.id_componente,
                                    pd.tipo_componente,
                                    pd.cantidad,
                                    pd.precio_unitario,
                                    pd.subtotal,
                                    pd.justificacion,
                                    pd.es_excedente,
                                    COALESCE(ic.descripcion, CAST(m.nombremat AS CHAR)) AS descripcion,
                                    COALESCE(ic.unidad, u.unidesc) AS unidad,
                                    m.cod_material AS codigo_material_extra,
                                    CAST(m.nombremat AS CHAR) AS nombre_material_extra,
                                    
                                    -- Información de estado de compra/orden
                                    COALESCE((
                                        SELECT SUM(ocd.cantidad_solicitada)
                                        FROM ordenes_compra_detalle ocd
                                        INNER JOIN ordenes_compra oc ON ocd.id_orden_compra = oc.id_orden_compra
                                        WHERE ocd.id_det_pedido = pd.id_det_pedido
                                        AND oc.estado IN ('pendiente','aprobada','comprada','parcialmente_comprada','recibida')
                                    ), 0) as cantidad_en_orden,
                                    
                                    COALESCE((
                                        SELECT SUM(ocd.cantidad_recibida)
                                        FROM ordenes_compra_detalle ocd
                                        INNER JOIN ordenes_compra oc ON ocd.id_orden_compra = oc.id_orden_compra
                                        WHERE ocd.id_det_pedido = pd.id_det_pedido
                                        AND oc.estado IN ('comprada','parcialmente_comprada','recibida')
                                    ), 0) as cantidad_comprada,
                                    
                                    (
                                        SELECT GROUP_CONCAT(DISTINCT oc.numero_orden ORDER BY oc.numero_orden SEPARATOR ', ')
                                        FROM ordenes_compra_detalle ocd
                                        INNER JOIN ordenes_compra oc ON ocd.id_orden_compra = oc.id_orden_compra
                                        WHERE ocd.id_det_pedido = pd.id_det_pedido
                                        AND oc.estado IN ('pendiente','aprobada','comprada','parcialmente_comprada','recibida')
                                    ) as numeros_orden
                                FROM pedidos_detalle pd
                                LEFT JOIN item_componentes ic ON pd.id_componente = ic.id_componente
                                LEFT JOIN materiales_extra_presupuesto mep ON pd.id_material_extra = mep.id_material_extra
                                LEFT JOIN materiales m ON mep.id_material = m.id_material
                                LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
                                WHERE pd.id_pedido = ?
                                ORDER BY pd.es_excedente ASC, COALESCE(ic.descripcion, m.nombremat) ASC";

                $stmtComp = $connection->prepare($sqlComponentes);
                $stmtComp->execute([$idPedido]);
                $componentes = $stmtComp->fetchAll(\PDO::FETCH_ASSOC);

                $pedido['componentes'] = $componentes;

                echo json_encode([
                    'success' => true,
                    'data' => $pedido
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'aprobarPedido':
            try {
                $data = $jsonInput ?? json_decode($rawInput, true) ?? [];
                $idPedido = $data['id_pedido'] ?? null;
                $comentarios = $data['comentarios'] ?? '';

                if (!$idPedido) {
                    throw new \Exception('ID de pedido requerido');
                }

                session_start();
                $idUsuarioAdmin = $_SESSION['u_id'] ?? 1;

                // Actualizar estado del pedido
                $sql = "UPDATE pedidos 
                        SET estado = 'aprobado',
                            observaciones = CONCAT(COALESCE(observaciones, ''), '\n[APROBADO] ', ?)
                        WHERE id_pedido = ?";

                $stmt = $connection->prepare($sql);
                $comentarioFinal = date('Y-m-d H:i:s') . " - Admin ID: {$idUsuarioAdmin}";
                if (!empty($comentarios)) {
                    $comentarioFinal .= " - {$comentarios}";
                }
                $stmt->execute([$comentarioFinal, $idPedido]);

                if ($stmt->rowCount() === 0) {
                    throw new \Exception('No se pudo aprobar el pedido');
                }

                actualizarEstadoMaterialesExtraPorPedido($connection, $idPedido, 'aprobado');

                echo json_encode([
                    'success' => true,
                    'message' => 'Pedido aprobado correctamente'
                ]);

            } catch (\Exception $e) {
                error_log("ERROR en aprobarPedido: " . $e->getMessage());
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'rechazarPedido':
            try {
                $data = $jsonInput ?? json_decode($rawInput, true) ?? [];
                $idPedido = $data['id_pedido'] ?? null;
                $motivo = $data['motivo'] ?? '';

                if (!$idPedido) {
                    throw new \Exception('ID de pedido requerido');
                }

                if (empty($motivo)) {
                    throw new \Exception('El motivo de rechazo es requerido');
                }

                session_start();
                $idUsuarioAdmin = $_SESSION['u_id'] ?? 1;

                // Actualizar estado del pedido
                $sql = "UPDATE pedidos 
                        SET estado = 'rechazado',
                            observaciones = CONCAT(COALESCE(observaciones, ''), '\n[RECHAZADO] ', ?)
                        WHERE id_pedido = ?";

                $stmt = $connection->prepare($sql);
                $comentarioFinal = date('Y-m-d H:i:s') . " - Admin ID: {$idUsuarioAdmin} - Motivo: {$motivo}";
                $stmt->execute([$comentarioFinal, $idPedido]);

                if ($stmt->rowCount() === 0) {
                    throw new \Exception('No se pudo rechazar el pedido');
                }

                actualizarEstadoMaterialesExtraPorPedido($connection, $idPedido, 'rechazado');

                echo json_encode([
                    'success' => true,
                    'message' => 'Pedido rechazado correctamente'
                ]);

            } catch (\Exception $e) {
                error_log("ERROR en rechazarPedido: " . $e->getMessage());
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getProyectos':
            try {
                $sql = "SELECT id_proyecto, nombre 
                        FROM proyectos 
                        WHERE estado = 1 
                        ORDER BY nombre ASC";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $proyectos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'proyectos' => $proyectos
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Acción no válida',
                'action_received' => $action
            ]);
            break;
    }
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}

exit;

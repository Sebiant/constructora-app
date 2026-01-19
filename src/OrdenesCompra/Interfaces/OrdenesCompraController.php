<?php
/**
 * OrdenesCompraController.php
 * Controlador para gestión de órdenes de compra
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';
require __DIR__ . '/../../../src/Shared/Utils/CalculosComerciales.php';

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
        case 'getOrdenesCompra':
            getOrdenesCompra($connection);
            break;

        case 'getDetalleOrden':
            getDetalleOrden($connection);
            break;

        case 'guardarOrdenCompra':
            guardarOrdenCompra($connection, $jsonInput);
            break;

        case 'actualizarOrdenCompra':
            actualizarOrdenCompra($connection, $jsonInput);
            break;

        case 'eliminarOrdenCompra':
            eliminarOrdenCompra($connection);
            break;

        case 'getPedidosSinOrden':
            getPedidosSinOrden($connection);
            break;

        case 'getProveedores':
            getProveedores($connection);
            break;

        case 'getPedidosDisponibles':
            getPedidosDisponibles($connection);
            break;

        case 'getProductosPedido':
            getProductosPedido($connection);
            break;

        case 'eliminarPedido':
            try {
                $idPedido = (int)($_POST['id_pedido'] ?? 0);
                
                if (!$idPedido) {
                    throw new Exception('ID de pedido requerido');
                }
                
                // Eliminar detalles del pedido primero
                $sqlDetalles = "DELETE FROM pedidos_detalle WHERE id_pedido = ?";
                $stmtDetalles = $connection->prepare($sqlDetalles);
                $stmtDetalles->execute([$idPedido]);
                $detallesEliminados = $stmtDetalles->rowCount();
                
                // Eliminar el pedido
                $sqlPedido = "DELETE FROM pedidos WHERE id_pedido = ?";
                $stmtPedido = $connection->prepare($sqlPedido);
                $stmtPedido->execute([$idPedido]);
                $pedidoEliminado = $stmtPedido->rowCount();
                
                $connection->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => "Pedido eliminado correctamente ({$detallesEliminados} detalles, {$pedidoEliminado} pedido)",
                    'detalles_eliminados' => $detallesEliminados,
                    'pedido_eliminado' => $pedidoEliminado
                ]);
                
            } catch (Exception $e) {
                $connection->rollBack();
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al eliminar pedido: ' . $e->getMessage()
                ]);
            }
            break;
        case 'convertirEnCompra':
            convertirEnCompra($connection, $jsonInput);
            break;
        case 'verificarOrdenExistente':
            verificarOrdenExistente($connection);
            break;

        default:
            throw new Exception('Acción no válida');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Obtener todas las órdenes de compra
 */
function getOrdenesCompra($connection) {
    $sql = "SELECT 
                oc.id_orden_compra,
                oc.numero_orden,
                oc.id_pedido,
                oc.id_provedor,
                pv.nombre as nombre_proveedor,
                oc.fecha_orden,
                oc.numero_factura,
                oc.fecha_factura,
                oc.subtotal,
                oc.impuestos,
                oc.total,
                oc.estado,
                oc.observaciones,
                oc.fecha_aprobacion,
                oc.fechareg,
                oc.fechaupdate
            FROM ordenes_compra oc
            LEFT JOIN provedores pv ON oc.id_provedor = pv.id_provedor
            ORDER BY oc.fecha_orden DESC";

    $stmt = $connection->prepare($sql);
    $stmt->execute();
    $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $ordenes
    ]);
}

/**
 * Obtener detalle completo de una orden de compra
 */
function getDetalleOrden($connection) {
    $idOrden = (int)($_GET['id_orden_compra'] ?? 0);
    
    if (!$idOrden) {
        throw new Exception('ID de orden requerido');
    }

    // Obtener datos principales de la orden
    $sql = "SELECT 
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
                oc.id_orden_original,
                oc.es_complementaria,
                oc.motivo_complementaria,
                pv.nombre as nombre_proveedor
            FROM ordenes_compra oc
            LEFT JOIN provedores pv ON oc.id_provedor = pv.id_provedor
            WHERE oc.id_orden_compra = ?";

    $stmt = $connection->prepare($sql);
    $stmt->execute([$idOrden]);
    $orden = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$orden) {
        throw new Exception('Orden no encontrada');
    }

    // Obtener productos de la orden
    $sql = "SELECT 
                ocd.id_det_pedido,
                ocd.descripcion,
                ocd.unidad,
                ocd.cantidad_solicitada,
                ocd.cantidad_comprada,
                ocd.cantidad_recibida,
                ocd.precio_unitario,
                ocd.subtotal,
                ocd.fecha_recepcion
            FROM ordenes_compra_detalle ocd
            WHERE ocd.id_orden_compra = ?
            ORDER BY ocd.descripcion";
    
    $stmt = $connection->prepare($sql);
    $stmt->execute([$idOrden]);
    $productosOriginales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Agrupar productos por descripción
    $productosAgrupados = [];
    foreach ($productosOriginales as $producto) {
        $clave = trim(strtolower($producto['descripcion']));
        
        if (!isset($productosAgrupados[$clave])) {
            $productosAgrupados[$clave] = [
                'id_det_pedido' => [], // Guardar IDs originales
                'descripcion' => $producto['descripcion'],
                'unidad' => $producto['unidad'],
                'cantidad_solicitada' => 0,
                'cantidad_comprada' => 0,
                'cantidad_recibida' => 0,
                'precio_unitario' => $producto['precio_unitario'],
                'subtotal' => 0,
                'fecha_recepcion' => $producto['fecha_recepcion']
            ];
        }
        
        // Sumar cantidades y subtotales
        $productosAgrupados[$clave]['cantidad_solicitada'] += floatval($producto['cantidad_solicitada']);
        $productosAgrupados[$clave]['cantidad_comprada'] += floatval($producto['cantidad_comprada']);
        $productosAgrupados[$clave]['cantidad_recibida'] += floatval($producto['cantidad_recibida']);
        $productosAgrupados[$clave]['subtotal'] += floatval($producto['subtotal']);
        $productosAgrupados[$clave]['id_det_pedido'][] = $producto['id_det_pedido'];
    }

    // Convertir a array indexado
    $productos = array_values($productosAgrupados);

    $orden['productos'] = $productos;

    // Obtener historial de recepciones/compras para esta orden
    $sqlH = "SELECT 
                c.id_compra,
                c.fecha_compra,
                c.numero_factura,
                c.total as total_recepcion,
                c.observaciones,
                u.u_nombre as nombre_usuario
             FROM compras c
             LEFT JOIN gr_usuarios u ON c.idusuario = u.u_id
             WHERE c.id_orden_compra = ?
             ORDER BY c.fecha_compra ASC";
    
    $stmtH = $connection->prepare($sqlH);
    $stmtH->execute([$idOrden]);
    $historialRecepciones = $stmtH->fetchAll(PDO::FETCH_ASSOC);

    // Para cada recepción, obtener los detalles de items recibidos
    foreach ($historialRecepciones as &$recepcion) {
        // Obtener los detalles desde log_recepciones
        $sqlLog = "SELECT 
                    lr.id_det_pedido,
                    lr.descripcion,
                    lr.unidad,
                    lr.cantidad_recibida,
                    lr.precio_unitario,
                    (lr.cantidad_recibida * lr.precio_unitario) as subtotal_item
                  FROM log_recepciones lr
                  WHERE lr.id_compra = ?
                  ORDER BY lr.id_det_pedido";
        
        $stmtLog = $connection->prepare($sqlLog);
        $stmtLog->execute([$recepcion['id_compra']]);
        $itemsRecibidos = $stmtLog->fetchAll(PDO::FETCH_ASSOC);
        
        // Si no hay detalles en el log, mostrar mensaje informativo
        if (empty($itemsRecibidos)) {
            $recepcion['advertencia'] = 'Esta recepción fue registrada antes de implementar el historial detallado. Para ver detalles exactos, las recepciones futuras mostrarán información completa.';
        }
        
        $recepcion['items_recibidos'] = $itemsRecibidos;
    }

    $orden['historial_recepciones'] = $historialRecepciones;

    // Determinar estado real basado en cantidades recibidas
    $totalSolicitado = array_sum(array_column($productos, 'cantidad_solicitada'));
    $totalRecibido = array_sum(array_column($productos, 'cantidad_recibida'));
    
    if ($totalRecibido > 0) {
        if ($totalRecibido >= $totalSolicitado) {
            $orden['estado_real'] = 'recibida';
        } else {
            $orden['estado_real'] = 'parcialmente_recibida';
        }
    } else {
        $orden['estado_real'] = $orden['estado']; // Mantener estado original si no hay recepciones
    }

    // Obtener información de órdenes relacionadas
    $orden['ordenes_relacionadas'] = [];
    
    // Si es una orden complementaria, obtener la original con su estado real
    if ($orden['es_complementaria'] && $orden['id_orden_original']) {
        $sqlOriginal = "SELECT oc.id_orden_compra, oc.numero_orden, oc.estado,
                               COALESCE(SUM(ocd.cantidad_solicitada), 0) as total_solicitado,
                               COALESCE(SUM(ocd.cantidad_recibida), 0) as total_recibido
                       FROM ordenes_compra oc
                       LEFT JOIN ordenes_compra_detalle ocd ON oc.id_orden_compra = ocd.id_orden_compra
                       WHERE oc.id_orden_compra = ?
                       GROUP BY oc.id_orden_compra, oc.numero_orden, oc.estado";
        $stmtOriginal = $connection->prepare($sqlOriginal);
        $stmtOriginal->execute([$orden['id_orden_original']]);
        $ordenOriginal = $stmtOriginal->fetch(PDO::FETCH_ASSOC);
        
        if ($ordenOriginal) {
            // Determinar estado real de la orden original
            $estadoRealOriginal = $ordenOriginal['estado'];
            if ($ordenOriginal['total_recibido'] > 0) {
                if ($ordenOriginal['total_recibido'] >= $ordenOriginal['total_solicitado']) {
                    $estadoRealOriginal = 'recibida';
                } else {
                    $estadoRealOriginal = 'parcialmente_recibida';
                }
            }
            
            $orden['ordenes_relacionadas'][] = [
                'tipo' => 'original',
                'id_orden_compra' => $ordenOriginal['id_orden_compra'],
                'numero_orden' => $ordenOriginal['numero_orden'],
                'estado' => $estadoRealOriginal
            ];
        }
    }
    
    // Si no es complementaria, buscar órdenes complementarias
    if (!$orden['es_complementaria']) {
        $sqlComplementarias = "SELECT id_orden_compra, numero_orden, estado, motivo_complementaria 
                              FROM ordenes_compra 
                              WHERE id_orden_original = ? AND es_complementaria = TRUE";
        $stmtComplementarias = $connection->prepare($sqlComplementarias);
        $stmtComplementarias->execute([$idOrden]);
        $complementarias = $stmtComplementarias->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($complementarias as $comp) {
            $orden['ordenes_relacionadas'][] = [
                'tipo' => 'complementaria',
                'id_orden_compra' => $comp['id_orden_compra'],
                'numero_orden' => $comp['numero_orden'],
                'estado' => $comp['estado'],
                'motivo' => $comp['motivo_complementaria']
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $orden
    ]);
}

/**
 * Guardar nueva orden de compra
 */
function guardarOrdenCompra($connection, $data) {
    if (!$data) {
        throw new Exception('Datos no proporcionados');
    }

    // Validar datos requeridos
    if (empty($data['id_pedido']) || empty($data['id_provedor']) || empty($data['productos'])) {
        throw new Exception('Faltan datos requeridos');
    }

    try {
        $connection->beginTransaction();

        // Generar número de orden único
        $numeroOrden = generarNumeroOrden($connection);

        // Insertar orden de compra
        $sql = "INSERT INTO ordenes_compra 
                    (id_pedido, id_provedor, numero_orden, subtotal, impuestos, total, estado, observaciones, idusuario) 
                VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, 1)";

        $stmt = $connection->prepare($sql);
        $stmt->execute([
            $data['id_pedido'],
            $data['id_provedor'],
            $numeroOrden,
            $data['subtotal'],
            $data['impuestos'],
            $data['total'],
            $data['observaciones'] ?? null
        ]);

        $idOrden = $connection->lastInsertId();

        // Insertar productos de la orden
        foreach ($data['productos'] as $producto) {
            $sql = "INSERT INTO ordenes_compra_detalle 
                        (id_orden_compra, id_det_pedido, descripcion, unidad, 
                         cantidad_solicitada, cantidad_comprada, precio_unitario, subtotal) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $connection->prepare($sql);
            $stmt->execute([
                $idOrden,
                $producto['id_det_pedido'],
                $producto['descripcion'],
                $producto['unidad'],
                $producto['cantidad'],
                $producto['cantidad_comprar'],
                $producto['precio_unitario'],
                $producto['cantidad_comprar'] * $producto['precio_unitario']
            ]);
        }

        $connection->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Orden de compra creada correctamente',
            'id_orden_compra' => $idOrden,
            'numero_orden' => $numeroOrden
        ]);

    } catch (Exception $e) {
        $connection->rollBack();
        throw new Exception('Error al guardar orden de compra: ' . $e->getMessage());
    }
}

/**
 * Actualizar orden de compra existente
 */
function actualizarOrdenCompra($connection, $data) {
    if (!$data || empty($data['id_orden_compra'])) {
        throw new Exception('Datos no proporcionados');
    }

    try {
        $connection->beginTransaction();

        $sql = "UPDATE ordenes_compra SET 
                    id_provedor = ?,
                    subtotal = ?,
                    impuestos = ?,
                    total = ?,
                    estado = ?,
                    observaciones = ?,
                    fechaupdate = CURRENT_TIMESTAMP
                WHERE id_orden_compra = ?";

        $stmt = $connection->prepare($sql);
        $stmt->execute([
            $data['id_provedor'],
            $data['subtotal'],
            $data['impuestos'],
            $data['total'],
            $data['estado'],
            $data['observaciones'] ?? null,
            $data['id_orden_compra']
        ]);

        $connection->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Orden de compra actualizada correctamente'
        ]);

    } catch (Exception $e) {
        $connection->rollBack();
        throw new Exception('Error al actualizar orden de compra: ' . $e->getMessage());
    }
}

/**
 * Eliminar orden de compra
 */
function eliminarOrdenCompra($connection) {
    $idOrden = (int)($_GET['id_orden_compra'] ?? 0);
    
    if (!$idOrden) {
        throw new Exception('ID de orden requerido');
    }

    try {
        $connection->beginTransaction();

        // Verificar que la orden no esté comprada
        $sql = "SELECT estado FROM ordenes_compra WHERE id_orden_compra = ?";
        $stmt = $connection->prepare($sql);
        $stmt->execute([$idOrden]);
        $orden = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$orden) {
            throw new Exception('Orden de compra no encontrada');
        }

        if ($orden['estado'] === 'comprada') {
            throw new Exception('No se puede eliminar una orden que ya ha sido comprada');
        }

        // Eliminar orden (en cascada se eliminarán los detalles)
        $sql = "DELETE FROM ordenes_compra WHERE id_orden_compra = ?";
        $stmt = $connection->prepare($sql);
        $stmt->execute([$idOrden]);

        $connection->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Orden de compra eliminada correctamente'
        ]);

    } catch (Exception $e) {
        $connection->rollBack();
        throw new Exception('Error al eliminar orden de compra: ' . $e->getMessage());
    }
}

/**
 * Obtener lista de proveedores activos
 */
function getProveedores($connection) {
    $sql = "SELECT id_provedor, nombre, telefono, email 
            FROM provedores 
            WHERE estado = 1 
            ORDER BY nombre ASC";

    $stmt = $connection->prepare($sql);
    $stmt->execute();
    $proveedores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $proveedores
    ]);
}

/**
 * Obtener pedidos disponibles para crear órdenes de compra
 */
function getPedidosDisponibles($connection) {
    // Pedidos con faltantes reales (> 0) para ordenar, evitando agregados anidados
    $sql = "SELECT 
                p.id_pedido,
                p.fecha_pedido,
                p.total,
                p.estado,
                SUM(dd.faltante_detalle) AS faltante_total,
                SUM(CASE WHEN dd.comprada_total > 0 THEN 1 ELSE 0 END) AS items_con_orden,
                CASE 
                  WHEN SUM(dd.faltante_detalle) = 0 THEN 'completamente_ordenado'
                  WHEN SUM(CASE WHEN dd.comprada_total > 0 THEN 1 ELSE 0 END) = 0 THEN 'sin_orden'
                  ELSE 'parcialmente_ordenado'
                END AS estado_ordenado,
                CONCAT('Pedido #', p.id_pedido, ' - Faltantes: ', FORMAT(SUM(dd.faltante_detalle), 2)) AS descripcion_pedido
            FROM pedidos p
            JOIN (
              SELECT
                pd.id_pedido,
                pd.id_det_pedido,
                pd.cantidad,
                COALESCE(SUM(ocd.cantidad_comprada), 0) AS comprada_total,
                GREATEST(pd.cantidad - COALESCE(SUM(ocd.cantidad_comprada), 0), 0) AS faltante_detalle
              FROM pedidos_detalle pd
              LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
              LEFT JOIN ordenes_compra oc ON ocd.id_orden_compra = oc.id_orden_compra 
                   AND oc.estado IN ('pendiente','aprobada','comprada','parcialmente_comprada')
              GROUP BY pd.id_pedido, pd.id_det_pedido, pd.cantidad
            ) dd ON dd.id_pedido = p.id_pedido
            WHERE p.estado IN ('aprobado', 'parcialmente_comprado')
            GROUP BY p.id_pedido, p.fecha_pedido, p.total, p.estado
            HAVING SUM(dd.faltante_detalle) > 0
            ORDER BY p.fecha_pedido DESC";

    $stmt = $connection->prepare($sql);
    $stmt->execute();
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $pedidos
    ]);
}

/**
 * Obtener productos de un pedido
 */
function verificarOrdenExistente($connection) {
    $idPedido = (int)($_GET['id_pedido'] ?? 0);
    if (!$idPedido) {
        throw new Exception('ID de pedido requerido');
    }

    // Calcular faltantes a nivel pedido usando subconsulta, evitando agregados anidados
    $sql = "SELECT 
                SUM(dd.faltante_detalle) AS faltante_total
            FROM (
              SELECT
                pd.id_pedido,
                pd.id_det_pedido,
                pd.cantidad,
                GREATEST(pd.cantidad - COALESCE(SUM(ocd.cantidad_comprada), 0), 0) AS faltante_detalle
              FROM pedidos_detalle pd
              LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
              LEFT JOIN ordenes_compra oc ON ocd.id_orden_compra = oc.id_orden_compra 
                   AND oc.estado IN ('pendiente','aprobada','comprada','parcialmente_comprada','recibida')
              WHERE pd.id_pedido = ?
              GROUP BY pd.id_pedido, pd.id_det_pedido, pd.cantidad
            ) dd";
    $stmt = $connection->prepare($sql);
    $stmt->execute([$idPedido]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $faltante = (float)($row['faltante_total'] ?? 0);

    echo json_encode([
        'success' => true,
        'tieneOrdenCompleto' => $faltante <= 0,
        'faltante_total' => $faltante
    ]);
}

function getProductosPedido($connection) {
    $idPedido = (int)($_GET['id_pedido'] ?? 0);
    
    if (!$idPedido) {
        throw new Exception('ID de pedido requerido');
    }

    // Productos del pedido con cálculo de cantidades ya compradas
    $sql = "SELECT 
                pd.id_det_pedido,
                COALESCE(ic.descripcion, CAST(m.nombremat AS CHAR)) AS descripcion,
                COALESCE(ic.unidad, u.unidesc, 'unidad') AS unidad,
                pd.cantidad,
                pd.precio_unitario,
                pd.subtotal,
                COALESCE(SUM(ocd.cantidad_comprada), 0) AS cantidad_comprada,
                GREATEST(pd.cantidad - COALESCE(SUM(ocd.cantidad_comprada), 0), 0) AS cantidad_disponible,
                CASE 
                    WHEN GREATEST(pd.cantidad - COALESCE(SUM(ocd.cantidad_comprada), 0), 0) > 0 THEN 'disponible'
                    ELSE 'completado'
                END AS estado_producto,
                GREATEST(pd.cantidad - COALESCE(SUM(ocd.cantidad_comprada), 0), 0) AS cantidad_maxima_seleccionable,
                COALESCE(m.minimo_comercial, 1.0) AS minimo_comercial,
                COALESCE(m.presentacion_comercial, 'Unidad') AS presentacion_comercial
            FROM pedidos_detalle pd
            LEFT JOIN item_componentes ic ON pd.id_componente = ic.id_componente
            LEFT JOIN materiales_extra_presupuesto mep ON pd.id_material_extra = mep.id_material_extra
            LEFT JOIN materiales m ON mep.id_material = m.id_material
            LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
            LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
            LEFT JOIN ordenes_compra oc ON ocd.id_orden_compra = oc.id_orden_compra AND oc.estado IN ('aprobada', 'comprada', 'parcialmente_comprada')
            WHERE pd.id_pedido = ?
            GROUP BY 
                pd.id_det_pedido,
                pd.cantidad,
                pd.precio_unitario,
                pd.subtotal,
                COALESCE(ic.descripcion, CAST(m.nombremat AS CHAR)),
                COALESCE(ic.unidad, u.unidesc, 'unidad'),
                m.minimo_comercial,
                m.presentacion_comercial
            HAVING cantidad_disponible > 0
            ORDER BY COALESCE(ic.descripcion, m.nombremat) ASC";

    $stmt = $connection->prepare($sql);
    $stmt->execute([$idPedido]);
    $productosOriginales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Agrupar productos por descripción
    $productosAgrupados = [];
    foreach ($productosOriginales as $producto) {
        $clave = trim(strtolower($producto['descripcion']));
        
        if (!isset($productosAgrupados[$clave])) {
            $productosAgrupados[$clave] = [
                'id_det_pedido' => [], // Guardar IDs originales
                'descripcion' => $producto['descripcion'],
                'unidad' => $producto['unidad'],
                'cantidad' => 0,
                'precio_unitario' => $producto['precio_unitario'],
                'subtotal' => 0,
                'cantidad_comprada' => 0,
                'cantidad_disponible' => 0,
                'estado_producto' => 'disponible',
                'cantidad_maxima_seleccionable' => 0,
                'minimo_comercial' => $producto['minimo_comercial'],
                'presentacion_comercial' => $producto['presentacion_comercial']
            ];
        }
        
        // Sumar cantidades y subtotales
        $productosAgrupados[$clave]['cantidad'] += floatval($producto['cantidad']);
        $productosAgrupados[$clave]['subtotal'] += floatval($producto['subtotal']);
        $productosAgrupados[$clave]['cantidad_comprada'] += floatval($producto['cantidad_comprada']);
        $productosAgrupados[$clave]['cantidad_disponible'] += floatval($producto['cantidad_disponible']);
        $productosAgrupados[$clave]['cantidad_maxima_seleccionable'] += floatval($producto['cantidad_maxima_seleccionable']);
        $productosAgrupados[$clave]['id_det_pedido'][] = $producto['id_det_pedido'];
        
        // El estado será 'disponible' si hay alguna cantidad disponible
        if ($producto['cantidad_disponible'] > 0) {
            $productosAgrupados[$clave]['estado_producto'] = 'disponible';
        }
    }

    // Convertir a array indexado
    $productos = array_values($productosAgrupados);

    echo json_encode([
        'success' => true,
        'data' => $productos
    ]);
}

/**
 * Convertir orden de compra en compra final
 */
function convertirEnCompra($connection, $data) {
    if (!$data || empty($data['id_orden_compra'])) {
        throw new Exception('Datos no proporcionados');
    }

    try {
        $connection->beginTransaction();

        $idOrden = $data['id_orden_compra'];

        // Actualizar estado de la orden a 'comprada'
        $sql = "UPDATE ordenes_compra 
                SET estado = 'comprada', 
                    fecha_aprobacion = CURRENT_TIMESTAMP,
                    aprobado_por = 1
                WHERE id_orden_compra = ?";

        $stmt = $connection->prepare($sql);
        $stmt->execute([$idOrden]);

        // Obtener datos de la orden para crear la compra final
        $sql = "SELECT * FROM ordenes_compra WHERE id_orden_compra = ?";
        $stmt = $connection->prepare($sql);
        $stmt->execute([$idOrden]);
        $orden = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$orden) {
            throw new Exception('Orden de compra no encontrada');
        }

        // Crear compra final
        $sql = "INSERT INTO compras_finales 
                    (id_orden_compra, fecha_compra, monto_total, numero_factura, fecha_factura, idusuario) 
                VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, 1)";

        $stmt = $connection->prepare($sql);
        $stmt->execute([
            $idOrden,
            $orden['total'],
            $orden['numero_factura'] ?? 'N/A',
            $orden['fecha_factura'] ?? date('Y-m-d')
        ]);

        $connection->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Orden convertida en compra correctamente'
        ]);

    } catch (Exception $e) {
        $connection->rollBack();
        throw new Exception('Error al convertir orden en compra: ' . $e->getMessage());
    }
}

/**
 * Generar número de orden único
 */
function generarNumeroOrden($connection) {
    $año = date('Y');
    $sql = "SELECT COUNT(*) as count 
            FROM ordenes_compra 
            WHERE YEAR(fecha_orden) = ?";
    
    $stmt = $connection->prepare($sql);
    $stmt->execute([$año]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $secuencial = str_pad($result['count'] + 1, 4, '0', STR_PAD_LEFT);
    return "OC-{$año}-{$secuencial}";
}

/**
 * Obtener pedidos aprobados sin orden de compra
 */
function getPedidosSinOrden($connection) {
    try {
        // Contar pedidos aprobados sin orden de compra
        $sql = "SELECT COUNT(*) as total 
                FROM pedidos p 
                LEFT JOIN ordenes_compra oc ON p.id_pedido = oc.id_pedido 
                WHERE p.estado = 'aprobado' 
                GROUP BY p.id_pedido 
                HAVING COUNT(oc.id_orden_compra) = 0";
        
        $stmt = $connection->prepare($sql);
        $stmt->execute();
        $pedidosSinOrden = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $totalPedidos = count($pedidosSinOrden);
        
        if ($totalPedidos > 0) {
            // Obtener detalles de los pedidos
            $sqlDetalles = "SELECT p.id_pedido, p.fecha_pedido, p.total, 
                                    pr.nombre as nombre_proyecto, pres.id_presupuesto
                                FROM pedidos p
                                LEFT JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                                LEFT JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                                WHERE p.estado = 'aprobado'
                                AND p.id_pedido NOT IN (
                                    SELECT DISTINCT id_pedido FROM ordenes_compra
                                )
                                ORDER BY p.fecha_pedido DESC";
            
            $stmtDetalles = $connection->prepare($sqlDetalles);
            $stmtDetalles->execute();
            $detallesPedidos = $stmtDetalles->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'total' => $totalPedidos,
                'detalles' => $detallesPedidos ?? []
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
?>

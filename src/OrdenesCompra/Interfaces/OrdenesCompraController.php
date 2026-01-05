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

        case 'getProveedores':
            getProveedores($connection);
            break;

        case 'getPedidosDisponibles':
            getPedidosDisponibles($connection);
            break;

        case 'getProductosPedido':
            getProductosPedido($connection);
            break;

        case 'convertirEnCompra':
            convertirEnCompra($connection, $jsonInput);
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
                p.nombre as nombre_proveedor,
                oc.fecha_orden,
                oc.fecha_esperada,
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
            LEFT JOIN provedores p ON oc.id_provedor = p.id_provedor
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
                oc.*,
                p.nombre_proveedor
            FROM ordenes_compra oc
            LEFT JOIN provedores p ON oc.id_provedor = p.id_provedor
            WHERE oc.id_orden_compra = ?";

    $stmt = $connection->prepare($sql);
    $stmt->execute([$idOrden]);
    $orden = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$orden) {
        throw new Exception('Orden de compra no encontrada');
    }

    // Obtener productos de la orden
    $sql = "SELECT 
                ocd.descripcion,
                ocd.unidad,
                ocd.cantidad_comprada,
                ocd.precio_unitario,
                ocd.subtotal,
                ocd.cantidad_recibida,
                ocd.fecha_recepcion
            FROM ordenes_compra_detalle ocd
            WHERE ocd.id_orden_compra = ?";

    $stmt = $connection->prepare($sql);
    $stmt->execute([$idOrden]);
    $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orden['productos'] = $productos;

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
    $sql = "SELECT 
                p.id_pedido,
                p.fecha_pedido,
                p.total,
                p.estado,
                COALESCE(p.estado_compra, 'pendiente') as estado_compra,
                CONCAT('Pedido #', p.id_pedido, ' - Total: $', FORMAT(p.total, 2), ' - ', 
                       CASE 
                           WHEN COUNT(pd.id_det_pedido) > 0 THEN 
                               CONCAT(COUNT(DISTINCT CASE WHEN ocd.id_orden_detalle IS NULL OR ocd.cantidad_comprada < pd.cantidad THEN pd.id_det_pedido END), ' productos disponibles')
                           ELSE 'Sin productos disponibles'
                       END) as descripcion_pedido,
                COUNT(DISTINCT pd.id_det_pedido) as total_productos,
                COUNT(DISTINCT CASE WHEN ocd.id_orden_detalle IS NULL OR ocd.cantidad_comprada < pd.cantidad THEN pd.id_det_pedido END) as productos_disponibles
            FROM pedidos p
            LEFT JOIN pedidos_detalle pd ON p.id_pedido = pd.id_pedido
            LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
            WHERE p.estado = 'aprobado'
            GROUP BY p.id_pedido, p.fecha_pedido, p.total, p.estado, p.estado_compra
            HAVING productos_disponibles > 0
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
function getProductosPedido($connection) {
    $idPedido = (int)($_GET['id_pedido'] ?? 0);
    
    if (!$idPedido) {
        throw new Exception('ID de pedido requerido');
    }

    $sql = "SELECT 
                pd.id_det_pedido,
                CASE 
                    WHEN pd.tipo_componente = 'material' AND m.id_material IS NOT NULL THEN m.nombremat
                    WHEN pd.tipo_componente = 'item' AND i.id_item IS NOT NULL THEN i.nombre_item
                    WHEN pd.tipo_componente = 'material_extra' AND me.id_material IS NOT NULL THEN 
                        CONCAT('Material Extra #', me.id_material, ' (', m2.nombremat, ')')
                    ELSE CONCAT('Componente ', pd.tipo_componente, ' #', pd.id_componente)
                END as descripcion,
                CASE 
                    WHEN pd.tipo_componente = 'material' AND m.id_material IS NOT NULL THEN m.idunidad
                    WHEN pd.tipo_componente = 'item' AND i.id_item IS NOT NULL THEN i.unidad
                    WHEN pd.tipo_componente = 'material_extra' AND me.id_material IS NOT NULL THEN m2.idunidad
                    ELSE 'unidad'
                END as unidad,
                pd.cantidad,
                pd.precio_unitario,
                pd.subtotal,
                COALESCE(ocd.cantidad_comprada, 0) as cantidad_comprada,
                (pd.cantidad - COALESCE(ocd.cantidad_comprada, 0)) as cantidad_disponible,
                CASE 
                    WHEN COALESCE(ocd.cantidad_comprada, 0) >= pd.cantidad THEN 'comprado'
                    WHEN COALESCE(ocd.cantidad_comprada, 0) > 0 THEN 'parcialmente_comprado'
                    ELSE 'disponible'
                END as estado_producto,
                CASE 
                    WHEN COALESCE(ocd.cantidad_comprada, 0) >= pd.cantidad THEN 0
                    WHEN COALESCE(ocd.cantidad_comprada, 0) > 0 THEN (pd.cantidad - ocd.cantidad_comprada)
                    ELSE pd.cantidad
                END as cantidad_maxima_seleccionable
            FROM pedidos_detalle pd
            LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
            LEFT JOIN materiales m ON pd.tipo_componente = 'material' AND pd.id_componente = m.id_material
            LEFT JOIN items i ON pd.tipo_componente = 'item' AND pd.id_item = i.id_item
            LEFT JOIN materiales_extra_presupuesto me ON pd.tipo_componente = 'material_extra' AND pd.id_material_extra = me.id_material_extra
            LEFT JOIN materiales m2 ON pd.tipo_componente = 'material_extra' AND me.id_material = m2.id_material
            WHERE pd.id_pedido = ?
            AND (ocd.id_orden_detalle IS NULL OR ocd.cantidad_comprada < pd.cantidad)
            ORDER BY pd.tipo_componente, descripcion";

    $stmt = $connection->prepare($sql);
    $stmt->execute([$idPedido]);
    $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
?>

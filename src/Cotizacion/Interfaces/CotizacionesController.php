<?php
/**
 * CotizacionesController.php
 * Controlador para el componente de cotizaciones por presupuesto
 * Maneja componentes de presupuestos y gestión de cotizaciones por proveedor
 */

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../config/database.php';

header('Content-Type: application/json');

$db = new Database();
$connection = $db->getConnection();

// Crear tablas si no existen
_crearTablasCotizacionesIndependientes($connection);

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        
        /* ── Obtener componentes de un presupuesto ─────────────────── */
        case 'getComponentesPresupuesto':
            $idPresupuesto = (int)($_GET['id_presupuesto'] ?? 0);
            if (!$idPresupuesto) throw new Exception('ID de presupuesto requerido');
            
            $sql = "SELECT 
                        ic.id_componente,
                        ic.codigo_componente,
                        ic.descripcion,
                        ic.tipo_componente,
                        ic.unidad,
                        ic.precio_unitario,
                        COALESCE(SUM(pd.cantidad), 0) as cantidad,
                        COUNT(cc.id_cotizacion) as cotizaciones_count,
                        MIN(cc.precio_unitario) as precio_mejor
                    FROM item_componentes ic
                    LEFT JOIN presupuesto_detalle pd ON ic.id_componente = pd.id_componente 
                        AND pd.id_presupuesto = ?
                    LEFT JOIN cotizaciones_componentes cc ON ic.id_componente = cc.id_componente 
                        AND cc.estado = 'activa'
                    WHERE pd.id_presupuesto = ?
                    GROUP BY ic.id_componente
                    ORDER BY ic.descripcion
                     LIMIT 200";
            
            $stmt = $connection->prepare($sql);
            $stmt->execute([$idPresupuesto, $idPresupuesto]);
            $componentes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $componentes]);
            break;
            
        /* ── Obtener componente con cotizaciones para presupuesto ───────── */
        case 'getComponenteConCotizaciones':
            $idComponente = (int)($_GET['id_componente'] ?? 0);
            $idPresupuesto = (int)($_GET['id_presupuesto'] ?? 0);
            if (!$idComponente || !$idPresupuesto) throw new Exception('ID de componente y presupuesto requeridos');
            
            // Datos del componente
            $stmtComp = $connection->prepare(
                "SELECT ic.*, COALESCE(SUM(pd.cantidad), 0) as cantidad
                 FROM item_componentes ic
                 LEFT JOIN presupuesto_detalle pd ON ic.id_componente = pd.id_componente 
                    AND pd.id_presupuesto = ?
                 WHERE ic.id_componente = ?
                 GROUP BY ic.id_componente"
            );
            $stmtComp->execute([$idPresupuesto, $idComponente]);
            $componente = $stmtComp->fetch(PDO::FETCH_ASSOC);
            
            if (!$componente) throw new Exception('Componente no encontrado en este presupuesto');
            
            // Cotizaciones existentes para este componente y presupuesto
            $stmtCot = $connection->prepare(
                "SELECT cc.*, p.nombre as nombre_proveedor
                 FROM cotizaciones_componentes cc
                 LEFT JOIN provedores p ON cc.id_proveedor = p.id_provedor
                 WHERE cc.id_componente = ? AND cc.id_presupuesto = ?
                 ORDER BY cc.fecha_cotizacion DESC"
            );
            $stmtCot->execute([$idComponente, $idPresupuesto]);
            $cotizaciones = $stmtCot->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'componente' => $componente,
                    'cotizaciones' => $cotizaciones
                ]
            ]);
            break;
            
        /* ── Guardar nueva cotización ─────────────────────────────── */
        case 'guardarCotizacion':
            $idComponente = (int)($_POST['id_componente'] ?? 0);
            $idPresupuesto = (int)($_POST['id_presupuesto'] ?? 0);
            $idProveedor = (int)($_POST['id_proveedor'] ?? 0);
            $precioUnitario = (float)($_POST['precio_unitario'] ?? 0);
            $moneda = $_POST['moneda'] ?? 'USD';
            $tiempoEntrega = $_POST['tiempo_entrega'] ?? '';
            $observaciones = $_POST['observaciones'] ?? '';
            
            if (!$idComponente || !$idPresupuesto || !$idProveedor || $precioUnitario <= 0) {
                throw new Exception('Datos incompletos o inválidos');
            }
            
            // Obtener sesión del usuario
            if (session_status() === PHP_SESSION_NONE) session_start();
            $idUsuario = (int)($_SESSION['u_id'] ?? 1);
            
            // Insertar cotización
            $stmt = $connection->prepare(
                "INSERT INTO cotizaciones_componentes 
                 (id_componente, id_presupuesto, id_proveedor, precio_unitario, moneda, tiempo_entrega, 
                  observaciones, id_usuario, fecha_cotizacion, estado, fechareg)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'activa', NOW())"
            );
            $stmt->execute([
                $idComponente, $idPresupuesto, $idProveedor, $precioUnitario, $moneda, 
                $tiempoEntrega, $observaciones, $idUsuario
            ]);
            
            echo json_encode([
                'success' => true,
                'mensaje' => 'Cotización guardada correctamente'
            ]);
            break;
            
        /* ── Eliminar cotización ────────────────────────────────── */
        case 'eliminarCotizacion':
            $idCotizacion = (int)($_GET['id'] ?? 0);
            if (!$idCotizacion) throw new Exception('ID de cotización requerido');
            
            // Marcar como inactiva en lugar de eliminar físicamente
            $stmt = $connection->prepare(
                "UPDATE cotizaciones_componentes 
                 SET estado = 'inactiva', fechaupdate = NOW() 
                 WHERE id_cotizacion = ?"
            );
            $stmt->execute([$idCotizacion]);
            
            echo json_encode([
                'success' => true,
                'mensaje' => 'Cotización eliminada correctamente'
            ]);
            break;
            
        /* ── Exportar cotizaciones de un presupuesto ───────────────── */
        case 'exportarCotizacionesPresupuesto':
            $idPresupuesto = (int)($_GET['id_presupuesto'] ?? 0);
            if (!$idPresupuesto) throw new Exception('ID de presupuesto requerido');
            
            // Obtener información del presupuesto
            $stmtPres = $connection->prepare(
                "SELECT p.*, pr.nombre as nombre_proyecto
                 FROM presupuestos p
                 LEFT JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                 WHERE p.id_presupuesto = ?"
            );
            $stmtPres->execute([$idPresupuesto]);
            $presupuesto = $stmtPres->fetch(PDO::FETCH_ASSOC);
            
            if (!$presupuesto) throw new Exception('Presupuesto no encontrado');
            
            // Obtener componentes con sus cotizaciones
            $stmtComp = $connection->prepare(
                "SELECT 
                    ic.id_componente,
                    ic.codigo_componente,
                    ic.descripcion,
                    ic.tipo_componente,
                    ic.unidad,
                    COALESCE(SUM(pd.cantidad), 0) as cantidad,
                    GROUP_CONCAT(
                        CONCAT(cc.nombre_proveedor, ':', cc.precio_unitario, '(', cc.moneda, ')') 
                        ORDER BY cc.precio_unitario ASC
                        SEPARATOR ' | '
                    ) as cotizaciones_info
                 FROM item_componentes ic
                 LEFT JOIN presupuesto_detalle pd ON ic.id_componente = pd.id_componente 
                    AND pd.id_presupuesto = ?
                 LEFT JOIN cotizaciones_componentes cc ON ic.id_componente = cc.id_componente 
                    AND cc.id_presupuesto = ? AND cc.estado = 'activa'
                 WHERE pd.id_presupuesto = ?
                 GROUP BY ic.id_componente
                 ORDER BY ic.descripcion"
            );
            $stmtComp->execute([$idPresupuesto, $idPresupuesto, $idPresupuesto]);
            $componentes = $stmtComp->fetchAll(PDO::FETCH_ASSOC);
            
            // Generar CSV
            $filename = 'cotizaciones_presupuesto_' . $idPresupuesto . '_' . date('Ymd') . '.csv';
            
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            
            $output = fopen('php://output', 'w');
            
            // Cabecera CSV
            fputcsv($output, [
                'Código', 'Descripción', 'Tipo', 'Unidad', 'Cantidad', 'Cotizaciones'
            ], ';');
            
            // Datos
            foreach ($componentes as $componente) {
                fputcsv($output, [
                    $componente['codigo_componente'] ?? '',
                    $componente['descripcion'] ?? '',
                    $componente['tipo_componente'] ?? '',
                    $componente['unidad'] ?? '',
                    $componente['cantidad'] ?? 0,
                    $componente['cotizaciones_info'] ?? 'Sin cotizaciones'
                ], ';');
            }
            
            fclose($output);
            exit;
            
        /* ── Buscar componentes (mantener para compatibilidad) ─────────── */
        case 'buscarComponentes':
            $termino = $_POST['termino'] ?? '';
            $tipo = $_POST['tipo'] ?? '';
            
            $sql = "SELECT 
                        ic.id_componente,
                        ic.codigo_componente,
                        ic.descripcion,
                        ic.tipo_componente,
                        ic.unidad,
                        ic.precio_unitario,
                        COUNT(cc.id_cotizacion) as cotizaciones_count,
                        MIN(cc.precio_unitario) as precio_mejor
                    FROM item_componentes ic
                    LEFT JOIN cotizaciones_componentes cc ON ic.id_componente = cc.id_componente AND cc.estado = 'activa'
                    WHERE 1=1";
            
            $params = [];
            
            if (!empty($termino)) {
                $sql .= " AND (ic.codigo_componente LIKE ? OR ic.descripcion LIKE ?)";
                $params[] = "%{$termino}%";
                $params[] = "%{$termino}%";
            }
            
            if (!empty($tipo)) {
                $sql .= " AND ic.tipo_componente = ?";
                $params[] = $tipo;
            }
            
            $sql .= " GROUP BY ic.id_componente
                     ORDER BY ic.descripcion
                     LIMIT 50";
            
            $stmt = $connection->prepare($sql);
            $stmt->execute($params);
            $componentes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $componentes]);
            break;
            
        /* ── Obtener cotizaciones para órdenes de compra ─────────── */
        case 'getCotizacionesParaOrden':
            $idComponente = (int)($_GET['id_componente'] ?? 0);
            if (!$idComponente) throw new Exception('ID de componente requerido');
            
            $stmt = $connection->prepare(
                "SELECT cc.*, p.nombre as nombre_proveedor
                 FROM cotizaciones_componentes cc
                 LEFT JOIN provedores p ON cc.id_proveedor = p.id_provedor
                 WHERE cc.id_componente = ? AND cc.estado = 'activa'
                 ORDER BY cc.precio_unitario ASC"
            );
            $stmt->execute([$idComponente]);
            $cotizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $cotizaciones
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => "Acción '{$action}' no reconocida"]);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/* ── Crear tablas para cotizaciones independientes ─────────────────── */
function _crearTablasCotizacionesIndependientes(PDO $conn): void {
    // Tabla principal de cotizaciones por componente y presupuesto
    $conn->exec("
        CREATE TABLE IF NOT EXISTS cotizaciones_componentes (
            id_cotizacion      INT          NOT NULL AUTO_INCREMENT,
            id_componente      INT          NOT NULL,
            id_presupuesto     INT          NOT NULL,
            id_proveedor        INT          NOT NULL,
            precio_unitario    DECIMAL(15,4) NOT NULL DEFAULT 0,
            moneda             VARCHAR(10)  NOT NULL DEFAULT 'USD',
            tiempo_entrega     VARCHAR(100) NULL,
            observaciones       TEXT         NULL,
            id_usuario         INT          NOT NULL DEFAULT 1,
            fecha_cotizacion  DATE         NOT NULL,
            estado             ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
            fechareg           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fechaupdate        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id_cotizacion),
            INDEX idx_componente (id_componente),
            INDEX idx_presupuesto (id_presupuesto),
            INDEX idx_proveedor (id_proveedor),
            INDEX idx_estado (estado),
            INDEX idx_fecha (fecha_cotizacion),
            UNIQUE KEY unique_componente_proveedor (id_componente, id_presupuesto, id_proveedor, estado)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Asegurar que la tabla de componentes existe
    $conn->exec("
        CREATE TABLE IF NOT EXISTS item_componentes (
            id_componente      INT AUTO_INCREMENT PRIMARY KEY,
            codigo_componente   VARCHAR(50) NULL,
            descripcion         TEXT NOT NULL,
            tipo_componente    VARCHAR(50) NOT NULL DEFAULT 'material',
            unidad              VARCHAR(20) NOT NULL DEFAULT 'UND',
            precio_unitario     DECIMAL(15,4) NOT NULL DEFAULT 0,
            fechareg           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fechaupdate        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tipo (tipo_componente),
            INDEX idx_codigo (codigo_componente),
            INDEX idx_descripcion (descripcion(255))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Asegurar que la tabla de presupuesto_detalle existe
    $conn->exec("
        CREATE TABLE IF NOT EXISTS presupuesto_detalle (
            id_detalle          INT AUTO_INCREMENT PRIMARY KEY,
            id_presupuesto      INT NOT NULL,
            id_componente       INT NOT NULL,
            cantidad            DECIMAL(15,4) NOT NULL DEFAULT 0,
            precio_unitario     DECIMAL(15,4) NOT NULL DEFAULT 0,
            subtotal            DECIMAL(15,2) NOT NULL DEFAULT 0,
            fechareg            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fechaupdate         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_presupuesto (id_presupuesto),
            INDEX idx_componente (id_componente),
            UNIQUE KEY unique_presupuesto_componente (id_presupuesto, id_componente)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}
?>

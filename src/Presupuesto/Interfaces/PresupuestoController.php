<?php
namespace Src\Presupuesto\Interfaces;

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository;
use Src\Presupuesto\Application\CreatePresupuesto;
use Src\Presupuesto\Application\GetAllPresupuestos;
use Src\Presupuesto\Domain\Presupuesto;
use PhpOffice\PhpSpreadsheet\IOFactory;

$db = new \Database();
$connection = $db->getConnection();
$repo = new PresupuestoMySQLRepository($connection);

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

try {
    switch ($action) {

        case 'create':
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['id_proyecto']) || empty($data['fecha_creacion'])) {
                echo json_encode(['error' => 'id_proyecto y fecha_creacion son requeridos']);
                exit;
            }

            $monto_total = isset($data['monto_total']) ? (float)$data['monto_total'] : 0;

            $presupuesto = Presupuesto::crear(
                $data['id_proyecto'],
                $monto_total,
                $data['fecha_creacion']
            );

            $useCase = new CreatePresupuesto($repo);
            $resultado = $useCase->execute($presupuesto);

            echo json_encode([
                'success' => true,
                'message' => 'Presupuesto creado correctamente',
                'presupuesto' => $resultado->toArray()
            ]);
            break;

        case 'getAll':
            $useCase = new GetAllPresupuestos($repo);
            $presupuestos = $useCase->execute();

            echo json_encode([
                'success' => true,
                'data' => $presupuestos
            ]);
            break;

        case 'importPreview':
            try {
                if (!isset($_FILES['archivo_excel']) || $_FILES['archivo_excel']['error'] !== UPLOAD_ERR_OK) {
                    throw new \Exception('No se recibió el archivo Excel o hubo un error en la carga.');
                }

                $idProyectoSeleccionado = $_POST['id_proyecto'] ?? null;
                $idPresupuestoSeleccionado = $_POST['id_presupuesto'] ?? null;
                
                if (empty($idProyectoSeleccionado)) {
                    throw new \Exception('Proyecto no seleccionado.');
                }
                
                if (empty($idPresupuestoSeleccionado)) {
                    throw new \Exception('Presupuesto no seleccionado.');
                }

                $stmt = $connection->prepare("SELECT id_presupuesto FROM presupuestos WHERE id_presupuesto = ? AND id_proyecto = ?");
                $stmt->execute([$idPresupuestoSeleccionado, $idProyectoSeleccionado]);
                if (!$stmt->fetch()) {
                    throw new \Exception('El presupuesto seleccionado no pertenece al proyecto.');
                }

                $rutaTmp = $_FILES['archivo_excel']['tmp_name'];
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($rutaTmp);
                $hoja = $spreadsheet->getActiveSheet();
                $data = $hoja->toArray();

                $repository = new \Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository($connection);
                $filas = $repository->validateImportMasive($data, $idProyectoSeleccionado, $idPresupuestoSeleccionado);

                $totalFilas = count($filas);
                $filasValidas = count(array_filter($filas, fn($fila) => $fila['ok']));
                $filasConError = $totalFilas - $filasValidas;
                $valorTotal = array_sum(array_column($filas, 'valor_total'));

                echo json_encode([
                    'ok' => true,
                    'resumen' => [
                        'total_filas' => $totalFilas,
                        'filas_validas' => $filasValidas,
                        'filas_con_error' => $filasConError,
                        'valor_total' => $valorTotal
                    ],
                    'filas' => $filas,
                    'ids_seleccionados' => [
                        'proyecto' => $idProyectoSeleccionado,
                        'presupuesto' => $idPresupuestoSeleccionado
                    ]
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'ok' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getProyectos':
            try {
                $stmt = $connection->prepare("SELECT id_proyecto, nombre FROM proyectos ORDER BY nombre ASC");
                $stmt->execute();
                $proyectos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'data' => $proyectos
                ]);
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getMateriales':
            try {
                $repo = new PresupuestoMySQLRepository($connection);
                $materiales = $repo->getMaterialesConPrecios();

                echo json_encode([
                    'success' => true,
                    'data' => $materiales
                ]);
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getMultiplicadores':
            try {
                $sql = "SELECT desccostoind, porcentaje, tipo_costo, costoiva 
                        FROM costos_ind 
                        WHERE id_estado = 1 
                        ORDER BY idcostosind";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $multiplicadores = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $multiplicadores
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => "Error al cargar multiplicadores: " . $e->getMessage()
                ]);
            }
            break;

        case 'guardarPresupuestos':
            try {
                $presupuestosData = json_decode($_POST['presupuestos'], true);
                $idPresupuesto = $_POST['id_presupuesto'] ?? null;
                
                error_log("=== DEBUG guardarPresupuestos ===");
                error_log("ID Presupuesto recibido: " . $idPresupuesto);
                error_log("Total items recibidos: " . count($presupuestosData));
                
                if (empty($presupuestosData)) {
                    throw new \Exception('No se recibieron datos de presupuestos');
                }

                if (empty($idPresupuesto)) {
                    throw new \Exception('No se especificó el presupuesto destino');
                }

                $repository = new \Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository($connection);
                $resultado = $repository->guardarPresupuestosMasive($presupuestosData, $idPresupuesto);

                echo json_encode([
                    'ok' => true,
                    'mensaje' => 'Presupuestos guardados correctamente',
                    'total_filas' => count($presupuestosData),
                    'id_presupuesto' => $idPresupuesto
                ]);
                
            } catch (\Exception $e) {
                error_log("ERROR en guardarPresupuestos: " . $e->getMessage());
                echo json_encode([
                    'ok' => false,
                    'mensaje' => 'Error al guardar: ' . $e->getMessage()
                ]);
            }
            break;

        case 'getPresupuestosByProyecto':
            try {
                $proyectoId = $_POST['proyecto_id'] ?? $_GET['proyecto_id'] ?? null;
                
                error_log("=== DEBUG getPresupuestosByProyecto ===");
                error_log("Proyecto ID: " . $proyectoId);
                error_log("POST: " . print_r($_POST, true));
                error_log("GET: " . print_r($_GET, true));
                
                if (!$proyectoId || !is_numeric($proyectoId)) {
                    throw new \Exception('ID de proyecto inválido o no proporcionado. Recibido: ' . $proyectoId);
                }

                $query = "SELECT 
                            p.id_presupuesto,
                            p.id_proyecto,
                            p.fecha_creacion,
                            p.monto_total,
                            p.observaciones,
                            pr.nombre AS nombre_proyecto
                        FROM presupuestos p
                        INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                        WHERE p.id_proyecto = :proyecto_id 
                        AND p.idestado = 1
                        ORDER BY p.fecha_creacion DESC";

                $stmt = $connection->prepare($query);
                $stmt->execute(['proyecto_id' => (int)$proyectoId]);
                $presupuestos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                error_log("Presupuestos encontrados: " . count($presupuestos));
                
                echo json_encode([
                    'success' => true,
                    'data' => $presupuestos,
                    'debug' => [
                        'proyecto_id' => $proyectoId,
                        'total_presupuestos' => count($presupuestos)
                    ]
                ]);
                
            } catch (\Exception $e) {
                error_log("ERROR en getPresupuestosByProyecto: " . $e->getMessage());
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage(),
                    'debug' => [
                        'proyecto_id_recibido' => $proyectoId ?? 'null'
                    ]
                ]);
            }
            break;

        case 'getCapitulosByPresupuesto':
            try {
                $idPresupuesto = $_POST['id_presupuesto'] ?? null;
                
                if (!$idPresupuesto || !is_numeric($idPresupuesto)) {
                    throw new \Exception('ID de presupuesto inválido');
                }

                $query = "SELECT id_capitulo, nombre_cap 
                        FROM capitulos 
                        WHERE id_presupuesto = :id_presupuesto 
                        AND estado = 1
                        ORDER BY id_capitulo ASC";
                        
                $stmt = $connection->prepare($query);
                $stmt->execute(['id_presupuesto' => (int)$idPresupuesto]);
                $capitulos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'data' => $capitulos
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getMaterialesByPresupuesto':
            try {
                $presupuestoId = $_POST['presupuesto_id'] ?? null;
                $capituloId = $_POST['capitulo_id'] ?? null;
                
                if (!$presupuestoId) {
                    throw new \Exception('ID de presupuesto requerido');
                }
                
                // Consulta para obtener materiales del presupuesto
                $sql = "SELECT 
                            m.cod_material,
                            m.nombre_material,
                            c.id_capitulo,
                            c.nombre_capitulo,
                            u.unidesc as unidad,
                            dp.cantidad,
                            dp.precio_unitario as precio,
                            COALESCE(ped.cantidad_pedida, 0) as pedido,
                            m.id_tipo_material,
                            m.id_material,
                            dp.id_det_presupuesto,
                            (dp.cantidad - COALESCE(ped.cantidad_pedida, 0)) as disponible
                        FROM detalle_presupuesto dp
                        INNER JOIN materiales m ON dp.id_material = m.id_material
                        INNER JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                        INNER JOIN unidades u ON m.idunidad = u.idunidad
                        LEFT JOIN (
                            SELECT id_det_presupuesto, SUM(cantidad) as cantidad_pedida
                            FROM pedidos_detalle 
                            WHERE idestado = 1
                            GROUP BY id_det_presupuesto
                        ) ped ON dp.id_det_presupuesto = ped.id_det_presupuesto
                        WHERE dp.id_presupuesto = ?";
                
                $params = [$presupuestoId];
                
                if ($capituloId) {
                    $sql .= " AND dp.id_capitulo = ?";
                    $params[] = $capituloId;
                }
                
                $sql .= " ORDER BY c.id_capitulo, m.cod_material";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute($params);
                $materiales = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $materiales
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false, 
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getPresupuestosCompletos':
            try {
                $sql = "SELECT 
                            p.id_presupuesto,
                            p.nombre as nombre_presupuesto,
                            pr.id_proyecto,
                            pr.nombre as nombre_proyecto,
                            p.monto_total as valor_total,
                            p.fecha_creacion,
                            p.estado,
                            COUNT(DISTINCT dp.id_capitulo) as total_capitulos,
                            COUNT(dp.id_det_presupuesto) as total_materiales,
                            COALESCE(SUM(ped.cantidad * dp.precio_unitario), 0) as utilizado
                        FROM presupuestos p
                        INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                        LEFT JOIN detalle_presupuesto dp ON p.id_presupuesto = dp.id_presupuesto
                        LEFT JOIN pedidos_detalle ped ON dp.id_det_presupuesto = ped.id_det_presupuesto AND ped.idestado = 1
                        WHERE p.idestado = 1
                        GROUP BY p.id_presupuesto, p.nombre, pr.nombre, p.monto_total, p.fecha_creacion, p.estado
                        ORDER BY p.fecha_creacion DESC";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $presupuestos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $presupuestos
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getDetallesCompletosPresupuesto':
            try {
                $presupuestoId = $_GET['id'] ?? null;
                
                if (!$presupuestoId) {
                    throw new \Exception('ID de presupuesto requerido');
                }
                
                // Obtener información básica del presupuesto
                $sqlPresupuesto = "SELECT 
                                    p.id_presupuesto,
                                    p.nombre as nombre_presupuesto,
                                    pr.nombre as nombre_proyecto,
                                    p.monto_total as valor_total
                                FROM presupuestos p
                                INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                                WHERE p.id_presupuesto = ?";
                
                $stmt = $connection->prepare($sqlPresupuesto);
                $stmt->execute([$presupuestoId]);
                $presupuesto = $stmt->fetch(\PDO::FETCH_ASSOC);
                
                if (!$presupuesto) {
                    throw new \Exception('Presupuesto no encontrado');
                }
                
                // Obtener capítulos y materiales
                $sqlCapitulos = "SELECT 
                                    c.id_capitulo,
                                    c.nombre_cap,
                                    SUM(dp.cantidad * dp.precio_unitario) as subtotal
                                FROM capitulos c
                                INNER JOIN detalle_presupuesto dp ON c.id_capitulo = dp.id_capitulo
                                WHERE dp.id_presupuesto = ?
                                GROUP BY c.id_capitulo, c.nombre_cap
                                ORDER BY c.id_capitulo";
                
                $stmt = $connection->prepare($sqlCapitulos);
                $stmt->execute([$presupuestoId]);
                $capitulos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                // Obtener materiales por capítulo
                foreach ($capitulos as &$capitulo) {
                    $sqlMateriales = "SELECT 
                                        m.cod_material,
                                        m.nombre_material,
                                        u.unidesc as unidad,
                                        dp.cantidad,
                                        dp.precio_unitario,
                                        (dp.cantidad * dp.precio_unitario) as total
                                    FROM detalle_presupuesto dp
                                    INNER JOIN materiales m ON dp.id_material = m.id_material
                                    INNER JOIN unidades u ON m.idunidad = u.idunidad
                                    WHERE dp.id_presupuesto = ? AND dp.id_capitulo = ?
                                    ORDER BY m.cod_material";
                    
                    $stmt = $connection->prepare($sqlMateriales);
                    $stmt->execute([$presupuestoId, $capitulo['id_capitulo']]);
                    $capitulo['materiales'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                }
                
                // Calcular totales y porcentajes (simulados - ajusta según tu lógica de negocio)
                $subtotal = array_sum(array_column($capitulos, 'subtotal'));
                $porcentajeAdministracion = 21; // Ejemplo
                $porcentajeImprevistos = 1;     // Ejemplo
                $porcentajeUtilidad = 8;        // Ejemplo
                $porcentajeIVA = 19;            // Ejemplo
                
                $administracion = $subtotal * ($porcentajeAdministracion / 100);
                $imprevistos = $subtotal * ($porcentajeImprevistos / 100);
                $utilidad = $subtotal * ($porcentajeUtilidad / 100);
                $subtotalAjustado = $subtotal + $administracion + $imprevistos + $utilidad;
                $iva = $subtotalAjustado * ($porcentajeIVA / 100);
                $totalPresupuesto = $subtotalAjustado + $iva;
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'presupuesto' => $presupuesto,
                        'capitulos' => $capitulos,
                        'totales' => [
                            'subtotal' => $subtotal,
                            'administracion' => $administracion,
                            'porcentaje_administracion' => $porcentajeAdministracion,
                            'imprevistos' => $imprevistos,
                            'porcentaje_imprevistos' => $porcentajeImprevistos,
                            'utilidad' => $utilidad,
                            'porcentaje_utilidad' => $porcentajeUtilidad,
                            'iva' => $iva,
                            'porcentaje_iva' => $porcentajeIVA,
                            'total_presupuesto' => $totalPresupuesto
                        ]
                    ]
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getUnidades':
            try {
                $sql = "SELECT idunidad, unidesc FROM unidades WHERE idestado = 1 ORDER BY unidesc";
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $unidades = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $unidades
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getTiposMaterial':
            try {
                $sql = "SELECT id_tipo_material, desc_tipo FROM tipos_material WHERE idestado = 1 ORDER BY desc_tipo";
                $stmt = $connection->prepare($sql);
                $stmt->execute();
                $tipos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $tipos
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'guardarPedido':
            try {
                $pedidoData = json_decode($_POST['pedido_data'], true);
                
                if (!$pedidoData) {
                    throw new \Exception('Datos del pedido no válidos');
                }
                
                // Iniciar transacción
                $connection->beginTransaction();
                
                try {
                    // 1. Crear el pedido principal
                    $sqlPedido = "INSERT INTO pedidos (id_presupuesto, fecha_pedido, estado, total) 
                                 VALUES (?, NOW(), 'pendiente', ?)";
                    $stmt = $connection->prepare($sqlPedido);
                    $stmt->execute([
                        $pedidoData['seleccionActual']['datos']['presupuestoId'],
                        $pedidoData['total'] ?? 0
                    ]);
                    
                    $idPedido = $connection->lastInsertId();
                    
                    // 2. Guardar detalles del pedido
                    $sqlDetalle = "INSERT INTO pedidos_detalle 
                                  (id_pedido, id_det_presupuesto, cantidad, precio_unitario, subtotal) 
                                  VALUES (?, ?, ?, ?, ?)";
                    $stmtDetalle = $connection->prepare($sqlDetalle);
                    
                    foreach ($pedidoData['materiales'] as $material) {
                        if ($material['pedido'] > 0) {
                            $stmtDetalle->execute([
                                $idPedido,
                                $material['id_det_presupuesto'],
                                $material['pedido'],
                                $material['precio'],
                                $material['pedido'] * $material['precio']
                            ]);
                        }
                    }
                    
                    // 3. Guardar materiales extra si existen
                    if (!empty($pedidoData['materialesExtra'])) {
                        $sqlExtra = "INSERT INTO materiales_extra 
                                    (id_pedido, codigo, descripcion, cantidad, unidad, precio, justificacion, estado) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";
                        $stmtExtra = $connection->prepare($sqlExtra);
                        
                        foreach ($pedidoData['materialesExtra'] as $extra) {
                            $stmtExtra->execute([
                                $idPedido,
                                $extra['codigo'],
                                $extra['descripcion'],
                                $extra['cantidad'],
                                $extra['unidad'],
                                $extra['precio'],
                                $extra['justificacion']
                            ]);
                        }
                    }
                    
                    // Confirmar transacción
                    $connection->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Pedido guardado correctamente',
                        'id_pedido' => $idPedido
                    ]);
                    
                } catch (\Exception $e) {
                    // Revertir transacción en caso de error
                    $connection->rollBack();
                    throw $e;
                }
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getPedidosByPresupuesto':
            try {
                $presupuestoId = $_POST['presupuesto_id'] ?? null;
                
                if (!$presupuestoId) {
                    throw new \Exception('ID de presupuesto requerido');
                }
                
                $sql = "SELECT 
                            p.id_pedido,
                            p.fecha_pedido,
                            p.estado,
                            p.total,
                            COUNT(pd.id_det_pedido) as total_items
                        FROM pedidos p
                        LEFT JOIN pedidos_detalle pd ON p.id_pedido = pd.id_pedido
                        WHERE p.id_presupuesto = ?
                        GROUP BY p.id_pedido, p.fecha_pedido, p.estado, p.total
                        ORDER BY p.fecha_pedido DESC";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute([$presupuestoId]);
                $pedidos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $pedidos
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        // ... (tus casos existentes se mantienen) ...

        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'create' => 'Crear nuevo presupuesto',
                    'getAll' => 'Listar todos los presupuestos',
                    'importPreview' => 'Leer archivo Excel y devolver vista previa',
                    'getProyectos' => 'Obtener lista de proyectos',
                    'getMateriales' => 'Obtener lista de materiales',
                    'getMultiplicadores' => 'Obtener porcentajes de costos indirectos',
                    'guardarPresupuestos' => 'Guardar presupuestos en base de datos',
                    'getMaterialesByPresupuesto' => 'Obtener materiales por presupuesto',
                    'getPresupuestosCompletos' => 'Obtener presupuestos con estadísticas',
                    'getDetallesCompletosPresupuesto' => 'Obtener detalles completos de presupuesto',
                    'getUnidades' => 'Obtener lista de unidades de medida',
                    'getTiposMaterial' => 'Obtener tipos de material',
                    'guardarPedido' => 'Guardar pedido en base de datos',
                    'getPedidosByPresupuesto' => 'Obtener pedidos por presupuesto'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;
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
                // 🔴 AGREGAR CONTROL DE SESIÓN PARA IDENTIFICAR LA IMPORTACIÓN
                session_start();
                
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

                // 🔴 GUARDAR DATOS DE LA IMPORTACIÓN EN SESIÓN PARA EVITAR DUPLICADOS
                $_SESSION['last_import_data'] = [
                    'proyecto' => $idProyectoSeleccionado,
                    'presupuesto' => $idPresupuestoSeleccionado,
                    'filas_hash' => md5(json_encode($filas)),
                    'timestamp' => time()
                ];

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
                $stmt = $connection->prepare("SELECT id_proyecto, nombre FROM proyectos WHERE estado = 1 ORDER BY nombre ASC");
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
                // 🔴 VERIFICAR QUE HAY UNA IMPORTACIÓN VÁLIDA EN SESIÓN
                session_start();
                
                if (!isset($_SESSION['last_import_data'])) {
                    throw new \Exception('No hay datos de importación válidos. Realice primero la vista previa.');
                }
                
                $lastImport = $_SESSION['last_import_data'];
                
                // Verificar que no sea una importación muy antigua (más de 30 minutos)
                if (time() - $lastImport['timestamp'] > 1800) {
                    unset($_SESSION['last_import_data']);
                    throw new \Exception('La sesión de importación ha expirado. Realice la vista previa nuevamente.');
                }

                $presupuestosData = json_decode($_POST['presupuestos'], true);
                $idPresupuesto = $_POST['id_presupuesto'] ?? null;
                
                error_log("=== DEBUG guardarPresupuestos ===");
                error_log("ID Presupuesto recibido: " . $idPresupuesto);
                error_log("Total items recibidos: " . count($presupuestosData));
                
                // 🔴 VERIFICAR QUE COINCIDA CON LA IMPORTACIÓN ACTUAL
                if ($idPresupuesto != $lastImport['presupuesto']) {
                    throw new \Exception('El presupuesto no coincide con la importación actual.');
                }
                
                if (empty($presupuestosData)) {
                    throw new \Exception('No se recibieron datos de presupuestos');
                }

                if (empty($idPresupuesto)) {
                    throw new \Exception('No se especificó el presupuesto destino');
                }

                $repository = new \Src\Presupuesto\Infrastructure\PresupuestoMySQLRepository($connection);
                $resultado = $repository->guardarPresupuestosMasive($presupuestosData, $idPresupuesto);

                // 🔴 LIMPIAR SESIÓN DESPUÉS DE GUARDAR EXITOSAMENTE
                unset($_SESSION['last_import_data']);

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

                // 🔴 IMPORTANTE: Usar la nueva función que ordena por fecha y agrega números ordinales
                $repository = new PresupuestoMySQLRepository($connection);
                $capitulos = $repository->getCapitulosOrdenadosPorPresupuesto((int)$idPresupuesto);

                echo json_encode([
                    'success' => true,
                    'data' => $capitulos,
                    'debug' => [
                        'total_capitulos' => count($capitulos),
                        'id_presupuesto' => $idPresupuesto
                    ]
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
                
                // Consulta corregida para usar tu estructura real de tablas
                $sql = "SELECT 
                            m.cod_material,
                            CAST(m.nombremat AS CHAR) AS nombre_material,
                            c.id_capitulo,
                            c.nombre_cap,
                            u.unidesc as unidad,
                            dp.cantidad,
                            mp.valor AS precio,
                            m.id_tipo_material,
                            m.id_material,
                            dp.id_det_presupuesto
                        FROM det_presupuesto dp
                        INNER JOIN materiales m ON dp.id_material = m.id_material
                        INNER JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                        INNER JOIN material_precio mp ON dp.id_mat_precio = mp.id_mat_precio
                        INNER JOIN gr_unidad u ON m.idunidad = u.idunidad
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
                            p.id_proyecto,
                            pr.nombre as nombre_proyecto,
                            p.monto_total as valor_total,
                            p.fecha_creacion,
                            p.idestado as estado,
                            COUNT(DISTINCT c.id_capitulo) as total_capitulos,
                            COUNT(dp.id_det_presupuesto) as total_materiales
                        FROM presupuestos p
                        INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                        LEFT JOIN capitulos c ON p.id_presupuesto = c.id_presupuesto AND c.estado = 1
                        LEFT JOIN det_presupuesto dp ON p.id_presupuesto = dp.id_presupuesto AND dp.idestado = 1
                        WHERE p.idestado = 1
                        GROUP BY p.id_presupuesto, p.id_proyecto, pr.nombre, p.monto_total, p.fecha_creacion, p.idestado
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
                                    p.id_proyecto,
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
                                    SUM(dp.cantidad * mp.valor) as subtotal
                                FROM capitulos c
                                INNER JOIN det_presupuesto dp ON c.id_capitulo = dp.id_capitulo
                                INNER JOIN material_precio mp ON dp.id_mat_precio = mp.id_mat_precio
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
                                        CAST(m.nombremat AS CHAR) AS nombre_material,
                                        u.unidesc as unidad,
                                        dp.cantidad,
                                        mp.valor as precio_unitario,
                                        (dp.cantidad * mp.valor) as total
                                    FROM det_presupuesto dp
                                    INNER JOIN materiales m ON dp.id_material = m.id_material
                                    INNER JOIN material_precio mp ON dp.id_mat_precio = mp.id_mat_precio
                                    INNER JOIN gr_unidad u ON m.idunidad = u.idunidad
                                    WHERE dp.id_presupuesto = ? AND dp.id_capitulo = ?
                                    ORDER BY m.cod_material";
                    
                    $stmt = $connection->prepare($sqlMateriales);
                    $stmt->execute([$presupuestoId, $capitulo['id_capitulo']]);
                    $capitulo['materiales'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                }
                
                // Calcular totales usando multiplicadores reales
                $subtotal = array_sum(array_column($capitulos, 'subtotal'));
                
                // Obtener multiplicadores reales de la base de datos
                $sqlMultiplicadores = "SELECT desccostoind, porcentaje FROM costos_ind WHERE id_estado = 1";
                $stmt = $connection->prepare($sqlMultiplicadores);
                $stmt->execute();
                $multiplicadoresData = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                $multiplicadores = [];
                foreach ($multiplicadoresData as $mult) {
                    $multiplicadores[strtolower($mult['desccostoind'])] = (float)$mult['porcentaje'] / 100;
                }
                
                $administracion = $subtotal * ($multiplicadores['administración'] ?? 0.21);
                $imprevistos = $subtotal * ($multiplicadores['imprevistos'] ?? 0.01);
                $utilidad = $subtotal * ($multiplicadores['utilidad'] ?? 0.08);
                $subtotalAjustado = $subtotal + $administracion + $imprevistos + $utilidad;
                $iva = $subtotalAjustado * ($multiplicadores['iva'] ?? 0.19);
                $totalPresupuesto = $subtotalAjustado + $iva;
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'presupuesto' => $presupuesto,
                        'capitulos' => $capitulos,
                        'totales' => [
                            'subtotal' => $subtotal,
                            'administracion' => $administracion,
                            'porcentaje_administracion' => ($multiplicadores['administración'] ?? 0.21) * 100,
                            'imprevistos' => $imprevistos,
                            'porcentaje_imprevistos' => ($multiplicadores['imprevistos'] ?? 0.01) * 100,
                            'utilidad' => $utilidad,
                            'porcentaje_utilidad' => ($multiplicadores['utilidad'] ?? 0.08) * 100,
                            'iva' => $iva,
                            'porcentaje_iva' => ($multiplicadores['iva'] ?? 0.19) * 100,
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
                $sql = "SELECT idunidad, unidesc FROM gr_unidad WHERE id_estado = 1 ORDER BY unidesc";
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
                $sql = "SELECT id_tipo_material, desc_tipo FROM tipo_material WHERE estado = 1 ORDER BY desc_tipo";
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
                    // 1. Crear el pedido principal (ajusta según tu estructura real)
                    $sqlPedido = "INSERT INTO pedidos (id_presupuesto, fecha_pedido, estado, total) 
                                 VALUES (?, NOW(), 'pendiente', ?)";
                    $stmt = $connection->prepare($sqlPedido);
                    $stmt->execute([
                        $pedidoData['presupuestoId'] ?? 0,
                        $pedidoData['total'] ?? 0
                    ]);
                    
                    $idPedido = $connection->lastInsertId();
                    
                    // 2. Guardar detalles del pedido (ajusta según tu estructura)
                    $sqlDetalle = "INSERT INTO pedidos_detalle 
                                  (id_pedido, id_det_presupuesto, cantidad, precio_unitario, subtotal) 
                                  VALUES (?, ?, ?, ?, ?)";
                    $stmtDetalle = $connection->prepare($sqlDetalle);
                    
                    foreach ($pedidoData['materiales'] ?? [] as $material) {
                        if ($material['pedido'] > 0) {
                            $stmtDetalle->execute([
                                $idPedido,
                                $material['id_det_presupuesto'] ?? 0,
                                $material['pedido'] ?? 0,
                                $material['precio'] ?? 0,
                                ($material['pedido'] ?? 0) * ($material['precio'] ?? 0)
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


        case 'getItemDetails':
            try {
                $idItem = $_GET['id_item'] ?? null;

                if (!$idItem) {
                    throw new \Exception('ID de ítem requerido');
                }

                // Información general del ítem
                $sqlItem = "SELECT
                                i.id_item,
                                i.codigo_item,
                                i.nombre_item,
                                i.unidad,
                                i.descripcion,
                                i.precio_unitario,
                                'apu' as tipo
                            FROM items i
                            WHERE i.id_item = ? AND i.idestado = 1
                            LIMIT 1";
                
                $stmt = $connection->prepare($sqlItem);
                $stmt->execute([$idItem]);
                $item = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!$item) {
                    throw new \Exception('Ítem no encontrado');
                }

                // Obtener componentes del ítem
                $sqlComponentes = "SELECT
                                    ic.id_componente,
                                    ic.tipo_componente,
                                    ic.descripcion,
                                    ic.unidad,
                                    ic.cantidad,
                                    ic.precio_unitario,
                                    (ic.cantidad * ic.precio_unitario) as subtotal,
                                    m.cod_material,
                                    CAST(m.nombremat AS CHAR) AS nombre_material,
                                    u.unidesc as unidad_material
                                FROM item_componentes ic
                                LEFT JOIN materiales m ON ic.id_material = m.id_material
                                LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
                                WHERE ic.id_item = ? AND ic.idestado = 1
                                ORDER BY 
                                    FIELD(ic.tipo_componente, 'material', 'mano_obra', 'equipo', 'transporte', 'otro'),
                                    ic.id_componente";
                
                $stmt = $connection->prepare($sqlComponentes);
                $stmt->execute([$idItem]);
                $componentes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                // Calcular totales por tipo
                $totales = [
                    'material' => 0,
                    'mano_obra' => 0,
                    'equipo' => 0,
                    'transporte' => 0,
                    'otro' => 0
                ];

                foreach ($componentes as $comp) {
                    $tipo = $comp['tipo_componente'];
                    $subtotal = (float)$comp['subtotal'];
                    
                    if (isset($totales[$tipo])) {
                        $totales[$tipo] += $subtotal;
                    } else {
                        $totales['otro'] += $subtotal;
                    }
                }

                $totalGeneral = array_sum($totales);

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'item' => $item,
                        'componentes' => $componentes,
                        'totales' => $totales,
                        'total_general' => $totalGeneral
                    ]
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getItemDetailsByCode':
            try {
                $codigoMaterial = $_GET['codigo_material'] ?? null;

                if (!$codigoMaterial) {
                    throw new \Exception('Código de material requerido');
                }

                // Buscar el ítem por código de material
                $sqlItem = "SELECT
                                i.id_item,
                                i.codigo_item,
                                i.nombre_item,
                                i.unidad,
                                i.descripcion,
                                i.precio_unitario,
                                'apu' as tipo
                            FROM items i
                            WHERE i.codigo_item = ? AND i.idestado = 1
                            LIMIT 1";
                
                $stmt = $connection->prepare($sqlItem);
                $stmt->execute([$codigoMaterial]);
                $item = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!$item) {
                    throw new \Exception('Ítem no encontrado con código: ' . $codigoMaterial);
                }

                $idItem = $item['id_item'];

                // Obtener componentes del ítem organizados por tipo
                $sqlComponentes = "SELECT
                                    ic.id_componente,
                                    ic.tipo_componente,
                                    ic.descripcion,
                                    ic.unidad,
                                    ic.cantidad,
                                    ic.precio_unitario,
                                    (ic.cantidad * ic.precio_unitario) as subtotal,
                                    m.cod_material,
                                    CAST(m.nombremat AS CHAR) AS nombre_material,
                                    u.unidesc as unidad_material,
                                    tm.desc_tipo as tipo_material_desc
                                FROM item_componentes ic
                                LEFT JOIN materiales m ON ic.id_material = m.id_material
                                LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
                                LEFT JOIN tipo_material tm ON m.id_tipo_material = tm.id_tipo_material
                                WHERE ic.id_item = ? AND ic.idestado = 1
                                ORDER BY 
                                    FIELD(ic.tipo_componente, 'material', 'mano_obra', 'equipo', 'transporte', 'otro'),
                                    ic.id_componente";
                
                $stmt = $connection->prepare($sqlComponentes);
                $stmt->execute([$idItem]);
                $componentes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                // Calcular totales por tipo de componente
                $totalesPorTipo = [
                    'material' => ['total' => 0, 'items' => []],
                    'mano_obra' => ['total' => 0, 'items' => []],
                    'equipo' => ['total' => 0, 'items' => []],
                    'transporte' => ['total' => 0, 'items' => []],
                    'otro' => ['total' => 0, 'items' => []]
                ];

                // Organizar componentes por tipo y calcular subtotales
                foreach ($componentes as $comp) {
                    $tipo = $comp['tipo_componente'];
                    $subtotal = (float)$comp['subtotal'];
                    
                    if (isset($totalesPorTipo[$tipo])) {
                        $totalesPorTipo[$tipo]['total'] += $subtotal;
                        $totalesPorTipo[$tipo]['items'][] = $comp;
                    } else {
                        $totalesPorTipo['otro']['total'] += $subtotal;
                        $totalesPorTipo['otro']['items'][] = $comp;
                    }
                }

                // Calcular total general
                $totalGeneral = array_sum(array_column(array_column($totalesPorTipo, 'total'), 'total'));

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'item' => $item,
                        'componentes_organizados' => $totalesPorTipo,
                        'componentes_lista' => $componentes, // Lista plana por si la necesitas
                        'total_general' => $totalGeneral,
                        'resumen_totales' => [
                            'material' => $totalesPorTipo['material']['total'],
                            'mano_obra' => $totalesPorTipo['mano_obra']['total'],
                            'equipo' => $totalesPorTipo['equipo']['total'],
                            'transporte' => $totalesPorTipo['transporte']['total'],
                            'otro' => $totalesPorTipo['otro']['total']
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

    case 'getItemsByPresupuesto':
        try {
            $presupuestoId = $_POST['presupuesto_id'] ?? null;
            $capituloId = $_POST['capitulo_id'] ?? null;
            
            if (!$presupuestoId) {
                throw new \Exception('ID de presupuesto requerido');
            }
            
            // Consulta para obtener ITEMS del presupuesto con sus componentes
            $sql = "SELECT 
                        dp.id_det_presupuesto,
                        i.id_item,
                        i.codigo_item,
                        i.nombre_item,
                        i.unidad,
                        i.precio_unitario,
                        dp.cantidad,
                        c.id_capitulo,
                        c.nombre_cap,
                        (dp.cantidad * i.precio_unitario) as subtotal,
                        dp.cantidad as disponible
                    FROM det_presupuesto dp
                    INNER JOIN items i ON dp.id_item = i.id_item
                    INNER JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                    WHERE dp.id_presupuesto = ? 
                    AND dp.idestado = 1";
            
            $params = [$presupuestoId];
            
            if ($capituloId) {
                $sql .= " AND dp.id_capitulo = ?";
                $params[] = $capituloId;
            }
            
            $sql .= " ORDER BY c.id_capitulo, i.codigo_item";
            
            $stmt = $connection->prepare($sql);
            $stmt->execute($params);
            $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Para cada item, obtener sus componentes
            foreach ($items as &$item) {
                $sqlComponentes = "SELECT 
                                    ic.id_componente,
                                    ic.tipo_componente,
                                    ic.descripcion,
                                    ic.unidad,
                                    ic.cantidad,
                                    ic.precio_unitario,
                                    (ic.cantidad * ic.precio_unitario) as subtotal,
                                    m.cod_material,
                                    CAST(m.nombremat AS CHAR) AS nombre_material,
                                    tm.desc_tipo as tipo_material_desc
                                FROM item_componentes ic
                                LEFT JOIN materiales m ON ic.id_material = m.id_material
                                LEFT JOIN tipo_material tm ON m.id_tipo_material = tm.id_tipo_material
                                WHERE ic.id_item = ? AND ic.idestado = 1
                                ORDER BY FIELD(ic.tipo_componente, 'material', 'mano_obra', 'equipo', 'transporte', 'otro')";
                
                $stmtComp = $connection->prepare($sqlComponentes);
                $stmtComp->execute([$item['id_item']]);
                $item['componentes'] = $stmtComp->fetchAll(\PDO::FETCH_ASSOC);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $items
            ]);
            
        } catch (\Exception $e) {
            echo json_encode([
                'success' => false, 
                'error' => $e->getMessage()
            ]);
        }
        break;

    case 'getItemsByPresupuesto':
        try {
            $presupuestoId = $_POST['presupuesto_id'] ?? null;
            $capituloId = $_POST['capitulo_id'] ?? null;
            
            if (!$presupuestoId) {
                throw new \Exception('ID de presupuesto requerido');
            }
            
            $sql = "SELECT 
                        dp.id_det_presupuesto,
                        i.id_item,
                        i.codigo_item,
                        i.nombre_item,
                        i.unidad,
                        i.precio_unitario,
                        dp.cantidad,
                        c.id_capitulo,
                        c.nombre_cap AS nombre_capitulo,
                        (dp.cantidad * i.precio_unitario) as subtotal,
                        dp.cantidad as disponible
                    FROM det_presupuesto dp
                    INNER JOIN items i ON dp.id_item = i.id_item
                    INNER JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                    WHERE dp.id_presupuesto = ? 
                    AND dp.idestado = 1";
            
            $params = [$presupuestoId];
            
            if ($capituloId) {
                $sql .= " AND dp.id_capitulo = ?";
                $params[] = $capituloId;
            }
            
            $sql .= " ORDER BY c.id_capitulo, i.codigo_item";
            
            $stmt = $connection->prepare($sql);
            $stmt->execute($params);
            $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            foreach ($items as &$item) {
                $sqlComponentes = "SELECT 
                                    ic.id_componente,
                                    ic.tipo_componente,
                                    ic.descripcion,
                                    ic.unidad,
                                    ic.cantidad,
                                    ic.precio_unitario,
                                    (ic.cantidad * ic.precio_unitario) as subtotal,
                                    m.cod_material,
                                    CAST(m.nombremat AS CHAR) AS nombre_material,
                                    tm.desc_tipo as tipo_material_desc
                                FROM item_componentes ic
                                LEFT JOIN materiales m ON ic.id_material = m.id_material
                                LEFT JOIN tipo_material tm ON m.id_tipo_material = tm.id_tipo_material
                                WHERE ic.id_item = ? AND ic.idestado = 1
                                ORDER BY FIELD(ic.tipo_componente, 'material', 'mano_obra', 'equipo', 'transporte', 'otro')";
                
                $stmtComp = $connection->prepare($sqlComponentes);
                $stmtComp->execute([$item['id_item']]);
                $item['componentes'] = $stmtComp->fetchAll(\PDO::FETCH_ASSOC);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $items
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
                'error' => 'Acción no válida',
                'acciones_disponibles' => [
                    'create' => 'Crear nuevo presupuesto',
                    'getAll' => 'Listar todos los presupuestos',
                    'importPreview' => 'Leer archivo Excel y devolver vista previa',
                    'getProyectos' => 'Obtener lista de proyectos',
                    'getMateriales' => 'Obtener lista de materiales',
                    'getMultiplicadores' => 'Obtener porcentajes de costos indirectos',
                    'guardarPresupuestos' => 'Guardar presupuestos en base de datos',
                    'getPresupuestosByProyecto' => 'Obtener presupuestos por proyecto',
                    'getCapitulosByPresupuesto' => 'Obtener capítulos ordenados por presupuesto',
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
<?php

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
                // 1. VALIDAR Y DECODIFICAR DATOS DE ENTRADA
                $pedidoData = json_decode($_POST['pedido_data'] ?? '', true);

                if (!$pedidoData) {
                    throw new \Exception('Datos del pedido no válidos o vacíos');
                }

                // Validar datos requeridos
                if (empty($pedidoData['seleccionActual']['datos']['presupuestoId'])) {
                    throw new \Exception('ID de presupuesto requerido');
                }

                if (empty($pedidoData['seleccionActual']['datos']['proyectoId'])) {
                    throw new \Exception('ID de proyecto requerido');
                }

                $idPresupuesto = (int)$pedidoData['seleccionActual']['datos']['presupuestoId'];
                $idProyecto = (int)$pedidoData['seleccionActual']['datos']['proyectoId'];
                $componentes = $pedidoData['componentes'] ?? [];
                $materialesExtra = $pedidoData['materialesExtra'] ?? [];
                $pedidosFueraPresupuesto = $pedidoData['pedidosFueraPresupuesto'] ?? [];

                // Validar que el presupuesto existe y pertenece al proyecto
                $stmtValidar = $connection->prepare(
                    "SELECT id_presupuesto FROM presupuestos
                     WHERE id_presupuesto = ? AND id_proyecto = ? AND idestado = 1"
                );
                $stmtValidar->execute([$idPresupuesto, $idProyecto]);
                if (!$stmtValidar->fetch()) {
                    throw new \Exception('El presupuesto no existe o no pertenece al proyecto seleccionado');
                }

                // 2. DETERMINAR ESTADO DEL PEDIDO
                // Si hay pedidos fuera de presupuesto → estado: pendiente (1)
                // Si solo hay pedidos normales → estado: aprobado (2)
                $tienePedidosAdicionales = count($pedidosFueraPresupuesto) > 0;
                $idEstadoPedido = $tienePedidosAdicionales ? 1 : 2; // 1=Pendiente, 2=Aprobado
                $estadoTexto = $tienePedidosAdicionales ? 'pendiente' : 'aprobado';

                // 3. CALCULAR TOTALES
                $totalComponentesNormales = 0;
                foreach ($componentes as $comp) {
                    $cantidad = (float)($comp['pedido'] ?? 0);
                    $precio = (float)($comp['precio_unitario'] ?? 0);
                    $totalComponentesNormales += $cantidad * $precio;
                }

                $totalMaterialesExtra = 0;
                foreach ($materialesExtra as $extra) {
                    $cantidad = (float)($extra['cantidad'] ?? 0);
                    $precio = (float)($extra['precio_unitario'] ?? 0);
                    $totalMaterialesExtra += $cantidad * $precio;
                }

                $totalPedidosAdicionales = 0;
                foreach ($pedidosFueraPresupuesto as $adicional) {
                    $cantidadExtra = (float)($adicional['cantidad_extra'] ?? 0);
                    $precio = (float)($adicional['precio_unitario'] ?? 0);
                    $totalPedidosAdicionales += $cantidadExtra * $precio;
                }

                $totalGeneral = $totalComponentesNormales + $totalMaterialesExtra + $totalPedidosAdicionales;

                // 4. CONSTRUIR OBSERVACIONES
                $observaciones = [];
                if ($tienePedidosAdicionales) {
                    $observaciones[] = "Pedido con " . count($pedidosFueraPresupuesto) . " componente(s) fuera de presupuesto";
                    $observaciones[] = "Total adicional: $" . number_format($totalPedidosAdicionales, 2);
                }
                if (count($materialesExtra) > 0) {
                    $observaciones[] = "Incluye " . count($materialesExtra) . " material(es) extra";
                }
                if (count($componentes) > 0) {
                    $observaciones[] = "Total componentes normales: " . count($componentes);
                }

                $observacionesTexto = implode(" | ", $observaciones);

                // Obtener ID de usuario de sesión (ajustar según tu sistema de autenticación)
                session_start();
                $idUsuario = $_SESSION['u_id'] ?? 1; // Default a 1 si no hay sesión

                // 5. INICIAR TRANSACCIÓN
                $connection->beginTransaction();

                try {
                    // 6. INSERTAR PEDIDO PRINCIPAL
                    $sqlPedido = "INSERT INTO pedidos
                                  (id_presupuesto, fecha_pedido, estado, total, observaciones, idusuario, fechareg, fechaupdate)
                                  VALUES (?, NOW(), ?, ?, ?, ?, NOW(), NOW())";

                    $stmtPedido = $connection->prepare($sqlPedido);
                    $stmtPedido->execute([
                        $idPresupuesto,
                        $estadoTexto,
                        $totalGeneral,
                        $observacionesTexto,
                        $idUsuario
                    ]);

                    $idPedido = $connection->lastInsertId();

                    if (!$idPedido) {
                        throw new \Exception('Error al crear el pedido principal');
                    }

                    // 7. INSERTAR DETALLES DE COMPONENTES NORMALES
                    $sqlDetalle = "INSERT INTO pedidos_detalle
                                   (id_pedido, id_componente, tipo_componente, id_item, cantidad, precio_unitario, subtotal, justificacion, es_excedente, fechareg)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

                    $stmtDetalle = $connection->prepare($sqlDetalle);
                    $detallesInsertados = 0;

                    foreach ($componentes as $comp) {
                        $cantidad = (float)($comp['pedido'] ?? 0);
                        if ($cantidad <= 0) continue;

                        $idComponente = (int)($comp['id_componente'] ?? 0);
                        $tipoComponente = $comp['tipo_componente'] ?? 'material';
                        // Si id_item es 0 o no existe, usar NULL para evitar error de foreign key
                        $idItem = isset($comp['id_item']) && $comp['id_item'] > 0 ? (int)$comp['id_item'] : null;
                        $precioUnitario = (float)($comp['precio_unitario'] ?? 0);
                        $subtotal = $cantidad * $precioUnitario;

                        $stmtDetalle->execute([
                            $idPedido,
                            $idComponente,
                            $tipoComponente,
                            $idItem,
                            $cantidad,
                            $precioUnitario,
                            $subtotal,
                            null,
                            0
                        ]);

                        $detallesInsertados++;
                    }

                    // 8. INSERTAR MATERIALES EXTRA (si existen)
                    foreach ($materialesExtra as $extra) {
                        $cantidad = (float)($extra['cantidad'] ?? 0);
                        if ($cantidad <= 0) continue;

                        $idComponente = (int)($extra['id_componente'] ?? 0);
                        $tipoComponente = $extra['tipo_componente'] ?? 'material';
                        // Si id_item es 0 o no existe, usar NULL para evitar error de foreign key
                        $idItem = isset($extra['id_item']) && $extra['id_item'] > 0 ? (int)$extra['id_item'] : null;
                        $precioUnitario = (float)($extra['precio_unitario'] ?? 0);
                        $subtotal = $cantidad * $precioUnitario;

                        $stmtDetalle->execute([
                            $idPedido,
                            $idComponente,
                            $tipoComponente,
                            $idItem,
                            $cantidad,
                            $precioUnitario,
                            $subtotal,
                            null,
                            0
                        ]);

                        $detallesInsertados++;
                    }

                    // 9. INSERTAR PEDIDOS FUERA DE PRESUPUESTO
                    // Estos se guardan en pedidos_detalle pero con una observación especial
                    // o podrías crear una tabla separada pedidos_adicionales
                    foreach ($pedidosFueraPresupuesto as $adicional) {
                        $cantidadExtra = (float)($adicional['cantidad_extra'] ?? 0);
                        if ($cantidadExtra <= 0) continue;

                        $idComponente = (int)($adicional['id_componente'] ?? 0);
                        $tipoComponente = $adicional['tipo_componente'] ?? 'material';
                        // Si id_item es 0 o no existe, usar NULL para evitar error de foreign key
                        $idItem = isset($adicional['id_item']) && $adicional['id_item'] > 0 ? (int)$adicional['id_item'] : null;
                        $precioUnitario = (float)($adicional['precio_unitario'] ?? 0);
                        $subtotal = $cantidadExtra * $precioUnitario;
                        $justificacion = $adicional['justificacion'] ?? '';

                        // Insertar el detalle con la cantidad extra
                        $stmtDetalle->execute([
                            $idPedido,
                            $idComponente,
                            $tipoComponente,
                            $idItem,
                            $cantidadExtra,
                            $precioUnitario,
                            $subtotal,
                            $justificacion,
                            1
                        ]);

                        $detallesInsertados++;
                    }

                    // 10. VALIDAR QUE SE INSERTARON DETALLES
                    if ($detallesInsertados === 0) {
                        throw new \Exception('No se insertaron detalles del pedido. Verifique las cantidades.');
                    }

                    // 11. CONFIRMAR TRANSACCIÓN
                    $connection->commit();

                    // 12. PREPARAR RESPUESTA
                    $mensaje = $tienePedidosAdicionales
                        ? "Pedido guardado con " . count($pedidosFueraPresupuesto) . " componente(s) adicional(es) pendiente(s) de autorización"
                        : "Pedido guardado y aprobado correctamente";

                    echo json_encode([
                        'success' => true,
                        'id_pedido' => $idPedido,
                        'estado' => $estadoTexto,
                        'tiene_adicionales' => $tienePedidosAdicionales,
                        'message' => $mensaje,
                        'detalles' => [
                            'componentes_normales' => count($componentes),
                            'materiales_extra' => count($materialesExtra),
                            'pedidos_adicionales' => count($pedidosFueraPresupuesto),
                            'total_detalles_insertados' => $detallesInsertados,
                            'total_pedido' => $totalGeneral,
                            'total_adicional' => $totalPedidosAdicionales
                        ]
                    ]);

                } catch (\Exception $e) {
                    // REVERTIR TRANSACCIÓN EN CASO DE ERROR
                    $connection->rollBack();
                    throw new \Exception('Error en transacción: ' . $e->getMessage());
                }

            } catch (\Exception $e) {
                error_log("ERROR en guardarPedido: " . $e->getMessage());
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getPedidosByPresupuesto':
            try {
                $presupuestoId = $_POST['presupuesto_id'] ?? $_GET['presupuesto_id'] ?? null;

                if (!$presupuestoId) {
                    throw new \Exception('ID de presupuesto requerido');
                }

                // Consulta mejorada con información de estado de autorización
                $sql = "SELECT
                            p.id_pedido,
                            p.fecha_pedido,
                            p.estado,
                            p.total,
                            p.observaciones,
                            p.idusuario,
                            ep.desc_estado as estado_descripcion,
                            ep.color as estado_color,
                            COUNT(pd.id_det_pedido) as total_items,
                            u.u_nombre as nombre_usuario
                        FROM pedidos p
                        LEFT JOIN pedidos_detalle pd ON p.id_pedido = pd.id_pedido
                        LEFT JOIN estado_pedido ep ON p.estado = LOWER(ep.desc_estado)
                        LEFT JOIN gr_usuarios u ON p.idusuario = u.u_id
                        WHERE p.id_presupuesto = ?
                        GROUP BY p.id_pedido, p.fecha_pedido, p.estado, p.total, p.observaciones,
                                 p.idusuario, ep.desc_estado, ep.color, u.u_nombre
                        ORDER BY p.fecha_pedido DESC";
                $stmt = $connection->prepare($sql);
                $stmt->execute([$presupuestoId]);
                $pedidos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                // Para cada pedido, obtener detalles adicionales
                foreach ($pedidos as &$pedido) {
                    // Obtener detalles del pedido
                    $sqlDetalles = "SELECT
                                        pd.id_det_pedido,
                                        pd.id_componente,
                                        pd.tipo_componente,
                                        pd.id_item,
                                        pd.cantidad,
                                        pd.precio_unitario,
                                        pd.subtotal,
                                        pd.justificacion,
                                        pd.es_excedente,
                                        pd.fechareg,
                                        i.codigo_item,
                                        i.nombre_item,
                                        i.unidad as unidad_item,
                                        ic.descripcion as descripcion_componente,
                                        ic.unidad as unidad_componente,
                                        c.id_capitulo,
                                        c.nombre_cap AS nombre_capitulo
                                    FROM pedidos_detalle pd
                                    LEFT JOIN items i ON pd.id_item = i.id_item
                                    LEFT JOIN item_componentes ic ON pd.id_componente = ic.id_componente
                                    LEFT JOIN det_presupuesto dp ON dp.id_item = pd.id_item AND dp.id_presupuesto = ?
                                    LEFT JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                                    WHERE pd.id_pedido = ?
                                    ORDER BY pd.id_det_pedido";

                    $stmtDet = $connection->prepare($sqlDetalles);
                    $stmtDet->execute([$presupuestoId, $pedido['id_pedido']]);
                    $pedido['detalles'] = $stmtDet->fetchAll(\PDO::FETCH_ASSOC);

                    // Determinar si tiene pedidos adicionales basado en observaciones
                    $pedido['tiene_adicionales'] = strpos($pedido['observaciones'] ?? '', 'fuera de presupuesto') !== false;
                }

                echo json_encode([
                    'success' => true,
                    'data' => $pedidos,
                    'total_pedidos' => count($pedidos)
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'actualizarEstadoPedido':
            try {
                // Endpoint para aprobar o rechazar pedidos
                $idPedido = $_POST['id_pedido'] ?? null;
                $nuevoEstado = $_POST['estado'] ?? null; // 'aprobado', 'rechazado', etc.
                $observacion = $_POST['observacion'] ?? '';

                if (!$idPedido) {
                    throw new \Exception('ID de pedido requerido');
                }

                if (!$nuevoEstado) {
                    throw new \Exception('Estado requerido');
                }

                // Validar que el estado existe en la tabla estado_pedido
                $stmtValidarEstado = $connection->prepare(
                    "SELECT id_estado_pedido, desc_estado, color
                     FROM estado_pedido
                     WHERE LOWER(desc_estado) = LOWER(?) AND id_estado = 1"
                );
                $stmtValidarEstado->execute([$nuevoEstado]);
                $estadoInfo = $stmtValidarEstado->fetch(\PDO::FETCH_ASSOC);

                if (!$estadoInfo) {
                    throw new \Exception('Estado no válido: ' . $nuevoEstado);
                }

                // Obtener información actual del pedido
                $stmtPedido = $connection->prepare(
                    "SELECT id_pedido, estado, observaciones FROM pedidos WHERE id_pedido = ?"
                );
                $stmtPedido->execute([$idPedido]);
                $pedidoActual = $stmtPedido->fetch(\PDO::FETCH_ASSOC);

                if (!$pedidoActual) {
                    throw new \Exception('Pedido no encontrado');
                }

                // Actualizar observaciones agregando la nueva
                $observacionesActuales = $pedidoActual['observaciones'] ?? '';
                $nuevaObservacion = $observacion
                    ? $observacionesActuales . " | " . $observacion
                    : $observacionesActuales;

                // Actualizar estado del pedido
                $sqlUpdate = "UPDATE pedidos
                              SET estado = ?, observaciones = ?, fechaupdate = NOW()
                              WHERE id_pedido = ?";

                $stmtUpdate = $connection->prepare($sqlUpdate);
                $stmtUpdate->execute([
                    strtolower($estadoInfo['desc_estado']),
                    $nuevaObservacion,
                    $idPedido
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Estado del pedido actualizado correctamente',
                    'id_pedido' => $idPedido,
                    'estado_anterior' => $pedidoActual['estado'],
                    'estado_nuevo' => strtolower($estadoInfo['desc_estado']),
                    'color' => $estadoInfo['color']
                ]);

            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getDetallePedido':
            try {
                // Endpoint para obtener detalles completos de un pedido específico
                $idPedido = $_GET['id_pedido'] ?? $_POST['id_pedido'] ?? null;

                if (!$idPedido) {
                    throw new \Exception('ID de pedido requerido');
                }

                // Obtener información del pedido
                $sqlPedido = "SELECT
                                p.id_pedido,
                                p.id_presupuesto,
                                p.fecha_pedido,
                                p.estado,
                                p.total,
                                p.observaciones,
                                p.idusuario,
                                p.fechareg,
                                p.fechaupdate,
                                ep.desc_estado as estado_descripcion,
                                ep.color as estado_color,
                                u.u_nombre as nombre_usuario,
                                pr.nombre as nombre_proyecto,
                                pres.monto_total as presupuesto_total
                            FROM pedidos p
                            LEFT JOIN estado_pedido ep ON p.estado = LOWER(ep.desc_estado)
                            LEFT JOIN gr_usuarios u ON p.idusuario = u.u_id
                            LEFT JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                            LEFT JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                            WHERE p.id_pedido = ?";

                $stmt = $connection->prepare($sqlPedido);
                $stmt->execute([$idPedido]);
                $pedido = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!$pedido) {
                    throw new \Exception('Pedido no encontrado');
                }

                // Obtener detalles del pedido agrupados por tipo
                $sqlDetalles = "SELECT
                                    pd.id_det_pedido,
                                    pd.id_componente,
                                    pd.tipo_componente,
                                    pd.id_item,
                                    pd.cantidad,
                                    pd.precio_unitario,
                                    pd.subtotal,
                                    pd.fechareg,
                                    i.codigo_item,
                                    i.nombre_item,
                                    i.unidad as unidad_item,
                                    ic.descripcion as descripcion_componente,
                                    ic.unidad as unidad_componente
                                FROM pedidos_detalle pd
                                LEFT JOIN items i ON pd.id_item = i.id_item
                                LEFT JOIN item_componentes ic ON pd.id_componente = ic.id_componente
                                WHERE pd.id_pedido = ?
                                ORDER BY pd.tipo_componente, pd.id_det_pedido";

                $stmtDet = $connection->prepare($sqlDetalles);
                $stmtDet->execute([$idPedido]);
                $detalles = $stmtDet->fetchAll(\PDO::FETCH_ASSOC);

                // Agrupar detalles por tipo de componente
                $detallesPorTipo = [
                    'material' => [],
                    'mano_obra' => [],
                    'equipo' => [],
                    'transporte' => [],
                    'otro' => []
                ];

                $totalesPorTipo = [
                    'material' => 0,
                    'mano_obra' => 0,
                    'equipo' => 0,
                    'transporte' => 0,
                    'otro' => 0
                ];

                foreach ($detalles as $detalle) {
                    $tipo = $detalle['tipo_componente'];
                    if (isset($detallesPorTipo[$tipo])) {
                        $detallesPorTipo[$tipo][] = $detalle;
                        $totalesPorTipo[$tipo] += (float)$detalle['subtotal'];
                    } else {
                        $detallesPorTipo['otro'][] = $detalle;
                        $totalesPorTipo['otro'] += (float)$detalle['subtotal'];
                    }
                }

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'pedido' => $pedido,
                        'detalles' => $detalles,
                        'detalles_por_tipo' => $detallesPorTipo,
                        'totales_por_tipo' => $totalesPorTipo,
                        'total_items' => count($detalles),
                        'tiene_adicionales' => strpos($pedido['observaciones'] ?? '', 'fuera de presupuesto') !== false
                    ]
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
            $codigoMaterial = isset($_GET['codigo_material']) ? trim($_GET['codigo_material']) : null;

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
                            'apu' as tipo,
                            CASE 
                                WHEN EXISTS (
                                    SELECT 1 FROM item_composicion ic 
                                    WHERE ic.id_item_compuesto = i.id_item AND ic.idestado = 1
                                ) THEN 1 
                                ELSE 0 
                            END as es_compuesto
                        FROM items i
                        WHERE i.codigo_item = ? AND i.idestado = 1
                        LIMIT 1";
            
            $stmt = $connection->prepare($sqlItem);
            $stmt->execute([$codigoMaterial]);
            $item = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$item) {
                throw new \Exception('Item no encontrado con el código: "' . $codigoMaterial . '" (len: ' . strlen($codigoMaterial) . ')');
            }

            $idItem = $item['id_item'];

            // OBTENER ITEMS ANIDADOS
            $sqlItemsAnidados = "SELECT
                                    i2.id_item,
                                    i2.codigo_item,
                                    i2.nombre_item,
                                    i2.unidad,
                                    icomp.cantidad,
                                    icomp.es_referencia
                                FROM item_composicion icomp
                                INNER JOIN items i2 ON icomp.id_item_componente = i2.id_item
                                WHERE icomp.id_item_compuesto = ? 
                                AND icomp.idestado = 1
                                AND i2.idestado = 1
                                ORDER BY icomp.orden, i2.codigo_item";

            $stmt = $connection->prepare($sqlItemsAnidados);
            $stmt->execute([$idItem]);
            $itemsAnidados = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Obtener componentes del ítem organizados por tipo
            $sqlComponentes = "SELECT
                                    ic.id_componente,
                                    ic.tipo_componente,
                                    ic.descripcion,
                                    ic.unidad,
                                    ic.cantidad,
                                    ic.precio_unitario,
                                    ic.porcentaje_desperdicio,
                                    CASE 
                                        WHEN ic.tipo_componente = 'material' 
                                        THEN ic.cantidad * ic.precio_unitario * (1 + (ic.porcentaje_desperdicio/100))
                                        ELSE ic.cantidad * ic.precio_unitario
                                    END as subtotal,
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

            // Calcular precio_unitario del item desde sus componentes
            $precioCalculado = 0;
            foreach ($componentes as $comp) {
                $precioCalculado += (float)$comp['subtotal'];
            }
            
            // Asignar el precio calculado al item
            $item['precio_unitario'] = $precioCalculado;

            // Para items anidados, calcular su precio tambien
            foreach ($itemsAnidados as &$anidado) {
                $sqlPrecioAnidado = "SELECT SUM(
                    CASE 
                        WHEN ic.tipo_componente = 'material' 
                        THEN ic.cantidad * ic.precio_unitario * (1 + (ic.porcentaje_desperdicio/100))
                        ELSE ic.cantidad * ic.precio_unitario
                    END
                ) as precio_total
                FROM item_componentes ic
                WHERE ic.id_item = ? AND ic.idestado = 1";
                
                $stmtPrecio = $connection->prepare($sqlPrecioAnidado);
                $stmtPrecio->execute([$anidado['id_item']]);
                $resultPrecio = $stmtPrecio->fetch(\PDO::FETCH_ASSOC);
                $anidado['precio_unitario'] = (float)($resultPrecio['precio_total'] ?? 0);
            }
            unset($anidado);
            // MEJORA: Si no hay componentes NI items anidados pero el item tiene precio, crear componente sintético
            if (empty($componentes) && empty($itemsAnidados) && $item['precio_unitario'] > 0) {
                // Este es un item simple (material directo) sin descomposición
                $componentes = [[
                    'id_componente' => 0,
                    'tipo_componente' => 'material',
                    'descripcion' => $item['nombre_item'] . ' (Material directo)',
                    'unidad' => $item['unidad'],
                    'cantidad' => 1.0000,
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $item['precio_unitario'],
                    'codigo_componente' => $item['codigo_item'],
                    'nombre_material' => $item['nombre_item'],
                    'unidad_material' => null,
                    'tipo_material_desc' => 'Material Directo',
                    'id_material' => null,
                    'es_sintetico' => true
                ]];
            }

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
                    'componentes_lista' => $componentes,
                    'items_anidados' => $itemsAnidados,
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
                        dp.cantidad,
                        c.id_capitulo,
                        c.nombre_cap AS nombre_capitulo,
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

            // Calcular precio para cada item desde componentes
            foreach ($items as &$item) {
                $sqlPrecio = "SELECT SUM(
                    CASE 
                        WHEN ic.tipo_componente = 'material' 
                        THEN ic.cantidad * ic.precio_unitario * (1 + (ic.porcentaje_desperdicio/100))
                        ELSE ic.cantidad * ic.precio_unitario
                    END
                ) as precio_total
                FROM item_componentes ic
                WHERE ic.id_item = ? AND ic.idestado = 1";
                
                $stmtPrecio = $connection->prepare($sqlPrecio);
                $stmtPrecio->execute([$item['id_item']]);
                $resultPrecio = $stmtPrecio->fetch(\PDO::FETCH_ASSOC);
                $item['precio_unitario'] = (float)($resultPrecio['precio_total'] ?? 0);
                $item['subtotal'] = $item['cantidad'] * $item['precio_unitario'];
            }
            
            // Para cada item, obtener sus componentes
            foreach ($items as &$item) {
                $sqlComponentes = "SELECT 
                                    ic.id_componente,
                                    ic.tipo_componente,
                                    ic.descripcion,
                                    ic.unidad,
                                    ic.cantidad,
                                    ic.precio_unitario,
                                    ic.porcentaje_desperdicio,
                                    CASE 
                                        WHEN ic.tipo_componente = 'material' 
                                        THEN ic.cantidad * ic.precio_unitario * (1 + (ic.porcentaje_desperdicio/100))
                                        ELSE ic.cantidad * ic.precio_unitario
                                    END as subtotal,
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

    

        case 'getDetallesComponentesPresupuesto':
            try {
                $presupuestoId = $_POST['presupuesto_id'] ?? $_GET['presupuesto_id'] ?? null;
                
                if (!$presupuestoId) {
                    throw new \Exception('ID de presupuesto requerido');
                }

                $sql = "SELECT 
                            dp.id_det_presupuesto,
                            p.id_presupuesto,
                            p.id_proyecto,
                            c.id_capitulo,
                            c.nombre_cap,
                            i.id_item,
                            i.codigo_item,
                            i.nombre_item,
                            i.unidad as unidad_item,
                            dp.cantidad as cantidad_item_presupuesto,
                            ic.id_componente,
                            ic.descripcion as nombre_componente,
                            ic.tipo_componente,
                            ic.unidad as unidad_componente,
                            ic.cantidad as cantidad_por_unidad_item,
                            ic.precio_unitario,
                            ROUND(dp.cantidad * ic.cantidad, 4) as total_componente_necesario,
                            ROUND(dp.cantidad * ic.cantidad * ic.precio_unitario, 2) as subtotal_componente
                        FROM det_presupuesto dp
                        JOIN presupuestos p ON dp.id_presupuesto = p.id_presupuesto
                        JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                        JOIN items i ON dp.id_item = i.id_item
                        JOIN item_componentes ic ON i.id_item = ic.id_item
                        WHERE dp.idestado = 1 
                          AND ic.idestado = 1 
                          AND p.idestado = 1
                          AND p.id_presupuesto = ?
                        ORDER BY c.id_capitulo, i.codigo_item, ic.tipo_componente";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute([$presupuestoId]);
                $detalles = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $detalles
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getResumenComponentesPresupuesto':
            try {
                $presupuestoId = $_POST['presupuesto_id'] ?? $_GET['presupuesto_id'] ?? null;
                
                if (!$presupuestoId) {
                    throw new \Exception('ID de presupuesto requerido');
                }

                $sql = "SELECT 
                            MIN(ic.id_componente) as id_componente,
                            ic.descripcion as nombre_componente,
                            ic.tipo_componente,
                            ic.unidad as unidad_componente,
                            AVG(ic.precio_unitario) as precio_unitario,
                            p.id_presupuesto,
                            ROUND(SUM(dp.cantidad * ic.cantidad), 4) as total_necesario,
                            0.0000 as ya_pedido,
                            ROUND(SUM(dp.cantidad * ic.cantidad), 4) as disponible,
                            GROUP_CONCAT(DISTINCT c.nombre_cap ORDER BY c.nombre_cap SEPARATOR ', ') as capitulos,
                            COUNT(DISTINCT i.id_item) as cantidad_items,
                            COUNT(DISTINCT c.id_capitulo) as cantidad_capitulos
                        FROM det_presupuesto dp
                        JOIN presupuestos p ON dp.id_presupuesto = p.id_presupuesto
                        JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                        JOIN items i ON dp.id_item = i.id_item
                        JOIN item_componentes ic ON i.id_item = ic.id_item
                        WHERE dp.idestado = 1 
                          AND ic.idestado = 1 
                          AND p.idestado = 1
                          AND p.id_presupuesto = ?
                        GROUP BY ic.descripcion, ic.tipo_componente, ic.unidad, p.id_presupuesto
                        ORDER BY ic.tipo_componente, ic.descripcion";
                
                $stmt = $connection->prepare($sql);
                $stmt->execute([$presupuestoId]);
                $resumen = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $resumen
                ]);
                
            } catch (\Exception $e) {
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;

        case 'getComponentesParaPedido':
    try {
        $presupuestoId = $_POST['presupuesto_id'] ?? $_GET['presupuesto_id'] ?? null;
        
        if (!$presupuestoId) {
            throw new \Exception('ID de presupuesto requerido');
        }

        $sql = "SELECT 
                    ic.id_componente,
                    ic.descripcion as nombre_componente,
                    ic.tipo_componente,
                    ic.unidad as unidad_componente,
                    AVG(ic.precio_unitario) as precio_unitario,
                    p.id_presupuesto,
                    ROUND(SUM(dp.cantidad * ic.cantidad), 4) as total_necesario,
                    
                    -- NUEVO: Calcular lo ya pedido sumando las cantidades de pedidos aprobados
                    COALESCE(ROUND((
                        SELECT SUM(pd.cantidad) 
                        FROM pedidos_detalle pd
                        INNER JOIN pedidos ped ON pd.id_pedido = ped.id_pedido
                        WHERE pd.id_componente = ic.id_componente
                        AND ped.id_presupuesto = p.id_presupuesto
                        AND ped.estado IN ('aprobado', 'entregado_parcial', 'entregado_total')
                    ), 4), 0.0000) as ya_pedido,
                    
                    -- NUEVO: Calcular disponible restando lo ya pedido
                    ROUND(SUM(dp.cantidad * ic.cantidad) - COALESCE((
                        SELECT SUM(pd.cantidad) 
                        FROM pedidos_detalle pd
                        INNER JOIN pedidos ped ON pd.id_pedido = ped.id_pedido
                        WHERE pd.id_componente = ic.id_componente
                        AND ped.id_presupuesto = p.id_presupuesto
                        AND ped.estado IN ('aprobado', 'entregado_parcial', 'entregado_total')
                    ), 0), 4) as disponible,
                        GROUP_CONCAT(DISTINCT 
                            CONCAT(
                                i.id_item, '|',
                                i.codigo_item, '|',
                                i.nombre_item, '|',
                                c.nombre_cap, '|',
                                ic.cantidad, '|',
                                ic.unidad, '|',
                                i.unidad, '|',
                                dp.cantidad, '|',
                                ROUND(dp.cantidad * ic.cantidad, 4), '|',
                                COALESCE((
                                    SELECT SUM(pd.cantidad)
                                    FROM pedidos_detalle pd
                                    INNER JOIN pedidos ped2 ON pd.id_pedido = ped2.id_pedido
                                    WHERE pd.id_componente = ic.id_componente
                                    AND pd.id_item = i.id_item
                                    AND ped2.id_presupuesto = p.id_presupuesto
                                    AND ped2.estado IN ('aprobado', 'entregado_parcial', 'entregado_total')
                                ), 0)
                            )
                            ORDER BY i.codigo_item, c.nombre_cap
                            SEPARATOR '||'
                        ) as detalle_serializado
                FROM det_presupuesto dp
                JOIN presupuestos p ON dp.id_presupuesto = p.id_presupuesto
                JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                JOIN items i ON dp.id_item = i.id_item
                JOIN item_componentes ic ON i.id_item = ic.id_item
                WHERE dp.idestado = 1 
                AND ic.idestado = 1 
                AND p.idestado = 1
                AND p.id_presupuesto = ?
                GROUP BY ic.id_componente, ic.descripcion, ic.tipo_componente, ic.unidad, p.id_presupuesto
                ORDER BY ic.tipo_componente, ic.descripcion";
        
        $stmt = $connection->prepare($sql);
        $stmt->execute([$presupuestoId]);
        $componentes = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $componentes
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
                    'guardarPedido' => 'Guardar pedido con control de autorizaciones (NUEVO)',
                    'getPedidosByPresupuesto' => 'Obtener pedidos por presupuesto con detalles',
                    'actualizarEstadoPedido' => 'Aprobar/Rechazar pedidos (NUEVO)',
                    'getDetallePedido' => 'Obtener detalles completos de un pedido específico (NUEVO)',
                    'getItemDetails' => 'Obtener detalles de un ítem por ID',
                    'getItemDetailsByCode' => 'Obtener detalles de un ítem por código',
                    'getItemsByPresupuesto' => 'Obtener ítems con componentes por presupuesto'
                ]
            ]);
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;
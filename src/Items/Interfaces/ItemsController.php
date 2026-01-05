<?php

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

$db = new \Database();
$connection = $db->getConnection();

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    switch ($action) {
        case 'getMateriales':
            $sql = "SELECT 
                        m.id_material,
                        m.cod_material,
                        CAST(m.nombremat AS CHAR) AS nombre_material,
                        tm.id_tipo_material,
                        COALESCE(tm.desc_tipo, 'Sin tipo') AS desc_tipo,
                        u.idunidad,
                        COALESCE(u.unidesc, 'Sin unidad') AS unidesc,
                        mp.valor AS precio_actual,
                        mp.fecha AS fecha_precio,
                        mp.estado AS estado_precio,
                        m.idestado
                    FROM materiales m
                    LEFT JOIN tipo_material tm ON m.id_tipo_material = tm.id_tipo_material
                    LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
                    LEFT JOIN (
                        SELECT mp1.*
                        FROM material_precio mp1
                        INNER JOIN (
                            SELECT id_material, MAX(id_mat_precio) AS last_id
                            FROM material_precio
                            GROUP BY id_material
                        ) latest ON mp1.id_mat_precio = latest.last_id
                    ) mp ON mp.id_material = m.id_material
                    WHERE m.idestado IN (0, 1)
                    ORDER BY m.cod_material ASC";

            $stmt = $connection->prepare($sql);
            $stmt->execute();

            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        case 'createMaterial':
            $data = getJsonInput();

            $codigo = trim($data['cod_material'] ?? '');
            $nombre = trim($data['nombre_material'] ?? '');
            $tipoId = (int)($data['id_tipo_material'] ?? 0);
            $unidadId = (string)($data['idunidad'] ?? '');
            $precio = (float)($data['precio'] ?? 0);
            $usuarioId = (int)($data['idusuario'] ?? 1);

            if ($codigo === '' || $nombre === '' || !$tipoId || $unidadId === '' || $precio <= 0) {
                throw new Exception('Datos insuficientes para crear el material.');
            }

            $connection->beginTransaction();

            $sqlMaterial = "INSERT INTO materiales 
                                (cod_material, nombremat, id_tipo_material, idunidad, idusuario, matfchreg, idestado, matfupdate)
                            VALUES (?, ?, ?, ?, ?, NOW(), 1, NOW())";
            $stmt = $connection->prepare($sqlMaterial);
            $stmt->execute([
                $codigo,
                $nombre,
                $tipoId,
                $unidadId,
                $usuarioId
            ]);

            $materialId = (int)$connection->lastInsertId();

            $sqlPrecio = "INSERT INTO material_precio (id_material, valor, fecha, estado, idusuario, fechareg, fechaupdate)
                          VALUES (?, ?, CURDATE(), 1, ?, NOW(), NOW())";
            $stmt = $connection->prepare($sqlPrecio);
            $stmt->execute([$materialId, $precio, $usuarioId]);

            $connection->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Material creado correctamente',
                'id_material' => $materialId
            ]);
            break;

        case 'updateMaterial':
            $data = getJsonInput();
            $materialId = (int)($data['id_material'] ?? 0);

            if (!$materialId) {
                throw new Exception('ID de material requerido');
            }

            $codigo = trim($data['cod_material'] ?? '');
            $nombre = trim($data['nombre_material'] ?? '');
            $tipoId = (int)($data['id_tipo_material'] ?? 0);
            $unidadId = (string)($data['idunidad'] ?? '');
            $estado = (int)($data['estado'] ?? 1);
            $precio = isset($data['precio']) ? (float)$data['precio'] : null;
            $usuarioId = (int)($data['idusuario'] ?? 1);

            if ($codigo === '' || $nombre === '' || !$tipoId || $unidadId === '') {
                throw new Exception('Datos insuficientes para actualizar el material.');
            }

            $connection->beginTransaction();

            $sqlMaterial = "UPDATE materiales 
                            SET cod_material = ?, 
                                nombremat = ?, 
                                id_tipo_material = ?, 
                                idunidad = ?, 
                                idestado = ?, 
                                matfupdate = NOW()
                            WHERE id_material = ?";
            $stmt = $connection->prepare($sqlMaterial);
            $stmt->execute([$codigo, $nombre, $tipoId, $unidadId, $estado, $materialId]);

            if ($precio !== null && $precio > 0) {
                $connection->prepare("UPDATE material_precio SET estado = 0 WHERE id_material = ?")
                    ->execute([$materialId]);

                $sqlPrecio = "INSERT INTO material_precio (id_material, valor, fecha, estado, idusuario, fechareg, fechaupdate)
                              VALUES (?, ?, CURDATE(), 1, ?, NOW(), NOW())";
                $stmt = $connection->prepare($sqlPrecio);
                $stmt->execute([$materialId, $precio, $usuarioId]);
            }

            $connection->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Material actualizado correctamente'
            ]);
            break;

        case 'toggleMaterial':
            $id = (int)($_GET['id_material'] ?? 0);

            if (!$id) {
                throw new Exception('ID de material requerido');
            }

            // Obtener estado actual
            $stmt = $connection->prepare("SELECT idestado FROM materiales WHERE id_material = ?");
            $stmt->execute([$id]);
            $estadoActual = $stmt->fetchColumn();

            // Cambiar estado
            $nuevoEstado = $estadoActual == 1 ? 0 : 1;
            $stmt = $connection->prepare("UPDATE materiales SET idestado = ? WHERE id_material = ?");
            $stmt->execute([$nuevoEstado, $id]);

            echo json_encode([
                'success' => true,
                'message' => $nuevoEstado == 1 ? 'Material activado correctamente' : 'Material desactivado correctamente',
                'nuevo_estado' => $nuevoEstado
            ]);
            break;

        case 'getMaterialPriceHistory':
            $idMaterial = (int)($_GET['id_material'] ?? 0);

            if (!$idMaterial) {
                throw new Exception('ID de material requerido');
            }

            $sql = "SELECT 
                        mp.id_mat_precio,
                        mp.valor,
                        mp.fecha,
                        mp.estado,
                        mp.idusuario,
                        mp.fechareg,
                        COALESCE(NULLIF(CAST(mp.idusuario AS CHAR), ''), 'N/D') AS usuario_nombre
                    FROM material_precio mp
                    WHERE mp.id_material = ?
                    ORDER BY mp.fecha DESC, mp.id_mat_precio DESC";

            $stmt = $connection->prepare($sql);
            $stmt->execute([$idMaterial]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $foundVigente = false;
            foreach ($history as &$row) {
                $estado = (int)($row['estado'] ?? 0);
                if (!$foundVigente && $estado === 1) {
                    $foundVigente = true;
                    continue;
                }
                $row['estado'] = 0;
            }
            unset($row);

            if (!$foundVigente && !empty($history)) {
                $history[0]['estado'] = 1;
            }

            echo json_encode([
                'success' => true,
                'data' => $history
            ]);
            break;

        case 'saveMaterialPrice':
            $data = getJsonInput();
            $idMaterial = (int)($data['id_material'] ?? 0);
            $valor = isset($data['valor']) ? (float)$data['valor'] : 0;
            $fecha = !empty($data['fecha']) ? $data['fecha'] : date('Y-m-d');
            $usuarioId = (int)($data['idusuario'] ?? 1);

            if (!$idMaterial || $valor <= 0) {
                throw new Exception('Datos insuficientes para registrar el precio.');
            }

            $connection->beginTransaction();

            $stmtPrev = $connection->prepare("SELECT valor FROM material_precio WHERE id_material = ? AND estado = 1 ORDER BY fecha DESC, id_mat_precio DESC LIMIT 1");
            $stmtPrev->execute([$idMaterial]);
            $prevValor = (float)($stmtPrev->fetchColumn() ?? 0);

            $connection->prepare("UPDATE material_precio SET estado = 0 WHERE id_material = ?")->execute([$idMaterial]);

            $stmt = $connection->prepare(
                "INSERT INTO material_precio (id_material, valor, fecha, estado, idusuario, fechareg, fechaupdate)
                 VALUES (?, ?, ?, 1, ?, NOW(), NOW())"
            );
            $stmt->execute([$idMaterial, $valor, $fecha, $usuarioId]);

            $delta = $valor - $prevValor;
            $impacts = [];

            if ($delta !== 0.0) {
                $stmtImpact = $connection->prepare(
                    "SELECT ic.id_item, i.codigo_item, i.nombre_item, ic.cantidad, ic.porcentaje_desperdicio
                     FROM item_componentes ic
                     INNER JOIN items i ON ic.id_item = i.id_item
                     WHERE ic.id_material = ? AND ic.idestado = 1"
                );
                $stmtImpact->execute([$idMaterial]);

                $byItem = [];
                while ($row = $stmtImpact->fetch(PDO::FETCH_ASSOC)) {
                    $itemId = (int)$row['id_item'];
                    $factor = 1 + ((float)($row['porcentaje_desperdicio'] ?? 0) / 100);
                    $componentDelta = (float)$row['cantidad'] * $delta * $factor;
                    if (!isset($byItem[$itemId])) {
                        $byItem[$itemId] = [
                            'id_item' => $itemId,
                            'codigo_item' => $row['codigo_item'],
                            'nombre_item' => $row['nombre_item'],
                            'delta' => 0
                        ];
                    }
                    $byItem[$itemId]['delta'] += $componentDelta;
                }

                $impacts = array_values($byItem);
            }

            $connection->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Precio de material registrado correctamente',
                'delta' => $delta,
                'impacted_items' => $impacts
            ]);
            break;

        case 'getItems':
            $sql = "SELECT 
                        i.id_item,
                        i.codigo_item,
                        i.nombre_item,
                        i.unidad,
                        i.descripcion,
                        i.es_compuesto,
                        i.id_item_padre,
                        i.fecha_creacion,
                        i.idestado
                    FROM items i
                    ORDER BY i.fecha_creacion DESC";

            $stmt = $connection->prepare($sql);
            $stmt->execute();

            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        case 'createItem':
            $data = getJsonInput();

            $codigo = trim($data['codigo_item'] ?? '');
            $nombre = trim($data['nombre_item'] ?? '');
            $unidad = trim($data['unidad'] ?? '');
            $descripcion = trim($data['descripcion'] ?? '');
            $esCompuesto = !empty($data['es_compuesto']) ? 1 : 0;
            $idPadre = isset($data['id_item_padre']) && $data['id_item_padre'] !== '' ? (int)$data['id_item_padre'] : null;
            $usuarioId = (int)($data['idusuario'] ?? 1);
            $esAPU = isset($data['es_apu']) ? (int)$data['es_apu'] : 1;
            $idTipoItem = isset($data['id_tipo_item']) && $data['id_tipo_item'] !== '' ? (int)$data['id_tipo_item'] : null;

            if ($codigo === '' || $nombre === '' || $unidad === '') {
                throw new Exception('Datos insuficientes para crear el ítem.');
            }

            $sql = "INSERT INTO items 
                        (codigo_item, nombre_item, unidad, descripcion, fecha_creacion, idusuario, idestado, es_compuesto, id_item_padre, es_apu, nivel, ruta_jerarquia, id_tipo_item)
                    VALUES (?, ?, ?, ?, NOW(), ?, 1, ?, ?, ?, 1, NULL, ?)";
            $stmt = $connection->prepare($sql);
            $stmt->execute([
                $codigo,
                $nombre,
                $unidad,
                $descripcion,
                $usuarioId,
                $esCompuesto,
                $idPadre,
                $esAPU,
                $idTipoItem
            ]);

            $itemId = (int)$connection->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Ítem creado correctamente',
                'id_item' => $itemId
            ]);
            break;

        case 'updateItem':
            $data = getJsonInput();
            $itemId = (int)($data['id_item'] ?? 0);

            if (!$itemId) {
                throw new Exception('ID de ítem requerido');
            }

            $codigo = trim($data['codigo_item'] ?? '');
            $nombre = trim($data['nombre_item'] ?? '');
            $unidad = trim($data['unidad'] ?? '');
            $descripcion = trim($data['descripcion'] ?? '');
            $esCompuesto = !empty($data['es_compuesto']) ? 1 : 0;
            $idPadre = isset($data['id_item_padre']) && $data['id_item_padre'] !== '' ? (int)$data['id_item_padre'] : null;
            $estado = (int)($data['idestado'] ?? 1);
            $esAPU = isset($data['es_apu']) ? (int)$data['es_apu'] : 1;
            $idTipoItem = isset($data['id_tipo_item']) && $data['id_tipo_item'] !== '' ? (int)$data['id_tipo_item'] : null;
            $componentes = $data['componentes'] ?? [];
            $removedComponents = $data['removed_component_ids'] ?? [];

            if ($codigo === '' || $nombre === '' || $unidad === '') {
                throw new Exception('Datos insuficientes para actualizar el ítem.');
            }

            $connection->beginTransaction();

            $sql = "UPDATE items
                    SET codigo_item = ?,
                        nombre_item = ?,
                        unidad = ?,
                        descripcion = ?,
                        es_compuesto = ?,
                        id_item_padre = ?,
                        idestado = ?,
                        es_apu = ?,
                        id_tipo_item = ?
                    WHERE id_item = ?";
            $stmt = $connection->prepare($sql);
            $stmt->execute([
                $codigo,
                $nombre,
                $unidad,
                $descripcion,
                $esCompuesto,
                $idPadre,
                $estado,
                $esAPU,
                $idTipoItem,
                $itemId
            ]);

            if (!empty($removedComponents) && is_array($removedComponents)) {
                $placeholders = implode(',', array_fill(0, count($removedComponents), '?'));
                $params = array_map('intval', $removedComponents);
                $params[] = $itemId;
                $connection->prepare(
                    "UPDATE item_componentes SET idestado = 0
                     WHERE id_componente IN ($placeholders) AND id_item = ?"
                )->execute($params);
            }

            if (!empty($componentes) && is_array($componentes)) {
                $stmtUpsert = $connection->prepare(
                    "INSERT INTO item_componentes
                        (id_componente, id_item, tipo_componente, id_material, descripcion, unidad, cantidad, precio_unitario, porcentaje_desperdicio, idestado)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                     ON DUPLICATE KEY UPDATE
                        tipo_componente = VALUES(tipo_componente),
                        id_material = VALUES(id_material),
                        descripcion = VALUES(descripcion),
                        unidad = VALUES(unidad),
                        cantidad = VALUES(cantidad),
                        precio_unitario = VALUES(precio_unitario),
                        porcentaje_desperdicio = VALUES(porcentaje_desperdicio),
                        idestado = 1"
                );

                foreach ($componentes as $comp) {
                    $tipo = trim($comp['tipo_componente'] ?? '');
                    $desc = trim($comp['descripcion'] ?? '');
                    $unidadComp = trim($comp['unidad'] ?? '');
                    $cantidad = isset($comp['cantidad']) ? (float)$comp['cantidad'] : 0;
                    $precioUnit = isset($comp['precio_unitario']) ? (float)$comp['precio_unitario'] : 0;
                    $desperdicio = isset($comp['porcentaje_desperdicio']) ? (float)$comp['porcentaje_desperdicio'] : 0;
                    $materialId = isset($comp['id_material']) && $comp['id_material'] !== '' ? (int)$comp['id_material'] : null;
                    $componentId = isset($comp['id_componente']) && $comp['id_componente'] !== '' ? (int)$comp['id_componente'] : null;

                    if ($tipo === '' || $desc === '' || $unidadComp === '' || $cantidad <= 0 || $precioUnit < 0) {
                        continue;
                    }

                    if ($tipo === 'material' && !$materialId) {
                        continue;
                    }

                    $stmtUpsert->execute([
                        $componentId,
                        $itemId,
                        $tipo,
                        $materialId,
                        $desc,
                        $unidadComp,
                        $cantidad,
                        $precioUnit,
                        $desperdicio
                    ]);
                }
            }

            $connection->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Ítem actualizado correctamente'
            ]);
            break;

        case 'toggleItem':
            $id = (int)($_GET['id_item'] ?? 0);
            if (!$id) {
                throw new Exception('ID de ítem requerido');
            }

            // Obtener estado actual
            $stmt = $connection->prepare("SELECT idestado FROM items WHERE id_item = ?");
            $stmt->execute([$id]);
            $estadoActual = $stmt->fetchColumn();

            // Cambiar estado
            $nuevoEstado = $estadoActual == 1 ? 0 : 1;
            $stmt = $connection->prepare("UPDATE items SET idestado = ? WHERE id_item = ?");
            $stmt->execute([$nuevoEstado, $id]);

            echo json_encode([
                'success' => true,
                'message' => $nuevoEstado == 1 ? 'Ítem activado correctamente' : 'Ítem desactivado correctamente',
                'nuevo_estado' => $nuevoEstado
            ]);
            break;

        case 'getItemComponents':
            $idItem = (int)($_GET['id_item'] ?? 0);

            if (!$idItem) {
                throw new Exception('ID de ítem requerido');
            }

            $sql = "SELECT
                        ic.id_componente,
                        ic.tipo_componente,
                        ic.descripcion,
                        ic.unidad,
                        ic.cantidad,
                        ic.precio_unitario,
                        ic.porcentaje_desperdicio,
                        ic.id_material,
                        m.cod_material,
                        CAST(m.nombremat AS CHAR) AS nombre_material,
                        m.idunidad,
                        u.unidesc AS unidad_material
                    FROM item_componentes ic
                    LEFT JOIN materiales m ON ic.id_material = m.id_material
                    LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
                    WHERE ic.id_item = ? AND ic.idestado = 1
                    ORDER BY FIELD(ic.tipo_componente, 'material', 'mano_obra', 'equipo', 'transporte', 'otro'), ic.id_componente";

            $stmt = $connection->prepare($sql);
            $stmt->execute([$idItem]);

            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        case 'saveItemComponent':
            $data = getJsonInput();

            $itemId = (int)($data['id_item'] ?? 0);
            $tipo = trim($data['tipo_componente'] ?? '');
            $descripcion = trim($data['descripcion'] ?? '');
            $unidad = trim($data['unidad'] ?? '');
            $cantidad = isset($data['cantidad']) ? (float)$data['cantidad'] : 0;
            $precioUnitario = isset($data['precio_unitario']) ? (float)$data['precio_unitario'] : 0;
            $porcentajeDesperdicio = isset($data['porcentaje_desperdicio']) ? (float)$data['porcentaje_desperdicio'] : 0;
            $materialId = isset($data['id_material']) && $data['id_material'] !== '' ? (int)$data['id_material'] : null;
            $componenteId = isset($data['id_componente']) ? (int)$data['id_componente'] : 0;

            if (!$itemId || $tipo === '' || $descripcion === '' || $unidad === '' || $cantidad <= 0 || $precioUnitario < 0) {
                throw new Exception('Datos insuficientes para guardar el componente.');
            }

            if ($tipo === 'material' && !$materialId) {
                throw new Exception('Debe seleccionar un material válido.');
            }

            if ($componenteId) {
                $sql = "UPDATE item_componentes
                        SET tipo_componente = ?,
                            id_material = ?,
                            descripcion = ?,
                            unidad = ?,
                            cantidad = ?,
                            precio_unitario = ?,
                            porcentaje_desperdicio = ?,
                            idestado = 1
                        WHERE id_componente = ? AND id_item = ?";
                $stmt = $connection->prepare($sql);
                $stmt->execute([
                    $tipo,
                    $materialId,
                    $descripcion,
                    $unidad,
                    $cantidad,
                    $precioUnitario,
                    $porcentajeDesperdicio,
                    $componenteId,
                    $itemId
                ]);
                $idResult = $componenteId;
            } else {
                $sql = "INSERT INTO item_componentes
                            (id_item, tipo_componente, id_material, descripcion, unidad, cantidad, precio_unitario, porcentaje_desperdicio, idestado)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)";
                $stmt = $connection->prepare($sql);
                $stmt->execute([
                    $itemId,
                    $tipo,
                    $materialId,
                    $descripcion,
                    $unidad,
                    $cantidad,
                    $precioUnitario,
                    $porcentajeDesperdicio
                ]);
                $idResult = (int)$connection->lastInsertId();
            }

            echo json_encode([
                'success' => true,
                'message' => 'Componente guardado correctamente',
                'id_componente' => $idResult
            ]);
            break;

        case 'deleteItemComponent':
            $componenteId = (int)($_GET['id_componente'] ?? 0);

            if (!$componenteId) {
                throw new Exception('ID de componente requerido');
            }

            $stmt = $connection->prepare("UPDATE item_componentes SET idestado = 0 WHERE id_componente = ?");
            $stmt->execute([$componenteId]);

            echo json_encode([
                'success' => true,
                'message' => 'Componente eliminado correctamente'
            ]);
            break;

        case 'getItemComposition':
            $itemCompuesto = (int)($_GET['id_item'] ?? 0);

            if (!$itemCompuesto) {
                throw new Exception('ID de ítem compuesto requerido');
            }

            $sql = "SELECT
                        ic.id_composicion,
                        ic.id_item_compuesto,
                        ic.id_item_componente,
                        ic.cantidad,
                        ic.orden,
                        ic.es_referencia,
                        i.codigo_item,
                        i.nombre_item,
                        i.unidad
                    FROM item_composicion ic
                    INNER JOIN items i ON ic.id_item_componente = i.id_item
                    WHERE ic.id_item_compuesto = ? AND ic.idestado = 1
                    ORDER BY ic.orden ASC, i.codigo_item ASC";

            $stmt = $connection->prepare($sql);
            $stmt->execute([$itemCompuesto]);

            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        case 'saveItemComposition':
            $data = getJsonInput();

            $idComposicion = isset($data['id_composicion']) ? (int)$data['id_composicion'] : 0;
            $idItemCompuesto = (int)($data['id_item_compuesto'] ?? 0);
            $idItemComponente = (int)($data['id_item_componente'] ?? 0);
            $cantidad = isset($data['cantidad']) ? (float)$data['cantidad'] : 0;
            $orden = isset($data['orden']) ? (int)$data['orden'] : 1;
            $esReferencia = isset($data['es_referencia']) ? (int)$data['es_referencia'] : 0;

            if (!$idItemCompuesto || !$idItemComponente || $cantidad <= 0) {
                throw new Exception('Datos insuficientes para guardar la composición.');
            }

            if ($idItemCompuesto === $idItemComponente) {
                throw new Exception('Un ítem no puede referenciarse a sí mismo.');
            }

            if ($idComposicion) {
                $sql = "UPDATE item_composicion
                        SET id_item_componente = ?,
                            cantidad = ?,
                            orden = ?,
                            es_referencia = ?,
                            idestado = 1,
                            fechaupdate = NOW()
                        WHERE id_composicion = ? AND id_item_compuesto = ?";
                $stmt = $connection->prepare($sql);
                $stmt->execute([
                    $idItemComponente,
                    $cantidad,
                    $orden,
                    $esReferencia,
                    $idComposicion,
                    $idItemCompuesto
                ]);
                $idResult = $idComposicion;
            } else {
                $sql = "INSERT INTO item_composicion
                            (id_item_compuesto, id_item_componente, cantidad, nivel, observaciones, idusuario, fechareg, idestado, orden, porcentaje_desperdicio, es_referencia)
                        VALUES (?, ?, ?, 1, NULL, 1, NOW(), 1, ?, 0, ?)";
                $stmt = $connection->prepare($sql);
                $stmt->execute([
                    $idItemCompuesto,
                    $idItemComponente,
                    $cantidad,
                    $orden,
                    $esReferencia
                ]);
                $idResult = (int)$connection->lastInsertId();
            }

            echo json_encode([
                'success' => true,
                'message' => 'Composición guardada correctamente',
                'id_composicion' => $idResult
            ]);
            break;

        case 'deleteItemComposition':
            $idComposicion = (int)($_GET['id_composicion'] ?? 0);

            if (!$idComposicion) {
                throw new Exception('ID de composición requerido');
            }

            $stmt = $connection->prepare("UPDATE item_composicion SET idestado = 0 WHERE id_composicion = ?");
            $stmt->execute([$idComposicion]);

            echo json_encode([
                'success' => true,
                'message' => 'Ítem hijo eliminado correctamente'
            ]);
            break;

        case 'createItemWithRelations':
            $payload = getJsonInput();
            $itemData = $payload['item'] ?? [];

            $codigo = trim($itemData['codigo_item'] ?? '');
            $nombre = trim($itemData['nombre_item'] ?? '');
            $unidad = trim($itemData['unidad'] ?? '');
            $descripcion = trim($itemData['descripcion'] ?? '');
            $esCompuesto = !empty($itemData['es_compuesto']) ? 1 : 0;
            $idPadre = isset($itemData['id_item_padre']) && $itemData['id_item_padre'] !== '' ? (int)$itemData['id_item_padre'] : null;
            $usuarioId = (int)($itemData['idusuario'] ?? 1);
            $esAPU = isset($itemData['es_apu']) ? (int)$itemData['es_apu'] : 1;
            $idTipoItem = isset($itemData['id_tipo_item']) && $itemData['id_tipo_item'] !== '' ? (int)$itemData['id_tipo_item'] : null;

            if ($codigo === '' || $nombre === '' || $unidad === '') {
                throw new Exception('Datos insuficientes para crear el ítem.');
            }

            $componentes = $payload['componentes'] ?? [];
            $composicion = $payload['composicion'] ?? [];
            $precio = $payload['precio'] ?? null;

            $connection->beginTransaction();

            $stmtInsert = $connection->prepare(
                "INSERT INTO items 
                    (codigo_item, nombre_item, unidad, descripcion, fecha_creacion, idusuario, idestado, es_compuesto, id_item_padre, es_apu, nivel, ruta_jerarquia, id_tipo_item)
                 VALUES (?, ?, ?, ?, NOW(), ?, 1, ?, ?, ?, 1, NULL, ?)"
            );
            $stmtInsert->execute([
                $codigo,
                $nombre,
                $unidad,
                $descripcion,
                $usuarioId,
                $esCompuesto,
                $idPadre,
                $esAPU,
                $idTipoItem
            ]);

            $itemId = (int)$connection->lastInsertId();

            if (!empty($componentes)) {
                $stmtComponent = $connection->prepare(
                    "INSERT INTO item_componentes
                        (id_item, tipo_componente, id_material, descripcion, unidad, cantidad, precio_unitario, porcentaje_desperdicio, idestado)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
                );

                foreach ($componentes as $comp) {
                    $tipoComp = trim($comp['tipo_componente'] ?? '');
                    $descripcionComp = trim($comp['descripcion'] ?? '');
                    $unidadComp = trim($comp['unidad'] ?? '');
                    $cantidadComp = isset($comp['cantidad']) ? (float)$comp['cantidad'] : 0;
                    $precioComp = isset($comp['precio_unitario']) ? (float)$comp['precio_unitario'] : 0;
                    $desperdicioComp = isset($comp['porcentaje_desperdicio']) ? (float)$comp['porcentaje_desperdicio'] : 0;
                    $materialComp = isset($comp['id_material']) && $comp['id_material'] !== '' ? (int)$comp['id_material'] : null;

                    if ($tipoComp === '' || $descripcionComp === '' || $unidadComp === '' || $cantidadComp <= 0) {
                        continue;
                    }

                    if ($tipoComp === 'material' && !$materialComp) {
                        continue;
                    }

                    $stmtComponent->execute([
                        $itemId,
                        $tipoComp,
                        $materialComp,
                        $descripcionComp,
                        $unidadComp,
                        $cantidadComp,
                        $precioComp,
                        $desperdicioComp
                    ]);
                }
            }

            if (!empty($composicion)) {
                $stmtComposicion = $connection->prepare(
                    "INSERT INTO item_composicion
                        (id_item_compuesto, id_item_componente, cantidad, nivel, observaciones, idusuario, fechareg, idestado, orden, porcentaje_desperdicio, es_referencia)
                     VALUES (?, ?, ?, 1, NULL, ?, NOW(), 1, ?, 0, ?)"
                );

                foreach ($composicion as $comp) {
                    $idItemComponente = (int)($comp['id_item_componente'] ?? 0);
                    $cantidadCompuesta = isset($comp['cantidad']) ? (float)$comp['cantidad'] : 0;
                    $orden = isset($comp['orden']) ? (int)$comp['orden'] : 1;
                    $esReferencia = isset($comp['es_referencia']) ? (int)$comp['es_referencia'] : 0;

                    if (!$idItemComponente || $cantidadCompuesta <= 0 || $idItemComponente === $itemId) {
                        continue;
                    }

                    $stmtComposicion->execute([
                        $itemId,
                        $idItemComponente,
                        $cantidadCompuesta,
                        $usuarioId,
                        $orden,
                        $esReferencia
                    ]);
                }
            }

            if (!empty($precio) && isset($precio['valor']) && (float)$precio['valor'] > 0) {
                $valor = (float)$precio['valor'];
                $fecha = !empty($precio['fecha']) ? $precio['fecha'] : date('Y-m-d');
                $observaciones = trim($precio['observaciones'] ?? '');

                $connection->prepare("UPDATE item_precio SET estado = 0 WHERE id_item = ?")->execute([$itemId]);

                $stmtPrecio = $connection->prepare(
                    "INSERT INTO item_precio (id_item, valor, fecha, estado, observaciones, idusuario, fechareg, fechaupdate)
                     VALUES (?, ?, ?, 1, ?, ?, NOW(), NOW())"
                );
                $stmtPrecio->execute([$itemId, $valor, $fecha, $observaciones, $usuarioId]);
            }

            $connection->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Ítem y componentes creados correctamente',
                'id_item' => $itemId
            ]);
            break;

        case 'getItemPriceHistory':
            $idItem = (int)($_GET['id_item'] ?? 0);
            if (!$idItem) {
                throw new Exception('ID de ítem requerido');
            }

            $sql = "SELECT id_item_precio, valor, fecha, estado, observaciones, idusuario, fechareg
                    FROM item_precio
                    WHERE id_item = ?
                    ORDER BY fecha DESC, id_item_precio DESC";

            $stmt = $connection->prepare($sql);
            $stmt->execute([$idItem]);

            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        case 'saveItemPrice':
            $data = getJsonInput();
            $idItem = (int)($data['id_item'] ?? 0);
            $valor = isset($data['valor']) ? (float)$data['valor'] : 0;
            $fecha = !empty($data['fecha']) ? $data['fecha'] : date('Y-m-d');
            $observaciones = trim($data['observaciones'] ?? '');
            $usuarioId = (int)($data['idusuario'] ?? 1);

            if (!$idItem || $valor <= 0) {
                throw new Exception('Datos insuficientes para registrar el precio.');
            }

            $connection->beginTransaction();
            $connection->prepare("UPDATE item_precio SET estado = 0 WHERE id_item = ?")->execute([$idItem]);

            $stmt = $connection->prepare(
                "INSERT INTO item_precio (id_item, valor, fecha, estado, observaciones, idusuario, fechareg, fechaupdate)
                 VALUES (?, ?, ?, 1, ?, ?, NOW(), NOW())"
            );
            $stmt->execute([$idItem, $valor, $fecha, $observaciones, $usuarioId]);

            $connection->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Precio de ítem registrado correctamente'
            ]);
            break;

        case 'getMaterialTypes':
            $stmt = $connection->query("SELECT id_tipo_material, desc_tipo FROM tipo_material WHERE estado = 1 ORDER BY desc_tipo");
            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        case 'getUnits':
            $stmt = $connection->query("SELECT idunidad, unidesc FROM gr_unidad WHERE id_estado = 1 ORDER BY unidesc");
            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Acción no válida'
            ]);
    }
} catch (Exception $e) {
    if ($connection->inTransaction()) {
        $connection->rollBack();
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

exit;

<?php
// c:/xampp/htdocs/sgigescon/app_json/importador_apus.php

require __DIR__ . '/../config/database.php';

$db = new \Database();
$conn = $db->getConnection();

$jsonPath = __DIR__ . '/items_limpios.json';
if (!file_exists($jsonPath)) {
    die("❌ No se encuentra el archivo items_limpios.json\n");
}

$items = json_decode(file_get_contents($jsonPath), true);
if (!$items) {
    die("❌ Error al decodificar el JSON\n");
}

echo "🚀 Iniciando importación de " . count($items) . " ítems...\n";

// Preparar consultas para velocidad
$stmtCheckItem = $conn->prepare("SELECT id_item FROM items WHERE codigo_item = ?");
$stmtInsertItem = $conn->prepare("INSERT INTO items (codigo_item, nombre_item, unidad, descripcion, fecha_creacion, idusuario, idestado, es_compuesto, es_apu) VALUES (?, ?, 'M3', 'Importado desde Excel', NOW(), 1, 1, 0, 1)");

$stmtGetMaterial = $conn->prepare("
    SELECT m.id_material, m.nombremat, u.unidesc, mp.valor 
    FROM materiales m 
    LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad 
    LEFT JOIN material_precio mp ON m.id_material = mp.id_material AND mp.estado = 1
    WHERE m.cod_material = ?
    LIMIT 1
");

$stmtInsertComp = $conn->prepare("
    INSERT INTO item_componentes (id_item, tipo_componente, id_material, descripcion, unidad, cantidad, precio_unitario, porcentaje_desperdicio, idestado) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
");

$conn->beginTransaction();

try {
    $count = 0;
    foreach ($items as $item) {
        $codigoItem = $item['codigo'];
        $nombreItem = $item['nombre'];

        // 1. Verificar o insertar el Ítem (APU)
        $stmtCheckItem->execute([$codigoItem]);
        $idItem = $stmtCheckItem->fetchColumn();

        if (!$idItem) {
            $stmtInsertItem->execute([$codigoItem, $nombreItem]);
            $idItem = $conn->lastInsertId();
        }

        // Limpiar componentes previos para evitar duplicados
        $conn->prepare("DELETE FROM item_componentes WHERE id_item = ?")->execute([$idItem]);

        // 2. Insertar Componentes
        foreach ($item['componentes'] as $comp) {
            $stmtGetMaterial->execute([$comp['codigo']]);
            $matData = $stmtGetMaterial->fetch(PDO::FETCH_ASSOC);

            if ($matData) {
                // Si es mano de obra o equipo, su id_material es el mismo ID de la tabla materiales
                $stmtInsertComp->execute([
                    $idItem,
                    $comp['tipo'],
                    $matData['id_material'],
                    $matData['nombremat'],
                    $matData['unidesc'] ?: 'UND',
                    $comp['cantidad'],
                    $matData['valor'] ?: 0,
                    $comp['desperdicio']
                ]);
            }
        }
        $count++;
        if ($count % 10 === 0) echo "✅ Procesados $count items...\n";
    }

    $conn->commit();
    echo "\n🔥 ¡IMPORTACIÓN COMPLETADA CON ÉXITO! ($count items) 🔥\n";

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}

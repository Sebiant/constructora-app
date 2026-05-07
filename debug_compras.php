<?php
// Archivo para depurar el problema de cantidad_solicitada en compras
// Acceder via: http://localhost/sgigescon/debug_compras.php

require_once 'config.php';

try {
    // Conexión a la base de datos
    $connection = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>🔍 Depuración del problema de cantidad_solicitada</h1>";
    echo "<h2>Investigando el valor 33.86 cuando debería ser 16.93</h2>";
    
    // 1. Ver qué hay en log_recepciones para las compras #1 y #2
    echo "<h3>1. Datos en log_recepciones (Compras #1 y #2)</h3>";
    $sql1 = "SELECT 
        lr.id_compra,
        lr.id_det_pedido,
        lr.descripcion,
        lr.cantidad_recibida,
        lr.precio_unitario,
        lr.subtotal_item
    FROM log_recepciones lr
    WHERE lr.id_compra IN (1, 2)
    ORDER BY lr.id_compra, lr.id_det_pedido";
    
    $stmt1 = $connection->query($sql1);
    $result1 = $stmt1->fetchAll(PDO::FETCH_ASSOC);
    
    if ($result1) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID Compra</th><th>ID Det Pedido</th><th>Descripción</th><th>Cantidad Recibida</th><th>Precio Unitario</th><th>Subtotal</th>";
        echo "</tr>";
        foreach ($result1 as $row) {
            echo "<tr>";
            echo "<td>{$row['id_compra']}</td>";
            echo "<td>{$row['id_det_pedido']}</td>";
            echo "<td>{$row['descripcion']}</td>";
            echo "<td style='text-align: right; font-weight: bold;'>{$row['cantidad_recibida']}</td>";
            echo "<td style='text-align: right;'>${$row['precio_unitario']}</td>";
            echo "<td style='text-align: right;'>${$row['subtotal_item']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: red;'>❌ No se encontraron datos en log_recepciones</p>";
    }
    
    // 2. Ver qué hay en ordenes_compra_detalle
    echo "<h3>2. Datos en ordenes_compra_detalle (CAMIONETA DE ESTACAS)</h3>";
    $sql2 = "SELECT 
        ocd.id_det_pedido,
        ocd.descripcion,
        ocd.cantidad_solicitada,
        ocd.cantidad_recibida,
        ocd.precio_unitario,
        ocd.subtotal,
        ocd.id_orden_compra
    FROM ordenes_compra_detalle ocd
    WHERE ocd.descripcion LIKE '%CAMIONETA DE ESTACAS%'
    ORDER BY ocd.id_det_pedido";
    
    $stmt2 = $connection->query($sql2);
    $result2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    if ($result2) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID Det Pedido</th><th>Descripción</th><th>Cantidad Solicitada</th><th>Cantidad Recibida</th><th>Precio Unitario</th><th>Subtotal</th><th>ID Orden Compra</th>";
        echo "</tr>";
        foreach ($result2 as $row) {
            $color = $row['cantidad_solicitada'] == 33.86 ? 'background: #ffcccc;' : '';
            echo "<tr style='$color'>";
            echo "<td>{$row['id_det_pedido']}</td>";
            echo "<td>{$row['descripcion']}</td>";
            echo "<td style='text-align: right; font-weight: bold; color: red;'>{$row['cantidad_solicitada']}</td>";
            echo "<td style='text-align: right;'>{$row['cantidad_recibida']}</td>";
            echo "<td style='text-align: right;'>${$row['precio_unitario']}</td>";
            echo "<td style='text-align: right;'>${$row['subtotal']}</td>";
            echo "<td>{$row['id_orden_compra']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: red;'>❌ No se encontraron datos en ordenes_compra_detalle</p>";
    }
    
    // 3. Ver la orden de compra original
    echo "<h3>3. Orden de compra original (OC-2026-0001)</h3>";
    $sql3 = "SELECT 
        oc.id_orden_compra,
        oc.numero_orden,
        oc.fecha_orden,
        oc.id_pedido
    FROM ordenes_compra oc
    WHERE oc.numero_orden = 'OC-2026-0001'";
    
    $stmt3 = $connection->query($sql3);
    $result3 = $stmt3->fetch(PDO::FETCH_ASSOC);
    
    if ($result3) {
        echo "<table border='1' style='border-collapse: collapse; width: 50%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID Orden Compra</th><th>Número Orden</th><th>Fecha Orden</th><th>ID Pedido</th>";
        echo "</tr>";
        echo "<tr>";
        echo "<td>{$result3['id_orden_compra']}</td>";
        echo "<td>{$result3['numero_orden']}</td>";
        echo "<td>{$result3['fecha_orden']}</td>";
        echo "<td>{$result3['id_pedido']}</td>";
        echo "</tr>";
        echo "</table>";
    } else {
        echo "<p style='color: red;'>❌ No se encontró la orden de compra</p>";
    }
    
    // 4. Ver los detalles del pedido original
    echo "<h3>4. Detalles del pedido original (CAMIONETA DE ESTACAS)</h3>";
    $sql4 = "SELECT 
        pd.id_det_pedido,
        pd.descripcion,
        pd.cantidad,
        pd.precio_unitario,
        pd.subtotal
    FROM pedidos_detalle pd
    WHERE pd.descripcion LIKE '%CAMIONETA DE ESTACAS%'
    ORDER BY pd.id_det_pedido";
    
    $stmt4 = $connection->query($sql4);
    $result4 = $stmt4->fetchAll(PDO::FETCH_ASSOC);
    
    if ($result4) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID Det Pedido</th><th>Descripción</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th>";
        echo "</tr>";
        foreach ($result4 as $row) {
            echo "<tr>";
            echo "<td>{$row['id_det_pedido']}</td>";
            echo "<td>{$row['descripcion']}</td>";
            echo "<td style='text-align: right; font-weight: bold; color: green;'>{$row['cantidad']}</td>";
            echo "<td style='text-align: right;'>${$row['precio_unitario']}</td>";
            echo "<td style='text-align: right;'>${$row['subtotal']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: red;'>❌ No se encontraron datos en pedidos_detalle</p>";
    }
    
    // 5. Ver si hay duplicados
    echo "<h3>5. Verificación de duplicados en ordenes_compra_detalle</h3>";
    $sql5 = "SELECT 
        ocd.id_det_pedido,
        COUNT(*) as num_registros,
        SUM(ocd.cantidad_solicitada) as suma_solicitada,
        AVG(ocd.cantidad_solicitada) as promedio_solicitada,
        MIN(ocd.cantidad_solicitada) as min_solicitada,
        MAX(ocd.cantidad_solicitada) as max_solicitada
    FROM ordenes_compra_detalle ocd
    WHERE ocd.descripcion LIKE '%CAMIONETA DE ESTACAS%'
    GROUP BY ocd.id_det_pedido";
    
    $stmt5 = $connection->query($sql5);
    $result5 = $stmt5->fetchAll(PDO::FETCH_ASSOC);
    
    if ($result5) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID Det Pedido</th><th>N° Registros</th><th>Suma Solicitada</th><th>Promedio</th><th>Min</th><th>Max</th>";
        echo "</tr>";
        foreach ($result5 as $row) {
            $color = $row['num_registros'] > 1 ? 'background: #ffcccc;' : '';
            echo "<tr style='$color'>";
            echo "<td>{$row['id_det_pedido']}</td>";
            echo "<td style='text-align: center; font-weight: bold;'>{$row['num_registros']}</td>";
            echo "<td style='text-align: right; font-weight: bold;'>{$row['suma_solicitada']}</td>";
            echo "<td style='text-align: right;'>{$row['promedio_solicitada']}</td>";
            echo "<td style='text-align: right;'>{$row['min_solicitada']}</td>";
            echo "<td style='text-align: right;'>{$row['max_solicitada']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        if ($row['num_registros'] > 1) {
            echo "<p style='color: red; font-weight: bold;'>⚠️ ¡HAY DUPLICADOS! Este podría ser el origen del problema.</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ No se encontraron datos</p>";
    }
    
    // 6. Simulación del SQL actual del controller
    echo "<h3>6. Simulación del SQL actual del controller</h3>";
    echo "<p style='color: blue;'>Este es el SQL que ejecuta getCompraDetalle:</p>";
    
    $sql6 = "SELECT 
        lr.id_compra,
        lr.id_det_pedido,
        lr.descripcion,
        lr.unidad,
        ocd.cantidad_solicitada,
        lr.cantidad_recibida,
        ocd.cantidad_recibida as cantidad_acumulada_total,
        (ocd.cantidad_solicitada - ocd.cantidad_recibida) AS cantidad_faltante,
        lr.precio_unitario,
        lr.subtotal_item AS subtotal
    FROM log_recepciones lr
    INNER JOIN ordenes_compra_detalle ocd ON lr.id_det_pedido = ocd.id_det_pedido AND lr.id_orden_compra = ocd.id_orden_compra
    WHERE lr.id_compra = 1
    ORDER BY lr.id_det_pedido ASC";
    
    echo "<pre style='background: #f5f5f5; padding: 10px; border: 1px solid #ccc;'>";
    echo htmlspecialchars($sql6);
    echo "</pre>";
    
    $stmt6 = $connection->query($sql6);
    $result6 = $stmt6->fetchAll(PDO::FETCH_ASSOC);
    
    if ($result6) {
        echo "<h4>Resultado del SQL actual:</h4>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID Compra</th><th>ID Det Pedido</th><th>Descripción</th><th>Cantidad Solicitada</th><th>Recibida Esta Compra</th><th>Acumulado Total</th><th>Faltante</th><th>Precio</th><th>Subtotal</th>";
        echo "</tr>";
        foreach ($result6 as $row) {
            echo "<tr>";
            echo "<td>{$row['id_compra']}</td>";
            echo "<td>{$row['id_det_pedido']}</td>";
            echo "<td>{$row['descripcion']}</td>";
            echo "<td style='text-align: right; font-weight: bold; color: red;'>{$row['cantidad_solicitada']}</td>";
            echo "<td style='text-align: right;'>{$row['cantidad_recibida']}</td>";
            echo "<td style='text-align: right;'>{$row['cantidad_acumulada_total']}</td>";
            echo "<td style='text-align: right;'>{$row['cantidad_faltante']}</td>";
            echo "<td style='text-align: right;'>${$row['precio_unitario']}</td>";
            echo "<td style='text-align: right;'>${$row['subtotal']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    echo "<hr>";
    echo "<h2>🎯 Análisis y Recomendaciones</h2>";
    echo "<div style='background: #f9f9f9; padding: 15px; border-left: 4px solid #007bff;'>";
    echo "<p><strong>Posibles problemas identificados:</strong></p>";
    echo "<ul>";
    echo "<li>Si hay <strong>duplicados</strong> en ordenes_compra_detalle, el JOIN podría estar sumando valores</li>";
    echo "<li>Si <strong>cantidad_solicitada = 33.86</strong> pero debería ser <strong>16.93</strong>, hay un error en los datos</li>";
    echo "<li>El valor correcto debería venir de <strong>pedidos_detalle.cantidad</strong> (16.93)</li>";
    echo "</ul>";
    echo "<p><strong>Solución posible:</strong></p>";
    echo "<p>Usar <code>pd.cantidad</code> en lugar de <code>ocd.cantidad_solicitada</code> para obtener el valor original del pedido.</p>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<h2 style='color: red;'>❌ Error: " . $e->getMessage() . "</h2>";
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
table { margin: 10px 0; }
th, td { padding: 8px; text-align: left; }
h1, h2, h3 { color: #333; }
</style>

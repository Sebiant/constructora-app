<?php
// Archivo de depuración para identificar el problema
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔍 Depuración de Órdenes de Compra</h1>";

// 1. Verificar conexión a BD
echo "<h2>1. Conexión a Base de Datos</h2>";
try {
    require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';
    $db = new Database();
    $connection = $db->getConnection();
    echo "<p style='color: green;'>✅ Conexión a BD exitosa</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error de conexión: " . $e->getMessage() . "</p>";
    die();
}

// 2. Verificar tablas
echo "<h2>2. Verificación de Tablas</h2>";
$tables = ['ordenes_compra', 'provedores', 'pedidos'];
foreach ($tables as $table) {
    try {
        $stmt = $connection->prepare("SELECT COUNT(*) as count FROM $table");
        $stmt->execute();
        $count = $stmt->fetchColumn();
        echo "<p style='color: green;'>✅ Tabla '$table': $count registros</p>";
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error en tabla '$table': " . $e->getMessage() . "</p>";
    }
}

// 3. Probar consulta SQL directa
echo "<h2>3. Prueba de Consulta SQL</h2>";
try {
    $sql = "SELECT 
                oc.id_orden_compra,
                oc.numero_orden,
                oc.id_pedido,
                p.nombre as nombre_proveedor,
                oc.fecha_orden,
                oc.estado,
                oc.total
            FROM ordenes_compra oc
            LEFT JOIN provedores p ON oc.id_provedor = p.id_provedor
            ORDER BY oc.fecha_orden DESC";
    
    $stmt = $connection->prepare($sql);
    $stmt->execute();
    $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p style='color: green;'>✅ Consulta SQL exitosa: " . count($ordenes) . " resultados</p>";
    
    // Mostrar primeros resultados
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Número</th><th>Pedido</th><th>Proveedor</th><th>Estado</th><th>Total</th>";
    echo "</tr>";
    
    foreach ($ordenes as $orden) {
        echo "<tr>";
        echo "<td>" . $orden['id_orden_compra'] . "</td>";
        echo "<td>" . $orden['numero_orden'] . "</td>";
        echo "<td>" . $orden['id_pedido'] . "</td>";
        echo "<td>" . $orden['nombre_proveedor'] . "</td>";
        echo "<td>" . $orden['estado'] . "</td>";
        echo "<td>$" . number_format($orden['total'], 2) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error en consulta SQL: " . $e->getMessage() . "</p>";
}

// 4. Probar API directamente
echo "<h2>4. Prueba de API</h2>";
try {
    // Simular llamada GET a la API
    $_GET['action'] = 'getOrdenesCompra';
    
    // Incluir el controlador
    ob_start();
    include $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/OrdenesCompra/Interfaces/OrdenesCompraController.php';
    $output = ob_get_clean();
    
    echo "<p style='color: green;'>✅ API ejecutada</p>";
    echo "<h3>Respuesta de la API:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>";
    echo htmlspecialchars($output);
    echo "</pre>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error en API: " . $e->getMessage() . "</p>";
}

// 5. Verificar archivo JavaScript
echo "<h2>5. Verificación de Archivos</h2>";
$files = [
    'Controller' => $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/OrdenesCompra/Interfaces/OrdenesCompraController.php',
    'View PHP' => $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/OrdenesCompra/Interfaces/Views/ordenesCompraView.php',
    'View JS' => $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/OrdenesCompra/Interfaces/Views/ordenesCompraView.js'
];

foreach ($files as $name => $file) {
    if (file_exists($file)) {
        echo "<p style='color: green;'>✅ $name: " . basename($file) . " (" . filesize($file) . " bytes)</p>";
    } else {
        echo "<p style='color: red;'>❌ $name: " . basename($file) . " (NO EXISTE)</p>";
    }
}

// 6. Verificar configuración de errores
echo "<h2>6. Configuración de PHP</h2>";
echo "<p>PHP Version: " . PHP_VERSION . "</p>";
echo "<p>Memory Limit: " . ini_get('memory_limit') . "</p>";
echo "<p>Max Execution Time: " . ini_get('max_execution_time') . "</p>";
echo "<p>Error Reporting: " . error_reporting() . "</p>";

echo "<hr>";
echo "<h3>🎯 Prueba Final</h3>";
echo "<p>Si todo está en verde, el problema podría estar en:</p>";
echo "<ul>";
echo "<li>El archivo JavaScript no se está cargando correctamente</li>";
echo "<li>Hay un error en el frontend que no estamos viendo</li>";
echo "<li>La llamada AJAX está fallando por otro motivo</li>";
echo "</ul>";

echo "<p><a href='test_api_ordenes.php' target='_blank'>🔗 Probar API directamente</a></p>";
echo "<p><a href='/sgigescomnew/ejemplos/ordenesCompraComponent.php' target='_blank'>🔗 Abrir Componente</a></p>";
?>

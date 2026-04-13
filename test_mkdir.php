<?php
/**
 * Script para probar la creación de directorios paso a paso
 */

header('Content-Type: text/html; charset=utf-8');

echo '<h1>🔧 Test de Creación de Directorios</h1>';

$basePath = __DIR__;
$presupuestoId = '1';
$itemId = '1265';

// Rutas
$dirBase = $basePath . '/uploads/pedidos_anexos/';
$dirPresupuesto = $dirBase . $presupuestoId . '/';
$dirItem = $dirPresupuesto . $itemId . '/';

echo '<h2>Rutas calculadas:</h2>';
echo '<pre>';
echo "dirBase: $dirBase\n";
echo "dirPresupuesto: $dirPresupuesto\n";
echo "dirItem: $dirItem\n";
echo '</pre>';

// Verificar cada nivel
function verificarYCrear($ruta, $nombre) {
    echo "<h3>Paso: $nombre</h3>";
    echo "<p>Ruta: <code>$ruta</code></p>";

    if (file_exists($ruta)) {
        echo '<p class="ok">✅ Ya existe</p>';
        return true;
    }

    echo '<p>⏳ Intentando crear...</p>';

    $creado = mkdir($ruta, 0755, true);

    if ($creado) {
        echo '<p class="ok">✅ Creado exitosamente</p>';

        // Verificar inmediatamente
        clearstatcache(true);
        if (file_exists($ruta) && is_dir($ruta)) {
            echo '<p class="ok">✅ Verificación: existe y es directorio</p>';
            return true;
        } else {
            echo '<p class="error">❌ Verificación fallida - no aparece después de crear</p>';
            echo '<p>file_exists: ' . (file_exists($ruta) ? 'true' : 'false') . '</p>';
            echo '<p>is_dir: ' . (is_dir($ruta) ? 'true' : 'false') . '</p>';
            return false;
        }
    } else {
        $error = error_get_last();
        echo '<p class="error">❌ ERROR al crear</p>';
        echo '<pre>' . print_r($error, true) . '</pre>';
        return false;
    }
}

// Ejecutar creación paso a paso
echo '<h2>Proceso de creación:</h2>';

$ok1 = verificarYCrear($dirBase, 'dirBase');
$ok2 = verificarYCrear($dirPresupuesto, 'dirPresupuesto');
$ok3 = verificarYCrear($dirItem, 'dirItem');

// Resultado final
echo '<h2>Resultado:</h2>';
if ($ok1 && $ok2 && $ok3) {
    echo '<p class="ok" style="font-size:18px;">✅ TODOS LOS DIRECTORIOS CREADOS</p>';
} else {
    echo '<p class="error" style="font-size:18px;">❌ FALLÓ LA CREACIÓN</p>';
}

// Verificar con scandir
echo '<h2>Contenido final de pedidos_anexos:</h2>';
if (is_dir($dirBase)) {
    function mostrarArbol($dir, $nivel = 0) {
        $items = @scandir($dir);
        if ($items) {
            foreach ($items as $item) {
                if ($item == '.' || $item == '..') continue;
                $indent = str_repeat('&nbsp;&nbsp;', $nivel);
                $ruta = $dir . $item;
                if (is_dir($ruta . '/')) {
                    echo "$indent📁 $item/<br>";
                    mostrarArbol($ruta . '/', $nivel + 1);
                } else {
                    echo "$indent📄 $item<br>";
                }
            }
        }
    }
    mostrarArbol($dirBase);
}

// Enlace para borrar
echo '<p><a href="?borrar=1">🗑️ Borrar este script</a></p>';
if (isset($_GET['borrar'])) {
    @unlink(__FILE__);
    echo '<p>Script borrado.</p>';
}
?>
<style>
.ok { color: green; font-weight: bold; }
.error { color: red; font-weight: bold; }
pre { background: #f0f0f0; padding: 10px; overflow: auto; }
</style>

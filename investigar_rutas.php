<?php
/**
 * Script para investigar dónde están realmente los archivos
 */

header('Content-Type: text/html; charset=utf-8');

echo '<h1>🔍 Investigación de Rutas de Anexos</h1>';

// Ruta base del proyecto
$basePath = __DIR__;
echo '<h2>Ruta base del script:</h2>';
echo '<code>' . $basePath . '</code>';

// Intentar encontrar el directorio uploads
$posiblesRutas = [
    $basePath . '/uploads/',
    $basePath . '/../uploads/',
    $basePath . '/../../uploads/',
    '/home/gesconjm/public_html/sgigescon/uploads/',
    dirname(__DIR__) . '/uploads/',
    realpath(__DIR__ . '/uploads/'),
];

echo '<h2>2. Buscando directorio uploads/ en diferentes rutas:</h2>';
echo '<table border="1" cellpadding="5">';
echo '<tr><th>Ruta probada</th><th>¿Existe?</th><th>Tipo</th></tr>';

foreach ($posiblesRutas as $ruta) {
    $existe = file_exists($ruta) ? 'SÍ' : 'NO';
    $tipo = is_dir($ruta) ? 'Directorio' : (is_file($ruta) ? 'Archivo' : 'N/A');
    echo '<tr>';
    echo '<td><code>' . htmlspecialchars($ruta) . '</code></td>';
    echo '<td>' . $existe . '</td>';
    echo '<td>' . $tipo . '</td>';
    echo '</tr>';
}
echo '</table>';

// Buscar recursivamente desde la raíz del proyecto
echo '<h2>3. Buscando directorio "pedidos_anexos" recursivamente:</h2>';
function buscarDirectorio($dir, $nombreBuscado, $nivel = 0) {
    if ($nivel > 3) return; // Limitar profundidad

    if (is_dir($dir)) {
        $items = @scandir($dir);
        if ($items) {
            foreach ($items as $item) {
                if ($item == '.' || $item == '..') continue;

                $rutaCompleta = $dir . '/' . $item;
                if ($item == $nombreBuscado && is_dir($rutaCompleta)) {
                    echo '<p class="ok">✅ Encontrado: <code>' . htmlspecialchars($rutaCompleta) . '</code></p>';
                    // Mostrar contenido
                    $subItems = scandir($rutaCompleta);
                    echo '<ul>';
                    foreach ($subItems as $sub) {
                        if ($sub != '.' && $sub != '..') {
                            echo '<li>' . htmlspecialchars($sub) . '</li>';
                        }
                    }
                    echo '</ul>';
                }
                if (is_dir($rutaCompleta) && $nivel < 3) {
                    buscarDirectorio($rutaCompleta, $nombreBuscado, $nivel + 1);
                }
            }
        }
    }
}

buscarDirectorio($basePath, 'pedidos_anexos');

// Explorar en detalle el directorio pedidos_anexos
$dirAnexos = $basePath . '/uploads/pedidos_anexos/';
echo '<h2>3.5. Exploración detallada de ' . htmlspecialchars($dirAnexos) . ':</h2>';
if (is_dir($dirAnexos)) {
    function explorarDirectorio($dir, $nivel = 0) {
        $indent = str_repeat('&nbsp;&nbsp;', $nivel * 2);
        $items = @scandir($dir);
        if ($items) {
            foreach ($items as $item) {
                if ($item == '.' || $item == '..') continue;
                $ruta = $dir . '/' . $item;
                if (is_dir($ruta)) {
                    echo $indent . '📁 <strong>' . htmlspecialchars($item) . '/</strong><br>';
                    // Siempre expandir para ver todo el contenido
                    explorarDirectorio($ruta, $nivel + 1);
                } else {
                    echo $indent . '📄 ' . htmlspecialchars($item) . ' (' . filesize($ruta) . ' bytes)<br>';
                }
            }
        }
    }
    explorarDirectorio($dirAnexos, 0);
} else {
    echo '<p class="error">Directorio no encontrado</p>';
}

// Verificar contenido del directorio 1/
$dir1 = $dirAnexos . '1/';
echo '<h2>3.6. Contenido del directorio 1/:</h2>';
echo '<p>Ruta: <code>' . htmlspecialchars($dir1) . '</code></p>';
if (is_dir($dir1)) {
    $items = scandir($dir1);
    echo '<p>Contenido:</p><ul>';
    foreach ($items as $item) {
        if ($item != '.' && $item != '..') {
            $ruta = $dir1 . $item;
            $tipo = is_dir($ruta) ? '📁 Directorio' : '📄 Archivo (' . filesize($ruta) . ' bytes)';
            echo '<li><strong>' . htmlspecialchars($item) . '</strong> - ' . $tipo . '</li>';
        }
    }
    echo '</ul>';
} else {
    echo '<p class="error">❌ El directorio NO existe</p>';
}

// Verificar específicamente la ruta del presupuesto 1 y item 1265
$dir1265 = $dirAnexos . '1/1265/';
echo '<h2>3.7. Verificación específica de directorio 1/1265:</h2>';
echo '<p>Ruta: <code>' . htmlspecialchars($dir1265) . '</code></p>';
if (is_dir($dir1265)) {
    echo '<p class="ok">✅ El directorio SÍ existe</p>';
    $items = scandir($dir1265);
    echo '<p>Contenido:</p><ul>';
    foreach ($items as $item) {
        if ($item != '.' && $item != '..') {
            $ruta = $dir1265 . $item;
            $tipo = is_dir($ruta) ? 'Directorio' : 'Archivo (' . filesize($ruta) . ' bytes)';
            echo '<li>' . htmlspecialchars($item) . ' - ' . $tipo . '</li>';
        }
    }
    echo '</ul>';
} else {
    echo '<p class="error">❌ El directorio NO existe</p>';
}

// Verificar el directorio actual de trabajo
echo '<h2>4. Información del sistema:</h2>';
echo '<p><strong>getcwd():</strong> ' . getcwd() . '</p>';
echo '<p><strong>__DIR__:</strong> ' . __DIR__ . '</p>';
echo '<p><strong>$_SERVER[DOCUMENT_ROOT]:</strong> ' . ($_SERVER['DOCUMENT_ROOT'] ?? 'N/A') . '</p>';
echo '<p><strong>Usuario:</strong> ' . get_current_user() . '</p>';

// Verificar si existe el archivo específico buscando en todo el proyecto
$archivoBuscado = '69dd41db5f933_ChatGPT_Image_17_mar_2026__01_30_46_p.m..png';
echo '<h2>5. Buscando archivo específico: ' . htmlspecialchars($archivoBuscado) . '</h2>';

function buscarArchivo($dir, $archivo, $nivel = 0) {
    if ($nivel > 4) return false; // Limitar profundidad

    if (is_dir($dir)) {
        $items = @scandir($dir);
        if ($items) {
            foreach ($items as $item) {
                if ($item == '.' || $item == '..') continue;

                $rutaCompleta = $dir . '/' . $item;
                if ($item == $archivo && is_file($rutaCompleta)) {
                    echo '<p class="ok">✅ Archivo encontrado en: <code>' . htmlspecialchars($rutaCompleta) . '</code></p>';
                    echo '<p>Tamaño: ' . filesize($rutaCompleta) . ' bytes</p>';
                    return true;
                }
                if (is_dir($rutaCompleta) && $nivel < 4) {
                    if (buscarArchivo($rutaCompleta, $archivo, $nivel + 1)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

$encontrado = buscarArchivo($basePath, $archivoBuscado);
if (!$encontrado) {
    echo '<p class="error">❌ Archivo no encontrado en el proyecto</p>';
}

// Enlace para borrar
echo '<p><a href="?borrar=1">🗑️ Borrar este script</a></p>';
if (isset($_GET['borrar'])) {
    @unlink(__FILE__);
    echo '<p>Script borrado.</p>';
}
?>
<style>
.ok { color: green; }
.error { color: red; }
</style>

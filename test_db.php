<?php
/**
 * Script de prueba de conexión a la base de datos de SGIGESCON
 */

header('Content-Type: text/html; charset=utf-8');

echo "<h2>🔧 Prueba de Conexión a Base de Datos</h2>";

try {
    // 1. Intentar cargar el autoload de Composer
    $autoloadPath = __DIR__ . '/vendor/autoload.php';
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
        echo "<p style='color:green;'>✅ Autoload cargado correctamente.</p>";
    } else {
        echo "<p style='color:orange;'>⚠️ No se encontró el autoload en <code>$autoloadPath</code>. Usando configuración manual...</p>";
    }

    // 2. Intentar cargar la clase Database existente
    $dbPath = __DIR__ . '/config/database.php';
    if (file_exists($dbPath)) {
        require_once $dbPath;
        echo "<p style='color:green;'>✅ Archivo <code>config/database.php</code> encontrado.</p>";
        
        try {
            $conn = Database::getConnection();
            if ($conn) {
                echo "<p style='color:green; font-weight:bold;'>✅ ¡CONEXIÓN EXITOSA! Usando la clase Database.</p>";
                
                // Prueba de consulta simple
                $stmt = $conn->query("SELECT VERSION() as version");
                $row = $stmt->fetch();
                echo "<p>Versión de MySQL: <strong>" . $row['version'] . "</strong></p>";
                
                // Verificar si la base de datos es la correcta
                $stmt = $conn->query("SELECT DATABASE() as dbname");
                $row = $stmt->fetch();
                echo "<p>Base de datos actual: <strong>" . $row['dbname'] . "</strong></p>";
                
                // Listar tablas para confirmar acceso
                echo "<h4>Tablas encontradas:</h4>";
                $stmt = $conn->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                if (count($tables) > 0) {
                    echo "<ul>";
                    foreach (array_slice($tables, 0, 10) as $table) {
                        echo "<li>$table</li>";
                    }
                    if (count($tables) > 10) echo "<li>... y " . (count($tables)-10) . " más.</li>";
                    echo "</ul>";
                } else {
                    echo "<p style='color:red;'>⚠️ La conexión fue exitosa pero no se encontraron tablas en la base de datos.</p>";
                }
            }
        } catch (Exception $e) {
            echo "<p style='color:red;'>❌ Error al conectar mediante la clase Database: <strong>" . $e->getMessage() . "</strong></p>";
        }
    } else {
        echo "<p style='color:red;'>❌ No se encontró el archivo <code>config/database.php</code> en <code>$dbPath</code>.</p>";
    }

    // 3. Prueba de conexión manual (usando datos de .env si falló lo anterior)
    echo "<h3>🕵️ Diagnóstico Manual</h3>";
    
    $envPath = __DIR__ . '/.env';
    if (file_exists($envPath)) {
        echo "<p>Archivo <code>.env</code> encontrado en <code>$envPath</code>.</p>";
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $env = [];
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $val) = explode('=', $line, 2);
                $env[trim($key)] = trim($val);
            }
        }
        
        $host = $env['DB_HOST'] ?? '127.0.0.1';
        $port = $env['DB_PORT'] ?? '3306';
        $db   = $env['DB_DATABASE'] ?? '';
        $user = $env['DB_USERNAME'] ?? '';
        $pass = $env['DB_PASSWORD'] ?? '';
        
        echo "<p>Intentando conexión manual con:</p>";
        echo "<ul>
                <li>Host: <code>$host</code></li>
                <li>Puerto: <code>$port</code></li>
                <li>Base de Datos: <code>$db</code></li>
                <li>Usuario: <code>$user</code></li>
              </ul>";
              
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            $connRaw = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            echo "<p style='color:green; font-weight:bold;'>✅ Conexión manual directa exitosa.</p>";
        } catch (PDOException $e) {
            echo "<p style='color:red;'>❌ Falló la conexión manual directa: <strong>" . $e->getMessage() . "</strong></p>";
            
            // Sugerencia para Windows/XAMPP
            if ($host == 'localhost' || $host == '127.0.0.1') {
                echo "<p>💡 <em>Tip: Si estás en XAMPP, asegúrate de que el servicio MySQL esté iniciado en el Panel de Control.</em></p>";
            }
        }
    } else {
        echo "<p style='color:red;'>❌ No se encontró el archivo <code>.env</code>.</p>";
    }

} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error inesperado: <strong>" . $e->getMessage() . "</strong></p>";
}

echo "<hr><p>Puedes eliminar este archivo (<code>test_db.php</code>) una vez que hayas terminado las pruebas.</p>";

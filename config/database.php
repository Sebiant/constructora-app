<?php
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

class Database {
    private static $connection = null;

    public static function getConnection() {
        if (self::$connection === null) {
            $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
            $port = $_ENV['DB_PORT'] ?? '3306';
            $db   = $_ENV['DB_DATABASE'] ?? '';
            $user = $_ENV['DB_USERNAME'] ?? '';
            $pass = $_ENV['DB_PASSWORD'] ?? '';
            $charset = 'utf8mb4';

            // Forzar TCP sobre 127.0.0.1 en Windows para evitar sockets/named pipes
            if (empty($host) || $host === 'localhost' || $host === '::1') {
                $host = '127.0.0.1';
            }
            if (!preg_match('/^\d+$/', (string)$port)) {
                $port = '3306';
            }

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT            => 5,
            ];

            self::$connection = new PDO($dsn, $user, $pass, $options);
        }
        return self::$connection;
    }
}

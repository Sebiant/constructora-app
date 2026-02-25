<?php

class ConexionBD {
    private $host;
    private $usuario;
    private $password;
    private $baseDatos;
    private $port;
    private $conexion;
    private $resultado = [];
    private $indice = 0;
    private $ultimoInsertId = null;

    public function __construct() {
        // Cargar variables de entorno si están disponibles
        $this->loadEnv();

        $this->host = $_ENV['DB_HOST'] ?? '127.0.0.1';
        $this->usuario = $_ENV['DB_USERNAME'] ?? 'root';
        $this->password = $_ENV['DB_PASSWORD'] ?? '';
        $this->baseDatos = $_ENV['DB_DATABASE'] ?? 'gesconjm_sgicontrol';
        $this->port = $_ENV['DB_PORT'] ?? '3306';

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->baseDatos};charset=utf8mb4";
            $this->conexion = new PDO($dsn, $this->usuario, $this->password);
            $this->conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            // No usar die() para no romper respuestas JSON en el frontend
            throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
        }
    }

    private function loadEnv() {
        if (empty($_ENV['DB_HOST'])) {
            $path = __DIR__ . '/../';
            if (file_exists($path . '.env') && file_exists($path . 'vendor/autoload.php')) {
                require_once $path . 'vendor/autoload.php';
                try {
                    $dotenv = \Dotenv\Dotenv::createImmutable($path);
                    $dotenv->safeLoad();
                } catch (\Exception $e) {
                    // Ignorar si falla la carga silenciosa
                }
            }
        }
    }

    public function obtenerConexion() {
        return $this->conexion;
    }

    public function cerrarConexion() {
        $this->conexion = null;
    }

    public function resolviendo_pregunta($query, $parametros = []) {
        try {
            $stmt = $this->conexion->prepare($query);
            $stmt->execute($parametros);

            $this->resultado = [];
            if ($stmt->columnCount() > 0) {
                while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $this->resultado[] = $fila;
                }
            }

            $this->ultimoInsertId = $this->conexion->lastInsertId();
            return true;
        } catch (PDOException $e) {
            throw new Exception("Error en la consulta: " . $e->getMessage());
        }
    }

    public function retornar_registro() {
        if (isset($this->resultado[$this->indice])) {
            return (object)[ 'fields' => $this->resultado[$this->indice] ];
        }
        return null;
    }

    public function obtenerResultados() {
        return $this->resultado;
    }

    public function contar_filas() {
        return count($this->resultado);
    }

    public function mover_registro() {
        if ($this->indice < count($this->resultado) - 1) {
            $this->indice++;
        }
    }

    public function mover_registro_atras() {
        if ($this->indice > 0) {
            $this->indice--;
        }
    }

    public function obtenerUltimoInsertId() {
        return $this->ultimoInsertId;
    }
}
?>
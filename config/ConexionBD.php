<?php
class ConexionBD {
    //private $host = "10.128.0.32";
    private $host = "localhost";

	
    private $usuario = "gesconjm_mastersgi";
    private $password = "R])z_Dt2r[*eVT4t";
    private $baseDatos = "gesconjm_sgicontrol";
    private $conexion;
    private $resultado = [];
    private $indice = 0;
    private $ultimoInsertId = null;

    // Constructor: establece la conexión con la base de datos
    public function __construct() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->baseDatos};charset=utf8";
            $this->conexion = new PDO($dsn, $this->usuario, $this->password);
            $this->conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die("? Error de conexión: " . $e->getMessage());
        }
    }

    // Devuelve la conexión activa
    public function obtenerConexion() {
        return $this->conexion;
    }

    // Cierra la conexión
    public function cerrarConexion() {
        $this->conexion = null;
    }

    // Ejecuta una consulta preparada con parámetros y guarda resultados (si hay)
    public function resolviendo_pregunta($query, $parametros = []) {
        try {
            $stmt = $this->conexion->prepare($query);
            $stmt->execute($parametros);

            // Si la consulta devuelve columnas (SELECT), guarda los resultados
            $this->resultado = [];
            while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $this->resultado[] = $fila;
            }

            // Guardar el último ID insertado si aplica
            $this->ultimoInsertId = $this->conexion->lastInsertId();

            // Reiniciar el índice
            $this->indice = 0;
        } catch (PDOException $e) {
            echo "? Error en consulta: " . $e->getMessage();
            $this->resultado = [];
            $this->ultimoInsertId = null;
        }
    }

    // Devuelve el registro actual con formato similar a ->fields
    public function retornar_registro() {
        if (isset($this->resultado[$this->indice])) {
            return (object)[ 'fields' => $this->resultado[$this->indice] ];
        }
        return null;
    }

    // Devuelve todos los resultados como array
    public function obtenerResultados() {
        return $this->resultado;
    }

    // Retorna el número de registros obtenidos
    public function contar_filas() {
        return count($this->resultado);
    }

    // Mueve al siguiente registro
    public function mover_registro() {
        if ($this->indice < count($this->resultado) - 1) {
            $this->indice++;
        }
    }

    // Mueve al registro anterior
    public function mover_registro_atras() {
        if ($this->indice > 0) {
            $this->indice--;
        }
    }

    // Obtiene el último ID insertado
    public function obtenerUltimoInsertId() {
        return $this->ultimoInsertId;
    }
}
?>
<?php

namespace Src\Capitulos\Infrastructure;

use Src\Capitulos\Domain\Capitulo;
use Src\Capitulos\Domain\CapituloRepository;
use PDO;

class CapituloMySQLRepository implements CapituloRepository {
    private PDO $conn;

    public function __construct(PDO $conn) {
        $this->conn = $conn;
    }

    public function getAll(): array {
        try {
            $stmt = $this->conn->query("
                SELECT 
                    c.*,
                    CONCAT('Presupuesto ', c.id_presupuesto, ' - ', IFNULL(pr.nombre, 'Sin proyecto')) AS presupuesto_proyecto
                FROM capitulos c
                LEFT JOIN presupuestos p ON c.id_presupuesto = p.id_presupuesto
                LEFT JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                ORDER BY c.estado DESC, c.nombre_cap ASC
            ");
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Depuración: Loggear los datos obtenidos
            error_log("Datos obtenidos de capitulos: " . json_encode($result));
            
            return $result ?: [];
        } catch (Exception $e) {
            error_log("Error en getAll de CapituloMySQLRepository: " . $e->getMessage());
            return [];
        }
    }

    public function getActivos(): array {
        $stmt = $this->conn->query("SELECT * FROM capitulos WHERE estado = 1 ORDER BY nombre_cap ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function find(int $id): ?Capitulo {
        $stmt = $this->conn->prepare("SELECT * FROM capitulos WHERE id_capitulo = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Capitulo(
            (int)$row['id_capitulo'],
            $row['nombre_cap'],
            $row['id_presupuesto'] ?? null,
            (bool)$row['estado'],
            $row['fechareg'] ?? null
        );
    }

    public function save(Capitulo $capitulo): Capitulo {
        $sql = "INSERT INTO capitulos (nombre_cap, id_presupuesto, estado, fechareg, idusuario)
                VALUES (:nombre_cap, :id_presupuesto, :estado, NOW(), :idusuario)";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            'nombre_cap' => $capitulo->getNombre(),
            'id_presupuesto' => $capitulo->getIdPresupuesto(),
            'estado' => $capitulo->getEstado(),
            'idusuario' => 1 // TODO: Obtener de sesión
        ]);

        $id = (int)$this->conn->lastInsertId();
        $capitulo->setId($id);

        return $capitulo;
    }

    public function update(Capitulo $capitulo): bool {
        $sql = "UPDATE capitulos 
                SET nombre_cap = :nombre_cap,
                    id_presupuesto = :id_presupuesto,
                    estado = :estado,
                    fechaupdate = NOW()
                WHERE id_capitulo = :id_capitulo";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            'nombre_cap' => $capitulo->getNombre(),
            'id_presupuesto' => $capitulo->getIdPresupuesto(),
            'estado' => $capitulo->getEstado(),
            'id_capitulo' => $capitulo->getId()
        ]);
    }

    public function delete(int $id): bool {
        $sql = "UPDATE capitulos 
                SET estado = 0, fechaupdate = NOW() 
                WHERE id_capitulo = :id_capitulo";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute(['id_capitulo' => $id]);
    }

    public function getByPresupuesto(int $idPresupuesto): array {
        $stmt = $this->conn->prepare("SELECT * FROM capitulos WHERE id_presupuesto = :id_presupuesto AND estado = 1 ORDER BY nombre_cap ASC");
        $stmt->execute(['id_presupuesto' => $idPresupuesto]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

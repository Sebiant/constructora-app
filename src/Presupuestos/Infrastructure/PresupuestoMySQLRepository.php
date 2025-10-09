<?php
namespace Src\Presupuestos\Infrastructure;

use Src\Presupuestos\Domain\Presupuesto;
use Src\Presupuestos\Domain\PresupuestoRepository;
use PDO;

class PresupuestoMySQLRepository implements PresupuestoRepository {
    private PDO $conn;

    public function __construct(PDO $conn) {
        $this->conn = $conn;
    }

    public function save(Presupuesto $presupuesto): Presupuesto {
        $sql = "INSERT INTO presupuestos (id_proyecto, fecha_creacion, monto_total)
                VALUES (:id_proyecto, :fecha_creacion, :monto_total)";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            'id_proyecto'    => $presupuesto->getIdProyecto(),
            'fecha_creacion' => $presupuesto->getFechaCreacion(),
            'monto_total'    => $presupuesto->getMonto()
        ]);

        $id = (int)$this->conn->lastInsertId();
        $presupuesto->setId($id);

        return $presupuesto;
    }

    public function getAll(): array {
        $query = "SELECT 
                        p.id_presupuesto,
                        p.id_proyecto,
                        pr.nombre AS nombre_proyecto,
                        p.fecha_creacion,
                        p.monto_total
                  FROM presupuestos p
                  INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                  ORDER BY p.fecha_creacion DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $result ?: [];
    }

    public function find(int $id): ?Presupuesto {
        return null;
    }

    public function update(Presupuesto $presupuesto): bool {
        return false;
    }

    public function delete(int $id): bool {
        return false;
    }
}

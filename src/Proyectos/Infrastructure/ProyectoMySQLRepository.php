<?php

namespace Src\Proyectos\Infrastructure;

use Src\Proyectos\Domain\Proyecto;
use Src\Proyectos\Domain\ProyectoRepository;
use PDO;

class ProyectoMySQLRepository implements ProyectoRepository {
    private PDO $conn;

    public function __construct(PDO $conn) {
        $this->conn = $conn;
    }

    public function getAll(): array {
        $stmt = $this->conn->query("SELECT * FROM proyectos");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $proyectos = [];
        foreach ($rows as $row) {
            $proyectos[] = new Proyecto(
                $row['id_proyecto'],
                $row['nombre'],
                $row['id_cliente'],
                $row['fecha_inicio'],
                $row['fecha_fin'],
                $row['estado'],
                $row['observaciones']
            );
        }

        return array_map(fn($p) => $p->toArray(), $proyectos);
    }

    public function find(int $id): ?Proyecto {
        $stmt = $this->conn->prepare("SELECT * FROM proyectos WHERE id_proyecto = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? new Proyecto(
            $row['id_proyecto'],
            $row['nombre'],
            $row['id_cliente'],
            $row['fecha_inicio'],
            $row['fecha_fin'],
            $row['estado'],
            $row['observaciones']
        ) : null;
    }

    public function save(Proyecto $proyecto): Proyecto {
        $sql = "INSERT INTO proyectos (nombre, id_cliente, fecha_inicio, fecha_fin, estado, observaciones) 
                VALUES (:nombre, :id_cliente, :fecha_inicio, :fecha_fin, :estado, :observaciones)";
        $stmt = $this->conn->prepare($sql);

        $stmt->execute([
            'nombre'        => $proyecto->getNombre(),
            'id_cliente'    => $proyecto->getIdCliente(),
            'fecha_inicio'  => $proyecto->getFechaInicio(),
            'fecha_fin'     => $proyecto->getFechaFin(),
            'estado'        => $proyecto->getEstado(),
            'observaciones' => $proyecto->getObservaciones()
        ]);

        $id = (int)$this->conn->lastInsertId();
        $proyecto->setId($id);

        return $proyecto;
    }

    public function update(Proyecto $proyecto): bool {
        $sql = "UPDATE proyectos 
                SET nombre=:nombre, id_cliente=:id_cliente, fecha_inicio=:fecha_inicio, 
                    fecha_fin=:fecha_fin, estado=:estado, observaciones=:observaciones
                WHERE id_proyecto=:id";
        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            'nombre'        => $proyecto->getNombre(),
            'id_cliente'    => $proyecto->getIdCliente(),
            'fecha_inicio'  => $proyecto->getFechaInicio(),
            'fecha_fin'     => $proyecto->getFechaFin(),
            'estado'        => $proyecto->getEstado(),
            'observaciones' => $proyecto->getObservaciones(),
            'id'            => $proyecto->getId()
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare("DELETE FROM proyectos WHERE id_proyecto=:id");
        return $stmt->execute(['id' => $id]);
    }
}

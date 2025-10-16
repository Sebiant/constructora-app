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
        $stmt = $this->conn->query("
            SELECT p.*, 
                (SELECT c.nombre FROM clientes c WHERE c.id_cliente = p.id_cliente) as nombre_cliente
            FROM proyectos p
            ORDER BY p.estado DESC, p.id_proyecto DESC
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $proyectos = [];
        foreach ($rows as $row) {
            $proyecto = new Proyecto(
                $row['id_proyecto'],
                $row['nombre'],
                $row['id_cliente'],
                $row['fecha_inicio'],
                $row['fecha_fin'],
                $row['estado'],
                $row['observaciones']
            );
            
            $proyectoArray = $proyecto->toArray();
            $proyectoArray['nombre_cliente'] = $row['nombre_cliente'];
            
            $proyectos[] = $proyectoArray;
        }

        return $proyectos;
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
            'estado'        => $proyecto->getEstado() ?? 1,
            'observaciones' => $proyecto->getObservaciones()
        ]);

        $id = (int)$this->conn->lastInsertId();
        $proyecto->setId($id);

        return $proyecto;
    }

    public function update(Proyecto $proyecto, array $responsables = []): bool {
        // 1️⃣ Actualizar datos del proyecto
        $sql = "UPDATE proyectos 
                SET nombre=:nombre, id_cliente=:id_cliente, fecha_inicio=:fecha_inicio, 
                    fecha_fin=:fecha_fin, estado=:estado, observaciones=:observaciones
                WHERE id_proyecto=:id";
        $stmt = $this->conn->prepare($sql);

        $resultado = $stmt->execute([
            'nombre'        => $proyecto->getNombre(),
            'id_cliente'    => $proyecto->getIdCliente(),
            'fecha_inicio'  => $proyecto->getFechaInicio(),
            'fecha_fin'     => $proyecto->getFechaFin(),
            'estado'        => $proyecto->getEstado(),
            'observaciones' => $proyecto->getObservaciones(),
            'id'            => $proyecto->getId()
        ]);

        if (!$resultado) return false;

        // Actualizar responsables (reemplazar la lista actual)
        // Borramos los existentes
        $stmtDel = $this->conn->prepare("DELETE FROM resp_proyecto WHERE id_proyecto = :id_proyecto");
        $stmtDel->execute(['id_proyecto' => $proyecto->getId()]);

        // Insertamos los nuevos
        $stmtIns = $this->conn->prepare("INSERT INTO resp_proyecto (id_proyecto, id_usuario, estado) VALUES (:id_proyecto, :id_usuario, 1)");
        foreach ($responsables as $usuarioId) {
            $stmtIns->execute([
                'id_proyecto' => $proyecto->getId(),
                'id_usuario'  => $usuarioId
            ]);
        }

        return true;
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare("DELETE FROM proyectos WHERE id_proyecto=:id");
        return $stmt->execute(['id' => $id]);
    }

    public function assignResponsable(int $proyectoId, int $responsableId): bool {
        $sql = "UPDATE proyectos SET id_responsable = :id_responsable WHERE id_proyecto = :id_proyecto";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            'id_responsable' => $responsableId,
            'id_proyecto'    => $proyectoId
        ]);
    }

    public function getAllWithResponsable(): array {
        $sql = "SELECT p.*, r.nombre AS responsable_nombre 
                FROM proyectos p
                LEFT JOIN responsables r ON p.id_responsable = r.id_responsable";
        $stmt = $this->conn->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $proyectos = [];
        foreach ($rows as $row) {
            $proyectos[] = [
                'id' => $row['id_proyecto'],
                'nombre' => $row['nombre'],
                'id_cliente' => $row['id_cliente'],
                'fecha_inicio' => $row['fecha_inicio'],
                'fecha_fin' => $row['fecha_fin'],
                'estado' => $row['estado'],
                'observaciones' => $row['observaciones'],
                'responsable' => $row['responsable_nombre'] ?? null
            ];
        }

        return $proyectos;
    }
    public function getClientes(): array {
        $stmt = $this->conn->query("SELECT id_cliente, nombre FROM clientes WHERE estado = '1' ORDER BY nombre");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

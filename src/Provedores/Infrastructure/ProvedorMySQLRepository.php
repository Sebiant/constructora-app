<?php

namespace Src\Provedores\Infrastructure;

use Src\Provedores\Domain\Provedor;
use Src\Provedores\Domain\ProvedorRepository;
use PDO;

class ProvedorMySQLRepository implements ProvedorRepository {
    private PDO $conn;

    public function __construct(PDO $conn) {
        $this->conn = $conn;
    }

    public function getAll(): array {
        $stmt = $this->conn->query("SELECT * FROM provedores ORDER BY estado DESC, nombre ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getActivos(): array {
        $stmt = $this->conn->query("SELECT * FROM provedores WHERE estado = 1 ORDER BY nombre ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function find(int $id): ?Provedor {
        $stmt = $this->conn->prepare("SELECT * FROM provedores WHERE id_provedor = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Provedor(
            (int)$row['id_provedor'],
            $row['nombre'],
            $row['telefono'] ?? null,
            $row['email'] ?? null,
            $row['whatsapp'] ?? null,
            $row['direccion'] ?? null,
            $row['contacto'] ?? null,
            (bool)$row['estado']
        );
    }

    public function save(Provedor $provedor): Provedor {
        $sql = "INSERT INTO provedores (nombre, telefono, email, whatsapp, direccion, contacto, estado, idusuario)
                VALUES (:nombre, :telefono, :email, :whatsapp, :direccion, :contacto, :estado, :idusuario)";
        $stmt = $this->conn->prepare($sql);

        $stmt->execute([
            'nombre' => $provedor->getNombre(),
            'telefono' => $provedor->getTelefono(),
            'email' => $provedor->getEmail(),
            'whatsapp' => $provedor->getWhatsapp(),
            'direccion' => $provedor->getDireccion(),
            'contacto' => $provedor->getContacto(),
            'estado' => $provedor->getEstado() ? 1 : 0,
            'idusuario' => null,
        ]);

        $id = (int)$this->conn->lastInsertId();
        $provedor->setId($id);
        return $provedor;
    }

    public function update(Provedor $provedor): bool {
        $sql = "UPDATE provedores
                SET nombre=:nombre, telefono=:telefono, email=:email, whatsapp=:whatsapp, direccion=:direccion, contacto=:contacto, estado=:estado
                WHERE id_provedor=:id";
        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            'nombre' => $provedor->getNombre(),
            'telefono' => $provedor->getTelefono(),
            'email' => $provedor->getEmail(),
            'whatsapp' => $provedor->getWhatsapp(),
            'direccion' => $provedor->getDireccion(),
            'contacto' => $provedor->getContacto(),
            'estado' => $provedor->getEstado() ? 1 : 0,
            'id' => $provedor->getId(),
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare("DELETE FROM provedores WHERE id_provedor=:id");
        return $stmt->execute(['id' => $id]);
    }
}

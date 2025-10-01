<?php
namespace Src\Clientes\Infrastructure;

use Src\Clientes\Domain\Cliente;
use Src\Clientes\Domain\ClienteRepository;
use PDO;

class ClienteMySQLRepository implements ClienteRepository {
    private PDO $connection;

    public function __construct(PDO $connection) {
        $this->connection = $connection;
    }

    public function getAll(): array {
        $stmt = $this->connection->query("SELECT id_cliente, nit, nombre, estado FROM clientes");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $clientes = [];
        foreach ($rows as $row) {
            $clientes[] = new Cliente(
                $row['id_cliente'],
                $row['nit'],
                $row['nombre'],
                (bool)$row['estado']
            );
        }
        return $clientes;
    }

    public function find(int $id): ?Cliente {
        $stmt = $this->connection->prepare("SELECT id_cliente, nit, nombre, estado FROM clientes WHERE id_cliente = ?");
        $stmt->execute([$id]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Cliente(
            $row['id_cliente'],
            $row['nit'],
            $row['nombre'],
            (bool)$row['estado']
        );
    }

    public function save(Cliente $cliente): void {
        $sql = "INSERT INTO clientes (nit, nombre, estado) VALUES (?, ?, ?)";
        $stmt = $this->connection->prepare($sql);
        
        $stmt->execute([
            $cliente->getNit(),
            $cliente->getNombre(), 
            $cliente->getEstado() ? 1 : 0
        ]);

        $idGenerado = $this->connection->lastInsertId();
        
        $cliente->setId($idGenerado);
    }

    public function update(Cliente $cliente): void {
        $sql = "UPDATE clientes SET nit = ?, nombre = ?, estado = ? WHERE id_cliente = ?";
        $stmt = $this->connection->prepare($sql);
        
        $stmt->execute([
            $cliente->getNit(),
            $cliente->getNombre(),
            $cliente->getEstado() ? 1 : 0,
            $cliente->getId()
        ]);

        // Verificar si se actualizó algún registro
        if ($stmt->rowCount() === 0) {
            throw new \Exception("No se pudo actualizar el cliente. Posiblemente no existe.");
        }
    }

    public function delete(int $id): void {
        $sql = "DELETE FROM clientes WHERE id_cliente = ?";
        $stmt = $this->connection->prepare($sql);
        
        $stmt->execute([$id]);

        // Verificar si se eliminó algún registro
        if ($stmt->rowCount() === 0) {
            throw new \Exception("No se pudo eliminar el cliente. Posiblemente no existe.");
        }
    }

    // Método adicional para compatibilidad con tu código existente
    public function findById(int $id): ?Cliente {
        return $this->find($id);
    }

    public function findAll(): array {
        return $this->getAll();
    }
}
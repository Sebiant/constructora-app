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
        $stmt = $this->connection->query("SELECT id_cliente, nit, nombre, estado FROM clientes ORDER BY estado DESC, id_cliente ASC");
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

        if ($stmt->rowCount() === 0) {
            throw new \Exception("No se pudo actualizar el cliente. Posiblemente no existe.");
        }
    }

    public function delete(int $id): void {
        $sql = "DELETE FROM clientes WHERE id_cliente = ?";
        $stmt = $this->connection->prepare($sql);
        
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            throw new \Exception("No se pudo eliminar el cliente. Posiblemente no existe.");
        }
    }

    public function findById(int $id): ?Cliente {
        return $this->find($id);
    }

    public function findAll(): array {
        return $this->getAll();
    }

    // En tu ClienteMySQLRepository.php - agrega este método
    public function toggleEstado(int $id): bool {
        // Primero obtener el cliente para saber el estado actual
        $cliente = $this->findById($id);
        if (!$cliente) {
            throw new \Exception("Cliente no encontrado");
        }
        
        // Calcular el nuevo estado (toggle)
        $nuevoEstado = !$cliente->getEstado();
        
        // Actualizar en la base de datos - usando id_cliente como columna
        $stmt = $this->connection->prepare(
            "UPDATE clientes SET estado = ? WHERE id_cliente = ?"
        );
        
        $success = $stmt->execute([
            $nuevoEstado ? 1 : 0, 
            $id
        ]);
        
        if (!$success || $stmt->rowCount() === 0) {
            throw new \Exception("Error al actualizar el estado en la base de datos");
        }
        
        return $nuevoEstado;
    }
}
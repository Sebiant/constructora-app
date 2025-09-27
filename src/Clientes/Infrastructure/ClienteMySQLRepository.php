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
    }

    public function update(Cliente $cliente): void {
    }

    public function delete(int $id): void {
    }
}
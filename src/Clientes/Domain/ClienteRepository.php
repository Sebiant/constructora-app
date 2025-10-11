<?php

namespace Src\Clientes\Domain;

interface ClienteRepository {
    public function getAll(): array;
    public function find(int $id): ?Cliente;
    public function save(Cliente $cliente): void;
    public function update(Cliente $cliente): void;
    public function delete(int $id): void;

    public function toggleEstado(int $id): bool;
}
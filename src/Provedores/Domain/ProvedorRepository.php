<?php

namespace Src\Provedores\Domain;

interface ProvedorRepository {
    public function getAll(): array;
    public function find(int $id): ?Provedor;
    public function save(Provedor $provedor): Provedor;
    public function update(Provedor $provedor): bool;
    public function delete(int $id): bool;
    public function getActivos(): array;
}

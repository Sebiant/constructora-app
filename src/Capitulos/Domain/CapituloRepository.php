<?php
namespace Src\Capitulos\Domain;

interface CapituloRepository {
    public function getAll(): array;
    public function getActivos(): array;
    public function find(int $id): ?Capitulo;
    public function save(Capitulo $capitulo): Capitulo;
    public function update(Capitulo $capitulo): bool;
    public function delete(int $id): bool;
    public function getByPresupuesto(int $idPresupuesto): array;
}

<?php
namespace Src\Presupuestos\Domain;

interface PresupuestoRepository {
    public function getAll(): array;
    public function find(int $id): ?Presupuesto;
    public function save(Presupuesto $presupuesto): Presupuesto;
    public function update(Presupuesto $presupuesto): bool;
    public function delete(int $id): bool;
}

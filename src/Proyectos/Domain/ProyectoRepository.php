<?php

namespace Src\Proyectos\Domain;

interface ProyectoRepository {
    public function getAll(): array;
    public function find(int $id): ?Proyecto;
    public function save(Proyecto $proyecto): Proyecto;
    public function update(Proyecto $proyecto): bool;
    public function delete(int $id): bool;
}

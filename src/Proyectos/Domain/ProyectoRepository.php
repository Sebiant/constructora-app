<?php

namespace Src\Proyectos\Domain;

interface ProyectoRepository {
    public function getAll(): array;
    public function find(int $id): ?Proyecto;
    public function save(Proyecto $proyecto): Proyecto;
    public function update(Proyecto $proyecto): bool;
    public function delete(int $id): bool;

    /**
     * Asigna un responsable a un proyecto específico.
     *
     * @param int $proyectoId  ID del proyecto
     * @param int $responsableId  ID del responsable asignado
     * @return bool  true si la asignación fue exitosa, false si falló
     */
    public function assignResponsable(int $proyectoId, int $responsableId): bool;

    /**
     * Obtiene todos los proyectos junto con su responsable asignado.
     *
     * @return array Lista de proyectos con información del responsable
     */
    public function getAllWithResponsable(): array;
}

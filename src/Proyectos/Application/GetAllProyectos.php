<?php

namespace Src\Proyectos\Application;

use Src\Proyectos\Domain\ProyectoRepository;

class GetAllProyectos {
    private ProyectoRepository $repository;

    public function __construct(ProyectoRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(): array {
        return $this->repository->getAll();
    }
}

<?php

namespace Src\Proyectos\Application;

use Src\Proyectos\Domain\Proyecto;
use Src\Proyectos\Domain\ProyectoRepository;

class CreateProyecto {
    private ProyectoRepository $repository;

    public function __construct(ProyectoRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(Proyecto $proyecto): Proyecto {
        return $this->repository->save($proyecto);
    }
}

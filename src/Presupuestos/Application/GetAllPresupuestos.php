<?php

namespace Src\Presupuestos\Application;

use Src\Presupuestos\Domain\PresupuestoRepository;

class GetAllPresupuestos {
    private PresupuestoRepository $repository;

    public function __construct(PresupuestoRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(): array {
        return $this->repository->getAll();
    }
}

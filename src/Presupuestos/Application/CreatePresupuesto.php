<?php
namespace Src\Presupuestos\Application;

use Src\Presupuestos\Domain\Presupuesto;
use Src\Presupuestos\Domain\PresupuestoRepository;

class CreatePresupuesto {
    private PresupuestoRepository $repository;

    public function __construct(PresupuestoRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(Presupuesto $presupuesto): Presupuesto {
        return $this->repository->save($presupuesto);
    }
}

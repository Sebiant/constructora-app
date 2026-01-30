<?php
namespace Src\Capitulos\Application;

use Src\Capitulos\Domain\CapituloRepository;

class GetAllCapitulos {
    private CapituloRepository $repository;

    public function __construct(CapituloRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(?int $idPresupuesto = null): array {
        return $this->repository->getAll($idPresupuesto);
    }
}

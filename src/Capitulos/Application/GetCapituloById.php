<?php
namespace Src\Capitulos\Application;

use Src\Capitulos\Domain\CapituloRepository;

class GetCapituloById {
    private CapituloRepository $repository;

    public function __construct(CapituloRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(int $id): ?Capitulo {
        return $this->repository->find($id);
    }
}

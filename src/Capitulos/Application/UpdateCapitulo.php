<?php
namespace Src\Capitulos\Application;

use Src\Capitulos\Domain\Capitulo;
use Src\Capitulos\Domain\CapituloRepository;

class UpdateCapitulo {
    private CapituloRepository $repository;

    public function __construct(CapituloRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(Capitulo $capitulo): bool {
        return $this->repository->update($capitulo);
    }
}

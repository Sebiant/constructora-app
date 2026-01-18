<?php
namespace Src\Capitulos\Application;

use Src\Capitulos\Domain\Capitulo;
use Src\Capitulos\Domain\CapituloRepository;

class CreateCapitulo {
    private CapituloRepository $repository;

    public function __construct(CapituloRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(Capitulo $capitulo): Capitulo {
        return $this->repository->save($capitulo);
    }
}

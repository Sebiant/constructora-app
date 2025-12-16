<?php

namespace Src\Provedores\Application;

use Src\Provedores\Domain\Provedor;
use Src\Provedores\Domain\ProvedorRepository;

class CreateProvedor {
    private ProvedorRepository $repository;

    public function __construct(ProvedorRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(Provedor $provedor): Provedor {
        return $this->repository->save($provedor);
    }
}

<?php

namespace Src\Provedores\Application;

use Src\Provedores\Domain\ProvedorRepository;

class GetAllProvedores {
    private ProvedorRepository $repository;

    public function __construct(ProvedorRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(): array {
        return $this->repository->getAll();
    }
}

<?php

namespace Src\Provedores\Application;

use Src\Provedores\Domain\ProvedorRepository;

class DeleteProvedor {
    public function __construct(private ProvedorRepository $repository) {}

    public function execute(int $id): bool {
        return $this->repository->delete($id);
    }
}

<?php
namespace Src\Capitulos\Application;

use Src\Capitulos\Domain\CapituloRepository;

class DeleteCapitulo {
    private CapituloRepository $repository;

    public function __construct(CapituloRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(int $id): bool {
        return $this->repository->delete($id);
    }
}

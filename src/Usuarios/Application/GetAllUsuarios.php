<?php
namespace Src\Usuarios\Application;

use Src\Usuarios\Domain\UsuarioRepository;

class GetAllUsuarios {
    private $repository;

    public function __construct(UsuarioRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(): array {
        return $this->repository->getAll();
    }
}

<?php
namespace Src\Usuarios\Application;

use Src\Usuarios\Domain\UsuarioRepository;

class DeleteUsuario {
    private $repository;

    public function __construct(UsuarioRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(int $id): bool {
        return $this->repository->delete($id);
    }
}

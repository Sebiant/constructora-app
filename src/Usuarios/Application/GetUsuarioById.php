<?php
namespace Src\Usuarios\Application;

use Src\Usuarios\Domain\Usuario;
use Src\Usuarios\Domain\UsuarioRepository;

class GetUsuarioById {
    private $repository;

    public function __construct(UsuarioRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(int $id): ?Usuario {
        return $this->repository->getById($id);
    }
}

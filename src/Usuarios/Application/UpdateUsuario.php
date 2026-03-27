<?php
namespace Src\Usuarios\Application;

use Src\Usuarios\Domain\Usuario;
use Src\Usuarios\Domain\UsuarioRepository;

class UpdateUsuario {
    private $repository;

    public function __construct(UsuarioRepository $repository) {
        $this->repository = $repository;
    }

    public function execute(Usuario $usuario): bool {
        return $this->repository->update($usuario);
    }
}

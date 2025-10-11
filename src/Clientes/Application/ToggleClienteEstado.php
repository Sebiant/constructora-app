<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;

class ToggleClienteEstado {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(int $id): bool {
        return $this->repository->toggleEstado($id);
    }
}
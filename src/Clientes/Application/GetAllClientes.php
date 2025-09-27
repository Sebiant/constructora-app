<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;

class GetAllClientes {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(): array {
        $clientes = $this->repository->getAll();
        
        return array_map(function($cliente) {
            return [
                'id' => $cliente->getId(),
                'nit' => $cliente->getNit(),
                'nombre' => $cliente->getNombre(),
                'estado' => $cliente->getEstado()
            ];
        }, $clientes);
    }
}
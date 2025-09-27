<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;

class GetClienteById {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(int $id): array {
        $cliente = $this->repository->find($id);

        if (!$cliente) {
            return [];
        }
        
        return [
            'id' => $cliente->getId(),
            'nit' => $cliente->getNit(),
            'nombre' => $cliente->getNombre(),
            'estado' => $cliente->getEstado()
        ];
    }
}
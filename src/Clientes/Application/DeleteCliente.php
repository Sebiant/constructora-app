<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;
use Exception;

class DeleteCliente {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(int $id): array {
        $cliente = $this->repository->findById($id);
        if (!$cliente) {
            throw new Exception("Cliente no encontrado");
        }
        
        $this->repository->delete($id);
        
        return [
            'id_eliminado' => $id,
            'mensaje' => 'Cliente eliminado correctamente'
        ];
    }
}
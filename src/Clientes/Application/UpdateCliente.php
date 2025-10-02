<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;
use Src\Clientes\Domain\Cliente;
use Exception;

class UpdateCliente {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(int $id, string $nit, string $nombre, bool $estado = true): Cliente {
        
        if (empty(trim($nit)) || empty(trim($nombre))) {
            throw new Exception("NIT y nombre son requeridos");
        }
        
        $cliente = $this->repository->findById($id);
        if (!$cliente) {
            throw new Exception("Cliente no encontrado con ID: $id");
        }
        
        $cliente->setNit(trim($nit));
        $cliente->setNombre(trim($nombre));
        $cliente->setEstado($estado);

        $this->repository->update($cliente);
        
        return $cliente;
    }
}
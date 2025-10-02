<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;
use Src\Clientes\Domain\Cliente;
use Exception;

class CreateCliente {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(string $nit, string $nombre, string $estado = 'activo'): Cliente {
        $estadoBool = ($estado === 'activo' || $estado === true || $estado === '1' || $estado === 1);
        
        if (empty(trim($nit)) || empty(trim($nombre))) {
            throw new Exception("NIT y nombre son requeridos");
        }
        
        $cliente = Cliente::crear(trim($nit), trim($nombre), $estadoBool);
        
        $this->repository->save($cliente);
        
        return $cliente;
    }
}
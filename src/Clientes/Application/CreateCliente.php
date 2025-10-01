<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;
use Src\Clientes\Domain\Cliente;
use Exception;

class CreateCliente {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(string $nit, string $nombre, string $estado = 'activo'): Cliente {
        // Convertir estado a booleano
        $estadoBool = ($estado === 'activo' || $estado === true || $estado === '1' || $estado === 1);
        
        // 1. VALIDACIONES BÁSICAS (lógica de aplicación)
        if (empty(trim($nit)) || empty(trim($nombre))) {
            throw new Exception("NIT y nombre son requeridos");
        }
        
        // 2. CREAR EL OBJETO DE DOMINIO - USANDO EL MÉTODO ESTÁTICO
        $cliente = Cliente::crear(trim($nit), trim($nombre), $estadoBool);
        
        // 3. GUARDAR USANDO EL REPOSITORY
        $this->repository->save($cliente);
        // Repository asigna el ID generado al objeto Cliente
        
        // 4. RETORNAR EL CLIENTE CREADO (con ID asignado)
        return $cliente;
    }
}
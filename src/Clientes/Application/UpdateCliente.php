<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;
use Src\Clientes\Domain\Cliente;
use Exception;

class UpdateCliente {
    public function __construct(private ClienteRepository $repository) {}
    
    public function execute(int $id, string $nit, string $nombre, bool $estado = true): Cliente {
        // DEBUG: Mostrar valores recibidos
        error_log("=== UpdateCliente::execute() ===");
        error_log("ID recibido: $id");
        error_log("NIT recibido: '$nit'");
        error_log("Nombre recibido: '$nombre'");
        error_log("Estado recibido: " . ($estado ? 'true' : 'false'));
        error_log("Longitud nombre: " . strlen($nombre));
        error_log("Longitud nombre (trim): " . strlen(trim($nombre)));
        error_log("================================");
        
        // 1. VALIDACIONES BÁSICAS
        if (empty(trim($nit)) || empty(trim($nombre))) {
            throw new Exception("NIT y nombre son requeridos");
        }
        
        // 2. BUSCAR CLIENTE EXISTENTE
        $cliente = $this->repository->findById($id);
        if (!$cliente) {
            throw new Exception("Cliente no encontrado con ID: $id");
        }
        
        // 3. ACTUALIZAR DATOS
        $cliente->setNit(trim($nit));
        $cliente->setNombre(trim($nombre));
        $cliente->setEstado($estado);
        
        // 4. GUARDAR CAMBIOS
        $this->repository->update($cliente);
        
        // 5. LOG DE ÉXITO
        error_log("✅ Cliente actualizado exitosamente:");
        error_log(" - ID: " . $cliente->getId());
        error_log(" - NIT: " . $cliente->getNit());
        error_log(" - Nombre: " . $cliente->getNombre());
        error_log(" - Estado: " . $cliente->getEstado());
        
        return $cliente;
    }
}
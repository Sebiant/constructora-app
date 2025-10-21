<?php
namespace Src\Proyectos\Application;

use Src\Proyectos\Domain\ProyectoRepository;
use Src\Proyectos\Domain\Proyecto;
use Exception;

class UpdateProyecto {
    public function __construct(private ProyectoRepository $repository) {}
    
    public function execute(
        int $id_proyecto,
        string $nombre,
        ?string $objeto = null,
        ?string $numero_contrato = null,
        ?float $valor = null,
        int $id_cliente,
        string $fecha_inicio,
        ?string $fecha_fin = null,
        ?string $observaciones = null,
        bool $estado = true
    ) {
        // Verificar si el proyecto existe
        $proyectoExistente = $this->repository->find($id_proyecto);
        if (!$proyectoExistente) {
            throw new Exception("Proyecto no encontrado");
        }
        
        // Convertir estado booleano a string para el constructor
        $estadoString = $estado ? 'activo' : 'inactivo';
        
        // Crear objeto Proyecto actualizado con los nuevos campos
        $proyecto = new Proyecto(
            $id_proyecto,
            $nombre,
            $objeto,
            $numero_contrato,
            $valor,
            $id_cliente,
            $fecha_inicio,
            $fecha_fin,
            $estadoString,
            $observaciones
        );
        
        // Actualizar en el repository
        $success = $this->repository->update($proyecto);
        
        if (!$success) {
            throw new Exception("Error al actualizar el proyecto");
        }
        
        return [
            'success' => true,
            'message' => 'Proyecto actualizado exitosamente',
            'proyecto' => $proyecto
        ];
    }
}
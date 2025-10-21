<?php
namespace Src\Proyectos\Application;

use Src\Proyectos\Domain\ProyectoRepository;

class GetProyectoById {
    public function __construct(private ProyectoRepository $repository) {}

    public function execute(int $id): array {
        $proyecto = $this->repository->find($id);

        if (!$proyecto) {
            return [];
        }

        return [
            'id' => $proyecto->getId(),
            'nombre' => $proyecto->getNombre(),
            'objeto' => $proyecto->getObjeto(),
            'numero_contrato' => $proyecto->getNumeroContrato(),
            'valor' => $proyecto->getValor(),
            'id_cliente' => $proyecto->getIdCliente(),
            'fecha_inicio' => $proyecto->getFechaInicio(),
            'fecha_fin' => $proyecto->getFechaFin(),
            'estado' => $proyecto->getEstado(),
            'observaciones' => $proyecto->getObservaciones()
        ];
    }
}
<?php
namespace Src\Provedores\Application;

use Src\Provedores\Domain\ProvedorRepository;
use Src\Provedores\Domain\Provedor;
use Exception;

class UpdateProvedor {
    public function __construct(private ProvedorRepository $repository) {}

    public function execute(
        int $id_provedor,
        string $nombre,
        ?string $telefono = null,
        ?string $email = null,
        ?string $whatsapp = null,
        ?string $direccion = null,
        ?string $contacto = null,
        bool $estado = true
    ) {
        $existente = $this->repository->find($id_provedor);
        if (!$existente) {
            throw new Exception('Provedor no encontrado');
        }

        $provedor = new Provedor(
            $id_provedor,
            $nombre,
            $telefono,
            $email,
            $whatsapp,
            $direccion,
            $contacto,
            $estado
        );

        $success = $this->repository->update($provedor);
        if (!$success) {
            throw new Exception('Error al actualizar el provedor');
        }

        return [
            'success' => true,
            'message' => 'Provedor actualizado exitosamente',
            'provedor' => $provedor
        ];
    }
}

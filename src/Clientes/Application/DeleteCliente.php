<?php
namespace Src\Clientes\Application;

use Src\Clientes\Domain\ClienteRepository;
use PDOException;
use Exception;

class DeleteCliente {
    public function __construct(private ClienteRepository $repository) {}

    public function execute(int $id): array {
        $cliente = $this->repository->findById($id);
        if (!$cliente) {
            throw new Exception("Cliente no encontrado");
        }

        try {
            $this->repository->delete($id);
            return [
                'id_eliminado' => $id,
                'mensaje' => 'Cliente eliminado correctamente'
            ];
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                throw new Exception("No puedes eliminar este cliente porque tiene proyectos asociados.");
            }
            throw new Exception("Error al eliminar el cliente: " . $e->getMessage());
        }
    }
}

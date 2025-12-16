<?php
namespace Src\Provedores\Application;

use Src\Provedores\Domain\ProvedorRepository;

class GetProvedorById {
    public function __construct(private ProvedorRepository $repository) {}

    public function execute(int $id): array {
        $provedor = $this->repository->find($id);

        if (!$provedor) {
            return [];
        }

        return $provedor->toArray();
    }
}

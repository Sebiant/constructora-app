<?php

namespace Src\Items\Domain;

class Material
{
    private ?int $id;
    private string $codigo;
    private string $nombre;
    private int $tipoMaterialId;
    private string $unidadId;
    private int $usuarioId;
    private int $estado;

    public function __construct(
        ?int $id,
        string $codigo,
        string $nombre,
        int $tipoMaterialId,
        string $unidadId,
        int $usuarioId = 1,
        int $estado = 1
    ) {
        $this->id = $id;
        $this->codigo = $codigo;
        $this->nombre = $nombre;
        $this->tipoMaterialId = $tipoMaterialId;
        $this->unidadId = $unidadId;
        $this->usuarioId = $usuarioId;
        $this->estado = $estado;
    }

    public static function createFromArray(array $data): self
    {
        return new self(
            $data['id_material'] ?? null,
            $data['cod_material'],
            $data['nombre_material'],
            (int)$data['id_tipo_material'],
            (string)$data['idunidad'],
            (int)($data['idusuario'] ?? 1),
            (int)($data['estado'] ?? 1)
        );
    }

    public function toArray(): array
    {
        return [
            'id_material' => $this->id,
            'cod_material' => $this->codigo,
            'nombre_material' => $this->nombre,
            'id_tipo_material' => $this->tipoMaterialId,
            'idunidad' => $this->unidadId,
            'idusuario' => $this->usuarioId,
            'estado' => $this->estado,
        ];
    }

    public function getCodigo(): string
    {
        return $this->codigo;
    }

    public function getNombre(): string
    {
        return $this->nombre;
    }

    public function getTipoMaterialId(): int
    {
        return $this->tipoMaterialId;
    }

    public function getUnidadId(): string
    {
        return $this->unidadId;
    }

    public function getUsuarioId(): int
    {
        return $this->usuarioId;
    }

    public function getEstado(): int
    {
        return $this->estado;
    }
}

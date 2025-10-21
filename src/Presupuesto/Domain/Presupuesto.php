<?php
namespace Src\Presupuesto\Domain;

class Presupuesto {
    private ?int $id_presupuesto;
    private int $id_proyecto;
    private float $monto;
    private string $fecha_creacion;
    private string $estado;
    private ?string $descripcion;

    public function __construct(
        ?int $id_presupuesto,
        int $id_proyecto,
        float $monto,
        string $fecha_creacion,
        string $estado = 'activo',
        ?string $descripcion = null
    ) {
        $this->id_presupuesto = $id_presupuesto;
        $this->id_proyecto = $id_proyecto;
        $this->monto = $monto;
        $this->fecha_creacion = $fecha_creacion;
        $this->estado = $estado;
        $this->descripcion = $descripcion;
    }

    public static function crear(
        int $id_proyecto,
        float $monto,
        string $fecha_creacion,
        string $estado = 'activo',
        ?string $descripcion = null
    ): self {
        return new self(null, $id_proyecto, $monto, $fecha_creacion, $estado, $descripcion);
    }

    // Getters
    public function getId(): ?int {
        return $this->id_presupuesto;
    }

    public function getIdProyecto(): int {
        return $this->id_proyecto;
    }

    public function getMonto(): float {
        return $this->monto;
    }

    public function getFechaCreacion(): string {
        return $this->fecha_creacion;
    }

    public function getEstado(): string {
        return $this->estado;
    }

    public function getDescripcion(): ?string {
        return $this->descripcion;
    }

    // Setters
    public function setId(int $id): void {
        $this->id_presupuesto = $id;
    }

    public function setIdProyecto(int $id_proyecto): void {
        $this->id_proyecto = $id_proyecto;
    }

    public function setMonto(float $monto): void {
        $this->monto = $monto;
    }

    public function setFechaCreacion(string $fecha_creacion): void {
        $this->fecha_creacion = $fecha_creacion;
    }

    public function setEstado(string $estado): void {
        $this->estado = $estado;
    }

    public function setDescripcion(?string $descripcion): void {
        $this->descripcion = $descripcion;
    }

    public function toArray(): array {
        return [
            'id_presupuesto' => $this->id_presupuesto,
            'id_proyecto'    => $this->id_proyecto,
            'monto'          => $this->monto,
            'fecha_creacion' => $this->fecha_creacion,
            'estado'         => $this->estado === 'activo' || $this->estado === '1',
            'descripcion'    => $this->descripcion
        ];
    }

    public static function fromArray(array $data): self {
        return new self(
            $data['id_presupuesto'] ?? null,
            $data['id_proyecto'],
            (float)$data['monto'],
            $data['fecha_creacion'],
            $data['estado'] ?? 'activo',
            $data['descripcion'] ?? null
        );
    }

    public function getEstadoTexto(): string {
        return $this->estado === 'activo' ? 'Activo' : 'Inactivo';
    }
}

<?php
namespace Src\Proyectos\Domain;

class Proyecto {
    private ?int $id_proyecto;
    private string $nombre;
    private int $id_cliente;
    private string $fecha_inicio;
    private ?string $fecha_fin;
    private string $estado;
    private ?string $observaciones;

    public function __construct(
        ?int $id_proyecto,
        string $nombre,
        int $id_cliente,
        string $fecha_inicio,
        ?string $fecha_fin,
        string $estado = 'activo',
        ?string $observaciones = null
    ) {
        $this->id_proyecto = $id_proyecto;
        $this->nombre = $nombre;
        $this->id_cliente = $id_cliente;
        $this->fecha_inicio = $fecha_inicio;
        $this->fecha_fin = $fecha_fin;
        $this->estado = $estado;
        $this->observaciones = $observaciones;
    }
    
    public static function crear(
        string $nombre,
        int $id_cliente,
        string $fecha_inicio,
        ?string $fecha_fin = null,
        string $estado = 'activo',
        ?string $observaciones = null
    ): self {
        return new self(null, $nombre, $id_cliente, $fecha_inicio, $fecha_fin, $estado, $observaciones);
    }

    // Getters
    public function getId(): ?int {
        return $this->id_proyecto;
    }

    public function getNombre(): string {
        return $this->nombre;
    }

    public function getIdCliente(): int {
        return $this->id_cliente;
    }

    public function getFechaInicio(): string {
        return $this->fecha_inicio;
    }

    public function getFechaFin(): ?string {
        return $this->fecha_fin;
    }

    public function getEstado(): string {
        return $this->estado;
    }

    public function getObservaciones(): ?string {
        return $this->observaciones;
    }

    // Setters
    public function setId(int $id): void {
        $this->id_proyecto = $id;
    }

    public function setNombre(string $nombre): void {
        $this->nombre = $nombre;
    }

    public function setIdCliente(int $id_cliente): void {
        $this->id_cliente = $id_cliente;
    }

    public function setFechaInicio(string $fecha_inicio): void {
        $this->fecha_inicio = $fecha_inicio;
    }

    public function setFechaFin(?string $fecha_fin): void {
        $this->fecha_fin = $fecha_fin;
    }

    public function setEstado(string $estado): void {
        $this->estado = $estado;
    }

    public function setObservaciones(?string $observaciones): void {
        $this->observaciones = $observaciones;
    }

    public function toArray(): array {
        return [
            'id_proyecto'   => $this->id_proyecto,
            'nombre'        => $this->nombre,
            'id_cliente'    => $this->id_cliente,
            'fecha_inicio'  => $this->fecha_inicio,
            'fecha_fin'     => $this->fecha_fin,
            'estado'        => $this->estado === 'activo' || $this->estado === '1',
            'observaciones' => $this->observaciones
        ];
    }

    public static function fromArray(array $data): self {
        return new self(
            $data['id_proyecto'] ?? null,
            $data['nombre'],
            $data['id_cliente'],
            $data['fecha_inicio'],
            $data['fecha_fin'] ?? null,
            $data['estado'] ?? 'activo',
            $data['observaciones'] ?? null
        );
    }

    public function getEstadoTexto(): string {
        return $this->estado === 'activo' ? 'Activo' : 'Inactivo';
    }
}

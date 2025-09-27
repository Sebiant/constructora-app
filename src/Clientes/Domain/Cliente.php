<?php
namespace Src\Clientes\Domain;

class Cliente {
    private $id_cliente;
    private $nit;
    private $nombre;
    private $estado;

    public function __construct(?int $id_cliente, string $nit, string $nombre, bool $estado = true) {
        $this->id_cliente = $id_cliente;
        $this->nit = $nit;
        $this->nombre = $nombre;
        $this->estado = $estado;
    }

    public function getId(): ?int { 
        return $this->id_cliente; 
    }
    
    public function getNit(): string { 
        return $this->nit; 
    }
    
    public function getNombre(): string { 
        return $this->nombre; 
    }
    
    public function getEstado(): bool { 
        return $this->estado; 
    }

    public function setNit(string $nit): void { 
        $this->nit = $nit; 
    }
    
    public function setNombre(string $nombre): void { 
        $this->nombre = $nombre; 
    }
    
    public function setEstado(bool $estado): void { 
        $this->estado = $estado; 
    }

    public function toArray(): array {
        return [
            'id_cliente' => $this->id_cliente,
            'nit' => $this->nit,
            'nombre' => $this->nombre,
            'estado' => $this->estado
        ];
    }

    public function getEstadoTexto(): string {
        return $this->estado ? 'Activo' : 'Inactivo';
    }

    public static function fromArray(array $data): self {
        return new self(
            $data['id_cliente'] ?? null,
            $data['nit'],
            $data['nombre'],
            (bool)($data['estado'] ?? true)
        );
    }
}
<?php
namespace Src\Provedores\Domain;

class Provedor {
    private ?int $id_provedor;
    private string $nombre;
    private ?string $telefono;
    private ?string $email;
    private ?string $whatsapp;
    private ?string $direccion;
    private ?string $contacto;
    private bool $estado;

    public function __construct(
        ?int $id_provedor,
        string $nombre,
        ?string $telefono = null,
        ?string $email = null,
        ?string $whatsapp = null,
        ?string $direccion = null,
        ?string $contacto = null,
        bool $estado = true
    ) {
        $this->id_provedor = $id_provedor;
        $this->nombre = $nombre;
        $this->telefono = $telefono;
        $this->email = $email;
        $this->whatsapp = $whatsapp;
        $this->direccion = $direccion;
        $this->contacto = $contacto;
        $this->estado = $estado;
    }

    public static function crear(
        string $nombre,
        ?string $telefono = null,
        ?string $email = null,
        ?string $whatsapp = null,
        ?string $direccion = null,
        ?string $contacto = null,
        bool $estado = true
    ): self {
        return new self(
            null,
            $nombre,
            $telefono,
            $email,
            $whatsapp,
            $direccion,
            $contacto,
            $estado
        );
    }

    public function getId(): ?int {
        return $this->id_provedor;
    }

    public function getNombre(): string {
        return $this->nombre;
    }

    public function getTelefono(): ?string {
        return $this->telefono;
    }

    public function getEmail(): ?string {
        return $this->email;
    }

    public function getWhatsapp(): ?string {
        return $this->whatsapp;
    }

    public function getDireccion(): ?string {
        return $this->direccion;
    }

    public function getContacto(): ?string {
        return $this->contacto;
    }

    public function getEstado(): bool {
        return $this->estado;
    }

    public function setId(int $id): void {
        $this->id_provedor = $id;
    }

    public function toArray(): array {
        return [
            'id_provedor' => $this->id_provedor,
            'nombre' => $this->nombre,
            'telefono' => $this->telefono,
            'email' => $this->email,
            'whatsapp' => $this->whatsapp,
            'direccion' => $this->direccion,
            'contacto' => $this->contacto,
            'estado' => $this->estado,
        ];
    }
}

<?php
namespace Src\Usuarios\Domain;

class Usuario {
    private ?int $id;
    private string $login;
    private ?string $password;
    private string $nombre;
    private ?string $apellido;
    private int $perfil;
    private bool $activo;

    private ?int $id_proyecto;

    public function __construct(
        ?int $id,
        string $login,
        string $nombre,
        ?string $password = null,
        ?string $apellido = null,
        int $perfil = 2, // Usuario por defecto
        bool $activo = true,
        ?int $id_proyecto = null
    ) {
        $this->id = $id;
        $this->login = $login;
        $this->password = $password;
        $this->nombre = $nombre;
        $this->apellido = $apellido;
        $this->perfil = $perfil;
        $this->activo = $activo;
        $this->id_proyecto = $id_proyecto;
    }

    public static function crear(
        string $login,
        string $password,
        string $nombre,
        ?string $apellido = null,
        int $perfil = 2,
        bool $activo = true,
        ?int $id_proyecto = null
    ): self {
        return new self(
            null,
            $login,
            password_hash($password, PASSWORD_DEFAULT),
            $nombre,
            $apellido,
            $perfil,
            $activo,
            $id_proyecto
        );
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getLogin(): string { return $this->login; }
    public function getPassword(): ?string { return $this->password; }
    public function getNombre(): string { return $this->nombre; }
    public function getApellido(): ?string { return $this->apellido; }
    public function getPerfil(): int { return $this->perfil; }
    public function isActivo(): bool { return $this->activo; }
    public function getIdProyecto(): ?int { return $this->id_proyecto; }

    public function toArray(): array {
        return [
            'u_id' => $this->id,
            'u_login' => $this->login,
            'u_nombre' => $this->nombre,
            'u_apellido' => $this->apellido,
            'codigo_perfil' => $this->perfil,
            'u_activo' => $this->activo,
            'id_proyecto' => $this->id_proyecto
        ];
    }

    public static function fromArray(array $data): self {
        return new self(
            $data['u_id'] ?? null,
            $data['u_login'],
            $data['u_nombre'],
            $data['u_password'] ?? null,
            $data['u_apellido'] ?? null,
            (int)($data['codigo_perfil'] ?? 2),
            (bool)($data['u_activo'] ?? true),
            isset($data['id_proyecto']) ? (int)$data['id_proyecto'] : null
        );
    }

    public function updatePassword(string $newPassword): void {
        $this->password = password_hash($newPassword, PASSWORD_DEFAULT);
    }
}

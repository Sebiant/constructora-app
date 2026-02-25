<?php

namespace Src\Auth\Domain\Models;

class Session
{
    private string $u_login;
    private string $u_nombre;
    private string $u_apellido;
    private int $u_perfil;
    private int $u_id;
    
    public function __construct(array $userData)
    {
        $this->u_login = $userData['u_login'];
        $this->u_nombre = $userData['u_nombre'] ?? '';
        $this->u_apellido = $userData['u_apellido'] ?? '';
        $this->u_perfil = $userData['codigo_perfil'];
        $this->u_id = $userData['u_id'];
    }
    
    public function getLogin(): string
    {
        return $this->u_login;
    }
    
    public function getNombre(): string
    {
        return $this->u_nombre;
    }
    
    public function getApellido(): string
    {
        return $this->u_apellido;
    }
    
    public function getNombreCompleto(): string
    {
        return trim($this->u_nombre . ' ' . $this->u_apellido);
    }
    
    public function getPerfil(): int
    {
        return $this->u_perfil;
    }
    
    public function getId(): int
    {
        return $this->u_id;
    }
    
    public function isAdmin(): bool
    {
        return $this->u_perfil === 1; // Asumiendo que 1 es el perfil de administrador
    }
    
    public function toArray(): array
    {
        return [
            'u_login' => $this->u_login,
            'u_nombre' => $this->u_nombre,
            'u_apellido' => $this->u_apellido,
            'u_perfil' => $this->u_perfil,
            'u_id' => $this->u_id,
            'nombre_completo' => $this->getNombreCompleto(),
            'es_admin' => $this->isAdmin()
        ];
    }
}

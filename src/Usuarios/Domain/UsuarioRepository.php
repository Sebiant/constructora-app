<?php
namespace Src\Usuarios\Domain;

interface UsuarioRepository {
    public function getAll(): array;
    public function getById(int $id): ?Usuario;
    public function save(Usuario $usuario): Usuario;
    public function update(Usuario $usuario): bool;
    public function delete(int $id): bool;
    public function getRoles(): array; // To assign roles
    public function getProyectos(): array; // To assign projects to users
}

<?php

namespace Src\Usuarios\Infrastructure\Persistence;

use Src\Usuarios\Domain\Usuario;
use Src\Usuarios\Domain\UsuarioRepository;
use PDO;

class MySqlUsuarioRepository implements UsuarioRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getAll(): array {
        $stmt = $this->db->query("
            SELECT u.*, p.nombre as nombre_proyecto 
            FROM gr_usuarios u 
            LEFT JOIN proyectos p ON u.id_proyecto = p.id_proyecto
            ORDER BY u.u_id DESC
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $usuarios = [];
        foreach ($rows as $row) {
            $usuario = Usuario::fromArray($row);
            $usuarioArray = $usuario->toArray();
            $usuarioArray['nombre_proyecto'] = $row['nombre_proyecto'] ?? 'Sin Proyecto';
            
            // Map perfil to role name if needed, for now just numeric
            $usuarios[] = $usuarioArray;
        }
        return $usuarios;
    }

    public function getById(int $id): ?Usuario {
        $stmt = $this->db->prepare("SELECT * FROM gr_usuarios WHERE u_id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) return null;
        return Usuario::fromArray($row);
    }

    public function save(Usuario $usuario): Usuario {
        $sql = "INSERT INTO gr_usuarios (u_login, u_password, u_nombre, u_apellido, codigo_perfil, u_activo, id_proyecto) 
                VALUES (:login, :password, :nombre, :apellido, :perfil, :activo, :id_proyecto)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'login' => $usuario->getLogin(),
            'password' => $usuario->getPassword(),
            'nombre' => $usuario->getNombre(),
            'apellido' => $usuario->getApellido(),
            'perfil' => $usuario->getPerfil(),
            'activo' => $usuario->isActivo() ? 1 : 0,
            'id_proyecto' => $usuario->getIdProyecto()
        ]);
        
        $id = (int)$this->db->lastInsertId();
        // Return a new instance or update the existing one with the ID
        return new Usuario(
            $id,
            $usuario->getLogin(),
            $usuario->getNombre(),
            $usuario->getPassword(),
            $usuario->getApellido(),
            $usuario->getPerfil(),
            $usuario->isActivo(),
            $usuario->getIdProyecto()
        );
    }

    public function update(Usuario $usuario): bool {
        $sql = "UPDATE gr_usuarios SET 
                u_login = :login, 
                u_nombre = :nombre, 
                u_apellido = :apellido, 
                codigo_perfil = :perfil, 
                u_activo = :activo, 
                id_proyecto = :id_proyecto";
        
        $params = [
            'login' => $usuario->getLogin(),
            'nombre' => $usuario->getNombre(),
            'apellido' => $usuario->getApellido(),
            'perfil' => $usuario->getPerfil(),
            'activo' => $usuario->isActivo() ? 1 : 0,
            'id_proyecto' => $usuario->getIdProyecto(),
            'id' => $usuario->getId()
        ];

        if ($usuario->getPassword()) {
            $sql .= ", u_password = :password";
            $params['password'] = $usuario->getPassword();
        }

        $sql .= " WHERE u_id = :id";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM gr_usuarios WHERE u_id = ?");
        return $stmt->execute([$id]);
    }

    public function getRoles(): array {
        // Since roles are not fully defined, we can return some defaults or query gr_perfiles if exists
        try {
            $stmt = $this->db->query("SELECT codigo_perfil as id, nombre_perfil as nombre FROM gr_perfiles");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            // Fallback roles if table doesn't exist
            return [
                ['id' => 1, 'nombre' => 'Administrador'],
                ['id' => 2, 'nombre' => 'Usuario'],
                ['id' => 3, 'nombre' => 'Consultor']
            ];
        }
    }

    public function getProyectos(): array {
        $stmt = $this->db->query("SELECT id_proyecto, nombre FROM proyectos WHERE estado = 1 ORDER BY nombre");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

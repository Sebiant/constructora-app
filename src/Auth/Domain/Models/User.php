<?php

namespace Src\Auth\Domain\Models;

require_once __DIR__ . '/../../../../config/ConexionBD.php';

class User
{
    private $conexion;
    
    public function __construct()
    {
        $this->conexion = new \ConexionBD();
    }
    
    /**
     * Verifica las credenciales del usuario
     * 
     * @param string $email Correo electrónico del usuario
     * @param string $password Contraseña del usuario
     * @return array|false Retorna los datos del usuario si es válido, false si no
     */
    public function verifyCredentials(string $email, string $password)
    {
        $query = "SELECT u_login, u_id, codigo_perfil, u_password, u_nombre, u_apellido 
                  FROM gr_usuarios 
                  WHERE u_login = ? AND u_activo = 1";
        
        // Ejecutar la consulta
        $this->conexion->resolviendo_pregunta($query, [$email]);
        
        // Obtener resultados
        $filas = $this->conexion->obtenerResultados();
        
        if (!empty($filas) && count($filas) === 1) {
            $usuario = $filas[0];
            
            // Verificar si la contraseña proporcionada coincide con el hash almacenado
            if (password_verify($password, $usuario['u_password'])) {
                return [
                    'u_login' => $usuario["u_login"],
                    'codigo_perfil' => $usuario["codigo_perfil"],
                    'u_id' => $usuario["u_id"],
                    'u_nombre' => $usuario["u_nombre"] ?? '',
                    'u_apellido' => $usuario["u_apellido"] ?? ''
                ];
            }
        }
        
        return false;
    }
    
    /**
     * Obtiene información del usuario por ID
     * 
     * @param int $userId ID del usuario
     * @return array|false Información del usuario o false si no existe
     */
    public function getUserById(int $userId)
    {
        $query = "SELECT u_id, u_login, u_nombre, u_apellido, codigo_perfil, u_activo 
                  FROM gr_usuarios 
                  WHERE u_id = ?";
        
        $this->conexion->resolviendo_pregunta($query, [$userId]);
        $filas = $this->conexion->obtenerResultados();
        
        return !empty($filas) ? $filas[0] : false;
    }
    
    /**
     * Verifica si el usuario tiene permiso para una página específica
     * 
     * @param string $pagina Página a verificar
     * @param int $perfil Perfil del usuario
     * @return bool
     */
    public function hasPermission(string $pagina, int $perfil): bool
    {
        $query = "SELECT COUNT(*) as tiene_permiso 
                  FROM gr_permisos 
                  WHERE pagina = ? AND codigo_perfil = ?";
        
        $this->conexion->resolviendo_pregunta($query, [$pagina, $perfil]);
        $filas = $this->conexion->obtenerResultados();
        
        return !empty($filas) && $filas[0]['tiene_permiso'] > 0;
    }
    
    /**
     * Registra el último acceso del usuario
     * 
     * @param int $userId ID del usuario
     * @return bool
     */
    public function updateLastAccess(int $userId): bool
    {
        $query = "UPDATE gr_usuarios 
                  SET updated_at = NOW() 
                  WHERE u_id = ?";
        
        return $this->conexion->resolviendo_pregunta($query, [$userId]);
    }
    
    /**
     * Cierra la sesión del usuario
     * 
     * @param int $userId ID del usuario
     * @return bool
     */
    public function logout(int $userId): bool
    {
        // Aquí podrías registrar el logout si lo necesitas
        return true;
    }
}

# Módulo de Autenticación - SGIGESCON

## Estructura

```
src/Auth/
â”œ── Domain/
│   â”œ── Models/
│   │   â”œ── User.php          # Modelo de usuario
│   │   └── Session.php       # Modelo de sesión
â”œ── Interfaces/
│   â”œ── Controllers/
│   │   └── AuthController.php # Controlador de autenticación
│   └── Views/
│       â”œ── loginView.php      # Vista del login
│       └── loginView.js      # JavaScript del login
└── README.md                # Este archivo
```

## Funcionalidades

### 1. Login
- **Validación de correo electrónico**: Verifica formato válido
- **Validación de contraseña**: Mínimo 6 caracteres
- **Verificación de credenciales**: Contra base de datos con hash
- **Manejo de sesión**: Creación y gestión de sesión segura
- **Recordarme**: Opción para mantener sesión activa
- **Redirección automática**: Al dashboard si está logueado

### 2. Logout
- **Destrucción de sesión**: Limpia variables de sesión
- **Eliminación de cookies**: Limpia cookies de remember me
- **Registro de actividad**: Guarda último acceso

### 3. Verificación de sesión
- **Check de autenticación**: Verifica si el usuario está logueado
- **Datos de usuario**: Retorna información del usuario actual

## Características de Seguridad

### 1. Hash de Contraseñas
- Utiliza `password_hash()` con `PASSWORD_DEFAULT`
- Verificación con `password_verify()`

### 2. Prevención de ataques
- **SQL Injection**: Usando prepared statements
- **XSS**: Escapando salida con `htmlspecialchars()`
- **CSRF**: Tokens de sesión y validación

### 3. Manejo de errores
- **Mensajes genéricos**: No revela información sensible
- **Logging**: Registro de intentos fallidos
- **Rate limiting**: (Implementación futura)

## Uso

### 1. Acceso al Login
```
http://localhost/sgigescon/src/Auth/Interfaces/Views/loginView.php
```

### 2. Endpoints del Controlador

#### Login
```
POST /sgigescon/src/Auth/Interfaces/Controllers/AuthController.php?action=login
```

**Parámetros:**
- `u_login`: Correo electrónico
- `u_password`: Contraseña
- `remember`: (opcional) "on" para recordar sesión

**Respuesta:**
```json
{
    "success": true,
    "message": "Inicio de sesión exitoso",
    "redirect": "/sgigescon/src/Layout/Interfaces/Views/layoutView.php",
    "user": {
        "id": 123,
        "login": "usuario@ejemplo.com",
        "perfil": 1,
        "nombre": "Juan",
        "apellido": "Pérez"
    }
}
```

#### Logout
```
GET /sgigescon/src/Auth/Interfaces/Controllers/AuthController.php?action=logout
```

#### Verificar Sesión
```
GET /sgigescon/src/Auth/Interfaces/Controllers/AuthController.php?action=check
```

**Respuesta:**
```json
{
    "authenticated": true,
    "user": {
        "u_login": "usuario@ejemplo.com",
        "u_perfil": 1,
        "u_id": 123,
        "u_nombre": "Juan",
        "u_apellido": "Pérez"
    }
}
```

## Integración con Layout Existente

### 1. Verificación de sesión
```php
<?php
session_start();
if (!isset($_SESSION['seguridad'])) {
    header("Location: /sgigescon/src/Auth/Interfaces/Views/loginView.php");
    exit;
}
?>
```

### 2. Obtener datos del usuario
```php
<?php
$sessionData = json_decode($_SESSION['seguridad'], true);
$userId = $sessionData['u_id'];
$userName = $sessionData['u_nombre'] . ' ' . $sessionData['u_apellido'];
$userProfile = $sessionData['u_perfil'];
?>
```

### 3. Logout desde el layout
```html
<a href="/sgigescon/src/Auth/Interfaces/Controllers/AuthController.php?action=logout" class="btn-logout">
    <i class="bi bi-box-arrow-right"></i>
    Cerrar Sesión
</a>
```

## Mejoras Futuras

1. **Two-Factor Authentication (2FA)**
2. **Rate Limiting** para prevenir ataques de fuerza bruta
3. **OAuth Integration** (Google, Microsoft)
4. **Password Recovery** con token seguro
5. **Session Management** (ver sesiones activas)
6. **Audit Logging** completo de actividades

## Dependencias

- PHP 8.0+
- MySQL/MariaDB
- Bootstrap 5.3.0
- Bootstrap Icons 1.11.0

## Notas

- El módulo mantiene compatibilidad con la estructura de base de datos existente
- Se migraron las funcionalidades del sistema antiguo (`antiguo/src/Sesion/`)
- Se implementaron mejores prácticas de seguridad y arquitectura limpia

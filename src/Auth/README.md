# MÃ³dulo de AutenticaciÃ³n - SGIGESCON

## Estructura

```
src/Auth/
â”œâ”€â”€ Domain/
â”‚   â”œâ”€â”€ Models/
â”‚   â”‚   â”œâ”€â”€ User.php          # Modelo de usuario
â”‚   â”‚   â””â”€â”€ Session.php       # Modelo de sesiÃ³n
â”œâ”€â”€ Interfaces/
â”‚   â”œâ”€â”€ Controllers/
â”‚   â”‚   â””â”€â”€ AuthController.php # Controlador de autenticaciÃ³n
â”‚   â””â”€â”€ Views/
â”‚       â”œâ”€â”€ loginView.php      # Vista del login
â”‚       â””â”€â”€ loginView.js      # JavaScript del login
â””â”€â”€ README.md                # Este archivo
```

## Funcionalidades

### 1. Login
- **ValidaciÃ³n de correo electrÃ³nico**: Verifica formato vÃ¡lido
- **ValidaciÃ³n de contraseÃ±a**: MÃ­nimo 6 caracteres
- **VerificaciÃ³n de credenciales**: Contra base de datos con hash
- **Manejo de sesiÃ³n**: CreaciÃ³n y gestiÃ³n de sesiÃ³n segura
- **Recordarme**: OpciÃ³n para mantener sesiÃ³n activa
- **RedirecciÃ³n automÃ¡tica**: Al dashboard si estÃ¡ logueado

### 2. Logout
- **DestrucciÃ³n de sesiÃ³n**: Limpia variables de sesiÃ³n
- **EliminaciÃ³n de cookies**: Limpia cookies de remember me
- **Registro de actividad**: Guarda Ãºltimo acceso

### 3. VerificaciÃ³n de sesiÃ³n
- **Check de autenticaciÃ³n**: Verifica si el usuario estÃ¡ logueado
- **Datos de usuario**: Retorna informaciÃ³n del usuario actual

## CaracterÃ­sticas de Seguridad

### 1. Hash de ContraseÃ±as
- Utiliza `password_hash()` con `PASSWORD_DEFAULT`
- VerificaciÃ³n con `password_verify()`

### 2. PrevenciÃ³n de ataques
- **SQL Injection**: Usando prepared statements
- **XSS**: Escapando salida con `htmlspecialchars()`
- **CSRF**: Tokens de sesiÃ³n y validaciÃ³n

### 3. Manejo de errores
- **Mensajes genÃ©ricos**: No revela informaciÃ³n sensible
- **Logging**: Registro de intentos fallidos
- **Rate limiting**: (ImplementaciÃ³n futura)

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

**ParÃ¡metros:**
- `u_login`: Correo electrÃ³nico
- `u_password`: ContraseÃ±a
- `remember`: (opcional) "on" para recordar sesiÃ³n

**Respuesta:**
```json
{
    "success": true,
    "message": "Inicio de sesiÃ³n exitoso",
    "redirect": "/sgigescon/src/Layout/Interfaces/Views/layoutView.php",
    "user": {
        "id": 123,
        "login": "usuario@ejemplo.com",
        "perfil": 1,
        "nombre": "Juan",
        "apellido": "PÃ©rez"
    }
}
```

#### Logout
```
GET /sgigescon/src/Auth/Interfaces/Controllers/AuthController.php?action=logout
```

#### Verificar SesiÃ³n
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
        "u_apellido": "PÃ©rez"
    }
}
```

## IntegraciÃ³n con Layout Existente

### 1. VerificaciÃ³n de sesiÃ³n
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
    Cerrar SesiÃ³n
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

- El mÃ³dulo mantiene compatibilidad con la estructura de base de datos existente
- Se migraron las funcionalidades del sistema antiguo (`antiguo/src/Sesion/`)
- Se implementaron mejores prÃ¡cticas de seguridad y arquitectura limpia

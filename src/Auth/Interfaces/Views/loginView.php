<?php
session_start();
require_once __DIR__ . '/../../../../config/ConexionBD.php';
require_once __DIR__ . '/../../Domain/Models/User.php';

// Si ya está logueado, redirigir al dashboard
if (isset($_SESSION['seguridad'])) {
    header("Location: /sgigescon/src/Layout/Interfaces/Views/layoutView.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - SGIGESCON</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="/sgigescon/src/Layout/Interfaces/Views/layoutView.css">
    <style>
        :root {
            --primary-color: #005699;
            --primary-light: #306DD7;
            --primary-dark: #003d6e;
            --accent-color: #00a8ff;
            --text-color: #333333;
            --bg-color: #f8f9fa;
        }

        body {
            background: linear-gradient(135deg, #005699 0%, #00a8ff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            color: var(--text-color);
            margin: 0;
            padding: 20px;
        }
        
        .login-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            padding: 3rem;
            width: 100%;
            max-width: 450px;
            transition: transform 0.3s ease;
        }

        .login-card:hover {
            transform: translateY(-5px);
        }
        
        .login-header {
            text-align: center;
            margin-bottom: 2.5rem;
        }
        
        .login-header h2 {
            color: var(--primary-color);
            font-weight: 800;
            margin-bottom: 0.5rem;
            letter-spacing: -0.5px;
        }
        
        .login-header p {
            color: #6c757d;
            font-size: 0.95rem;
        }
        
        .logo-circle {
            width: 80px;
            height: 80px;
            background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 2.5rem;
            color: #FFFFFF;
            box-shadow: 0 8px 16px rgba(0, 86, 153, 0.3);
        }
        
        .form-floating > .form-control:focus ~ label,
        .form-floating > .form-control:not(:placeholder-shown) ~ label {
            color: var(--primary-color);
            transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
        }
        
        .form-control {
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1rem 0.75rem;
            font-size: 1rem;
            transition: all 0.2s ease;
        }
        
        .form-control:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(0, 86, 153, 0.1);
        }
        
        .btn-login {
            background: linear-gradient(to right, var(--primary-color), var(--primary-light));
            border: none;
            border-radius: 12px;
            padding: 1rem;
            font-size: 1rem;
            font-weight: 600;
            color: #FFFFFF;
            width: 100%;
            margin-top: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 86, 153, 0.3);
        }
        
        .btn-login:hover {
            background: linear-gradient(to right, var(--primary-dark), var(--primary-color));
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 86, 153, 0.4);
        }

        .btn-login:active {
            transform: translateY(0);
        }
        
        .alert {
            border: none;
            border-radius: 12px;
            font-size: 0.9rem;
            padding: 1rem;
            margin-bottom: 2rem;
            background-color: #fff5f5;
            color: #c53030;
            display: flex;
            align-items: center;
            border-left: 4px solid #c53030;
        }

        .form-check-input:checked {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
        }

        .footer-text {
            text-align: center;
            margin-top: 2rem;
            font-size: 0.85rem;
            color: #6c757d;
        }
        
        /* Micro-animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .login-card {
            animation: fadeIn 0.6s ease-out;
        }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="login-header">
            <div class="logo-circle" style="background: white; padding: 10px;">
                <img src="/sgigescon/public/images/logogescont.png" alt="Logo SGI" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h2>SGIGESCON</h2>
            <p>Sistema de Gestión Integral de Construcción</p>
        </div>
        
        <?php if (isset($_GET['error'])): ?>
            <div class="alert" role="alert">
                <i class="bi bi-exclamation-circle-fill me-2"></i>
                <?php echo htmlspecialchars($_GET['error']); ?>
            </div>
        <?php endif; ?>
        
        <form id="loginForm" method="POST" action="/sgigescon/src/Auth/Interfaces/Controllers/AuthController.php">
            <div class="form-floating mb-4">
                <input type="email" class="form-control" id="u_login" name="u_login" placeholder="nombre@ejemplo.com" required>
                <label for="u_login">Correo Electrónico</label>
            </div>
            
            <div class="form-floating mb-4">
                <input type="password" class="form-control" id="u_password" name="u_password" placeholder="Contraseña" required>
                <label for="u_password">Contraseña</label>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="remember" name="remember">
                    <label class="form-check-label text-muted" for="remember">
                        Recordarme
                    </label>
                </div>
                <!-- <a href="#" class="text-decoration-none small">¿Olvidó su contraseña?</a> -->
            </div>
            
            <button type="submit" class="btn btn-login">
                <span>Iniciar Sesión</span>
                <i class="bi bi-arrow-right ms-2"></i>
            </button>
        </form>
        
        <div class="footer-text">
            <div class="mb-2">
                <img src="/sgigescon/public/images/logoqualitysin.png" alt="Quality Pro Software" style="height: 25px; opacity: 0.8;">
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/sgigescon/src/Auth/Interfaces/Views/loginView.js"></script>
</body>
</html>

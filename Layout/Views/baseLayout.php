<?php
// Incluir Configuración Global
require_once __DIR__ . '/../../../config/AppConfig.php';

// Iniciar sesión si no está iniciada (o asumir que ya se hizo en un script padre)
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Obtener el rol del usuario de la sesión
$rolUsuario = $_SESSION['rol'] ?? 'guest';

// Determinar la página actual
$page = isset($_GET['page']) ? $_GET['page'] : AppConfig::getDefaultPage($rolUsuario);

// Definir permisos básicos para cada página
$permissions = [
    'dashboard' => ['admin'],
    'corregimientos' => ['admin'],
    'mesas' => ['admin'],
    'lideres' => ['admin'],
    'votantes' => ['admin', 'lider'],
    'asistencia' => ['lider'],
    'jornadas' => ['admin'],
    'inspeccion_corregimiento' => ['admin'],
    'system_reset_secure' => ['admin']
];

// Mapeo de páginas a componentes (definido una sola vez y de forma centralizada)
$components = [
    'en_desarrollo' => __DIR__ . '/../../Shared/en_desarrollo.php',
    
    // Módulos Fase 1 (Siempre activos)
    'corregimientos' => __DIR__ . '/../../corregimientos/corregimientosLayout.php',
    'mesas' => __DIR__ . '/../../mesas/mesasLayout.php',
    'lideres' => __DIR__ . '/../../lideres/lideresLayout.php',
    'votantes' => __DIR__ . '/../../votantes/votantesLayout.php',
    'jornadas' => __DIR__ . '/../../jornadas/jornadasLayout.php',
    'system_reset_secure' => __DIR__ . '/../../admin/reset_seguro.php',

    // Módulos Fase 2
    'inspeccion_corregimiento' => (AppConfig::isModuleAvailable(2)) 
        ? __DIR__ . '/../../inspeccion/inspeccionCorregimientoLayout.php' 
        : __DIR__ . '/../../Shared/en_desarrollo.php',
        
    'asistencia' => (AppConfig::isModuleAvailable(2)) 
        ? __DIR__ . '/../../asistencia/asistenciaLayout.php' 
        : __DIR__ . '/../../Shared/en_desarrollo.php',

     // Módulos Fase 3
    'dashboard' => (AppConfig::isModuleAvailable(3)) 
        ? __DIR__ . '/../../dashboard/dashboard.php' 
        : __DIR__ . '/../../Shared/en_desarrollo.php',
];

// Verificar acceso y existencia del componente
$accesoPermitido = true;
$componentPath = $components[$page] ?? null;

if (array_key_exists($page, $permissions)) {
    if (!in_array($rolUsuario, $permissions[$page])) {
        $accesoPermitido = false;
    }
}

// Si la página no existe en el mapeo o no hay acceso, redirigir
if (!$accesoPermitido || !isset($components[$page]) || !file_exists($componentPath)) {
    $redirectPage = '?page=' . AppConfig::getDefaultPage($rolUsuario);
    if ($rolUsuario === 'guest') {
         $redirectPage = 'src/componentes/login/login.php';
    }
    echo "<script>window.location.href = '$redirectPage';</script>";
    exit(); // Terminar ejecución después de la redirección
}

// Incluir Header (HTML start)
include_once __DIR__ . '/../../Shared/header.php';
?>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="logo">
            <i class="bi bi-building" style="font-size: 2rem; color: var(--primary-color);"></i>
            <span class="logo-text">Alcaldía Bugalagrande</span>
        </div>
        <button class="sidebar-toggle" id="sidebarToggle">
            <i class="bi bi-list"></i>
        </button>
    </div>

    <nav class="sidebar-nav">
        <?php
        // $rolUsuario ya está definido arriba
        
        if ($rolUsuario === 'lider'): 
        ?>
            <!-- Menú para Líderes -->
            <div class="nav-section">
                <div class="nav-section-title">Mi Gestión</div>
                <ul class="nav-list">
                    <?php /* if (AppConfig::isModuleAvailable(2)): */ ?>
                    <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] == 'asistencia') ? 'active' : ''; ?>">
                        <a href="?page=asistencia" class="nav-link">
                            <i class="bi bi-calendar-check nav-icon"></i>
                            <span class="nav-text">Control Asistencia</span>
                        </a>
                    </li>
                    <?php /* endif; */ ?>
                    
                    <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] == 'votantes') ? 'active' : ''; ?>">
                        <a href="?page=votantes" class="nav-link">
                            <i class="bi bi-people nav-icon"></i>
                            <span class="nav-text">Mis Votantes</span>
                        </a>
                    </li>
                </ul>
            </div>

        <?php else: // Menú para Administrador ?>

            <?php
                $enInspeccion = (
                    isset($_GET['page']) && $_GET['page'] === 'inspeccion_corregimiento' && isset($_GET['id'])
                ) || (
                    isset($_GET['page']) && $_GET['page'] === 'mesas' && isset($_GET['id_corregimiento'])
                );
                $idInspeccion = null;
                if ($enInspeccion) {
                    $idInspeccion = ($_GET['page'] === 'inspeccion_corregimiento') ? $_GET['id'] : $_GET['id_corregimiento'];
                }
            ?>
            
            <?php if ($enInspeccion): ?>
                <div class="nav-section">
                    <div class="nav-section-title">Inspección</div>
                    <ul class="nav-list">
                        <?php /* if (AppConfig::isModuleAvailable(2)): */ ?>
                        <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] === 'inspeccion_corregimiento') ? 'active' : ''; ?>">
                            <a href="?page=inspeccion_corregimiento&id=<?php echo urlencode($idInspeccion); ?>" class="nav-link">
                                <i class="bi bi-search nav-icon"></i>
                                <span class="nav-text">Corregimiento #<?php echo htmlspecialchars($idInspeccion); ?></span>
                            </a>
                        </li>
                        <?php /* endif; */ ?>
                        <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] === 'mesas') ? 'active' : ''; ?>">
                            <a href="?page=mesas&id_corregimiento=<?php echo urlencode($idInspeccion); ?>" class="nav-link">
                                <i class="bi bi-geo-alt nav-icon"></i>
                                <span class="nav-text">Mesas</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="?page=corregimientos" class="nav-link">
                                <i class="bi bi-arrow-left nav-icon"></i>
                                <span class="nav-text">Volver</span>
                            </a>
                        </li>
                    </ul>
                </div>
            <?php else: ?>
                <!-- Gestión Principal ADMIN -->
                <div class="nav-section">
                    <div class="nav-section-title">Gestión Principal</div>
                    <ul class="nav-list">
                        <?php /* if (AppConfig::isModuleAvailable(3)): */ ?>
                        <li class="nav-item <?php echo (!isset($_GET['page']) || $_GET['page'] == 'dashboard') ? 'active' : ''; ?>">
                            <a href="?page=dashboard" class="nav-link">
                                <i class="bi bi-speedometer2 nav-icon"></i>
                                <span class="nav-text">Dashboard</span>
                            </a>
                        </li>
                        <?php /* endif; */ ?>

                        <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] == 'corregimientos') ? 'active' : ''; ?>">
                            <a href="?page=corregimientos" class="nav-link">
                                <i class="bi bi-geo-alt nav-icon"></i>
                                <span class="nav-text">Corregimientos</span>
                            </a>
                        </li>
                        <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] == 'lideres') ? 'active' : ''; ?>">
                            <a href="?page=lideres" class="nav-link">
                                <i class="bi bi-people nav-icon"></i>
                                <span class="nav-text">Líderes</span>
                            </a>
                        </li>
                        <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] == 'votantes') ? 'active' : ''; ?>">
                            <a href="?page=votantes" class="nav-link">
                                <i class="bi bi-person-lines-fill nav-icon"></i>
                                <span class="nav-text">Votantes</span>
                            </a>
                        </li>
                        <li class="nav-item <?php echo (isset($_GET['page']) && $_GET['page'] == 'jornadas') ? 'active' : ''; ?>">
                            <a href="?page=jornadas" class="nav-link">
                                <i class="bi bi-calendar-check nav-icon"></i>
                                <span class="nav-text">Jornadas Votación</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="nav-divider"></div>
            <?php endif; ?>
        <?php endif; ?>
    </nav>

    <div class="sidebar-footer">
        <div class="user-profile">
            <div class="user-avatar"><i class="bi bi-person-circle"></i></div>
            <div class="user-info">
                <div class="user-name"><?php echo htmlspecialchars($_SESSION['nombre_usuario'] ?? 'Usuario'); ?></div>
                <div class="user-role"><?php echo ucfirst(htmlspecialchars($_SESSION['rol'] ?? 'Invitado')); ?></div>
            </div>
        </div>
    </div>
</aside>

<!-- Main Content -->
<main class="main-content">
    <header class="main-header">
        <div class="header-left">
            <button class="mobile-menu-toggle" id="mobileMenuToggle"><i class="bi bi-list"></i></button>
            <h1 class="page-title">
                <?php
                $titles = [
                    'dashboard' => 'Dashboard',
                    'corregimientos' => 'Gestión de Corregimientos',
                    'mesas' => 'Gestión de Mesas de Votación',
                    'lideres' => 'Gestión de Líderes',
                    'jornadas' => 'Gestión de Jornadas de Votación',
                    'votantes' => 'Gestión de Votantes',
                    'inspeccion_corregimiento' => 'Inspección de Corregimiento',
                    'asistencia' => 'Control de Asistencia de Votantes'
                ];
                // $page y $rolUsuario ya están definidos globalmente
                echo isset($titles[$page]) ? $titles[$page] : 'Sistema de Gestión';
                ?>
            </h1>
        </div>
        <div class="header-right">
            <button class="header-btn" onclick="cerrarSesion()" title="Cerrar Sesión"><i class="bi bi-box-arrow-right"></i></button>
        </div>
    </header>

    <div class="content-area">
        <div class="content-wrapper" id="contentWrapper">
            <?php
            // Incluir el componente, ya que todas las verificaciones de acceso y existencia se hicieron al inicio
            include $componentPath;
            ?>
        </div>
    </div>
</main>

<?php
// Incluir footer ANTES de los estilos y scripts del layout
// Esto asegura que jQuery esté disponible para los scripts de los componentes
include_once __DIR__ . '/../../Shared/footer.php';
?>

<style>
    /* Estilos del Layout */
    body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    /* Sidebar */
    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 260px;
        background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
        color: white;
        overflow-y: auto;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    }

    .sidebar-header {
        padding: 1.5rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .logo-text {
        font-size: 1.25rem;
        font-weight: 600;
        color: white;
    }

    .sidebar-toggle {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: background 0.2s;
    }

    .sidebar-toggle:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .sidebar-nav {
        padding: 1rem 0;
    }

    .nav-section {
        margin-bottom: 1.5rem;
    }

    .nav-section-title {
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.05em;
    }

    .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .nav-item {
        margin: 0.25rem 0.5rem;
    }

    .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        border-radius: 0.5rem;
        transition: all 0.2s;
        font-weight: 500;
    }

    .nav-link:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .nav-item.active .nav-link {
        background: var(--primary-color);
        color: white;
    }

    .nav-icon {
        font-size: 1.25rem;
        width: 1.5rem;
        text-align: center;
    }

    .nav-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 1rem 0;
    }

    .sidebar-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
    }

    .user-profile {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .user-avatar {
        font-size: 2rem;
        color: rgba(255, 255, 255, 0.8);
    }

    .user-name {
        font-weight: 600;
        font-size: 0.875rem;
    }

    .user-role {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
    }

    /* Main Content */
    .main-content {
        margin-left: 260px;
        min-height: 100vh;
        background: var(--bg-body);
        transition: margin-left 0.3s ease;
    }

    .main-header {
        background: white;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .mobile-menu-toggle {
        display: none;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-primary);
        cursor: pointer;
        padding: 0.5rem;
    }

    .page-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .header-btn {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1.25rem;
    }

    .header-btn:hover {
        background: var(--bg-header);
        border-color: var(--primary-color);
        color: var(--primary-color);
    }

    .content-area {
        padding: 2rem;
    }

    .content-wrapper {
        max-width: 1400px;
        margin: 0 auto;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .sidebar {
            transform: translateX(-100%);
        }

        .sidebar.active {
            transform: translateX(0);
        }

        .main-content {
            margin-left: 0;
        }

        .mobile-menu-toggle {
            display: block;
        }
    }
</style>

<script>
    // Toggle sidebar en móvil
    document.getElementById('mobileMenuToggle')?.addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.getElementById('sidebarToggle')?.addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Función de cerrar sesión
    function cerrarSesion() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            window.location.href = 'src/componentes/login/loginController.php?action=logout';
        }
    }
</script>

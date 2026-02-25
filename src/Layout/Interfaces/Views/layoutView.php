<?php
session_start();
if (!isset($_SESSION['seguridad'])) {
    header("Location: /sgigescomnew/src/Auth/Interfaces/Views/loginView.php");
    exit;
}
$userSession = json_decode($_SESSION['seguridad'], true) ?: [];
$userName = ($userSession['u_nombre'] ?? '') . ' ' . ($userSession['u_apellido'] ?? '');
$userName = trim($userName) ?: ($userSession['u_login'] ?? 'Usuario');
$userRole = (isset($userSession['u_perfil']) && $userSession['u_perfil'] == 1) ? 'Administrador' : 'Usuario';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SGI - Sistema de Gestión Integral</title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom Theme CSS - Override Bootstrap colors -->
    <link rel="stylesheet" href="/sgigescomnew/public/css/custom-theme.css">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- DataTables CSS -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
    
    <!-- Layout CSS -->
    <link rel="stylesheet" href="/sgigescomnew/src/Layout/Interfaces/Views/layoutView.css">
</head>
<body>
    <div class="layout-container">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo-container">
                    <i class="bi bi-building-gear"></i>
                    <h4 class="logo-text">SGI Control</h4>
                </div>
                <button class="sidebar-toggle" id="sidebarToggle">
                    <i class="bi bi-list"></i>
                </button>
            </div>

            <nav class="sidebar-nav">
                <!-- Main Navigation -->
                <div id="mainNav">
                    <div class="nav-section">
                        <div class="nav-section-title">
                            <i class="bi bi-dash-lg"></i>
                            <span>Gestión Principal</span>
                        </div>
                        <a href="#" class="nav-item active" data-component="proyectos">
                            <i class="bi bi-folder-fill"></i>
                            <span class="nav-text">Proyectos</span>
                        </a>
                        <a href="#" class="nav-item" data-component="clientes">
                            <i class="bi bi-people-fill"></i>
                            <span class="nav-text">Clientes</span>
                        </a>
                        <a href="#" class="nav-item" data-component="provedores">
                            <i class="bi bi-truck"></i>
                            <span class="nav-text">Proveedores</span>
                        </a>
                        <a href="#" class="nav-item" data-component="items">
                            <i class="bi bi-box-seam"></i>
                            <span class="nav-text">Items</span>
                        </a>
                    </div>
                    <div class="nav-divider"></div>
                    <div class="nav-section">
                        <div class="nav-section-title">
                            <i class="bi bi-dash-lg"></i>
                            <span>Operaciones</span>
                        </div>
                        <a href="#" class="nav-item" data-component="pedidosAdmin">
                            <i class="bi bi-clipboard-check"></i>
                            <span class="nav-text">Pedidos Admin</span>
                        </a>
                        <a href="#" class="nav-item" data-component="ordenesCompra">
                            <i class="bi bi-cart-check"></i>
                            <span class="nav-text">Órdenes de Compra</span>
                        </a>
                        <a href="#" class="nav-item" data-component="compras">
                            <i class="bi bi-bag-check-fill"></i>
                            <span class="nav-text">Compras</span>
                        </a>
                    </div>
                </div>

                <!-- Project Inspection Navigation (Hidden by default) -->
                <div id="projectNav" style="display: none;">
                    <div class="nav-section">
                        <div class="project-header">
                            <button class="btn-back-main" id="btnBackToMain">
                                <i class="bi bi-arrow-left"></i>
                                <span>Volver</span>
                            </button>
                            <div class="project-info">
                                <i class="bi bi-folder-open"></i>
                                <div class="project-details">
                                    <span class="project-name" id="currentProjectName">Proyecto</span>
                                    <span class="project-label">Inspección de Proyecto</span>
                                </div>
                                <!-- Indicador visual adicional -->
                                <div class="project-indicator" id="projectIndicator" style="display: none;">
                                    <i class="bi bi-check-circle-fill text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="nav-section">
                        <div class="nav-section-title">
                            <i class="bi bi-dash-lg"></i>
                            <span>Gestión del Proyecto</span>
                        </div>
                        <a href="#" class="nav-item" data-component="capitulos" data-project-locked="true">
                            <i class="bi bi-journal-text"></i>
                            <span class="nav-text">Capítulos</span>
                        </a>
                        <a href="#" class="nav-item" data-component="pedido" data-project-locked="true">
                            <i class="bi bi-clipboard-data"></i>
                            <span class="nav-text">Pedidos</span>
                        </a>
                        <a href="#" class="nav-item" data-component="importMasiva" data-project-locked="true">
                            <i class="bi bi-file-earmark-arrow-up"></i>
                            <span class="nav-text">Importación Masiva</span>
                        </a>
                    </div>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="user-details">
                        <span class="user-name"><?php echo htmlspecialchars($userName); ?></span>
                        <span class="user-role"><?php echo htmlspecialchars($userRole); ?></span>
                    </div>
                </div>
                <button class="btn-logout" title="Cerrar sesión" onclick="window.location.href='/sgigescomnew/logout.php'">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Top Bar -->
            <header class="topbar">
                <div class="topbar-left">
                    <button class="mobile-toggle" id="mobileToggle">
                        <i class="bi bi-list"></i>
                    </button>
                    <h5 class="page-title" id="pageTitle">Dashboard</h5>
                    <!-- Project Name in Topbar - Direct text without container -->
                    <span class="topbar-project-name text-primary fw-bold" id="topbarProjectName" style="display: none;">Proyecto</span>
                </div>
                <div class="topbar-right">
                    <button class="topbar-btn" title="Notificaciones">
                        <i class="bi bi-bell"></i>
                        <span class="badge">3</span>
                    </button>
                    <button class="topbar-btn" title="Configuración">
                        <i class="bi bi-gear"></i>
                    </button>
                </div>
            </header>

            <!-- Content Area -->
            <div class="content-area" id="contentArea">
                <!-- Dashboard Content (Default) -->
                <div class="dashboard-welcome">
                    <div class="welcome-card">
                        <div class="welcome-icon">
                            <i class="bi bi-house-heart"></i>
                        </div>
                        <h2>Bienvenido al Sistema de Gestión Integral</h2>
                        <p>Selecciona una opción del menú lateral para comenzar</p>
                    </div>

                    <div class="quick-stats">
                        <div class="stat-card">
                            <div class="stat-icon proyectos">
                                <i class="bi bi-folder-fill"></i>
                            </div>
                            <div class="stat-info">
                                <h3>Proyectos</h3>
                                <p class="stat-number">12</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon clientes">
                                <i class="bi bi-people-fill"></i>
                            </div>
                            <div class="stat-info">
                                <h3>Clientes</h3>
                                <p class="stat-number">45</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon compras">
                                <i class="bi bi-cart-check"></i>
                            </div>
                            <div class="stat-info">
                                <h3>Órdenes</h3>
                                <p class="stat-number">28</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon proveedores">
                                <i class="bi bi-truck"></i>
                            </div>
                            <div class="stat-info">
                                <h3>Proveedores</h3>
                                <p class="stat-number">18</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    
    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- DataTables JS -->
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    
    <!-- Custom JS -->
    <script src="/sgigescomnew/src/Layout/Interfaces/Views/layoutView.js"></script>
</body>
</html>

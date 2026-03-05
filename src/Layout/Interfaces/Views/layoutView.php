<?php
session_start();
if (!isset($_SESSION['seguridad'])) {
    header("Location: /sgigesconnew/src/Auth/Interfaces/Views/loginView.php");
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
    <link rel="stylesheet" href="/sgigesconnew/public/css/custom-theme.css">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- DataTables CSS -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
    
    <!-- Layout CSS -->
    <link rel="stylesheet" href="/sgigesconnew/src/Layout/Interfaces/Views/layoutView.css">
</head>
<body>
    <div class="layout-container">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo-container">
                    <img src="/sgigesconnew/public/images/logogescont.png" alt="Logo" class="sidebar-logo">
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
                        <a href="#" class="nav-item" data-component="pedido" data-project-locked="true">
                            <i class="bi bi-clipboard-data"></i>
                            <span class="nav-text">Pedidos</span>
                        </a>
                        <a href="#" class="nav-item" data-component="capitulos" data-project-locked="true">
                            <i class="bi bi-journal-text"></i>
                            <span class="nav-text">Capítulos</span>
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
                <div class="sidebar-footer-actions">
                    <button class="btn-logout" title="Cerrar sesión" onclick="window.location.href='/sgigesconnew/src/Auth/Interfaces/Controllers/AuthController.php?action=logout'">
                        <i class="bi bi-box-arrow-right"></i>
                    </button>
                    <!-- Logo Quality Pro movido al Topbar -->
                </div>
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
                    <div class="topbar-divider"></div>
                    <div class="topbar-quality-logo" title="Powered by Quality Pro Software">
                        <img src="/sgigesconnew/public/images/logoqualitysin.png" alt="Quality Pro">
                    </div>
                </div>
            </header>

            <!-- Content Area -->
            <div class="content-area" id="contentArea">
                <!-- Dashboard Content (Default) -->
                <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-3 text-muted">Iniciando sistema...</p>
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
    <script src="/sgigesconnew/src/Layout/Interfaces/Views/layoutView.js"></script>
</body>
</html>

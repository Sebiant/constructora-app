// Layout View JavaScript
(function () {
    'use strict';

    // Component mapping
    const componentMap = {
        'proyectos': '/sgigescon/componentes/proyectosComponent.php',
        'items': '/sgigescon/componentes/itemsComponent.php',
        'capitulos': '/sgigescon/componentes/capitulosComponent.php',
        'clientes': '/sgigescon/componentes/clientesComponent.php',
        'provedores': '/sgigescon/componentes/provedoresComponent.php',
        'pedidosAdmin': '/sgigescon/componentes/pedidoAdminComponent.php',
        'cotizaciones': '/sgigescon/src/Cotizacion/Interfaces/Views/cotizacionesView.php',
        'ordenesCompra': '/sgigescon/componentes/ordenesCompraComponent.php',
        'compras': '/sgigescon/componentes/comprasComponent.php',
        'pedido': '/sgigescon/componentes/pedidoComponent.php',
        'importMasiva': '/sgigescon/componentes/ImportMasiveBtnComponent.php',
        'usuarios': '/sgigescon/componentes/usuariosComponent.php'
    };

    // Component titles
    const componentTitles = {
        'proyectos': 'Proyectos',
        'items': 'Items',
        'capitulos': 'Capítulos',
        'clientes': 'Clientes',
        'provedores': 'Proveedores',
        'pedidosAdmin': 'Pedidos Admin',
        'cotizaciones': 'Cotizaciones',
        'ordenesCompra': 'Órdenes de Compra',
        'compras': 'Compras',
        'pedido': 'Pedidos del Proyecto',
        'importMasiva': 'Presupuestos',
        'usuarios': 'Gestión de Usuarios'
    };

    // Current project state
    let currentProject = null;
    let isInProjectMode = false;

    // Registro persistente de scripts externos ya cargados (el DOM no sirve porque
    // contentArea.innerHTML se reemplaza en cada carga, destruyendo los <script> anteriores)
    const _loadedScripts = new Set();

    // Pre-registrar scripts ya presentes en el <head> del layout (jQuery, Bootstrap, etc.)
    Array.from(document.scripts).forEach(s => {
        if (s.src) _loadedScripts.add(new URL(s.src, location.href).href);
    });

    // DOM elements
    const contentArea = document.getElementById('contentArea');
    const pageTitle = document.getElementById('pageTitle');
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('sidebarToggle');
    const navItems = document.querySelectorAll('.nav-item');
    const projectNavItems = document.querySelectorAll('#projectNav .nav-item');

    // Function to update project name in header
    function updateProjectNameInHeader() {
        console.log('[Layout] updateProjectNameInHeader called');
        console.log('[Layout] DOM elements:', {
            currentProjectNameElement: !!document.getElementById('currentProjectName'),
            projectNameFromSession: sessionStorage.getItem('selectedProjectName')
        });

        const projectName = sessionStorage.getItem('selectedProjectName');

        if (!projectName) {
            console.warn('[Layout] No project name found in session');
            return;
        }

        // Try multiple times to find the element
        let attempts = 0;
        const maxAttempts = 10;

        const tryUpdateName = () => {
            attempts++;
            const projectNameElement = document.getElementById('currentProjectName');

            if (projectNameElement) {
                projectNameElement.textContent = projectName;
                console.log('[Layout] Project name updated in header:', projectName);
                console.log('[Layout] Element found after', attempts, 'attempts');

                // Show indicator
                const indicator = document.getElementById('projectIndicator');
                if (indicator) {
                    indicator.style.display = 'block';
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 3000); // Hide after 3 seconds
                }

                // Also update topbar project name (direct span, no container)
                const topbarProjectName = document.getElementById('topbarProjectName');

                if (topbarProjectName) {
                    topbarProjectName.style.display = 'inline';
                    topbarProjectName.textContent = projectName;
                    console.log('[Layout] Topbar project name updated:', projectName);
                } else {
                    console.warn('[Layout] Topbar project element not found');
                }

                return;
            }

            if (attempts < maxAttempts) {
                console.log('[Layout] Element not found, retrying...', attempts);
                setTimeout(tryUpdateName, 100);
            } else {
                console.error('[Layout] Could not find currentProjectName element after', maxAttempts, 'attempts');
                console.log('[Layout] Available elements:', document.querySelectorAll('[id*="project"], [id*="Project"]'));
            }
        };

        tryUpdateName();
    }

    // Function to switch to project navigation
    function switchToProjectNav(projectId, projectName) {
        console.log('[Layout] switchToProjectNav called:', { projectId, projectName });

        currentProject = { id: projectId, name: projectName };
        isInProjectMode = true;

        // Update document title
        document.title = projectName + ' - SGI';

        // Hide main nav, show project nav
        document.getElementById('mainNav').style.display = 'none';
        document.getElementById('projectNav').style.display = 'block';

        // Update project name in header with multiple attempts
        const updateNameWithRetry = () => {
            let attempts = 0;
            const maxAttempts = 20;

            const tryUpdate = () => {
                attempts++;
                const projectNameElement = document.getElementById('currentProjectName');

                if (projectNameElement) {
                    projectNameElement.textContent = projectName;
                    console.log('[Layout] Project name updated in header:', projectName);
                    console.log('[Layout] Element found after', attempts, 'attempts');

                    // Show indicator
                    const indicator = document.getElementById('projectIndicator');
                    if (indicator) {
                        indicator.style.display = 'block';
                        setTimeout(() => {
                            indicator.style.display = 'none';
                        }, 3000); // Hide after 3 seconds
                    }

                // Also update topbar project name
                const topbarProjectName = document.getElementById('topbarProjectName');

                if (topbarProjectName) {
                    topbarProjectName.style.display = 'inline';
                    topbarProjectName.textContent = projectName;
                    console.log('[Layout] Topbar project name updated:', projectName);
                } else {
                    console.warn('[Layout] Topbar project name element not found');
                }

                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(tryUpdate, 50);
            } else {
                console.error('[Layout] Could not find currentProjectName element after', maxAttempts, 'attempts');
            }
        };

        tryUpdate();
    };

    updateNameWithRetry();

        // Store in session
        sessionStorage.setItem('currentProject', JSON.stringify(currentProject));
        sessionStorage.setItem('isInProjectMode', 'true');

        // Store project info for projectLock.js compatibility
        sessionStorage.setItem('selectedProjectId', projectId);
        sessionStorage.setItem('selectedProjectName', projectName);

        // Update active nav items - NO agregar listeners aquí (ya están registrados al inicio)

        // Automatically load Pedido component
        loadComponent('pedido');

        // Set Pedido as active in project nav
        projectNavItems.forEach(nav => nav.classList.remove('active'));
        const pedidoNav = document.querySelector('#projectNav .nav-item[data-component="pedido"]');
        if (pedidoNav) {
            pedidoNav.classList.add('active');
        }

        // Trigger event
        const event = new CustomEvent('projectModeChanged', {
            detail: { mode: 'project', project: currentProject }
        });
        document.dispatchEvent(event);
    }

    // Function to switch to main navigation
    function switchToMainNav() {
        currentProject = null;
        isInProjectMode = false;

        // Update document title
        document.title = 'SGI - Sistema de Gestión Integral';

        // Show main nav, hide project nav
        document.getElementById('mainNav').style.display = 'block';
        document.getElementById('projectNav').style.display = 'none';

        // Hide topbar project name
        const topbarProjectName = document.getElementById('topbarProjectName');
        if (topbarProjectName) {
            topbarProjectName.style.display = 'none';
            console.log('[Layout] Topbar project name hidden');
        }

        // Clear session
        sessionStorage.removeItem('currentProject');
        sessionStorage.removeItem('isInProjectMode');

        // Clear projectLock.js keys
        sessionStorage.removeItem('selectedProjectId');
        sessionStorage.removeItem('selectedProjectName');

        // Load proyectos component
        loadComponent('proyectos');

        // Update active state
        const mainNavItems = document.querySelectorAll('#mainNav .nav-item');
        mainNavItems.forEach(nav => nav.classList.remove('active'));
        const proyectosNav = document.querySelector('#mainNav .nav-item[data-component="proyectos"]');
        if (proyectosNav) {
            proyectosNav.classList.add('active');
        }

        // Trigger event
        const event = new CustomEvent('projectModeChanged', {
            detail: { mode: 'main', project: null }
        });
        document.dispatchEvent(event);
    }

    // Initialize component-specific functionality
    function initializeComponent(componentName) {
        console.log(`[Layout] Initializing component: ${componentName}`);

        switch (componentName) {
            case 'pedidosAdmin':
                // Initialize pedidosAdmin if functions are available
                setTimeout(() => {
                    console.log('[Layout] Initializing pedidosAdmin...');
                    if (typeof initPedidosAdmin === 'function') {
                        console.log('[Layout] Calling initPedidosAdmin()...');
                        initPedidosAdmin();
                    } else {
                        console.warn('[Layout] initPedidosAdmin function not found');
                    }
                }, 200);
                break;

            case 'ordenesCompra':
                // Initialize ordenesCompra if module is available
                setTimeout(() => {
                    console.log('[Layout] Initializing ordenesCompra...');
                    if (typeof OrdenesCompraUI !== 'undefined' && typeof OrdenesCompraUI.init === 'function') {
                        OrdenesCompraUI.init();
                    } else if (typeof cargarOrdenes === 'function') {
                        cargarOrdenes();
                    }
                }, 200);
                break;

            case 'compras':
                // Initialize compras if function is available
                setTimeout(() => {
                    console.log('[Layout] Initializing compras via initCompras...');
                    if (typeof initCompras === 'function') {
                        initCompras();
                    } else {
                        // Fallback in case initCompras is not defined yet
                        if (typeof cargarProyectos === 'function') cargarProyectos();
                        if (typeof cargarPedidos === 'function') cargarPedidos();
                        if (typeof cargarCompras === 'function') cargarCompras();
                    }
                }, 200);
                break;

            case 'items':
                // Initialize items if module is available
                setTimeout(() => {
                    console.log('[Layout] Checking for ItemsUI...', typeof ItemsUI);
                    console.log('[Layout] Checking for init function...', typeof init);

                    if (typeof ItemsUI !== 'undefined' && typeof ItemsUI.init === 'function') {
                        console.log('[Layout] Initializing ItemsUI...');
                        ItemsUI.init();
                    } else if (typeof init === 'function') {
                        console.log('[Layout] Initializing with init function...');
                        init();
                    } else {
                        console.warn('[Layout] ItemsUI or init function not found');
                    }
                }, 500);
                break;

            case 'capitulos':
                // Initialize capitulos if function is available
                setTimeout(() => {
                    console.log('[Layout] Checking for capitulos DataTable...', typeof $('#datos_capitulos').DataTable);
                    if (typeof $ !== 'undefined' && $.fn.DataTable && $('#datos_capitulos').length) {
                        console.log('[Layout] Initializing capitulos DataTable...');
                        // The DataTable should auto-initialize via the script, but let's ensure it
                        if (!$.fn.DataTable.isDataTable('#datos_capitulos')) {
                            // Trigger the ready function if it exists
                            if (typeof window.initCapitulosDataTable === 'function') {
                                window.initCapitulosDataTable();
                            }
                        }
                    } else {
                        console.warn('[Layout] Cannot initialize capitulos DataTable - jQuery or DataTable not available');
                    }
                }, 500);
                break;

            case 'importMasiva':
                // Initialize import masiva if function is available
                setTimeout(() => {
                    console.log('[Layout] Checking for import masiva functions...');

                    // Check if we're in project mode
                    const selectedProjectId = sessionStorage.getItem('selectedProjectId');
                    const isProjectMode = sessionStorage.getItem('isInProjectMode') === 'true';

                    if (isProjectMode && selectedProjectId) {
                        console.log('[Layout] Import masiva in project mode, initializing...');

                        // Set project directly without loading all projects
                        const $projectSelect = $('#id_proyecto');
                        if ($projectSelect.length > 0) {
                            // Add project option if it doesn't exist
                            if ($projectSelect.find(`option[value="${selectedProjectId}"]`).length === 0) {
                                const projectName = sessionStorage.getItem('selectedProjectName') || 'Proyecto seleccionado';
                                $projectSelect.append(`<option value="${selectedProjectId}">${projectName}</option>`);
                            }
                            $projectSelect.val(selectedProjectId);
                            $projectSelect.prop('disabled', true);
                            $projectSelect.addClass('project-locked');
                            $projectSelect.trigger('change');

                            console.log('[Layout] Project set immediately for import masiva:', selectedProjectId);
                        }
                    } else {
                        console.log('[Layout] Import masiva not in project mode, showing restricted message');
                    }
                }, 100); // Reduced delay for immediate response
                break;

            case 'proyectos':
                // Initialize proyectos DataTable if function is available
                setTimeout(() => {
                    console.log('[Layout] Initializing proyectos component...');

                    if (typeof initProyectosDataTable === 'function') {
                        console.log('[Layout] Calling initProyectosDataTable...');
                        initProyectosDataTable();
                    } else {
                        console.warn('[Layout] initProyectosDataTable not found');
                    }

                    // Also initialize inspection buttons with longer delay
                    setTimeout(() => {
                        console.log('[Layout] Checking for initializeInspectionButtons...', typeof initializeInspectionButtons);
                        if (typeof initializeInspectionButtons === 'function') {
                            console.log('[Layout] Calling initializeInspectionButtons...');
                            initializeInspectionButtons();
                        } else {
                            console.warn('[Layout] initializeInspectionButtons not found');
                        }
                    }, 500); // Increased delay
                }, 200);
                break;

            case 'clientes':
                // Initialize clientes if function is available
                setTimeout(() => {
                    if (typeof initClientesDataTable === 'function') initClientesDataTable();
                }, 200);
                break;

            case 'provedores':
                // Initialize provedores if function is available
                setTimeout(() => {
                    if (typeof initProvedoresDataTable === 'function') initProvedoresDataTable();
                }, 200);
                break;

            case 'pedido':
                // Initialize pedido if function is available
                setTimeout(() => {
                    if (typeof cargarPedidosProyecto === 'function') cargarPedidosProyecto();
                }, 200);
                break;

            case 'importMasiva':
                // Initialize combined Budget CRUD + Import component
                setTimeout(() => {
                    if (typeof initPresupuestoCRUD === 'function') initPresupuestoCRUD();
                }, 200);
                break;

            case 'cotizaciones':
                // Initialize cotizaciones component
                setTimeout(() => {
                    console.log('[Layout] Initializing cotizaciones...');
                    if (typeof inicializarCotizaciones === 'function') {
                        inicializarCotizaciones();
                    } else {
                        console.warn('[Layout] inicializarCotizaciones function not found');
                    }
                }, 200);
                break;

            case 'usuarios':
                setTimeout(() => {
                    if (typeof initUsuariosDataTable === 'function') initUsuariosDataTable();
                }, 200);
                break;

            default:
                console.warn(`[Layout] No initialization logic for component: ${componentName}`);
        }
    }

    // Show loading state
    function showLoading() {
        contentArea.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-3 text-muted">Cargando componente...</p>
                </div>
            </div>
        `;
    }

    // Show error state
    function showError(componentName) {
        contentArea.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    <h5 class="mt-3">Error al cargar componente</h5>
                    <p class="text-muted">No se pudo cargar el componente: ${componentName}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Recargar página
                    </button>
                </div>
            </div>
        `;
    }

    // Show dashboard
    function showDashboard() {
        contentArea.innerHTML = `
            <div class="container mt-4">
                <div class="row">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="card-header">
                                <h5>Bienvenido al Sistema de Gestión Integral</h5>
                            </div>
                            <div class="card-body">
                                <p>Seleccione una opción del menú lateral para comenzar.</p>
                                <div class="row mt-4">
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <i class="bi bi-folder-fill text-primary" style="font-size: 2rem;"></i>
                                                <h6 class="mt-2">Proyectos</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <i class="bi bi-people-fill text-success" style="font-size: 2rem;"></i>
                                                <h6 class="mt-2">Clientes</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <i class="bi bi-box-seam text-warning" style="font-size: 2rem;"></i>
                                                <h6 class="mt-2">Items</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <i class="bi bi-clipboard-check text-info" style="font-size: 2rem;"></i>
                                                <h6 class="mt-2">Pedidos</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Execute scripts in loaded content
    function executeScripts(container) {
        const scripts = Array.from(container.querySelectorAll('script'));

        function loadNext(index) {
            if (index >= scripts.length) return;

            const oldScript = scripts[index];

            if (oldScript.src) {
                // Normalizar URL para comparación confiable (maneja rutas relativas vs absolutas)
                const resolvedSrc = new URL(oldScript.getAttribute('src'), location.href).href;

                if (_loadedScripts.has(resolvedSrc)) {
                    // Script ya ejecutado en memoria â€” omitir para evitar re-declaración de
                    // class / let / const (ej: PaginadorPresupuestos, API_PROYECTOS...)
                    console.log('[Layout] Script ya cargado, omitiendo:', resolvedSrc.split('/').pop());
                    loadNext(index + 1);
                    return;
                }

                // Primera carga: insertar y registrar en el Set
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.onload = () => {
                    _loadedScripts.add(resolvedSrc);
                    loadNext(index + 1);
                };
                newScript.onerror = () => {
                    console.warn('[Layout] Error al cargar script:', resolvedSrc);
                    loadNext(index + 1);
                };
                oldScript.parentNode.replaceChild(newScript, oldScript);

            } else {
                // Script inline: ejecutar con manejo de error por re-declaración de const/let
                const code = oldScript.innerHTML;
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.appendChild(document.createTextNode(code));

                try {
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                } catch (e) {
                    // Re-declaración de const/let: convertir a var y evaluar en scope global
                    try {
                        const safeCode = code.replace(/\b(const|let)\s+/g, 'var ');
                        (0, eval)(safeCode); // eslint-disable-line no-eval
                    } catch (e2) {
                        console.warn('[Layout] Error en script inline:', e2.message);
                    }
                }
                loadNext(index + 1);
            }
        }

        loadNext(0);
    }

    // Load component
    function loadComponent(componentName) {
        let componentPath = componentMap[componentName];
        const title = componentTitles[componentName] || 'Dashboard';

        // Update page title
        pageTitle.textContent = title;

        // Update URL without reload (optional)
        if (history.pushState) {
            const newUrl = `${window.location.pathname}?component=${componentName}`;
            window.history.pushState({ component: componentName }, '', newUrl);
        }

        // If dashboard or redirect, load proyectos
        if (!componentPath || componentName === 'dashboard') {
            loadComponent('proyectos');
            return;
        }

        // Append project ID if in project mode
        if (isInProjectMode && currentProject && currentProject.id) {
            const separator = componentPath.includes('?') ? '&' : '?';
            componentPath += `${separator}id_proyecto=${currentProject.id}`;
        } else {
            // Fallback: check sessionStorage directly
            const sessionProjectId = sessionStorage.getItem('selectedProjectId');
            const sessionMode = sessionStorage.getItem('isInProjectMode');
            if (sessionMode === 'true' && sessionProjectId) {
                const separator = componentPath.includes('?') ? '&' : '?';
                componentPath += `${separator}id_proyecto=${sessionProjectId}`;
            }
        }
        console.log('[Layout] Loading component:', componentName, 'â†’', componentPath);

        // Show loading state
        showLoading();

        // Load component via AJAX
        fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Insert component HTML
                contentArea.innerHTML = `<div class="component-container">${html}</div>`;

                // Execute any scripts in the loaded component
                executeScripts(contentArea);

                // Update active navigation states
                updateActiveNavigation(componentName);

                // Initialize component-specific functionality with small delay
                setTimeout(() => {
                    initializeComponent(componentName);
                }, 100);

                // Trigger custom event for component loaded
                const event = new CustomEvent('componentLoaded', {
                    detail: { component: componentName }
                });
                document.dispatchEvent(event);
            })
            .catch(error => {
                console.error('Error loading component:', error);
                showError(componentName);
            });
    }

    // Update active navigation states
    function updateActiveNavigation(componentName) {
        console.log('[Layout] Updating active navigation for:', componentName);

        // Update main navigation
        navItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-component') === componentName) {
                nav.classList.add('active');
            }
        });

        // Update project navigation
        projectNavItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.getAttribute('data-component') === componentName) {
                nav.classList.add('active');
            }
        });
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function (event) {
        if (event.state && event.state.component) {
            const component = event.state.component;

            // Update active navigation using the new function
            updateActiveNavigation(component);

            // Load component
            loadComponent(component);
        }
    });

    // Close mobile sidebar when clicking outside
    document.addEventListener('click', function (event) {
        if (window.innerWidth <= 1024) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = mobileToggle.contains(event.target);

            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (window.innerWidth > 1024) {
                sidebar.classList.remove('mobile-open');
            }
        }, 250);
    });

    // Logout button handler
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                window.location.href = '/sgigescon/src/Auth/Interfaces/Controllers/AuthController.php?action=logout';
            }
        });
    }

    // Back to Main Navigation Button
    const btnBackToMain = document.getElementById('btnBackToMain');
    if (btnBackToMain) {
        btnBackToMain.addEventListener('click', function () {
            switchToMainNav();
        });
    }

    // Project Navigation Items - Add event listeners
    projectNavItems.forEach(navItem => {
        navItem.addEventListener('click', function (e) {
            e.preventDefault();
            const component = this.getAttribute('data-component');
            console.log('[Layout] Project nav item clicked:', component);

            if (component) {
                // Remove active class from all project nav items
                projectNavItems.forEach(nav => nav.classList.remove('active'));
                // Add active class to clicked item
                this.classList.add('active');

                // Load the component
                loadComponent(component);
            }
        });
    });

    // Main Navigation Items - Add event listeners
    navItems.forEach(navItem => {
        navItem.addEventListener('click', function (e) {
            e.preventDefault();
            const component = this.getAttribute('data-component');
            console.log('[Layout] Main nav item clicked:', component);

            if (component) {
                // Remove active class from all main nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                // Add active class to clicked item
                this.classList.add('active');

                // Load the component
                loadComponent(component);
            }
        });
    });

    // Initialize layout
    function initializeLayout() {
        console.log('[Layout] Initializing layout...');
        console.log('[Layout] DOM ready, checking elements...');

        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            // Update project name if in project mode
            updateProjectNameInHeader();

            // Check if we should start in project mode
            const savedMode = sessionStorage.getItem('isInProjectMode');
            const savedProject = sessionStorage.getItem('currentProject');

            console.log('[Layout] Session check:', { savedMode, savedProject });

            if (savedMode === 'true' && savedProject) {
                const project = JSON.parse(savedProject);
                console.log('[Layout] Restoring project mode:', project);
                switchToProjectNav(project.id, project.name);
            }

            // THEN: Load component from URL params (if specified and not already loaded by switchToProjectNav)
            const urlParams = new URLSearchParams(window.location.search);
            const component = urlParams.get('component');

            if (component && !isInProjectMode) {
                loadComponent(component);
            } else if (!isInProjectMode) {
                loadComponent('proyectos');
            }
        }, 100); // Small delay to ensure DOM is ready
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLayout);
    } else {
        initializeLayout();
    }

    // Expose loadComponent function globally for external use
    window.SGILayout = {
        loadComponent: loadComponent,
        showDashboard: showDashboard,
        switchToProjectNav: switchToProjectNav,
        switchToMainNav: switchToMainNav,
        getCurrentProject: () => currentProject,
        isInProjectMode: () => isInProjectMode
    };

})();

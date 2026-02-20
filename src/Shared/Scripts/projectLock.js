// Project Lock Integration for Pedidos and Import Masiva
// This script locks project select when in project inspection mode

(function () {
    'use strict';

    // Singleton pattern to prevent multiple executions
    if (window.projectLockInitialized) {
        console.log('[ProjectLock] Already initialized, skipping');
        return;
    }

    window.projectLockInitialized = true;
    console.log('[ProjectLock] Initializing...');

    // Function to wait for select to have options
    function waitForSelectOptions($select, callback, maxAttempts = 30) {
        let attempts = 0;

        const checkInterval = setInterval(function () {
            attempts++;
            const optionCount = $select.find('option').length;

            console.log(`[ProjectLock] Attempt ${attempts}: Select has ${optionCount} options`);

            // Check if select has options (more than just default "Seleccione..." option)
            if (optionCount > 1) {
                clearInterval(checkInterval);
                console.log('[ProjectLock] Options detected, proceeding...');
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('[ProjectLock] Max attempts reached waiting for select options');
                console.warn('[ProjectLock] This usually means cargarProyectos() was not called');
                // Try anyway
                callback();
            }
        }, 300); // Check every 300ms
    }

    // Function to trigger project loading if needed
    function ensureProjectsLoaded() {
        // Check if cargarProyectos function exists and call it
        if (typeof window.cargarProyectos === 'function') {
            console.log('[ProjectLock] Calling cargarProyectos()');
            window.cargarProyectos();
        } else {
            console.warn('[ProjectLock] cargarProyectos() function not found');
        }
    }

    // Function to lock project select and set value
    function lockProjectSelect() {
        const projectId = sessionStorage.getItem('selectedProjectId');
        const projectName = sessionStorage.getItem('selectedProjectName');
        const isProjectMode = sessionStorage.getItem('isInProjectMode') === 'true';

        console.log('[ProjectLock] lockProjectSelect called:', { projectId, projectName, isProjectMode });

        if (isProjectMode && projectId) {
            console.log(`[ProjectLock] Locking project select to: ${projectName} (ID: ${projectId})`);

            // Find project select element
            const $projectSelect = $('#selectProyecto, #id_proyecto');

            if ($projectSelect.length > 0) {
                console.log('[ProjectLock] Project select found:', $projectSelect.attr('id'));

                // For import masiva, set immediately without waiting
                const isImportMasiva = window.location.pathname.includes('importMasiva');
                
                if (isImportMasiva) {
                    console.log('[ProjectLock] Import Masiva detected, setting project immediately...');
                    
                    // Add the project option if it doesn't exist
                    if ($projectSelect.find(`option[value="${projectId}"]`).length === 0) {
                        $projectSelect.append(`<option value="${projectId}">${projectName}</option>`);
                    }
                    
                    // Set value and lock
                    $projectSelect.val(projectId);
                    $projectSelect.prop('disabled', true);
                    $projectSelect.addClass('project-locked');
                    
                    // Remove any existing alerts (prevent duplicates)
                    $('#projectLockAlert').remove();
                    
                    console.log('[ProjectLock] Import Masiva project locked immediately');
                    
                    // Trigger change event to load related data
                    $projectSelect.trigger('change');
                    
                    // Store in window for other scripts to use
                    window.lockedProjectId = projectId;
                    window.lockedProjectName = projectName;
                    
                } else {
                    // For other components, wait for projects to load
                    ensureProjectsLoaded();

                    // Wait for options to load, then set value
                    waitForSelectOptions($projectSelect, function () {
                        console.log('[ProjectLock] Options loaded, setting value to:', projectId);

                        // Check if option exists
                        const optionExists = $projectSelect.find(`option[value="${projectId}"]`).length > 0;
                        console.log(`[ProjectLock] Option with value ${projectId} exists:`, optionExists);

                        if (optionExists) {
                            // Set value
                            $projectSelect.val(projectId);
                            console.log('[ProjectLock] Value set to:', $projectSelect.val());

                            // Disable select
                            $projectSelect.prop('disabled', true);
                            $projectSelect.addClass('project-locked');

                            // Remove any existing alerts (prevent duplicates)
                            $('#projectLockAlert').remove();

                            // Only add alert for pedido component, not for importMasiva
                            const currentComponent = window.location.pathname.includes('importMasiva') ? 'importMasiva' : 
                                              (window.location.pathname.includes('pedido') ? 'pedido' : 'other');
                            
                            if (currentComponent === 'pedido') {
                                // Find closest container
                                const $container = $projectSelect.closest('.mb-3, .form-group, .col-md-6, div');

                                // Add visual indicator
                                $container.prepend(`
                                    <div class="alert alert-info alert-sm mb-2" id="projectLockAlert">
                                        <i class="bi bi-lock-fill"></i> 
                                        <strong>Proyecto bloqueado:</strong> ${projectName}
                                        <small class="d-block">Estás en modo de inspección de proyecto</small>
                                    </div>
                                `);
                                console.log('[ProjectLock] Alert added for pedido component');
                            } else {
                                console.log('[ProjectLock] No alert added for component:', currentComponent);
                            }

                            // Trigger change event to load related data
                            $projectSelect.trigger('change');

                            // Store in window for other scripts to use
                            window.lockedProjectId = projectId;
                            window.lockedProjectName = projectName;

                            console.log('[ProjectLock] Project locked successfully');
                        } else {
                            console.error(`[ProjectLock] Option with value ${projectId} not found in select`);
                            console.log('[ProjectLock] Available options:', $projectSelect.find('option').map(function () {
                                return $(this).val() + ': ' + $(this).text();
                            }).get());
                            console.log('[ProjectLock] Possible causes:');
                            console.log('  1. cargarProyectos() was not called');
                            console.log('  2. Project ID does not exist in database');
                            console.log('  3. Project is not active');
                        }
                    });
                }
            } else {
                console.warn('[ProjectLock] Project select not found');
            }
        } else {
            console.log('[ProjectLock] Not in project mode or no project ID');
        }
    }

    // Function to unlock project select
    function unlockProjectSelect() {
        const $projectSelect = $('#selectProyecto, #id_proyecto');

        if ($projectSelect.length > 0) {
            $projectSelect.prop('disabled', false);
            $projectSelect.removeClass('project-locked');
            $('#projectLockAlert').remove();

            delete window.lockedProjectId;
            delete window.lockedProjectName;

            console.log('[ProjectLock] Project unlocked');
        }
    }

    // Listen for project mode changes
    document.addEventListener('projectModeChanged', function (event) {
        console.log('[ProjectLock] projectModeChanged event received:', event.detail);
        if (event.detail.mode === 'project') {
            // Wait a bit for component to load
            setTimeout(lockProjectSelect, 500); // Reduced delay for immediate response
        } else {
            unlockProjectSelect();
        }
    });

    // Listen for component loaded event
    document.addEventListener('componentLoaded', function (event) {
        console.log('[ProjectLock] componentLoaded event received:', event.detail);
        const isProjectMode = sessionStorage.getItem('isInProjectMode') === 'true';
        if (isProjectMode && (event.detail.component === 'pedido' || event.detail.component === 'importMasiva')) {
            console.log('[ProjectLock] Relevant component loaded, attempting lock');
            setTimeout(lockProjectSelect, 200); // Immediate for import masiva
        }
    });

    // Function to initialize on DOM ready
    function initialize() {
        console.log('[ProjectLock] DOM ready, checking project mode');
        const isProjectMode = sessionStorage.getItem('isInProjectMode') === 'true';
        if (isProjectMode) {
            setTimeout(lockProjectSelect, 100);
        }
    }

    // Check if jQuery is available
    if (typeof jQuery !== 'undefined') {
        console.log('[ProjectLock] jQuery available');
        $(document).ready(initialize);
    } else {
        console.warn('[ProjectLock] jQuery not available, waiting...');
        // Wait for jQuery to load
        let jQueryCheckInterval = setInterval(function () {
            if (typeof jQuery !== 'undefined') {
                clearInterval(jQueryCheckInterval);
                console.log('[ProjectLock] jQuery now available');
                $(document).ready(initialize);
            }
        }, 100);
    }

    console.log('[ProjectLock] Script loaded');
})();

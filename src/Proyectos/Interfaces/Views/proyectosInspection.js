// Proyecto Inspection Integration
// This script adds inspection button functionality to projects table

function initializeInspectionButtons() {
    console.log('[Inspection] Initializing inspection buttons...');
    console.log('[Inspection] jQuery available:', typeof $ !== 'undefined');
    console.log('[Inspection] DataTable available:', typeof $.fn.DataTable !== 'undefined');
    console.log('[Inspection] Projects table found:', $('#datos_proyectos').length > 0);
    
    // Remove existing listeners to avoid duplicates
    $('#datos_proyectos').off('click', '.btn-inspeccionar');
    
    // Add click handler for inspect button (will be added via DataTable render)
    $('#datos_proyectos').on('click', '.btn-inspeccionar', function () {
        const id = $(this).data('id');
        const nombre = $(this).data('nombre');

        console.log(`[Inspection] Clicked inspect button for project: ${nombre} (ID: ${id})`);

        if (id && nombre) {
            // Check if SGILayout is available
            if (window.SGILayout && typeof window.SGILayout.switchToProjectNav === 'function') {
                // Switch to project navigation mode
                window.SGILayout.switchToProjectNav(id, nombre);

                // Store project ID in session for components to use
                sessionStorage.setItem('selectedProjectId', id);
                sessionStorage.setItem('selectedProjectName', nombre);

                console.log(`[Inspection] Inspecting project: ${nombre} (ID: ${id})`);
            } else {
                console.error('[Inspection] SGILayout not available');
                alert('Error: La funcionalidad de inspección no está disponible');
            }
        }
    });
    
    console.log('[Inspection] Inspection buttons initialized');
}

// Initialize when DOM is ready (for direct page loads)
$(document).ready(function () {
    console.log('[Inspection] Document ready, initializing...');
    initializeInspectionButtons();
});

// Also initialize when component is loaded via AJAX
window.addEventListener('componentLoaded', function(event) {
    if (event.detail.component === 'proyectos') {
        console.log('[Inspection] Proyectos component loaded, re-initializing inspection buttons...');
        // Small delay to ensure DataTable is fully rendered
        setTimeout(initializeInspectionButtons, 100);
    }
});

// Also initialize when DataTable is reloaded
$(document).on('init.dt', function(e, settings) {
    if (settings.nTable.id === 'datos_proyectos') {
        console.log('[Inspection] DataTable initialized, setting up inspection buttons...');
        setTimeout(initializeInspectionButtons, 100);
    }
});

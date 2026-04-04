/**
 * cotizacionesHelper.js
 * Helper functions para integrar cotizaciones con órdenes de compra
 */

const API_COTIZACIONES = '/sgigescon/src/Cotizacion/Interfaces/CotizacionesController.php';

/**
 * Obtiene las cotizaciones disponibles para un componente específico
 * @param {number} idComponente - ID del componente
 * @returns {Promise<Array>} - Lista de cotizaciones ordenadas por precio
 */
async function getCotizacionesParaComponente(idComponente) {
    try {
        const response = await fetch(`${API_COTIZACIONES}?action=getCotizacionesParaOrden&id_componente=${idComponente}`);
        const result = await response.json();
        
        if (result.success) {
            return result.data || [];
        } else {
            console.error('Error obteniendo cotizaciones:', result.error);
            return [];
        }
    } catch (error) {
        console.error('Error en la petición de cotizaciones:', error);
        return [];
    }
}

/**
 * Muestra las cotizaciones disponibles en una interfaz para selección
 * @param {number} idComponente - ID del componente
 * @param {string} nombreComponente - Nombre del componente para mostrar
 * @param {Function} onSeleccionar - Callback cuando se selecciona una cotización
 */
async function mostrarSelectorCotizaciones(idComponente, nombreComponente, onSeleccionar) {
    const cotizaciones = await getCotizacionesParaComponente(idComponente);
    
    if (cotizaciones.length === 0) {
        mostrarMensaje('No hay cotizaciones disponibles para este componente', 'warning');
        return;
    }
    
    // Crear modal dinámicamente
    const modalId = 'modalSelectorCotizaciones_' + Date.now();
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-clipboard2-data"></i> 
                            Cotizaciones para: ${nombreComponente}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-primary">
                                    <tr>
                                        <th>Proveedor</th>
                                        <th class="text-end">Precio Unitario</th>
                                        <th class="text-center">Moneda</th>
                                        <th class="text-center">Tiempo Entrega</th>
                                        <th class="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${cotizaciones.map(cot => `
                                        <tr>
                                            <td>
                                                <strong>${cot.nombre_proveedor}</strong>
                                                ${cot.observaciones ? `<br><small class="text-muted">${cot.observaciones}</small>` : ''}
                                            </td>
                                            <td class="text-end">
                                                <strong class="text-success">$${formatCurrency(cot.precio_unitario)}</strong>
                                            </td>
                                            <td class="text-center">
                                                <span class="badge bg-info">${cot.moneda}</span>
                                            </td>
                                            <td class="text-center">
                                                ${cot.tiempo_entrega || '<span class="text-muted">-</span>'}
                                            </td>
                                            <td class="text-center">
                                                <button class="btn btn-sm btn-success" 
                                                        onclick="seleccionarCotizacion(${cot.id_cotizacion}, '${cot.nombre_proveedor}', ${cot.precio_unitario}, '${cot.moneda}')">
                                                    <i class="bi bi-check-circle"></i> Seleccionar
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="alert alert-info mt-3">
                            <small>
                                <i class="bi bi-info-circle"></i>
                                Las cotizaciones están ordenadas por precio de menor a mayor.
                                Selecciona la mejor opción para tu orden de compra.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurar función de selección
    window.seleccionarCotizacion = function(idCotizacion, proveedor, precio, moneda) {
        if (typeof onSeleccionar === 'function') {
            onSeleccionar({
                id_cotizacion: idCotizacion,
                proveedor: proveedor,
                precio_unitario: precio,
                moneda: moneda
            });
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) modal.hide();
        
        // Eliminar modal del DOM
        setTimeout(() => {
            document.getElementById(modalId)?.remove();
        }, 500);
    };
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
    
    // Limpiar al cerrar
    document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
        document.getElementById(modalId)?.remove();
        delete window.seleccionarCotizacion;
    });
}

/**
 * Verifica si un componente tiene cotizaciones disponibles
 * @param {number} idComponente - ID del componente
 * @returns {Promise<boolean>} - True si tiene cotizaciones
 */
async function tieneCotizaciones(idComponente) {
    const cotizaciones = await getCotizacionesParaComponente(idComponente);
    return cotizaciones.length > 0;
}

/**
 * Obtiene la mejor cotización (precio más bajo) para un componente
 * @param {number} idComponente - ID del componente
 * @returns {Promise<Object|null>} - Mejor cotización o null
 */
async function getMejorCotizacion(idComponente) {
    const cotizaciones = await getCotizacionesParaComponente(idComponente);
    return cotizaciones.length > 0 ? cotizaciones[0] : null;
}

// Función utilitaria para formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Función utilitaria para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    // Implementar toast o alert según preferencia
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    
    // Crear toast simple
    const toastHTML = `
        <div class="toast align-items-center text-white bg-${tipo === 'warning' ? 'warning text-dark' : tipo === 'danger' ? 'danger' : 'info'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${mensaje}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHTML;
    toastContainer.appendChild(toastElement.firstElementChild);
    
    const toast = new bootstrap.Toast(toastContainer.lastElementChild);
    toast.show();
    
    // Limpiar después de ocultar
    toastContainer.lastElementChild.addEventListener('hidden.bs.toast', () => {
        toastContainer.lastElementChild.remove();
    });
}

// Exportar funciones para uso global
window.CotizacionesHelper = {
    getCotizacionesParaComponente,
    mostrarSelectorCotizaciones,
    tieneCotizaciones,
    getMejorCotizacion,
    formatCurrency,
    mostrarMensaje
};

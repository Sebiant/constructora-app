// pedidoAdminView.js - JavaScript para la interfaz de administración de pedidos
// Este archivo contiene la estructura básica para conectar con el backend

// Configuración
const API_PEDIDOS = '/sgigescomnew/src/pedidosAdmin/Interfaces/PedidosController.php';

// Variables globales
let pedidoActual = null;
let filtrosActuales = {
    proyecto: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
};

// ============================================
// FUNCIONES DE CARGA INICIAL
// ============================================

/**
 * Inicializa la interfaz al cargar la página
 */
document.addEventListener('DOMContentLoaded', function () {
    cargarProyectos();
    cargarEstadisticas();
    cargarPedidos();

    // Agregar event listeners para que los filtros funcionen automáticamente
    document.getElementById('filterProyecto').addEventListener('change', aplicarFiltros);
    document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);
    document.getElementById('filterFechaDesde').addEventListener('change', aplicarFiltros);
    document.getElementById('filterFechaHasta').addEventListener('change', aplicarFiltros);

    // Búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            aplicarFiltros();
        }
    });

    // Búsqueda con botón y tipeo
    const searchInput = document.getElementById('searchInput');
    const searchButton = searchInput?.closest('.input-group')?.querySelector('button');
    if (searchButton) {
        searchButton.addEventListener('click', aplicarFiltros);
    }

    let searchTimeout = null;
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            searchTimeout = setTimeout(() => {
                aplicarFiltros();
            }, 350);
        });
    }
});

/**
 * Carga la lista de proyectos para el filtro
 */
function cargarProyectos() {
    fetch(API_PEDIDOS + '?action=getProyectos')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('filterProyecto');
            const proyectos = data?.proyectos || data?.data || [];
            if (data.success && Array.isArray(proyectos)) {
                proyectos.forEach(proyecto => {
                    const option = document.createElement('option');
                    option.value = proyecto.id_proyecto;
                    option.textContent = proyecto.nombre || proyecto.nombre_proyecto || '';
                    select.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error cargando proyectos:', error));
}

/**
 * Carga las estadísticas del dashboard
 */
function cargarEstadisticas() {
    fetch(API_PEDIDOS + '?action=getEstadisticasPedidos')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('statTotalPedidos').textContent = data.data.total || 0;
                document.getElementById('statPendientes').textContent = data.data.pendientes || 0;
                document.getElementById('statAprobados').textContent = data.data.aprobados || 0;
                document.getElementById('statRechazados').textContent = data.data.rechazados || 0;
            }
        })
        .catch(error => console.error('Error cargando estadísticas:', error));
}

/**
 * Carga la lista de pedidos con los filtros aplicados
 */
function cargarPedidos(pagina = 1) {
    const params = new URLSearchParams({
        action: 'getAllPedidosAdmin',
        pagina: pagina,
        proyecto: filtrosActuales.proyecto,
        estado: filtrosActuales.estado,
        fechaDesde: filtrosActuales.fechaDesde,
        fechaHasta: filtrosActuales.fechaHasta,
        busqueda: filtrosActuales.busqueda
    });

    fetch(API_PEDIDOS + '?' + params)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderizarTablaPedidos(data.pedidos);
                renderizarPaginacion(data.totalPaginas, pagina);
                document.getElementById('contadorPedidos').textContent = data.total + ' pedidos';
            } else {
                console.error('Error:', data.error);
                renderizarTablaPedidos([]);
            }
        })
        .catch(error => {
            console.error('Error cargando pedidos:', error);
            renderizarTablaPedidos([]);
        });
}

// ============================================
// FUNCIONES DE FILTRADO
// ============================================

/**
 * Aplica los filtros seleccionados
 */
function aplicarFiltros() {
    filtrosActuales = {
        proyecto: document.getElementById('filterProyecto').value,
        estado: document.getElementById('filterEstado').value,
        fechaDesde: document.getElementById('filterFechaDesde').value,
        fechaHasta: document.getElementById('filterFechaHasta').value,
        busqueda: document.getElementById('searchInput').value
    };

    cargarPedidos(1);
}

/**
 * Limpia todos los filtros
 */
function limpiarFiltros() {
    document.getElementById('filterProyecto').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterFechaDesde').value = '';
    document.getElementById('filterFechaHasta').value = '';
    document.getElementById('searchInput').value = '';

    filtrosActuales = {
        proyecto: '',
        estado: '',
        fechaDesde: '',
        fechaHasta: '',
        busqueda: ''
    };

    cargarPedidos(1);
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

/**
 * Renderiza la tabla de pedidos
 */
function renderizarTablaPedidos(pedidos) {
    const tbody = document.getElementById('tablaPedidos');

    if (!pedidos || pedidos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-inbox display-4"></i>
                    <p class="mt-3">No hay pedidos para mostrar</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pedidos.map(pedido => `
        <tr>
            <td>${pedido.id_pedido}</td>
            <td>${formatearFecha(pedido.fecha_pedido)}</td>
            <td>${pedido.nombre_proyecto}</td>
            <td>${pedido.nombre_usuario}</td>
            <td class="text-end">${formatearMoneda(pedido.total)}</td>
            <td class="text-center">${renderizarBadgeEstado(pedido.estado)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-info" onclick="verDetallePedido(${pedido.id_pedido})">
                    <i class="bi bi-eye"></i> Ver
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Renderiza el badge de estado
 */
function renderizarBadgeEstado(estado) {
    const key = String(estado ?? '').trim().toLowerCase();
    const badges = {
        'pendiente': '<span class="badge bg-warning">Pendiente</span>',
        'aprobado': '<span class="badge bg-success">Aprobado</span>',
        'comprado': '<span class="badge bg-primary">Comprado</span>',
        'rechazado': '<span class="badge bg-danger">Rechazado</span>'
    };
    return badges[key] || `<span class="badge bg-secondary">${key ? key : 'desconocido'}</span>`;
}

/**
 * Renderiza la paginación
 */
function renderizarPaginacion(totalPaginas, paginaActual) {
    const paginacion = document.getElementById('paginacion');
    let html = '';

    // Botón anterior
    html += `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cargarPedidos(${paginaActual - 1}); return false;">Anterior</a>
        </li>
    `;

    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="cargarPedidos(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Botón siguiente
    html += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cargarPedidos(${paginaActual + 1}); return false;">Siguiente</a>
        </li>
    `;

    paginacion.innerHTML = html;
}

// ============================================
// FUNCIONES DE DETALLE DEL PEDIDO
// ============================================

/**
 * Muestra el detalle de un pedido
 */
function verDetallePedido(idPedido) {
    fetch(API_PEDIDOS + '?action=getPedidoDetalleAdmin&id_pedido=' + idPedido)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                pedidoActual = data.data;
                renderizarDetallePedido(data.data);
                const modal = new bootstrap.Modal(document.getElementById('modalDetallePedido'));
                modal.show();
            } else {
                alert('Error al cargar el pedido: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar el pedido');
        });
}

/**
 * Renderiza el detalle del pedido en el modal
 */
function renderizarDetallePedido(pedido) {
    document.getElementById('detallePedidoId').textContent = pedido.id_pedido;
    document.getElementById('detalleProyecto').textContent = pedido.nombre_proyecto;
    document.getElementById('detalleUsuario').textContent = pedido.nombre_usuario;
    document.getElementById('detalleFecha').textContent = formatearFecha(pedido.fecha_pedido);
    document.getElementById('detalleTotal').textContent = formatearMoneda(pedido.total);
    document.getElementById('detalleObservaciones').textContent = pedido.observaciones || 'Sin observaciones';

    // Renderizar componentes
    const tbodyComponentes = document.getElementById('detalleComponentes');
    tbodyComponentes.innerHTML = pedido.componentes.map(comp => {
        const esExcedente = parseInt(comp.es_excedente, 10) === 1;
        const cantidadPedida = parseFloat(comp.cantidad) || 0;
        const cantidadEnOrden = parseFloat(comp.cantidad_en_orden) || 0;
        const cantidadComprada = parseFloat(comp.cantidad_comprada) || 0;
        const numerosOrden = comp.numeros_orden || '';
        
        // Determinar estado de compra
        let estadoCompra = '';
        let estadoBadge = '';
        
        if (cantidadComprada >= cantidadPedida) {
            estadoCompra = 'Completado';
            estadoBadge = '<span class="badge bg-success">Completado</span>';
        } else if (cantidadComprada > 0) {
            estadoCompra = 'Parcialmente Comprado';
            estadoBadge = '<span class="badge bg-warning">Parcialmente Comprado</span>';
        } else if (cantidadEnOrden > 0) {
            estadoCompra = 'En Orden de Compra';
            estadoBadge = '<span class="badge bg-info">En Orden de Compra</span>';
        } else {
            estadoCompra = 'Pendiente de Compra';
            estadoBadge = '<span class="badge bg-secondary">Pendiente de Compra</span>';
        }
        
        return `
        <tr>
            <td>${comp.descripcion}</td>
            <td>${comp.tipo_componente}</td>
            <td class="text-center">${cantidadPedida}</td>
            <td class="text-end">${formatearMoneda(comp.precio_unitario)}</td>
            <td class="text-end">${formatearMoneda(comp.subtotal)}</td>
            <td class="text-center">${estadoBadge}</td>
            <td class="text-center">
                ${cantidadComprada > 0 ? cantidadComprada.toFixed(4) : '-'}
                ${cantidadComprada > 0 && cantidadComprada < cantidadPedida ? 
                    `<br><small class="text-muted">(${((cantidadComprada/cantidadPedida)*100).toFixed(1)}%)</small>` : ''}
            </td>
            <td class="text-center">
                ${numerosOrden ? 
                    `<small class="text-info">${numerosOrden}</small>` : 
                    '<span class="text-muted">-</span>'}
            </td>
            <td class="text-center">
                ${esExcedente ? '<span class="badge bg-warning">Sí</span>' : '<span class="badge bg-success">No</span>'}
            </td>
        </tr>`;
    }).join('');

    // Mostrar/ocultar sección de excedentes
    const excedentes = pedido.componentes.filter(c => parseInt(c.es_excedente, 10) === 1);
    if (excedentes.length > 0) {
        document.getElementById('seccionExcedentes').style.display = 'block';
        const tbodyExcedentes = document.getElementById('detalleExcedentes');
        tbodyExcedentes.innerHTML = excedentes.map(exc => `
            <tr>
                <td>${exc.descripcion}</td>
                <td class="text-center">${exc.cantidad}</td>
                <td class="text-end">${formatearMoneda(exc.subtotal)}</td>
                <td>${exc.justificacion || 'Sin justificación'}</td>
            </tr>
        `).join('');
    } else {
        document.getElementById('seccionExcedentes').style.display = 'none';
    }

    // Mostrar/ocultar botones según estado
    if (pedido.estado === 'pendiente') {
        document.getElementById('btnAprobar').style.display = 'inline-block';
        document.getElementById('btnRechazar').style.display = 'inline-block';
    } else {
        document.getElementById('btnAprobar').style.display = 'none';
        document.getElementById('btnRechazar').style.display = 'none';
    }
}

// ============================================
// FUNCIONES DE APROBACIÓN/RECHAZO
// ============================================

/**
 * Muestra el modal de aprobación
 */
function aprobarPedido() {
    if (!pedidoActual) return;

    document.getElementById('aprobarPedidoId').textContent = pedidoActual.id_pedido;
    const modal = new bootstrap.Modal(document.getElementById('modalAprobar'));
    modal.show();
}

/**
 * Confirma la aprobación del pedido
 */
function confirmarAprobacion() {
    const comentarios = document.getElementById('comentariosAprobacion').value;

    fetch(API_PEDIDOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'aprobarPedido',
            id_pedido: pedidoActual.id_pedido,
            comentarios: comentarios
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Pedido aprobado correctamente');
                bootstrap.Modal.getInstance(document.getElementById('modalAprobar')).hide();
                bootstrap.Modal.getInstance(document.getElementById('modalDetallePedido')).hide();
                document.getElementById('comentariosAprobacion').value = '';
                cargarPedidos();
                cargarEstadisticas();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al aprobar el pedido');
        });
}

/**
 * Muestra el modal de rechazo
 */
function mostrarModalRechazo() {
    if (!pedidoActual) return;

    document.getElementById('rechazarPedidoId').textContent = pedidoActual.id_pedido;
    const modal = new bootstrap.Modal(document.getElementById('modalRechazo'));
    modal.show();
}

/**
 * Confirma el rechazo del pedido
 */
function confirmarRechazo() {
    const motivo = document.getElementById('motivoRechazo').value;

    if (!motivo.trim()) {
        alert('Debe especificar un motivo de rechazo');
        return;
    }

    fetch(API_PEDIDOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'rechazarPedido',
            id_pedido: pedidoActual.id_pedido,
            motivo: motivo
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Pedido rechazado correctamente');
                bootstrap.Modal.getInstance(document.getElementById('modalRechazo')).hide();
                bootstrap.Modal.getInstance(document.getElementById('modalDetallePedido')).hide();
                document.getElementById('motivoRechazo').value = '';
                cargarPedidos();
                cargarEstadisticas();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al rechazar el pedido');
        });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Formatea una fecha
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formatea un valor monetario
 */
function formatearMoneda(valor) {
    if (!valor) return '$0';
    return '$' + parseFloat(valor).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

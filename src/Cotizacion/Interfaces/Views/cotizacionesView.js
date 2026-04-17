/**
 * cotizacionesView.js
 * Lógica para el componente de cotizaciones con selects internos
 * Flujo: Seleccionar proyecto → Seleccionar presupuesto → Ver componentes → Agregar cotizaciones
 */

// Definición de APIs con verificación para evitar errores de ya definido al navegar
if (typeof API_COTIZACIONES === 'undefined') {
    var API_COTIZACIONES = '/sgigescon/src/Cotizacion/Interfaces/CotizacionesController.php';
}
if (typeof API_PRESUPUESTOS === 'undefined') {
    var API_PRESUPUESTOS = '/sgigescon/src/Presupuesto/Interfaces/PresupuestoController.php';
}
if (typeof API_PROYECTOS === 'undefined') {
    var API_PROYECTOS = '/sgigescon/src/Proyectos/Interfaces/ProyectoController.php';
}
if (typeof API_PROVEEDORES === 'undefined') {
    var API_PROVEEDORES = '/sgigescon/src/Provedores/Interfaces/ProvedorController.php';
}

let proyectoActual = null;
let presupuestoActual = null;
let componenteActual = null;
let componentesPresupuesto = [];
let componentesOriginales = []; // Guardar copia original para filtrar
let proveedoresDB = [];
let cotizacionesExistentes = [];
let pedidosPresupuesto = []; // Pedidos asociados al presupuesto actual

// Habilitar modo debug para ver todos los logs en consola
const DEBUG_MODE = true;

function debugLog(mensaje, data = null) {
    if (DEBUG_MODE) {
        if (data) {
            console.log(`[COTIZACIONES DEBUG] ${mensaje}`, data);
        } else {
            console.log(`[COTIZACIONES DEBUG] ${mensaje}`);
        }
    }
}

// Log inmediato para saber si el script se está cargando
console.log('[COTIZACIONES] === SCRIPT LOADED ===');
debugLog('Script cargado - Versión 1.0');

// Verificar si el DOM ya está listo
if (document.readyState === 'loading') {
    debugLog('DOM aún está cargando, esperando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', inicializarCotizaciones);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    debugLog('DOM ya está listo, inicializando inmediatamente');
    inicializarCotizaciones();
} else {
    debugLog('Estado del DOM desconocido:', document.readyState);
    document.addEventListener('DOMContentLoaded', inicializarCotizaciones);
}

function inicializarCotizaciones() {
    console.log('[COTIZACIONES] === inicializarCotizaciones() CALLED ===');
    debugLog('DOM cargado, iniciando carga de componentes');
    debugLog('Verificando elementos del DOM...');
    
    // Verificar que los elementos existan antes de continuar
    const selectProyecto = document.getElementById('selectProyecto');
    const selectPresupuesto = document.getElementById('selectPresupuesto');
    const selectProveedor = document.getElementById('selectProveedor');
    
    debugLog('Elementos encontrados:', {
        selectProyecto: !!selectProyecto,
        selectPresupuesto: !!selectPresupuesto,
        selectProveedor: !!selectProveedor
    });
    
    if (selectProyecto && selectPresupuesto && selectProveedor) {
        debugLog('Todos los elementos existen, iniciando carga');
        cargarProyectos();
        cargarProveedores();
    } else {
        debugLog('Faltan elementos en el DOM, esperando...');
        // Reintentar cargar después de un pequeño retraso
        setTimeout(() => {
            const selectProyecto = document.getElementById('selectProyecto');
            const selectPresupuesto = document.getElementById('selectPresupuesto');
            const selectProveedor = document.getElementById('selectProveedor');
            if (selectProyecto && selectPresupuesto && selectProveedor) {
                debugLog('Reintentando carga de componentes');
                cargarProyectos();
                cargarProveedores();
            } else {
                debugLog('Segundo intento falló, elementos no encontrados');
            }
        }, 1000);
    }
    
    // Event listeners
    const buscarComponente = document.getElementById('buscarComponente');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroCotizados = document.getElementById('filtroCotizados');
    const filtroPedido = document.getElementById('filtroPedido');
    const formNuevaCotizacion = document.getElementById('formNuevaCotizacion');

    if (buscarComponente) buscarComponente.addEventListener('input', filtrarComponentes);
    if (filtroTipo) filtroTipo.addEventListener('change', filtrarComponentes);
    if (filtroCotizados) filtroCotizados.addEventListener('change', filtrarComponentes);
    if (filtroPedido) filtroPedido.addEventListener('change', cambiarFiltroPedido);
    if (formNuevaCotizacion) formNuevaCotizacion.addEventListener('submit', guardarNuevaCotizacion);

    debugLog('Event listeners configurados');
}

/**
 * Carga el catálogo de proyectos
 */
async function cargarProyectos() {
    debugLog('Iniciando carga de proyectos...');
    try {
        const url = `${API_PROYECTOS}?action=getAll`;
        debugLog('URL de proyectos:', url);
        
        const response = await fetch(url);
        debugLog('Response status:', response.status);
        debugLog('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        debugLog('Resultado de proyectos:', result);
        
        // El controlador de proyectos devuelve directamente el array, no un objeto con success
        const proyectos = Array.isArray(result) ? result : (result.data || []);
        
        if (proyectos.length > 0) {
            const select = document.getElementById('selectProyecto');
            if (!select) {
                debugLog('ERROR: No se encontró el select de proyectos');
                return;
            }
            
            select.innerHTML = '<option value="">-- Seleccionar proyecto --</option>';
            
            debugLog('Proyectos encontrados:', proyectos.length);
            
            proyectos.forEach((proyecto, index) => {
                const option = document.createElement('option');
                option.value = proyecto.id_proyecto;
                option.textContent = proyecto.nombre;
                select.appendChild(option);
                debugLog(`Proyecto ${index + 1}:`, { id: proyecto.id_proyecto, nombre: proyecto.nombre });
            });
            
            debugLog('Select de proyectos actualizado con', proyectos.length, 'opciones');
        } else {
            debugLog('ERROR: No se encontraron proyectos');
            mostrarError('No se encontraron proyectos');
        }
    } catch (error) {
        debugLog('ERROR en carga de proyectos:', error);
        console.error('[Cotizaciones] Error:', error);
        mostrarError('Error al cargar los proyectos');
    }
}

/**
 * Carga el catálogo de proveedores
 */
async function cargarProveedores() {
    debugLog('Iniciando carga de proveedores...');
    try {
        const response = await fetch(`${API_PROVEEDORES}?action=getAll`);
        debugLog('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        debugLog('Resultado de proveedores:', result);
        
        // El controlador de proveedores devuelve directamente el array, no un objeto con success
        const proveedores = Array.isArray(result) ? result : (result.data || []);
        
        if (proveedores.length > 0) {
            proveedoresDB = proveedores;
            actualizarSelectProveedores();
            debugLog('Proveedores cargados:', proveedoresDB.length);
        } else {
            debugLog('ERROR: No se encontraron proveedores');
            mostrarError('No se encontraron proveedores');
        }
    } catch (error) {
        debugLog('ERROR en carga de proveedores:', error);
        console.error('[Cotizaciones] Error:', error);
        mostrarError('Error al cargar los proveedores');
    }
}

/**
 * Actualiza el select de proveedores en el modal
 */
function actualizarSelectProveedores() {
    const select = document.getElementById('selectProveedor');
    if (select) {
        select.innerHTML = '<option value="">Seleccionar proveedor...</option>';
        
        proveedoresDB.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.id_provedor;
            option.textContent = proveedor.nombre;
            select.appendChild(option);
        });
    }
}

/**
 * Carga los presupuestos del proyecto seleccionado
 */
async function cargarPresupuestosDeProyecto() {
    const selectProyecto = document.getElementById('selectProyecto');
    const proyectoId = selectProyecto.value;
    
    if (!proyectoId) {
        // Limpiar información
        limpiarInformacionProyecto();
        return;
    }
    
    try {
        // Obtener datos del proyecto del atributo data del select
        const selectedOption = selectProyecto.selectedOptions[0];
        if (selectedOption && selectedOption.getAttribute('data-proyecto')) {
            proyectoActual = JSON.parse(selectedOption.getAttribute('data-proyecto'));
        }
        
        debugLog('Proyecto seleccionado:', proyectoActual);
        
        // Cargar presupuestos
        const formData = new FormData();
        formData.append('proyecto_id', proyectoId);
        
        const response = await fetch(`${API_PRESUPUESTOS}?action=getPresupuestosByProyecto`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            const selectPresupuesto = document.getElementById('selectPresupuesto');
            selectPresupuesto.innerHTML = '<option value="">-- Seleccionar presupuesto --</option>';
            
            const presupuestos = result.data || result.presupuestos || [];
            presupuestos.forEach(presupuesto => {
                const option = document.createElement('option');
                option.value = presupuesto.id_presupuesto;
                option.textContent = `${presupuesto.nombre || presupuesto.codigo || ('Presupuesto ' + presupuesto.id_presupuesto)}`;
                option.setAttribute('data-presupuesto', JSON.stringify(presupuesto));
                selectPresupuesto.appendChild(option);
            });
            
            // Habilitar select de presupuestos
            selectPresupuesto.disabled = false;
            
            // Mostrar información del proyecto
            mostrarInformacionProyecto();
        }
    } catch (error) {
        console.error('Error cargando presupuestos:', error);
        mostrarError('Error al cargar los presupuestos');
    }
}

/**
 * Muestra la información del proyecto seleccionado
 */
function mostrarInformacionProyecto() {
    const infoDiv = document.getElementById('infoProyectoPresupuesto');
    if (proyectoActual) {
        document.getElementById('infoNombreProyecto').textContent = proyectoActual.nombre;
        infoDiv.style.display = 'block';
    } else {
        limpiarInformacionProyecto();
    }
}

/**
 * Limpia la información del proyecto y presupuesto
 */
function limpiarInformacionProyecto() {
    document.getElementById('infoProyectoPresupuesto').style.display = 'none';
    document.getElementById('infoNombreProyecto').textContent = '-';
    document.getElementById('infoNombrePresupuesto').textContent = '-';
    document.getElementById('infoTotalComponentes').textContent = '-';
}

/**
 * Carga los componentes del presupuesto seleccionado
 * @param {boolean} silent - Si es true, no muestra el spinner de carga
 */
async function cargarComponentesPresupuesto(silent = false) {
    const select = document.getElementById('selectPresupuesto');
    const presupuestoId = select.value;
    
    if (!presupuestoId) {
        // Limpiar información del presupuesto y componentes
        if (proyectoActual) {
            document.getElementById('infoNombrePresupuesto').textContent = '-';
            document.getElementById('infoTotalComponentes').textContent = '-';
        }
        limpiarComponentes();
        return;
    }
    
    // Obtener datos del presupuesto
    const selectedOption = select.selectedOptions[0];
    const presupuestoData = JSON.parse(selectedOption.getAttribute('data-presupuesto'));
    presupuestoActual = presupuestoData;
    
    // Mostrar información del presupuesto
    if (proyectoActual && proyectoActual.nombre) {
        document.getElementById('infoNombreProyecto').textContent = proyectoActual.nombre;
    }
    document.getElementById('infoNombrePresupuesto').textContent = presupuestoActual.nombre || presupuestoActual.codigo;
    document.getElementById('infoProyectoPresupuesto').style.display = 'block';
    
    // Cargar componentes
    try {
        if (!silent) {
            mostrarCargandoComponentes();
        }
        
        const response = await fetch(`${API_COTIZACIONES}?action=getComponentesPresupuesto&id_presupuesto=${presupuestoId}`);
        const result = await response.json();
        
        if (result.debug) {
            console.group('Depuración Cotizaciones');
            console.log('ID Presupuesto:', result.debug.id_presupuesto);
            console.log('Consulta SQL:', result.debug.sql);
            console.log('Filas obtenidas:', result.debug.total_filas_encontradas);
            console.log('Cant. registros det_presupuesto:', result.debug.conteo_det_presupuesto);
            console.log('Cant. items con APU:', result.debug.conteo_items_con_apu);
            console.log('Tablas:', result.debug.tablas_existentes);
            console.groupEnd();
        }
        
        if (result.success) {
            componentesPresupuesto = result.data || [];
            componentesOriginales = [...componentesPresupuesto]; // Guardar copia original
            document.getElementById('infoTotalComponentes').textContent = componentesPresupuesto.length;

            // Cargar pedidos del presupuesto
            await cargarPedidosPresupuesto(presupuestoId);

            // Aplicar filtros actuales sobre la nueva data en lugar de mostrar todo
            filtrarComponentes();
        } else {
            mostrarError(result.error || 'Error cargando componentes');
        }
    } catch (error) {
        console.error('Error cargando componentes:', error);
        mostrarError('Error al cargar los componentes');
    }
}

/**
 * Muestra estado de carga para componentes
 */
function mostrarCargandoComponentes() {
    document.getElementById('listaComponentes').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Cargando componentes...</p>
        </div>
    `;
}

/**
 * Carga los pedidos asociados al presupuesto para el filtro
 */
async function cargarPedidosPresupuesto(idPresupuesto) {
    try {
        debugLog('Cargando pedidos del presupuesto:', idPresupuesto);
        const response = await fetch(`${API_COTIZACIONES}?action=getPedidosPorPresupuesto&id_presupuesto=${idPresupuesto}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        debugLog('Respuesta de pedidos:', result);

        const listaChecks = document.getElementById('listaChecksPedidos');
        if (!listaChecks) return;

        if (result.success) {
            pedidosPresupuesto = result.data || [];
            debugLog('Pedidos cargados:', pedidosPresupuesto.length);

            // Limpiar y poblar los checkboxes de pedidos
            listaChecks.innerHTML = '';

            if (pedidosPresupuesto.length === 0) {
                listaChecks.innerHTML = '<div class="text-muted small p-2">Sin pedidos asociados</div>';
            } else {
                pedidosPresupuesto.forEach((pedido, index) => {
                    const fecha = pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString() : '';
                    const div = document.createElement('div');
                    div.className = 'form-check';
                    div.innerHTML = `
                        <input class="form-check-input" type="checkbox" id="checkPedido${pedido.id_pedido}" 
                               value="${pedido.id_pedido}" onchange="togglePedidoIndividual()">
                        <label class="form-check-label small" for="checkPedido${pedido.id_pedido}">
                            #${pedido.id_pedido} - ${fecha} (${pedido.estado}) - ${pedido.total_items || 0} items
                        </label>
                    `;
                    listaChecks.appendChild(div);
                });
            }

            // Resetear el checkbox "Todos"
            const checkTodos = document.getElementById('checkTodosPedidos');
            if (checkTodos) checkTodos.checked = true;

            // Limpiar el hidden input
            const filtroPedido = document.getElementById('filtroPedido');
            if (filtroPedido) filtroPedido.value = '';

            // Actualizar texto del botón
            actualizarTextoBotonPedidos();
        } else {
            console.error('Error en respuesta:', result.error);
            listaChecks.innerHTML = '<div class="text-muted small p-2 text-danger">Error cargando pedidos</div>';
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        const listaChecks = document.getElementById('listaChecksPedidos');
        if (listaChecks) {
            listaChecks.innerHTML = '<div class="text-muted small p-2 text-danger">Error de conexión</div>';
        }
    }
}

/**
 * Maneja el checkbox "Todos los pedidos"
 */
function toggleTodosPedidos() {
    const checkTodos = document.getElementById('checkTodosPedidos');
    const checkboxes = document.querySelectorAll('#listaChecksPedidos input[type="checkbox"]');

    if (checkTodos.checked) {
        // Desmarcar todos los individuales
        checkboxes.forEach(cb => cb.checked = false);
    }

    actualizarFiltroPedidos();
}

/**
 * Maneja el cambio en un checkbox individual de pedido
 */
function togglePedidoIndividual() {
    const checkboxes = document.querySelectorAll('#listaChecksPedidos input[type="checkbox"]:checked');
    const checkTodos = document.getElementById('checkTodosPedidos');

    // Si hay algún pedido seleccionado, desmarcar "Todos"
    if (checkboxes.length > 0) {
        if (checkTodos) checkTodos.checked = false;
    } else {
        // Si no hay ninguno, marcar "Todos"
        if (checkTodos) checkTodos.checked = true;
    }

    actualizarFiltroPedidos();
}

/**
 * Actualiza el filtro de pedidos según los checkboxes seleccionados
 */
function actualizarFiltroPedidos() {
    const checkTodos = document.getElementById('checkTodosPedidos');
    const checkboxes = document.querySelectorAll('#listaChecksPedidos input[type="checkbox"]:checked');
    const filtroPedido = document.getElementById('filtroPedido');

    if (checkTodos.checked) {
        // Mostrar todos los componentes del presupuesto
        filtroPedido.value = '';
        componentesPresupuesto = [...componentesOriginales];
        actualizarTextoBotonPedidos('Todo el presupuesto');
        filtrarComponentes();
    } else if (checkboxes.length > 0) {
        // Obtener IDs de pedidos seleccionados
        const idsPedidos = Array.from(checkboxes).map(cb => cb.value).join(',');
        filtroPedido.value = idsPedidos;
        actualizarTextoBotonPedidos(`${checkboxes.length} pedido(s) seleccionado(s)`);
        cargarComponentesPorPedidos(idsPedidos);
    } else {
        // Ninguno seleccionado, comportamiento por defecto
        filtroPedido.value = '';
        actualizarTextoBotonPedidos('Selecciona pedido(s)');
    }
}

/**
 * Actualiza el texto del botón de pedidos
 */
function actualizarTextoBotonPedidos(texto) {
    const btn = document.getElementById('dropdownPedidos');
    if (btn) {
        if (texto) {
            btn.innerHTML = `<i class="bi bi-funnel-fill"></i> ${texto}`;
        } else {
            btn.innerHTML = `<i class="bi bi-funnel"></i> Filtrar por pedido`;
        }
    }
}

/**
 * Carga componentes de múltiples pedidos seleccionados
 */
async function cargarComponentesPorPedidos(idsPedidos) {
    if (!presupuestoActual || !presupuestoActual.id_presupuesto) return;

    try {
        mostrarCargandoComponentes();
        debugLog('Cargando componentes de pedidos:', idsPedidos);

        const response = await fetch(`${API_COTIZACIONES}?action=getComponentesPorPedidos&id_pedidos=${idsPedidos}&id_presupuesto=${presupuestoActual.id_presupuesto}`);
        const result = await response.json();

        if (result.success) {
            componentesPresupuesto = result.data || [];
            document.getElementById('infoTotalComponentes').textContent = componentesPresupuesto.length;
            debugLog(`Componentes cargados:`, componentesPresupuesto.length);
            filtrarComponentes();
        } else {
            mostrarError(result.error || 'Error cargando componentes de los pedidos');
        }
    } catch (error) {
        console.error('Error cargando componentes de los pedidos:', error);
        mostrarError('Error al cargar los componentes de los pedidos');
    }
}

/**
 * Función legacy - ya no se usa directamente, se usa actualizarFiltroPedidos
 */
async function cambiarFiltroPedido() {
    actualizarFiltroPedidos();
}

/**
 * Limpia la lista de componentes
 */
function limpiarComponentes() {
    document.getElementById('listaComponentes').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="bi bi-clipboard-data display-4"></i>
            <p class="mt-3">Selecciona un proyecto y presupuesto para ver los componentes</p>
        </div>
    `;

    // Limpiar dropdown de pedidos
    const listaChecks = document.getElementById('listaChecksPedidos');
    if (listaChecks) {
        listaChecks.innerHTML = '<div class="text-muted small p-2">Selecciona un presupuesto primero</div>';
    }

    // Resetear checkbox "Todos"
    const checkTodos = document.getElementById('checkTodosPedidos');
    if (checkTodos) checkTodos.checked = true;

    // Limpiar hidden input
    const filtroPedido = document.getElementById('filtroPedido');
    if (filtroPedido) filtroPedido.value = '';

    // Limpiar arrays
    pedidosPresupuesto = [];
    componentesOriginales = [];
}

/**
 * Muestra la lista de componentes con sus cotizaciones
 */
function mostrarComponentes() {
    const contenedor = document.getElementById('listaComponentes');
    
    if (!componentesPresupuesto || componentesPresupuesto.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox display-4"></i>
                <p class="mt-3">Este presupuesto no tiene componentes</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-primary">
                    <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Tipo</th>
                        <th>Unidad</th>
                        <th>Cantidad</th>
                        <th class="text-center">Cotizaciones</th>
                        <th class="text-end">Precio Mejor</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    componentesPresupuesto.forEach(componente => {
        const tipoLabel = getTipoLabel(componente.tipo_componente);
        const numCotizaciones = componente.cotizaciones_count || 0;
        const precioMejor = componente.precio_mejor ? `$${formatCurrency(componente.precio_mejor)}` : '-';
        
        html += `
            <tr>
                <td><strong>${componente.codigo_componente || '-'}</strong></td>
                <td>${componente.descripcion || componente.nombre_componente || '-'}</td>
                <td>
                    <span class="badge ${getTipoBadgeClass(componente.tipo_componente)}">
                        ${tipoLabel}
                    </span>
                </td>
                <td>${componente.unidad || 'UND'}</td>
                <td class="text-end">${parseFloat(componente.cantidad || 0).toFixed(2)}</td>
                <td class="text-center">
                    <span class="badge ${numCotizaciones > 0 ? 'bg-success' : 'bg-secondary'}">
                        ${numCotizaciones}
                    </span>
                </td>
                <td class="text-end">
                    <strong class="${numCotizaciones > 0 ? 'text-success' : ''}">
                        ${precioMejor}
                    </strong>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="abrirModalCotizaciones(${componente.id_componente})">
                        <i class="bi bi-clipboard2-data"></i> Cotizar
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    contenedor.innerHTML = html;
}

/**
 * Filtra los componentes según los criterios
 */
function filtrarComponentes() {
    const termino = document.getElementById('buscarComponente').value.toLowerCase();
    const tipo = document.getElementById('filtroTipo').value;
    const cotizados = document.getElementById('filtroCotizados').value;
    
    let componentesFiltrados = componentesPresupuesto.filter(componente => {
        // Filtro por texto
        const coincideTexto = !termino || 
            (componente.descripcion?.toLowerCase().includes(termino) ||
             componente.codigo_componente?.toLowerCase().includes(termino));
        
        // Filtro por tipo
        const coincideTipo = !tipo || componente.tipo_componente === tipo;
        
        // Filtro por cotizaciones
        let coincideCotizados = true;
        const nCotizaciones = parseInt(componente.cotizaciones_count || 0);
        
        if (cotizados === 'con_cotizacion') {
            coincideCotizados = nCotizaciones > 0;
        } else if (cotizados === 'sin_cotizacion') {
            coincideCotizados = nCotizaciones === 0;
        }
        
        return coincideTexto && coincideTipo && coincideCotizados;
    });
    
    // Actualizar la vista con los componentes filtrados
    const contenedor = document.getElementById('listaComponentes');
    if (componentesFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-search display-4"></i>
                <p class="mt-3">No se encontraron componentes con los filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    // Reutilizar la lógica de mostrarComponentes pero con los filtrados
    const original = componentesPresupuesto;
    componentesPresupuesto = componentesFiltrados;
    mostrarComponentes();
    componentesPresupuesto = original;
}

/**
 * Abre el modal para gestionar cotizaciones de un componente
 */
async function abrirModalCotizaciones(idComponente) {
    try {
        debugLog('Abriendo/Actualizando modal de cotizaciones...', idComponente);
        // Cargar datos del componente con sus cotizaciones
        const response = await fetch(`${API_COTIZACIONES}?action=getComponenteConCotizaciones&id_componente=${idComponente}&id_presupuesto=${presupuestoActual.id_presupuesto}`);
        const result = await response.json();
        
        if (result.success) {
            const componente = result.data.componente;
            componenteActual = componente;
            cotizacionesExistentes = result.data.cotizaciones || [];
            
            // Llenar información del componente
            document.getElementById('modalComponenteCodigo').textContent = componente.codigo_componente || '-';
            document.getElementById('modalComponenteDescripcion').textContent = componente.descripcion || componente.nombre_componente || '-';
            document.getElementById('modalComponenteTipo').textContent = getTipoLabel(componente.tipo_componente);
            document.getElementById('modalComponenteUnidad').textContent = componente.unidad || 'UND';
            
            // Mostrar cotizaciones existentes
            mostrarCotizacionesExistentes();
            
            // Abrir o refrescar modal
            const modalElement = document.getElementById('modalCotizacionesComponente');
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            
            // Solo llamar a show si el modal no está visible
            if (!modalElement.classList.contains('show')) {
                modal.show();
                
                // Limpieza de backdrops al cerrar
                modalElement.addEventListener('hidden.bs.modal', function () {
                    document.body.classList.remove('modal-open');
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    backdrops.forEach(b => b.remove());
                }, { once: true });
            }
        } else {
            mostrarError(result.error || 'Error cargando componente');
        }
    } catch (error) {
        console.error('Error abriendo modal:', error);
        mostrarError('Error al cargar el componente');
    }
}

/**
 * Muestra las cotizaciones existentes del componente
 */
function mostrarCotizacionesExistentes() {
    const tbody = document.querySelector('#tablaCotizacionesExistentes tbody');
    
    if (!cotizacionesExistentes || cotizacionesExistentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay cotizaciones registradas</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = cotizacionesExistentes.map(cotizacion => {
        const esActiva = cotizacion.estado === 'activa';
        const fecha = new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-MX');
        const ordenesCount = parseInt(cotizacion.ordenes_count || 0);
        
        return `
            <tr class="${esActiva ? '' : 'table-light text-muted'}" style="${esActiva ? '' : 'opacity: 0.7;'}">
                <td>
                    <div class="fw-bold">${cotizacion.nombre_proveedor}</div>
                    ${esActiva 
                        ? '<span class="badge bg-success small">Activa</span>' 
                        : '<span class="badge bg-secondary small">Inactiva</span>'}
                    ${ordenesCount > 0 
                        ? `<span class="badge bg-info text-dark small" title="Usada en ${ordenesCount} recursos de O.C."><i class="bi bi-cart-check"></i> ${ordenesCount} OC</span>` 
                        : ''}
                </td>
                <td class="text-end">
                    <strong>$${formatCurrency(cotizacion.precio_unitario)}</strong>
                </td>
                <td class="text-center">${cotizacion.tiempo_entrega || '-'}</td>
                <td class="text-center">${fecha}</td>
                <td class="text-center">
                    ${esActiva ? `
                        <button class="btn btn-sm btn-outline-warning" 
                                onclick="editarCotizacion(${cotizacion.id_cotizacion})" 
                                title="Editar cotización">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="eliminarCotizacion(${cotizacion.id_cotizacion})"
                                title="Desactivar cotización">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-success" 
                                onclick="activarCotizacion(${cotizacion.id_cotizacion})"
                                title="Reactivar cotización">
                            <i class="bi bi-arrow-counterclockwise"></i> Reactivar
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Guarda o actualiza una cotización
 */
async function guardarNuevaCotizacion(e) {
    e.preventDefault();
    
    const idCotizacion = document.getElementById('idCotizacion').value;
    const idProveedor = document.getElementById('selectProveedor').value;
    const precioUnitario = parseFloat(document.getElementById('precioUnitario').value);
    const tiempoEntrega = document.getElementById('tiempoEntrega').value;
    const observaciones = document.getElementById('observacionesCotizacion').value;
    
    if (!idProveedor || !precioUnitario || precioUnitario <= 0) {
        mostrarError('Completa los campos obligatorios', 'warning');
        return;
    }
    
    try {
        const formData = new FormData();
        // Si hay idCotizacion, es una actualización
        const accion = idCotizacion ? 'actualizarCotizacion' : 'guardarCotizacion';
        formData.append('action', accion);
        
        if (idCotizacion) {
            formData.append('id_cotizacion', idCotizacion);
        }
        
        formData.append('id_componente', componenteActual.id_componente);
        formData.append('id_presupuesto', presupuestoActual.id_presupuesto);
        formData.append('id_proveedor', idProveedor);
        formData.append('precio_unitario', precioUnitario);
        formData.append('tiempo_entrega', tiempoEntrega);
        formData.append('observaciones', observaciones);
        
        const response = await fetch(API_COTIZACIONES, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito(idCotizacion ? 'Cotización actualizada' : 'Cotización guardada');
            
            // Limpiar formulario pasamos a modo creación
            cancelarEdicionCotizacion();
            
            // Recargar cotizaciones existentes
            await abrirModalCotizaciones(componenteActual.id_componente);
            
            // Actualizar lista de componentes silenciosamente para no interrumpir
            await cargarComponentesPresupuesto(true);
        } else {
            mostrarError(result.error || 'Error procesando cotización');
        }
    } catch (error) {
        console.error('Error procesando cotización:', error);
        mostrarError('Error al procesar la cotización');
    }
}

/**
 * Prepara el formulario para editar una cotización
 */
function editarCotizacion(idCotizacion) {
    const cotizacion = cotizacionesExistentes.find(c => c.id_cotizacion == idCotizacion);
    if (!cotizacion) return;
    
    document.getElementById('idCotizacion').value = idCotizacion;
    document.getElementById('selectProveedor').value = cotizacion.id_proveedor;
    document.getElementById('precioUnitario').value = cotizacion.precio_unitario;
    document.getElementById('tiempoEntrega').value = cotizacion.tiempo_entrega || '';
    document.getElementById('observacionesCotizacion').value = cotizacion.observaciones || '';
    
    // Cambiar estilo del botón
    const btn = document.getElementById('btnGuardarCotizacion');
    if (btn) {
        btn.classList.replace('btn-primary', 'btn-warning');
        btn.innerHTML = '<i class="bi bi-pencil-square"></i> Actualizar Cotización';
    }
    
    // Scroll al formulario
    document.getElementById('formNuevaCotizacion').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Cancela la edición y limpia el formulario
 */
function cancelarEdicionCotizacion() {
    document.getElementById('idCotizacion').value = '';
    document.getElementById('formNuevaCotizacion').reset();
    
    const btn = document.getElementById('btnGuardarCotizacion');
    if (btn) {
        btn.classList.replace('btn-warning', 'btn-primary');
        btn.innerHTML = '<i class="bi bi-check-circle"></i> Guardar Cotización';
    }
}

/**
 * Desactiva una cotización
 */
async function eliminarCotizacion(idCotizacion) {
    if (!confirm('¿Estás seguro de que deseas desactivar esta cotización?')) return;
    
    try {
        const response = await fetch(`${API_COTIZACIONES}?action=eliminarCotizacion&id=${idCotizacion}`);
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Cotización desactivada correctamente');
            await abrirModalCotizaciones(componenteActual.id_componente);
            // Actualizar lista silenciosamente
            await cargarComponentesPresupuesto(true);
        } else {
            // El error vendrá del controlador si hay órdenes de compra
            mostrarError(result.error || 'Error al desactivar cotización');
        }
    } catch (error) {
        console.error('Error desactivando cotización:', error);
        mostrarError('Error al desactivar la cotización');
    }
}

/**
 * Reactiva una cotización previamente desactivada
 */
async function activarCotizacion(idCotizacion) {
    try {
        const response = await fetch(`${API_COTIZACIONES}?action=activarCotizacion&id=${idCotizacion}`);
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Cotización reactivada correctamente');
            await abrirModalCotizaciones(componenteActual.id_componente);
            // Actualizar lista silenciosamente
            await cargarComponentesPresupuesto(true);
        } else {
            mostrarError(result.error || 'Error reactivando cotización');
        }
    } catch (error) {
        console.error('Error reactivando cotización:', error);
        mostrarError('Error al reactivar la cotización');
    }
}



/**
 * Exporta las cotizaciones del presupuesto
 */
function exportarCotizacionesPresupuesto() {
    if (!presupuestoActual) {
        mostrarError('Selecciona un presupuesto primero', 'warning');
        return;
    }
    
    window.open(`${API_COTIZACIONES}?action=exportarCotizacionesPresupuesto&id_presupuesto=${presupuestoActual.id_presupuesto}`, '_blank');
}

/**
 * Exporta los componentes filtrados a Excel (Petición de Cotización)
 */
function exportarAExcel() {
    if (!componentesPresupuesto || componentesPresupuesto.length === 0) {
        mostrarError('No hay componentes para exportar', 'warning');
        return;
    }

    // Preparar datos para Excel (solo información relevante para el proveedor)
    const datos = componentesPresupuesto.map(comp => ({
        'Código': comp.codigo_componente || '',
        'Descripción': comp.descripcion || '',
        'Tipo': getTipoLabel(comp.tipo_componente),
        'Unidad': comp.unidad || 'UND',
        'Cantidad Requerida': parseFloat(comp.cantidad || 0).toFixed(4),
        'Capítulo': comp.nombre_capitulo || ''
    }));

    // Crear worksheet
    const ws = XLSX.utils.json_to_sheet(datos);

    // Ajustar anchos de columna
    const colWidths = [
        { wch: 15 },  // Código
        { wch: 50 },  // Descripción
        { wch: 15 },  // Tipo
        { wch: 10 },  // Unidad
        { wch: 18 },  // Cantidad
        { wch: 25 }   // Capítulo
    ];
    ws['!cols'] = colWidths;

    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Nombre de la hoja
    const nombreHoja = 'Peticion_Cotizacion';
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

    // Generar nombre del archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreProyecto = proyectoActual ? proyectoActual.nombre.replace(/[^a-zA-Z0-9]/g, '_') : 'Proyecto';
    const nombreArchivo = `Cotizacion_${nombreProyecto}_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo);

    // Mostrar mensaje de éxito
    mostrarExito(`Archivo exportado: ${nombreArchivo}`);
}

/**
 * Muestra mensaje de éxito
 */
function mostrarExito(mensaje) {
    const toastHTML = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle"></i> ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
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
    
    toastContainer.lastElementChild.addEventListener('hidden.bs.toast', () => {
        toastContainer.lastElementChild.remove();
    });
}

// Funciones utilitarias
function getTipoLabel(tipo) {
    const tipos = {
        'material': 'Material',
        'mano_obra': 'Mano de Obra',
        'maquinaria': 'Maquinaria',
        'equipo': 'Equipo',
        'varios': 'Varios'
    };
    return tipos[tipo] || tipo;
}

function getTipoBadgeClass(tipo) {
    const clases = {
        'material': 'bg-primary',
        'mano_obra': 'bg-success',
        'maquinaria': 'bg-warning text-dark',
        'equipo': 'bg-info',
        'varios': 'bg-secondary'
    };
    return clases[tipo] || 'bg-secondary';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function mostrarMensaje(mensaje, tipo = 'info') {
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

function mostrarError(mensaje) {
    mostrarMensaje(mensaje, 'danger');
}

function mostrarExito(mensaje) {
    mostrarMensaje(mensaje, 'success');
}

// Exponer funciones globales para eventos inline de HTML
console.log('[COTIZACIONES] === EXPOSING GLOBAL FUNCTIONS ===');
window.inicializarCotizaciones = inicializarCotizaciones;
console.log('[COTIZACIONES] window.inicializarCotizaciones set to:', typeof window.inicializarCotizaciones);
window.abrirModalCotizaciones = abrirModalCotizaciones;
window.editarCotizacion = editarCotizacion;
window.eliminarCotizacion = eliminarCotizacion;
window.activarCotizacion = activarCotizacion;
window.cancelarEdicionCotizacion = cancelarEdicionCotizacion;
window.cargarPresupuestosDeProyecto = cargarPresupuestosDeProyecto;
window.exportarCotizacionesPresupuesto = exportarCotizacionesPresupuesto;
window.exportarAExcel = exportarAExcel;
window.cargarComponentesPresupuesto = cargarComponentesPresupuesto;
window.filtrarComponentes = filtrarComponentes;
window.cambiarFiltroPedido = cambiarFiltroPedido;
window.toggleTodosPedidos = toggleTodosPedidos;
window.togglePedidoIndividual = togglePedidoIndividual;
window.actualizarFiltroPedidos = actualizarFiltroPedidos;
window.cargarComponentesPorPedidos = cargarComponentesPorPedidos;

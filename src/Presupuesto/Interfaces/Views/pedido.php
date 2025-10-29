<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Proyectos y Materiales</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
</head>
<body class="bg-light">
    <div class="container-fluid py-4">
        <!-- Card Principal Única -->
        <div class="card shadow-lg">
            <div class="card-header bg-info text-white">
                <h4 class="mb-0">Sistema de Gestión de Materiales y Pedidos</h4>
            </div>
            <div class="card-body">
                <!-- Sección de Selección -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h5 class="text-info mb-3">Configuración del Proyecto</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Proyecto</label>
                                <select class="form-select" id="selectProyecto" onchange="cargarPresupuestos()">
                                    <option value="">-- Seleccionar Proyecto --</option>
                                </select>
                            </div>
                            
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Presupuesto</label>
                                <select class="form-select" id="selectPresupuesto" onchange="cargarMateriales()" disabled>
                                    <option value="">-- Primero seleccione un proyecto --</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Información del Proyecto -->
                        <div class="mt-4" id="projectInfo" style="display: none;">
                            <div class="alert alert-info">
                                <div class="row">
                                    <div class="col-md-4">
                                        <strong>Proyecto:</strong><br>
                                        <span id="infoNombre">-</span>
                                    </div>
                                    <div class="col-md-4">
                                        <strong>Presupuesto:</strong><br>
                                        <span id="infoPresupuesto">-</span>
                                    </div>
                                    <div class="col-md-2">
                                        <strong>Total:</strong><br>
                                        <span id="infoTotal">-</span>
                                    </div>
                                    <div class="col-md-2">
                                        <strong>Items:</strong><br>
                                        <span id="infoItems">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <!-- Sección de Gestión de Materiales -->
                <div class="row">
                    <div class="col-12">
                        <h5 class="text-success mb-3">Gestión de Materiales y Pedidos</h5>
                        <small id="currentSelectionInfo" class="text-muted fst-italic mb-3 d-block">
                            Seleccione un proyecto y presupuesto para comenzar
                        </small>
                        
                        <div class="row mb-4">
                            <div class="col-md-8">
                                <div class="btn-group">
                                    <button class="btn btn-primary" onclick="mostrarModalNuevoItem()" id="btnAgregarExtra" disabled>
                                        Agregar Material Extra
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="exportarPedidos()" id="btnExportar" disabled>
                                        Exportar Pedidos
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Buscar material..." id="searchMaterial" onkeyup="filtrarMateriales()">
                                    <button class="btn btn-outline-secondary" type="button">
                                        Buscar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <!-- Sidebar con Filtros y Estadísticas -->
                            <div class="col-md-3">
                                <div class="card shadow-sm">
                                    <div class="card-header bg-info text-white">
                                        <h6 class="mb-0">Filtros</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label class="form-label">Estado del Material</label>
                                            <select class="form-select" id="filterEstado" onchange="filtrarMateriales()">
                                                <option value="">Todos</option>
                                                <option value="disponible">Disponible</option>
                                                <option value="agotado">Agotado</option>
                                                <option value="pedido">En pedido</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Capítulo</label>
                                            <select class="form-select" id="filterCapitulo" onchange="filtrarMateriales()">
                                                <option value="">Todos los capítulos</option>
                                            </select>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Tipo de Material</label>
                                            <select class="form-select" id="filterTipo" onchange="filtrarMateriales()">
                                                <option value="">Todos los tipos</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Estadísticas -->
                                <div class="card shadow-sm mt-3">
                                    <div class="card-header bg-info text-white">
                                        <h6 class="mb-0">Resumen del Pedido</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Materiales seleccionados:</span>
                                            <strong id="statSeleccionados">0</strong>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Total items:</span>
                                            <strong id="statTotalItems">0</strong>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Valor total:</span>
                                            <strong id="statValorTotal">$0</strong>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span>Materiales extra:</span>
                                            <strong id="statExtras">0</strong>
                                        </div>
                                        <hr>
                                        <button class="btn btn-success w-100" onclick="confirmarPedido()" id="btnConfirmarPedido" disabled>
                                            Confirmar Pedido
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Lista de Materiales -->
                            <div class="col-md-9">
                                <div class="card shadow-sm">
                                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">Materiales del Presupuesto</h6>
                                        <span class="badge bg-light text-dark" id="contadorMateriales">0 materiales</span>
                                    </div>
                                    <div class="card-body">
                                        <div id="materialesList">
                                            <div class="text-center text-muted py-5">
                                                <p class="mt-3">Seleccione un proyecto y presupuesto para ver los materiales</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Materiales Extra -->
                                <div class="card shadow-sm mt-3" id="cardExtras" style="display: none;">
                                    <div class="card-header bg-warning text-dark">
                                        <h6 class="mb-0">Materiales Extra (Fuera de Presupuesto)</h6>
                                    </div>
                                    <div class="card-body">
                                        <div id="materialesExtraList">
                                            <!-- Los materiales extra se cargarán aquí -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para Agregar Material Extra -->
    <div class="modal fade" id="modalNuevoItem" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title">Agregar Material Extra</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formNuevoItem">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Código del Material *</label>
                                    <input type="text" class="form-control" id="codigoMaterial" placeholder="Ej: EXT-001" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Unidad de Medida *</label>
                                    <select class="form-select" id="unidadMaterial" required>
                                        <option value="">Seleccionar...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Descripción del Material *</label>
                            <input type="text" class="form-control" id="descripcionMaterial" placeholder="Nombre y especificaciones del material" required>
                        </div>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Cantidad Requerida *</label>
                                    <input type="number" class="form-control" id="cantidadMaterial" placeholder="0" min="1" required>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Precio Unitario Estimado</label>
                                    <input type="number" class="form-control" id="precioMaterial" placeholder="0" min="0" step="0.01">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Tipo de Material</label>
                                    <select class="form-select" id="tipoMaterial">
                                        <option value="2">Material</option>
                                        <option value="1">Mano de Obra</option>
                                        <option value="3">Equipo</option>
                                        <option value="4">Otros</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Justificación *</label>
                            <textarea class="form-control" id="justificacionMaterial" rows="3" placeholder="Explique por qué necesita este material fuera del presupuesto original..." required></textarea>
                        </div>
                        <div class="alert alert-warning">
                            <small>Este material requerirá aprobación antes de ser incluido en el pedido.</small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="solicitarMaterialExtra()">Solicitar Aprobación</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const API_PRESUPUESTOS = '/workspace/constructora-app/src/Presupuesto/Interfaces/PresupuestoController.php';
        
        let proyectosData = [];
        let materialesData = [];
        let materialesExtra = [];
        let seleccionActual = null;

        // Cargar datos iniciales al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            cargarProyectos();
            cargarUnidades();
            cargarTiposMaterial();
        });

        // Función para cargar proyectos desde el controller
        async function cargarProyectos() {
            try {
                const response = await fetch(API_PRESUPUESTOS + "?action=getProyectos");
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                const selectProyecto = document.getElementById('selectProyecto');
                selectProyecto.innerHTML = '<option value="">-- Seleccionar Proyecto --</option>';
                
                result.data.forEach(proyecto => {
                    const option = document.createElement('option');
                    option.value = proyecto.id_proyecto;
                    option.textContent = proyecto.nombre;
                    selectProyecto.appendChild(option);
                });
                
                proyectosData = result.data;
            } catch (error) {
                console.error('Error cargando proyectos:', error);
                alert('Error al cargar los proyectos: ' + error.message);
            }
        }

        // Función para cargar presupuestos del proyecto seleccionado
        async function cargarPresupuestos() {
            const proyectoId = document.getElementById('selectProyecto').value;
            const selectPresupuesto = document.getElementById('selectPresupuesto');
            const projectInfo = document.getElementById('projectInfo');
            
            // Reset
            selectPresupuesto.innerHTML = '<option value="">-- Seleccionar Presupuesto --</option>';
            selectPresupuesto.disabled = true;
            projectInfo.style.display = 'none';
            resetarGestion();
            
            if (proyectoId) {
                try {
                    const formData = new FormData();
                    formData.append('proyecto_id', proyectoId);
                    
                    const response = await fetch(API_PRESUPUESTOS + "?action=getPresupuestosByProyecto", {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (!result.success) {
                        throw new Error(result.error);
                    }
                    
                    selectPresupuesto.disabled = false;
                    
                    result.data.forEach(presupuesto => {
                        const option = document.createElement('option');
                        option.value = presupuesto.id_presupuesto;
                        option.textContent = `${presupuesto.nombre_proyecto || presupuesto.nombre} - $${parseFloat(presupuesto.monto_total || 0).toLocaleString()}`;
                        option.setAttribute('data-presupuesto', JSON.stringify(presupuesto));
                        selectPresupuesto.appendChild(option);
                    });
                    
                } catch (error) {
                    console.error('Error cargando presupuestos:', error);
                    alert('Error al cargar los presupuestos: ' + error.message);
                }
            }
        }

        // Función para cargar materiales
        async function cargarMateriales() {
            const presupuestoId = document.getElementById('selectPresupuesto').value;
            const selectedOption = document.getElementById('selectPresupuesto').selectedOptions[0];
            
            if (presupuestoId && selectedOption) {
                try {
                    // Mostrar loading
                    document.getElementById('materialesList').innerHTML = `
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando materiales...</span>
                            </div>
                            <p class="mt-3">Cargando materiales del presupuesto...</p>
                        </div>
                    `;

                    const presupuesto = JSON.parse(selectedOption.getAttribute('data-presupuesto'));
                    const proyectoId = document.getElementById('selectProyecto').value;
                    const proyecto = proyectosData.find(p => p.id_proyecto == proyectoId);
                    
                    // Cargar materiales reales del presupuesto
                    const materiales = await cargarMaterialesPresupuesto(presupuestoId);
                    
                    // Cargar capítulos para el filtro
                    await cargarCapitulosParaFiltro(presupuestoId);
                    
                    materialesData = materiales;
                    seleccionActual = {
                        proyecto: proyecto.nombre,
                        presupuesto: presupuesto.nombre_proyecto || presupuesto.nombre,
                        capitulo: 'Todos los capítulos',
                        datos: {
                            proyectoId,
                            presupuestoId,
                            capituloId: null,
                            presupuesto
                        }
                    };
                    
                    // Actualizar información en la sección de gestión
                    document.getElementById('currentSelectionInfo').textContent = 
                        `${proyecto.nombre} - ${seleccionActual.presupuesto}`;
                    
                    // Habilitar botones
                    document.getElementById('btnAgregarExtra').disabled = false;
                    document.getElementById('btnExportar').disabled = false;
                    document.getElementById('filterCapitulo').disabled = false;
                    
                    // Mostrar materiales
                    mostrarMateriales(materiales);
                    actualizarEstadisticas();
                    mostrarInformacionProyecto(proyecto, presupuesto);
                    
                } catch (error) {
                    console.error('Error cargando materiales:', error);
                    mostrarErrorMateriales();
                }
            }
        }

        // Función para cargar capítulos para el filtro
        async function cargarCapitulosParaFiltro(presupuestoId) {
            try {
                const capitulos = await cargarCapitulosReales(presupuestoId);
                const filterCapitulo = document.getElementById('filterCapitulo');
                filterCapitulo.innerHTML = '<option value="">Todos los capítulos</option>';
                
                capitulos.forEach(cap => {
                    const option = document.createElement('option');
                    option.value = cap.id_capitulo;
                    option.textContent = cap.nombre_cap;
                    filterCapitulo.appendChild(option);
                });
                
            } catch (error) {
                console.error('Error cargando capítulos para filtro:', error);
                // En caso de error, mantener el filtro vacío
                document.getElementById('filterCapitulo').innerHTML = '<option value="">Todos los capítulos</option>';
            }
        }

        // Función para cargar capítulos reales
        async function cargarCapitulosReales(presupuestoId) {
            try {
                const formData = new FormData();
                formData.append('id_presupuesto', presupuestoId);
                
                const response = await fetch(API_PRESUPUESTOS + "?action=getCapitulosByPresupuesto", {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    return result.data;
                } else {
                    throw new Error(result.error || 'No se pudieron cargar los capítulos');
                }
            } catch (error) {
                console.error('Error cargando capítulos:', error);
                throw error;
            }
        }

        // Función para cargar materiales del presupuesto
        async function cargarMaterialesPresupuesto(presupuestoId, capituloId = null) {
            try {
                // Usar la función real en lugar del ejemplo
                const materiales = await obtenerMaterialesReales(presupuestoId, capituloId);
                return materiales;
            } catch (error) {
                console.error('Error cargando materiales:', error);
                // Si falla la API, puedes mostrar un mensaje al usuario
                mostrarErrorMateriales();
                return [];
            }
        }

        // Función para obtener materiales reales del presupuesto
        async function obtenerMaterialesReales(presupuestoId, capituloId = null) {
            try {
                const formData = new FormData();
                formData.append('presupuesto_id', presupuestoId);
                if (capituloId) {
                    formData.append('capitulo_id', capituloId);
                }
                
                const response = await fetch(API_PRESUPUESTOS + "?action=getMaterialesByPresupuesto", {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    return result.data.map(material => ({
                        cod_material: material.cod_material,
                        nombre_material: material.nombre_material,
                        id_capitulo: material.id_capitulo,
                        nombre_capitulo: material.nombre_capitulo,
                        unidad: material.unidad,
                        precio: parseFloat(material.precio) || 0,
                        cantidad: parseFloat(material.cantidad) || 0,
                        pedido: parseInt(material.pedido) || 0,
                        id_tipo_material: parseInt(material.id_tipo_material) || 2,
                        // Campos adicionales que podrías necesitar
                        id_material: material.id_material,
                        id_det_presupuesto: material.id_det_presupuesto,
                        disponible: parseFloat(material.disponible) || 0
                    }));
                } else {
                    throw new Error(result.error || 'No se pudieron cargar los materiales');
                }
                
            } catch (error) {
                console.error('Error cargando materiales reales:', error);
                throw error;
            }
        }

        // Función para mostrar error al cargar materiales
        function mostrarErrorMateriales() {
            const container = document.getElementById('materialesList');
            container.innerHTML = `
                <div class="text-center text-danger py-5">
                    <i class="bi bi-exclamation-triangle display-4"></i>
                    <p class="mt-3">Error al cargar los materiales del presupuesto</p>
                    <button class="btn btn-warning" onclick="reintentarCargaMateriales()">
                        Reintentar
                    </button>
                </div>
            `;
        }

        // Función para reintentar carga de materiales
        function reintentarCargaMateriales() {
            const presupuestoId = document.getElementById('selectPresupuesto').value;
            if (presupuestoId) {
                cargarMateriales();
            }
        }

        // Función para mostrar materiales en la lista
        function mostrarMateriales(materiales) {
            const container = document.getElementById('materialesList');
            
            if (materiales.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <p class="mt-3">No hay materiales en este presupuesto/capítulo</p>
                    </div>
                `;
                document.getElementById('contadorMateriales').textContent = '0 materiales';
                return;
            }
            
            let html = '';
            materiales.forEach(material => {
                const disponible = material.disponible || (material.cantidad - (material.pedido || 0));
                const badgeClass = disponible > 0 ? 'bg-success' : 'bg-danger';
                const badgeText = disponible > 0 ? 'Disponible' : 'Agotado';
                const buttonClass = (material.pedido || 0) > 0 ? 'btn-warning' : 'btn-primary';
                const buttonText = (material.pedido || 0) > 0 ? 'En pedido' : 'Agregar';
                const subtotal = ((material.pedido || 0) * material.precio).toFixed(2);
                
                html += `
                    <div class="card mb-3 material-item" data-codigo="${material.cod_material}" data-capitulo="${material.id_capitulo}" data-estado="${disponible > 0 ? 'disponible' : 'agotado'}" data-tipo="${material.id_tipo_material}">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-4">
                                    <h6 class="mb-1 text-primary">${material.cod_material}</h6>
                                    <p class="mb-1">${material.nombre_material}</p>
                                    <small class="text-muted">Capítulo: ${material.nombre_capitulo} | ${material.unidad}</small>
                                </div>
                                <div class="col-md-2 text-center">
                                    <span class="badge ${badgeClass}">${badgeText}</span>
                                    <div class="mt-1">
                                        <small class="text-muted">$${parseFloat(material.precio).toFixed(2)}</small>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="input-group input-group-sm">
                                        <input type="number" class="form-control cantidad-input" 
                                               value="${material.pedido || 0}" 
                                               min="0" max="${disponible}" 
                                               data-codigo="${material.cod_material}"
                                               onchange="actualizarCantidad('${material.cod_material}', this.value)">
                                        <span class="input-group-text">/ ${material.cantidad}</span>
                                        <button class="btn ${buttonClass} btn-sm" onclick="agregarAlPedido('${material.cod_material}')">
                                            ${buttonText}
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="text-end">
                                        <small class="text-muted d-block">Presupuestado: ${material.cantidad} ${material.unidad}</small>
                                        <strong class="${disponible === 0 ? 'text-danger' : 'text-success'}">
                                            Disponible: ${disponible} ${material.unidad}
                                        </strong>
                                        <div class="mt-1">
                                            <small class="text-info">Subtotal: $<span class="subtotal">${subtotal}</span></small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            document.getElementById('contadorMateriales').textContent = `${materiales.length} materiales`;
        }

        // Función para actualizar cantidad de material
        function actualizarCantidad(codigo, cantidad) {
            const material = materialesData.find(m => m.cod_material === codigo);
            if (material) {
                material.pedido = parseInt(cantidad) || 0;
                actualizarEstadisticas();
                
                const card = document.querySelector(`[data-codigo="${codigo}"]`);
                if (card) {
                    const subtotalElement = card.querySelector('.subtotal');
                    subtotalElement.textContent = (material.pedido * material.precio).toFixed(2);
                    
                    const button = card.querySelector('button');
                    if (material.pedido > 0) {
                        button.classList.remove('btn-primary');
                        button.classList.add('btn-warning');
                        button.textContent = 'En pedido';
                    } else {
                        button.classList.remove('btn-warning');
                        button.classList.add('btn-primary');
                        button.textContent = 'Agregar';
                    }
                }
            }
        }

        // Función para agregar material al pedido
        function agregarAlPedido(codigo) {
            const input = document.querySelector(`[data-codigo="${codigo}"] .cantidad-input`);
            if (input) {
                const disponible = parseInt(input.max);
                
                if (disponible > 0) {
                    input.value = disponible;
                    actualizarCantidad(codigo, disponible);
                }
            }
        }

        // Función para actualizar estadísticas
        function actualizarEstadisticas() {
            const materialesSeleccionados = materialesData.filter(m => (m.pedido || 0) > 0);
            const totalItems = materialesSeleccionados.reduce((sum, m) => sum + (m.pedido || 0), 0);
            const valorTotal = materialesSeleccionados.reduce((sum, m) => sum + ((m.pedido || 0) * m.precio), 0);
            
            document.getElementById('statSeleccionados').textContent = materialesSeleccionados.length;
            document.getElementById('statTotalItems').textContent = totalItems;
            document.getElementById('statValorTotal').textContent = `$${valorTotal.toFixed(2)}`;
            document.getElementById('statExtras').textContent = materialesExtra.length;
            
            document.getElementById('btnConfirmarPedido').disabled = materialesSeleccionados.length === 0 && materialesExtra.length === 0;
        }

        // Función para cargar unidades de medida
        async function cargarUnidades() {
            try {
                const response = await fetch(API_PRESUPUESTOS + "?action=getUnidades");
                const result = await response.json();
                
                if (result.success) {
                    const selectUnidad = document.getElementById('unidadMaterial');
                    result.data.forEach(unidad => {
                        const option = document.createElement('option');
                        option.value = unidad.idunidad;
                        option.textContent = unidad.unidesc;
                        selectUnidad.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error cargando unidades:', error);
            }
        }

        // Función para cargar tipos de material
        async function cargarTiposMaterial() {
            try {
                const response = await fetch(API_PRESUPUESTOS + "?action=getTiposMaterial");
                const result = await response.json();
                
                if (result.success) {
                    const filterTipo = document.getElementById('filterTipo');
                    result.data.forEach(tipo => {
                        const option = document.createElement('option');
                        option.value = tipo.id_tipo_material;
                        option.textContent = tipo.desc_tipo;
                        filterTipo.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error cargando tipos de material:', error);
            }
        }

        // Función para mostrar información del proyecto
        function mostrarInformacionProyecto(proyecto, presupuesto) {
            document.getElementById('infoNombre').textContent = proyecto.nombre;
            document.getElementById('infoPresupuesto').textContent = presupuesto.nombre_proyecto || presupuesto.nombre;
            document.getElementById('infoTotal').textContent = `$${parseFloat(presupuesto.monto_total || 0).toLocaleString()}`;
            document.getElementById('infoItems').textContent = materialesData.length;
            
            document.getElementById('projectInfo').style.display = 'block';
        }

        // Función para resetar la gestión
        function resetarGestion() {
            materialesData = [];
            materialesExtra = [];
            document.getElementById('materialesList').innerHTML = `
                <div class="text-center text-muted py-5">
                    <p class="mt-3">Seleccione un proyecto y presupuesto para ver los materiales</p>
                </div>
            `;
            document.getElementById('currentSelectionInfo').textContent = 'Seleccione un proyecto y presupuesto para comenzar';
            document.getElementById('btnAgregarExtra').disabled = true;
            document.getElementById('btnExportar').disabled = true;
            document.getElementById('btnConfirmarPedido').disabled = true;
            document.getElementById('filterCapitulo').disabled = true;
            document.getElementById('cardExtras').style.display = 'none';
            actualizarEstadisticas();
        }

        // Función para mostrar modal de material extra
        function mostrarModalNuevoItem() {
            document.getElementById('formNuevoItem').reset();
            const modal = new bootstrap.Modal(document.getElementById('modalNuevoItem'));
            modal.show();
        }

        // Función para solicitar material extra
        function solicitarMaterialExtra() {
            const codigo = document.getElementById('codigoMaterial').value;
            const descripcion = document.getElementById('descripcionMaterial').value;
            const cantidad = document.getElementById('cantidadMaterial').value;
            const unidad = document.getElementById('unidadMaterial').value;
            const precio = document.getElementById('precioMaterial').value;
            const tipo = document.getElementById('tipoMaterial').value;
            const justificacion = document.getElementById('justificacionMaterial').value;
            
            if (!codigo || !descripcion || !cantidad || !unidad || !justificacion) {
                alert('Por favor complete todos los campos obligatorios (*)');
                return;
            }
            
            const materialExtra = {
                codigo,
                descripcion,
                cantidad: parseInt(cantidad),
                unidad: document.getElementById('unidadMaterial').selectedOptions[0].textContent,
                precio: parseFloat(precio) || 0,
                tipo,
                justificacion,
                estado: 'pendiente',
                fecha: new Date().toISOString().split('T')[0]
            };
            
            materialesExtra.push(materialExtra);
            mostrarMaterialesExtra();
            actualizarEstadisticas();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoItem'));
            modal.hide();
            
            alert('Material extra solicitado para aprobación');
        }

        // Función para mostrar materiales extra
        function mostrarMaterialesExtra() {
            const container = document.getElementById('materialesExtraList');
            const cardExtras = document.getElementById('cardExtras');
            
            if (materialesExtra.length === 0) {
                cardExtras.style.display = 'none';
                return;
            }
            
            cardExtras.style.display = 'block';
            
            let html = '';
            materialesExtra.forEach((material, index) => {
                html += `
                    <div class="card mb-2">
                        <div class="card-body py-2">
                            <div class="row align-items-center">
                                <div class="col-md-5">
                                    <strong class="text-warning">${material.codigo}</strong>
                                    <p class="mb-0 small">${material.descripcion}</p>
                                    <small class="text-muted">Justificación: ${material.justificacion}</small>
                                </div>
                                <div class="col-md-3">
                                    <span class="badge bg-warning">Por aprobar</span>
                                    <div class="mt-1">
                                        <small>${material.cantidad} ${material.unidad}</small>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <small>$${material.precio.toFixed(2)}</small>
                                </div>
                                <div class="col-md-2 text-end">
                                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarMaterialExtra(${index})">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }

        // Función para eliminar material extra
        function eliminarMaterialExtra(index) {
            if (confirm('¿Está seguro de eliminar este material extra?')) {
                materialesExtra.splice(index, 1);
                mostrarMaterialesExtra();
                actualizarEstadisticas();
            }
        }

        // Función para filtrar materiales
        function filtrarMateriales() {
            const filtroEstado = document.getElementById('filterEstado').value;
            const filtroCapitulo = document.getElementById('filterCapitulo').value;
            const filtroTipo = document.getElementById('filterTipo').value;
            const searchTerm = document.getElementById('searchMaterial').value.toLowerCase();
            
            const materialesFiltrados = materialesData.filter(material => {
                const coincideEstado = !filtroEstado || 
                    (filtroEstado === 'disponible' && (material.disponible || (material.cantidad - (material.pedido || 0)) > 0)) ||
                    (filtroEstado === 'agotado' && (material.disponible || (material.cantidad - (material.pedido || 0)) <= 0)) ||
                    (filtroEstado === 'pedido' && (material.pedido || 0) > 0);
                
                const coincideCapitulo = !filtroCapitulo || material.id_capitulo == filtroCapitulo;
                const coincideTipo = !filtroTipo || material.id_tipo_material == filtroTipo;
                const coincideBusqueda = !searchTerm || 
                    material.cod_material.toLowerCase().includes(searchTerm) ||
                    material.nombre_material.toLowerCase().includes(searchTerm);
                
                return coincideEstado && coincideCapitulo && coincideTipo && coincideBusqueda;
            });
            
            mostrarMateriales(materialesFiltrados);
        }

        // Función para confirmar pedido
        async function confirmarPedido() {
            const materialesPedido = materialesData.filter(m => (m.pedido || 0) > 0);
            
            if (materialesPedido.length === 0 && materialesExtra.length === 0) {
                alert('No hay materiales seleccionados para el pedido');
                return;
            }
            
            if (confirm('¿Está seguro de confirmar este pedido?')) {
                try {
                    const pedidoData = {
                        seleccionActual,
                        materiales: materialesPedido,
                        materialesExtra,
                        total: materialesPedido.reduce((sum, m) => sum + ((m.pedido || 0) * m.precio), 0),
                        fecha: new Date().toISOString()
                    };
                    
                    const formData = new FormData();
                    formData.append('pedido_data', JSON.stringify(pedidoData));
                    
                    const response = await fetch(API_PRESUPUESTOS + "?action=guardarPedido", {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Pedido confirmado exitosamente. ID del pedido: ' + result.id_pedido);
                        // Resetear después de confirmar
                        resetarGestion();
                    } else {
                        alert('Error al guardar el pedido: ' + result.error);
                    }
                    
                } catch (error) {
                    console.error('Error confirmando pedido:', error);
                    alert('Error al confirmar el pedido');
                }
            }
        }

        // Función para exportar pedidos
        function exportarPedidos() {
            alert('Funcionalidad de exportación en desarrollo');
        }
    </script>
</body>
</html>
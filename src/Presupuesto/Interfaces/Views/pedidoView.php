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
                                <select class="form-select" id="selectPresupuesto" onchange="cargarItems()" disabled>
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
                                <button class="btn btn-primary" onclick="mostrarModalNuevoItem()" id="btnAgregarExtra" disabled>
                                    <i class="bi bi-plus-circle"></i> Agregar Material Extra
                                </button>
                                <button class="btn btn-info ms-2" onclick="abrirModalResumen()" id="btnVerResumen" disabled>
                                    <i class="bi bi-file-earmark-text"></i> Ver Resumen
                                </button>
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Buscar material..." id="searchMaterial" onkeyup="filtrarMateriales()">
                                    <button class="btn btn-outline-secondary" type="button">
                                        <i class="bi bi-search"></i>
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
                                    <div class="card-header bg-success text-white">
                                        <h6 class="mb-0">Resumen del Pedido</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Materiales en carrito:</span>
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
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Materiales extra:</span>
                                            <strong id="statExtras">0</strong>
                                        </div>
                                        <hr>
                                        <div class="alert alert-warning py-2 mb-2" id="alertPendientesAutorizacion" style="display: none;">
                                            <small>
                                                <i class="bi bi-exclamation-triangle-fill"></i>
                                                <strong id="statPendientesAutorizacion">0</strong> pedidos fuera de presupuesto
                                            </small>
                                        </div>
                                        <button class="btn btn-success w-100" onclick="confirmarPedido()" id="btnConfirmarPedido" disabled>
                                            <i class="bi bi-check-circle"></i> Confirmar Pedido
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Contenido Principal - Materiales y Carrito -->
                            <div class="col-md-9">
                                <!-- TABLA 1: Materiales del Presupuesto -->
                                <div class="card shadow-sm mb-4">
                                    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">
                                            <i class="bi bi-box-seam"></i> Materiales del Presupuesto
                                        </h6>
                                        <span class="badge bg-light text-dark" id="contadorMateriales">0 materiales</span>
                                    </div>
                                    <div class="card-body">
                                        <div id="materialesList">
                                            <div class="text-center text-muted py-5">
                                                <i class="bi bi-inbox display-4"></i>
                                                <p class="mt-3">Seleccione un proyecto y presupuesto para ver los materiales</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- TABLA 2: Carrito de Pedidos -->
                                <div class="card shadow-sm" id="cardCarrito" style="display: none;">
                                    <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">
                                            <i class="bi bi-cart-check"></i> Carrito de Pedidos
                                        </h6>
                                        <span class="badge bg-light text-dark" id="contadorCarrito">0 items</span>
                                    </div>
                                    <div class="card-body">
                                        <div id="carritoList">
                                            <div class="text-center text-muted py-4">
                                                <i class="bi bi-cart display-4"></i>
                                                <p class="mt-3">Agregue materiales del presupuesto para verlos aquí</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Materiales Extra -->
                                <div class="card shadow-sm mt-3" id="cardExtras" style="display: none;">
                                    <div class="card-header bg-warning text-dark">
                                        <h6 class="mb-0">
                                            <i class="bi bi-plus-circle"></i> Materiales Extra (Fuera de Presupuesto)
                                        </h6>
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

    <!-- Modal para Justificación de Pedido Extra -->
    <div class="modal fade" id="modalJustificacionExtra" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title">
                        <i class="bi bi-exclamation-triangle-fill"></i> Pedido Fuera de Presupuesto
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="infoComponenteExtra">
                        <!-- La información se cargará dinámicamente -->
                    </div>
                    <div class="mb-3">
                        <label class="form-label"><strong>Justificación del Pedido Extra *</strong></label>
                        <textarea class="form-control" id="justificacionPedidoExtra" rows="4"
                                  placeholder="Explique por qué necesita exceder el presupuesto disponible para este componente..."
                                  required></textarea>
                        <small class="text-muted">
                            <i class="bi bi-info-circle"></i> Esta justificación será revisada por el personal autorizado antes de aprobar el pedido.
                        </small>
                    </div>
                    <div class="alert alert-info">
                        <small>
                            <strong>Nota:</strong> El pedido dentro del presupuesto se agregará al carrito normal,
                            mientras que la cantidad extra quedará pendiente de autorización.
                        </small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-warning" onclick="confirmarPedidoExtra()">
                        <i class="bi bi-check-circle"></i> Solicitar Autorización
                    </button>
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
                        <!-- Selección de Material -->
                        <div class="mb-3">
                            <label class="form-label">Seleccionar Material *</label>
                            <select class="form-select" id="selectMaterial" required>
                                <option value="">Cargando materiales...</option>
                            </select>
                        </div>
                        
                        <!-- Vista Previa del Material Seleccionado -->
                        <div id="vistaPreviewMaterial" class="alert alert-info" style="display: none;">
                            <h6 class="alert-heading"><i class="bi bi-info-circle"></i> Material Seleccionado</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Código:</strong> <span id="previewCodigo">-</span></p>
                                    <p class="mb-1"><strong>Descripción:</strong> <span id="previewDescripcion">-</span></p>
                                </div>
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Unidad:</strong> <span id="previewUnidad">-</span></p>
                                    <p class="mb-1"><strong>Precio:</strong> $<span id="previewPrecio">0.00</span></p>
                                    <p class="mb-1"><strong>Tipo:</strong> <span id="previewTipo">-</span></p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Capítulo -->
                        <div class="mb-3">
                            <label class="form-label">Capítulo *</label>
                            <select class="form-select" id="capituloMaterialExtra" required>
                                <option value="">Seleccionar capítulo...</option>
                            </select>
                        </div>
                        
                        <!-- Cantidad -->
                        <div class="mb-3">
                            <label class="form-label">Cantidad Requerida *</label>
                            <input type="number" class="form-control" id="cantidadMaterialExtra" 
                                   placeholder="0" min="0.0001" step="0.0001" required>
                        </div>
                        
                        <!-- Justificación -->
                        <div class="mb-3">
                            <label class="form-label">Justificación *</label>
                            <textarea class="form-control" id="justificacionMaterial" rows="3" 
                                      placeholder="Explique por qué necesita este material fuera del presupuesto original..." 
                                      required></textarea>
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

<!-- Modal de Resumen de Materiales -->
<div class="modal fade" id="modalResumen" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title"><i class="bi bi-file-earmark-text"></i> Resumen de Materiales</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-4">
                    <div class="col-md-3"><div class="card bg-light"><div class="card-body text-center"><h6 class="text-muted">Total Items</h6><h3 id="resumenTotalItems">0</h3></div></div></div>
                    <div class="col-md-3"><div class="card bg-primary text-white"><div class="card-body text-center"><h6 class="text-white">Total Componentes</h6><h3 id="resumenTotalComponentes">0</h3></div></div></div>
                    <div class="col-md-3"><div class="card bg-success text-white"><div class="card-body text-center"><h6 class="text-white">Completados</h6><h3 id="resumenCompletados">0</h3></div></div></div>
                    <div class="col-md-3"><div class="card bg-info text-white"><div class="card-body text-center"><h6 class="text-white">Valor Total</h6><h3 id="resumenValorTotal">$0</h3></div></div></div>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead class="table-primary">
                            <tr>
                                <th>Componente</th>
                                <th class="text-center">Tipo</th>
                                <th class="text-center">Unidad</th>
                                <th class="text-end">Cant. Total</th>
                                <th class="text-end">Ya Pedido</th>
                                <th class="text-end">Pedido Actual</th>
                                <th class="text-end">Pendiente</th>
                                <th class="text-center">Estado</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody id="tablaResumenUnificada">
                            <tr><td colspan="9" class="text-center text-muted">No hay datos para mostrar</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-success" onclick="exportarResumenAExcel()"><i class="bi bi-file-earmark-excel"></i> Exportar a Excel</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        </div>
    </div>
</div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="pedidoView.js"></script>
    <script>
        const API_PRESUPUESTOS = '/sgigescomnew/src/Presupuesto/Interfaces/PresupuestoController.php';
    </script>
</body>
</html>
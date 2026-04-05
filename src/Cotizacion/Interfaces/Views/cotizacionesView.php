<?php
/**
 * cotizacionesView.php
 * Componente para gestionar cotizaciones por presupuesto
 * Flujo: Seleccionar proyecto → Seleccionar presupuesto → Ver componentes → Agregar cotizaciones
 */
?>

<div class="container-fluid py-4">
    <div class="card shadow-lg">
        <div class="card-header bg-primary text-white">
            <h4 class="mb-0">
                <i class="bi bi-clipboard2-data"></i> 
                Gestión de Cotizaciones
            </h4>
            <small class="text-white-50">Selecciona proyecto y presupuesto para gestionar cotizaciones</small>
        </div>
        <div class="card-body">
            <!-- Sección de Selección de Proyecto y Presupuesto -->
            <div class="row mb-4">
                <div class="col-12">
                    <h5 class="text-info mb-3">Seleccionar Proyecto y Presupuesto</h5>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Proyecto *</label>
                            <select class="form-select" id="selectProyecto" onchange="cargarPresupuestosDeProyecto()">
                                <option value="">-- Seleccionar proyecto --</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Presupuesto *</label>
                            <select class="form-select" id="selectPresupuesto" onchange="cargarComponentesPresupuesto()" disabled>
                                <option value="">-- Seleccione un proyecto primero --</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Información del Proyecto y Presupuesto -->
                    <div class="mt-4" id="infoProyectoPresupuesto" style="display: none;">
                        <div class="alert alert-info">
                            <div class="row">
                                <div class="col-md-4">
                                    <strong>Proyecto:</strong><br>
                                    <span id="infoNombreProyecto">-</span>
                                </div>
                                <div class="col-md-4">
                                    <strong>Presupuesto:</strong><br>
                                    <span id="infoNombrePresupuesto">-</span>
                                </div>
                                <div class="col-md-4">
                                    <strong>Total Componentes:</strong><br>
                                    <span id="infoTotalComponentes">-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <hr>

            <!-- Lista de Componentes del Presupuesto -->
            <div class="row">
                <div class="col-12">
                    <h5 class="text-success mb-3">Componentes del Presupuesto</h5>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Buscar componente..." id="buscarComponente" oninput="filtrarComponentes()">
                                <button class="btn btn-outline-secondary" type="button" onclick="filtrarComponentes()">
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtroTipo" onchange="filtrarComponentes()">
                                <option value="">Todos los tipos</option>
                                <option value="material">Material</option>
                                <option value="mano_obra">Mano de Obra</option>
                                <option value="maquinaria">Maquinaria</option>
                                <option value="equipo">Equipo</option>
                                <option value="varios">Varios</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtroCotizados" onchange="filtrarComponentes()">
                                <option value="">Todos los componentes</option>
                                <option value="con_cotizacion">Con cotización</option>
                                <option value="sin_cotizacion">Sin cotización</option>
                            </select>
                        </div>
                    </div>

                    <div id="listaComponentes">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-clipboard-data display-4"></i>
                            <p class="mt-3">Selecciona un proyecto y presupuesto para ver los componentes</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal para Gestionar Cotizaciones de un Componente -->
<div class="modal fade" id="modalCotizacionesComponente" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">
                    <i class="bi bi-clipboard2-data"></i> 
                    Gestión de Cotizaciones
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <!-- Información del Componente -->
                <div class="card bg-light mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <strong>Código:</strong><br>
                                <span id="modalComponenteCodigo">-</span>
                            </div>
                            <div class="col-md-6">
                                <strong>Descripción:</strong><br>
                                <span id="modalComponenteDescripcion">-</span>
                            </div>
                            <div class="col-md-2">
                                <strong>Tipo:</strong><br>
                                <span id="modalComponenteTipo">-</span>
                            </div>
                            <div class="col-md-1">
                                <strong>Unidad:</strong><br>
                                <span id="modalComponenteUnidad">-</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lista de Cotizaciones Existentes -->
                <div class="mb-4">
                    <h6 class="text-success mb-3">
                        <i class="bi bi-list-check"></i> Cotizaciones Existentes
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover" id="tablaCotizacionesExistentes">
                            <thead class="table-success">
                                <tr>
                                    <th>Proveedor</th>
                                    <th class="text-end">Precio Unitario</th>
                                    <th class="text-center">Tiempo Entrega</th>
                                    <th class="text-center">Fecha</th>
                                    <th class="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="5" class="text-center text-muted">No hay cotizaciones registradas</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Agregar Nueva Cotización -->
                <div class="card border-primary">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-plus-circle"></i> Agregar Nueva Cotización
                        </h6>
                    </div>
                    <div class="card-body">
                        <form id="formNuevaCotizacion">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="form-label">Proveedor *</label>
                                    <select class="form-select" id="selectProveedor" required>
                                        <option value="">Seleccionar proveedor...</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Precio Unitario *</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" id="precioUnitario" 
                                               step="0.01" min="0" required>
                                    </div>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label">Tiempo de entrega</label>
                                    <input type="text" class="form-control" id="tiempoEntrega" 
                                           placeholder="Ej: 3 días">
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-12">
                                    <label class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="observacionesCotizacion" rows="2"
                                              placeholder="Comentarios adicionales sobre la cotización..."></textarea>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-12 text-end">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                        <i class="bi bi-x-circle"></i> Cancelar
                                    </button>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-check-circle"></i> Guardar Cotización
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Script para inicializar el componente -->
<script>
    // Cargar el script del componente
    const script = document.createElement('script');
    script.src = '/sgigescon/src/Cotizacion/Interfaces/Views/cotizacionesView.js';
    document.head.appendChild(script);
</script>

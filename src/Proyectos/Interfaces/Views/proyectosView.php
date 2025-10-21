<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
    <div class="card shadow border-0">
        <div class="card-header bg-info text-white">
            <h3 class="text-center mb-0">Gestión de Proyectos</h3>
        </div>

        <div class="card-body bg-light">
            <!-- Botón crear proyecto -->
            <div class="row mb-3">
                <div class="col-2 offset-10">
                    <button 
                        type="button" 
                        class="btn btn-info text-white w-100" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modalProyectos" 
                        onclick="cargarModalCrear()">
                        <i class="bi bi-plus-circle"></i> Crear Proyecto
                    </button>
                </div>
            </div>

            <!-- Tabla de proyectos -->
            <div class="table-responsive">
                <table id="datos_proyectos" class="table table-bordered table-striped align-middle mb-0">
                    <thead class="table-info text-center">
                        <tr>
                            <th>Nombre</th>
                            <th>Objeto</th>
                            <th>N° Contrato</th>
                            <th>Valor</th>
                            <th>Cliente</th>
                            <th>Fecha Inicio</th>
                            <th>Fecha Fin</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Modal -->
<div class="modal fade" id="modalProyectos" tabindex="-1" aria-labelledby="modalProyectosLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow">
            <div class="modal-header bg-info text-white">
                <h5 class="modal-title" id="modalProyectosLabel">Crear Proyecto</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body bg-light">
                <form id="formProyectos">
                    <input type="hidden" name="accion" id="accion" value="crear">
                    <input type="hidden" name="id_proyecto" id="id_proyecto">

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="nombre" class="form-label fw-bold">Nombre del Proyecto:</label>
                            <input type="text" name="nombre" id="nombre" class="form-control" required placeholder="Nombre del proyecto">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="numero_contrato" class="form-label fw-bold">Número de Contrato:</label>
                            <input type="text" name="numero_contrato" id="numero_contrato" class="form-control" placeholder="Número de contrato">
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="objeto" class="form-label fw-bold">Objeto del Proyecto:</label>
                        <textarea name="objeto" id="objeto" class="form-control" rows="2" placeholder="Descripción del objeto del proyecto"></textarea>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="valor" class="form-label fw-bold">Valor del Proyecto:</label>
                            <input type="number" name="valor" id="valor" class="form-control" step="0.01" min="0" placeholder="0.00">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="id_cliente" class="form-label fw-bold">Cliente:</label>
                            <select name="id_cliente" id="id_cliente" class="form-select" required>
                                <option value="">Seleccione un cliente</option>
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="fecha_inicio" class="form-label fw-bold">Fecha Inicio:</label>
                            <input type="date" name="fecha_inicio" id="fecha_inicio" class="form-control" required>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="fecha_fin" class="form-label fw-bold">Fecha Fin:</label>
                            <input type="date" name="fecha_fin" id="fecha_fin" class="form-control">
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="observaciones" class="form-label fw-bold">Observaciones:</label>
                        <textarea name="observaciones" id="observaciones" class="form-control" rows="3" placeholder="Observaciones adicionales"></textarea>
                    </div>
                </form>
            </div>

            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-info text-white" id="btnGuardar" onclick="guardarProyecto()">Guardar</button>
                <button type="button" class="btn btn-primary" id="btnActualizar" onclick="guardarProyectoEditar()" style="display: none;">Actualizar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
    const API_PRESUPUESTOS = '/workspace/constructora-app/src/Presupuesto/Interfaces/PresupuestoController.php';
    console.log('Ruta API:', API_PRESUPUESTOS);
</script>
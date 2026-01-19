<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
    <div class="card shadow border-0">
        <div class="card-header bg-primary text-white">
            <h3 class="text-center mb-0">Gestión de Capítulos</h3>
        </div>

        <div class="card-body bg-light">
            <div class="row mb-3">
                <div class="col-2 offset-10">
                    <button 
                        type="button" 
                        class="btn btn-primary text-white w-100" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modalCapitulos" 
                        onclick="cargarModalCrearCapitulo()">
                        <i class="bi bi-plus-circle"></i> Crear Capítulo
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table id="datos_capitulos" class="table table-bordered table-striped align-middle mb-0">
                    <thead class="table-primary text-center">
                        <tr>
                            <th>Nombre</th>
                            <th>Código</th>
                            <th>Presupuesto</th>
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

<div class="modal fade" id="modalCapitulos" tabindex="-1" aria-labelledby="modalCapitulosLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="modalCapitulosLabel">Crear Capítulo</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body bg-light">
                <form id="formCapitulos">
                    <input type="hidden" name="accion" id="accion_capitulo" value="crear">
                    <input type="hidden" name="id_capitulo" id="id_capitulo">

                    <div class="row">
                        <div class="col-md-12 mb-3">
                            <label for="nombre_capitulo" class="form-label fw-bold">Nombre:</label>
                            <input type="text" name="nombre_cap" id="nombre_capitulo" class="form-control" required placeholder="Nombre del capítulo">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="proyecto_capitulo" class="form-label fw-bold">Proyecto:</label>
                            <select name="id_proyecto" id="proyecto_capitulo" class="form-select" onchange="cargarPresupuestosPorProyecto()">
                                <option value="">Seleccionar proyecto primero</option>
                            </select>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="presupuesto_capitulo" class="form-label fw-bold">Presupuesto:</label>
                            <select name="id_presupuesto" id="presupuesto_capitulo" class="form-select" disabled>
                                <option value="">Selecciona un proyecto primero</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>

            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnGuardarCapitulo" onclick="guardarCapitulo()">Guardar</button>
                <button type="button" class="btn btn-warning" id="btnActualizarCapitulo" onclick="guardarCapituloEditar()" style="display: none;">Actualizar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
    const API_CAPITULOS = '/sgigescomnew/src/Capitulos/Interfaces/CapituloController.php';
</script>

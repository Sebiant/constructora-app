<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
    <div class="card shadow border-0">
        <div class="card-header bg-info text-white">
            <h3 class="text-center mb-0">Gestión de Provedores</h3>
        </div>

        <div class="card-body bg-light">
            <div class="row mb-3">
                <div class="col-2 offset-10">
                    <button 
                        type="button" 
                        class="btn btn-info text-white w-100" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modalProvedores" 
                        onclick="cargarModalCrearProvedor()">
                        <i class="bi bi-plus-circle"></i> Crear Provedor
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table id="datos_provedores" class="table table-bordered table-striped align-middle mb-0">
                    <thead class="table-info text-center">
                        <tr>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>WhatsApp</th>
                            <th>Contacto</th>
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

<div class="modal fade" id="modalProvedores" tabindex="-1" aria-labelledby="modalProvedoresLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow">
            <div class="modal-header bg-info text-white">
                <h5 class="modal-title" id="modalProvedoresLabel">Crear Provedor</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body bg-light">
                <form id="formProvedores">
                    <input type="hidden" name="accion" id="accion_provedor" value="crear">
                    <input type="hidden" name="id_provedor" id="id_provedor">

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="nombre_provedor" class="form-label fw-bold">Nombre:</label>
                            <input type="text" name="nombre" id="nombre_provedor" class="form-control" required placeholder="Nombre del provedor">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="telefono_provedor" class="form-label fw-bold">Teléfono:</label>
                            <input type="text" name="telefono" id="telefono_provedor" class="form-control" placeholder="Teléfono">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="email_provedor" class="form-label fw-bold">Email:</label>
                            <input type="email" name="email" id="email_provedor" class="form-control" placeholder="Email">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="whatsapp_provedor" class="form-label fw-bold">WhatsApp:</label>
                            <input type="text" name="whatsapp" id="whatsapp_provedor" class="form-control" placeholder="WhatsApp">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="contacto_provedor" class="form-label fw-bold">Contacto:</label>
                            <input type="text" name="contacto" id="contacto_provedor" class="form-control" placeholder="Nombre de contacto">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="estado_provedor" class="form-label fw-bold">Estado:</label>
                            <select name="estado" id="estado_provedor" class="form-select">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="direccion_provedor" class="form-label fw-bold">Dirección:</label>
                        <input type="text" name="direccion" id="direccion_provedor" class="form-control" placeholder="Dirección">
                    </div>
                </form>
            </div>

            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-info text-white" id="btnGuardarProvedor" onclick="guardarProvedor()">Guardar</button>
                <button type="button" class="btn btn-primary" id="btnActualizarProvedor" onclick="guardarProvedorEditar()" style="display: none;">Actualizar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
    const API_PROVEDORES = '/sgigescomnew/src/Provedores/Interfaces/ProvedorController.php';
</script>

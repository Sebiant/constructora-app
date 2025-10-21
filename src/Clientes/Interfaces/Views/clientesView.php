<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
    <div class="card shadow border-0">
        <!-- Header turquesa como el del Registro de Capítulos -->
        <div class="card-header bg-info text-white rounded-top">
            <h3 class="text-center mb-0">Gestión de Clientes</h3>
        </div>
        <div class="card-body bg-light">
            <!-- Botón crear cliente -->
            <div class="row mb-3">
                <div class="col-2 offset-10">
                    <button 
                        type="button" 
                        class="btn btn-info text-white w-100" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modalClientes" 
                        onclick="cargarModalCrear()">
                        <i class="bi bi-plus-circle"></i> Crear Cliente
                    </button>
                </div>
            </div>

            <!-- Tabla de clientes -->
            <div class="table-responsive">
                <table id="datos_clientes" class="table table-bordered table-striped align-middle mb-0">
                    <thead class="table-info text-center">
                        <tr>
                            <th>NIT</th>
                            <th>Nombre</th>
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
<div class="modal fade" id="modalClientes" tabindex="-1" aria-labelledby="modalClientesLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <div class="modal-header bg-info text-white">
                <h5 class="modal-title" id="modalClientesLabel">Crear Cliente</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body bg-light">
                <form id="formClientes">
                    <input type="hidden" name="accion" id="accion" value="crear">
                    <input type="hidden" name="id_cliente" id="id_cliente">

                    <div class="mb-3">
                        <label for="nit" class="form-label fw-bold">NIT:</label>
                        <input type="text" name="nit" id="nit" class="form-control" required placeholder="Número de identificación tributaria">
                    </div>

                    <div class="mb-3">
                        <label for="nombre" class="form-label fw-bold">Nombre:</label>
                        <input type="text" name="nombre" id="nombre" class="form-control" required placeholder="Nombre completo del cliente">
                    </div>
                </form>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-info text-white" id="btnGuardar" onclick="guardarCliente()">Guardar</button>
                <button type="button" class="btn btn-primary" id="btnActualizar" onclick="guardarClienteEditar()" style="display: none;">Actualizar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
    const API_CLIENTES = '/workspace/constructora-app/src/Clientes/Interfaces/ClienteController.php';
</script>

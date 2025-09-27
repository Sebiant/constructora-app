<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container">
    <h1 class="text-center">Gestión de Clientes</h1>

    <div class="row">
        <div class="col-2 offset-10">
            <div class="text-center">
                <button type="button" class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#modalClientes" onclick="cargarModalCrear()">
                    <i class="bi bi-plus-circle"></i> Crear Cliente
                </button>
            </div>
        </div>
    </div>
    <br />
    <br />

    <div class="card">
        <div class="card-header">
            <h5>Lista de Clientes</h5>
        </div>
        <div class="table-responsive card-body">
            <table id="datos_clientes" class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>NIT</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($clientes)): ?>
                        <?php foreach ($clientes as $cliente): ?>
                            <tr>
                                <td><?= htmlspecialchars($cliente->getNit()) ?></td>
                                <td><?= htmlspecialchars($cliente->getNombre()) ?></td>
                                <td><?= htmlspecialchars($cliente->getTelefono() ?? '') ?></td>
                                <td>
                                    <span class="badge bg-<?= ($cliente->getEstado() === 'Activo') ? 'success' : 'secondary' ?>">
                                        <?= htmlspecialchars($cliente->getEstado()) ?>
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-warning btn-sm" onclick="cargarModalEditar(<?= $cliente->getId() ?>)">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="eliminarCliente(<?= $cliente->getId() ?>)">
                                        <i class="bi bi-trash"></i> Eliminar
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="5" class="text-center">No hay clientes registrados</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal -->
<div class="modal fade" id="modalClientes" tabindex="-1" aria-labelledby="modalClientesLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalClientesLabel">Crear Cliente</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="formClientes">
                    <input type="hidden" name="accion" id="accion" value="crear">
                    <input type="hidden" name="id_cliente" id="id_cliente">

                    <div class="mb-3">
                        <label for="nit" class="form-label">NIT:</label>
                        <input type="text" name="nit" id="nit" class="form-control" required 
                               placeholder="Número de identificación tributaria">
                    </div>

                    <div class="mb-3">
                        <label for="nombre" class="form-label">Nombre:</label>
                        <input type="text" name="nombre" id="nombre" class="form-control" required 
                               placeholder="Nombre completo del cliente">
                    </div>

                    <div class="mb-3">
                        <label for="telefono" class="form-label">Teléfono:</label>
                        <input type="text" name="telefono" id="telefono" class="form-control" 
                               placeholder="Número de contacto">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-success" onclick="guardarCliente()">Guardar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
$(document).ready(function() {
    var table = $('#datos_clientes').DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json"
        },
        searching: true,
        paging: true,
        lengthChange: true,
        pageLength: 10,
        processing: true,
        serverSide: false,
        ajax: {
            url: "/workspace/constructora-app/src/Clientes/Interfaces/ClienteController.php",
            type: "GET",
            data: { action: "getAll" },
            dataSrc: ""
        },
        columns: [
            { "data": "nit" },
            { "data": "nombre" },
            {
                "data": "estado",
                render: function(data, type, row) {
                    let badgeClass = data === true ? "bg-success" : "bg-secondary";
                    let estadoTexto = data === true ? "Activo" : "Inactivo";
                    return `<span class="badge ${badgeClass}">${estadoTexto}</span>`;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-warning btn-sm btn-editar" data-id="${row.id_cliente}">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm btn-eliminar" data-id="${row.id_cliente}">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    `;
                },
                orderable: false
            }
        ]
    });
});
</script>
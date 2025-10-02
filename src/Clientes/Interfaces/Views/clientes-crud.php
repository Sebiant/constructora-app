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
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <!-- Botón para CREAR -->
                <button type="button" class="btn btn-success" id="btnGuardar" onclick="guardarCliente()">Guardar</button>
                <!-- Botón para EDITAR -->
                <button type="button" class="btn btn-primary" id="btnActualizar" onclick="guardarClienteEditar()" style="display: none;">Actualizar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
const API_CLIENTES = "../ClienteController.php";

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
            url: API_CLIENTES,
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
                    let estado = data === true ? "Activo" : "Inactivo";
                    let badgeClass = data === true ? "bg-success" : "bg-secondary";
                    return `<span class="badge ${badgeClass}">${estado}</span>`;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-warning btn-sm btn-editar" data-id="${row.id}">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm btn-eliminar" data-id="${row.id}">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    `;
                },
                orderable: false
            }
        ]
    });

    $('#datos_clientes').on('click', '.btn-editar', function () {
        var id = $(this).data('id');
        console.log("Botón editar clickeado - ID:", id);
        if (id && id !== "undefined") {
            cargarModalEditar(id);
        } else {
            alert("Error: ID no válido");
        }
    });

    $('#datos_clientes').on('click', '.btn-eliminar', function () {
        var id = $(this).data('id');
        console.log("Botón eliminar clickeado - ID:", id);
        if (id && id !== "undefined") {
            eliminarCliente(id);
        } else {
            alert("Error: ID no válido");
        }
    });
});

function cargarModalCrear() {
    $("#formClientes")[0].reset();
    $("#id_cliente").val("");
    $("#accion").val("crear");

    $("#modalClientesLabel").text("Crear Cliente");
    $("#btnGuardar").show();
    $("#btnActualizar").hide();

    $("#modalClientes").modal("show");
}

// Crear cliente
function guardarCliente() {
    let nit = $("#nit").val();
    let nombre = $("#nombre").val();

    if (!nit || !nombre) {
        alert("Por favor, complete todos los campos");
        return;
    }

    $.ajax({
        url: API_CLIENTES + "?action=create",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({
            nit: nit,
            nombre: nombre
        }),
        success: function (res) {
            if (res.success) {
                alert("Cliente creado");
                $("#modalClientes").modal("hide");
                $('#datos_clientes').DataTable().ajax.reload();
            } else {
                alert("Error: " + (res.error || "No se pudo crear"));
            }
        },
        error: function (xhr) {
            alert("Error en la petición: " + xhr.responseText);
        }
    });
}

// Abrir modal en modo EDITAR
function cargarModalEditar(id) {
    console.log("Cargando cliente ID:", id);
    
    $.ajax({
        url: API_CLIENTES + "?action=getById&id=" + id,
        method: "GET",
        dataType: "json",
        success: function (res) {
            console.log("Respuesta del servidor:", res);
            
            if (res.success && res.data) {
                let cliente = res.data;

                $("#id_cliente").val(cliente.id);
                $("#nit").val(cliente.nit);
                $("#nombre").val(cliente.nombre);

                $("#accion").val("editar");
                $("#modalClientesLabel").text("Editar Cliente");

                $("#btnGuardar").hide();
                $("#btnActualizar").show();

                $("#modalClientes").modal("show");
            } else {
                alert("Cliente no encontrado: " + (res.error || ""));
            }
        },
        error: function (xhr) {
            console.error("Error AJAX:", xhr);
            alert("Error al cargar cliente: " + xhr.responseText);
        }
    });
}

// Actualizar cliente
function guardarClienteEditar() {
    let payload = {
        id: $("#id_cliente").val(),
        nit: $("#nit").val(),
        nombre: $("#nombre").val()
    };

    $.ajax({
        url: API_CLIENTES + "?action=update",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (res) {
            if (res.success) {
                alert("Cliente actualizado");
                $("#modalClientes").modal("hide");
                $('#datos_clientes').DataTable().ajax.reload();
            } else {
                alert("Error: " + (res.error || "No se pudo actualizar"));
            }
        },
        error: function (xhr) {
            alert("Error en la petición: " + xhr.responseText);
        }
    });
}

// Eliminar cliente
function eliminarCliente(id) {
    if (!confirm("¿Está seguro de eliminar este cliente?")) {
        return;
    }

    $.ajax({
        url: API_CLIENTES + "?action=delete",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({
            id: parseInt(id)
        }),
        success: function (res) {
            if (res.success) {
                alert("Cliente eliminado");
                $('#datos_clientes').DataTable().ajax.reload();
            } else {
                alert("Error: " + (res.error || "No se pudo eliminar"));
            }
        },
        error: function (xhr) {
            alert("Error en la petición: " + xhr.responseText);
        }
    });
}
</script>
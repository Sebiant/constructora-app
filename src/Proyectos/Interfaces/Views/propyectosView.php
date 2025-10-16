<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container">
    <h1 class="text-center">Gestión de Proyectos</h1>

    <div class="row">
        <div class="col-2 offset-10">
            <div class="text-center">
                <button type="button" class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#modalProyectos" onclick="cargarModalCrear()">
                    <i class="bi bi-plus-circle"></i> Crear Proyecto
                </button>
            </div>
        </div>
    </div>
    <br /><br />

    <div class="card">
        <div class="card-header">
            <h5>Lista de Proyectos</h5>
        </div>
        <div class="table-responsive card-body">
            <table id="datos_proyectos" class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>Nombre</th>
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

<!-- Modal -->
<div class="modal fade" id="modalProyectos" tabindex="-1" aria-labelledby="modalProyectosLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalProyectosLabel">Crear Proyecto</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="formProyectos">
                    <input type="hidden" name="accion" id="accion" value="crear">
                    <input type="hidden" name="id_proyecto" id="id_proyecto">

                    <div class="mb-3">
                        <label for="nombre" class="form-label">Nombre:</label>
                        <input type="text" name="nombre" id="nombre" class="form-control" required placeholder="Nombre del proyecto">
                    </div>

                    <div class="mb-3">
                        <label for="id_cliente" class="form-label">Cliente:</label>
                        <select name="id_cliente" id="id_cliente" class="form-select" required>
                            <option value="">Seleccione un cliente</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="fecha_inicio" class="form-label">Fecha Inicio:</label>
                        <input type="date" name="fecha_inicio" id="fecha_inicio" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label for="fecha_fin" class="form-label">Fecha Fin:</label>
                        <input type="date" name="fecha_fin" id="fecha_fin" class="form-control">
                    </div>

                    <div class="mb-3">
                        <label for="observaciones" class="form-label">Observaciones:</label>
                        <textarea name="observaciones" id="observaciones" class="form-control" rows="3"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-success" id="btnGuardar" onclick="guardarProyecto()">Guardar</button>
                <button type="button" class="btn btn-primary" id="btnActualizar" onclick="guardarProyectoEditar()" style="display: none;">Actualizar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
const API_PROYECTOS = "../ProyectoController.php";

function cargarClientes() {
    const selectCliente = document.getElementById('id_cliente');
    
    selectCliente.innerHTML = '<option value="">Cargando clientes...</option>';

    $.ajax({
        url: API_PROYECTOS + "?action=getClientes",
        method: "GET",
        dataType: "json",
        success: function(data) {
            if (data.success && data.clientes && data.clientes.length > 0) {
                selectCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
                data.clientes.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente.id_cliente;
                    option.textContent = cliente.nombre;
                    selectCliente.appendChild(option);
                });
            } else {
                selectCliente.innerHTML = '<option value="">No hay clientes disponibles</option>';
                console.error('No se pudieron cargar los clientes:', data.message);
            }
        },
        error: function(xhr, status, error) {
            selectCliente.innerHTML = '<option value="">Error al cargar clientes</option>';
            console.error('Error:', error);
        }
    });
}

$(document).ready(function() {
    var table = $('#datos_proyectos').DataTable({
        language: { url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json" },
        searching: true,
        paging: true,
        lengthChange: true,
        pageLength: 10,
        processing: true,
        serverSide: false,
        order: [],
        ajax: {
            url: API_PROYECTOS + "?action=getAll",
            type: "GET",
            dataSrc: ""
        },
        columns: [
            { "data": "nombre" },
            { "data": "nombre_cliente" },
            { "data": "fecha_inicio" },
            { "data": "fecha_fin" },
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
                        <button class="btn btn-warning btn-sm btn-editar" data-id="${row.id_proyecto}">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm btn-eliminar" data-id="${row.id_proyecto}">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    `;
                },
                orderable: false
            }
        ]
    });

    $('#datos_proyectos').on('click', '.btn-editar', function () {
        let id = $(this).data('id');
        if (id) cargarModalEditar(id);
    });

    $('#datos_proyectos').on('click', '.btn-eliminar', function () {
        let id = $(this).data('id');
        if (id) eliminarProyecto(id);
    });

    $('#modalProyectos').on('show.bs.modal', function () {
        cargarClientes();
    });
});

function cargarModalCrear() {
    $("#formProyectos")[0].reset();
    $("#id_proyecto").val("");
    $("#accion").val("crear");

    $("#modalProyectosLabel").text("Crear Proyecto");
    $("#btnGuardar").show();
    $("#btnActualizar").hide();
}

function guardarProyecto() {
    // Obtener valores directamente
    let nombre = $("#nombre").val();
    let id_cliente = $("#id_cliente").val();
    let fecha_inicio = $("#fecha_inicio").val();
    let fecha_fin = $("#fecha_fin").val();
    let estado = $("#estado").val();
    let observaciones = $("#observaciones").val();

    console.log("Valores del formulario:");
    console.log("Nombre:", nombre);
    console.log("ID Cliente:", id_cliente);
    console.log("Fecha Inicio:", fecha_inicio);
    console.log("Fecha Fin:", fecha_fin);
    console.log("Observaciones:", observaciones);

    // Validar campos requeridos
    if (!nombre || !id_cliente || !fecha_inicio) {
        alert("Por favor complete todos los campos requeridos: Nombre, Cliente y Fecha Inicio");
        return;
    }

    // Usar FormData que es más confiable
    let formData = new FormData();
    formData.append('action', 'create'); // ¡AGREGAR ACTION AQUÍ!
    formData.append('nombre', nombre);
    formData.append('id_cliente', id_cliente);
    formData.append('fecha_inicio', fecha_inicio);
    formData.append('fecha_fin', fecha_fin);
    formData.append('estado', estado);
    formData.append('observaciones', observaciones);

    console.log("Enviando FormData con action incluido");

    $.ajax({
        url: API_PROYECTOS, // SIN action en la URL
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,
        dataType: "json",
        success: function (res) {
            console.log("Respuesta del servidor:", res);
            
            if (res.success) {
                alert("Proyecto creado exitosamente");
                $("#modalProyectos").modal("hide");
                $('#datos_proyectos').DataTable().ajax.reload();
            } else {
                alert("Error: " + (res.error || res.message || "No se pudo crear el proyecto"));
            }
        },
        error: function (xhr, status, error) {
            console.error("Error en la peticion:");
            console.error("Status:", status);
            console.error("Error:", error);
            console.error("Respuesta:", xhr.responseText);
            
            alert("Error en la peticion: " + error);
        }
    });
}

function cargarModalEditar(id) {
    $.ajax({
        url: API_PROYECTOS + "?action=getById&id=" + id,
        method: "GET",
        dataType: "json",
        success: function (res) {
            if (res.success && res.data) {
                let p = res.data;
                $("#id_proyecto").val(p.id_proyecto);
                $("#nombre").val(p.nombre);
                $("#fecha_inicio").val(p.fecha_inicio);
                $("#fecha_fin").val(p.fecha_fin);
                $("#estado").val(p.estado);
                $("#observaciones").val(p.observaciones);

                $("#accion").val("editar");
                $("#modalProyectosLabel").text("Editar Proyecto");

                $("#btnGuardar").hide();
                $("#btnActualizar").show();

                setTimeout(() => {
                    $("#id_cliente").val(p.id_cliente);
                }, 300);

                $("#modalProyectos").modal("show");
            } else {
                alert("Proyecto no encontrado");
            }
        },
        error: function (xhr) {
            alert("Error al cargar proyecto: " + xhr.responseText);
        }
    });
}

function guardarProyecto() {
    let payload = {
        nombre: $("#nombre").val(),
        id_cliente: $("#id_cliente").val(),
        fecha_inicio: $("#fecha_inicio").val(),
        fecha_fin: $("#fecha_fin").val(),
        estado: $("#estado").val(),
        observaciones: $("#observaciones").val()
    };

    console.log("Datos que se envian al servidor:", payload);

    // Validar campos requeridos
    if (!payload.nombre || !payload.id_cliente || !payload.fecha_inicio) {
        alert("Por favor complete todos los campos requeridos: Nombre, Cliente y Fecha Inicio");
        return;
    }

    $.ajax({
        url: API_PROYECTOS + "?action=create",
        method: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json",
        dataType: "json",
        success: function (res) {
            console.log("Respuesta del servidor:", res);
            
            if (res.success) {
                alert("Proyecto creado exitosamente");
                $("#modalProyectos").modal("hide");
                $('#datos_proyectos').DataTable().ajax.reload();
            } else {
                alert("Error: " + (res.error || "No se pudo crear"));
            }
        },
        error: function (xhr, status, error) {
            console.error("Error en la peticion:");
            console.error("Status:", status);
            console.error("Error:", error);
            console.error("Respuesta:", xhr.responseText);
            
            alert("Error en la peticion: " + error);
        }
    });
}

function eliminarProyecto(id) {
    if (!confirm("¿Está seguro de eliminar este proyecto?")) return;

    $.ajax({
        url: API_PROYECTOS + "?action=delete",
        method: "POST",
        data: { id: id },
        dataType: "json",
        success: function (res) {
            if (res.success) {
                alert("Proyecto eliminado");
                $('#datos_proyectos').DataTable().ajax.reload();
            } else {
                alert("Error: " + (res.error || "No se pudo eliminar"));
            }
        },
        error: function (xhr) {
            alert("Error en la peticion: " + xhr.responseText);
        }
    });
}
</script>
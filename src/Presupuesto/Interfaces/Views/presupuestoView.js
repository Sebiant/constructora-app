const API_PRESUPUESTOS_CRUD = '/sgigescon/src/Presupuesto/Interfaces/PresupuestoController.php';
let dataTablePresupuestos = null;

function initPresupuestoCRUD() {
    console.log("[PresupuestoCRUD] Inicializando con estilos de Proyectos...");
    const proyectoId = sessionStorage.getItem('selectedProjectId');

    if (proyectoId) {
        cargarPresupuestosCRUD(proyectoId);
    } else {
        console.warn("[PresupuestoCRUD] No hay un proyecto seleccionado.");
    }
}

function cargarPresupuestosCRUD(proyectoId) {
    if (dataTablePresupuestos) {
        dataTablePresupuestos.destroy();
    }

    dataTablePresupuestos = $("#tablaPresupuestosCRUD").DataTable({
        language: { url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
        ajax: {
            url: API_PRESUPUESTOS_CRUD + "?action=getPresupuestosByProyecto",
            type: "POST",
            data: { proyecto_id: proyectoId },
            dataSrc: "data"
        },
        columns: [
            {
                data: "codigo",
                render: (data) => `<strong>${data}</strong>`
            },
            { data: "nombre" },
            {
                data: "fecha_creacion",
                className: "text-center",
                render: (data) => new Date(data).toLocaleDateString()
            },
            {
                data: "monto_total",
                className: "text-end",
                render: (data) => "$ " + parseFloat(data || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })
            },
            {
                data: null,
                className: "text-center",
                render: () => `<span class="badge bg-success">Activo</span>`
            },
            {
                data: null,
                className: "text-center",
                render: function (data, type, row) {
                    const rowData = JSON.stringify(row).replace(/'/g, "&apos;");
                    return `
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-primary btn-sm" onclick='abrirModalEditarCRUD(${rowData})' title="Editar presupuesto">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="eliminarPresupuestoCRUD(${row.id_presupuesto})" title="Eliminar presupuesto">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        responsive: true,
        order: [[2, "desc"]],
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50]
    });
}

function mostrarModalPresupuestoCRUD() {
    const modal = $("#modalPresupuestoCRUD");
    $("#formPresupuestoCRUD")[0].reset();
    $("#id_presupuesto_crud").val("");

    modal.find(".modal-title").html('<i class="bi bi-plus-circle me-2"></i>Crear Nuevo Presupuesto');
    modal.find("#btnGuardarPresupuestoCRUD").text("Guardar").removeClass("btn-primary").addClass("btn-info");

    const hoy = new Date().toISOString().split('T')[0];
    $("#fecha_creacion_crud").val(hoy);

    modal.modal("show");
}

function abrirModalEditarCRUD(p) {
    const modal = $("#modalPresupuestoCRUD");
    $("#id_presupuesto_crud").val(p.id_presupuesto);
    $("#codigo_presupuesto_crud").val(p.codigo);
    $("#nombre_presupuesto_crud").val(p.nombre);
    $("#fecha_creacion_crud").val(p.fecha_creacion);
    $("#monto_total_crud").val(p.monto_total);
    $("#observaciones_crud").val(p.observaciones);

    modal.find(".modal-title").html('<i class="bi bi-pencil-square me-2"></i>Editar Presupuesto');
    modal.find("#btnGuardarPresupuestoCRUD").text("Actualizar").removeClass("btn-info").addClass("btn-primary");

    modal.modal("show");
}

function guardarPresupuestoCRUD() {
    const id = $("#id_presupuesto_crud").val();
    const action = id ? "update" : "create";
    const proyectoId = sessionStorage.getItem('selectedProjectId');

    const datos = {
        id_presupuesto: id,
        id_proyecto: proyectoId,
        codigo: $("#codigo_presupuesto_crud").val(),
        nombre: $("#nombre_presupuesto_crud").val(),
        fecha_creacion: $("#fecha_creacion_crud").val(),
        monto_total: $("#monto_total_crud").val(),
        observaciones: $("#observaciones_crud").val()
    };

    if (!datos.codigo || !datos.nombre || !datos.fecha_creacion) {
        Swal.fire('Campos requeridos', 'Por favor complete los campos obligatorios (*)', 'warning');
        return;
    }

    $.ajax({
        url: API_PRESUPUESTOS_CRUD + "?action=" + action,
        method: "POST",
        data: JSON.stringify(datos),
        contentType: "application/json",
        success: function (res) {
            if (res.success) {
                // Cerramos el modal
                $("#modalPresupuestoCRUD").modal("hide");
                
                // Forzamos la limpieza del backdrop
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                
                Swal.fire({
                    title: 'Éxito',
                    text: id ? 'Presupuesto actualizado' : 'Presupuesto creado',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    location.reload();
                });
            } else {
                Swal.fire('Error', res.error || 'Ocurrió un error', 'error');
            }
        },
        error: function (xhr) {
            Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        }
    });
}

function eliminarPresupuestoCRUD(id) {
    Swal.fire({
        title: '¿Está seguro?',
        text: "El presupuesto se ocultará de la lista.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: API_PRESUPUESTOS_CRUD + "?action=delete",
                method: "POST",
                data: { id_presupuesto: id },
                success: function (res) {
                    if (res.success) {
                        Swal.fire('Eliminado', 'El presupuesto ha sido eliminado.', 'success');
                        if (dataTablePresupuestos) dataTablePresupuestos.ajax.reload();
                    } else {
                        Swal.fire('Error', res.error, 'error');
                    }
                }
            });
        }
    });
}

// Exponer globalmente para el layout
window.initPresupuestoCRUD = initPresupuestoCRUD;

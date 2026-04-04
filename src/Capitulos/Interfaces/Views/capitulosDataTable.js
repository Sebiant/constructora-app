$(document).ready(function () {
    // Only initialize locally if not already initialized by the layout
    if (!window.capitulosDataTableInitialized) {
        initCapitulosDataTable();
    }
});

// Avoid multiple initializations
window.initCapitulosDataTable = function () {
    console.log('[Capitulos] Initializing DataTable...');
    
    // Global flag to avoid duplicate calls
    window.capitulosDataTableInitialized = true;

    if ($.fn.DataTable.isDataTable('#datos_capitulos')) {
        $('#datos_capitulos').DataTable().destroy();
    }

    var table = $("#datos_capitulos").DataTable({
        destroy: true,
        language: { url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json" },
        searching: true,
        paging: true,
        lengthChange: true,
        pageLength: 10,
        processing: true,
        serverSide: false,
        order: [],
        ajax: {
            url: API_CAPITULOS + "?action=getAll",
            type: "GET",
            data: function (d) {
                const params = {};

                // Filtro por proyecto (prioritario en modo inspección)
                const idProyecto = typeof ID_PROYECTO_FILTRO !== 'undefined' && ID_PROYECTO_FILTRO ?
                    ID_PROYECTO_FILTRO :
                    (new URLSearchParams(window.location.search)).get('id_proyecto');

                // Filtro por presupuesto
                const idPresupuesto = typeof ID_PRESUPUESTO_FILTRO !== 'undefined' && ID_PRESUPUESTO_FILTRO ?
                    ID_PRESUPUESTO_FILTRO :
                    (new URLSearchParams(window.location.search)).get('id_presupuesto');

                if (idProyecto) {
                    params.id_proyecto = idProyecto;
                    console.log('Filtrando capítulos por proyecto:', idProyecto);
                }

                if (idPresupuesto) {
                    params.id_presupuesto = idPresupuesto;
                    console.log('Filtrando capítulos por presupuesto:', idPresupuesto);
                }

                return params;
            },
            dataSrc: "",
            error: function (xhr, error, thrown) {
                console.error("Error en DataTable:", {
                    status: xhr.status,
                    response: xhr.responseText,
                    error: error,
                    thrown: thrown
                });
            }
        },
        columns: [
            { data: "nombre_cap" },
            {
                data: "codigo",
                render: function (data) {
                    return data || "-";
                },
            },
            {
                data: "presupuesto_proyecto",
                render: function (data) {
                    return data || "Sin asignar";
                },
            },
            {
                data: "estado",
                render: function (data) {
                    const activo = data === 1 || data === "1" || data === true;
                    let estadoTxt = activo ? "Activo" : "Inactivo";
                    let badgeClass = activo ? "bg-success" : "bg-secondary";
                    return `<span class="badge ${badgeClass}">${estadoTxt}</span>`;
                },
            },
            {
                data: null,
                render: function (data, type, row) {
                    const activo = row.estado === 1 || row.estado === "1" || row.estado === true;
                    const btnClass = activo ? "btn-warning" : "btn-success";
                    const icon = activo ? "bi-pause-circle" : "bi-play-circle";
                    const text = activo ? "Des" : "Ac"; // Concise labels
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn ${btnClass} btn-sm btn-toggle-estado" data-id="${row.id_capitulo}" data-estado="${activo ? 1 : 0}" title="${activo ? 'Desactivar' : 'Activar'}">
                                <i class="bi ${icon}"></i>
                            </button>
                            <button class="btn btn-primary btn-sm btn-editar" data-id="${row.id_capitulo}" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    `;
                },
                orderable: false,
            },
        ],
    });

    // Event listeners for action buttons
    $('#datos_capitulos tbody').off('click', '.btn-toggle-estado').on('click', '.btn-toggle-estado', function() {
        const id = $(this).data('id');
        const estadoActual = $(this).data('estado');
        const nuevoEstado = estadoActual === 1 ? 0 : 1;
        toggleEstadoCapitulo(id, nuevoEstado);
    });

    $('#datos_capitulos tbody').off('click', '.btn-editar').on('click', '.btn-editar', function() {
        const id = $(this).data('id');
        cargarModalEditarCapitulo(id);
    });

    // Cargar proyectos y presupuestos para el modal
    cargarProyectos();
};

window.cargarModalCrearCapitulo = function() {
    console.log('[Capitulos] Abrir modal de creación');
    $('#formCapitulos')[0].reset();
    $('#accion_capitulo').val('crear');
    $('#id_capitulo').val('');
    $('#modalCapitulosLabel').text('Crear Capítulo');
    $('#btnGuardarCapitulo').show();
    $('#btnActualizarCapitulo').hide();
    
    // Manejar el modo de inspección de proyecto
    manejarProyectoInterface();
    
    $('#modalCapitulos').modal('show');
};

function manejarProyectoInterface() {
    if (typeof ID_PROYECTO_FILTRO !== 'undefined' && ID_PROYECTO_FILTRO) {
        console.log('[Capitulos] Proyecto detectado:', ID_PROYECTO_FILTRO);
        
        // Ocultar el selector de proyecto ya que se da por hecho
        $('#container_proyecto_capitulo').hide();
        
        // Si hay una sola columna ocupando el ancho, expandir el selector de presupuesto
        $('#container_presupuesto_capitulo').removeClass('col-md-6').addClass('col-md-12');

        // Seleccionar el proyecto y cargar sus presupuestos
        $('#proyecto_capitulo').val(ID_PROYECTO_FILTRO).trigger('change');
    } else {
        $('#container_proyecto_capitulo').show();
        $('#container_presupuesto_capitulo').removeClass('col-md-12').addClass('col-md-6');
    }
}

window.cargarProyectos = function() {
    $.ajax({
        url: API_CAPITULOS + '?action=getProyectos',
        type: 'GET',
        success: function(response) {
            let options = '<option value="">Seleccionar proyecto primero</option>';
            if (Array.isArray(response)) {
                response.forEach(p => {
                    options += `<option value="${p.id_proyecto}">${p.nombre}</option>`;
                });
            }
            $('#proyecto_capitulo').html(options);
            
            // Si hay un proyecto filtrado, aplicarlo después de cargar las opciones
            if (typeof ID_PROYECTO_FILTRO !== 'undefined' && ID_PROYECTO_FILTRO) {
                $('#proyecto_capitulo').val(ID_PROYECTO_FILTRO).trigger('change');
            }
        }
    });
};

window.cargarPresupuestosPorProyecto = function() {
    const idProyecto = $('#proyecto_capitulo').val();
    if (!idProyecto) {
        $('#presupuesto_capitulo').html('<option value="">Selecciona un proyecto primero</option>').prop('disabled', true);
        return;
    }

    $.ajax({
        url: API_CAPITULOS + '?action=getPresupuestosPorProyecto&id_proyecto=' + idProyecto,
        type: 'GET',
        success: function(response) {
            let options = '<option value="">Seleccionar presupuesto</option>';
            if (Array.isArray(response)) {
                response.forEach(p => {
                    options += `<option value="${p.id_presupuesto}">${p.nombre} (${p.codigo})</option>`;
                });
            }
            $('#presupuesto_capitulo').html(options).prop('disabled', false);
            
            // Si el presupuesto está filtrado y aún no se ha seleccionado, intentar seleccionarlo
            if (typeof ID_PRESUPUESTO_FILTRO !== 'undefined' && ID_PRESUPUESTO_FILTRO && !$('#presupuesto_capitulo').val()) {
                $('#presupuesto_capitulo').val(ID_PRESUPUESTO_FILTRO);
            }
        }
    });
};

window.cargarModalEditarCapitulo = function(id) {
    console.log('[Capitulos] Cargando capítulo:', id);
    $.ajax({
        url: API_CAPITULOS + '?action=getById&id=' + id,
        type: 'GET',
        success: function(capitulo) {
            if (capitulo.error) {
                Swal.fire('Error', capitulo.error, 'error');
                return;
            }
            
            $('#formCapitulos')[0].reset();
            $('#accion_capitulo').val('editar');
            $('#id_capitulo').val(capitulo.id_capitulo);
            $('#nombre_capitulo').val(capitulo.nombre_cap);
            $('#modalCapitulosLabel').text('Editar Capítulo');
            $('#btnGuardarCapitulo').hide();
            $('#btnActualizarCapitulo').show();
            
            // Primero cargar proyectos si por alguna razón no están (o simplemente seleccionar)
            const idProyecto = capitulo.id_proyecto || (typeof ID_PROYECTO_FILTRO !== 'undefined' ? ID_PROYECTO_FILTRO : '');
            
            manejarProyectoInterface();
            
            $('#proyecto_capitulo').val(idProyecto).trigger('change');
            
            // Esperar un momento a que se carguen los presupuestos antes de seleccionar
            setTimeout(() => {
                $('#presupuesto_capitulo').val(capitulo.id_presupuesto);
                $('#modalCapitulos').modal('show');
            }, 300);
        }
    });
};

window.guardarCapitulo = function() {
    enviarFormularioCapitulo();
};

window.guardarCapituloEditar = function() {
    enviarFormularioCapitulo();
};

function enviarFormularioCapitulo() {
    const idCapitulo = $('#id_capitulo').val();
    const accion = $('#accion_capitulo').val();
    const data = {
        id_capitulo: idCapitulo,
        nombre_cap: $('#nombre_capitulo').val(),
        id_presupuesto: $('#presupuesto_capitulo').val()
    };

    if (!data.nombre_cap || !data.id_presupuesto) {
        Swal.fire('Aviso', 'Debes completar el nombre y el presupuesto', 'warning');
        return;
    }

    $.ajax({
        url: API_CAPITULOS + '?action=' + (accion === 'crear' ? 'create' : 'update'),
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function(response) {
            if (response.success) {
                // Cerramos el modal
                $('#modalCapitulos').modal('hide');
                
                // Forzamos la limpieza del backdrop
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                
                Swal.fire({
                    title: 'Completado',
                    text: response.message,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    location.reload();
                });
            } else {
                Swal.fire('Error', response.error || 'No se pudo guardar', 'error');
            }
        }
    });
}

function toggleEstadoCapitulo(id, nuevoEstado) {
    $.ajax({
        url: API_CAPITULOS + '?action=update',
        type: 'POST',
        data: JSON.stringify({
            id_capitulo: id,
            estado: nuevoEstado
        }),
        contentType: 'application/json',
        success: function(response) {
            if (response.success) {
                $("#datos_capitulos").DataTable().ajax.reload();
            } else {
                Swal.fire('Error', response.error || 'Algo salió mal', 'error');
            }
        }
    });
}

// Función para recargar la tabla con filtro de presupuesto
window.recargarCapitulosPorPresupuesto = function(idPresupuesto) {
  const url = idPresupuesto ?
    API_CAPITULOS + "?action=getAll&id_presupuesto=" + idPresupuesto :
    API_CAPITULOS + "?action=getAll";

  $("#datos_capitulos").DataTable().ajax.url(url).load();
}

// Función para limpiar filtro (mostrar todos)
window.mostrarTodosLosCapitulos = function() {
  window.recargarCapitulosPorPresupuesto(null);
}


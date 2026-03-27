function cargarRoles() {
    const selectRol = document.getElementById("codigo_perfil");
    selectRol.innerHTML = '<option value="">Cargando roles...</option>';

    return $.ajax({
        url: API_USUARIOS + "?action=getRoles",
        method: "GET",
        dataType: "json",
        success: function (data) {
            if (data.success && data.roles) {
                selectRol.innerHTML = '<option value="">Seleccione un rol</option>';
                data.roles.forEach((rol) => {
                    const option = document.createElement("option");
                    option.value = rol.id;
                    option.textContent = rol.nombre;
                    selectRol.appendChild(option);
                });
            } else {
                selectRol.innerHTML = '<option value="">No hay roles disponibles</option>';
            }
        },
        error: function () {
            selectRol.innerHTML = '<option value="">Error al cargar roles</option>';
        }
    });
}

function cargarProyectosSelect() {
    const selectProyecto = document.getElementById("id_proyecto");
    selectProyecto.innerHTML = '<option value="">Cargando proyectos...</option>';

    return $.ajax({
        url: API_USUARIOS + "?action=getProyectos",
        method: "GET",
        dataType: "json",
        success: function (data) {
            if (data.success && data.proyectos) {
                selectProyecto.innerHTML = '<option value="">Sin Proyecto (General)</option>';
                data.proyectos.forEach((proy) => {
                    const option = document.createElement("option");
                    option.value = proy.id_proyecto;
                    option.textContent = proy.nombre;
                    selectProyecto.appendChild(option);
                });
            } else {
                selectProyecto.innerHTML = '<option value="">No hay proyectos disponibles</option>';
            }
        },
        error: function () {
            selectProyecto.innerHTML = '<option value="">Error al cargar proyectos</option>';
        }
    });
}

function initUsuariosDataTable() {
    if ($.fn.DataTable.isDataTable('#datos_usuarios')) {
        $('#datos_usuarios').DataTable().destroy();
    }

    $("#datos_usuarios").DataTable({
        language: { url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json" },
        ajax: {
            url: API_USUARIOS + "?action=getAll",
            type: "GET",
            dataSrc: ""
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row) {
                    return (row.u_nombre || '') + ' ' + (row.u_apellido || '');
                }
            },
            { data: "u_login" },
            { 
                data: "codigo_perfil",
                render: function(data) {
                    if (data == 1) return '<span class="badge bg-danger">Administrador</span>';
                    if (data == 2) return '<span class="badge bg-primary">Usuario</span>';
                    return '<span class="badge bg-secondary">Perfil ' + data + '</span>';
                }
            },
            { data: "nombre_proyecto" },
            {
                data: "u_activo",
                render: function (data) {
                    let estado = data == 1 ? "Activo" : "Inactivo";
                    let badgeClass = data == 1 ? "bg-success" : "bg-secondary";
                    return `<span class="badge ${badgeClass}">${estado}</span>`;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-warning btn-sm btn-editar-usuario" data-id="${row.u_id}">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-eliminar-usuario" data-id="${row.u_id}">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    `;
                },
                orderable: false
            }
        ]
    });

    // Eventos
    $("#datos_usuarios").off('click', '.btn-editar-usuario').on("click", ".btn-editar-usuario", function () {
        cargarModalEditarUsuario($(this).data("id"));
    });

    $("#datos_usuarios").off('click', '.btn-eliminar-usuario').on("click", ".btn-eliminar-usuario", function () {
        eliminarUsuario($(this).data("id"));
    });
}

function cargarModalCrearUsuario() {
    $("#formUsuarios")[0].reset();
    $("#u_id").val("");
    $("#modalUsuariosLabel").text("Crear Usuario");
    $("#passwordNote").text("Mínimo 6 caracteres.");
    $("#u_password").attr("required", true);
    
    cargarRoles();
    cargarProyectosSelect();
    
    $("#modalUsuarios").modal("show");
}

function guardarUsuario() {
    const id = $("#u_id").val();
    const action = id ? "update" : "create";
    
    const payload = {
        u_id: id,
        u_nombre: $("#u_nombre").val(),
        u_apellido: $("#u_apellido").val(),
        u_login: $("#u_login").val(),
        u_password: $("#u_password").val(),
        codigo_perfil: $("#codigo_perfil").val(),
        id_proyecto: $("#id_proyecto").val() || null,
        u_activo: $("#u_activo").is(":checked") ? 1 : 0
    };

    if (!payload.u_nombre || !payload.u_login || (!id && !payload.u_password)) {
        alert("Por favor complete los campos obligatorios.");
        return;
    }

    $.ajax({
        url: API_USUARIOS + "?action=" + action,
        method: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: function (res) {
            if (res.success) {
                alert("Usuario guardado correctamente");
                $("#modalUsuarios").modal("hide");
                $("#datos_usuarios").DataTable().ajax.reload();
            } else {
                alert("Error: " + res.error);
            }
        },
        error: function () {
            alert("Error en la comunicación con el servidor");
        }
    });
}

function cargarModalEditarUsuario(id) {
    $.ajax({
        url: API_USUARIOS + "?action=getById&id=" + id,
        method: "GET",
        dataType: "json",
        success: function (res) {
            if (res.u_id) {
                $("#u_id").val(res.u_id);
                $("#u_nombre").val(res.u_nombre);
                $("#u_apellido").val(res.u_apellido);
                $("#u_login").val(res.u_login);
                $("#u_password").val("");
                $("#u_password").removeAttr("required");
                $("#passwordNote").text("Dejar en blanco para no cambiar.");
                $("#u_activo").prop("checked", res.u_activo == 1);
                
                $("#modalUsuariosLabel").text("Editar Usuario");
                
                // Cargar selects y luego establecer valores
                $.when(cargarRoles(), cargarProyectosSelect()).done(function() {
                    setTimeout(() => {
                        $("#codigo_perfil").val(res.codigo_perfil);
                        $("#id_proyecto").val(res.id_proyecto);
                    }, 500);
                });

                $("#modalUsuarios").modal("show");
            }
        }
    });
}

function eliminarUsuario(id) {
    if (confirm("¿Está seguro de eliminar este usuario?")) {
        $.ajax({
            url: API_USUARIOS + "?action=delete&id=" + id,
            method: "GET",
            success: function (res) {
                if (res.success) {
                    $("#datos_usuarios").DataTable().ajax.reload();
                } else {
                    alert("Error: " + res.error);
                }
            }
        });
    }
}

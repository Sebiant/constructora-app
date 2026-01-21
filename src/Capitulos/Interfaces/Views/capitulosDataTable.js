$(document).ready(function () {
  var table = $("#datos_capitulos").DataTable({
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
      dataSrc: "",
      error: function(xhr, error, thrown) {
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
          const text = activo ? "Desactivar" : "Activar";
          return `
            <button class="btn ${btnClass} btn-sm btn-toggle-estado me-1" data-id="${row.id_capitulo}" data-estado="${activo ? 1 : 0}">
              <i class="bi ${icon}"></i> ${text}
            </button>
            <button class="btn btn-primary btn-sm btn-editar" data-id="${row.id_capitulo}">
              <i class="bi bi-pencil"></i> Editar
            </button>
          `;
        },
        orderable: false,
      },
    ],
  });

  // Cargar proyectos y presupuestos para el modal
  cargarProyectos();

  $("#datos_capitulos").on("click", ".btn-editar", function () {
    let id = $(this).data("id");
    if (id) cargarModalEditarCapitulo(id);
  });

  $("#datos_capitulos").on("click", ".btn-toggle-estado", function () {
    let id = $(this).data("id");
    let estadoActual = $(this).data("estado");
    if (id !== undefined && estadoActual !== undefined) toggleEstadoCapitulo(id, estadoActual);
  });

});

function cargarProyectos() {
  return $.ajax({
    url: '/sgigescomnew/src/Capitulos/Interfaces/CapituloController.php?action=getProyectos',
    type: "GET",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta proyectos:", res);
      const select = $("#proyecto_capitulo");
      select.empty().append('<option value="">Seleccionar proyecto primero</option>');
      
      if (res && Array.isArray(res)) {
        res.forEach(function(proyecto) {
          const option = `<option value="${proyecto.id_proyecto}">${proyecto.nombre}</option>`;
          select.append(option);
        });
      }
    },
    error: function (xhr) {
      console.error("Error al cargar proyectos:", xhr.responseText);
    }
  });
}

function cargarPresupuestosPorProyecto() {
  const idProyecto = $("#proyecto_capitulo").val();
  const selectPresupuesto = $("#presupuesto_capitulo");
  
  // Limpiar select de presupuestos
  selectPresupuesto.empty().append('<option value="">Seleccionar presupuesto</option>');
  
  if (!idProyecto) {
    selectPresupuesto.prop('disabled', true);
    return;
  }
  
  $.ajax({
    url: '/sgigescomnew/src/Capitulos/Interfaces/CapituloController.php?action=getPresupuestosPorProyecto&id_proyecto=' + idProyecto,
    type: "GET",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta presupuestos por proyecto:", res);
      console.log("Datos de presupuestos:", JSON.stringify(res, null, 2));
      selectPresupuesto.prop('disabled', false);
      
      if (res && Array.isArray(res)) {
        res.forEach(function(presupuesto) {
          console.log("Presupuesto individual:", presupuesto);
          const nombrePresupuesto = presupuesto.nombre || presupuesto.codigo || `Presupuesto ${presupuesto.id_presupuesto}`;
          const fechaFormateada = presupuesto.fecha_creacion ? new Date(presupuesto.fecha_creacion).toLocaleDateString('es-ES') : 'Sin fecha';
          const option = `<option value="${presupuesto.id_presupuesto}">${nombrePresupuesto} - ${fechaFormateada}</option>`;
          console.log("Option generada:", option);
          selectPresupuesto.append(option);
        });
      }
    },
    error: function (xhr) {
      console.error("Error al cargar presupuestos por proyecto:", xhr.responseText);
      selectPresupuesto.prop('disabled', false);
    }
  });
}

function cargarPresupuestos() {
  $.ajax({
    url: '/sgigescomnew/src/Capitulos/Interfaces/CapituloController.php?action=getPresupuestos',
    type: "GET",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta presupuestos:", res);
      console.log("Datos de presupuestos (todos):", JSON.stringify(res, null, 2));
      const select = $("#presupuesto_capitulo");
      select.empty().append('<option value="">Seleccionar presupuesto (opcional)</option>');
      
      if (res && Array.isArray(res)) {
        res.forEach(function(presupuesto) {
          console.log("Presupuesto individual (todos):", presupuesto);
          const nombrePresupuesto = presupuesto.nombre || presupuesto.codigo || `Presupuesto ${presupuesto.id_presupuesto}`;
          const fechaFormateada = presupuesto.fecha_creacion ? new Date(presupuesto.fecha_creacion).toLocaleDateString('es-ES') : 'Sin fecha';
          const option = `<option value="${presupuesto.id_presupuesto}">${nombrePresupuesto} - ${fechaFormateada}</option>`;
          console.log("Option generada (todos):", option);
          select.append(option);
        });
      }
    },
    error: function (xhr) {
      console.error("Error al cargar presupuestos:", xhr.responseText);
    }
  });
}

function cargarModalCrearCapitulo() {
  $("#formCapitulos")[0].reset();
  $("#id_capitulo").val("");
  $("#accion_capitulo").val("crear");

  $("#modalCapitulosLabel").text("Crear Capítulo");
  $("#btnGuardarCapitulo").show();
  $("#btnActualizarCapitulo").hide();
}

function guardarCapitulo() {
  let payload = {
    nombre_cap: $("#nombre_capitulo").val(),
    id_presupuesto: $("#presupuesto_capitulo").val() || null,
  };

  console.log("Datos a guardar:", payload);

  if (!payload.nombre_cap) {
    alert("Nombre del capítulo requerido");
    return;
  }

  $.ajax({
    url: API_CAPITULOS + "?action=create",
    method: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta crear capítulo:", res);
      if (res.success) {
        alert("Capítulo creado exitosamente");
        $("#modalCapitulos").modal("hide");
        $("#datos_capitulos").DataTable().ajax.reload();
      } else {
        console.error("Error al crear:", res.error);
        alert("Error: " + (res.error || "No se pudo crear"));
      }
    },
    error: function (xhr) {
      console.error("Error en petición crear:", xhr.status, xhr.responseText);
      alert("Error: " + xhr.responseText);
    },
  });
}

function cargarModalEditarCapitulo(id) {
  console.log(`Cargando capítulo para editar: ${id}`);
  
  $.ajax({
    url: API_CAPITULOS + "?action=getById&id=" + id,
    method: "GET",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta get by ID:", res);
      if (res.id_capitulo) {
        $("#id_capitulo").val(res.id_capitulo);
        $("#nombre_capitulo").val(res.nombre_cap);
        
        // Cargar proyectos primero
        cargarProyectos().then(function() {
          // Si hay presupuesto, obtener el proyecto y cargar presupuestos
          if (res.id_presupuesto) {
            // Obtener el proyecto del presupuesto
            $.ajax({
              url: '/sgigescomnew/src/Capitulos/Interfaces/CapituloController.php?action=getProyectoDelPresupuesto&id_presupuesto=' + res.id_presupuesto,
              method: "GET",
              dataType: "json",
              success: function(proyectoRes) {
                if (proyectoRes && proyectoRes.id_proyecto) {
                  $("#proyecto_capitulo").val(proyectoRes.id_proyecto);
                  cargarPresupuestosPorProyecto();
                  // Seleccionar el presupuesto actual después de cargar
                  setTimeout(() => {
                    $("#presupuesto_capitulo").val(res.id_presupuesto);
                  }, 500);
                }
              }
            });
          }
        });
        
        $("#accion_capitulo").val("editar");
        $("#modalCapitulosLabel").text("Editar Capítulo");

        $("#btnGuardarCapitulo").hide();
        $("#btnActualizarCapitulo").show();
        $("#modalCapitulos").modal("show");
      } else {
        console.error("Capítulo no encontrado:", res);
        alert("Capítulo no encontrado");
      }
    },
    error: function (xhr) {
      console.error("Error al cargar capítulo:", xhr.status, xhr.responseText);
      alert("Error al cargar capítulo: " + xhr.responseText);
    },
  });
}

function guardarCapituloEditar() {
  let payload = {
    id_capitulo: parseInt($("#id_capitulo").val()),
    nombre_cap: $("#nombre_capitulo").val(),
    id_presupuesto: $("#presupuesto_capitulo").val() || null,
  };

  console.log("Datos a actualizar:", payload);

  if (!payload.id_capitulo || !payload.nombre_cap) {
    alert("ID y nombre del capítulo requeridos");
    return;
  }

  $.ajax({
    url: API_CAPITULOS + "?action=update",
    method: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta actualizar capítulo:", res);
      if (res.success) {
        alert("Capítulo actualizado exitosamente");
        $("#modalCapitulos").modal("hide");
        $("#datos_capitulos").DataTable().ajax.reload();
      } else {
        console.error("Error al actualizar:", res.error);
        alert("Error: " + (res.error || "No se pudo actualizar"));
      }
    },
    error: function (xhr) {
      console.error("Error en petición actualizar:", xhr.status, xhr.responseText);
      alert("Error: " + xhr.responseText);
    },
  });
}

function toggleEstadoCapitulo(id, estadoActual) {
  const nuevoEstado = estadoActual == 1 ? 0 : 1;
  const accion = nuevoEstado == 1 ? "activar" : "desactivar";
  if (!confirm(`¿Está seguro de ${accion} este capítulo?`)) return;

  console.log(`Enviando petición para ${accion} capítulo ${id} con estado ${nuevoEstado}`);

  $.ajax({
    url: API_CAPITULOS + "?action=update",
    method: "POST",
    data: JSON.stringify({ 
      id_capitulo: id, 
      estado: nuevoEstado 
    }),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta del servidor:", res);
      if (res.success) {
        alert(`Capítulo ${accion}do exitosamente`);
        $("#datos_capitulos").DataTable().ajax.reload();
      } else {
        console.error("Error en respuesta:", res.error);
        alert("Error: " + (res.error || `No se pudo ${accion}`));
      }
    },
    error: function (xhr) {
      console.error("Error en la petición:", xhr.status, xhr.responseText);
      alert("Error en la petición: " + xhr.responseText);
    },
  });
}

function eliminarCapitulo(id) {
  if (!confirm("¿Está seguro de eliminar este capítulo?")) return;

  $.ajax({
    url: API_CAPITULOS + "?action=delete",
    method: "POST",
    data: JSON.stringify({ id: id }),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      if (res.success) {
        alert("Capítulo eliminado");
        $("#datos_capitulos").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo eliminar"));
      }
    },
    error: function (xhr) {
      alert("Error en la petición: " + xhr.responseText);
    },
  });
}

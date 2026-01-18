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

  // Cargar presupuestos para el select del modal
  cargarPresupuestos();

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

function cargarPresupuestos() {
  $.ajax({
    url: '/sgigescomnew/src/Capitulos/Interfaces/CapituloController.php?action=getAll',
    type: "GET",
    dataType: "json",
    success: function (res) {
      const select = $("#presupuesto_capitulo");
      select.empty().append('<option value="">Seleccionar presupuesto (opcional)</option>');
      
      if (res.success && res.data) {
        res.data.forEach(function(presupuesto) {
          const option = `<option value="${presupuesto.id_presupuesto}">Presupuesto ${presupuesto.id_presupuesto} - ${presupuesto.fecha_creacion}</option>`;
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
  $("#estado_capitulo").val("1");

  $("#modalCapitulosLabel").text("Crear Capítulo");
  $("#btnGuardarCapitulo").show();
  $("#btnActualizarCapitulo").hide();
}

function guardarCapitulo() {
  let payload = {
    nombre_cap: $("#nombre_capitulo").val(),
    codigo: $("#codigo_capitulo").val() || null,
    id_presupuesto: $("#presupuesto_capitulo").val() || null,
    estado: $("#estado_capitulo").val(),
  };

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
      if (res.success) {
        alert("Capítulo creado exitosamente");
        $("#modalCapitulos").modal("hide");
        $("#datos_capitulos").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo crear"));
      }
    },
    error: function (xhr) {
      alert("Error: " + xhr.responseText);
    },
  });
}

function cargarModalEditarCapitulo(id) {
  $.ajax({
    url: API_CAPITULOS + "?action=getById&id=" + id,
    method: "GET",
    dataType: "json",
    success: function (res) {
      if (res.id_capitulo) {
        $("#id_capitulo").val(res.id_capitulo);
        $("#nombre_capitulo").val(res.nombre_cap);
        $("#codigo_capitulo").val(res.codigo || "");
        $("#presupuesto_capitulo").val(res.id_presupuesto || "");
        $("#estado_capitulo").val(res.estado ? "1" : "0");

        $("#accion_capitulo").val("editar");
        $("#modalCapitulosLabel").text("Editar Capítulo");

        $("#btnGuardarCapitulo").hide();
        $("#btnActualizarCapitulo").show();
        $("#modalCapitulos").modal("show");
      } else {
        alert("Capítulo no encontrado");
      }
    },
    error: function (xhr) {
      alert("Error al cargar capítulo: " + xhr.responseText);
    },
  });
}

function guardarCapituloEditar() {
  let payload = {
    id_capitulo: parseInt($("#id_capitulo").val()),
    nombre_cap: $("#nombre_capitulo").val(),
    codigo: $("#codigo_capitulo").val() || null,
    id_presupuesto: $("#presupuesto_capitulo").val() || null,
    estado: $("#estado_capitulo").val(),
  };

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
      if (res.success) {
        alert("Capítulo actualizado exitosamente");
        $("#modalCapitulos").modal("hide");
        $("#datos_capitulos").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo actualizar"));
      }
    },
    error: function (xhr) {
      alert("Error: " + xhr.responseText);
    },
  });
}

function toggleEstadoCapitulo(id, estadoActual) {
  const nuevoEstado = estadoActual == 1 ? 0 : 1;
  const accion = nuevoEstado == 1 ? "activar" : "desactivar";
  if (!confirm(`¿Está seguro de ${accion} este capítulo?`)) return;

  $.ajax({
    url: API_CAPITULOS + "?action=update",
    method: "POST",
    data: JSON.stringify({ 
      id_capitulo: id, 
      nombre_cap: "", // Se necesita para validación, pero no se actualizará
      estado: nuevoEstado 
    }),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      if (res.success) {
        alert(`Capítulo ${accion}do exitosamente`);
        $("#datos_capitulos").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || `No se pudo ${accion}`));
      }
    },
    error: function (xhr) {
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

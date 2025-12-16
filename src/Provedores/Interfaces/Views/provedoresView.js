$(document).ready(function () {
  var table = $("#datos_provedores").DataTable({
    language: { url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json" },
    searching: true,
    paging: true,
    lengthChange: true,
    pageLength: 10,
    processing: true,
    serverSide: false,
    order: [],
    ajax: {
      url: API_PROVEDORES + "?action=getAll",
      type: "GET",
      dataSrc: "",
    },
    columns: [
      { data: "nombre" },
      {
        data: "telefono",
        render: function (data) {
          return data || "-";
        },
      },
      {
        data: "email",
        render: function (data) {
          return data || "-";
        },
      },
      {
        data: "whatsapp",
        render: function (data) {
          return data || "-";
        },
      },
      {
        data: "contacto",
        render: function (data) {
          return data || "-";
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
          return `
            <button class="btn btn-warning btn-sm btn-editar" data-id="${row.id_provedor}">
              <i class="bi bi-pencil"></i> Editar
            </button>
            <button class="btn btn-danger btn-sm btn-eliminar" data-id="${row.id_provedor}">
              <i class="bi bi-trash"></i> Eliminar
            </button>
          `;
        },
        orderable: false,
      },
    ],
  });

  $("#datos_provedores").on("click", ".btn-editar", function () {
    let id = $(this).data("id");
    if (id) cargarModalEditarProvedor(id);
  });

  $("#datos_provedores").on("click", ".btn-eliminar", function () {
    let id = $(this).data("id");
    if (id) eliminarProvedor(id);
  });
});

function cargarModalCrearProvedor() {
  $("#formProvedores")[0].reset();
  $("#id_provedor").val("");
  $("#accion_provedor").val("crear");
  $("#estado_provedor").val("1");

  $("#modalProvedoresLabel").text("Crear Provedor");
  $("#btnGuardarProvedor").show();
  $("#btnActualizarProvedor").hide();
}

function guardarProvedor() {
  let payload = {
    nombre: $("#nombre_provedor").val(),
    telefono: $("#telefono_provedor").val() || null,
    email: $("#email_provedor").val() || null,
    whatsapp: $("#whatsapp_provedor").val() || null,
    direccion: $("#direccion_provedor").val() || null,
    contacto: $("#contacto_provedor").val() || null,
    estado: $("#estado_provedor").val(),
  };

  if (!payload.nombre) {
    alert("Nombre requerido");
    return;
  }

  $.ajax({
    url: API_PROVEDORES + "?action=create",
    method: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      if (res.success) {
        alert("Provedor creado exitosamente");
        $("#modalProvedores").modal("hide");
        $("#datos_provedores").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo crear"));
      }
    },
    error: function (xhr) {
      alert("Error: " + xhr.responseText);
    },
  });
}

function cargarModalEditarProvedor(id) {
  $.ajax({
    url: API_PROVEDORES + "?action=getById&id=" + id,
    method: "GET",
    dataType: "json",
    success: function (res) {
      if (res.id_provedor) {
        $("#id_provedor").val(res.id_provedor);
        $("#nombre_provedor").val(res.nombre);
        $("#telefono_provedor").val(res.telefono || "");
        $("#email_provedor").val(res.email || "");
        $("#whatsapp_provedor").val(res.whatsapp || "");
        $("#direccion_provedor").val(res.direccion || "");
        $("#contacto_provedor").val(res.contacto || "");
        $("#estado_provedor").val(res.estado ? "1" : "0");

        $("#accion_provedor").val("editar");
        $("#modalProvedoresLabel").text("Editar Provedor");

        $("#btnGuardarProvedor").hide();
        $("#btnActualizarProvedor").show();
        $("#modalProvedores").modal("show");
      } else {
        alert("Provedor no encontrado");
      }
    },
    error: function (xhr) {
      alert("Error al cargar provedor: " + xhr.responseText);
    },
  });
}

function guardarProvedorEditar() {
  let payload = {
    id_provedor: parseInt($("#id_provedor").val()),
    nombre: $("#nombre_provedor").val(),
    telefono: $("#telefono_provedor").val() || null,
    email: $("#email_provedor").val() || null,
    whatsapp: $("#whatsapp_provedor").val() || null,
    direccion: $("#direccion_provedor").val() || null,
    contacto: $("#contacto_provedor").val() || null,
    estado: $("#estado_provedor").val(),
  };

  if (!payload.id_provedor || !payload.nombre) {
    alert("ID y nombre requeridos");
    return;
  }

  $.ajax({
    url: API_PROVEDORES + "?action=update",
    method: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      if (res.success) {
        alert("Provedor actualizado exitosamente");
        $("#modalProvedores").modal("hide");
        $("#datos_provedores").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo actualizar"));
      }
    },
    error: function (xhr) {
      alert("Error: " + xhr.responseText);
    },
  });
}

function eliminarProvedor(id) {
  if (!confirm("¿Está seguro de eliminar este provedor?")) return;

  $.ajax({
    url: API_PROVEDORES + "?action=delete",
    method: "POST",
    data: JSON.stringify({ id: id }),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      if (res.success) {
        alert("Provedor eliminado");
        $("#datos_provedores").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo eliminar"));
      }
    },
    error: function (xhr) {
      alert("Error en la petición: " + xhr.responseText);
    },
  });
}

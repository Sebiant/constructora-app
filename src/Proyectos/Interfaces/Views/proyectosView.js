function cargarClientes() {
  const selectCliente = document.getElementById("id_cliente");

  selectCliente.innerHTML = '<option value="">Cargando clientes...</option>';

  $.ajax({
    url: API_PROYECTOS + "?action=getClientes",
    method: "GET",
    dataType: "json",
    success: function (data) {
      if (data.success && data.clientes && data.clientes.length > 0) {
        selectCliente.innerHTML =
          '<option value="">Seleccione un cliente</option>';
        data.clientes.forEach((cliente) => {
          const option = document.createElement("option");
          option.value = cliente.id_cliente;
          option.textContent = cliente.nombre;
          selectCliente.appendChild(option);
        });
      } else {
        selectCliente.innerHTML =
          '<option value="">No hay clientes disponibles</option>';
        console.error("No se pudieron cargar los clientes:", data.message);
      }
    },
    error: function (xhr, status, error) {
      selectCliente.innerHTML =
        '<option value="">Error al cargar clientes</option>';
      console.error("Error:", error);
    },
  });
}

$(document).ready(function () {
  var table = $("#datos_proyectos").DataTable({
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
      dataSrc: "",
    },
    columns: [
      { data: "nombre" },
      {
        data: "objeto",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "numero_contrato",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "valor",
        render: function (data, type, row) {
          return data
            ? "$ " +
                parseFloat(data).toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })
            : "-";
        },
      },
      { data: "nombre_cliente" },
      { data: "fecha_inicio" },
      {
        data: "fecha_fin",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "estado",
        render: function (data, type, row) {
          let estado = data === true ? "Activo" : "Inactivo";
          let badgeClass = data === true ? "bg-success" : "bg-secondary";
          return `<span class="badge ${badgeClass}">${estado}</span>`;
        },
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
        orderable: false,
      },
    ],
  });

  $("#datos_proyectos").on("click", ".btn-editar", function () {
    let id = $(this).data("id");
    if (id) cargarModalEditar(id);
  });

  $("#datos_proyectos").on("click", ".btn-eliminar", function () {
    let id = $(this).data("id");
    if (id) eliminarProyecto(id);
  });

  $("#modalProyectos").on("show.bs.modal", function () {
    cargarClientes();
  });
});

function cargarModalCrear() {
  $("#formProyectos")[0].reset();
  $("#id_proyecto").val("");
  $("#accion").val("crear");

  // Si existe el campo estado, establecerlo como activo por defecto
  if ($("#estado").length > 0) {
    $("#estado").val("1");
  }

  $("#modalProyectosLabel").text("Crear Proyecto");
  $("#btnGuardar").show();
  $("#btnActualizar").hide();
}

// FUNCIÓN PARA CREAR PROYECTO
function guardarProyecto() {
  let payload = {
    nombre: $("#nombre").val(),
    objeto: $("#objeto").val() || null,
    numero_contrato: $("#numero_contrato").val() || null,
    valor: $("#valor").val() ? parseFloat($("#valor").val()) : null,
    id_cliente: parseInt($("#id_cliente").val()),
    fecha_inicio: $("#fecha_inicio").val(),
    fecha_fin: $("#fecha_fin").val() || null,
    estado: "activo", // SIEMPRE activo al crear
    observaciones: $("#observaciones").val() || null,
  };

  console.log("Datos que se envían al servidor:", payload);

  // Validar campos requeridos
  if (!payload.nombre || !payload.id_cliente || !payload.fecha_inicio) {
    alert(
      "Por favor complete todos los campos requeridos: Nombre, Cliente y Fecha Inicio"
    );
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
        $("#datos_proyectos").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo crear el proyecto"));
      }
    },
    error: function (xhr, status, error) {
      console.error("Error en la petición:");
      console.error("Status:", status);
      console.error("Error:", error);
      console.error("Respuesta completa:", xhr.responseText);

      let errorMsg = "Error en la petición";
      try {
        const errorResponse = JSON.parse(xhr.responseText);
        errorMsg = errorResponse.error || errorMsg;
      } catch (e) {}

      alert(errorMsg);
    },
  });
}

function cargarModalEditar(id) {
  $.ajax({
    url: API_PROYECTOS + "?action=getById&id=" + id,
    method: "GET",
    dataType: "json",
    success: function (res) {
      console.log("Datos recibidos para editar:", res);

      if (res.id_proyecto || res.id) {
        let p = res;
        $("#id_proyecto").val(p.id_proyecto || p.id);
        $("#nombre").val(p.nombre);
        $("#objeto").val(p.objeto || "");
        $("#numero_contrato").val(p.numero_contrato || "");
        $("#valor").val(p.valor || "");
        $("#fecha_inicio").val(p.fecha_inicio);
        $("#fecha_fin").val(p.fecha_fin || "");
        $("#observaciones").val(p.observaciones || "");

        // Cargar el estado actual del proyecto
        if (p.estado !== undefined) {
          // Convertir cualquier formato a nuestro select
          let estadoValue = "1"; // Por defecto activo
          if (
            p.estado === false ||
            p.estado === 0 ||
            p.estado === "0" ||
            p.estado === "inactivo" ||
            p.estado === "false"
          ) {
            estadoValue = "0";
          } else if (
            p.estado === true ||
            p.estado === 1 ||
            p.estado === "1" ||
            p.estado === "activo" ||
            p.estado === "true"
          ) {
            estadoValue = "1";
          }

          // Si existe el campo estado, establecer el valor
          if ($("#estado").length > 0) {
            $("#estado").val(estadoValue);
          }
        }

        $("#accion").val("editar");
        $("#modalProyectosLabel").text("Editar Proyecto");

        $("#btnGuardar").hide();
        $("#btnActualizar").show();

        // Esperar a que se carguen los clientes antes de seleccionar
        setTimeout(() => {
          $("#id_cliente").val(p.id_cliente);
        }, 500);

        $("#modalProyectos").modal("show");
      } else {
        alert("Proyecto no encontrado");
      }
    },
    error: function (xhr) {
      console.error("Error al cargar proyecto:", xhr.responseText);
      alert("Error al cargar proyecto: " + xhr.responseText);
    },
  });
}

// FUNCIÓN PARA EDITAR PROYECTO
function guardarProyectoEditar() {
  // Determinar el estado basado en si existe el campo o no
  let estadoValue;
  if ($("#estado").length > 0) {
    // Si existe el campo estado, usar su valor
    estadoValue = $("#estado").val() === "1" ? "activo" : "inactivo";
  } else {
    // Si no existe, mantener el estado actual (por defecto activo)
    estadoValue = "activo";
  }

  let payload = {
    id_proyecto: parseInt($("#id_proyecto").val()),
    nombre: $("#nombre").val(),
    objeto: $("#objeto").val() || null,
    numero_contrato: $("#numero_contrato").val() || null,
    valor: $("#valor").val() ? parseFloat($("#valor").val()) : null,
    id_cliente: parseInt($("#id_cliente").val()),
    fecha_inicio: $("#fecha_inicio").val(),
    fecha_fin: $("#fecha_fin").val() || null,
    observaciones: $("#observaciones").val() || null,
    estado: estadoValue,
  };

  console.log("Datos que se envían para editar:", payload);

  // Validar campos requeridos
  if (!payload.nombre || !payload.id_cliente || !payload.fecha_inicio) {
    alert(
      "Por favor complete todos los campos requeridos: Nombre, Cliente y Fecha Inicio"
    );
    return;
  }

  $.ajax({
    url: API_PROYECTOS + "?action=update",
    method: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      console.log("Respuesta del servidor:", res);

      if (res.success) {
        alert("Proyecto actualizado exitosamente");
        $("#modalProyectos").modal("hide");
        $("#datos_proyectos").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo actualizar"));
      }
    },
    error: function (xhr, status, error) {
      console.error("Error en la petición:");
      console.error("Status:", status);
      console.error("Error:", error);
      console.error("Respuesta:", xhr.responseText);

      let errorMsg = "Error en la petición";
      try {
        const errorResponse = JSON.parse(xhr.responseText);
        errorMsg = errorResponse.error || errorMsg;
      } catch (e) {}

      alert(errorMsg);
    },
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
        $("#datos_proyectos").DataTable().ajax.reload();
      } else {
        alert("Error: " + (res.error || "No se pudo eliminar"));
      }
    },
    error: function (xhr) {
      alert("Error en la petición: " + xhr.responseText);
    },
  });
}

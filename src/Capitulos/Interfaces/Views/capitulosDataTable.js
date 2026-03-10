$(document).ready(function () {
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

  // Cargar proyectos y presupuestos para el modal (solo si la función existe)
  if (typeof cargarProyectos === 'function') {
    cargarProyectos();
  }
});

// Función para recargar la tabla con filtro de presupuesto
function recargarCapitulosPorPresupuesto(idPresupuesto) {
  const url = idPresupuesto ?
    API_CAPITULOS + "?action=getAll&id_presupuesto=" + idPresupuesto :
    API_CAPITULOS + "?action=getAll";

  $("#datos_capitulos").DataTable().ajax.url(url).load();
}

// Función para limpiar filtro (mostrar todos)
function mostrarTodosLosCapitulos() {
  recargarCapitulosPorPresupuesto(null);
}

// Función de inicialización para llamadas desde el layout
window.initCapitulosDataTable = function () {
  console.log('[Capitulos] Initializing DataTable from layout...');

  // Destruir instancia previa si existe
  if ($.fn.DataTable.isDataTable('#datos_capitulos')) {
    $('#datos_capitulos').DataTable().destroy();
  }

  // Inicializar el DataTable
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
}

let listaPresupuestos = [];
let datosAgrupados = {};
let multiplicadores = {
  administracion: 0.21,
  imprevistos: 0.01,
  utilidad: 0.08,
  iva: 0.19,
};

$(document).ready(function () {
  cargarProyectos();
  cargarMultiplicadores();
});

function cargarMultiplicadores() {
  $.ajax({
    url: API_PRESUPUESTOS + "?action=getMultiplicadores",
    method: "GET",
    dataType: "json",
    success: function (res) {
      if (res.success && res.data) {
        res.data.forEach((costo) => {
          const porcentaje = parseFloat(costo.porcentaje) / 100;
          switch (costo.desccostoind.toLowerCase()) {
            case "administración":
              multiplicadores.administracion = porcentaje;
              break;
            case "imprevistos":
              multiplicadores.imprevistos = porcentaje;
              break;
            case "utilidad":
              multiplicadores.utilidad = porcentaje;
              break;
            case "iva":
              multiplicadores.iva = porcentaje;
              break;
          }
        });
        console.log("Multiplicadores cargados:", multiplicadores);
      }
    },
    error: function () {
      console.warn(
        "No se pudieron cargar los multiplicadores, usando valores por defecto"
      );
    },
  });
}

function cargarProyectos() {
  const selectProyecto = $("#id_proyecto");
  selectProyecto.html('<option value="">Cargando proyectos...</option>');

  $.ajax({
    url: API_PRESUPUESTOS + "?action=getProyectos",
    method: "GET",
    dataType: "json",
    success: function (res) {
      if (res.success && res.data.length > 0) {
        selectProyecto.html('<option value="">Seleccione un proyecto</option>');
        res.data.forEach((p) => {
          selectProyecto.append(
            `<option value="${p.id_proyecto}">${p.nombre}</option>`
          );
        });
      } else {
        selectProyecto.html(
          '<option value="">No hay proyectos disponibles</option>'
        );
      }
    },
    error: function () {
      selectProyecto.html(
        '<option value="">Error al cargar proyectos</option>'
      );
    },
  });
}

function cargarMaterialesEnSelect(materialSeleccionado = "") {
  const selectMaterial = $("#material");
  selectMaterial.html('<option value="">Cargando materiales...</option>');

  $.ajax({
    url: API_PRESUPUESTOS + "?action=getMateriales",
    method: "GET",
    dataType: "json",
    success: function (res) {
      selectMaterial.empty();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        selectMaterial.append(
          '<option value="">Seleccione un material</option>'
        );
        res.data.forEach((m) => {
          selectMaterial.append(`
                        <option value="${m.cod_material}" 
                            data-id_material="${m.id_material}"
                            data-id_mat_precio="${m.id_mat_precio}"
                            data-precio="${m.precio_actual}"
                            data-unidad="${m.unidad}">
                            ${m.cod_material} - ${m.nombre_material}
                        </option>
                    `);
        });

        if (materialSeleccionado) {
          selectMaterial.val(materialSeleccionado);
        }
      } else {
        selectMaterial.html(
          '<option value="">No hay materiales disponibles</option>'
        );
      }
    },
    error: function (xhr, status, error) {
      console.error("Error al cargar materiales:", error);
      console.log("Status:", status);
      console.log("Response:", xhr.responseText);
      alert("Error al cargar materiales: " + xhr.status + " - " + error);
    },
  });
}

function agruparDatosPorCapitulo() {
  datosAgrupados = {};
  listaPresupuestos.forEach((fila, index) => {
    const proyecto = fila.proyecto || "Sin Proyecto";
    const cap = fila.capitulo || "Sin CAP";

    if (!datosAgrupados[proyecto]) datosAgrupados[proyecto] = {};
    if (!datosAgrupados[proyecto][cap]) datosAgrupados[proyecto][cap] = [];

    fila.indexOriginal = index;
    datosAgrupados[proyecto][cap].push(fila);
  });
}

function renderTablaComoPDF() {
  let html = "";
  let contadorGlobal = 1;
  let totalGeneral = 0;
  const subtotalesPorProyecto = {};

  Object.keys(datosAgrupados).forEach((proyecto) => {
    let subtotalProyecto = 0;

    html += `<div class="table-responsive mb-4">`;
    html += `<table class="table table-bordered table-sm" style="font-size: 0.85rem;">`;
    html += `<thead class="table-dark">`;
    html += `<tr>`;
    html += `<th width="4%">No.</th>`;
    html += `<th width="12%">Código Material</th>`;
    html += `<th width="35%">Material</th>`;
    html += `<th width="8%">Unidad</th>`;
    html += `<th width="8%">Cantidad</th>`;
    html += `<th width="10%">Precio</th>`;
    html += `<th width="12%">Total</th>`;
    html += `<th width="6%">Elim.</th>`;
    html += `<th width="5%">Mod.</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    html += `<tr class="table-primary fw-bold"><td colspan="9">${proyecto}</td></tr>`;

    Object.keys(datosAgrupados[proyecto])
      .sort()
      .forEach((cap) => {
        const items = datosAgrupados[proyecto][cap];
        let subtotalCapitulo = 0;

        items.forEach((item) => {
          const precio = parseFloat(item.precio_unitario) || 0;
          const cantidad = parseFloat(item.cantidad) || 0;
          const total = precio * cantidad;
          subtotalCapitulo += total;
          subtotalProyecto += total;

          const claseFila = item.ok ? "" : "table-danger";

          html += `<tr class="${claseFila}" data-index="${item.indexOriginal}">`;
          html += `<td class="text-center">${contadorGlobal++}</td>`;
          html += `<td>${item.material_codigo || ""}</td>`;
          html += `<td>${item.material_nombre || ""}</td>`;
          html += `<td class="text-center">${item.unidad || ""}</td>`;
          html += `<td class="text-end">${formatNumber(cantidad)}</td>`;
          html += `<td class="text-end">${formatCurrency(precio)}</td>`;
          html += `<td class="text-end fw-bold">${formatCurrency(total)}</td>`;
          html += `<td class="text-center">`;
          html += `<button class="btn btn-danger btn-sm btn-eliminar" data-index="${item.indexOriginal}">X</button>`;
          html += `</td>`;
          html += `<td class="text-center">`;
          html += `<button class="btn btn-warning btn-sm btn-editar" data-index="${item.indexOriginal}" data-proyecto="${proyecto}" data-cap="${cap}">✎</button>`;
          html += `</td>`;
          html += `</tr>`;

          if (!item.ok && item.errores && item.errores.length > 0) {
            html += `<tr class="table-danger">`;
            html += `<td colspan="9" class="small text-danger">`;
            html += `<strong>Errores:</strong> ${item.errores.join(", ")}`;
            html += `</td>`;
            html += `</tr>`;
          }
        });

        html += `<tr class="table-secondary">`;
        html += `<td colspan="6" class="text-end fw-bold">Subtotal Capítulo ${cap}</td>`;
        html += `<td class="text-end fw-bold">${formatCurrency(
          subtotalCapitulo
        )}</td>`;
        html += `<td colspan="2"></td>`;
        html += `</tr>`;
      });

    html += `<tr class="table-success fw-bold">`;
    html += `<td colspan="6" class="text-end">Subtotal ${proyecto}</td>`;
    html += `<td class="text-end">${formatCurrency(subtotalProyecto)}</td>`;
    html += `<td colspan="2"></td>`;
    html += `</tr>`;
    html += `</tbody>`;
    html += `</table>`;
    html += `</div>`;

    subtotalesPorProyecto[proyecto] = subtotalProyecto;
    totalGeneral += subtotalProyecto;
  });

  if (Object.keys(subtotalesPorProyecto).length > 1) {
    html += generarTablaSubtotales(subtotalesPorProyecto);
  }

  html += generarTablaTotales(totalGeneral);
  $("#tablaPreview").html(html);
}

function generarTablaSubtotales(subtotalesPorProyecto) {
  let html = `<div class="table-responsive mb-3">`;
  html += `<table class="table table-bordered table-sm" style="font-size: 0.85rem; width: auto; margin-left: auto;">`;
  html += `<thead class="table-info">`;
  html += `<tr><th colspan="2" class="text-center">SUBTOTALES POR PROYECTO</th></tr>`;
  html += `</thead>`;
  html += `<tbody>`;

  Object.keys(subtotalesPorProyecto).forEach((proyecto) => {
    html += `<tr>`;
    html += `<td class="text-end fw-bold">${proyecto}</td>`;
    html += `<td class="text-end">${formatCurrency(
      subtotalesPorProyecto[proyecto]
    )}</td>`;
    html += `</tr>`;
  });

  html += `</tbody>`;
  html += `</table>`;
  html += `</div>`;
  return html;
}

function generarTablaTotales(totalGeneral) {
  const administracion = totalGeneral * multiplicadores.administracion;
  const imprevistos = totalGeneral * multiplicadores.imprevistos;
  const utilidad = totalGeneral * multiplicadores.utilidad;
  const totalAIU = administracion + imprevistos + utilidad;
  const iva = totalAIU * multiplicadores.iva;
  const totalPresupuesto = totalGeneral + totalAIU + iva;

  let html = `<div class="table-responsive">`;
  html += `<table class="table table-bordered table-sm" style="font-size: 0.85rem; width: auto; margin-left: auto;">`;
  html += `<tbody>`;
  html += `<tr class="fw-bold"><td class="text-end">Total</td><td class="text-end">${formatCurrency(
    totalGeneral
  )}</td></tr>`;
  html += `<tr><td class="text-end">Administración (${(
    multiplicadores.administracion * 100
  ).toFixed(2)}%)</td><td class="text-end">${formatCurrency(
    administracion
  )}</td></tr>`;
  html += `<tr><td class="text-end">Imprevistos (${(
    multiplicadores.imprevistos * 100
  ).toFixed(2)}%)</td><td class="text-end">${formatCurrency(
    imprevistos
  )}</td></tr>`;
  html += `<tr><td class="text-end">Utilidad (${(
    multiplicadores.utilidad * 100
  ).toFixed(2)}%)</td><td class="text-end">${formatCurrency(
    utilidad
  )}</td></tr>`;
  html += `<tr class="table-warning fw-bold"><td class="text-end">TOTAL AIU</td><td class="text-end">${formatCurrency(
    totalAIU
  )}</td></tr>`;
  html += `<tr><td class="text-end">IVA (${(multiplicadores.iva * 100).toFixed(
    2
  )}%)</td><td class="text-end">${formatCurrency(iva)}</td></tr>`;
  html += `<tr class="table-primary fw-bold"><td class="text-end">TOTAL PRESUPUESTO</td><td class="text-end">${formatCurrency(
    totalPresupuesto
  )}</td></tr>`;
  html += `</tbody>`;
  html += `</table>`;
  html += `</div>`;

  return html;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Event Listeners
$("#formImportar").on("submit", function (e) {
  e.preventDefault();
  importarExcel();
});

$("#btnActualizarPresupuesto").on("click", function () {
  actualizarPresupuesto();
});

$("#btnCargarBD").on("click", function () {
  guardarEnBaseDatos();
});

$(document).on("click", ".btn-editar", function () {
  const index = $(this).data("index");
  const proyecto = $(this).data("proyecto");
  const cap = $(this).data("cap");
  const fila = listaPresupuestos[index];

  $("#indexFila").val(index);
  $("#proyectoFila").val(proyecto);
  $("#capFila").val(cap);
  $("#cod").val(fila.material_codigo);

  cargarMaterialesEnSelect(fila.material_codigo);

  $("#unidad").val(fila.unidad);
  $("#cantidad").val(fila.cantidad);
  $("#precio").val(fila.precio_unitario);

  $("#modalPresupuesto").modal("show");
});

$(document).on("click", ".btn-eliminar", function () {
  const index = $(this).data("index");
  if (confirm("¿Seguro que deseas eliminar esta fila?")) {
    listaPresupuestos.splice(index, 1);
    agruparDatosPorCapitulo();
    renderTablaComoPDF();
  }
});

$(document).on("change", "#material", function () {
  const selectedOption = $(this).find("option:selected");
  if (selectedOption.val()) {
    $("#cod").val(selectedOption.val());
    $("#unidad").val(selectedOption.data("unidad") || "");
    $("#precio").val(selectedOption.data("precio") || "");
  }
});

function importarExcel() {
  const archivo = $("#archivo_excel")[0].files[0];
  const proyectoSeleccionado = $("#id_proyecto").val();

  if (!archivo) {
    alert("Por favor selecciona un archivo Excel.");
    return;
  }
  if (!proyectoSeleccionado) {
    alert("Por favor selecciona un proyecto.");
    return;
  }

  const formData = new FormData();
  formData.append("archivo_excel", archivo);
  formData.append("id_proyecto", proyectoSeleccionado);

  $("#mensajeResultado").html(
    `<div class="text-info">Procesando archivo...</div>`
  );
  $("#tablaPreview").html("");
  $("#accionesFinales").hide();
  $("#resumenImportacion").hide();

  $.ajax({
    url: API_PRESUPUESTOS + "?action=importPreview",
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    dataType: "json",
    success: function (data) {
      if (!data.ok) {
        $("#mensajeResultado").html(
          `<div class="alert alert-danger">Error: ${
            data.error || "No se pudo procesar el archivo."
          }</div>`
        );
        $("#resumenImportacion").fadeIn();
        return;
      }

      listaPresupuestos = data.filas.map((fila) => ({
        ...fila,
        proyecto: $("#id_proyecto option:selected").text(),
        id_proyecto: proyectoSeleccionado,
      }));

      $("#totalFilas").text(data.resumen.total_filas);
      $("#filasValidas").text(data.resumen.filas_validas);
      $("#filasErrores").text(data.resumen.filas_con_error);
      $("#valorTotal").text(formatCurrency(data.resumen.valor_total));

      $("#mensajeResultado").html(
        `<div class="alert alert-success mb-0">Archivo procesado correctamente. ${data.resumen.filas_validas} filas válidas de ${data.resumen.total_filas}.</div>`
      );

      $("#resumenImportacion").fadeIn();
      agruparDatosPorCapitulo();
      renderTablaComoPDF();
      $("#accionesFinales").fadeIn();
    },
    error: function (xhr, status, error) {
      $("#mensajeResultado").html(
        `<div class="alert alert-danger">Error al procesar: ${error}</div>`
      );
      $("#resumenImportacion").fadeIn();
      console.error("Error:", xhr.responseText);
    },
  });
}

function actualizarPresupuesto() {
  const index = $("#indexFila").val();
  const materialSeleccionado = $("#material option:selected");

  listaPresupuestos[index].material_codigo = materialSeleccionado.val();
  listaPresupuestos[index].material_nombre =
    materialSeleccionado.text().split(" - ")[1] || materialSeleccionado.text();
  listaPresupuestos[index].unidad =
    materialSeleccionado.data("unidad") || $("#unidad").val();
  listaPresupuestos[index].cantidad = $("#cantidad").val();
  listaPresupuestos[index].precio_unitario =
    materialSeleccionado.data("precio") || $("#precio").val();

  $("#modalPresupuesto").modal("hide");
  agruparDatosPorCapitulo();
  renderTablaComoPDF();
}

function guardarEnBaseDatos() {
  const btn = $(this);
  btn
    .prop("disabled", true)
    .html(
      '<span class="spinner-border spinner-border-sm" role="status"></span> Guardando...'
    );

  $.ajax({
    url: API_PRESUPUESTOS + "?action=guardarPresupuestos",
    type: "POST",
    data: { presupuestos: JSON.stringify(listaPresupuestos) },
    dataType: "json",
    success: function (data) {
      if (data.ok) {
        alert("Presupuestos guardados correctamente");
        location.reload();
      } else {
        alert("Error: " + (data.mensaje || "No se pudieron guardar los datos"));
      }
    },
    error: function (xhr, status, error) {
      alert("Error al guardar: " + error);
    },
    complete: function () {
      btn.prop("disabled", false).html("Guardar Presupuestos");
    },
  });
}

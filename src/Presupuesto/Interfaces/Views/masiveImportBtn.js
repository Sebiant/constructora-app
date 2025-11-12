let listaPresupuestos = [];
let datosAgrupados = {};
let multiplicadores = {
  administracion: 0.21,
  imprevistos: 0.01,
  utilidad: 0.08,
  iva: 0.19,
};

let guardando = false;

$(document).ready(function () {
  cargarProyectos();
  cargarMultiplicadores();
});

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

        selectProyecto.off("change").on("change", function () {
          const proyectoId = $(this).val();
          cargarPresupuestosPorProyecto(proyectoId);

          $("#tablaPreview").html("");
          $("#accionesFinales").hide();
          $("#resumenImportacion").hide();
          listaPresupuestos = [];
        });

        const proyectoSeleccionado = selectProyecto.val();
        if (proyectoSeleccionado) {
          cargarPresupuestosPorProyecto(proyectoSeleccionado);
        }
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

function cargarPresupuestosPorProyecto(proyectoId) {
  const selectPresupuesto = $("#id_presupuesto");

  if (!proyectoId || proyectoId === "") {
    selectPresupuesto.html(
      '<option value="">Primero seleccione un proyecto</option>'
    );
    selectPresupuesto.prop("disabled", true);
    return;
  }

  selectPresupuesto.html('<option value="">Cargando presupuestos...</option>');
  selectPresupuesto.prop("disabled", true);

  const formData = new FormData();
  formData.append("proyecto_id", proyectoId);

  $.ajax({
    url: API_PRESUPUESTOS + "?action=getPresupuestosByProyecto",
    method: "POST",
    data: formData,
    contentType: false,
    processData: false,
    dataType: "json",
    success: function (res) {
      selectPresupuesto.empty();

      if (res.success && res.data && res.data.length > 0) {
        res.data.forEach((presupuesto) => {
          const fecha = new Date(presupuesto.fecha_creacion);
          const fechaFormateada = fecha.toLocaleDateString("es-ES");
          const montoFormateado = formatCurrency(presupuesto.monto_total || 0);

          selectPresupuesto.append(
            `<option value="${presupuesto.id_presupuesto}">
                            Presupuesto ${presupuesto.id_presupuesto} - ${fechaFormateada} - ${montoFormateado}
                        </option>`
          );
        });

        selectPresupuesto.prop("disabled", false);

        selectPresupuesto.off("change").on("change", function () {
          const idPresupuesto = $(this).val();
          if (idPresupuesto) {
            cargarCapitulosDelPresupuesto(idPresupuesto);
          }
        });
      } else {
        selectPresupuesto.append(
          '<option value="">No hay presupuestos para este proyecto</option>'
        );
      }
    },
    error: function (xhr, status, error) {
      console.error("Error al cargar presupuestos:", error);
      selectPresupuesto.html(
        '<option value="">Error al cargar presupuestos</option>'
      );
    },
  });
}

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
      }
    },
    error: function () {
      console.warn(
        "No se pudieron cargar los multiplicadores, usando valores por defecto"
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
      alert("Error al cargar materiales: " + error);
    },
  });
}

function cargarCapitulosDelPresupuesto(
  idPresupuesto,
  capituloSeleccionado = ""
) {
  const selectCapitulo = $("#capituloSelect");

  if (!idPresupuesto) {
    selectCapitulo.html(
      '<option value="">Primero seleccione un presupuesto</option>'
    );
    return;
  }

  selectCapitulo.html('<option value="">Cargando capítulos...</option>');

  $.ajax({
    url: API_PRESUPUESTOS + "?action=getCapitulosByPresupuesto",
    method: "POST",
    data: { id_presupuesto: idPresupuesto },
    dataType: "json",
    success: function (res) {
      selectCapitulo.empty();

      if (res.success && res.data && res.data.length > 0) {
        selectCapitulo.append(
          '<option value="">Seleccione un capítulo</option>'
        );

        res.data.forEach((capitulo) => {
          const numeroCapitulo =
            capitulo.numero_ordinal || res.data.indexOf(capitulo) + 1;

          selectCapitulo.append(
            `<option value="${capitulo.id_capitulo}" 
                                 data-numero-ordinal="${numeroCapitulo}">
                            Capítulo ${numeroCapitulo} - ${capitulo.nombre_cap}
                        </option>`
          );
        });

        if (capituloSeleccionado) {
          selectCapitulo.val(capituloSeleccionado);
        }
      } else {
        selectCapitulo.append(
          '<option value="">No hay capítulos disponibles</option>'
        );
      }
    },
    error: function (xhr, status, error) {
      console.error("Error al cargar capítulos:", error);
      selectCapitulo.html(
        '<option value="">Error al cargar capítulos</option>'
      );
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
    html += `<th width="6%">Mod.</th>`;
    html += `<th width="5%">Det.</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;

    html += `<tr class="table-primary fw-bold"><td colspan="10">${proyecto}</td></tr>`;

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
          html += `<td class="text-center">
                        <button class="btn btn-danger btn-sm btn-eliminar" data-index="${item.indexOriginal}">X</button>
                    </td>`;
          html += `<td class="text-center">
                        <button class="btn btn-warning btn-sm btn-editar" data-index="${item.indexOriginal}" data-proyecto="${proyecto}" data-cap="${cap}">Editar</button>
                    </td>`;
          html += `<td class="text-center">
                        <button class="btn btn-info btn-sm btn-ver-item" data-index="${item.indexOriginal}">Detalles</button>
                    </td>`;
          html += `</tr>`;

          if (!item.ok && item.errores && item.errores.length > 0) {
            html += `<tr class="table-danger">`;
            html += `<td colspan="10" class="small text-danger">`;
            html += `<strong>Errores:</strong> ${item.errores.join(", ")}`;
            html += `</td>`;
            html += `</tr>`;
          }
        });

        html += `<tr class="table-secondary">`;
        html += `<td colspan="7" class="text-end fw-bold">Subtotal Capítulo ${cap}</td>`;
        html += `<td class="text-end fw-bold">${formatCurrency(
          subtotalCapitulo
        )}</td>`;
        html += `<td colspan="2"></td>`;
        html += `</tr>`;
      });

    html += `<tr class="table-success fw-bold">`;
    html += `<td colspan="7" class="text-end">Subtotal ${proyecto}</td>`;
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

$("#formImportar").on("submit", function (e) {
  e.preventDefault();
  importarExcel();
});

$("#btnActualizarPresupuesto").on("click", function () {
  actualizarPresupuesto();
});

$("#btnCargarBD").on("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  guardarEnBaseDatos();
});

$(document).on("click", ".btn-editar", function () {
  const index = $(this).data("index");
  const proyecto = $(this).data("proyecto");
  const cap = $(this).data("cap");
  const fila = listaPresupuestos[index];

  const idPresupuestoSeleccionado = $("#id_presupuesto").val();

  $("#indexFila").val(index);
  $("#proyectoFila").val(proyecto);
  $("#capFila").val(cap);
  $("#cod").val(fila.material_codigo);

  cargarCapitulosDelPresupuesto(
    idPresupuestoSeleccionado,
    fila.id_capitulo || ""
  );
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
  const presupuestoSeleccionado = $("#id_presupuesto").val();

  if (!archivo) {
    alert("Por favor selecciona un archivo Excel.");
    return;
  }
  if (!proyectoSeleccionado) {
    alert("Por favor selecciona un proyecto.");
    return;
  }
  if (!presupuestoSeleccionado) {
    alert("Por favor selecciona un presupuesto.");
    return;
  }

  const formData = new FormData();
  formData.append("archivo_excel", archivo);
  formData.append("id_proyecto", proyectoSeleccionado);
  formData.append("id_presupuesto", presupuestoSeleccionado);

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
        id_presupuesto: presupuestoSeleccionado,
        id_item: fila.id_item || null,
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
  const capituloSeleccionado = $("#capituloSelect").val();

  const capituloTexto = $("#capituloSelect option:selected").text();
  const numeroOrdinal = $("#capituloSelect option:selected").data(
    "numero-ordinal"
  );

  if (!capituloSeleccionado) {
    alert("Por favor seleccione un capítulo válido");
    return;
  }

  if (!materialSeleccionado.val()) {
    alert("Por favor seleccione un material válido");
    return;
  }

  listaPresupuestos[index].material_codigo = materialSeleccionado.val();
  listaPresupuestos[index].material_nombre =
    materialSeleccionado.text().split(" - ")[1] || materialSeleccionado.text();
  listaPresupuestos[index].unidad =
    materialSeleccionado.data("unidad") || $("#unidad").val();
  listaPresupuestos[index].cantidad = $("#cantidad").val();
  listaPresupuestos[index].precio_unitario =
    materialSeleccionado.data("precio") || $("#precio").val();

  listaPresupuestos[index].id_capitulo = capituloSeleccionado;
  listaPresupuestos[index].capitulo = capituloTexto;

  if (numeroOrdinal) {
    listaPresupuestos[index].numero_ordinal_original = numeroOrdinal;
  }

  const erroresSinCapitulo = listaPresupuestos[index].errores.filter(
    (error) => !error.includes("capítulo") && !error.includes("capitulo")
  );
  listaPresupuestos[index].errores = erroresSinCapitulo;
  listaPresupuestos[index].ok = erroresSinCapitulo.length === 0;

  $("#modalPresupuesto").modal("hide");
  agruparDatosPorCapitulo();
  renderTablaComoPDF();
}

function guardarEnBaseDatos() {
  // 🔴 VERIFICAR SI YA SE ESTÁ GUARDANDO
  if (guardando) {
    alert("La importación ya está en proceso. Por favor espere...");
    return;
  }

  const btn = $("#btnCargarBD");
  const idPresupuesto = $("#id_presupuesto").val();

  if (!idPresupuesto) {
    alert("Error: No se ha seleccionado un presupuesto");
    return;
  }

  const itemsValidos = listaPresupuestos.filter((item) => item.ok);

  if (itemsValidos.length === 0) {
    alert("No hay items válidos para guardar");
    return;
  }

  // 🔴 MARCAR COMO GUARDANDO
  guardando = true;

  btn
    .prop("disabled", true)
    .html(
      '<span class="spinner-border spinner-border-sm" role="status"></span> Guardando...'
    );

  // 🔴 AGREGAR TIMEOSTAMP PARA DEBUG
  console.log("=== INICIANDO GUARDADO ===");
  console.log("ID Presupuesto:", idPresupuesto);
  console.log("Items válidos:", itemsValidos.length);
  console.log("Timestamp:", new Date().toISOString());

  $.ajax({
    url: API_PRESUPUESTOS + "?action=guardarPresupuestos",
    type: "POST",
    data: {
      presupuestos: JSON.stringify(itemsValidos),
      id_presupuesto: idPresupuesto,
    },
    dataType: "json",
    success: function (data) {
      console.log("=== RESPUESTA DEL SERVIDOR ===");
      console.log("Respuesta:", data);

      if (data.ok) {
        alert("✅ Presupuestos guardados correctamente");
        console.log("✅ Guardado exitoso - Total filas:", data.total_filas);

        // 🔴 LIMPIAR TODO DESPUÉS DEL GUARDADO EXITOSO
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        alert(
          "❌ Error: " + (data.mensaje || "No se pudieron guardar los datos")
        );
        console.error("❌ Error en guardado:", data.mensaje);
      }
    },
    error: function (xhr, status, error) {
      console.error("❌ Error en la petición:", error);
      console.error("Detalles:", xhr.responseText);
      alert("❌ Error al guardar: " + error);
    },
    complete: function () {
      // 🔴 RESTABLECER ESTADO DE GUARDADO
      guardando = false;
      btn.prop("disabled", false).html("Guardar Presupuestos");
      console.log("=== GUARDADO COMPLETADO ===");
    },
  });
}

function mostrarListaPresupuestosEnConsola() {
  const validos = listaPresupuestos.filter((item) => item.ok).length;
  const conErrores = listaPresupuestos.filter((item) => !item.ok).length;
  const valorTotal = listaPresupuestos.reduce(
    (sum, item) => sum + (item.valor_total || 0),
    0
  );

  console.log("=== ESTADÍSTICAS COMPLETAS ===");
  console.log(`Válidos: ${validos}`);
  console.log(`Con errores: ${conErrores}`);
  console.log(`Valor total: ${formatCurrency(valorTotal)}`);
  console.log(`Total items: ${listaPresupuestos.length}`);
}

function cargarInfoItemPorCodigo(codigoMaterial) {
  if (!codigoMaterial) return;

  const url =
    API_PRESUPUESTOS +
    "?action=getItemDetailsByCode&codigo_material=" +
    encodeURIComponent(codigoMaterial);

  $.ajax({
    url: url,
    method: "GET",
    dataType: "json",
    success: function (res) {
      if (res.success && res.data) {
        const item = res.data.item;
        const componentesOrganizados = res.data.componentes_organizados;
        const resumenTotales = res.data.resumen_totales;

        const totalGeneral = Object.values(resumenTotales).reduce(
          (sum, valor) => sum + valor,
          0
        );

        $("#modalItemTitulo").text(item.nombre_item || "Detalle del Ítem");
        $("#modalItemCodigo").text(item.codigo_item || codigoMaterial);
        $("#modalItemUnidad").text(item.unidad || "");
        $("#modalItemPrecio").text(formatCurrency(item.precio_unitario || 0));
        $("#modalItemDescripcion").text(item.descripcion || "Sin descripción");

        let htmlComp = "";

        function renderizarSeccion(tipo, titulo) {
          const seccion = componentesOrganizados[tipo];
          if (!seccion || seccion.items.length === 0) return "";

          let html = `
                        <tr class="table-info">
                            <td colspan="7" class="fw-bold">
                                ${titulo} - Total: ${formatCurrency(
            seccion.total
          )}
                            </td>
                        </tr>
                    `;

          seccion.items.forEach((comp, idx) => {
            html += `
                            <tr>
                                <td class="text-center">${idx + 1}</td>
                                <td class="text-center">
                                    <span class="badge ${getBadgeClass(
                                      comp.tipo_componente
                                    )}">
                                        ${comp.tipo_componente}
                                    </span>
                                </td>
                                <td>${comp.descripcion}</td>
                                <td class="text-center">${comp.unidad}</td>
                                <td class="text-end">${formatNumber(
                                  parseFloat(comp.cantidad)
                                )}</td>
                                <td class="text-end">${formatCurrency(
                                  parseFloat(comp.precio_unitario)
                                )}</td>
                                <td class="text-end fw-bold">${formatCurrency(
                                  parseFloat(comp.subtotal)
                                )}</td>
                            </tr>
                        `;
          });

          return html;
        }

        function getBadgeClass(tipo) {
          const classes = {
            material: "bg-primary",
            mano_obra: "bg-success",
            equipo: "bg-warning text-dark",
            transporte: "bg-info",
            otro: "bg-secondary",
          };
          return classes[tipo] || "bg-secondary";
        }

        htmlComp += renderizarSeccion("material", "MATERIALES");
        htmlComp += renderizarSeccion("mano_obra", "MANO DE OBRA");
        htmlComp += renderizarSeccion("equipo", "EQUIPOS Y HERRAMIENTAS");
        htmlComp += renderizarSeccion("transporte", "TRANSPORTE");
        htmlComp += renderizarSeccion("otro", "OTROS COSTOS");

        htmlComp += `
                    <tr class="table-secondary">
                        <td colspan="7" class="text-center fw-bold">RESUMEN DE COSTOS</td>
                    </tr>
                    <tr>
                        <td colspan="5" class="text-end fw-bold">Materiales:</td>
                        <td colspan="2" class="text-end">${formatCurrency(
                          resumenTotales.material
                        )}</td>
                    </tr>
                    <tr>
                        <td colspan="5" class="text-end fw-bold">Mano de Obra:</td>
                        <td colspan="2" class="text-end">${formatCurrency(
                          resumenTotales.mano_obra
                        )}</td>
                    </tr>
                    <tr>
                        <td colspan="5" class="text-end fw-bold">Equipos:</td>
                        <td colspan="2" class="text-end">${formatCurrency(
                          resumenTotales.equipo
                        )}</td>
                    </tr>
                `;

        if (resumenTotales.transporte > 0) {
          htmlComp += `
                        <tr>
                            <td colspan="5" class="text-end fw-bold">Transporte:</td>
                            <td colspan="2" class="text-end">${formatCurrency(
                              resumenTotales.transporte
                            )}</td>
                        </tr>
                    `;
        }

        if (resumenTotales.otro > 0) {
          htmlComp += `
                        <tr>
                            <td colspan="5" class="text-end fw-bold">Otros:</td>
                            <td colspan="2" class="text-end">${formatCurrency(
                              resumenTotales.otro
                            )}</td>
                        </tr>
                    `;
        }

        htmlComp += `
                    <tr class="table-success">
                        <td colspan="5" class="text-end fw-bold fs-6">TOTAL GENERAL DEL ÍTEM:</td>
                        <td colspan="2" class="text-end fw-bold fs-6">${formatCurrency(
                          totalGeneral
                        )}</td>
                    </tr>
                `;

        $("#modalTablaComponentes tbody").html(htmlComp);
        $("#modalItem").modal("show");
      } else {
        alert(
          "No se pudo obtener la información del ítem con código: " +
            codigoMaterial
        );
      }
    },
    error: function (xhr, status, error) {
      console.error("Error al cargar info del ítem:", error);
      alert("Error al cargar información del ítem: " + error);
    },
  });
}

$(document).on("click", ".btn-ver-item", function () {
  const index = $(this).data("index");
  const fila = listaPresupuestos[index];

  if (fila && fila.material_codigo) {
    cargarInfoItemPorCodigo(fila.material_codigo);
  } else {
    alert("No se encontró el código del material para mostrar detalles.");
  }
});

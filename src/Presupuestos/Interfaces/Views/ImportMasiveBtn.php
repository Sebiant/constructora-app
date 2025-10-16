<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
  <form id="formImportar" enctype="multipart/form-data" class="mt-3 border p-3 rounded shadow-sm bg-light">
    <h4 class="mb-3">Importar Presupuesto Masivo</h4>

    <div class="form-group mb-3">
      <label for="archivo_excel">Archivo Excel (.xlsx):</label>
      <input type="file" name="archivo_excel" id="archivo_excel" class="form-control" accept=".xlsx" required>
    </div>

    <div class="text-end mb-3">
      <button type="submit" class="btn btn-success">
        Importar Datos
      </button>
    </div>

    <div class="alert alert-info mb-0" role="alert" style="font-size: 0.9rem;">
      Sube un archivo Excel con el formato correcto 
      (<b>Proyecto</b>, <b>Presupuesto</b>, <b>CAP</b>, <b>COD</b>, <b>Cantidad</b>...)
    </div>
  </form>

  <!-- Resumen de importación -->
  <div id="resumenImportacion" class="mt-4" style="display: none;">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">Resumen de Importación</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <strong>Total Filas:</strong> <span id="totalFilas">0</span>
          </div>
          <div class="col-md-3">
            <strong>Válidas:</strong> <span id="filasValidas" class="text-success">0</span>
          </div>
          <div class="col-md-3">
            <strong>Con Errores:</strong> <span id="filasErrores" class="text-danger">0</span>
          </div>
          <div class="col-md-3">
            <strong>Valor Total:</strong> <span id="valorTotal">$0.00</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="resultado" class="mt-4"></div>
  <div id="tablaPreview" class="mt-4"></div>

  <div id="accionesFinales" class="mt-4 text-end" style="display: none;">
    <button id="btnCargarBD" class="btn btn-primary">
      Guardar Presupuestos
    </button>
  </div>
</div>

<!-- Modal para editar presupuesto -->
<div class="modal fade" id="modalPresupuesto" tabindex="-1" aria-labelledby="modalPresupuestoLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalPresupuestoLabel">Editar Presupuesto</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form id="formPresupuesto">
          <input type="hidden" id="indexFila">
          <input type="hidden" id="proyectoFila">
          <input type="hidden" id="capFila">

          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="cod" class="form-label">Código Material:</label>
              <input type="text" id="cod" class="form-control">
            </div>
            <div class="col-md-6 mb-3">
              <label for="material" class="form-label">Material:</label>
              <input type="text" id="material" class="form-control">
            </div>
            <div class="col-md-4 mb-3">
              <label for="unidad" class="form-label">Unidad:</label>
              <input type="text" id="unidad" class="form-control">
            </div>
            <div class="col-md-4 mb-3">
              <label for="cantidad" class="form-label">Cantidad:</label>
              <input type="number" id="cantidad" class="form-control" min="0" step="0.01">
            </div>
            <div class="col-md-4 mb-3">
              <label for="precio" class="form-label">Precio:</label>
              <input type="number" id="precio" class="form-control" min="0" step="0.01">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnActualizarPresupuesto">Actualizar</button>
      </div>
    </div>
  </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
let listaPresupuestos = [];
let datosAgrupados = {};

// Importar Excel y previsualizar datos
$("#formImportar").on("submit", function (e) {
  e.preventDefault();

  const archivo = $("#archivo_excel")[0].files[0];
  if (!archivo) {
    alert("Por favor selecciona un archivo Excel.");
    return;
  }

  const formData = new FormData();
  formData.append("archivo_excel", archivo);

  $("#resultado").html(`<div class="text-info">Procesando archivo... ⏳</div>`);
  $("#tablaPreview").html("");
  $("#accionesFinales").hide();
  $("#resumenImportacion").hide();

  $.ajax({
    url: "../PresupuestoController.php?action=importPreview",
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    dataType: "json",
    success: function (data) {
      if (!data.ok) {
        $("#resultado").html(
          `<div class="alert alert-danger">Error: ${
            data.error || "No se pudo procesar el archivo."
          }</div>`
        );
        return;
      }

      // Ahora data.filas viene con la nueva estructura del repository
      listaPresupuestos = data.filas;
      console.log("✅ Datos cargados con nombres y precios:", listaPresupuestos);

      // Mostrar resumen
      $("#totalFilas").text(data.resumen.total_filas);
      $("#filasValidas").text(data.resumen.filas_validas);
      $("#filasErrores").text(data.resumen.filas_con_error);
      $("#valorTotal").text(formatCurrency(data.resumen.valor_total));
      $("#resumenImportacion").fadeIn();

      $("#resultado").html(
        `<div class="alert alert-success">Archivo procesado correctamente. ${data.resumen.filas_validas} filas válidas de ${data.resumen.total_filas}.</div>`
      );

      agruparDatosPorCapitulo();
      renderTablaComoPDF();
      $("#accionesFinales").fadeIn();
    },
    error: function (xhr, status, error) {
      $("#resultado").html(
        `<div class="alert alert-danger">Error al procesar: ${error}</div>`
      );
      console.error("Error:", xhr.responseText);
    },
  });
});

// Agrupar datos por proyecto y capítulo
function agruparDatosPorCapitulo() {
  datosAgrupados = {};
  
  listaPresupuestos.forEach((fila, index) => {
    // Ahora usamos la nueva estructura de datos
    const proyecto = fila.proyecto || 'Sin Proyecto';
    const cap = fila.capitulo || 'Sin CAP';
    
    if (!datosAgrupados[proyecto]) {
      datosAgrupados[proyecto] = {};
    }
    
    if (!datosAgrupados[proyecto][cap]) {
      datosAgrupados[proyecto][cap] = [];
    }
    
    fila.indexOriginal = index;
    datosAgrupados[proyecto][cap].push(fila);
  });
}

// Renderizar tabla como en el PDF CON AGRUPACIÓN POR CAPÍTULOS
function renderTablaComoPDF() {
  let html = '';
  let contadorGlobal = 1;
  let totalGeneral = 0;
  const subtotalesPorProyecto = {};

  // Recorrer cada proyecto
  Object.keys(datosAgrupados).forEach(proyecto => {
    let subtotalProyecto = 0;
    
    html += `<div class="table-responsive mb-4">`;
    html += `<table class="table table-bordered table-sm" style="font-size: 0.85rem;">`;
    
    // Encabezado de la tabla
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
    
    // Nombre del proyecto (como en el PDF)
    html += `<tr class="table-primary fw-bold">`;
    html += `<td colspan="9">${proyecto}</td>`;
    html += `</tr>`;
    
    // Recorrer capítulos y items
    Object.keys(datosAgrupados[proyecto]).sort().forEach(cap => {
      const items = datosAgrupados[proyecto][cap];
      let subtotalCapitulo = 0;
      
      items.forEach((item, index) => {
        // Usar los nuevos nombres de campos del repository
        const precio = parseFloat(item.precio_unitario) || 0;
        const cantidad = parseFloat(item.cantidad) || 0;
        const total = precio * cantidad;
        subtotalCapitulo += total;
        subtotalProyecto += total;
        
        // Determinar clase de fila según si tiene errores
        const claseFila = item.ok ? '' : 'table-danger';
        
        html += `<tr class="${claseFila}" data-index="${item.indexOriginal}">`;
        html += `<td class="text-center">${contadorGlobal++}</td>`;
        html += `<td>${item.material_codigo || ''}</td>`;
        html += `<td>${item.material_nombre || ''}</td>`;
        html += `<td class="text-center">${item.unidad || ''}</td>`;
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

        // Mostrar errores debajo de la fila si los hay
        if (!item.ok && item.errores && item.errores.length > 0) {
          html += `<tr class="table-danger">`;
          html += `<td colspan="9" class="small text-danger">`;
          html += `<strong>Errores:</strong> ${item.errores.join(', ')}`;
          html += `</td>`;
          html += `</tr>`;
        }
      });
      
      // Subtotal del capítulo
      html += `<tr class="table-secondary">`;
      html += `<td colspan="6" class="text-end fw-bold">Subtotal Capítulo ${cap}</td>`;
      html += `<td class="text-end fw-bold">${formatCurrency(subtotalCapitulo)}</td>`;
      html += `<td colspan="2"></td>`;
      html += `</tr>`;
    });
    
    // Subtotal del proyecto
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

  // Mostrar subtotales por proyecto si hay más de uno
  if (Object.keys(subtotalesPorProyecto).length > 1) {
    html += `<div class="table-responsive mb-3">`;
    html += `<table class="table table-bordered table-sm" style="font-size: 0.85rem; width: auto; margin-left: auto;">`;
    html += `<thead class="table-info">`;
    html += `<tr><th colspan="2" class="text-center">SUBTOTALES POR PROYECTO</th></tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    
    Object.keys(subtotalesPorProyecto).forEach(proyecto => {
      html += `<tr>`;
      html += `<td class="text-end fw-bold">${proyecto}</td>`;
      html += `<td class="text-end">${formatCurrency(subtotalesPorProyecto[proyecto])}</td>`;
      html += `</tr>`;
    });
    
    html += `</tbody>`;
    html += `</table>`;
    html += `</div>`;
  }

  // Totales generales (como en el PDF)
  html += `<div class="table-responsive">`;
  html += `<table class="table table-bordered table-sm" style="font-size: 0.85rem; width: auto; margin-left: auto;">`;
  html += `<tbody>`;
  
  // Calcular totales AIU
  const administracion = totalGeneral * 0.21;
  const imprevistos = totalGeneral * 0.01;
  const utilidad = totalGeneral * 0.08;
  const totalAIU = administracion + imprevistos + utilidad;
  const iva = totalAIU * 0.19;
  const totalPresupuesto = totalGeneral + totalAIU + iva;
  
  html += `<tr class="fw-bold">`;
  html += `<td class="text-end">Total</td>`;
  html += `<td class="text-end">${formatCurrency(totalGeneral)}</td>`;
  html += `</tr>`;
  
  html += `<tr>`;
  html += `<td class="text-end">Administración</td>`;
  html += `<td class="text-end">${formatCurrency(administracion)}</td>`;
  html += `</tr>`;
  
  html += `<tr>`;
  html += `<td class="text-end">Imprevistos</td>`;
  html += `<td class="text-end">${formatCurrency(imprevistos)}</td>`;
  html += `</tr>`;
  
  html += `<tr>`;
  html += `<td class="text-end">Utilidad</td>`;
  html += `<td class="text-end">${formatCurrency(utilidad)}</td>`;
  html += `</tr>`;
  
  html += `<tr class="table-warning fw-bold">`;
  html += `<td class="text-end">TOTAL AIU</td>`;
  html += `<td class="text-end">${formatCurrency(totalAIU)}</td>`;
  html += `</tr>`;
  
  html += `<tr>`;
  html += `<td class="text-end">IVA</td>`;
  html += `<td class="text-end">${formatCurrency(iva)}</td>`;
  html += `</tr>`;
  
  html += `<tr class="table-primary fw-bold">`;
  html += `<td class="text-end">TOTAL PRESUPUESTO</td>`;
  html += `<td class="text-end">${formatCurrency(totalPresupuesto)}</td>`;
  html += `</tr>`;
  
  html += `</tbody>`;
  html += `</table>`;
  html += `</div>`;

  $("#tablaPreview").html(html);
}

// Funciones de formato
function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Editar fila
$(document).on("click", ".btn-editar", function () {
  const index = $(this).data("index");
  const proyecto = $(this).data("proyecto");
  const cap = $(this).data("cap");
  const fila = listaPresupuestos[index];

  $("#indexFila").val(index);
  $("#proyectoFila").val(proyecto);
  $("#capFila").val(cap);
  $("#cod").val(fila.material_codigo);
  $("#material").val(fila.material_nombre);
  $("#unidad").val(fila.unidad);
  $("#cantidad").val(fila.cantidad);
  $("#precio").val(fila.precio_unitario);

  $("#modalPresupuesto").modal("show");
});

// Guardar cambios del modal
$("#btnActualizarPresupuesto").on("click", function () {
  const index = $("#indexFila").val();
  const proyecto = $("#proyectoFila").val();
  const cap = $("#capFila").val();

  listaPresupuestos[index].material_codigo = $("#cod").val();
  listaPresupuestos[index].material_nombre = $("#material").val();
  listaPresupuestos[index].unidad = $("#unidad").val();
  listaPresupuestos[index].cantidad = $("#cantidad").val();
  listaPresupuestos[index].precio_unitario = $("#precio").val();

  $("#modalPresupuesto").modal("hide");
  
  // Reagrupar y renderizar
  agruparDatosPorCapitulo();
  renderTablaComoPDF();
});

// Eliminar fila
$(document).on("click", ".btn-eliminar", function () {
  const index = $(this).data("index");
  if (confirm("¿Seguro que deseas eliminar esta fila?")) {
    listaPresupuestos.splice(index, 1);
    agruparDatosPorCapitulo();
    renderTablaComoPDF();
  }
});

// Guardar en base de datos
$("#btnCargarBD").on("click", function () {
  const btn = $(this);
  btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status"></span> Guardando...');

  $.ajax({
    url: "../PresupuestoController.php?action=guardarPresupuestos",
    type: "POST",
    data: {
      presupuestos: JSON.stringify(listaPresupuestos)
    },
    dataType: "json",
    success: function (data) {
      if (data.ok) {
        alert("✅ Presupuestos guardados correctamente");
        location.reload();
      } else {
        alert("❌ Error: " + (data.mensaje || "No se pudieron guardar los datos"));
      }
    },
    error: function (xhr, status, error) {
      alert("❌ Error al guardar: " + error);
    },
    complete: function () {
      btn.prop("disabled", false).html("Guardar Presupuestos");
    }
  });
});
</script>
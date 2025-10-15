<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
  <form id="formImportar" enctype="multipart/form-data" class="mt-3 border p-3 rounded shadow-sm bg-light">
    <!-- 🔹 Título arriba -->
    <h4 class="mb-3">Importar Presupuesto Masivo</h4>

    <!-- 🔹 Campo de archivo -->
    <div class="form-group mb-3">
      <label for="archivo_excel">Archivo Excel (.xlsx):</label>
      <input type="file" name="archivo_excel" id="archivo_excel" class="form-control" accept=".xlsx" required>
    </div>

    <div class="text-end mb-3">
      <button type="submit" class="btn btn-success">
        Importar Datos
      </button>
    </div>

    <!-- 🔹 Descripción / aviso abajo del formulario -->
    <div class="alert alert-info mb-0" role="alert" style="font-size: 0.9rem;">
      Sube un archivo Excel con el formato correcto 
      (<b>Proyecto</b>, <b>Presupuesto</b>, <b>CAP</b>, <b>COD</b>, <b>Cantidad</b>...)
    </div>
  </form>

  <div id="resultado" class="mt-4"></div>
  <div id="tablaPreview" class="mt-4"></div>

  <div id="accionesFinales" class="mt-4 text-end" style="display: none;">
    <button id="btnCargarBD" class="btn btn-primary">
      Guardar Presupuestos
    </button>
  </div>
</div>


<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
$("#formImportar").on("submit", function(e) {
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
  $("#accionesFinales").hide(); // Ocultar botón si se vuelve a subir otro archivo

  $.ajax({
    url: "../PresupuestoController.php?action=importPreview",
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    dataType: "json",
    success: function(data) {
      if (!data.ok) {
        $("#resultado").html(`<div class="alert alert-danger"> Error: ${data.mensaje || "No se pudo procesar el archivo."}</div>`);
        return;
      }

      $("#resultado").html(`<div class="alert alert-success">Archivo procesado correctamente. ${data.filas.length} filas leídas.</div>`);
      renderTabla(data.filas);

      // 🔹 Mostrar botón de carga después de renderizar la tabla
      $("#accionesFinales").fadeIn();
    },
    error: function(xhr, status, error) {
      $("#resultado").html(`<div class="alert alert-danger">Error al procesar: ${error}</div>`);
      console.error("Error:", xhr.responseText);
    }
  });
});

function renderTabla(filas) {
  if (!filas || !filas.length) {
    $("#tablaPreview").html(`<div class="alert alert-warning">El archivo no contiene datos válidos.</div>`);
    return;
  }

  let html = `
    <table id="previewTable" class="table table-striped table-bordered table-sm">
      <thead>
        <tr>
          <th>#</th>
          <th>CAP</th>
          <th>COD</th>
          <th>Cantidad</th>
          <th>id_capitulo</th>
          <th>id_material</th>
          <th>id_mat_precio</th>
          <th>Estado</th>
          <th>Errores</th>
        </tr>
      </thead>
      <tbody>
  `;

  $.each(filas, function(i, fila) {
    const color = fila.ok ? "" : "style='background-color:#ffe6e6;'";
    html += `
      <tr ${color}>
        <td>${i + 1}</td>
        <td>${fila.CAP || ""}</td>
        <td>${fila.COD || ""}</td>
        <td>${fila.Cantidad || ""}</td>
        <td>${fila.id_capitulo || ""}</td>
        <td>${fila.id_material || ""}</td>
        <td>${fila.id_mat_precio || ""}</td>
        <td>${fila.ok ? "Correcto" : "Error"}</td>
        <td>${(fila.errores && fila.errores.join("<br>")) || ""}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  $("#tablaPreview").html(html);

  $("#previewTable").DataTable({
    paging: true,
    searching: true,
    ordering: true,
    pageLength: 10,
    language: {
      search: "Buscar:",
      lengthMenu: "Mostrar _MENU_ filas",
      info: "Mostrando _START_ a _END_ de _TOTAL_ filas",
      paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
      }
    }
  });
}

// 🔹 Evento futuro para cargar los datos a la BD (placeholder)
$(document).on("click", "#btnCargarBD", function() {
  alert("Aquí irá la lógica para guardar los datos en la base de datos 😎");
});
</script>

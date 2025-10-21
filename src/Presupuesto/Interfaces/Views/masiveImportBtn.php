<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">

  <!-- Card principal para importar Excel -->
  <div class="card shadow-sm border-light">
    <div class="card-header bg-primary text-white">
      <h4 class="mb-0">Importar Presupuesto Masivo</h4>
    </div>
    <div class="card-body">

      <form id="formImportar" enctype="multipart/form-data">
        <!-- Select de proyecto -->
        <div class="mb-3">
          <label for="id_proyecto" class="form-label">Seleccionar Proyecto:</label>
          <select id="id_proyecto" class="form-select" required>
            <option value="">Cargando proyectos...</option>
          </select>
        </div>

        <div class="mb-3">
          <label for="archivo_excel" class="form-label">Archivo Excel (.xlsx):</label>
          <input type="file" name="archivo_excel" id="archivo_excel" class="form-control" accept=".xlsx" required>
        </div>

        <div class="text-end mb-3">
          <button type="submit" class="btn btn-success">
            <i class="bi bi-upload me-1"></i> Importar Datos
          </button>
        </div>

        <div class="text-muted small mb-0">
          Sube un archivo Excel con el formato correcto 
          (<b>Presupuesto</b>, <b>CAP</b>, <b>COD</b>, <b>Cantidad</b>...)
        </div>
      </form>

      <!-- Resumen de importación -->
      <div id="resumenImportacion" class="mt-4" style="display: none;">
        <div class="card border-success shadow-sm">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">Resumen de Importación</h5>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-3"><strong>Total Filas:</strong> <span id="totalFilas">0</span></div>
              <div class="col-md-3"><strong>Válidas:</strong> <span id="filasValidas" class="text-success">0</span></div>
              <div class="col-md-3"><strong>Con Errores:</strong> <span id="filasErrores" class="text-danger">0</span></div>
              <div class="col-md-3"><strong>Valor Total:</strong> <span id="valorTotal">$0.00</span></div>
            </div>
            <div id="mensajeResultado" class="mt-2"></div>
          </div>
        </div>
      </div>

      <!-- Tabla de preview -->
      <div id="tablaPreview" class="mt-4"></div>

      <!-- Acciones finales -->
      <div id="accionesFinales" class="mt-4 text-end" style="display: none;">
        <button id="btnCargarBD" class="btn btn-primary">
          <i class="bi bi-save me-1"></i> Guardar Presupuestos
        </button>
      </div>

    </div>
  </div>

  <!-- Modal Editar Presupuesto -->
  <div class="modal fade" id="modalPresupuesto" tabindex="-1" aria-labelledby="modalPresupuestoLabel" aria-hidden="true">
    <div class="modal-dialog modal-md modal-dialog-centered">
      <div class="modal-content shadow-lg border-0">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title fw-bold">
            <i class="bi bi-pencil-square me-2"></i>Editar ítem
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>

        <div class="modal-body">
          <form id="formPresupuesto">
            <input type="hidden" id="indexFila">
            <input type="hidden" id="proyectoFila">
            <input type="hidden" id="capFila">

            <div class="row g-3">
              <!-- Material con scroll -->
              <div class="col-12">
                <label for="material" class="form-label fw-semibold">Material</label>
                <select id="material" class="form-select" size="" style="overflow-y:auto;">
                  <!-- Los materiales se cargarán aquí dinámicamente -->
                </select>
              </div>

              <!-- Cantidad -->
              <div class="col-12">
                <label for="cantidad" class="form-label fw-semibold mt-2">Cantidad</label>
                <input type="number" id="cantidad" class="form-control" min="0" step="0.01">
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            Cancelar
          </button>
          <button type="button" class="btn btn-success" id="btnActualizarPresupuesto">
            <i class="bi bi-check2-square me-1"></i> Actualizar
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
    const API_PRESUPUESTOS = '/sgigescomnew/src/Presupuesto/Interfaces/PresupuestoController.php';
    console.log('Ruta API:', API_PRESUPUESTOS);
</script>
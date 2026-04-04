<!-- ════════════════════════════════════════════════════════════════
     MODAL DE COTIZACIÓN COMPARATIVA
     Se incluye dentro de ordenesCompraView.php
     ════════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalCotizacion" tabindex="-1"
     data-bs-backdrop="static" data-bs-keyboard="false"
     aria-labelledby="modalCotizacionTitle" aria-modal="true" role="dialog">
  <div class="modal-dialog modal-fullscreen-xl-down modal-xl" style="max-width:96vw;">
    <div class="modal-content border-0 shadow-lg" style="border-radius:12px; overflow:hidden;">

      <!-- Header -->
      <div class="modal-header text-white py-3"
           style="background: linear-gradient(135deg, #00384A 0%, #005f7a 100%);">
        <div class="d-flex align-items-center gap-3">
          <div class="fs-3"><i class="bi bi-clipboard2-data-fill"></i></div>
          <div>
            <h5 class="modal-title mb-0 fw-bold" id="modalCotizacionTitle">
              Tabla Comparativa de Cotización
            </h5>
            <small class="opacity-75">Compare precios entre proveedores · Seleccione la mejor opción por recurso</small>
          </div>
        </div>
        <button type="button" class="btn-close btn-close-white ms-auto"
                data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <!-- Body -->
      <div class="modal-body p-0 d-flex flex-column" style="max-height: calc(100vh - 160px); overflow:hidden;">

        <!-- Barra de herramientas simplificada -->
        <div class="border-bottom px-4 py-3 bg-light d-flex flex-wrap align-items-center gap-3">
          
          <div class="d-flex align-items-center gap-2">
            <label class="fw-semibold text-nowrap small">
              <i class="bi bi-list-stars me-1"></i>Cotización seleccionada:
            </label>
            <select id="selectCotizacionExistente" class="form-select form-select-sm" style="min-width:300px;">
              <option value="">-- Seleccione una cotización --</option>
            </select>
          </div>

          <div class="vr d-none d-md-block"></div>

          <div class="d-flex gap-2 ms-auto">
            <button type="button" class="btn btn-sm btn-outline-success"
                    id="btnAutoSeleccionarMejor"
                    onclick="CotizacionModal._autoSeleccionarMejores()"
                    title="Seleccionar automáticamente el proveedor más barato entre los cotizados">
              <i class="bi bi-lightning-charge-fill me-1"></i>Auto-mejor precio
            </button>
          </div>
        </div>

        <!-- ── Contenido scrollable ─────────────────────────────── -->
        <div class="overflow-auto flex-grow-1 px-4 py-3">

          <!-- Instrucciones (se oculta si hay proveedores) -->
          <div id="instructivosCotizacion" class="alert alert-info d-flex gap-3 align-items-start mb-3">
            <i class="bi bi-info-circle-fill fs-5 flex-shrink-0 mt-1"></i>
            <div>
              <strong>¿Cómo funciona la cotización?</strong>
              <ol class="mb-0 mt-1 ps-3">
                <li>Agrega los <strong>proveedores</strong> con los que deseas cotizar.</li>
                <li>Introduce el <strong>precio unitario</strong> que cada proveedor ofrece por cada recurso.</li>
                <li>El sistema resaltará automáticamente el <strong>mejor precio</strong> (menor).</li>
                <li>Selecciona el <strong>proveedor ganador</strong> para cada recurso o usa <em>"Auto-mejor precio"</em>.</li>
                <li>Confirma para generar las <strong>órdenes de compra</strong> agrupadas por proveedor.</li>
              </ol>
            </div>
          </div>

          <!-- Tabla dinámica -->
          <div id="contenedorTablaCotizacion">
            <div class="text-center py-5 text-muted">
              <i class="bi bi-shop display-3 opacity-50"></i>
              <p class="mt-3">Agrega al menos un proveedor para comenzar la cotización</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer border-top py-3 px-4"
           style="background: #f8f9fa;">
        <!-- Resumen de asignación -->
        <div class="me-auto" style="min-width:280px;">
          <div class="small fw-semibold text-muted mb-1">Progreso de asignación</div>
          <div id="resumenCotizacion">
            <small class="text-muted">Agrega proveedores e ingresa precios</small>
          </div>
        </div>

        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          <i class="bi bi-x-circle me-1"></i>Cancelar
        </button>
        <button type="button" class="btn btn-success" id="btnConfirmarCotizacion" disabled>
          <i class="bi bi-check2-circle me-1"></i>Confirmar y generar órdenes
        </button>
      </div>
    </div>
  </div>
</div>

<!-- SheetJS para parsear Excel (importación de cotizaciones) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

<!-- ── CSS específico del modal de cotización ───────────────────── -->
<style>
  /* Tabla de cotización */
  #tablaCotizacion th,
  #tablaCotizacion td {
    vertical-align: middle;
    font-size: 0.85rem;
  }

  #tablaCotizacion .input-precio-cot {
    width: 90px;
    font-size: 0.82rem;
    text-align: right;
  }

  #tablaCotizacion .prov-col.table-success {
    background-color: #d1e7dd !important;
  }

  /* Animación de resaltado al cambiar mejor precio */
  .cot-celda.table-success {
    transition: background-color 0.3s ease;
  }

  /* Resumen footer */
  #resumenCotizacion .progress {
    height: 6px;
    border-radius: 3px;
  }

  /* Scrollbar personalizado para la tabla */
  #contenedorTablaCotizacion .table-responsive::-webkit-scrollbar {
    height: 6px;
  }
  #contenedorTablaCotizacion .table-responsive::-webkit-scrollbar-thumb {
    background: #adb5bd;
    border-radius: 3px;
  }

  /* Ancho mínimo del modal en desktop */
  @media (min-width: 1200px) {
    #modalCotizacion .modal-dialog {
      max-width: min(96vw, 1400px);
    }
  }
</style>

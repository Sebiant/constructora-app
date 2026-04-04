<!-- ════════════════════════════════════════════════════════════
     MODAL GESTIÓN DE COTIZACIONES — módulo Pedidos
     Se incluye al final de pedidoView.php
     ════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalCotizacionesPedido" tabindex="-1"
     aria-labelledby="modalCotizacionesPedidoLabel" aria-modal="true" role="dialog">
  <div class="modal-dialog modal-xl modal-dialog-centered" style="max-width:min(96vw,1100px)">
    <div class="modal-content border-0 shadow-lg" style="border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div class="modal-header text-white py-3"
           style="background:linear-gradient(135deg,#00384A 0%,#005f7a 100%);">
        <div class="d-flex align-items-center gap-3">
          <div class="fs-3"><i class="bi bi-clipboard2-data-fill"></i></div>
          <div>
            <h5 class="modal-title mb-0 fw-bold" id="modalCotizacionesPedidoLabel">
              Cotizaciones del Pedido
            </h5>
            <small class="opacity-75" id="labelNomPedidoCot">—</small>
          </div>
        </div>
        <button type="button" class="btn-close btn-close-white ms-auto"
                data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <!-- Body -->
      <div class="modal-body p-0">

        <!-- Toolbar de acciones -->
        <div class="d-flex flex-wrap align-items-center gap-3 px-4 py-3 border-bottom bg-light">

          <!-- Exportar plantilla -->
          <button type="button" class="btn btn-outline-primary btn-sm"
                  id="btnExportarPlantillaPedido"
                  title="Descarga el Excel con todos los recursos del pedido">
            <i class="bi bi-file-earmark-arrow-down me-1"></i>
            1. Exportar plantilla Excel
          </button>

          <!-- Flecha guía -->
          <i class="bi bi-arrow-right text-muted d-none d-md-inline"></i>

          <!-- Subir Excel con precios -->
          <label class="btn btn-outline-success btn-sm mb-0"
                 for="inputSubirCotizacion"
                 title="Sube el Excel con los precios de los proveedores">
            <i class="bi bi-file-earmark-arrow-up me-1"></i>
            2. Importar precios (Excel)
          </label>
          <input type="file" id="inputSubirCotizacion" accept=".xlsx,.xls" class="d-none">

        </div>

        <!-- Sección: instrucciones rápidas -->
        <div class="alert alert-info d-flex gap-3 align-items-start rounded-0 mb-0 border-0 border-bottom px-4 py-3">
          <i class="bi bi-info-circle-fill fs-5 flex-shrink-0 mt-1"></i>
          <div class="small">
            <strong>Flujo de cotización:</strong>
            <ol class="mb-0 mt-1 ps-3">
              <li>Exporta la plantilla Excel → compártela con tus proveedores para que llenen los precios.</li>
              <li>Cuando tengas los precios, escríbelos en el Excel (columnas de precio por proveedor).</li>
              <li>Importa el Excel → el sistema guarda la cotización automáticamente.</li>
              <li>Al generar la Orden de Compra, el sistema te mostrará las cotizaciones para seleccionar la mejor opción.</li>
            </ol>
          </div>
        </div>

        <!-- Lista de cotizaciones existentes -->
        <div class="px-4 py-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-list-check me-1"></i>Cotizaciones guardadas
            </h6>
            <span class="badge bg-secondary" id="badgeTotalCotizaciones">0</span>
          </div>

          <div id="listaCotizacionesPedido">
            <div class="text-center text-muted py-4">
              <i class="bi bi-inbox display-4 opacity-50"></i>
              <p class="mt-2">No hay cotizaciones para este pedido</p>
              <small>Exporta la plantilla, llénala con los precios y súbela para crear la primera cotización.</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="bi bi-x-circle me-1"></i>Cerrar
        </button>
      </div>
    </div>
  </div>
</div>

<!-- SheetJS para parsear Excel -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<!-- Script de gestión de cotizaciones en pedidos -->
<script src="/sgigescon/src/Cotizacion/Interfaces/Views/cotizacionesPedido.js"></script>

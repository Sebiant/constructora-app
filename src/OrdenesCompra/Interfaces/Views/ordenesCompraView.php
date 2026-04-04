<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
  <div class="card shadow border-0">
    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
      <h3 class="text-center mb-0">
        <i class="bi bi-clipboard-plus"></i> 
        Gestión de Órdenes de Compra
      </h3>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-light btn-sm" id="btnRefrescar">
          <i class="bi bi-arrow-repeat"></i> Refrescar
        </button>
        <button class="btn btn-success btn-sm" id="btnNuevaOrden">
          <i class="bi bi-plus-circle"></i> Nueva Orden
        </button>
      </div>
    </div>
    
    <div class="card-body bg-light">

      <?php
      include_once __DIR__ . '/../../../Shared/Components/notificaciones_pedidos.php';
      ?>
      
      <!-- Filtros de búsqueda -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <label class="form-label fw-bold">Estado</label>
          <select class="form-select" id="filterEstado">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="comprada">Compradas</option>
            <option value="recibida">Recibidas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
        
        <div class="col-md-3">
          <label class="form-label fw-bold">Proveedor</label>
          <div class="input-group">
            <select class="form-select" id="filterProveedor">
              <option value="">Todos los proveedores</option>
            </select>
            <button class="btn btn-outline-success" type="button" 
                    onclick="window.open('/sgigescon/ejemplos/provedoresComponent.php', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')"
                    title="Abrir gestión de proveedores en nueva ventana">
              <i class="bi bi-plus-circle"></i> Gestionar
            </button>
          </div>
        </div>
        
        <div class="col-md-3">
          <label class="form-label fw-bold">Fecha (desde)</label>
          <input type="date" class="form-control" id="fechaDesde" />
        </div>
        
        <div class="col-md-3">
          <label class="form-label fw-bold">Fecha (hasta)</label>
          <input type="date" class="form-control" id="fechaHasta" />
        </div>
      </div>
      
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <input type="text" class="form-control" id="searchInput" 
                   placeholder="Buscar por número de orden, pedido, factura..." />
            <button class="btn btn-outline-secondary" id="btnBuscar">
              <i class="bi bi-search"></i> Buscar
            </button>
          </div>
        </div>
        <div class="col-md-6 text-end">
          <span class="text-muted" id="contadorOrdenes">
            Cargando órdenes...
          </span>
        </div>
      </div>

      <!-- Tabla principal de órdenes de compra -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <strong>Órdenes de Compra</strong>
          <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-secondary active" data-view="tabla">
              <i class="bi bi-table"></i> Tabla
            </button>
            <button type="button" class="btn btn-outline-secondary" data-view="tarjetas">
              <i class="bi bi-grid-3x3-gap"></i> Tarjetas
            </button>
          </div>
        </div>
        
        <div class="card-body p-0">
          <!-- Vista de tabla -->
          <div id="vistaTabla" class="table-responsive">
            <table class="table table-hover mb-0" id="tablaOrdenes">
              <thead class="table-dark">
                <tr>
                  <th>N° Orden</th>
                  <th>Pedido</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Factura</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody id="tablaOrdenesBody">
                <tr>
                  <td colspan="8" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <p class="mb-0 mt-2">Cargando órdenes de compra...</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Vista de tarjetas -->
          <div id="vistaTarjetas" class="p-3 d-none">
            <div class="row g-3" id="contenedorTarjetas">
              <!-- Las tarjetas se generarán dinámicamente -->
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de resumen -->
      <div class="row mt-4">
        <div class="col-md-3">
          <div class="card border-0 bg-info text-white">
            <div class="card-body text-center">
              <h5 class="card-title mb-1" id="totalPendientes">0</h5>
              <p class="card-text mb-0">Pendientes</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-warning text-white">
            <div class="card-body text-center">
              <h5 class="card-title mb-1" id="totalAprobadas">0</h5>
              <p class="card-text mb-0">Aprobadas</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-success text-white">
            <div class="card-body text-center">
              <h5 class="card-title mb-1" id="totalCompradas">0</h5>
              <p class="card-text mb-0">Compradas</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-primary text-white">
            <div class="card-body text-center">
              <h5 class="card-title mb-1" id="montoTotal">$0</h5>
              <p class="card-text mb-0">Monto Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal para crear/editar orden de compra -->
<div class="modal fade" id="modalOrdenCompra" tabindex="-1" data-bs-backdrop="static">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title" id="modalOrdenTitle">
          <i class="bi bi-clipboard-plus"></i> Nueva Orden de Compra
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      
      <div class="modal-body">
        <form id="formOrdenCompra">
          <!-- Información básica -->
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <label class="form-label fw-bold">Pedido Origen *</label>
              <select class="form-select" id="idPedido" required>
                <option value="">Seleccione un pedido...</option>
              </select>
              <div class="form-text">Seleccione el pedido que originará esta orden</div>
            </div>

            <div class="col-md-6 d-flex flex-column justify-content-end">
              <!-- Botón para seleccionar cotización -->
              <button type="button" class="btn btn-outline-success" id="btnAbrirCotizacion" disabled
                      style="border-width: 2px;">
                <i class="bi bi-clipboard2-check-fill me-2"></i>Aplicar Cotización de Proveedores
              </button>
              <div class="form-text">Usa una de las cotizaciones importadas en el módulo de pedidos para este pedido</div>
            </div>
          </div>

          <!-- Panel de resumen de cotización (aparece después de confirmar cotización) -->
          <div id="panelResumenCotizacion" class="d-none mb-4">
            <div class="card border-0 shadow-sm" style="border-left:4px solid #00384A !important;">
              <div class="card-header d-flex justify-content-between align-items-center"
                   style="background:linear-gradient(135deg,#00384A,#005f7a); color:white;">
                <span class="fw-bold">
                  <i class="bi bi-clipboard2-check-fill me-2"></i>Cotización Confirmada
                </span>
                <button type="button" class="btn btn-sm btn-outline-light" id="btnReabrirCotizacion">
                  <i class="bi bi-pencil me-1"></i>Editar
                </button>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-sm mb-0" id="tablaResumenCot">
                    <thead class="table-light">
                      <tr>
                        <th>Proveedor</th>
                        <th class="text-center">N° Recursos</th>
                        <th class="text-end">Subtotal Estimado</th>
                        <th class="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="tablaResumenCotBody">
                      <tr><td colspan="4" class="text-center text-muted py-3">Sin datos</td></tr>
                    </tbody>
                    <tfoot class="table-light fw-bold">
                      <tr>
                        <td colspan="2">Total general:</td>
                        <td class="text-end" id="totalGeneralCot">$0.00</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Productos del pedido -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <strong>Productos del Pedido</strong>
              <span class="badge bg-primary" id="contadorProductos">0 productos</span>
            </div>
            
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm" id="tablaProductos">
                  <thead class="table-light">
                    <tr>
                      <th width="5%">
                        <input type="checkbox" id="selectAll" />
                      </th>
                      <th>Producto</th>
                      <th class="text-center">Unidad</th>
                      <th class="text-center">Solicitada</th>
                      <th class="text-center">Comprada</th>
                      <th class="text-center">Disponible</th>
                      <th class="text-center">A Comprar</th>
                      <th class="text-center">Desperdicio</th>
                      <th class="text-end">Precio Unitario</th>
                      <th class="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody id="tablaProductosBody">
                    <tr>
                      <td colspan="10" class="text-center py-3 text-muted">
                        Seleccione un pedido para ver sus productos
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Totales -->
          <div class="row">
            <div class="col-md-6">
              <label class="form-label fw-bold">Observaciones</label>
              <textarea class="form-control" id="observaciones" rows="3" 
                        placeholder="Observaciones adicionales..."></textarea>
            </div>
            
            <div class="col-md-6">
              <div class="card border-0 bg-light">
                <div class="card-body">
                  <div class="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <strong id="subtotalOrden">$0.00</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Impuestos:</span>
                    <strong id="impuestosOrden">$0.00</strong>
                  </div>
                  <hr>
                  <div class="d-flex justify-content-between">
                    <h5 class="mb-0">Total:</h5>
                    <h5 class="mb-0 text-primary" id="totalOrden">$0.00</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="bi bi-x-circle"></i> Cancelar
        </button>
        <button type="button" class="btn btn-success" id="btnGuardarOrden" disabled>
          <i class="bi bi-check2-circle me-1"></i>Generar Orden(es) de Compra
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Modal para ver detalles de orden -->
<div class="modal fade" id="modalDetalleOrden" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">
          <i class="bi bi-eye"></i> Detalles de Orden de Compra
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      
      <div class="modal-body" id="contenidoDetalle">
        <!-- Contenido dinámico -->
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>
    </div>
  </div>
</div>

<?php include_once __DIR__ . '/cotizacionModal.php'; ?>


<script>
// Recargar proveedores cuando la ventana recupere el foco
// (útil cuando se cierra la ventana de gestión de proveedores)
window.addEventListener('focus', function() {
  console.log('Ventana recuperó el foco, recargando proveedores...');
  if (typeof OrdenesCompraUI !== 'undefined' && typeof OrdenesCompraUI.cargarProveedores === 'function') {
    OrdenesCompraUI.cargarProveedores();
  } else if (typeof cargarProveedores === 'function') {
    cargarProveedores();
  }
});
</script>

<!-- Scripts del módulo de órdenes de compra -->
<script src="/sgigescon/src/OrdenesCompra/Interfaces/Views/cotizacionModal.js"></script>
<!-- Script included via component wrapper -->
<?php include_once __DIR__ . '/../../../Shared/Components/footer.php'; ?>

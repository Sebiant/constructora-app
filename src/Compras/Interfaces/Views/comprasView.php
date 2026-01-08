<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
  <div class="card shadow border-0">
    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
      <h3 class="text-center mb-0"><i class="bi bi-bag-check"></i> Compras - Órdenes de Compra</h3>
      <button class="btn btn-outline-light btn-sm" id="btnRefrescar"><i class="bi bi-arrow-repeat"></i> Refrescar</button>
    </div>
    <div class="card-body bg-light">
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label class="form-label fw-bold">Proyecto</label>
            <select class="form-select" id="filterProyecto">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold">Buscar</label>
            <div class="input-group">
              <input type="text" class="form-control" id="searchInput" placeholder="ID pedido, proyecto, observaciones..." />
              <button class="btn btn-outline-secondary" id="btnBuscar"><i class="bi bi-search"></i></button>
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold">Fecha (desde / hasta)</label>
            <div class="input-group">
              <input type="date" class="form-control" id="fechaDesde" />
              <input type="date" class="form-control" id="fechaHasta" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-lg-7">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-light">
                <strong>Órdenes para comprar</strong>
                <span class="text-muted small" id="contadorPedidos"></span>
              </div>
              <div class="card-body" id="listaPedidos" style="min-height: 240px;"></div>
            </div>

            <div class="card border-0 shadow-sm mt-3">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <strong>Historial de compras</strong>
                <button class="btn btn-outline-secondary btn-sm" id="btnRefrescarCompras">
                  <i class="bi bi-arrow-repeat"></i> Refrescar
                </button>
              </div>
              <div class="card-body">
                <div class="row g-2 mb-2">
                  <div class="col-md-4">
                    <label class="form-label fw-bold">Proyecto</label>
                    <select class="form-select" id="filterProyectoCompras">
                      <option value="">Todos</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-bold">Buscar</label>
                    <input type="text" class="form-control" id="searchCompras" placeholder="# compra, # pedido, provedor, factura..." />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-bold">Fecha (desde / hasta)</label>
                    <div class="input-group">
                      <input type="date" class="form-control" id="fechaDesdeCompras" />
                      <input type="date" class="form-control" id="fechaHastaCompras" />
                    </div>
                  </div>
                </div>

                <div class="table-responsive" style="max-height: 320px; overflow:auto;">
                  <table class="table table-sm table-hover align-middle">
                    <thead class="table-light" style="position: sticky; top: 0; z-index: 1;">
                      <tr>
                        <th>#</th>
                        <th>Pedido</th>
                        <th>Proveedor</th>
                        <th>Fecha</th>
                        <th class="text-end">Total</th>
                        <th>Factura</th>
                        <th>Estado</th>
                        <th class="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="tablaCompras">
                      <tr>
                        <td colspan="8" class="text-center text-muted py-4">Cargando historial...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-light">
                <strong>Detalle y registro de compra</strong>
              </div>
              <div class="card-body">
                <div id="detallePedido" class="mb-3">
                  <div class="text-muted">Seleccione una orden de compra para ver el detalle.</div>
                </div>

                <hr />

                <form id="formCompra">
                  <input type="hidden" id="idOrdenCompra" />

                  <div class="mb-2">
                    <label class="form-label fw-bold">N° Factura *</label>
                    <input class="form-control" id="numeroFactura" required />
                  </div>

                  <div class="row g-2 mt-1">
                    <div class="col-md-6">
                      <label class="form-label">Total compra <small class="text-muted">(autocalculado, editable)</small></label>
                      <input type="number" class="form-control" id="totalCompra" step="0.01" min="0" placeholder="0.00" />
                    </div>
                  </div>

                  <div class="mb-2 mt-3">
                    <label class="form-label fw-bold">Proveedor</label>
                    <input type="text" class="form-control" id="proveedorOrden" disabled placeholder="—" />
                  </div>

                  <div class="mt-3">
                    <label class="form-label fw-bold mb-2">Recepción de Items</label>
                    <div class="alert alert-info py-2">
                      <small><i class="bi bi-info-circle"></i> Marque qué items llegaron complete. Si algo falta, se generará automáticamente una orden complementaria.</small>
                    </div>
                    <div id="itemsRecepcion" class="border rounded p-2" style="max-height: 400px; overflow-y: auto; overflow-x: hidden;">
                      <div class="text-muted text-center py-3">Seleccione una orden de compra para ver los items</div>
                    </div>
                  </div>

                  <div class="mt-2">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-control" id="observaciones" rows="2"></textarea>
                  </div>

                  <div class="d-flex gap-2 mt-3">
                    <button type="submit" class="btn btn-success" id="btnGuardarCompra" disabled>
                      <i class="bi bi-save"></i> Registrar compra
                    </button>
                  </div>
                </form>

                </div>
            </div>
          </div>
        </div>

        <div class="modal fade" id="modalDetalleCompra" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Detalle de compra #<span id="detalleCompraId">-</span></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div id="detalleCompraContenido" class="text-muted">Cargando...</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>

    </div>
  </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
  const API_COMPRAS = '/sgigescomnew/src/Compras/Interfaces/ComprasController.php';
</script>

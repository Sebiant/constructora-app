<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container mt-4">
  <div class="card shadow border-0">
    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
      <h3 class="text-center mb-0"><i class="bi bi-bag-check"></i> Compras - Pedidos Aprobados</h3>
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
                <strong>Pedidos aprobados</strong>
                <span class="text-muted small" id="contadorPedidos"></span>
              </div>
              <div class="card-body" id="listaPedidos" style="min-height: 240px;"></div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-light">
                <strong>Detalle y registro de compra</strong>
              </div>
              <div class="card-body">
                <div id="detallePedido" class="mb-3">
                  <div class="text-muted">Seleccione un pedido para ver el detalle.</div>
                </div>

                <hr />

                <form id="formCompra">
                  <input type="hidden" id="idPedido" />

                  <div class="mb-2">
                    <label class="form-label fw-bold">Proveedor (para contacto) *</label>
                    <input class="form-control" id="proveedorNombre" required />
                  </div>

                  <div class="row g-2">
                    <div class="col-md-6">
                      <label class="form-label">Teléfono</label>
                      <input class="form-control" id="proveedorTelefono" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">WhatsApp</label>
                      <input class="form-control" id="proveedorWhatsapp" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Email</label>
                      <input type="email" class="form-control" id="proveedorEmail" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Contacto</label>
                      <input class="form-control" id="proveedorContacto" />
                    </div>
                  </div>

                  <div class="row g-2 mt-1">
                    <div class="col-md-6">
                      <label class="form-label">N° Factura</label>
                      <input class="form-control" id="numeroFactura" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Estado compra</label>
                      <select class="form-select" id="estadoCompra">
                        <option value="pendiente">Pendiente</option>
                        <option value="comprado">Comprado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div class="mt-2">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-control" id="observaciones" rows="2"></textarea>
                  </div>

                  <div class="d-flex gap-2 mt-3">
                    <button type="button" class="btn btn-outline-primary" id="btnContactar" disabled>
                      <i class="bi bi-telephone"></i> Contactar
                    </button>
                    <button type="submit" class="btn btn-success" id="btnGuardarCompra" disabled>
                      <i class="bi bi-save"></i> Registrar compra
                    </button>
                  </div>
                </form>

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

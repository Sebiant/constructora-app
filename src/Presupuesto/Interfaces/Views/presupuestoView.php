<?php
if (!defined('IS_COMPONENT')) {
    define('IS_COMPONENT', false);
}

if (!IS_COMPONENT): ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Presupuestos</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body>
<?php endif; ?>

<style>
  .action-btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
  }
</style>

<div class="container-fluid mt-4">
    <div class="card shadow border-0 mb-4">
        <div class="card-header bg-primary text-white">
            <h3 class="text-center mb-0">Gestión de Presupuestos</h3>
        </div>

        <div class="card-body bg-light">
            <!-- Botón crear presupuesto -->
            <div class="row mb-3">
                <div class="col-md-2 offset-md-10">
                    <button 
                        type="button" 
                        class="btn btn-info text-white w-100" 
                        onclick="mostrarModalCrearPresupuesto()">
                        <i class="bi bi-plus-circle"></i> Nuevo Presupuesto
                    </button>
                </div>
            </div>

            <!-- Tabla de presupuestos -->
            <div class="table-responsive">
                <table id="tablaPresupuestosCRUD" class="table table-bordered table-striped align-middle mb-0 w-100">
                    <thead class="table-info text-center">
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Fecha</th>
                            <th class="text-end">Monto Total</th>
                            <th>Estado</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- DataTable se encargará de esto -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Modal Crear / Editar Presupuesto -->
<div class="modal fade" id="modalPresupuestoCRUD" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content border-0 shadow">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title fw-bold">
          <i class="bi bi-plus-circle me-2"></i>Crear Nuevo Presupuesto
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <div class="modal-body bg-light">
        <form id="formPresupuestoCRUD">
          <input type="hidden" id="id_presupuesto_crud">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label fw-bold">Código *</label>
              <input type="text" id="codigo_presupuesto_crud" class="form-control" placeholder="Ej: PRES-2024-001" required>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label fw-bold">Nombre *</label>
              <input type="text" id="nombre_presupuesto_crud" class="form-control" placeholder="Ej: Presupuesto Obra" required>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label fw-bold">Fecha *</label>
              <input type="date" id="fecha_creacion_crud" class="form-control" required>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label fw-bold">Monto Total *</label>
              <input type="number" id="monto_total_crud" class="form-control" step="0.01" min="0" required placeholder="0.00">
            </div>
          </div>
          <div class="mb-3">
              <label class="form-label fw-bold">Observaciones</label>
              <textarea id="observaciones_crud" class="form-control" rows="3" placeholder="Observaciones adicionales"></textarea>
          </div>
        </form>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-info text-white" id="btnGuardarPresupuestoCRUD" onclick="guardarPresupuestoCRUD()">Guardar</button>
      </div>
    </div>
  </div>
</div>

<?php if (!IS_COMPONENT): ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/sgigescomnew/src/Presupuesto/Interfaces/Views/presupuestoView.js"></script>
</body>
</html>
<?php endif; ?>

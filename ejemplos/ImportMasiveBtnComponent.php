<?php
include $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/Presupuesto/Interfaces/Views/masiveImportBtn.php';
?>

<!-- Modal Crear Nuevo Presupuesto -->
<div class="modal fade" id="modalCrearPresupuesto" tabindex="-1" aria-labelledby="modalCrearPresupuestoLabel" aria-hidden="true">
  <div class="modal-dialog modal-md modal-dialog-centered">
    <div class="modal-content shadow-lg border-0">
      <div class="modal-header bg-success text-white">
        <h5 class="modal-title fw-bold">
          <i class="bi bi-plus-circle me-2"></i>Crear Nuevo Presupuesto
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <div class="modal-body">
        <form id="formCrearPresupuesto">
          <div class="row g-3">
            <!-- Código del Presupuesto -->
            <div class="col-md-6">
              <label for="codigo_presupuesto" class="form-label fw-bold">
                <i class="bi bi-tag me-1"></i>Código del Presupuesto *
              </label>
              <input type="text" id="codigo_presupuesto" class="form-control" placeholder="Ej: PRES-2024-001" required>
              <small class="text-muted">Código único de identificación</small>
            </div>

            <!-- Nombre del Presupuesto -->
            <div class="col-md-6">
              <label for="nombre_presupuesto" class="form-label fw-bold">
                <i class="bi bi-file-text me-1"></i>Nombre del Presupuesto *
              </label>
              <input type="text" id="nombre_presupuesto" class="form-control" placeholder="Ej: Presupuesto Obra Principal" required>
              <small class="text-muted">Nombre descriptivo del presupuesto</small>
            </div>

            <!-- Fecha de Creación -->
            <div class="col-md-6">
              <label for="fecha_creacion" class="form-label fw-bold">
                <i class="bi bi-calendar3 me-1"></i>Fecha de Creación *
              </label>
              <input type="date" id="fecha_creacion" class="form-control" required>
              <small class="text-muted">Fecha en que se crea el presupuesto</small>
            </div>

            <!-- Monto Total -->
            <div class="col-md-6">
              <label for="monto_total" class="form-label fw-bold">
                <i class="bi bi-currency-dollar me-1"></i>Monto Total *
              </label>
              <input type="number" id="monto_total" class="form-control" step="0.01" min="0.01" required>
              <small class="text-muted">Valor estimado del presupuesto</small>
            </div>

            <!-- Observaciones -->
            <div class="col-12">
              <label for="observaciones" class="form-label fw-bold">
                <i class="bi bi-chat-text me-1"></i>Observaciones
              </label>
              <textarea id="observaciones" class="form-control" rows="3" placeholder="Notas adicionales sobre el presupuesto..."></textarea>
              <small class="text-muted">Información adicional (opcional)</small>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="bi bi-x-circle me-1"></i>Cancelar
        </button>
        <button type="button" class="btn btn-success" id="btnGuardarPresupuesto" onclick="crearNuevoPresupuesto()">
          <i class="bi bi-check-circle me-1"></i>Crear Presupuesto
        </button>
      </div>
    </div>
  </div>
</div>

<!-- El script ya se incluye en el archivo principal, no se duplica aquí -->

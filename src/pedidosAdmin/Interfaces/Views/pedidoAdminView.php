<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administración de Pedidos</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
</head>
<body class="bg-light">
    <div class="container-fluid py-4">
        <!-- Header -->
        <div class="card shadow-lg mb-4">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0"><i class="bi bi-clipboard-check"></i> Panel de Administración de Pedidos</h4>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-12">
                        <p class="text-muted mb-0">
                            <i class="bi bi-info-circle"></i> 
                            Gestione y apruebe pedidos de todos los proyectos desde este panel centralizado
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estadísticas -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card shadow-sm border-start border-primary border-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">Total Pedidos</h6>
                                <h3 class="mb-0" id="statTotalPedidos">-</h3>
                            </div>
                            <div class="text-primary">
                                <i class="bi bi-cart-check display-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm border-start border-warning border-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">Pendientes</h6>
                                <h3 class="mb-0 text-warning" id="statPendientes">-</h3>
                            </div>
                            <div class="text-warning">
                                <i class="bi bi-clock-history display-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm border-start border-success border-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">Aprobados</h6>
                                <h3 class="mb-0 text-success" id="statAprobados">-</h3>
                            </div>
                            <div class="text-success">
                                <i class="bi bi-check-circle display-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm border-start border-danger border-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">Rechazados</h6>
                                <h3 class="mb-0 text-danger" id="statRechazados">-</h3>
                            </div>
                            <div class="text-danger">
                                <i class="bi bi-x-circle display-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros y Búsqueda -->
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0"><i class="bi bi-funnel"></i> Filtros y Búsqueda</h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label">Proyecto</label>
                        <select class="form-select" id="filterProyecto">
                            <option value="">Todos los proyectos</option>
                            <!-- Los proyectos se cargarán dinámicamente -->
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Estado</label>
                        <select class="form-select" id="filterEstado">
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="comprado">Comprado</option>
                            <option value="rechazado">Rechazado</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Fecha Desde</label>
                        <input type="date" class="form-control" id="filterFechaDesde">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Fecha Hasta</label>
                        <input type="date" class="form-control" id="filterFechaHasta">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Buscar</label>
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="ID, usuario..." id="searchInput">
                            <button class="btn btn-outline-secondary" type="button">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-12">
                        <button class="btn btn-primary" onclick="aplicarFiltros()">
                            <i class="bi bi-funnel-fill"></i> Aplicar Filtros
                        </button>
                        <button class="btn btn-secondary" onclick="limpiarFiltros()">
                            <i class="bi bi-x-circle"></i> Limpiar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla de Pedidos -->
        <div class="card shadow-sm">
            <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-list-ul"></i> Lista de Pedidos</h5>
                <span class="badge bg-light text-dark" id="contadorPedidos">0 pedidos</span>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover table-striped">
                        <thead class="table-primary">
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Proyecto</th>
                                <th>Usuario</th>
                                <th class="text-end">Total</th>
                                <th class="text-center">Estado</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tablaPedidos">
                            <tr>
                                <td colspan="7" class="text-center text-muted py-5">
                                    <i class="bi bi-inbox display-4"></i>
                                    <p class="mt-3">No hay pedidos para mostrar</p>
                                    <small>Seleccione filtros o espere a que se carguen los datos</small>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Paginación -->
                <nav aria-label="Paginación de pedidos">
                    <ul class="pagination justify-content-center" id="paginacion">
                        <li class="page-item disabled">
                            <a class="page-link" href="#" tabindex="-1">Anterior</a>
                        </li>
                        <li class="page-item active"><a class="page-link" href="#">1</a></li>
                        <li class="page-item"><a class="page-link" href="#">2</a></li>
                        <li class="page-item"><a class="page-link" href="#">3</a></li>
                        <li class="page-item">
                            <a class="page-link" href="#">Siguiente</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>

    <!-- Modal: Detalle del Pedido -->
    <div class="modal fade" id="modalDetallePedido" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="bi bi-file-earmark-text"></i> Detalle del Pedido #<span id="detallePedidoId">-</span>
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <!-- Información General -->
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <strong>Proyecto:</strong><br>
                            <span id="detalleProyecto" class="text-muted">-</span>
                        </div>
                        <div class="col-md-3">
                            <strong>Usuario:</strong><br>
                            <span id="detalleUsuario" class="text-muted">-</span>
                        </div>
                        <div class="col-md-3">
                            <strong>Fecha:</strong><br>
                            <span id="detalleFecha" class="text-muted">-</span>
                        </div>
                        <div class="col-md-3">
                            <strong>Total:</strong><br>
                            <span id="detalleTotal" class="text-success fw-bold">-</span>
                        </div>
                    </div>

                    <div class="row mb-4">
                        <div class="col-md-12">
                            <strong>Observaciones:</strong><br>
                            <p id="detalleObservaciones" class="text-muted fst-italic">-</p>
                        </div>
                    </div>

                    <hr>

                    <!-- Componentes del Pedido -->
                    <h6 class="mb-3"><i class="bi bi-box-seam"></i> Componentes del Pedido</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Componente</th>
                                    <th>Tipo</th>
                                    <th class="text-center">Cantidad</th>
                                    <th class="text-end">Precio Unit.</th>
                                    <th class="text-end">Subtotal</th>
                                    <th class="text-center">Estado de Compra</th>
                                    <th class="text-center">Cant. Comprada</th>
                                    <th class="text-center">Orden de Compra</th>
                                    <th class="text-center">Excedente</th>
                                </tr>
                            </thead>
                            <tbody id="detalleComponentes">
                                <tr>
                                    <td colspan="9" class="text-center text-muted">
                                        Los componentes se cargarán aquí
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pedidos Fuera de Presupuesto -->
                    <div id="seccionExcedentes" style="display: none;">
                        <hr>
                        <h6 class="mb-3 text-warning">
                            <i class="bi bi-exclamation-triangle-fill"></i> Pedidos Fuera de Presupuesto
                        </h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-warning">
                                    <tr>
                                        <th>Componente</th>
                                        <th class="text-center">Cantidad Extra</th>
                                        <th class="text-end">Subtotal</th>
                                        <th>Justificación</th>
                                    </tr>
                                </thead>
                                <tbody id="detalleExcedentes">
                                    <!-- Se cargarán dinámicamente -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-danger" onclick="mostrarModalRechazo()" id="btnRechazar">
                        <i class="bi bi-x-circle"></i> Rechazar
                    </button>
                    <button type="button" class="btn btn-success" onclick="aprobarPedido()" id="btnAprobar">
                        <i class="bi bi-check-circle"></i> Aprobar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Aprobar Pedido -->
    <div class="modal fade" id="modalAprobar" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title"><i class="bi bi-check-circle"></i> Aprobar Pedido</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>¿Está seguro que desea aprobar el pedido #<span id="aprobarPedidoId">-</span>?</p>
                    <div class="mb-3">
                        <label class="form-label">Comentarios (opcional)</label>
                        <textarea class="form-control" id="comentariosAprobacion" rows="3" 
                                  placeholder="Agregue comentarios sobre la aprobación..."></textarea>
                    </div>
                    <div class="alert alert-info">
                        <small>
                            <i class="bi bi-info-circle"></i> 
                            El pedido será marcado como aprobado y el usuario será notificado.
                        </small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-success" onclick="confirmarAprobacion()">
                        <i class="bi bi-check-circle"></i> Confirmar Aprobación
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Rechazar Pedido -->
    <div class="modal fade" id="modalRechazo" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title"><i class="bi bi-x-circle"></i> Rechazar Pedido</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>¿Está seguro que desea rechazar el pedido #<span id="rechazarPedidoId">-</span>?</p>
                    <div class="mb-3">
                        <label class="form-label">Motivo del rechazo *</label>
                        <textarea class="form-control" id="motivoRechazo" rows="4" 
                                  placeholder="Explique el motivo del rechazo..." required></textarea>
                    </div>
                    <div class="alert alert-warning">
                        <small>
                            <i class="bi bi-exclamation-triangle"></i> 
                            El pedido será marcado como rechazado y el usuario será notificado con el motivo.
                        </small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" onclick="confirmarRechazo()">
                        <i class="bi bi-x-circle"></i> Confirmar Rechazo
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="pedidoAdminView.js"></script>
</body>
</html>

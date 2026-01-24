<?php
include_once __DIR__ . '/../../../Shared/Components/header.php';
?>

<div class="container-fluid py-4">
    <div class="card shadow border-0">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
                <h3 class="mb-0">Gestión de Ítems y Recursos</h3>
                <small class="text-white-50">Administra materiales, mano de obra, equipos y sus combinaciones</small>
            </div>
            <div class="btn-group">
                <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalMaterial"
                    onclick="ItemsUI.prepareMaterialModal()">
                    <i class="bi bi-plus-circle"></i> Nuevo Recurso
                </button>
                <button class="btn btn-warning btn-sm text-white" data-bs-toggle="modal" data-bs-target="#modalItem"
                    onclick="ItemsUI.prepareItemModal()">
                    <i class="bi bi-node-plus"></i> Nuevo Ítem
                </button>
            </div>
        </div>

        <div class="card-body bg-light">
            <ul class="nav nav-tabs mb-3" id="itemsTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="tab-materiales" data-bs-toggle="tab"
                        data-bs-target="#pane-materiales" type="button" role="tab" aria-controls="pane-materiales"
                        aria-selected="true">
                        <i class="bi bi-box-seam"></i> Recursos
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="tab-items" data-bs-toggle="tab" data-bs-target="#pane-items"
                        type="button" role="tab" aria-controls="pane-items" aria-selected="false">
                        <i class="bi bi-diagram-2"></i> Ítems
                    </button>
                </li>
            </ul>

            <div class="tab-content">
                <div class="tab-pane fade show active" id="pane-materiales" role="tabpanel" aria-labelledby="tab-materiales">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white d-flex flex-wrap gap-2 justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-0"><i class="bi bi-box-seam"></i> Recursos registrados</h5>
                                <small class="text-muted">Catálogo de materiales, mano de obra y equipos con su precio vigente</small>
                            </div>
                <div class="mt-4 border-top pt-3 d-none" id="itemInsightsSection">
                    <div class="alert alert-warning d-flex justify-content-between align-items-center mb-3" id="itemPriceImpactInfo">
                        <div>
                            <strong>Impacto detectado:</strong>
                            <span>Este bloque aparecerá cuando un cambio de componentes afecte el precio del ítem.</span>
                        </div>
                        <span class="badge bg-warning text-dark">Pendiente</span>
                    </div>
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h6 class="mb-1">Historial de precios del ítem</h6>
                                <small class="text-muted">Últimos valores registrados para este ítem.</small>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-outline-warning btn-sm text-white"
                                    type="button"
                                    id="itemPriceHistoryAction"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#itemPriceForm"
                                    aria-expanded="false"
                                    aria-controls="itemPriceForm">
                                    <i class="bi bi-currency-exchange"></i> Registrar nuevo precio
                                </button>
                                <span class="badge bg-dark" id="itemPriceHistoryBadge">Sin registros</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="collapse mb-3" id="itemPriceForm">
                                <form class="row g-3" id="formItemPrice" onsubmit="ItemsUI.submitItemPrice(event)">
                                    <input type="hidden" name="id_item" id="itemPriceItemId">
                                    <div class="col-md-4">
                                        <label class="form-label">Valor</label>
                                        <input type="number" step="0.01" min="0" class="form-control" name="valor"
                                            id="itemPriceValor" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Fecha</label>
                                        <input type="date" class="form-control" name="fecha" id="itemPriceFecha" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Observaciones</label>
                                        <input type="text" class="form-control" name="observaciones" id="itemPriceObs"
                                            placeholder="Opcional">
                                    </div>
                                    <div class="col-12 d-flex gap-2">
                                        <button type="submit" class="btn btn-warning text-white flex-grow-1">
                                            <i class="bi bi-save"></i> Guardar precio
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary"
                                            data-bs-toggle="collapse" data-bs-target="#itemPriceForm">
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <div class="border rounded p-3 bg-light" id="itemPriceHistory">
                                <p class="mb-0 text-muted small">Selecciona un ítem para ver los precios cargados.</p>
                            </div>
                        </div>
                    </div>
                </div>
                            <div class="d-flex flex-wrap gap-2">
                                <input type="text" class="form-control form-control-sm" placeholder="Buscar..."
                                    id="searchMateriales" oninput="ItemsUI.filterMateriales()">
                                <button class="btn btn-sm btn-outline-secondary" onclick="ItemsUI.fetchMateriales(true)">
                                    <i class="bi bi-arrow-repeat"></i>
                                </button>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover table-striped align-middle mb-0" id="tablaMateriales">
                                <thead class="table-secondary">
                                    <tr>
                                        <th>Código</th>
                                        <th>Recurso</th>
                                        <th>Tipo</th>
                                        <th>Unidad</th>
                                        <th class="text-end">Precio actual</th>
                                        <th class="text-center">Mínimo comercial</th>
                                        <th>Presentación</th>
                                        <th>Actualizado</th>
                                        <th class="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="9" class="text-center py-4 text-muted">
                                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                                            <p class="mb-0 mt-2">Cargando recursos...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="card-footer bg-white border-top">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div class="text-muted small">
                                    Mostrando <span id="materialesShowingStart">0</span> - <span id="materialesShowingEnd">0</span> de <span id="materialesTotalCount">0</span> recursos
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <select class="form-select form-select-sm" id="materialesPerPage" style="width: auto;" onchange="ItemsUI.changeMaterilesPerPage()">
                                        <option value="10">10 por página</option>
                                        <option value="25" selected>25 por página</option>
                                        <option value="50">50 por página</option>
                                        <option value="100">100 por página</option>
                                    </select>
                                    <nav>
                                        <ul class="pagination pagination-sm mb-0" id="materialesPagination">
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-pane fade" id="pane-items" role="tabpanel" aria-labelledby="tab-items">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white d-flex flex-wrap gap-2 justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-0"><i class="bi bi-diagram-2"></i> Ítems registrados</h5>
                                <small class="text-muted">Listado de APU / servicios disponibles</small>
                            </div>
                            <div class="d-flex flex-wrap gap-2">
                                <input type="text" class="form-control form-control-sm" placeholder="Buscar..."
                                    id="searchItems" oninput="ItemsUI.filterItems()">
                                <button class="btn btn-sm btn-outline-secondary" onclick="ItemsUI.fetchItems(true)">
                                    <i class="bi bi-arrow-repeat"></i>
                                </button>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover table-striped align-middle mb-0" id="tablaItems">
                                <thead class="table-secondary">
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Unidad</th>
                                        <th>Estado</th>
                                        <th>Creación</th>
                                        <th class="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="6" class="text-center py-4 text-muted">
                                            <div class="spinner-border spinner-border-sm text-warning" role="status"></div>
                                            <p class="mb-0 mt-2">Cargando ítems...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="card-footer bg-white border-top">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div class="text-muted small">
                                    Mostrando <span id="itemsShowingStart">0</span> - <span id="itemsShowingEnd">0</span> de <span id="itemsTotalCount">0</span> ítems
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <select class="form-select form-select-sm" id="itemsPerPage" style="width: auto;" onchange="ItemsUI.changeItemsPerPage()">
                                        <option value="10">10 por página</option>
                                        <option value="25" selected>25 por página</option>
                                        <option value="50">50 por página</option>
                                        <option value="100">100 por página</option>
                                    </select>
                                    <nav>
                                        <ul class="pagination pagination-sm mb-0" id="itemsPagination">
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Material -->
<div class="modal fade" id="modalMaterial" tabindex="-1" aria-labelledby="modalMaterialLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="modalMaterialLabel">Nuevo Material</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="formMaterial" onsubmit="ItemsUI.submitMaterial(event)">
                <div class="modal-body">
                    <input type="hidden" name="id_material" id="materialId">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Código</label>
                            <input type="text" class="form-control" name="cod_material" id="materialCodigo" required>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">Nombre / descripción</label>
                            <input type="text" class="form-control" name="nombre_material" id="materialNombre" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" name="id_tipo_material" id="materialTipo" required></select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Unidad</label>
                            <select class="form-select" name="idunidad" id="materialUnidad" required></select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Precio vigente</label>
                            <input type="number" step="0.01" min="0" class="form-control" name="precio" id="materialPrecio" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Mínimo comercial <small class="text-muted">(unidades)</small></label>
                            <input type="number" step="0.001" min="0.001" class="form-control" name="minimo_comercial" id="materialMinimoComercial" placeholder="Ej: 1.0">
                            <div class="form-text">Cantidad mínima que se puede comprar (ej: 1 frasco, 1 saco)</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Presentación comercial</label>
                            <input type="text" class="form-control" name="presentacion_comercial" id="materialPresentacionComercial" placeholder="Ej: Frasco x 1kg, Caja x 25 und">
                            <div class="form-text">Cómo se vende el producto al proveedor</div>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Estado</label>
                            <select class="form-select" name="estado" id="materialEstado">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
            <div class="modal-body border-top d-none" id="materialPriceWrapper">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h6 class="mb-1">Historial de precios</h6>
                        <small class="text-muted">Consulta los valores registrados y el vigente</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-primary btn-sm"
                            type="button"
                            id="materialPriceHistoryAction"
                            data-bs-toggle="collapse"
                            data-bs-target="#materialPriceForm"
                            aria-expanded="false"
                            aria-controls="materialPriceForm">
                            <i class="bi bi-currency-dollar"></i> Registrar nuevo precio
                        </button>
                        <span class="badge bg-primary" id="materialPriceHistoryBadge">Sin registros</span>
                    </div>
                </div>
                <div class="collapse mt-3" id="materialPriceForm">
                    <form class="row g-3 align-items-end" id="formMaterialPrice"
                        onsubmit="ItemsUI.submitMaterialPrice(event)">
                        <input type="hidden" name="id_material" id="materialPriceMaterialId">
                        <div class="col-md-4">
                            <label class="form-label">Nuevo valor</label>
                            <input type="number" step="0.01" min="0" class="form-control" name="valor"
                                id="materialPriceValor" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Fecha</label>
                            <input type="date" class="form-control" name="fecha" id="materialPriceFecha" required>
                        </div>
                        <div class="col-md-4 d-flex gap-2">
                            <button type="submit" class="btn btn-primary flex-grow-1">
                                <i class="bi bi-save"></i> Guardar precio
                            </button>
                            <button type="button" class="btn btn-outline-secondary"
                                data-bs-toggle="collapse" data-bs-target="#materialPriceForm">
                                Cancelar
                            </button>
                        </div>
                        <div class="col-12">
                            <small class="text-muted">Este registro solo actualiza el historial de precios del
                                material.</small>
                        </div>
                    </form>
                </div>
                <div class="mt-2 border rounded p-2 bg-light" id="materialPriceHistory">
                    <p class="mb-0 text-muted small">Selecciona un material para ver su historial.</p>
                </div>
                <div class="mt-3 alert alert-secondary py-2" id="materialImpactSummary">
                    Cuando registres un nuevo precio verás aquí los ítems impactados.
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Ítem -->
<div class="modal fade" id="modalItem" tabindex="-1" aria-labelledby="modalItemLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header bg-warning text-white">
                <h5 class="modal-title" id="modalItemLabel">Nuevo Ítem</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="formItem" onsubmit="ItemsUI.submitItem(event)">
                <div class="modal-body">
                    <input type="hidden" name="id_item" id="itemId">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Código</label>
                            <input type="text" class="form-control" name="codigo_item" id="itemCodigo" required>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">Nombre</label>
                            <input type="text" class="form-control" name="nombre_item" id="itemNombre" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Unidad</label>
                            <input type="text" class="form-control" name="unidad" id="itemUnidad" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Descripción</label>
                            <textarea class="form-control" name="descripcion" id="itemDescripcion" rows="2"></textarea>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">¿Es compuesto?</label>
                            <select class="form-select" name="es_compuesto" id="itemCompuesto">
                                <option value="0">No</option>
                                <option value="1">Sí</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Estado</label>
                            <select class="form-select" name="idestado" id="itemEstado">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">¿Es APU?</label>
                            <select class="form-select" name="es_apu" id="itemEsAPU">
                                <option value="1">Sí</option>
                                <option value="0">No</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-4" id="itemComponentsBuilderSection">
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h6 class="mb-1">Componentes del ítem</h6>
                                <small class="text-muted">Agrega materiales desde el catálogo o ajusta los existentes.</small>
                            </div>
                            <span class="badge bg-info" id="itemComponentsDraftBadge">0 componentes</span>
                        </div>
                        <div class="mt-3" id="itemComponentsBuilder">
                            <div class="card shadow-sm border-0">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">Selecciona recursos del catálogo</h6>
                                    <small class="text-muted">El precio y la unidad se precargan automáticamente según el tipo de recurso.</small>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <!-- Columna 1: Materiales -->
                                        <div class="col-md-4">
                                            <div class="border rounded p-3 h-100 bg-light">
                                                <h6 class="text-primary mb-2">
                                                    <i class="bi bi-box-seam"></i> Materiales
                                                </h6>
                                                <select class="form-select form-select-sm mb-2" id="draftMaterialSelect">
                                                    <option value="">Seleccionar material...</option>
                                                </select>
                                                <button type="button" class="btn btn-primary btn-sm w-100" id="addMaterialFromSelectBtn">
                                                    <i class="bi bi-plus-circle"></i> Agregar
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- Columna 2: Mano de Obra -->
                                        <div class="col-md-4">
                                            <div class="border rounded p-3 h-100 bg-light">
                                                <h6 class="text-success mb-2">
                                                    <i class="bi bi-people-fill"></i> Mano de Obra
                                                </h6>
                                                <select class="form-select form-select-sm mb-2" id="draftManoObraSelect">
                                                    <option value="">Seleccionar mano de obra...</option>
                                                </select>
                                                <button type="button" class="btn btn-success btn-sm w-100" id="addManoObraFromSelectBtn">
                                                    <i class="bi bi-plus-circle"></i> Agregar
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- Columna 3: Maquinaria/Equipos -->
                                        <div class="col-md-4">
                                            <div class="border rounded p-3 h-100 bg-light">
                                                <h6 class="text-warning mb-2">
                                                    <i class="bi bi-gear-fill"></i> Maquinaria/Equipos
                                                </h6>
                                                <select class="form-select form-select-sm mb-2" id="draftMaquinariaSelect">
                                                    <option value="">Seleccionar equipo...</option>
                                                </select>
                                                <button type="button" class="btn btn-warning btn-sm w-100" id="addMaquinariaFromSelectBtn">
                                                    <i class="bi bi-plus-circle"></i> Agregar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card shadow-sm border-0 mt-3">
                                <div class="card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
                                    <div>
                                        <h6 class="mb-0">Componentes seleccionados</h6>
                                        <small class="text-muted">Configura tipo, cantidades y costos antes de guardar.</small>
                                    </div>
                                    <button class="btn btn-outline-secondary btn-sm" type="button" id="addManualComponentBtn">
                                        <i class="bi bi-plus-circle"></i> Agregar componente manual
                                    </button>
                                </div>
                                <div class="card-body">
                                    <h6 class="mb-3">Componentes agregados al ítem</h6>
                                    <div class="row g-3">
                                        <!-- Columna 1: Materiales -->
                                        <div class="col-md-4">
                                            <div class="border rounded p-2 bg-light">
                                                <h6 class="text-primary mb-2 small">
                                                    <i class="bi bi-box-seam"></i> Materiales
                                                </h6>
                                                <div id="componentesMaterialesContainer" style="max-height: 400px; overflow-y: auto;">
                                                    <div class="text-muted small text-center py-3">
                                                        No hay materiales agregados
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Columna 2: Mano de Obra -->
                                        <div class="col-md-4">
                                            <div class="border rounded p-2 bg-light">
                                                <h6 class="text-success mb-2 small">
                                                    <i class="bi bi-people-fill"></i> Mano de Obra
                                                </h6>
                                                <div id="componentesManoObraContainer" style="max-height: 400px; overflow-y: auto;">
                                                    <div class="text-muted small text-center py-3">
                                                        No hay mano de obra agregada
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Columna 3: Maquinaria/Equipos -->
                                        <div class="col-md-4">
                                            <div class="border rounded p-2 bg-light">
                                                <h6 class="text-warning mb-2 small">
                                                    <i class="bi bi-gear-fill"></i> Maquinaria/Equipos
                                                </h6>
                                                <div id="componentesMaquinariaContainer" style="max-height: 400px; overflow-y: auto;">
                                                    <div class="text-muted small text-center py-3">
                                                        No hay equipos agregados
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div id="itemInsightsSectionFooter" class="flex-grow-1 me-3 d-none">
                        <div class="alert alert-warning mb-2 p-2 d-flex justify-content-between align-items-center" id="itemPriceImpactInfoFooter">
                            <div>
                                <strong>Impacto detectado:</strong>
                                <span>Este bloque aparecerá cuando un cambio de componentes afecte el precio del ítem.</span>
                            </div>
                            <span class="badge bg-warning text-dark">Pendiente</span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-outline-warning btn-sm text-white"
                                type="button"
                                id="itemPriceHistoryActionFooter"
                                data-bs-toggle="collapse"
                                data-bs-target="#itemPriceFormFooter"
                                aria-expanded="false"
                                aria-controls="itemPriceFormFooter">
                                <i class="bi bi-currency-exchange"></i> Registrar nuevo precio
                            </button>
                            <span class="badge bg-dark" id="itemPriceHistoryBadgeFooter">Sin registros</span>
                        </div>
                        <div class="collapse mt-2" id="itemPriceFormFooter">
                            <form class="row g-2" onsubmit="ItemsUI.submitItemPrice(event)">
                                <input type="hidden" name="id_item" id="itemPriceItemIdFooter">
                                <div class="col-md-4">
                                    <input type="number" step="0.01" min="0" class="form-control form-control-sm" name="valor"
                                        id="itemPriceValorFooter" placeholder="Valor" required>
                                </div>
                                <div class="col-md-4">
                                    <input type="date" class="form-control form-control-sm" name="fecha" id="itemPriceFechaFooter" required>
                                </div>
                                <div class="col-md-4">
                                    <input type="text" class="form-control form-control-sm" name="observaciones" id="itemPriceObsFooter"
                                        placeholder="Observaciones (opcional)">
                                </div>
                                <div class="col-12 text-end">
                                    <button type="submit" class="btn btn-warning btn-sm text-white">
                                        <i class="bi bi-save"></i> Guardar precio
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div class="border rounded p-2 bg-light small mt-2" id="itemPriceHistoryFooter">
                            Selecciona un ítem para ver los precios cargados.
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-warning text-white">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Componentes de Ítem -->
<div class="modal fade" id="modalItemComponents" tabindex="-1" aria-labelledby="modalItemComponentsLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header bg-dark text-white">
                <h5 class="modal-title" id="modalItemComponentsLabel">
                    <i class="bi bi-diagram-3"></i> Componentes del Ítem
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-info d-flex align-items-center justify-content-between" role="alert">
                    <div>
                        <strong>Ítem seleccionado:</strong>
                        <span id="componentsItemTitle" class="fw-semibold text-uppercase">Ninguno</span>
                    </div>
                    <span class="text-muted">Gestiona materiales, recursos y jerarquías del ítem</span>
                </div>

                <ul class="nav nav-pills mb-3" id="componentsTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="components-materiales-tab" data-bs-toggle="pill"
                            data-bs-target="#components-materiales" type="button" role="tab">
                            <i class="bi bi-tools"></i> Materiales y recursos
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="components-items-tab" data-bs-toggle="pill"
                            data-bs-target="#components-items" type="button" role="tab">
                            <i class="bi bi-diagram-2"></i> Ítems anidados
                        </button>
                    </li>
                </ul>

                <div class="tab-content">
                    <div class="tab-pane fade show active" id="components-materiales" role="tabpanel">
                        <div class="row g-3">
                            <div class="col-12">
                                <div class="alert alert-info border-0 shadow-sm" id="componentsImpactSummary">
                                    Selecciona un ítem y sus componentes para ver el impacto de los nuevos precios de materiales.
                                </div>
                            </div>
                            <div class="col-lg-4">
                                <div class="card shadow-sm border-0 h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <h6 class="fw-semibold mb-0">Agregar componente</h6>
                                                <small class="text-muted">Materiales, mano de obra, equipos, etc.</small>
                                            </div>
                                            <button class="btn btn-link btn-sm text-decoration-none" type="button"
                                                onclick="ItemsUI.resetComponentForm()">
                                                <i class="bi bi-arrow-counterclockwise"></i> Limpiar
                                            </button>
                                        </div>

                                        <form id="formItemComponent">
                                            <input type="hidden" id="componentId" name="id_componente">
                                            <div class="mb-3">
                                                <label class="form-label">Tipo de componente</label>
                                                <select class="form-select" id="componentTipo" name="tipo_componente" required>
                                                    <option value="material">Material</option>
                                                    <option value="mano_obra">Mano de obra</option>
                                                    <option value="equipo">Equipo</option>
                                                    <option value="transporte">Transporte</option>
                                                    <option value="otro">Otro</option>
                                                </select>
                                            </div>
                                            <div class="mb-3 d-none" id="componentMaterialGroup">
                                                <label class="form-label">Material asociado</label>
                                                <select class="form-select" id="componentMaterial" name="id_material">
                                                    <option value="">Seleccione un material</option>
                                                </select>
                                                <small class="text-muted">Aplica solo para componentes de tipo material.</small>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Descripción</label>
                                                <textarea class="form-control" rows="2" id="componentDescripcion" name="descripcion"
                                                    required></textarea>
                                            </div>
                                            <div class="row g-3">
                                                <div class="col-md-6">
                                                    <label class="form-label">Unidad</label>
                                                    <input type="text" class="form-control" id="componentUnidad" name="unidad" required>
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label">Cantidad</label>
                                                    <input type="number" step="0.0001" min="0.0001" class="form-control"
                                                        id="componentCantidad" name="cantidad" required>
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label">Precio unitario</label>
                                                    <input type="number" step="0.01" min="0" class="form-control"
                                                        id="componentPrecio" name="precio_unitario" required>
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label">% Desperdicio</label>
                                                    <input type="number" step="0.01" min="0" class="form-control"
                                                        id="componentDesperdicio" name="porcentaje_desperdicio" value="0">
                                                </div>
                                            </div>
                                            <div class="d-grid mt-3">
                                                <button type="submit" class="btn btn-dark">
                                                    <i class="bi bi-save"></i> Guardar componente
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-8">
                                <div class="card shadow-sm border-0 h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <h6 class="fw-semibold mb-0">Componentes del ítem</h6>
                                                <small class="text-muted">Listado de recursos asociados</small>
                                            </div>
                                            <button type="button" class="btn btn-outline-primary me-auto d-none" id="manageComponentsFromEditBtn"
                        onclick="ItemsUI.openComponentsFromEdit()">
                        <i class="bi bi-diagram-3"></i> Editar componentes existentes
                    </button>
                                            <button class="btn btn-outline-secondary btn-sm" type="button"
                                                onclick="ItemsUI.fetchItemComponents()">
                                                <i class="bi bi-arrow-repeat"></i>
                                            </button>
                                        </div>
                                        <div class="table-responsive">
                                            <table class="table table-sm table-striped align-middle" id="tablaItemComponents">
                                                <thead class="table-secondary">
                                                    <tr>
                                                        <th>Tipo</th>
                                                        <th>Recurso</th>
                                                        <th>Descripción</th>
                                                        <th>Unidad</th>
                                                        <th class="text-end">Cantidad</th>
                                                        <th class="text-end">P. Unit</th>
                                                        <th class="text-end">% Desp.</th>
                                                        <th class="text-end">Subtotal</th>
                                                        <th class="text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td colspan="9" class="text-center text-muted py-4">
                                                            Selecciona un ítem para ver sus componentes.
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="components-items" role="tabpanel">
                        <div class="row g-3">
                            <div class="col-lg-4">
                                <div class="card shadow-sm border-0 h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <h6 class="fw-semibold mb-0">Agregar ítem hijo</h6>
                                                <small class="text-muted">Construye jerarquías de ítems</small>
                                            </div>
                                            <button class="btn btn-link btn-sm text-decoration-none" type="button"
                                                onclick="ItemsUI.resetCompositionForm()">
                                                <i class="bi bi-arrow-counterclockwise"></i> Limpiar
                                            </button>
                                        </div>
                                        <form id="formItemComposition">
                                            <input type="hidden" id="compositionId" name="id_composicion">
                                            <div class="mb-3">
                                                <label class="form-label">Ítem componente</label>
                                                <select class="form-select" id="compositionItemSelect" name="id_item_componente" required>
                                                    <option value="">Seleccione un ítem</option>
                                                </select>
                                            </div>
                                            <div class="row g-3">
                                                <div class="col-md-6">
                                                    <label class="form-label">Cantidad</label>
                                                    <input type="number" step="0.0001" min="0.0001" class="form-control"
                                                        id="compositionCantidad" name="cantidad" required>
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label">Orden</label>
                                                    <input type="number" min="1" class="form-control" id="compositionOrden"
                                                        name="orden" value="1">
                                                </div>
                                                <div class="col-12">
                                                    <label class="form-label">¿Es referencia?</label>
                                                    <select class="form-select" id="compositionReferencia" name="es_referencia">
                                                        <option value="0">No</option>
                                                        <option value="1">Sí</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="d-grid mt-3">
                                                <button type="submit" class="btn btn-primary">
                                                    <i class="bi bi-node-plus"></i> Guardar relación
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-8">
                                <div class="card shadow-sm border-0 h-100">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <h6 class="fw-semibold mb-0">Ítems hijos registrados</h6>
                                                <small class="text-muted">Componentes y referencias del ítem</small>
                                            </div>
                                            <button class="btn btn-outline-secondary btn-sm" type="button"
                                                onclick="ItemsUI.fetchItemComposition()">
                                                <i class="bi bi-arrow-repeat"></i>
                                            </button>
                                        </div>
                                        <div class="table-responsive">
                                            <table class="table table-sm table-striped align-middle" id="tablaItemComposition">
                                                <thead class="table-secondary">
                                                    <tr>
                                                        <th>Código</th>
                                                        <th>Nombre</th>
                                                        <th class="text-end">Cantidad</th>
                                                        <th class="text-end">Orden</th>
                                                        <th class="text-center">Referencia</th>
                                                        <th class="text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td colspan="6" class="text-center text-muted py-4">
                                                            Selecciona un ítem para ver su composición.
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<?php
include_once __DIR__ . '/../../../Shared/Components/footer.php';
?>

<script>
    const API_ITEMS = '/sgigescomnew/src/Items/Interfaces/ItemsController.php';
</script>
<script src="/sgigescomnew/src/Items/Interfaces/Views/itemsGestionView.js"></script>

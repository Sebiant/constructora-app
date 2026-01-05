const ItemsUI = (() => {
  const state = {
    materiales: [],
    materialesFiltrados: [],
    items: [],
    itemsFiltrados: [],
    materialTipos: [],
    unidades: [],
    materialModal: null,
    itemModal: null,
    materialPriceHistory: [],
    itemPriceHistory: [],
    lastMaterialImpact: { materialId: null, delta: 0, items: [] },
    currentItemTotal: 0,
    draftComponents: [],
    removedComponentIds: new Set(),
    loadingDraftComponents: false,
    currentItemId: null,
    itemChildItems: [],
    childItemBreakdowns: {},
    childItemBreakdownLoading: new Set(),
    loadingChildItems: false,
    childItemsError: null,
  };

  const COMPONENT_TYPE_LABELS = {
    material: "Material",
    mano_obra: "Mano de obra",
    equipo: "Equipo",
    transporte: "Transporte",
    otro: "Otro",
  };

  const selectors = {
    tablaMateriales: "#tablaMateriales tbody",
    tablaItems: "#tablaItems tbody",
    searchMateriales: "#searchMateriales",
    searchItems: "#searchItems",
    modalMaterial: "#modalMaterial",
    modalItem: "#modalItem",
  };

  async function init() {
    state.materialModal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(selectors.modalMaterial)
    );
    state.itemModal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(selectors.modalItem)
    );
    document.getElementById("addMaterialFromSelectBtn")?.addEventListener("click", addMaterialFromSelect);

    await Promise.all([fetchAuxData(), fetchMateriales(), fetchItems()]);
  }

  async function loadItemPriceHistory(idItem) {
    const badge = document.getElementById("itemPriceHistoryBadge");
    const container = document.getElementById("itemPriceHistory");
    if (!badge || !container) return;

    if (!idItem) {
      badge.textContent = "Sin registros";
      container.innerHTML = `<p class="mb-0 text-muted small">Guarda el ítem y aquí verás sus precios.</p>`;
      state.itemPriceHistory = [];
      return;
    }

    badge.textContent = "Cargando...";
    container.innerHTML = `
      <div class="d-flex align-items-center text-muted small">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Consultando historial...
      </div>`;

    try {
      const response = await fetch(`${API_ITEMS}?action=getItemPriceHistory&id_item=${idItem}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo obtener historial");
      state.itemPriceHistory = result.data || [];
      renderItemPriceHistory();
    } catch (error) {
      badge.textContent = "Error";
      container.innerHTML = `<p class="mb-0 text-danger small">${error.message}</p>`;
    }
  }

  function renderItemPriceHistory() {
    const badge = document.getElementById("itemPriceHistoryBadge");
    const container = document.getElementById("itemPriceHistory");
    if (!badge || !container) return;

    if (!state.itemPriceHistory.length) {
      badge.textContent = "Sin registros";
      container.innerHTML = `<p class="mb-0 text-muted small">No hay precios registrados para este ítem.</p>`;
      return;
    }

    const vigente =
      state.itemPriceHistory.find((p) => Number(p.estado) === 1) || state.itemPriceHistory[0];
    badge.textContent = `Vigente: $${formatCurrency(vigente.valor)} (${formatDate(vigente.fecha)})`;

    container.innerHTML = state.itemPriceHistory
      .map(
        (precio) => `
        <div class="border rounded p-2 mb-2 bg-white">
          <div class="d-flex justify-content-between">
            <span class="fw-semibold">$${formatCurrency(precio.valor)}</span>
            <span class="badge ${Number(precio.estado) === 1 ? "bg-success" : "bg-secondary"}">
              ${Number(precio.estado) === 1 ? "Vigente" : "Histórico"}
            </span>
          </div>
          <small class="text-muted">
            Fecha: ${formatDate(precio.fecha)} • Registrado por: ${precio.usuario_nombre || "N/D"}
          </small>
          ${precio.observaciones ? `<p class="mb-0 small mt-1">${precio.observaciones}</p>` : ""}
        </div>`
      )
      .join("");
  }

  async function fetchAuxData() {
    try {
      const [tipos, unidades] = await Promise.all([
        fetch(`${API_ITEMS}?action=getMaterialTypes`).then((r) => r.json()),
        fetch(`${API_ITEMS}?action=getUnits`).then((r) => r.json()),
      ]);

      if (tipos.success) {
        state.materialTipos = tipos.data;
        fillSelect("materialTipo", tipos.data, "id_tipo_material", "desc_tipo");
      }

      if (unidades.success) {
        state.unidades = unidades.data;
        fillSelect("materialUnidad", unidades.data, "idunidad", "unidesc");
      }
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  }

  function fillSelect(id, data, valueField, labelField) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione...</option>';
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueField];
      option.textContent = item[labelField];
      select.appendChild(option);
    });
  }

  async function fetchMateriales(forceRefresh = false) {
    if (!forceRefresh && state.materiales.length > 0) return;
    setLoading(selectors.tablaMateriales, 7, "Cargando materiales...");

    try {
      const response = await fetch(`${API_ITEMS}?action=getMateriales`);
      const result = await response.json();
      
      // Depuración: Imprimir respuesta completa del endpoint
      console.log("=== RESPUESTA DEL ENDPOINT getAllMateriales ===");
      console.log("Success:", result.success);
      console.log("Data length:", result.data?.length);
      console.log("Data completa:", result.data);
      
      if (!result.success) throw new Error(result.error || "No se pudieron cargar los materiales");
      
      state.materiales = result.data || [];
      renderMateriales(state.materiales);
    } catch (error) {
      setError(selectors.tablaMateriales, error.message, 7);
    }
  }

  async function fetchItems(force = false) {
    try {
      if (!force && state.items.length > 0) {
        renderItems(state.itemsFiltrados.length ? state.itemsFiltrados : state.items);
        return;
      }

      setLoading(selectors.tablaItems, 8, "Cargando ítems...");

      const response = await fetch(`${API_ITEMS}?action=getItems`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Error al cargar ítems");

      state.items = result.data;
      state.itemsFiltrados = [];
      renderItems(state.items);
    } catch (error) {
      console.error(error);
      setError(selectors.tablaItems, error.message || "No se pudieron cargar los ítems");
    }
  }

  function renderMateriales(data) {
    const tbody = document.querySelector(selectors.tablaMateriales);
    if (!tbody) return;

    if (!data.length) {
      setEmpty(tbody, 7, "No hay materiales registrados.");
      return;
    }

    // Depuración: Imprimir datos de materiales
    console.log("=== DEPURACIÓN DE MATERIALES ===");
    console.log("Total materiales:", data.length);
    data.forEach(material => {
      console.log(`Material: ${material.cod_material}, idestado: ${material.idestado}, debería mostrar: ${material.idestado ? 'Desactivar' : 'Activar'}`);
    });

    tbody.innerHTML = data
      .map(
        (material) => {
          // Depuración: Verificar lógica del botón
          const botonColor = material.idestado ? 'danger' : 'success';
          const botonTexto = material.idestado ? 'Desactivar' : 'Activar';
          const botonIcono = material.idestado ? 'toggle-off' : 'toggle-on';
          const botonTitle = material.idestado ? 'Desactivar' : 'Activar';
          
          console.log(`Botón para ${material.cod_material}: color=${botonColor}, texto=${botonTexto}, icono=${botonIcono}`);
          
          return `
        <tr>
          <td class="fw-semibold">${material.cod_material}</td>
          <td>${material.nombre_material}</td>
          <td>${material.desc_tipo || "-"}</td>
          <td>${material.unidesc || "-"}</td>
          <td class="text-end">$${formatCurrency(material.precio_actual)}</td>
          <td>${formatDate(material.fecha_precio)}</td>
          <td class="text-center">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-primary btn-sm" onclick='ItemsUI.editMaterial(${JSON.stringify(material)})'>
                Editar
              </button>
              <button class="btn btn-outline-${botonColor} btn-sm" 
                      onclick="ItemsUI.toggleMaterial(${material.id_material})"
                      title="${botonTitle}">
                <i class="bi bi-${botonIcono}"></i>
                ${botonTexto}
              </button>
            </div>
          </td>
        </tr>`
        }
      )
      .join("");
  }

  function renderItems(data) {
    const tbody = document.querySelector(selectors.tablaItems);
    if (!tbody) return;

    if (!data.length) {
      setEmpty(tbody, 8, "No hay ítems registrados.");
      return;
    }

    tbody.innerHTML = data
      .map((item) => {
        return `
        <tr>
          <td class="fw-semibold">${item.codigo_item}</td>
          <td>${item.nombre_item}</td>
          <td>${item.unidad}</td>
          <td>
            <span class="badge ${item.idestado ? "bg-success" : "bg-danger"}">
              ${item.idestado ? "Activo" : "Inactivo"}
            </span>
          </td>
          <td>${formatDate(item.fecha_creacion)}</td>
          <td class="text-center">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-warning" title="Editar"
                onclick="ItemsUI.editItemById(${item.id_item})">
                Editar
              </button>
              <button class="btn btn-outline-${item.idestado ? 'danger' : 'success'}" 
                      title="${item.idestado ? 'Desactivar' : 'Activar'}"
                      onclick="ItemsUI.toggleItem(${item.id_item})">
                <i class="bi bi-${item.idestado ? 'toggle-off' : 'toggle-on'}"></i>
                ${item.idestado ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  function filterMateriales() {
    const term = document.querySelector(selectors.searchMateriales)?.value.trim().toLowerCase() ?? "";
    if (!term) {
      state.materialesFiltrados = [];
      renderMateriales(state.materiales);
      return;
    }
    state.materialesFiltrados = state.materiales.filter(
      (mat) =>
        mat.cod_material.toLowerCase().includes(term) ||
        mat.nombre_material.toLowerCase().includes(term) ||
        (mat.desc_tipo || "").toLowerCase().includes(term)
    );
    renderMateriales(state.materialesFiltrados);
  }

  function filterItems() {
    const term = document.querySelector(selectors.searchItems)?.value.trim().toLowerCase() ?? "";
    if (!term) {
      state.itemsFiltrados = [];
      renderItems(state.items);
      return;
    }
    state.itemsFiltrados = state.items.filter(
      (item) =>
        item.codigo_item.toLowerCase().includes(term) ||
        item.nombre_item.toLowerCase().includes(term) ||
        (item.descripcion || "").toLowerCase().includes(term)
    );
    renderItems(state.itemsFiltrados);
  }

  function prepareMaterialModal(material = null) {
    const form = document.getElementById("formMaterial");
    if (!form) return;

    form.reset();
    document.getElementById("materialId").value = material?.id_material ?? "";
    document.getElementById("modalMaterialLabel").textContent = material ? "Editar Material" : "Nuevo Material";
    document.getElementById("materialEstado").value = material?.estado ?? 1;

    const priceWrapper = document.getElementById("materialPriceWrapper");
    if (material) {
      document.getElementById("materialCodigo").value = material.cod_material;
      document.getElementById("materialNombre").value = material.nombre_material;
      document.getElementById("materialTipo").value = material.id_tipo_material;
      document.getElementById("materialUnidad").value = material.idunidad;
      document.getElementById("materialPrecio").value = material.precio_actual;
      priceWrapper?.classList.remove("d-none");
      resetMaterialPriceForm(material.id_material);
      hideCollapse("materialPriceForm");
      renderMaterialImpactSummary(material.id_material);
      loadMaterialPriceHistory(material.id_material);
    } else {
      priceWrapper?.classList.add("d-none");
      resetMaterialPriceForm("");
      hideCollapse("materialPriceForm");
      const badge = document.getElementById("materialPriceHistoryBadge");
      const container = document.getElementById("materialPriceHistory");
      if (badge) badge.textContent = "Sin registros";
      if (container) {
        container.innerHTML =
          '<p class="mb-0 text-muted small">Guarda el material y aquí verás los precios cargados.</p>';
      }
      document.getElementById("materialImpactSummary").textContent =
        "Cuando registres un nuevo precio verás aquí los ítems impactados.";
    }
  }

  function editMaterial(material) {
    prepareMaterialModal(material);
    state.materialModal.show();
  }

  async function loadMaterialPriceHistory(idMaterial) {
    const badge = document.getElementById("materialPriceHistoryBadge");
    const container = document.getElementById("materialPriceHistory");
    if (!badge || !container) return;

    if (!idMaterial) {
      badge.textContent = "Sin registros";
      container.innerHTML = `<p class="mb-0 text-muted small">Guarda el material y aquí verás los precios cargados.</p>`;
      state.materialPriceHistory = [];
      return;
    }

    badge.textContent = "Cargando...";
    container.innerHTML = `
      <div class="d-flex align-items-center text-muted small">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Consultando historial...
      </div>`;

    try {
      const response = await fetch(`${API_ITEMS}?action=getMaterialPriceHistory&id_material=${idMaterial}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo obtener historial");
      state.materialPriceHistory = result.data || [];
      renderMaterialPriceHistory();
    } catch (error) {
      badge.textContent = "Error";
      container.innerHTML = `<p class="mb-0 text-danger small">${error.message}</p>`;
    }
  }

  function renderMaterialPriceHistory() {
    const badge = document.getElementById("materialPriceHistoryBadge");
    const container = document.getElementById("materialPriceHistory");
    if (!badge || !container) return;

    if (!state.materialPriceHistory.length) {
      badge.textContent = "Sin registros";
      container.innerHTML = `<p class="mb-0 text-muted small">No hay precios registrados para este material.</p>`;
      return;
    }

    const vigente =
      state.materialPriceHistory.find((p) => Number(p.estado) === 1) || state.materialPriceHistory[0];
    badge.textContent = `Vigente: $${formatCurrency(vigente.valor)} (${formatDate(vigente.fecha)})`;

    const rows = state.materialPriceHistory
      .map(
        (precio) => `
        <div class="border rounded p-2 mb-2 bg-white">
          <div class="d-flex justify-content-between">
            <span class="fw-semibold">$${formatCurrency(precio.valor)}</span>
            <span class="badge ${Number(precio.estado) === 1 ? "bg-success" : "bg-secondary"}">
              ${Number(precio.estado) === 1 ? "Vigente" : "Histórico"}
            </span>
          </div>
          <small class="text-muted">
            Fecha: ${formatDate(precio.fecha)} • Registrado por: ${precio.usuario_nombre || "N/D"}
          </small>
          ${precio.observaciones ? `<p class="mb-0 small mt-1">${precio.observaciones}</p>` : ""}
        </div>`
      )
      .join("");

    container.innerHTML = rows;
  }

  async function submitMaterial(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.precio = Number(payload.precio);
    payload.id_tipo_material = Number(payload.id_tipo_material);

    const isEdit = Boolean(payload.id_material);
    const endpoint = isEdit ? "updateMaterial" : "createMaterial";

    try {
      const response = await fetch(`${API_ITEMS}?action=${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "No se pudo guardar el material");

      state.materialModal.hide();
      await fetchMateriales(true);
    } catch (error) {
      alert(error.message);
    }
  }

  async function toggleMaterial(id) {
    try {
      const response = await fetch(`${API_ITEMS}?action=toggleMaterial&id_material=${id}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "No se pudo cambiar el estado");

      await fetchMateriales(true);
    } catch (error) {
      console.error("Error al cambiar estado del material:", error);
      alert("Error: " + error.message);
    }
  }

  function prepareItemModal(item = null) {
    const form = document.getElementById("formItem");
    if (!form) return;

    form.reset();
    document.getElementById("itemId").value = item?.id_item ?? "";
    document.getElementById("modalItemLabel").textContent = item ? "Editar Ítem" : "Nuevo Ítem";

    if (item) {
      document.getElementById("itemCodigo").value = item.codigo_item;
      document.getElementById("itemNombre").value = item.nombre_item;
      document.getElementById("itemUnidad").value = item.unidad;
      document.getElementById("itemDescripcion").value = item.descripcion || "";
      document.getElementById("itemCompuesto").value = item.es_compuesto ?? 0;
      document.getElementById("itemEstado").value = item.idestado ?? 1;
      document.getElementById("itemEsAPU").value = item.es_apu ?? 1;
      const priceSection = document.getElementById("itemPriceSection");
      if (priceSection) {
        priceSection.classList.remove("d-none");
      }
    }
    state.currentItemId = item?.id_item ?? null;
    resetDraftComponents();
    state.removedComponentIds = new Set();
    if (item) {
      loadItemComponentsForModal(item.id_item);
    } else {
      renderDraftComponents();
    }
    const deleteBtn = document.getElementById("itemDeleteButton");
    const manageCompBtn = document.getElementById("manageComponentsFromEditBtn");
    deleteBtn?.classList.add("d-none");
    deleteBtn?.removeAttribute("data-id-item");
    if (item) {
      manageCompBtn?.classList.remove("d-none");
      manageCompBtn?.setAttribute("data-item", encodeURIComponent(JSON.stringify(item)));
    } else {
      manageCompBtn?.classList.add("d-none");
      manageCompBtn?.removeAttribute("data-item");
    }
  }

  function editItemById(idItem) {
    const item = state.items.find((itm) => Number(itm.id_item) === Number(idItem));
    if (!item) {
      alert("No se encontró la información del ítem seleccionado.");
      return;
    }
    editItem(item);
  }

  function editItem(item) {
    prepareItemModal(item);
    state.itemModal.show();
  }

  async function submitItem(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());

    payload.es_compuesto = Number(payload.es_compuesto ?? 0);
    payload.idestado = Number(payload.idestado ?? 1);
    payload.es_apu = Number(payload.es_apu ?? 1);

    const isEdit = Boolean(payload.id_item);
    let endpoint = isEdit ? "updateItem" : "createItem";
    let requestBody = payload;

    if (!isEdit && state.draftComponents.length) {
      endpoint = "createItemWithRelations";
      const serializedComponents = serializeDraftComponents().map(({ id_componente, ...rest }) => rest);
      requestBody = {
        item: payload,
        componentes: serializedComponents,
        composicion: [],
        precio: null,
      };
    } else if (isEdit) {
      requestBody = {
        ...payload,
        componentes: serializeDraftComponents(),
        removed_component_ids: Array.from(state.removedComponentIds),
      };
    }

    try {
      const response = await fetch(`${API_ITEMS}?action=${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "No se pudo guardar el ítem");

      state.itemModal.hide();
      resetDraftComponents();
      state.removedComponentIds = new Set();
      await fetchItems(true);
    } catch (error) {
      alert(error.message);
    }
  }

  async function toggleItem(id) {
    try {
      const response = await fetch(`${API_ITEMS}?action=toggleItem&id_item=${id}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "No se pudo cambiar el estado");

      await fetchItems(true);
    } catch (error) {
      console.error("Error al cambiar estado del ítem:", error);
      alert("Error: " + error.message);
    }
  }

  function setLoading(selector, colspan, text) {
    const tbody = document.querySelector(selector);
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="text-center py-4 text-muted">
          <div class="spinner-border spinner-border-sm" role="status"></div>
          <p class="mb-0 mt-2">${text}</p>
        </td>
      </tr>`;
  }

  function setError(selector, message, colspan = 8) {
    const tbody = document.querySelector(selector);
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="text-center text-danger py-4">
          <i class="bi bi-exclamation-triangle-fill"></i> ${message}
        </td>
      </tr>`;
  }

  function setEmpty(tbody, colspan, text) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="text-center text-muted py-4">${text}</td>
      </tr>`;
  }

  function formatCurrency(value) {
    const number = Number(value ?? 0);
    return number.toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  function resetMaterialPriceForm(idMaterial = "") {
    const inputId = document.getElementById("materialPriceMaterialId");
    const inputValor = document.getElementById("materialPriceValor");
    const inputFecha = document.getElementById("materialPriceFecha");
    if (!inputId || !inputValor || !inputFecha) return;
    inputId.value = idMaterial ?? "";
    inputValor.value = "";
    inputFecha.value = getToday();
  }

  function resetItemPriceForm(idItem = "") {
    const inputId = document.getElementById("itemPriceItemId");
    const inputValor = document.getElementById("itemPriceValor");
    const inputFecha = document.getElementById("itemPriceFecha");
    const inputObs = document.getElementById("itemPriceObs");
    if (!inputId || !inputValor || !inputFecha || !inputObs) return;
    inputId.value = idItem ?? "";
    inputValor.value = "";
    inputFecha.value = getToday();
    inputObs.value = "";
  }

  function hideCollapse(id) {
    const element = document.getElementById(id);
    if (!element) return;
    const instance = bootstrap.Collapse.getInstance(element) || new bootstrap.Collapse(element, { toggle: false });
    instance.hide();
  }

  function renderMaterialImpactSummary(materialId = null) {
    const container = document.getElementById("materialImpactSummary");
    if (!container) return;

    const targetId = materialId ?? Number(document.getElementById("materialPriceMaterialId")?.value ?? 0);
    if (!targetId || state.lastMaterialImpact.materialId !== Number(targetId) || !state.lastMaterialImpact.items.length) {
      container.innerHTML = "Cuando registres un nuevo precio verás aquí los ítems impactados.";
      return;
    }

    const header = `
      <div class="d-flex justify-content-between align-items-center">
        <span class="fw-semibold">Variación aplicada: $${formatCurrency(state.lastMaterialImpact.delta)}</span>
        <span class="badge bg-info">${state.lastMaterialImpact.items.length} ítem(s) afectados</span>
      </div>`;

    const list = state.lastMaterialImpact.items
      .map((item) => {
        const delta = Number(item.delta ?? 0);
        const sign = delta >= 0 ? "+" : "-";
        const textClass = delta >= 0 ? "text-danger" : "text-success";
        return `
          <div class="d-flex justify-content-between small border-bottom py-1">
            <span>${item.codigo_item} · ${item.nombre_item}</span>
            <span class="${textClass}">${sign}$${formatCurrency(Math.abs(delta))}</span>
          </div>`;
      })
      .join("");

    container.innerHTML = `${header}<div class="mt-2">${list}</div>`;
  }

  function renderComponentsImpactSummary(total = null) {
    const alertBox = document.getElementById("componentsImpactSummary");
    if (!alertBox) return;

    if (!state.selectedItem) {
      alertBox.textContent =
        "Selecciona un ítem y sus componentes para ver el impacto de los nuevos precios de materiales.";
      return;
    }

    const formattedTotal =
      typeof total === "number" ? formatCurrency(total) : formatCurrency(state.currentItemTotal);
    const impacted = state.lastMaterialImpact.items.find(
      (itm) => Number(itm.id_item) === Number(state.selectedItem.id_item)
    );

    let content = `
      <div class="fw-semibold">${state.selectedItem.codigo_item} · ${state.selectedItem.nombre_item}</div>
      <div class="small text-muted">Costo estimado actual: $${formattedTotal}</div>`;

    if (impacted) {
      const delta = Number(impacted.delta ?? 0);
      const sign = delta >= 0 ? "+" : "-";
      const tone = delta >= 0 ? "text-danger" : "text-success";
      content += `
        <div class="mt-2 ${tone}">
          <i class="bi bi-arrow-${delta >= 0 ? "up" : "down"}"></i>
          Última actualización de materiales modificó este ítem en ${sign}$${formatCurrency(Math.abs(delta))}.
        </div>`;
    } else {
      content += `<div class="mt-2 small text-muted">Este ítem no fue afectado por el último cambio de materiales.</div>`;
    }

    alertBox.innerHTML = content;
  }

  function calculateComponentSubtotal(component, onSum = null) {
    const cantidad = Number(component.cantidad ?? 0);
    const precio = Number(component.precio_unitario ?? 0);
    const desperdicio =
      component.tipo_componente === "material"
        ? 1 + Number(component.porcentaje_desperdicio ?? 0) / 100
        : 1;
    const subtotal = cantidad * precio * desperdicio;
    if (typeof onSum === "function") {
      onSum(subtotal);
    }
    return subtotal;
  }

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  async function submitMaterialPrice(event) {
    event.preventDefault();
    const form = event.target;
    const idMaterial = Number(document.getElementById("materialPriceMaterialId")?.value ?? 0);
    if (!idMaterial) {
      alert("Debes seleccionar un material guardado para registrar un precio.");
      return;
    }
    const valor = Number(document.getElementById("materialPriceValor")?.value ?? 0);
    const fecha = document.getElementById("materialPriceFecha")?.value || getToday();

    if (valor <= 0) {
      alert("Ingresa un valor válido.");
      return;
    }

    const payload = { id_material: idMaterial, valor, fecha };

    try {
      const response = await fetch(`${API_ITEMS}?action=saveMaterialPrice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo registrar el precio.");

      resetMaterialPriceForm(idMaterial);
      hideCollapse("materialPriceForm");
      await loadMaterialPriceHistory(idMaterial);
      await fetchMateriales(true);

      state.lastMaterialImpact = {
        materialId: idMaterial,
        delta: result.delta ?? 0,
        items: result.impacted_items ?? [],
      };

      renderMaterialImpactSummary(idMaterial);
      renderComponentsImpactSummary();

      form.classList.remove("was-validated");
    } catch (error) {
      alert(error.message);
    }
  }

  async function submitItemPrice(event) {
    event.preventDefault();
    const idItem = Number(document.getElementById("itemPriceItemId")?.value ?? 0);
    if (!idItem) {
      alert("Debes seleccionar un ítem guardado para registrar un precio.");
      return;
    }
    const valor = Number(document.getElementById("itemPriceValor")?.value ?? 0);
    const fecha = document.getElementById("itemPriceFecha")?.value || getToday();
    const observaciones = document.getElementById("itemPriceObs")?.value ?? "";

    if (valor <= 0) {
      alert("Ingresa un valor válido.");
      return;
    }

    const payload = { id_item: idItem, valor, fecha, observaciones };

    try {
      const response = await fetch(`${API_ITEMS}?action=saveItemPrice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo registrar el precio del ítem.");

      const modal = document.getElementById("itemPriceModal");
      if (modal) {
        modal.addEventListener("hidden.bs.modal", () => {
          resetItemPriceForm();
          hideCollapse("itemPriceForm");
          state.itemPriceHistory = [];
          const priceSection = document.getElementById("itemPriceSection");
          priceSection?.classList.add("d-none");
        });
      }
      await fetchItems(true);
    } catch (error) {
      alert(error.message);
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  function manageComponents(item) {
    state.selectedItem = item;
    document.getElementById("componentsItemTitle").textContent = `${item.codigo_item} · ${item.nombre_item}`;
    state.componentsModal?.show();
    populateMaterialSelect();
    populateCompositionSelect();
    resetComponentForm();
    resetCompositionForm();
    renderComponentsImpactSummary();
    fetchItemComponents();
    fetchItemComposition();
  }

  function onComponentTypeChange(event) {
    const value = event.target.value;
    const group = document.getElementById("componentMaterialGroup");
    if (!group) return;
    if (value === "material") {
      group.classList.remove("d-none");
    } else {
      group.classList.add("d-none");
      document.getElementById("componentMaterial").value = "";
    }
  }

  function populateMaterialSelect() {
    const select = document.getElementById("componentMaterial");
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione un material</option>';
    state.materiales.forEach((mat) => {
      const option = document.createElement("option");
      option.value = mat.id_material;
      option.textContent = `${mat.cod_material} · ${mat.nombre_material}`;
      select.appendChild(option);
    });
  }

  function populateCompositionSelect() {
    const select = document.getElementById("compositionItemSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione un ítem</option>';
    state.items
      .filter((itm) => itm.id_item !== state.selectedItem?.id_item)
      .forEach((itm) => {
        const option = document.createElement("option");
        option.value = itm.id_item;
        option.textContent = `${itm.codigo_item} · ${itm.nombre_item}`;
        select.appendChild(option);
      });
  }

  async function fetchItemComponents() {
    if (!state.selectedItem) return;
    try {
      setLoading("#tablaItemComponents tbody", 9, "Cargando componentes...");
      const response = await fetch(`${API_ITEMS}?action=getItemComponents&id_item=${state.selectedItem.id_item}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Error al cargar componentes");
      state.itemComponents = result.data;
      renderItemComponents();
    } catch (error) {
      setError("#tablaItemComponents tbody", error.message, 9);
    }
  }

  function renderItemComponents() {
    const tbody = document.querySelector("#tablaItemComponents tbody");
    if (!tbody) return;
    if (!state.itemComponents.length) {
      state.currentItemTotal = 0;
      setEmpty(tbody, 9, "El ítem no tiene componentes registrados.");
      renderComponentsImpactSummary(0);
      return;
    }

    let total = 0;
    tbody.innerHTML = state.itemComponents
      .map(
        (comp) => `
        <tr>
          <td><span class="badge bg-secondary text-uppercase">${comp.tipo_componente}</span></td>
          <td>${comp.cod_material ? `<span class="text-muted">${comp.cod_material}</span><br>${comp.nombre_material}` : "-"}</td>
          <td>${comp.descripcion}</td>
          <td>${comp.unidad}</td>
          <td class="text-end">${Number(comp.cantidad).toFixed(4)}</td>
          <td class="text-end">$${formatCurrency(comp.precio_unitario)}</td>
          <td class="text-end">${Number(comp.porcentaje_desperdicio).toFixed(2)}%</td>
          <td class="text-end">$${formatCurrency(calculateComponentSubtotal(comp, (value) => {
            total += value;
          }))}</td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm" onclick='ItemsUI.editComponent(${JSON.stringify(comp)})'>
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm ms-1" onclick="ItemsUI.deleteComponent(${comp.id_componente})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
      )
      .join("");

    state.currentItemTotal = total;
    renderComponentsImpactSummary(total);
  }

  function resetComponentForm() {
    const form = document.getElementById("formItemComponent");
    if (!form) return;
    form.reset();
    document.getElementById("componentId").value = "";
    document.getElementById("componentTipo").value = "material";
    document.getElementById("componentMaterialGroup").classList.remove("d-none");
    document.getElementById("componentDesperdicio").value = 0;
  }

  function editComponent(component) {
    const form = document.getElementById("formItemComponent");
    if (!form) return;
    document.getElementById("componentId").value = component.id_componente;
    document.getElementById("componentTipo").value = component.tipo_componente;
    document.getElementById("componentDescripcion").value = component.descripcion;
    document.getElementById("componentUnidad").value = component.unidad;
    document.getElementById("componentCantidad").value = component.cantidad;
    document.getElementById("componentPrecio").value = component.precio_unitario;
    document.getElementById("componentDesperdicio").value = component.porcentaje_desperdicio ?? 0;
    if (component.tipo_componente === "material") {
      document.getElementById("componentMaterialGroup").classList.remove("d-none");
      document.getElementById("componentMaterial").value = component.id_material ?? "";
    } else {
      document.getElementById("componentMaterialGroup").classList.add("d-none");
      document.getElementById("componentMaterial").value = "";
    }
  }

  async function submitItemComponent(event) {
    event.preventDefault();
    if (!state.selectedItem) {
      alert("Selecciona un ítem primero.");
      return;
    }
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());
    payload.id_item = state.selectedItem.id_item;
    payload.cantidad = Number(payload.cantidad);
    payload.precio_unitario = Number(payload.precio_unitario);
    payload.porcentaje_desperdicio = Number(payload.porcentaje_desperdicio ?? 0);
    try {
      const response = await fetch(`${API_ITEMS}?action=saveItemComponent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo guardar el componente");
      resetComponentForm();
      fetchItemComponents();
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteComponent(id) {
    if (!confirm("¿Eliminar este componente?")) return;
    try {
      const response = await fetch(`${API_ITEMS}?action=deleteItemComponent&id_componente=${id}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo eliminar el componente");
      fetchItemComponents();
    } catch (error) {
      alert(error.message);
    }
  }

  async function fetchItemComposition() {
    if (!state.selectedItem) return;
    try {
      setLoading("#tablaItemComposition tbody", 6, "Cargando ítems hijos...");
      const response = await fetch(`${API_ITEMS}?action=getItemComposition&id_item=${state.selectedItem.id_item}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Error al cargar composición");
      state.itemComposition = result.data;
      renderItemComposition();
    } catch (error) {
      setError("#tablaItemComposition tbody", error.message, 6);
    }
  }

  function renderItemComposition() {
    const tbody = document.querySelector("#tablaItemComposition tbody");
    if (!tbody) return;
    if (!state.itemComposition.length) {
      setEmpty(tbody, 6, "El ítem no tiene ítems hijos asignados.");
      return;
    }
    tbody.innerHTML = state.itemComposition
      .map(
        (comp) => `
        <tr>
          <td>${comp.codigo_item}</td>
          <td>
            <div class="fw-semibold">${comp.nombre_item}</div>
            <small class="text-muted">${comp.unidad}</small>
          </td>
          <td class="text-end">${Number(comp.cantidad).toFixed(4)}</td>
          <td class="text-end">${comp.orden}</td>
          <td class="text-center">
            <span class="badge ${comp.es_referencia ? "bg-info" : "bg-secondary"}">
              ${comp.es_referencia ? "Sí" : "No"}
            </span>
          </td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm" onclick='ItemsUI.editComposition(${JSON.stringify(comp)})'>
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm ms-1" onclick="ItemsUI.deleteComposition(${comp.id_composicion})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
      )
      .join("");
  }

  function resetCompositionForm() {
    const form = document.getElementById("formItemComposition");
    if (!form) return;
    form.reset();
    document.getElementById("compositionId").value = "";
    document.getElementById("compositionCantidad").value = 1;
    document.getElementById("compositionOrden").value = 1;
    document.getElementById("compositionReferencia").value = 0;
  }

  function editComposition(row) {
    const form = document.getElementById("formItemComposition");
    if (!form) return;
    document.getElementById("compositionId").value = row.id_composicion;
    document.getElementById("compositionItemSelect").value = row.id_item_componente;
    document.getElementById("compositionCantidad").value = row.cantidad;
    document.getElementById("compositionOrden").value = row.orden;
    document.getElementById("compositionReferencia").value = row.es_referencia ?? 0;
  }

  async function submitItemComposition(event) {
    event.preventDefault();
    if (!state.selectedItem) {
      alert("Selecciona un ítem primero.");
      return;
    }
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());
    payload.id_item_compuesto = state.selectedItem.id_item;
    payload.cantidad = Number(payload.cantidad);
    payload.orden = Number(payload.orden ?? 1);
    payload.es_referencia = Number(payload.es_referencia ?? 0);
    try {
      const response = await fetch(`${API_ITEMS}?action=saveItemComposition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo guardar la relación");
      resetCompositionForm();
      fetchItemComposition();
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteComposition(id) {
    if (!confirm("¿Eliminar este ítem hijo?")) return;
    try {
      const response = await fetch(`${API_ITEMS}?action=deleteItemComposition&id_composicion=${id}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo eliminar el ítem hijo");
      fetchItemComposition();
    } catch (error) {
      alert(error.message);
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  function updateMaterialAutocomplete() {
    const datalist = document.getElementById("materialesAutocomplete");
    if (!datalist) return;
    datalist.innerHTML = state.materiales
      .map(
        (mat) => `
        <option value="${mat.cod_material} · ${mat.nombre_material}"
          data-id="${mat.id_material}"
          data-unit="${mat.unidesc || ""}"
          data-price="${mat.precio_actual || 0}">
        </option>`
      )
      .join("");
  }

  function resetDraftComponents() {
    state.loadingDraftComponents = false;
    state.currentItemId = null;
    state.draftComponents = [];
    renderDraftComponents();
  }

  function populateMaterialSelectDropdown() {
    const select = document.getElementById("draftMaterialSelect");
    if (!select) return;
    const options = ['<option value="">Catálogo de materiales</option>'].concat(
      state.materiales.map(
        (mat) =>
          `<option value="${mat.id_material}">${mat.cod_material} · ${mat.nombre_material}</option>`
      )
    );
    select.innerHTML = options.join("");
  }

  function addMaterialFromSelect() {
    const select = document.getElementById("draftMaterialSelect");
    const idMaterial = Number(select?.value ?? 0);
    if (!idMaterial) {
      alert("Selecciona un material del listado.");
      return;
    }

    const material = state.materiales.find((mat) => Number(mat.id_material) === idMaterial);
    if (!material) {
      alert("Material no encontrado.");
      return;
    }

    const exists = state.draftComponents.some(
      (comp) => Number(comp.id_material) === idMaterial
    );
    if (exists) {
      alert("Este material ya fue agregado. Ajusta la cantidad directamente en la tabla.");
      return;
    }

    state.draftComponents.push({
      tipo_componente: material.desc_tipo?.toLowerCase().replace('mano de obra', 'mano_obra').replace(' ', '_') || "material",
      descripcion: material.nombre_material,
      unidad: material.unidesc || "",
      cantidad: 1,
      precio_unitario: Number(material.precio_actual ?? 0),
      porcentaje_desperdicio: 0,
      id_material: material.id_material,
      cod_material: material.cod_material,
      nombre_material: material.nombre_material,
      persisted: false,
      created_at: Date.now(),
    });

    renderDraftComponents();
    select.value = "";
  }

  function handleManualComponentSubmit(event) {
    event.preventDefault();
    const tipo = document.getElementById("manualComponentTipo")?.value ?? "mano_obra";
    const descripcion = document.getElementById("manualComponentDescripcion")?.value.trim() ?? "";
    const unidad = document.getElementById("manualComponentUnidad")?.value.trim() ?? "";
    const cantidad = Number(document.getElementById("manualComponentCantidad")?.value ?? 0);
    const precio = Number(document.getElementById("manualComponentPrecio")?.value ?? 0);
    const desperdicio = Number(document.getElementById("manualComponentDesperdicio")?.value ?? 0);

    if (!descripcion || !unidad || cantidad <= 0 || precio < 0) {
      alert("Completa los datos del recurso manual.");
      return;
    }

    state.draftComponents.push({
      tipo_componente: tipo,
      descripcion,
      unidad,
      cantidad,
      precio_unitario: precio,
      porcentaje_desperdicio: desperdicio,
      id_material: null,
      cod_material: null,
      nombre_material: descripcion,
      persisted: false,
      created_at: Date.now(),
    });

    renderDraftComponents();
    event.target.reset();
  }

  function renderDraftComponents() {
    const badge = document.getElementById("itemComponentsDraftBadge");
    const newWrapper = document.getElementById("itemNewComponentsWrapper");
    const newBody = document.getElementById("itemNewComponentsBody");
    const existingBody = document.getElementById("itemExistingComponentsBody");
    if (!badge || !existingBody || !newBody) return;

    if (state.loadingDraftComponents) {
      badge.textContent = "Cargando...";
      const spinnerRow = `
        <tr>
          <td colspan="8" class="text-center text-muted py-3">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <p class="mb-0 mt-2">Cargando componentes...</p>
          </td>
        </tr>`;
      existingBody.innerHTML = spinnerRow;
      newWrapper?.classList.add("d-none");
      newBody.innerHTML = spinnerRow;
      return;
    }

    const total = state.draftComponents.length;
    badge.textContent = `${total} componente${total === 1 ? "" : "s"}`;

    const entries = state.draftComponents.map((comp, index) => ({ comp, index }));
    const newEntries = entries.filter(({ comp }) => !comp.persisted);
    const existingEntries = entries.filter(({ comp }) => comp.persisted);

    if (newEntries.length) {
      newWrapper?.classList.remove("d-none");
      const sortedNew = [...newEntries].sort(
        (a, b) => (b.comp.created_at || 0) - (a.comp.created_at || 0)
      );
      newBody.innerHTML = sortedNew.map(({ comp, index }) => buildComponentRow(comp, index)).join("");
    } else {
      newWrapper?.classList.add("d-none");
      newBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-3">
            Aún no has agregado componentes manuales.
          </td>
        </tr>`;
    }

    const emptyExistingMessage = state.currentItemId
      ? "Este ítem aún no tiene componentes registrados."
      : "Aún no has agregado componentes.";

    if (existingEntries.length) {
      existingBody.innerHTML = existingEntries.map(({ comp, index }) => buildComponentRow(comp, index)).join("");
    } else {
      existingBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-3">
            ${emptyExistingMessage}
          </td>
        </tr>`;
    }
  }

  function buildComponentRow(comp, index) {
    const subtotal = calculateComponentSubtotal(comp);
    return `
      <tr>
        <td>
          <span class="badge ${comp.tipo_componente === "material" ? "bg-primary" : "bg-secondary"} text-uppercase">
            ${COMPONENT_TYPE_LABELS[comp.tipo_componente] || comp.tipo_componente}
          </span>
        </td>
        <td>
          <div class="fw-semibold">
            ${comp.cod_material ? `${comp.cod_material} · ` : ""}${comp.nombre_material || comp.descripcion}
          </div>
          <small class="text-muted">${comp.descripcion || "-"}</small>
        </td>
        <td class="text-end">${comp.unidad || "-"}</td>
        <td class="text-end" style="width: 110px;">
          <input type="number" class="form-control form-control-sm text-end" min="0.0001" step="0.0001"
            value="${comp.cantidad}"
            onchange="ItemsUI.updateDraftComponent(${index}, 'cantidad', this.value)">
        </td>
        <td class="text-end" style="width: 110px;">
          <input type="number" class="form-control form-control-sm text-end" min="0" step="0.01"
            value="${comp.precio_unitario}"
            onchange="ItemsUI.updateDraftComponent(${index}, 'precio_unitario', this.value)">
        </td>
        <td class="text-end" style="width: 110px;">
          <input type="number" class="form-control form-control-sm text-end" min="0" step="0.01"
            value="${comp.porcentaje_desperdicio}"
            onchange="ItemsUI.updateDraftComponent(${index}, 'porcentaje_desperdicio', this.value)">
        </td>
        <td class="text-end">$${formatCurrency(subtotal)}</td>
        <td class="text-center">
          <button class="btn btn-outline-danger btn-sm"
            onclick="ItemsUI.removeDraftComponent(${index})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  }

  function updateDraftComponent(index, field, value) {
    if (!state.draftComponents[index]) return;
    const numericFields = ["cantidad", "precio_unitario", "porcentaje_desperdicio"];
    state.draftComponents[index][field] = numericFields.includes(field) ? Number(value) : value;
    renderDraftComponents();
  }

  function removeDraftComponent(index) {
    const component = state.draftComponents[index];
    if (!component) return;
    if (component.persisted && component.id_componente) {
      state.removedComponentIds.add(Number(component.id_componente));
    }
    state.draftComponents.splice(index, 1);
    renderDraftComponents();
  }

  async function loadItemComponentsForModal(itemId) {
    if (!itemId) return;
    state.loadingDraftComponents = true;
    renderDraftComponents();
    try {
      const response = await fetch(`${API_ITEMS}?action=getItemComponents&id_item=${itemId}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "No se pudo obtener los componentes del ítem.");
      state.draftComponents = (result.data || []).map(mapApiComponentToDraft);
    } catch (error) {
      console.error(error);
      const existingBody = document.getElementById("itemExistingComponentsBody");
      if (existingBody) {
        existingBody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center text-danger py-3">
              ${error.message}
            </td>
          </tr>`;
      }
      state.draftComponents = [];
    } finally {
      state.loadingDraftComponents = false;
      renderDraftComponents();
    }
  }

  function mapApiComponentToDraft(component) {
    return {
      id_componente: component.id_componente,
      tipo_componente: component.tipo_componente,
      descripcion: component.descripcion,
      unidad: component.unidad,
      cantidad: Number(component.cantidad ?? 0),
      precio_unitario: Number(component.precio_unitario ?? 0),
      porcentaje_desperdicio: Number(component.porcentaje_desperdicio ?? 0),
      id_material: component.id_material,
      cod_material: component.cod_material,
      nombre_material: component.nombre_material || component.descripcion,
      persisted: true,
    };
  }

  function serializeDraftComponents() {
    return state.draftComponents.map((comp) => ({
      id_componente: comp.id_componente ?? null,
      tipo_componente: comp.tipo_componente,
      descripcion: comp.descripcion,
      unidad: comp.unidad,
      cantidad: Number(comp.cantidad ?? 0),
      precio_unitario: Number(comp.precio_unitario ?? 0),
      porcentaje_desperdicio: Number(comp.porcentaje_desperdicio ?? 0),
      id_material: comp.id_material ?? null,
    }));
  }

  function openComponentsFromEdit() {
    const item = JSON.parse(decodeURIComponent(document.getElementById("manageComponentsFromEditBtn")?.getAttribute("data-item") ?? ""));
    manageComponents(item);
  }

  return {
    fetchMateriales,
    fetchItems,
    filterMateriales,
    filterItems,
    prepareMaterialModal,
    prepareItemModal,
    submitMaterial,
    submitItem,
    editMaterial,
    editItemById,
    editItem,
    toggleMaterial,
    toggleItem,
    manageComponents,
    editComponent,
    deleteComponent,
    editComposition,
    deleteComposition,
    submitMaterialPrice,
    submitItemPrice,
    removeDraftComponent,
    openComponentsFromEdit,
  };
})();

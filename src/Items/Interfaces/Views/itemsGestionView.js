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
    draftComposition: [], // Items anidados (items dentro de items)
    removedComponentIds: new Set(),
    removedCompositionIds: new Set(), // IDs de composiciones eliminadas
    loadingDraftComponents: false,
    loadingDraftComposition: false,
    currentItemId: null,
    itemChildItems: [],
    childItemBreakdowns: {},
    childItemBreakdownLoading: new Set(),
    loadingChildItems: false,
    childItemsError: null,
    // Estado de paginación
    pagination: {
      materiales: {
        currentPage: 1,
        perPage: 25,
        totalPages: 1,
      },
      items: {
        currentPage: 1,
        perPage: 25,
        totalPages: 1,
      },
    },
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

    // Evitar error del navegador: "An invalid form control ... is not focusable"
    // Los inputs required dentro de collapses/sections ocultas deben deshabilitarse.
    wireItemPriceFooterValidation();

    const importRecursosBtn = document.getElementById("btnImportarRecursosMasivo");
    if (importRecursosBtn) {
      importRecursosBtn.addEventListener("click", () => openImportRecursosModal());
    }

    const importRecursosForm = document.getElementById("formImportRecursos");
    if (importRecursosForm) {
      importRecursosForm.addEventListener("submit", (e) => submitImportRecursos(e));
    }

    const btnPreview = document.getElementById("btnPreviewImportRecursos");
    if (btnPreview) {
      btnPreview.addEventListener("click", () => previewImportRecursos());
    }

    const fileInputRecursos = document.getElementById("archivo_excel_recursos");
    if (fileInputRecursos) {
      fileInputRecursos.addEventListener("change", () => {
        document.getElementById("importRecursosPreviewContainer")?.classList.add("d-none");
        document.getElementById("btnSubmitImportRecursos")?.classList.add("d-none");
        document.getElementById("btnPreviewImportRecursos")?.classList.remove("d-none");
        document.getElementById("importRecursosResultado")?.classList.add("d-none");
      });
    }

    // Event listeners para agregar recursos por tipo
    document.getElementById("addMaterialFromSelectBtn")?.addEventListener("click", () => addResourceFromSelect('material'));
    document.getElementById("addManoObraFromSelectBtn")?.addEventListener("click", () => addResourceFromSelect('mano_obra'));
    document.getElementById("addMaquinariaFromSelectBtn")?.addEventListener("click", () => addResourceFromSelect('equipo'));

    // Event listener para cuando el modal de ítem se muestra completamente
    const modalItemElement = document.querySelector(selectors.modalItem);
    if (modalItemElement) {
      modalItemElement.addEventListener('shown.bs.modal', function () {
        // Re-inicializar Select2 cuando el modal esté completamente visible
        loadResourceSelectsByType();
      });
    }

    await Promise.all([fetchAuxData(), fetchMateriales(), fetchItems()]);

    // Cargar selectores filtrados por tipo
    loadResourceSelectsByType();
  }

  function setItemPriceFooterInputsEnabled(enabled) {
    const valor = document.getElementById('itemPriceValorFooter');
    const fecha = document.getElementById('itemPriceFechaFooter');
    const obs = document.getElementById('itemPriceObsFooter');
    const btn = document.querySelector('#itemPriceFormFooter button[type="submit"]');

    [valor, fecha, obs, btn].forEach((el) => {
      if (!el) return;
      el.disabled = !enabled;
    });

    if (valor) valor.required = Boolean(enabled);
    if (fecha) fecha.required = Boolean(enabled);

    if (!enabled) {
      if (valor) valor.value = '';
      if (fecha) fecha.value = '';
      if (obs) obs.value = '';
    }
  }

  function wireItemPriceFooterValidation() {
    const insights = document.getElementById('itemInsightsSectionFooter');
    const collapseEl = document.getElementById('itemPriceFormFooter');

    // Estado inicial: si la sección está oculta, deshabilitar inputs.
    const isInsightsVisible = Boolean(insights && !insights.classList.contains('d-none'));
    const isCollapseShown = Boolean(collapseEl && collapseEl.classList.contains('show'));
    setItemPriceFooterInputsEnabled(isInsightsVisible && isCollapseShown);

    if (!collapseEl) return;

    collapseEl.addEventListener('shown.bs.collapse', () => {
      const isVisible = Boolean(insights && !insights.classList.contains('d-none'));
      setItemPriceFooterInputsEnabled(isVisible);
    });

    collapseEl.addEventListener('hidden.bs.collapse', () => {
      setItemPriceFooterInputsEnabled(false);
    });
  }

  function openImportRecursosModal() {
    const modalEl = document.getElementById("modalImportRecursos");
    if (!modalEl) return;

    const resultEl = document.getElementById("importRecursosResultado");
    if (resultEl) {
      resultEl.classList.add("d-none");
      resultEl.innerHTML = "";
    }

    document.getElementById("importRecursosPreviewContainer")?.classList.add("d-none");
    document.getElementById("btnSubmitImportRecursos")?.classList.add("d-none");
    document.getElementById("btnPreviewImportRecursos")?.classList.remove("d-none");

    const fileInput = document.getElementById("archivo_excel_recursos");
    if (fileInput) fileInput.value = "";

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  async function previewImportRecursos() {
    const fileInput = document.getElementById("archivo_excel_recursos");
    const resultEl = document.getElementById("importRecursosResultado");
    const previewContainer = document.getElementById("importRecursosPreviewContainer");
    const previewBody = document.getElementById("importRecursosPreviewBody");
    const btnPreview = document.getElementById("btnPreviewImportRecursos");
    const btnSubmit = document.getElementById("btnSubmitImportRecursos");

    const file = fileInput?.files?.[0];
    if (!file) {
      alert("Por favor selecciona un archivo Excel.");
      return;
    }

    if (btnPreview) btnPreview.disabled = true;
    if (resultEl) {
      resultEl.classList.remove("d-none");
      resultEl.innerHTML = '<div class="text-info mt-2">Leyendo archivo...</div>';
    }

    const formData = new FormData();
    formData.append("archivo_excel", file);

    try {
      const response = await fetch(`${API_ITEMS}?action=previewImportRecursosMasivo`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!data.success) {
        const msg = data.error || "No se pudo leer el archivo.";
        if (resultEl) resultEl.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(msg)}</div>`;
        return;
      }

      // Render table
      if (previewBody) {
        const totalRows = data.data.length;
        const incompletosCount = data.data.filter(r => r.incomplete).length;
        const validosCount = totalRows - incompletosCount;

        // Resumen antes de la tabla
        let summaryHtml = '';
        if (incompletosCount > 0) {
          summaryHtml = `<div class="alert alert-warning py-2 mb-2 d-flex align-items-start gap-2">
            <i class="bi bi-exclamation-triangle-fill mt-1"></i>
            <div>
              <strong>${incompletosCount} registro(s) con datos nulos</strong> quedarán como <span class="badge bg-secondary">Inactivo</span> hasta completar sus datos. 
              Podrás <strong>reimportar el Excel corregido</strong> cuantas veces sea necesario.<br>
              <small class="text-muted">Los registros incompletos se importarán pero no pueden activarse hasta completar todos sus campos.</small>
            </div>
          </div>`;
        }
        if (validosCount > 0) {
          summaryHtml += `<div class="alert alert-success py-2 mb-2">
            <i class="bi bi-check-circle-fill me-1"></i> <strong>${validosCount} registro(s) válido(s)</strong> listos para importar.
          </div>`;
        }

        // Inyectar el resumen encima de la tabla
        const previewContainerEl = document.getElementById("importRecursosPreviewContainer");
        let summaryEl = document.getElementById('importPreviewSummary');
        if (!summaryEl) {
          summaryEl = document.createElement('div');
          summaryEl.id = 'importPreviewSummary';
          previewContainerEl?.insertBefore(summaryEl, previewContainerEl.firstChild);
        }
        summaryEl.innerHTML = summaryHtml;

        previewBody.innerHTML = data.data.map(row => {
          const rowClass = row.incomplete ? 'table-warning' : '';
          const faltantes = row.camposFaltantes || [];
          const renderCell = (val, campo) => {
            const isEmpty = faltantes.includes(campo);
            if (isEmpty) return `<span class="badge bg-danger"><i class="bi bi-exclamation-circle"></i> Nulo</span>`;
            return `<span>${escapeHtml(String(val))}</span>`;
          };
          const renderNumCell = (val, campo) => {
            const isEmpty = faltantes.includes(campo);
            if (isEmpty || Number(val) <= 0) return `<span class="badge bg-danger"><i class="bi bi-exclamation-circle"></i> Nulo</span>`;
            return `<span>$${Number(val).toLocaleString('es-CO')}</span>`;
          };
          return `
            <tr class="${rowClass}">
              <td>${renderCell(row.codigo, 'C\u00d3DIGO')}</td>
              <td>${renderCell(row.nombre, 'NOMBRE')}</td>
              <td>${renderCell(row.tipo, 'TIPO')}</td>
              <td>${renderCell(row.unidad, 'UNIDAD')}</td>
              <td>${renderNumCell(row.precio, 'PRECIO')}</td>
              <td><small>${escapeHtml(String(row.minimoComercial || 1.0))}</small></td>
              <td><small>${escapeHtml(row.presentacion || '-')}</small></td>
              <td class="text-center">
                ${row.valido 
                  ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> V\u00e1lido</span>' 
                  : `<span class="badge bg-warning text-dark" 
                       title="${escapeHtml(row.motivoIncompleto)}">
                       <i class="bi bi-clock"></i> Incompleto
                     </span>`}
              </td>
            </tr>
          `;
        }).join('');
      }

      if (previewContainer) previewContainer.classList.remove("d-none");
      if (btnSubmit) btnSubmit.classList.remove("d-none");
      if (btnPreview) btnPreview.classList.add("d-none");
      if (resultEl) resultEl.classList.add("d-none");

    } catch (error) {
      if (resultEl) {
        resultEl.classList.remove("d-none");
        resultEl.innerHTML = `<div class="alert alert-danger mb-0">Error: ${escapeHtml(error.message)}</div>`;
      }
    } finally {
      if (btnPreview) btnPreview.disabled = false;
    }
  }

  async function submitImportRecursos(event) {
    event.preventDefault();

    const fileInput = document.getElementById("archivo_excel_recursos");
    const resultEl = document.getElementById("importRecursosResultado");
    const submitBtn = document.getElementById("btnSubmitImportRecursos");

    const file = fileInput?.files?.[0];
    if (!file) {
      alert("Por favor selecciona un archivo Excel.");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (resultEl) {
      resultEl.classList.remove("d-none");
      resultEl.innerHTML = '<div class="text-info">Procesando archivo...</div>';
    }

    const formData = new FormData();
    formData.append("archivo_excel", file);

    try {
      const response = await fetch(`${API_ITEMS}?action=importRecursosMasivo`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!data.success) {
        const msg = data.error || "No se pudo importar el archivo.";
        if (resultEl) resultEl.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(msg)}</div>`;
        return;
      }

      if (resultEl) {
        const inserted = Number(data.inserted || 0);
        const skipped = Number(data.skipped || 0);
        const incomplete = Number(data.incomplete || 0);
        const incompleteDetails = data.incompleteDetails || [];

        let html = `<div class="alert alert-success mb-2">
          <i class="bi bi-check-circle-fill me-1"></i>
          Importación finalizada. • <strong>${inserted}</strong> insertado(s). • <strong>${skipped}</strong> omitido(s) (ya existían).
        </div>`;

        if (incomplete > 0) {
          let detailRows = incompleteDetails.map(d => 
            `<li><strong>${escapeHtml(d.codigo)}</strong> – ${escapeHtml(d.nombre)} <span class="text-danger">(Nulos: ${d.camposFaltantes.join(', ')})</span></li>`
          ).join('');
          html += `<div class="alert alert-warning mb-0">
            <strong><i class="bi bi-exclamation-triangle-fill me-1"></i>${incomplete} recurso(s) importado(s) como Inactivo</strong> por datos nulos:
            <ul class="mb-1 mt-1 ps-3" style="max-height:120px;overflow-y:auto;font-size:0.85rem">${detailRows}</ul>
            <small>✅ Corrige el Excel con los campos faltantes y vuelve a importar. Los registros ya existentes se omitirán automáticamente (sin duplicados).
            <br>⚠️ Estos recursos <strong>no pueden activarse</strong> hasta completar todos sus campos obligatorios.</small>
          </div>`;
        }

        resultEl.innerHTML = html;
      }

      await fetchMateriales(true);
    } catch (error) {
      if (resultEl) resultEl.innerHTML = `<div class="alert alert-danger mb-0">Error: ${escapeHtml(error.message)}</div>`;
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function escapeHtml(value) {
    const str = String(value ?? "");
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")
      .replaceAll("\n", " ")
      .replaceAll("\r", " ")
      .replaceAll("\t", " ");
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
      state.materialesFiltrados = [];

      // Resetear paginación y renderizar con paginación
      state.pagination.materiales.currentPage = 1;
      renderMaterialesPaginated(state.materiales);
    } catch (error) {
      setError(selectors.tablaMateriales, error.message, 7);
    }
  }

  async function fetchItems(force = false) {
    try {
      if (!force && state.items.length > 0) {
        const dataToRender = state.itemsFiltrados.length ? state.itemsFiltrados : state.items;
        renderItemsPaginated(dataToRender);
        return;
      }

      setLoading(selectors.tablaItems, 8, "Cargando ítems...");

      const response = await fetch(`${API_ITEMS}?action=getItems`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Error al cargar ítems");

      state.items = result.data;
      state.itemsFiltrados = [];

      // Resetear paginación y renderizar con paginación
      state.pagination.items.currentPage = 1;
      renderItemsPaginated(state.items);
    } catch (error) {
      console.error(error);
      setError(selectors.tablaItems, error.message || "No se pudieron cargar los ítems");
    }
  }

  function renderMateriales(data) {
    const tbody = document.querySelector(selectors.tablaMateriales);
    if (!tbody) return;

    if (!data.length) {
      setEmpty(tbody, 9, "No hay materiales registrados.");
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
          <td class="text-center">
            <span class="badge bg-info">
              ${Number(material.minimo_comercial || 1.0).toFixed(2)}
            </span>
          </td>
          <td>
            <small class="text-muted">${material.presentacion_comercial || 'Unidad'}</small>
          </td>
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
      state.pagination.materiales.currentPage = 1;
      renderMaterialesPaginated(state.materiales);
      return;
    }
    state.materialesFiltrados = state.materiales.filter(
      (mat) =>
        mat.cod_material.toLowerCase().includes(term) ||
        mat.nombre_material.toLowerCase().includes(term) ||
        (mat.desc_tipo || "").toLowerCase().includes(term)
    );
    state.pagination.materiales.currentPage = 1;
    renderMaterialesPaginated(state.materialesFiltrados);
  }

  function filterItems() {
    const term = document.querySelector(selectors.searchItems)?.value.trim().toLowerCase() ?? "";
    if (!term) {
      state.itemsFiltrados = [];
      state.pagination.items.currentPage = 1;
      renderItemsPaginated(state.items);
      return;
    }
    state.itemsFiltrados = state.items.filter(
      (item) =>
        item.codigo_item.toLowerCase().includes(term) ||
        item.nombre_item.toLowerCase().includes(term) ||
        (item.descripcion || "").toLowerCase().includes(term)
    );
    state.pagination.items.currentPage = 1;
    renderItemsPaginated(state.itemsFiltrados);
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
      document.getElementById("materialMinimoComercial").value = material.minimo_comercial || 1.0;
      document.getElementById("materialPresentacionComercial").value = material.presentacion_comercial || '';
      priceWrapper?.classList.remove("d-none");
      resetMaterialPriceForm(material.id_material);
      hideCollapse("materialPriceForm");
      renderMaterialImpactSummary(material.id_material);
      loadMaterialPriceHistory(material.id_material);
    } else {
      document.getElementById("materialMinimoComercial").value = 1.0;
      document.getElementById("materialPresentacionComercial").value = '';
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

      // Si el modal de ítem está abierto, refrescar inmediatamente los selects de recursos
      // (caso típico: creas un material y sin recargar quieres verlo en el select del ítem)
      const modalItemElement = document.querySelector(selectors.modalItem);
      const isItemModalOpen = Boolean(modalItemElement && modalItemElement.classList.contains('show'));

      // Recargar los selects filtrados por tipo para que aparezcan los nuevos materiales
      if (isItemModalOpen) {
        // Pequeña espera para asegurar que el DOM del modal y Select2 estén en estado estable
        setTimeout(() => {
          try {
            loadResourceSelectsByType();
          } catch (e) {
            // silenciar
          }
        }, 150);
      } else {
        loadResourceSelectsByType();
      }

      // Refrescar otros selects/datalists de materiales
      try {
        populateMaterialSelectDropdown();
      } catch (e) {
        // silenciar
      }

      try {
        updateMaterialAutocomplete();
      } catch (e) {
        // silenciar
      }

      // También recargar el select general de materiales si existe
      if (typeof populateMaterialSelect === 'function') {
        populateMaterialSelect();
      }
    } catch (error) {
      alert(error.message);
    }
  }

  async function toggleMaterial(id) {
    // Buscar el material en el estado local para verificar si tiene datos incompletos
    const material = state.materiales.find(m => m.id_material == id);
    const estaActivo = material && Number(material.idestado) === 1;

    // Si intenta ACTIVAR (actualmente inactivo), verificar datos completos
    if (!estaActivo) {
      const tieneError = !material?.id_tipo_material || !material?.idunidad || !material?.precio_actual;
      if (tieneError) {
        const camposFaltantes = [];
        if (!material?.id_tipo_material) camposFaltantes.push('TIPO');
        if (!material?.idunidad) camposFaltantes.push('UNIDAD');
        if (!material?.precio_actual) camposFaltantes.push('PRECIO');
        alert(
          `⚠️ No se puede activar este recurso.\n\n` +
          `Campos obligatorios pendientes: ${camposFaltantes.join(', ')}.\n\n` +
          `Por favor, corrija el archivo Excel con los datos faltantes y reimpórtelo, ` +
          `o edite manualmente el recurso para completar los campos.`
        );
        return;
      }
    }

    try {
      const response = await fetch(`${API_ITEMS}?action=toggleMaterial&id_material=${id}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "No se pudo cambiar el estado");

      await fetchMateriales(true);

      // Recargar los selects para reflejar el cambio de estado
      loadResourceSelectsByType();

      if (typeof populateMaterialSelect === 'function') {
        populateMaterialSelect();
      }
    } catch (error) {
      console.error("Error al cambiar estado del material:", error);
      alert("Error: " + error.message);
    }
  }

  function prepareItemModal(item = null) {
    const form = document.getElementById("formItem");
    if (!form) return;

    console.log('[prepareItemModal] before reset, #itemId.value:', document.getElementById("itemId").value);
    form.reset();
    console.log('[prepareItemModal] after reset, #itemId.value:', document.getElementById("itemId").value);
    console.log('[prepareItemModal] item:', item);
    document.getElementById("itemId").value = item?.id_item ?? "";
    console.log('[prepareItemModal] after setting, #itemId.value:', document.getElementById("itemId").value);
    document.getElementById("modalItemLabel").textContent = item ? "Editar Ítem" : "Nuevo Ítem";

    if (item) {
      document.getElementById("itemCodigo").value = item.codigo_item;
      document.getElementById("itemNombre").value = item.nombre_item;
      document.getElementById("itemUnidad").value = item.unidad;
      document.getElementById("itemDescripcion").value = item.descripcion || "";
      document.getElementById("itemEstado").value = item.idestado ?? 1;
      const priceSection = document.getElementById("itemPriceSection");
      if (priceSection) {
        priceSection.classList.remove("d-none");
      }
    }

    // El formulario de precio del footer debe estar deshabilitado cuando el insight no aplica
    // (por ejemplo al crear un ítem nuevo).
    const insightsFooter = document.getElementById('itemInsightsSectionFooter');
    if (insightsFooter) {
      if (item) {
        // Se mostrará solo cuando haya cálculos/impactos; por defecto mantener oculto.
        insightsFooter.classList.add('d-none');
      } else {
        insightsFooter.classList.add('d-none');
      }
    }
    setItemPriceFooterInputsEnabled(false);
    state.currentItemId = item?.id_item ?? null;

    // Resetear componentes básicos
    resetDraftComponents();
    state.removedComponentIds = new Set();

    // Resetear items anidados (composición)
    resetDraftComposition();
    state.removedCompositionIds = new Set();

    if (item) {
      loadItemComponentsForModal(item.id_item);
      loadItemCompositionForModal(item.id_item);
    } else {
      renderDraftComponents();
      renderDraftComposition();
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

    // Poblar selector de items para composición
    populateItemsSelectForComposition();

    // Cargar selectores de recursos con Select2
    loadResourceSelectsByType();
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
    console.log('[editItem] after modal.show(), #itemId.value:', document.getElementById("itemId").value);
  }

  async function submitItem(event) {
    event.preventDefault();
    console.log('[submitItem] at start, #itemId.value:', document.getElementById("itemId").value);
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());
    console.log('[submitItem] payload from FormData:', payload);
    console.log('[submitItem] payload.id_item_main:', payload.id_item_main);

    payload.idestado = Number(payload.idestado ?? 1);

    const isEdit = Boolean(payload.id_item_main);
    let endpoint = isEdit ? "updateItem" : "createItem";
    let requestBody = payload;

    // Debug: log endpoint, isEdit, and payload.id_item_main
    console.log('[submitItem] isEdit:', isEdit, 'endpoint:', endpoint, 'payload.id_item_main:', payload.id_item_main);

    if (!isEdit && (state.draftComponents.length || state.draftComposition.length)) {
      endpoint = "createItemWithRelations";
      const serializedComponents = serializeDraftComponents().map(({ id_componente, ...rest }) => rest);
      const serializedComposition = serializeDraftComposition().map(({ id_composicion, ...rest }) => rest);
      requestBody = {
        item: payload,
        componentes: serializedComponents,
        composicion: serializedComposition,
        precio: null,
      };
    } else if (isEdit) {
      requestBody = {
        ...payload,
        componentes: serializeDraftComponents(),
        composicion: serializeDraftComposition(),
        removed_component_ids: Array.from(state.removedComponentIds),
        removed_composition_ids: Array.from(state.removedCompositionIds),
      };
      console.log('[submitItem] requestBody for edit:', requestBody);
      console.log('[submitItem] removed_component_ids being sent:', Array.from(state.removedComponentIds));
    }

    try {
      const response = await fetch(`${API_ITEMS}?action=${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      let result = null;
      try {
        result = await response.json();
      } catch (e) {
        result = null;
      }

      if (!response.ok) {
        const msg = (result && (result.error || result.message))
          ? (result.error || result.message)
          : `Error HTTP ${response.status}`;
        throw new Error(msg);
      }

      if (!result || !result.success) throw new Error((result && result.error) || "No se pudo guardar el ítem");

      state.itemModal.hide();
      resetDraftComponents();
      resetDraftComposition();
      state.removedComponentIds = new Set();
      state.removedCompositionIds = new Set();
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

  // ========== FUNCIONES PARA SELECTORES POR TIPO DE RECURSO ==========

  function loadResourceSelectsByType() {
    // Verificar que jQuery esté disponible
    if (typeof $ === 'undefined' || typeof jQuery === 'undefined') {
      return;
    }

    // Verificar que Select2 esté disponible
    if (typeof $.fn.select2 === 'undefined') {
      return;
    }

    if (!state.materiales || state.materiales.length === 0) {
      return;
    }

    function getSelect2DropdownParent() {
      const modal = document.querySelector(selectors.modalItem);
      if (!modal) return $(document.body);
      // En algunos layouts el modal tiene offsets raros; usar modal-content ayuda a que el dropdown
      // se posicione relativo al contenido visible.
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) return $(modalContent);
      return $(modal);
    }

    // Mapeo de tipos de material a tipos de componente
    const tipoMaterialMap = {
      1: 'mano_obra',     // Mano de obra
      2: 'material',      // Material
      3: 'equipo',        // Equipo/Maquinaria
      4: 'transporte',    // Transporte
      5: 'otro'           // Otro
    };

    // Filtrar materiales por tipo y solo activos (idestado = 1)
    const materialesPorTipo = {
      material: state.materiales.filter(m => tipoMaterialMap[m.id_tipo_material] === 'material' && m.idestado == 1),
      mano_obra: state.materiales.filter(m => tipoMaterialMap[m.id_tipo_material] === 'mano_obra' && m.idestado == 1),
      equipo: state.materiales.filter(m => tipoMaterialMap[m.id_tipo_material] === 'equipo' && m.idestado == 1)
    };

    // Destruir instancias anteriores de Select2 si existen
    try {
      if ($('#draftMaterialSelect').data('select2')) {
        $('#draftMaterialSelect').select2('destroy');
      }
      if ($('#draftManoObraSelect').data('select2')) {
        $('#draftManoObraSelect').select2('destroy');
      }
      if ($('#draftMaquinariaSelect').data('select2')) {
        $('#draftMaquinariaSelect').select2('destroy');
      }
    } catch (error) {
      // Silenciar errores de destrucción
    }

    // Llenar selector de materiales
    const selectMaterial = document.getElementById('draftMaterialSelect');
    if (selectMaterial) {
      selectMaterial.innerHTML = '<option value="">Seleccionar material...</option>';
      materialesPorTipo.material.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat.id_material;
        option.textContent = `${mat.cod_material} - ${mat.nombre_material} ($${formatCurrency(mat.precio_actual)})`;
        option.dataset.material = JSON.stringify(mat);
        selectMaterial.appendChild(option);
      });

      // Inicializar Select2
      try {
        $('#draftMaterialSelect').select2({
          theme: 'bootstrap-5',
          placeholder: 'Buscar material...',
          allowClear: true,
          width: '100%',
          dropdownParent: getSelect2DropdownParent(),
          language: {
            noResults: function () {
              return "No se encontraron materiales";
            },
            searching: function () {
              return "Buscando...";
            }
          }
        });
      } catch (error) {
        // Silenciar errores de inicialización
      }
    }

    // Llenar selector de mano de obra
    const selectManoObra = document.getElementById('draftManoObraSelect');
    if (selectManoObra) {
      selectManoObra.innerHTML = '<option value="">Seleccionar mano de obra...</option>';
      materialesPorTipo.mano_obra.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat.id_material;
        option.textContent = `${mat.cod_material} - ${mat.nombre_material} ($${formatCurrency(mat.precio_actual)})`;
        option.dataset.material = JSON.stringify(mat);
        selectManoObra.appendChild(option);
      });

      // Inicializar Select2
      try {
        $('#draftManoObraSelect').select2({
          theme: 'bootstrap-5',
          placeholder: 'Buscar mano de obra...',
          allowClear: true,
          width: '100%',
          dropdownParent: getSelect2DropdownParent(),
          language: {
            noResults: function () {
              return "No se encontró mano de obra";
            },
            searching: function () {
              return "Buscando...";
            }
          }
        });
      } catch (error) {
        // Silenciar errores de inicialización
      }
    }

    // Llenar selector de maquinaria
    const selectMaquinaria = document.getElementById('draftMaquinariaSelect');
    if (selectMaquinaria) {
      selectMaquinaria.innerHTML = '<option value="">Seleccionar equipo...</option>';
      materialesPorTipo.equipo.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat.id_material;
        option.textContent = `${mat.cod_material} - ${mat.nombre_material} ($${formatCurrency(mat.precio_actual)})`;
        option.dataset.material = JSON.stringify(mat);
        selectMaquinaria.appendChild(option);
      });

      // Inicializar Select2
      try {
        $('#draftMaquinariaSelect').select2({
          theme: 'bootstrap-5',
          placeholder: 'Buscar equipo/maquinaria...',
          allowClear: true,
          width: '100%',
          dropdownParent: getSelect2DropdownParent(),
          language: {
            noResults: function () {
              return "No se encontraron equipos";
            },
            searching: function () {
              return "Buscando...";
            }
          }
        });
      } catch (error) {
        // Silenciar errores de inicialización
      }
    }
  }

  function addResourceFromSelect(tipoComponente) {
    let selectId;
    switch (tipoComponente) {
      case 'material':
        selectId = 'draftMaterialSelect';
        break;
      case 'mano_obra':
        selectId = 'draftManoObraSelect';
        break;
      case 'equipo':
        selectId = 'draftMaquinariaSelect';
        break;
      default:
        console.error('Tipo de componente no válido:', tipoComponente);
        return;
    }

    const select = document.getElementById(selectId);
    if (!select || !select.value) {
      alert('Por favor selecciona un recurso primero');
      return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const material = JSON.parse(selectedOption.dataset.material || '{}');

    if (!material.id_material) {
      alert('Error al obtener información del recurso');
      return;
    }

    // Crear componente borrador
    const newComponent = {
      id_componente: null,
      tipo_componente: tipoComponente,
      id_material: material.id_material,
      descripcion: material.nombre_material,
      unidad: material.unidesc || 'UND',
      cantidad: 1,
      precio_unitario: parseFloat(material.precio_actual || 0),
      porcentaje_desperdicio: tipoComponente === 'material' ? 5 : 0,
      cod_material: material.cod_material
    };

    state.draftComponents.push(newComponent);
    renderDraftComponents();

    // Resetear selector
    select.selectedIndex = 0;

    console.log('Recurso agregado:', newComponent);
  }

  function renderDraftComponents() {
    // Separar componentes por tipo
    const componentesPorTipo = {
      material: state.draftComponents.filter(c => c.tipo_componente === 'material'),
      mano_obra: state.draftComponents.filter(c => c.tipo_componente === 'mano_obra'),
      equipo: state.draftComponents.filter(c => c.tipo_componente === 'equipo')
    };

    // Renderizar Materiales
    const containerMateriales = document.getElementById('componentesMaterialesContainer');
    if (containerMateriales) {
      if (componentesPorTipo.material.length === 0) {
        containerMateriales.innerHTML = '<div class="text-muted small text-center py-3">No hay materiales agregados</div>';
      } else {
        containerMateriales.innerHTML = componentesPorTipo.material.map((comp) => {
          const idx = state.draftComponents.indexOf(comp);
          const subtotal = comp.cantidad * comp.precio_unitario * (1 + comp.porcentaje_desperdicio / 100);
          return `
            <div class="card mb-2 shadow-sm">
              <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <small class="fw-bold text-primary">${comp.cod_material || ''}</small>
                  <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="ItemsUI.removeDraftComponent(${idx})" title="Eliminar">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <div class="small mb-1">${comp.descripcion}</div>
                <div class="row g-1 small mb-2">
                  <div class="col-6">
                    <label class="form-label mb-0" style="font-size: 0.7rem;">Unidad</label>
                    <input type="text" class="form-control form-control-sm bg-light text-muted" value="${comp.unidad}" readonly style="cursor: not-allowed;">
                  </div>
                  <div class="col-6">
                    <label class="form-label mb-0" style="font-size: 0.7rem;">P. Unit</label>
                    <input type="number" class="form-control form-control-sm bg-light text-muted" value="${comp.precio_unitario}" readonly style="cursor: not-allowed;">
                  </div>
                </div>
                <div class="row g-1 small">
                  <div class="col-6">
                    <label class="form-label mb-0 fw-bold" style="font-size: 0.7rem;">Cantidad</label>
                    <input type="number" class="form-control form-control-sm border-success" value="${comp.cantidad}" 
                           onchange="ItemsUI.updateDraftComponent(${idx}, 'cantidad', this.value)" step="0.01" min="0.01" style="border-width: 2px;">
                  </div>
                  <div class="col-6">
                    <label class="form-label mb-0 fw-bold" style="font-size: 0.7rem;">% Desp.</label>
                    <input type="number" class="form-control form-control-sm border-success" value="${comp.porcentaje_desperdicio}" 
                           onchange="ItemsUI.updateDraftComponent(${idx}, 'porcentaje_desperdicio', this.value)" step="0.1" min="0" style="border-width: 2px;">
                  </div>
                </div>
                <div class="mt-1 text-end">
                  <small class="text-muted">Subtotal:</small>
                  <strong class="text-primary">$${formatCurrency(subtotal)}</strong>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Renderizar Mano de Obra
    const containerManoObra = document.getElementById('componentesManoObraContainer');
    if (containerManoObra) {
      if (componentesPorTipo.mano_obra.length === 0) {
        containerManoObra.innerHTML = '<div class="text-muted small text-center py-3">No hay mano de obra agregada</div>';
      } else {
        containerManoObra.innerHTML = componentesPorTipo.mano_obra.map((comp) => {
          const idx = state.draftComponents.indexOf(comp);
          const subtotal = comp.cantidad * comp.precio_unitario;
          return `
            <div class="card mb-2 shadow-sm">
              <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <small class="fw-bold text-success">${comp.cod_material || ''}</small>
                  <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="ItemsUI.removeDraftComponent(${idx})" title="Eliminar">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <div class="small mb-1">${comp.descripcion}</div>
                <div class="row g-1 small mb-2">
                  <div class="col-6">
                    <label class="form-label mb-0" style="font-size: 0.7rem;">Unidad</label>
                    <input type="text" class="form-control form-control-sm bg-light text-muted" value="${comp.unidad}" readonly style="cursor: not-allowed;">
                  </div>
                  <div class="col-6">
                    <label class="form-label mb-0" style="font-size: 0.7rem;">P. Unit</label>
                    <input type="number" class="form-control form-control-sm bg-light text-muted" value="${comp.precio_unitario}" readonly style="cursor: not-allowed;">
                  </div>
                </div>
                <div class="row g-1 small">
                  <div class="col-12">
                    <label class="form-label mb-0 fw-bold" style="font-size: 0.7rem;">Cantidad</label>
                    <input type="number" class="form-control form-control-sm border-success" value="${comp.cantidad}" 
                           onchange="ItemsUI.updateDraftComponent(${idx}, 'cantidad', this.value)" step="0.01" min="0.01" style="border-width: 2px;">
                  </div>
                </div>
                <div class="mt-1 text-end">
                  <small class="text-muted">Subtotal:</small>
                  <strong class="text-success">$${formatCurrency(subtotal)}</strong>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Renderizar Maquinaria/Equipos
    const containerMaquinaria = document.getElementById('componentesMaquinariaContainer');
    if (containerMaquinaria) {
      if (componentesPorTipo.equipo.length === 0) {
        containerMaquinaria.innerHTML = '<div class="text-muted small text-center py-3">No hay equipos agregados</div>';
      } else {
        containerMaquinaria.innerHTML = componentesPorTipo.equipo.map((comp) => {
          const idx = state.draftComponents.indexOf(comp);
          const subtotal = comp.cantidad * comp.precio_unitario;
          return `
            <div class="card mb-2 shadow-sm">
              <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <small class="fw-bold text-warning">${comp.cod_material || ''}</small>
                  <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="ItemsUI.removeDraftComponent(${idx})" title="Eliminar">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <div class="small mb-1">${comp.descripcion}</div>
                <div class="row g-1 small mb-2">
                  <div class="col-6">
                    <label class="form-label mb-0" style="font-size: 0.7rem;">Unidad</label>
                    <input type="text" class="form-control form-control-sm bg-light text-muted" value="${comp.unidad}" readonly style="cursor: not-allowed;">
                  </div>
                  <div class="col-6">
                    <label class="form-label mb-0" style="font-size: 0.7rem;">P. Unit</label>
                    <input type="number" class="form-control form-control-sm bg-light text-muted" value="${comp.precio_unitario}" readonly style="cursor: not-allowed;">
                  </div>
                </div>
                <div class="row g-1 small">
                  <div class="col-12">
                    <label class="form-label mb-0 fw-bold" style="font-size: 0.7rem;">Cantidad</label>
                    <input type="number" class="form-control form-control-sm border-success" value="${comp.cantidad}" 
                           onchange="ItemsUI.updateDraftComponent(${idx}, 'cantidad', this.value)" step="0.01" min="0.01" style="border-width: 2px;">
                  </div>
                </div>
                <div class="mt-1 text-end">
                  <small class="text-muted">Subtotal:</small>
                  <strong class="text-warning">$${formatCurrency(subtotal)}</strong>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Actualizar badge de total de componentes
    const totalComponentes = state.draftComponents.length;
    const badge = document.getElementById('itemComponentsDraftBadge');
    if (badge) {
      badge.textContent = `${totalComponentes} componente${totalComponentes !== 1 ? 's' : ''}`;
    }
  }

  function updateDraftComponent(index, field, value) {
    if (index >= 0 && index < state.draftComponents.length) {
      state.draftComponents[index][field] = parseFloat(value) || 0;
      renderDraftComponents();
    }
  }

  function removeDraftComponent(index) {
    const component = state.draftComponents[index];
    console.log('[removeDraftComponent] component:', component);
    if (!component) return;
    if (confirm('¿Eliminar este componente?')) {
      if (component.persisted && component.id_componente) {
        console.log('[removeDraftComponent] Adding to removedComponentIds:', component.id_componente);
        state.removedComponentIds.add(Number(component.id_componente));
        console.log('[removeDraftComponent] removedComponentIds now:', Array.from(state.removedComponentIds));
      }
      state.draftComponents.splice(index, 1);
      renderDraftComponents();
    }
  }

  function resetDraftComponents() {
    state.draftComponents = [];
    renderDraftComponents();
  }

  // ========== FUNCIONES DE PAGINACIÓN ==========

  function renderMaterialesPaginated(data) {
    const perPage = state.pagination.materiales.perPage;
    const currentPage = state.pagination.materiales.currentPage;
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / perPage) || 1;

    state.pagination.materiales.totalPages = totalPages;

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalItems);
    const pageData = data.slice(startIndex, endIndex);

    renderMateriales(pageData);

    document.getElementById('materialesShowingStart').textContent = totalItems > 0 ? startIndex + 1 : 0;
    document.getElementById('materialesShowingEnd').textContent = endIndex;
    document.getElementById('materialesTotalCount').textContent = totalItems;

    renderMaterialesPaginationControls(currentPage, totalPages);
  }

  function renderMaterialesPaginationControls(currentPage, totalPages) {
    const paginationContainer = document.getElementById('materialesPagination');
    if (!paginationContainer) return;

    let html = '';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${currentPage - 1}); return false;">Anterior</a>
    </li>`;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(1); return false;">1</a></li>`;
      if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${i}); return false;">${i}</a>
      </li>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      html += `<li class="page-item"><a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${totalPages}); return false;">${totalPages}</a></li>`;
    }

    html += `<li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${currentPage + 1}); return false;">Siguiente</a>
    </li>`;

    paginationContainer.innerHTML = html;
  }

  function goToMaterilesPage(page) {
    const totalPages = state.pagination.materiales.totalPages;
    if (page < 1 || page > totalPages) return;

    state.pagination.materiales.currentPage = page;
    const dataToRender = state.materialesFiltrados.length > 0 ? state.materialesFiltrados : state.materiales;
    renderMaterialesPaginated(dataToRender);
  }

  function changeMaterilesPerPage() {
    const select = document.getElementById('materialesPerPage');
    state.pagination.materiales.perPage = parseInt(select.value);
    state.pagination.materiales.currentPage = 1;
    const dataToRender = state.materialesFiltrados.length > 0 ? state.materialesFiltrados : state.materiales;
    renderMaterialesPaginated(dataToRender);
  }

  function renderItemsPaginated(data) {
    const perPage = state.pagination.items.perPage;
    const currentPage = state.pagination.items.currentPage;
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / perPage) || 1;

    state.pagination.items.totalPages = totalPages;

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalItems);
    const pageData = data.slice(startIndex, endIndex);

    renderItems(pageData);

    document.getElementById('itemsShowingStart').textContent = totalItems > 0 ? startIndex + 1 : 0;
    document.getElementById('itemsShowingEnd').textContent = endIndex;
    document.getElementById('itemsTotalCount').textContent = totalItems;

    renderItemsPaginationControls(currentPage, totalPages);
  }

  function renderItemsPaginationControls(currentPage, totalPages) {
    const paginationContainer = document.getElementById('itemsPagination');
    if (!paginationContainer) return;

    let html = '';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${currentPage - 1}); return false;">Anterior</a>
    </li>`;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(1); return false;">1</a></li>`;
      if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${i}); return false;">${i}</a>
      </li>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      html += `<li class="page-item"><a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${totalPages}); return false;">${totalPages}</a></li>`;
    }

    html += `<li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${currentPage + 1}); return false;">Siguiente</a>
    </li>`;

    paginationContainer.innerHTML = html;
  }

  function goToItemsPage(page) {
    const totalPages = state.pagination.items.totalPages;
    if (page < 1 || page > totalPages) return;

    state.pagination.items.currentPage = page;
    const dataToRender = state.itemsFiltrados.length > 0 ? state.itemsFiltrados : state.items;
    renderItemsPaginated(dataToRender);
  }

  function changeItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    state.pagination.items.perPage = parseInt(select.value);
    state.pagination.items.currentPage = 1;
    const dataToRender = state.itemsFiltrados.length > 0 ? state.itemsFiltrados : state.items;
    renderItemsPaginated(dataToRender);
  }

  // ========== FUNCIONES PARA ITEMS ANIDADOS (COMPOSICIÓN) ==========

  function resetDraftComposition() {
    state.loadingDraftComposition = false;
    state.draftComposition = [];
    renderDraftComposition();
  }

  function populateItemsSelectForComposition() {
    const select = document.getElementById("draftItemSelect");
    if (!select) return;

    const currentItemId = state.currentItemId;
    const availableItems = state.items.filter(item =>
      item.idestado === 1 && item.id_item !== currentItemId
    );

    select.innerHTML = '<option value="">Seleccionar ítem...</option>';
    availableItems.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id_item;
      option.textContent = `${item.codigo_item} - ${item.nombre_item} (${item.unidad})`;
      option.dataset.item = JSON.stringify(item);
      select.appendChild(option);
    });
  }

  function addItemFromSelect() {
    const select = document.getElementById("draftItemSelect");
    const idItem = Number(select?.value ?? 0);
    if (!idItem) {
      alert("Selecciona un ítem del listado.");
      return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const item = JSON.parse(selectedOption.dataset.item || '{}');

    if (!item.id_item) {
      alert("Error al obtener información del ítem.");
      return;
    }

    // Verificar si ya existe
    const exists = state.draftComposition.some(
      comp => Number(comp.id_item_componente) === idItem
    );
    if (exists) {
      alert("Este ítem ya fue agregado. Ajusta la cantidad directamente en la tabla.");
      return;
    }

    state.draftComposition.push({
      id_composicion: null,
      id_item_componente: item.id_item,
      codigo_item: item.codigo_item,
      nombre_item: item.nombre_item,
      unidad: item.unidad,
      cantidad: 1,
      orden: state.draftComposition.length + 1,
      es_referencia: 1,
      persisted: false,
      created_at: Date.now(),
    });

    renderDraftComposition();
    select.value = "";
  }

  function renderDraftComposition() {
    const badge = document.getElementById("itemCompositionDraftBadge");
    const container = document.getElementById("itemCompositionDraftContainer");

    if (!badge || !container) return;

    if (state.loadingDraftComposition) {
      badge.textContent = "Cargando...";
      container.innerHTML = `
        <div class="text-center text-muted py-3">
          <div class="spinner-border spinner-border-sm" role="status"></div>
          <p class="mb-0 mt-2">Cargando items anidados...</p>
        </div>`;
      return;
    }

    const total = state.draftComposition.length;
    badge.textContent = `${total} ítem${total === 1 ? "" : "s"} anidado${total === 1 ? "" : "s"}`;

    if (!total) {
      container.innerHTML = `
        <div class="text-center text-muted py-3">
          <i class="bi bi-inbox"></i>
          <p class="mb-0">No hay ítems anidados agregados.</p>
          <small>Los ítems anidados son otros ítems que forman parte de este ítem.</small>
        </div>`;
      return;
    }

    const rows = state.draftComposition
      .sort((a, b) => a.orden - b.orden)
      .map((comp, index) => `
        <tr>
          <td>
            <span class="badge bg-info">${comp.orden}</span>
          </td>
          <td>
            <div class="fw-semibold">${comp.codigo_item}</div>
            <small class="text-muted">${comp.nombre_item}</small>
          </td>
          <td class="text-end">${comp.unidad}</td>
          <td class="text-end" style="width: 120px;">
            <input type="number" class="form-control form-control-sm text-end" 
              min="0.0001" step="0.0001" value="${comp.cantidad}"
              onchange="ItemsUI.updateDraftCompositionField(${index}, 'cantidad', this.value)">
          </td>
          <td class="text-center">
            <span class="badge ${comp.es_referencia ? 'bg-success' : 'bg-secondary'}">
              ${comp.es_referencia ? 'Sí' : 'No'}
            </span>
          </td>
          <td class="text-center">
            <button class="btn btn-outline-danger btn-sm" 
              onclick="ItemsUI.removeDraftCompositionItem(${index})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join("");

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-hover">
          <thead class="table-light">
            <tr>
              <th style="width: 60px;">Orden</th>
              <th>Ítem</th>
              <th class="text-end">Unidad</th>
              <th class="text-end" style="width: 120px;">Cantidad</th>
              <th class="text-center">Referencia</th>
              <th class="text-center" style="width: 80px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>`;
  }

  function updateDraftCompositionField(index, field, value) {
    if (!state.draftComposition[index]) return;
    const numericFields = ["cantidad", "orden", "es_referencia"];
    state.draftComposition[index][field] = numericFields.includes(field) ? Number(value) : value;
    renderDraftComposition();
  }

  function removeDraftCompositionItem(index) {
    const composition = state.draftComposition[index];
    if (!composition) return;

    if (composition.persisted && composition.id_composicion) {
      state.removedCompositionIds.add(Number(composition.id_composicion));
    }

    state.draftComposition.splice(index, 1);

    // Reordenar
    state.draftComposition.forEach((comp, idx) => {
      comp.orden = idx + 1;
    });

    renderDraftComposition();
  }

  async function loadItemCompositionForModal(itemId) {
    if (!itemId) return;

    state.loadingDraftComposition = true;
    renderDraftComposition();

    try {
      const response = await fetch(`${API_ITEMS}?action=getItemComposition&id_item=${itemId}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "No se pudo obtener la composición del ítem.");

      state.draftComposition = (result.data || []).map(comp => ({
        id_composicion: comp.id_composicion,
        id_item_componente: comp.id_item_componente,
        codigo_item: comp.codigo_item,
        nombre_item: comp.nombre_item,
        unidad: comp.unidad,
        cantidad: Number(comp.cantidad ?? 1),
        orden: Number(comp.orden ?? 1),
        es_referencia: Number(comp.es_referencia ?? 1),
        persisted: true,
      }));
    } catch (error) {
      console.error(error);
      state.draftComposition = [];
    } finally {
      state.loadingDraftComposition = false;
      renderDraftComposition();
    }
  }

  function serializeDraftComposition() {
    return state.draftComposition.map(comp => ({
      id_composicion: comp.id_composicion ?? null,
      id_item_componente: comp.id_item_componente,
      cantidad: Number(comp.cantidad ?? 1),
      orden: Number(comp.orden ?? 1),
      es_referencia: Number(comp.es_referencia ?? 1),
    }));
  }


  return {
    init,
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
    updateDraftComponent,
    openComponentsFromEdit,
    // Funciones de items anidados
    addItemFromSelect,
    updateDraftCompositionField,
    removeDraftCompositionItem,
    // Funciones de paginación
    goToMaterilesPage,
    changeMaterilesPerPage,
    goToItemsPage,
    changeItemsPerPage,
  };
})();

// Exponer el módulo globalmente
window.ItemsUI = ItemsUI;

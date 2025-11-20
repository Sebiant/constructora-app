let proyectosData = [];
let itemsData = { componentesAgrupados: [], itemsIndividuales: [] };
let materialesExtra = [];
let pedidosFueraPresupuesto = [];
let seleccionActual = null;

class PaginadorPresupuestos {
  constructor() {
    this.elementosPorPagina = 10;
    this.paginaActual = 1;
    this.itemsFiltrados = [];
    this.totalPaginas = 1;
  }

  inicializar() {
    this.crearControlesPaginacion();
    this.actualizarPaginacion();
  }

  crearControlesPaginacion() {
    const materialesList = document.getElementById("materialesList");
    const contenedorPaginacion = document.createElement("div");
    contenedorPaginacion.id = "paginacionContainer";
    contenedorPaginacion.className =
      "row align-items-center mt-4 p-3 bg-light rounded";
    contenedorPaginacion.innerHTML = `
      <div class="col-md-4">
        <div class="text-muted small">
          Mostrando <span class="fw-bold text-primary" id="paginacionDesde">0</span>-<span class="fw-bold text-primary" id="paginacionHasta">0</span> de
          <span class="fw-bold text-dark" id="paginacionTotal">0</span> componentes
        </div>
      </div>
      <div class="col-md-4 text-center">
        <nav aria-label="Paginación de presupuestos">
          <ul class="pagination pagination-sm justify-content-center mb-0">
            <li class="page-item" id="btnPaginaAnterior">
              <a class="page-link" href="#" aria-label="Anterior">
                <span aria-hidden="true">&laquo;</span>
              </a>
            </li>
            <div id="numerosPagina" class="d-flex"></div>
            <li class="page-item" id="btnPaginaSiguiente">
              <a class="page-link" href="#" aria-label="Siguiente">
                <span aria-hidden="true">&raquo;</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div class="col-md-4 text-end">
        <div class="d-flex align-items-center justify-content-end">
          <label class="form-label mb-0 me-2 small text-muted">Componentes por página:</label>
          <select class="form-select form-select-sm w-auto" id="selectItemsPorPagina">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    `;

    materialesList.parentNode.insertBefore(
      contenedorPaginacion,
      materialesList.nextSibling
    );

    document
      .getElementById("btnPaginaAnterior")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.paginaAnterior();
      });

    document
      .getElementById("btnPaginaSiguiente")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.paginaSiguiente();
      });

    document
      .getElementById("selectItemsPorPagina")
      .addEventListener("change", (e) => {
        this.cambiarElementosPorPagina(parseInt(e.target.value));
      });
  }

  configurar(items) {
    this.itemsFiltrados = items;
    this.totalPaginas = Math.ceil(items.length / this.elementosPorPagina);
    this.paginaActual = 1;
    this.actualizarPaginacion();
    this.mostrarPaginaActual();
  }

  obtenerItemsPaginaActual() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.itemsFiltrados.slice(inicio, fin);
  }

  actualizarPaginacion() {
    const totalItems = this.itemsFiltrados.length;
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina + 1;
    const fin = Math.min(
      this.paginaActual * this.elementosPorPagina,
      totalItems
    );

    if (totalItems > 0) {
      document.getElementById("paginacionDesde").textContent = inicio;
      document.getElementById("paginacionHasta").textContent = fin;
    } else {
      document.getElementById("paginacionDesde").textContent = "0";
      document.getElementById("paginacionHasta").textContent = "0";
    }
    document.getElementById("paginacionTotal").textContent = totalItems;

    this.actualizarBotonesPaginacion();
    this.actualizarNumerosPagina();
  }

  actualizarBotonesPaginacion() {
    const btnAnterior = document.getElementById("btnPaginaAnterior");
    const btnSiguiente = document.getElementById("btnPaginaSiguiente");
    btnAnterior.classList.toggle("disabled", this.paginaActual === 1);
    btnSiguiente.classList.toggle(
      "disabled",
      this.paginaActual === this.totalPaginas
    );
  }

  actualizarNumerosPagina() {
    const numerosPagina = document.getElementById("numerosPagina");
    numerosPagina.innerHTML = "";

    if (this.totalPaginas <= 1) return;

    let inicio = Math.max(1, this.paginaActual - 2);
    let fin = Math.min(this.totalPaginas, this.paginaActual + 2);

    if (fin - inicio < 4) {
      if (this.paginaActual <= 3) {
        fin = Math.min(5, this.totalPaginas);
      } else {
        inicio = Math.max(1, this.totalPaginas - 4);
      }
    }

    if (inicio > 1) {
      const li = document.createElement("li");
      li.className = "page-item";
      li.innerHTML = `<a class="page-link" href="#">1</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        this.irAPagina(1);
      });
      numerosPagina.appendChild(li);

      if (inicio > 2) {
        const ellipsis = document.createElement("li");
        ellipsis.className = "page-item disabled";
        ellipsis.innerHTML = `<span class="page-link">...</span>`;
        numerosPagina.appendChild(ellipsis);
      }
    }

    for (let i = inicio; i <= fin; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === this.paginaActual ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        this.irAPagina(i);
      });
      numerosPagina.appendChild(li);
    }

    if (fin < this.totalPaginas) {
      if (fin < this.totalPaginas - 1) {
        const ellipsis = document.createElement("li");
        ellipsis.className = "page-item disabled";
        ellipsis.innerHTML = `<span class="page-link">...</span>`;
        numerosPagina.appendChild(ellipsis);
      }

      const li = document.createElement("li");
      li.className = "page-item";
      li.innerHTML = `<a class="page-link" href="#">${this.totalPaginas}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        this.irAPagina(this.totalPaginas);
      });
      numerosPagina.appendChild(li);
    }
  }

  irAPagina(pagina) {
    if (
      pagina >= 1 &&
      pagina <= this.totalPaginas &&
      pagina !== this.paginaActual
    ) {
      this.paginaActual = pagina;
      this.mostrarPaginaActual();
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.mostrarPaginaActual();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.mostrarPaginaActual();
    }
  }

  cambiarElementosPorPagina(cantidad) {
    this.elementosPorPagina = cantidad;
    this.totalPaginas = Math.ceil(
      this.itemsFiltrados.length / this.elementosPorPagina
    );
    this.paginaActual = 1;
    this.mostrarPaginaActual();
  }

  mostrarPaginaActual() {
    const itemsPagina = this.obtenerItemsPaginaActual();
    this.mostrarItemsEnVista(itemsPagina);
    this.actualizarPaginacion();

    const materialesList = document.getElementById("materialesList");
    if (materialesList) {
      materialesList.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  mostrarItemsEnVista(items) {
    const container = document.getElementById("materialesList");

    if (!items || items.length === 0) {
      container.innerHTML = `
      <div class="text-center text-muted py-5">
        <div class="spinner-border text-muted" role="status"></div>
        <p class="mt-3">No hay componentes en esta página</p>
      </div>
    `;
      return;
    }

    let html = `
    <div class="alert alert-info mb-3">
      <strong>Vista de Resumen:</strong>
      Los componentes están agrupados. Use los filtros laterales para filtrar por tipo. Haga clic en "Desglose" para ver detalles.
    </div>
  `;

    items.forEach((comp) => {
      const unidad = comp.unidad_componente || "UND";
      const cantidadTotal = parseFloat(comp.total_necesario) || 0;
      const yaPedido = parseFloat(comp.ya_pedido) || 0;
      const cantidadPedido = calcularTotalPedidoComponente(comp);
      comp.pedido = cantidadPedido;
      const subtotal = cantidadPedido * comp.precio_unitario;
      const totalCantidadNecesaria = (comp.items_que_usan || []).reduce(
        (sum, item) => sum + (parseFloat(item.cantidad_componente) || 0),
        0
      );
      const totalCantidadYaPedida = (comp.items_que_usan || []).reduce(
        (sum, item) =>
          sum + (parseFloat(item.ya_pedido_item ?? item.ya_pedido) || 0),
        0
      );

      const porcentajeYaPedido =
        cantidadTotal > 0 ? (yaPedido / cantidadTotal) * 100 : 0;
      const porcentajePedidoActual =
        cantidadTotal > 0 ? (cantidadPedido / cantidadTotal) * 100 : 0;

      html += `
      <div class="card mb-3 shadow-sm componente-card"
           data-tipo="${comp.tipo_componente}"
           data-id="${comp.id_componente}">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0">
              <strong>${comp.nombre_componente}</strong>
            </h6>
            <small class="text-muted">${obtenerNombreTipoComponente(
              comp.tipo_componente
            )} | Capítulo(s): ${comp.items_que_usan
                .map((item) => item.nombre_capitulo)
                .filter((c) => c)
                .join(", ")}</small>
          </div>
          <div>
            <span class="badge ${obtenerClaseBadgeTipo(
              comp.tipo_componente
            )}">${unidad}</span>
            <span class="badge ${obtenerColorProgreso(
              porcentajeYaPedido + porcentajePedidoActual
            ).colorClass} ms-1">${obtenerColorProgreso(
        porcentajeYaPedido + porcentajePedidoActual
      ).colorText}</span>
            <button class="btn btn-sm btn-outline-info ms-2" onclick="toggleDesgloseComponente('${comp.id_componente}')">
              Desglose
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-3">
              <small class="text-muted">Cantidad Total Necesaria</small>
              <div><strong>${parseFloat(cantidadTotal).toFixed(
                4
              )} ${unidad}</strong></div>
              <div class="mt-1">
                <small class="text-muted">
                  <i class="bi bi-check-circle text-success"></i> Ya pedido: 
                  <strong class="text-success">${parseFloat(yaPedido).toFixed(
                    4
                  )} ${unidad}</strong>
                  (${porcentajeYaPedido.toFixed(1)}%)
                </small>
              </div>
            </div>
            <div class="col-md-2">
              <small class="text-muted">Precio Unitario</small>
              <div><strong>$${formatCurrency(
                comp.precio_unitario
              )}</strong></div>
            </div>
            <div class="col-md-7">
              <div class="alert alert-info mb-0">
                <small>
                  Este componente se debe pedir item por item. Use el botón "Desglose" para registrar cantidades específicas.
                </small>
              </div>
            </div>
          </div>

          <div class="mb-2">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted">Progreso del pedido</small>
              <small class="text-muted">
                ${porcentajeYaPedido.toFixed(1)}% ya pedido + 
                ${porcentajePedidoActual.toFixed(1)}% nuevo = 
                ${porcentajeYaPedido + porcentajePedidoActual}%
              </small>
            </div>
            <div class="progress" style="height: 12px;">
              <!-- Barra de progreso para lo ya pedido -->
              <div class="progress-bar bg-success" role="progressbar"
                   style="width: ${porcentajeYaPedido}%"
                   aria-valuenow="${porcentajeYaPedido}" aria-valuemin="0" aria-valuemax="100"
                   title="Ya pedido: ${porcentajeYaPedido.toFixed(1)}%">
              </div>
              <!-- Barra de progreso para el nuevo pedido -->
              <div class="progress-bar ${obtenerColorProgreso(
                porcentajeYaPedido + porcentajePedidoActual
              ).colorClass}" role="progressbar"
                   style="width: ${porcentajePedidoActual}%"
                   aria-valuenow="${porcentajePedidoActual}" aria-valuemin="0" aria-valuemax="100"
                   title="Nuevo pedido: ${porcentajePedidoActual.toFixed(1)}%">
              </div>
            </div>
          </div>

          <div id="desglose-comp-${comp.id_componente}" style="display: none;" class="mt-3">
            <hr>
            <h6 class="text-primary mb-3">Desglose Detallado</h6>
            <div class="table-responsive">
              <table class="table table-sm table-bordered tabla-desglose-componentes" data-comp-id="${comp.id_componente}">
                <thead class="table-light">
                  <tr>
                    <th>Código Item</th>
                    <th>Nombre del Item</th>
                    <th>Capítulo</th>
                    <th class="text-end">Cantidad Necesaria</th>
                    <th class="text-end">Cantidad ya pedida</th>
                    <th class="text-end">% Ya pedido</th>
                    <th class="text-end">Cantidad a pedir</th>
                    <th class="text-end">Subtotal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${comp.items_que_usan
                    .map((item) => {
                      const pedidoItem = parseFloat(item.pedido_actual || 0);
                      const yaPedidoItem = parseFloat(
                        (item.ya_pedido_item ?? item.ya_pedido) ?? 0
                      );
                      const cantidadNecesariaItem =
                        parseFloat(item.cantidad_componente) || 0;
                      const maxPermitido = Math.max(
                        0,
                        cantidadNecesariaItem - yaPedidoItem
                      );
                      const subtotalItem = pedidoItem * comp.precio_unitario;
                      const porcentajeItem =
                        cantidadNecesariaItem > 0
                          ? Math.min(
                              100,
                              (yaPedidoItem / cantidadNecesariaItem) * 100
                            )
                          : 0;
                      const badgeClass =
                        porcentajeItem >= 100
                          ? "bg-success"
                          : porcentajeItem >= 80
                          ? "bg-warning"
                          : "bg-info";
                      return `
                    <tr>
                      <td><strong>${item.codigo_item}</strong></td>
                      <td>${item.nombre_item}</td>
                      <td><small class="text-muted">${item.nombre_capitulo || "N/A"}</small></td>
                      <td class="text-end">${cantidadNecesariaItem.toFixed(4)} ${unidad}</td>
                      <td class="text-end">${yaPedidoItem.toFixed(4)} ${unidad}</td>
                      <td class="text-end">
                        <span class="badge ${badgeClass}">
                          ${porcentajeItem.toFixed(1)}%
                        </span>
                      </td>
                      <td class="text-end" style="width: 180px;">
                        <div class="input-group input-group-sm">
                          <input type="number"
                                 class="form-control form-control-sm cantidad-componente-item"
                                 value="${pedidoItem.toFixed(4)}"
                                 min="0"
                                 max="${maxPermitido.toFixed(4)}"
                                 step="0.0001"
                                 data-componente-id="${comp.id_componente}"
                                 data-item-id="${item.id_item}"
                                 data-precio="${comp.precio_unitario}"
                                 data-unidad="${unidad}">
                          <span class="input-group-text">${unidad}</span>
                        </div>
                        <small class="text-muted">Máx: ${maxPermitido.toFixed(4)}</small>
                      </td>
                      <td class="text-end subtotal-item">$${formatCurrency(subtotalItem)}</td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-outline-success" type="button" data-action="max-item">
                          <i class="bi bi-plus-circle"></i>
                        </button>
                      </td>
                    </tr>
                  `;
                    })
                    .join("")}
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <td colspan="3" class="text-end"><strong>Totales:</strong></td>
                    <td class="text-end"><strong>${totalCantidadNecesaria.toFixed(4)} ${unidad}</strong></td>
                    <td class="text-end"><strong>${totalCantidadYaPedida.toFixed(4)} ${unidad}</strong></td>
                    <td colspan="3"></td>
                  </tr>
                  <tr>
                    <td colspan="6" class="text-end"><strong>Total solicitado:</strong></td>
                    <td class="text-end"><strong class="total-desglose" data-comp-id="${comp.id_componente}">$${formatCurrency(
                      subtotal
                    )}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    });

    container.innerHTML = html;

    document
      .querySelectorAll(".tabla-desglose-componentes")
      .forEach((table) => {
        table.addEventListener("change", manejarCambioCantidadItem);
        table.addEventListener("click", manejarClickBtnItem);
      });
  }
}

function calcularTotalPedidoComponente(componente) {
  if (!componente || !Array.isArray(componente.items_que_usan)) return 0;
  return componente.items_que_usan.reduce((total, item) => {
    return total + (parseFloat(item.pedido_actual) || 0);
  }, 0);
}

function manejarCambioCantidadItem(event) {
  if (!event.target.classList.contains("cantidad-componente-item")) return;
  const input = event.target;
  const max = parseFloat(input.max);
  let value = parseFloat(input.value) || 0;

  if (!Number.isNaN(max) && max >= 0 && value > max) {
    value = max;
  }

  if (value < 0) value = 0;
  input.value = value.toFixed(4);
  actualizarPedidoItemDesdeInput(input, value);
}

function manejarClickBtnItem(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  event.preventDefault();

  if (button.dataset.action === "max-item") {
    const row = button.closest("tr");
    const input = row?.querySelector(".cantidad-componente-item");
    if (input) {
      const max = parseFloat(input.max) || 0;
      input.value = max.toFixed(4);
      actualizarPedidoItemDesdeInput(input, max);
    }
  }
}

function actualizarPedidoItemDesdeInput(input, cantidad) {
  const componenteId = input.dataset.componenteId;
  const itemId = input.dataset.itemId;

  const componente = itemsData.componentesAgrupados?.find(
    (comp) => String(comp.id_componente) === String(componenteId)
  );
  if (!componente) return;

  const item = componente.items_que_usan?.find(
    (itm) => String(itm.id_item) === String(itemId)
  );
  if (!item) return;

  const yaPedidoItem = parseFloat(item.ya_pedido_item) || 0;
  const cantidadNecesaria = parseFloat(item.cantidad_componente) || 0;
  const maxPermitido = Math.max(0, cantidadNecesaria - yaPedidoItem);
  const precioUnitario = parseFloat(input.dataset.precio) || 0;

  let nuevoValor = cantidad;
  if (nuevoValor > maxPermitido) {
    nuevoValor = maxPermitido;
    input.value = maxPermitido.toFixed(4);
  }

  item.pedido_actual = nuevoValor;

  const subtotalCell = input.closest("tr")?.querySelector(".subtotal-item");
  if (subtotalCell) {
    subtotalCell.textContent = `$${formatCurrency(nuevoValor * precioUnitario)}`;
  }

  actualizarTotalesDesglose(componente);
  actualizarResumenComponente(componente);
  actualizarCarrito();
  actualizarEstadisticas();
}

function actualizarTotalesDesglose(componente) {
  if (!componente) return;
  const totalElement = document.querySelector(
    `.total-desglose[data-comp-id="${componente.id_componente}"]`
  );
  if (!totalElement) return;

  const total = componente.items_que_usan.reduce((sum, item) => {
    return sum + (parseFloat(item.pedido_actual) || 0) * componente.precio_unitario;
  }, 0);

  totalElement.textContent = `$${formatCurrency(total)}`;
}

function actualizarResumenComponente(componente) {
  if (!componente) return;
  const card = document.querySelector(
    `.componente-card[data-id="${componente.id_componente}"]`
  );
  if (!card) return;

  const cantidadTotal = parseFloat(componente.total_necesario) || 0;
  const yaPedido = parseFloat(componente.ya_pedido) || 0;
  const pedidoActual = calcularTotalPedidoComponente(componente);
  componente.pedido = pedidoActual;

  const porcentajeYaPedido =
    cantidadTotal > 0 ? (yaPedido / cantidadTotal) * 100 : 0;
  const porcentajePedidoActual =
    cantidadTotal > 0 ? (pedidoActual / cantidadTotal) * 100 : 0;
  const porcentajeTotal = Math.min(
    porcentajeYaPedido + porcentajePedidoActual,
    100
  );

  const resumenProgreso = card.querySelector(
    ".mb-2 .d-flex small:last-child"
  );
  if (resumenProgreso) {
    resumenProgreso.textContent = `${porcentajeYaPedido.toFixed(
      1
    )}% ya pedido + ${porcentajePedidoActual.toFixed(
      1
    )}% nuevo = ${porcentajeTotal.toFixed(1)}% total`;
  }

  const barras = card.querySelectorAll(".progress .progress-bar");
  if (barras.length >= 2) {
    barras[0].style.width = `${Math.min(100, Math.max(0, porcentajeYaPedido))}%`;
    barras[0].setAttribute("aria-valuenow", porcentajeYaPedido.toFixed(1));

    barras[1].style.width = `${Math.min(
      100,
      Math.max(0, porcentajePedidoActual)
    )}%`;
    barras[1].setAttribute("aria-valuenow", porcentajePedidoActual.toFixed(1));

    const estado = obtenerColorProgreso(porcentajeTotal);
    barras[1].className = `progress-bar ${estado.colorClass}`;

    const badge = card.querySelector(".card-header .badge.ms-1");
    if (badge) {
      badge.className = `badge ${estado.colorClass} ms-1`;
      badge.textContent = estado.colorText;
    }
  }

  const totalFooter = card.querySelector(
    `.total-desglose[data-comp-id="${componente.id_componente}"]`
  );
  if (totalFooter) {
    const totalMonetario = componente.items_que_usan.reduce((sum, item) => {
      return sum + (parseFloat(item.pedido_actual) || 0) * componente.precio_unitario;
    }, 0);
    totalFooter.textContent = `$${formatCurrency(totalMonetario)}`;
  }
}

const paginador = new PaginadorPresupuestos();

function toggleDesglose(itemId) {
  const desglose = document.getElementById(`desglose-${itemId}`);
  const button = document.querySelector(
    `[onclick="toggleDesglose(${itemId})"]`
  );

  if (desglose.style.display === "none") {
    desglose.style.display = "block";
    button.textContent = "Ocultar";

    const item = itemsData.find((m) => m.id_item == itemId);
    if (item && item.componentes) {
      cargarComponentesParaPedido(itemId);
    }
  } else {
    desglose.style.display = "none";
    const componentesConPedido = item.componentes
      ? item.componentes.filter((comp) => (comp.pedido || 0) > 0).length
      : 0;
    button.textContent =
      componentesConPedido > 0
        ? `En carrito (${componentesConPedido})`
        : "Desglose para pedir";
  }
}

function cargarComponentesParaPedido(itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (!item || !item.componentes) return;

  const desgloseContainer = document.getElementById(`desglose-${itemId}`);
  let componentesSection = desgloseContainer.querySelector(
    ".componentes-pedido-section"
  );

  if (!componentesSection) {
    componentesSection = document.createElement("div");
    componentesSection.className = "componentes-pedido-section mt-4";
    componentesSection.innerHTML = `
      <h6 class="text-success mb-3">
        <i class="bi bi-cart-plus"></i> Pedir Componentes Individualmente
      </h6>
      <div class="table-responsive">
        <table class="table table-sm table-bordered">
          <thead class="table-light">
            <tr>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Unidad</th>
              <th>Cantidad por Item</th>
              <th>Precio Unitario</th>
              <th>Cantidad a Pedir</th>
              <th>Subtotal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="componentes-pedido-${itemId}">
          </tbody>
          <tfoot>
            <tr class="table-info">
              <td colspan="6" class="text-end"><strong>Total Componentes:</strong></td>
              <td><strong id="total-componentes-${itemId}">$0.00</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="alert alert-info mt-2">
        <small><i class="bi bi-info-circle"></i> Seleccione las cantidades de cada componente que desea pedir</small>
      </div>
    `;

    desgloseContainer.appendChild(componentesSection);
  }

  const tbody = document.getElementById(`componentes-pedido-${itemId}`);
  tbody.innerHTML = "";

  let totalComponentes = 0;

  item.componentes.forEach((componente) => {
    const cantidadMaxima = componente.cantidad * item.cantidad;
    const cantidadActual = componente.pedido || 0;
    const subtotal = (cantidadActual * componente.precio_unitario).toFixed(2);
    totalComponentes += parseFloat(subtotal);

    const icono = obtenerIconoTipoComponente(componente.tipo_componente);
    const badgeClass = obtenerClaseBadgeTipo(componente.tipo_componente);
    const nombreTipo = obtenerNombreTipoComponente(componente.tipo_componente);

    const pedidoExtra = pedidosFueraPresupuesto.find(
      (p) =>
        p.id_componente === componente.id_componente && p.id_item === itemId
    );

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <span class="badge ${badgeClass}">
          <i class="${icono} me-1"></i>${nombreTipo}
        </span>
      </td>
      <td>
        ${componente.descripcion}
        ${
          pedidoExtra
            ? `
          <div class="mt-1">
            <span class="badge bg-warning text-dark">
              <i class="bi bi-exclamation-triangle"></i> +${pedidoExtra.cantidad_extra.toFixed(
                4
              )} pendiente
            </span>
          </div>
        `
            : ""
        }
      </td>
      <td>${componente.unidad}</td>
      <td>${parseFloat(componente.cantidad).toFixed(4)}</td>
      <td>$${formatCurrency(componente.precio_unitario)}</td>
      <td>
        <div class="input-group input-group-sm" style="width: 150px;">
          <input type="number"
                 class="form-control form-control-sm cantidad-componente ${
                   pedidoExtra ? "border-warning" : ""
                 }"
                 value="${cantidadActual}"
                 min="0"
                 step="0.0001"
                 data-componente-id="${componente.id_componente}"
                 data-item-id="${itemId}"
                 title="${
                   pedidoExtra
                     ? "Tiene un pedido extra pendiente de aprobación"
                     : "Ingrese la cantidad a pedir"
                 }">
          <span class="input-group-text">${componente.unidad}</span>
        </div>
        <small class="text-muted">Máx: ${cantidadMaxima.toFixed(4)}</small>
        ${
          pedidoExtra
            ? `
          <div class="mt-1">
            <small class="text-warning">
              <i class="bi bi-info-circle"></i> Exceder solicitará autorización
            </small>
          </div>
        `
            : ""
        }
      </td>
      <td class="subtotal-componente">$${subtotal}</td>
      <td>
        <button class="btn btn-sm btn-outline-success" onclick="agregarTodoComponente(${
          componente.id_componente
        }, ${itemId})" title="Agregar cantidad máxima">
          <i class="bi bi-plus-circle"></i> Máx
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById(
    `total-componentes-${itemId}`
  ).textContent = `$${totalComponentes.toFixed(2)}`;

  tbody.querySelectorAll(".cantidad-componente").forEach((input) => {
    input.addEventListener("change", function () {
      actualizarCantidadComponenteDesdeInput(this);
    });
  });
}

function actualizarCantidadComponenteDesdeInput(input) {
  const componenteId = input.getAttribute("data-componente-id");
  const itemId = input.getAttribute("data-item-id");
  const cantidad = parseFloat(input.value) || 0;

  actualizarCantidadComponente(componenteId, cantidad, itemId);
}

function actualizarCantidadComponente(componenteId, cantidad, itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (!item || !item.componentes) return;

  const componente = item.componentes.find(
    (comp) => comp.id_componente == componenteId
  );
  if (!componente) return;

  const cantidadMaxima = componente.cantidad * item.cantidad;

  if (cantidad > cantidadMaxima) {
    solicitarJustificacionPedidoExtra(
      componente,
      item,
      cantidad,
      cantidadMaxima
    );
    const input = document.querySelector(
      `input[data-componente-id="${componenteId}"]`
    );
    if (input) {
      input.value = componente.pedido || 0;
    }
    return;
  } else {
    componente.pedido = cantidad;
  }

  const row = document
    .querySelector(`input[data-componente-id="${componenteId}"]`)
    .closest("tr");
  const subtotalElement = row.querySelector(".subtotal-componente");
  subtotalElement.textContent = `$${(
    componente.pedido * componente.precio_unitario
  ).toFixed(2)}`;

  actualizarTotalComponentesItem(itemId);
  actualizarEstadisticas();
  actualizarCarrito();
  actualizarBotonDesglose(itemId);
}

function agregarTodoComponente(componenteId, itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (!item || !item.componentes) return;

  const componente = item.componentes.find(
    (comp) => comp.id_componente == componenteId
  );
  if (!componente) return;

  const cantidadMaxima = componente.cantidad * item.cantidad;

  const input = document.querySelector(
    `input[data-componente-id="${componenteId}"]`
  );
  input.value = cantidadMaxima;

  actualizarCantidadComponente(componenteId, cantidadMaxima, itemId);
}

function actualizarTotalComponentesItem(itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (!item || !item.componentes) return;

  let total = 0;
  item.componentes.forEach((comp) => {
    total += (comp.pedido || 0) * comp.precio_unitario;
  });

  const totalElement = document.getElementById(`total-componentes-${itemId}`);
  if (totalElement) {
    totalElement.textContent = `$${total.toFixed(2)}`;
  }
}

function actualizarBotonDesglose(itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (!item) return;

  const componentesConPedido = item.componentes
    ? item.componentes.filter((comp) => (comp.pedido || 0) > 0).length
    : 0;
  const button = document.querySelector(
    `[onclick="toggleDesglose(${itemId})"]`
  );

  if (button) {
    if (componentesConPedido > 0) {
      button.classList.remove("btn-outline-primary");
      button.classList.add("btn-warning");
      button.textContent = `En carrito (${componentesConPedido})`;
    } else {
      button.classList.remove("btn-warning");
      button.classList.add("btn-outline-primary");
      button.textContent = "Desglose para pedir";
    }
  }
}

function obtenerIconoTipoComponente(tipo) {
  switch (tipo) {
    case "material":
      return "bi bi-box-seam";
    case "mano_obra":
      return "bi bi-person-gear";
    case "equipo":
      return "bi bi-tools";
    case "transporte":
      return "bi bi-truck";
    default:
      return "bi bi-puzzle";
  }
}

function obtenerClaseBadgeTipo(tipo) {
  switch (tipo) {
    case "material":
      return "bg-primary";
    case "mano_obra":
      return "bg-success";
    case "equipo":
      return "bg-warning";
    case "transporte":
      return "bg-info";
    default:
      return "bg-secondary";
  }
}

function obtenerNombreTipoComponente(tipo) {
  switch (tipo) {
    case "material":
      return "MATERIAL";
    case "mano_obra":
      return "MANO OBRA";
    case "equipo":
      return "EQUIPO";
    case "transporte":
      return "TRANSPORTE";
    default:
      return "OTRO";
  }
}

function generarDesgloseComponentesParaPedido(item) {
  const componentesPorTipo = organizarComponentesPorTipo(item.componentes);
  let html = `
    <div class="desglose-existente">
      <h6 class="text-success mb-3">Composición del Ítem (APU):</h6>
  `;

  const nombresTipo = {
    material: "Materiales",
    mano_obra: "Mano de Obra",
    equipo: "Equipos",
    transporte: "Transporte",
    otro: "Otros",
  };

  Object.keys(componentesPorTipo).forEach((tipo) => {
    const grupo = componentesPorTipo[tipo];
    if (grupo.items.length > 0) {
      html += `
        <div class="mb-3">
          <h6 class="text-primary">${
            nombresTipo[tipo] || tipo
          } - $${formatCurrency(grupo.total)}</h6>
          <div class="table-responsive">
            <table class="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Unidad</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
      `;

      grupo.items.forEach((comp) => {
        html += `
                <tr>
                  <td>${comp.descripcion}</td>
                  <td>${comp.unidad}</td>
                  <td>${parseFloat(comp.cantidad).toFixed(4)}</td>
                  <td>$${formatCurrency(comp.precio_unitario)}</td>
                  <td>$${formatCurrency(comp.subtotal)}</td>
                </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  });

  html += `</div>`;
  return html;
}

document.addEventListener("DOMContentLoaded", function () {
  cargarProyectos();
  cargarUnidades();
  cargarTiposMaterial();

  setTimeout(() => {
    paginador.inicializar();
    const paginacionContainer = document.getElementById("paginacionContainer");
    if (paginacionContainer) {
      paginacionContainer.style.display = "none";
    }
  }, 100);
});

async function cargarProyectos() {
  try {
    const response = await fetch(API_PRESUPUESTOS + "?action=getProyectos");
    const result = await response.json();

    if (!result.success) throw new Error(result.error);

    const selectProyecto = document.getElementById("selectProyecto");
    selectProyecto.innerHTML =
      '<option value="">-- Seleccionar Proyecto --</option>';

    result.data.forEach((proyecto) => {
      const option = document.createElement("option");
      option.value = proyecto.id_proyecto;
      option.textContent = proyecto.nombre;
      selectProyecto.appendChild(option);
    });

    proyectosData = result.data;
  } catch (error) {
    console.error("Error cargando proyectos:", error);
    alert("Error al cargar los proyectos: " + error.message);
  }
}

async function cargarPresupuestos() {
  const proyectoId = document.getElementById("selectProyecto").value;
  const selectPresupuesto = document.getElementById("selectPresupuesto");
  const projectInfo = document.getElementById("projectInfo");

  selectPresupuesto.innerHTML =
    '<option value="">-- Seleccionar Presupuesto --</option>';
  selectPresupuesto.disabled = true;
  projectInfo.style.display = "none";
  resetarGestion();

  if (proyectoId) {
    try {
      const formData = new FormData();
      formData.append("proyecto_id", proyectoId);

      const response = await fetch(
        API_PRESUPUESTOS + "?action=getPresupuestosByProyecto",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      selectPresupuesto.disabled = false;
      result.data.forEach((presupuesto) => {
        const option = document.createElement("option");
        option.value = presupuesto.id_presupuesto;
        option.textContent = `${
          presupuesto.nombre_proyecto || presupuesto.nombre
        } - $${parseFloat(presupuesto.monto_total || 0).toLocaleString()}`;
        option.setAttribute("data-presupuesto", JSON.stringify(presupuesto));
        selectPresupuesto.appendChild(option);
      });
    } catch (error) {
      console.error("Error cargando presupuestos:", error);
      alert("Error al cargar los presupuestos: " + error.message);
    }
  }
}

async function cargarItems() {
  const presupuestoId = document.getElementById("selectPresupuesto").value;
  const selectedOption =
    document.getElementById("selectPresupuesto").selectedOptions[0];

  if (presupuestoId && selectedOption) {
    try {
      document.getElementById("materialesList").innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando items...</span>
          </div>
          <p class="mt-3">Cargando items del presupuesto...</p>
        </div>
      `;

      const presupuesto = JSON.parse(
        selectedOption.getAttribute("data-presupuesto")
      );
      const proyectoId = document.getElementById("selectProyecto").value;
      const proyecto = proyectosData.find((p) => p.id_proyecto == proyectoId);

      const items = await cargarItemsPresupuesto(presupuestoId);
      await cargarCapitulosParaFiltro(presupuestoId);

      itemsData = items;
      seleccionActual = {
        proyecto: proyecto.nombre,
        presupuesto: presupuesto.nombre_proyecto || presupuesto.nombre,
        capitulo: "Todos los capítulos",
        datos: { proyectoId, presupuestoId, capituloId: null, presupuesto },
      };

      document.getElementById(
        "currentSelectionInfo"
      ).textContent = `${proyecto.nombre} - ${seleccionActual.presupuesto}`;
      document.getElementById("btnAgregarExtra").disabled = false;
      document.getElementById("filterCapitulo").disabled = false;

      mostrarItemsConComponentes(items);
      actualizarEstadisticas();
      mostrarInformacionProyecto(proyecto, presupuesto);
    } catch (error) {
      console.error("Error cargando items:", error);
      mostrarErrorItems();
    }
  }
}

async function cargarCapitulosParaFiltro(presupuestoId) {
  try {
    const capitulos = await cargarCapitulosReales(presupuestoId);
    const filterCapitulo = document.getElementById("filterCapitulo");
    filterCapitulo.innerHTML = '<option value="">Todos los capítulos</option>';

    capitulos.forEach((cap) => {
      const option = document.createElement("option");
      option.value = cap.id_capitulo;
      option.textContent = cap.nombre_cap;
      filterCapitulo.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando capítulos para filtro:", error);
    document.getElementById("filterCapitulo").innerHTML =
      '<option value="">Todos los capítulos</option>';
  }
}

async function cargarCapitulosReales(presupuestoId) {
  try {
    const formData = new FormData();
    formData.append("id_presupuesto", presupuestoId);

    const response = await fetch(
      API_PRESUPUESTOS + "?action=getCapitulosByPresupuesto",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();
    if (result.success) return result.data;
    throw new Error(result.error || "No se pudieron cargar los capítulos");
  } catch (error) {
    console.error("Error cargando capítulos:", error);
    throw error;
  }
}

async function cargarItemsPresupuesto(presupuestoId, capituloId = null) {
  try {
    const componentesAgrupados = await obtenerComponentesAgrupados(
      presupuestoId,
      capituloId
    );

    const items = await obtenerItemsReales(presupuestoId, capituloId);

    return {
      componentesAgrupados: componentesAgrupados,
      itemsIndividuales: items,
    };
  } catch (error) {
    console.error("Error cargando datos del presupuesto:", error);
    mostrarErrorItems();
    return { componentesAgrupados: [], itemsIndividuales: [] };
  }
}

async function obtenerComponentesAgrupados(presupuestoId, capituloId = null) {
  try {
    const formData = new FormData();
    formData.append("presupuesto_id", presupuestoId);

    const response = await fetch(
      API_PRESUPUESTOS + "?action=getComponentesParaPedido",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    const result = await response.json();
    console.log("Datos recibidos de componentes:", result.data);

    if (result.success) {
      return result.data.map((comp) => {
        const unidad = comp.unidad_componente?.trim() || "UND";
        const cantidadTotal = parseFloat(comp.total_necesario) || 0;

        return {
          id_componente: comp.id_componente,
          id_componente_unico: comp.id_componente,
          nombre_componente: comp.nombre_componente || "Sin nombre",
          descripcion: comp.descripcion || "Sin descripción",
          tipo_componente: comp.tipo_componente || "material",
          unidad_componente: unidad,
          unidad: unidad,
          precio_unitario: parseFloat(comp.precio_unitario) || 0,
          total_necesario: cantidadTotal,
          disponible: parseFloat(comp.disponible) || 0,
          ya_pedido: parseFloat(comp.ya_pedido) || 0,
          pedido_inicial: parseFloat(comp.pedido_inicial) || 0,
          capitulos: comp.capitulos || [],
          cantidad_items: comp.cantidad_items || 0,
          cantidad_capitulos: comp.cantidad_capitulos || 0,
          pedido: 0,
          items_que_usan: parseDetalleSerializado(comp.detalle_serializado),
        };
      });
    }
    throw new Error(
      result.error || "No se pudieron cargar los componentes agrupados"
    );
  } catch (error) {
    console.error("Error cargando componentes agrupados:", error);
    throw error;
  }
}

function parseDetalleSerializado(detalleSerializado) {
  if (!detalleSerializado) return [];

  try {
    const items = detalleSerializado.split("||");
    return items
      .map((itemStr) => {
        if (!itemStr.trim()) return null;

        const partes = itemStr.split("|");

        if (partes.length < 10) {
          console.warn("Detalle serializado incompleto:", partes);
          return null;
        }

        return {
          id_item: partes[0]?.trim() || null,
          codigo_item: partes[1]?.trim() || "N/A",
          nombre_item: partes[2]?.trim() || "N/A",
          nombre_capitulo: partes[3]?.trim() || "N/A",
          cantidad_por_unidad: parseFloat(partes[4]) || 0,
          unidad_componente: partes[5]?.trim() || "UND",
          unidad_item: partes[6]?.trim() || "UND",
          cantidad_item_presupuesto: parseFloat(partes[7]) || 0,
          cantidad_componente: parseFloat(partes[8]) || 0,
          pedido_actual: 0,
          ya_pedido_item: parseFloat(partes[9]) || 0,
        };
      })
      .filter((item) => item !== null);
  } catch (error) {
    console.error("Error parseando detalle serializado:", error);
    return [];
  }
}

function obtenerUnidadSegura(componente) {
  return componente.unidad_componente || "UND";
}

function obtenerCantidadTotalSegura(componente) {
  return parseFloat(
    componente.cantidad_total || componente.total_necesario || 0
  );
}

async function obtenerItemsReales(presupuestoId, capituloId = null) {
  try {
    const formData = new FormData();
    formData.append("presupuesto_id", presupuestoId);
    if (capituloId) formData.append("capitulo_id", capituloId);

    const response = await fetch(
      API_PRESUPUESTOS + "?action=getItemsByPresupuesto",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    const result = await response.json();
    if (result.success) {
      return result.data.map((item) => ({
        id_item: item.id_item,
        codigo_item: item.codigo_item,
        nombre_item: item.nombre_item,
        id_capitulo: item.id_capitulo,
        nombre_capitulo: item.nombre_capitulo,
        unidad: item.unidad,
        precio_unitario: parseFloat(item.precio_unitario) || 0,
        cantidad: parseFloat(item.cantidad) || 0,
        pedido: 0,
        subtotal:
          (parseFloat(item.cantidad) || 0) *
          (parseFloat(item.precio_unitario) || 0),
        componentes: (item.componentes || []).map((comp) => ({
          ...comp,
          pedido: 0,
        })),
        id_det_presupuesto: item.id_det_presupuesto,
        disponible:
          parseFloat(item.disponible) || parseFloat(item.cantidad) || 0,
      }));
    }
    throw new Error(result.error || "No se pudieron cargar los items");
  } catch (error) {
    console.error("Error cargando items reales:", error);
    throw error;
  }
}

async function cargarUnidades() {
  try {
    const response = await fetch(API_PRESUPUESTOS + "?action=getUnidades");
    const result = await response.json();

    if (result.success) {
      const selectUnidad = document.getElementById("unidadMaterial");
      result.data.forEach((unidad) => {
        const option = document.createElement("option");
        option.value = unidad.idunidad;
        option.textContent = unidad.unidesc;
        selectUnidad.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error cargando unidades:", error);
  }
}

async function cargarTiposMaterial() {
  try {
    const filterTipo = document.getElementById("filterTipo");
    const tiposComponentes = [
      { value: "material", text: "Material" },
      { value: "mano_obra", text: "Mano de Obra" },
      { value: "equipo", text: "Equipo" },
      { value: "transporte", text: "Transporte" },
      { value: "otro", text: "Otro" },
    ];

    tiposComponentes.forEach((tipo) => {
      const option = document.createElement("option");
      option.value = tipo.value;
      option.textContent = tipo.text;
      filterTipo.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando tipos de componentes:", error);
  }
}

function mostrarItemsConComponentes(datos) {
  const container = document.getElementById("materialesList");

  const componentesAgrupados = datos.componentesAgrupados || [];
  const itemsIndividuales = datos.itemsIndividuales || [];

  if (componentesAgrupados.length === 0 && itemsIndividuales.length === 0) {
    container.innerHTML = `
            <div class="text-center text-muted py-5">
                <div class="spinner-border text-muted" role="status"></div>
                <p class="mt-3">No hay componentes en este presupuesto/capítulo</p>
            </div>
        `;
    document.getElementById("contadorMateriales").textContent = "0 componentes";

    const paginacionContainer = document.getElementById("paginacionContainer");
    if (paginacionContainer) paginacionContainer.style.display = "none";
    return;
  }

  paginador.configurar(componentesAgrupados);
  const paginacionContainer = document.getElementById("paginacionContainer");
  if (paginacionContainer) paginacionContainer.style.display = "flex";

  document.getElementById(
    "contadorMateriales"
  ).textContent = `${componentesAgrupados.length} componentes`;
}

function mostrarErrorItems() {
  const container = document.getElementById("materialesList");
  container.innerHTML = `
    <div class="text-center text-danger py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="mt-3">Error al cargar los items del presupuesto</p>
      <button class="btn btn-warning" onclick="reintentarCargaItems()">Reintentar</button>
    </div>
  `;
}

function mostrarInformacionProyecto(proyecto, presupuesto) {
  document.getElementById("infoNombre").textContent = proyecto.nombre;
  document.getElementById("infoPresupuesto").textContent =
    presupuesto.nombre_proyecto || presupuesto.nombre;
  document.getElementById("infoTotal").textContent = `$${parseFloat(
    presupuesto.monto_total || 0
  ).toLocaleString()}`;
  document.getElementById("infoItems").textContent = itemsData.length;
  document.getElementById("projectInfo").style.display = "block";
}

function obtenerColorProgreso(porcentaje) {
  if (porcentaje === 0)
    return { colorClass: "bg-secondary", colorText: "Sin uso" };
  if (porcentaje <= 80)
    return { colorClass: "bg-success", colorText: "Dentro del presupuesto" };
  if (porcentaje <= 95)
    return { colorClass: "bg-warning", colorText: "Cerca del límite" };
  if (porcentaje <= 100)
    return { colorClass: "bg-danger", colorText: "Límite alcanzado" };
  return { colorClass: "bg-dark", colorText: "Excedido" };
}

function organizarComponentesPorTipo(componentes) {
  const porTipo = {
    material: { items: [], total: 0 },
    mano_obra: { items: [], total: 0 },
    equipo: { items: [], total: 0 },
    transporte: { items: [], total: 0 },
    otro: { items: [], total: 0 },
  };

  componentes.forEach((comp) => {
    const tipo = comp.tipo_componente;
    const subtotal = parseFloat(comp.subtotal) || 0;
    if (porTipo[tipo]) {
      porTipo[tipo].items.push(comp);
      porTipo[tipo].total += subtotal;
    } else {
      porTipo.otro.items.push(comp);
      porTipo.otro.total += subtotal;
    }
  });

  return porTipo;
}

function formatCurrency(amount) {
  return parseFloat(amount || 0)
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

function actualizarEstadisticas() {
  let componentesSeleccionados = 0;
  let totalCantidad = 0;
  let valorTotal = 0;

  if (itemsData.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach((componente) => {
      if (componente.pedido > 0) {
        componentesSeleccionados++;
        totalCantidad += componente.pedido;
        valorTotal += componente.pedido * componente.precio_unitario;
      }
    });
  }

  document.getElementById("statSeleccionados").textContent =
    componentesSeleccionados;
  document.getElementById("statTotalItems").textContent =
    totalCantidad.toFixed(2);
  document.getElementById(
    "statValorTotal"
  ).textContent = `$${valorTotal.toFixed(2)}`;
  document.getElementById("statExtras").textContent = materialesExtra.length;

  const alertPendientes = document.getElementById(
    "alertPendientesAutorizacion"
  );
  const statPendientes = document.getElementById("statPendientesAutorizacion");

  if (pedidosFueraPresupuesto.length > 0) {
    alertPendientes.style.display = "block";
    statPendientes.textContent = pedidosFueraPresupuesto.length;
  } else {
    alertPendientes.style.display = "none";
  }

  document.getElementById("btnConfirmarPedido").disabled =
    componentesSeleccionados === 0 &&
    materialesExtra.length === 0 &&
    pedidosFueraPresupuesto.length === 0;
}

function actualizarCarrito() {
  const componentesEnCarrito = [];

  if (itemsData.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach((componente) => {
      if (componente.pedido > 0) {
        componentesEnCarrito.push({
          id_componente: componente.id_componente,
          descripcion: componente.nombre_componente,
          tipo_componente: componente.tipo_componente,
          unidad: componente.unidad_componente,
          pedido: componente.pedido,
          precio_unitario: componente.precio_unitario,
          codigo_item_padre: "Varios items",
          nombre_item_padre: `Usado en ${componente.cantidad_items} item(s)`,
          capitulos: componente.capitulos,
        });
      }
    });
  }

  const container = document.getElementById("carritoList");
  const cardCarrito = document.getElementById("cardCarrito");

  if (
    componentesEnCarrito.length === 0 &&
    pedidosFueraPresupuesto.length === 0 &&
    materialesExtra.length === 0
  ) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <div class="spinner-border text-muted" role="status"></div>
        <p class="mt-3">Agregue componentes del presupuesto para verlos aquí</p>
      </div>
    `;
    cardCarrito.style.display = "none";
    return;
  }

  cardCarrito.style.display = "block";

  let html = "";
  let totalGeneral = 0;

  if (componentesEnCarrito.length > 0) {
    componentesEnCarrito.forEach((componente) => {
      const subtotal = componente.pedido * componente.precio_unitario;
      totalGeneral += subtotal;

      const icono = obtenerIconoTipoComponente(componente.tipo_componente);
      const badgeClass = obtenerClaseBadgeTipo(componente.tipo_componente);
      const nombreTipo = obtenerNombreTipoComponente(
        componente.tipo_componente
      );

      html += `
        <div class="card mb-2 border-info">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-4">
                <div class="d-flex align-items-center">
                  <i class="${icono} me-2 text-muted"></i>
                  <div>
                    <strong class="text-info">${componente.descripcion}</strong>
                    <p class="mb-0 small">
                      <span class="badge ${badgeClass} me-1">${nombreTipo}</span>
                      De: ${componente.codigo_item_padre}
                    </p>
                    <small class="text-muted">${componente.unidad}</small>
                  </div>
                </div>
              </div>
              <div class="col-md-2 text-center">
                <span class="badge bg-info">${componente.pedido} ${
        componente.unidad
      }</span>
              </div>
              <div class="col-md-2">
                <small>$${formatCurrency(
                  componente.precio_unitario
                )} c/u</small>
              </div>
              <div class="col-md-2">
                <strong class="text-info">$${formatCurrency(subtotal)}</strong>
              </div>
              <div class="col-md-2 text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="quitarComponenteDelCarrito(${
                  componente.id_componente
                }, ${componente.id_item_padre})">
                  Quitar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  if (pedidosFueraPresupuesto.length > 0) {
    html += `
      <div class="mt-4 pt-3 border-top border-warning">
        <div class="alert alert-warning mb-3">
          <h6 class="text-warning mb-2">
            <i class="bi bi-exclamation-triangle-fill"></i> Pedidos Fuera de Presupuesto (Pendientes de Autorización)
          </h6>
          <small>Estos pedidos están separados del carrito principal y requieren aprobación antes de ser procesados.</small>
        </div>
    `;

    let totalPendiente = 0;
    pedidosFueraPresupuesto.forEach((pedido, index) => {
      const subtotalExtra = pedido.cantidad_extra * pedido.precio_unitario;
      totalPendiente += subtotalExtra;

      const icono = obtenerIconoTipoComponente(pedido.tipo_componente);
      const badgeClass = obtenerClaseBadgeTipo(pedido.tipo_componente);
      const nombreTipo = obtenerNombreTipoComponente(pedido.tipo_componente);

      html += `
        <div class="card mb-2 border-warning bg-light">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-4">
                <div class="d-flex align-items-center">
                  <i class="${icono} me-2 text-warning"></i>
                  <div>
                    <strong class="text-warning">${
                      pedido.descripcion_componente
                    }</strong>
                    <p class="mb-0 small">
                      <span class="badge ${badgeClass} me-1">${nombreTipo}</span>
                      De: ${pedido.codigo_item}
                    </p>
                    <small class="text-muted">${pedido.unidad}</small>
                  </div>
                </div>
              </div>
              <div class="col-md-2 text-center">
                <span class="badge bg-warning text-dark">
                  <i class="bi bi-hourglass-split"></i> Pendiente
                </span>
                <div class="mt-1">
                  <small class="d-block">Extra: +${pedido.cantidad_extra.toFixed(
                    4
                  )}</small>
                </div>
              </div>
              <div class="col-md-2">
                <small>$${formatCurrency(pedido.precio_unitario)} c/u</small>
              </div>
              <div class="col-md-2">
                <strong class="text-warning">$${formatCurrency(
                  subtotalExtra
                )}</strong>
                <small class="d-block text-muted">(solo extra)</small>
              </div>
              <div class="col-md-2 text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarPedidoExtra(${index})" title="Cancelar pedido extra">
                  <i class="bi bi-x-circle"></i> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        <div class="alert alert-info mt-2">
          <div class="row">
            <div class="col-md-8">
              <small><strong>Total adicional pendiente de aprobación:</strong></small>
            </div>
            <div class="col-md-4 text-end">
              <strong class="text-warning">$${formatCurrency(
                totalPendiente
              )}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  html += `
    <div class="mt-3 pt-3 border-top">
      <div class="row">
        <div class="col-md-8"><strong class="text-dark">TOTAL DEL CARRITO:</strong></div>
        <div class="col-md-4 text-end"><h5 class="text-success">$${formatCurrency(
          totalGeneral
        )}</h5></div>
      </div>
      ${
        pedidosFueraPresupuesto.length > 0
          ? `
      <div class="row mt-2">
        <div class="col-md-8"><small class="text-warning">Los pedidos adicionales requieren aprobación</small></div>
      </div>
      `
          : ""
      }
    </div>
  `;

  container.innerHTML = html;
  document.getElementById(
    "contadorCarrito"
  ).textContent = `${componentesEnCarrito.length} componentes`;
}

function quitarComponenteDelCarrito(componenteId, itemId) {
  actualizarCantidadComponente(componenteId, 0, itemId);
}

function resetarGestion() {
  itemsData = { componentesAgrupados: [], itemsIndividuales: [] };
  materialesExtra = [];
  pedidosFueraPresupuesto = [];

  document.getElementById("materialesList").innerHTML = `
        <div class="text-center text-muted py-5">
            <div class="spinner-border text-muted" role="status"></div>
            <p class="mt-3">Seleccione un proyecto y presupuesto para ver los componentes</p>
        </div>
    `;

  document.getElementById("carritoList").innerHTML = `
        <div class="text-center text-muted py-4">
            <div class="spinner-border text-muted" role="status"></div>
            <p class="mt-3">Agregue componentes del presupuesto para verlos aquí</p>
        </div>
    `;

  document.getElementById("currentSelectionInfo").textContent =
    "Seleccione un proyecto y presupuesto para comenzar";
  document.getElementById("btnAgregarExtra").disabled = true;
  document.getElementById("btnConfirmarPedido").disabled = true;
  document.getElementById("filterCapitulo").disabled = true;
  document.getElementById("cardCarrito").style.display = "none";
  document.getElementById("cardExtras").style.display = "none";

  const paginacionContainer = document.getElementById("paginacionContainer");
  if (paginacionContainer) paginacionContainer.style.display = "none";

  actualizarEstadisticas();
}

function reintentarCargaItems() {
  const presupuestoId = document.getElementById("selectPresupuesto").value;
  if (presupuestoId) cargarItems();
}

function filtrarMateriales() {
  const filtroEstado = document.getElementById("filterEstado").value;
  const filtroCapitulo = document.getElementById("filterCapitulo").value;
  const filtroTipo = document.getElementById("filterTipo").value;
  const searchTerm = document
    .getElementById("searchMaterial")
    .value.toLowerCase();

  // Usar componentesAgrupados para filtrar
  const componentesAgrupados = itemsData.componentesAgrupados || [];

  const componentesFiltrados = componentesAgrupados.filter((componente) => {
    const coincideEstado =
      !filtroEstado ||
      (filtroEstado === "disponible" && componente.disponible > 0) ||
      (filtroEstado === "agotado" && componente.disponible <= 0) ||
      (filtroEstado === "pedido" && (componente.pedido || 0) > 0);

    const coincideCapitulo =
      !filtroCapitulo ||
      (componente.capitulos && componente.capitulos.includes(filtroCapitulo));

    const coincideTipo =
      !filtroTipo || componente.tipo_componente === filtroTipo;

    const coincideBusqueda =
      !searchTerm ||
      componente.nombre_componente.toLowerCase().includes(searchTerm) ||
      (componente.descripcion &&
        componente.descripcion.toLowerCase().includes(searchTerm));

    return (
      coincideEstado && coincideCapitulo && coincideTipo && coincideBusqueda
    );
  });

  mostrarItemsConComponentes({ componentesAgrupados: componentesFiltrados });

  if (filtroTipo) {
    document.querySelectorAll(".componente-card").forEach((card) => {
      const tipoCard = card.dataset.tipo;
      if (tipoCard === filtroTipo) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  } else {
    document.querySelectorAll(".componente-card").forEach((card) => {
      card.style.display = "block";
    });
  }
}

function mostrarModalNuevoItem() {
  document.getElementById("formNuevoItem").reset();
  const modal = new bootstrap.Modal(document.getElementById("modalNuevoItem"));
  modal.show();
}

function solicitarMaterialExtra() {
  const codigo = document.getElementById("codigoMaterial").value;
  const descripcion = document.getElementById("descripcionMaterial").value;
  const cantidad = document.getElementById("cantidadMaterial").value;
  const unidad = document.getElementById("unidadMaterial").value;
  const precio = document.getElementById("precioMaterial").value;
  const tipo = document.getElementById("tipoMaterial").value;
  const justificacion = document.getElementById("justificacionMaterial").value;

  if (!codigo || !descripcion || !cantidad || !unidad || !justificacion) {
    alert("Por favor complete todos los campos obligatorios (*)");
    return;
  }

  const materialExtra = {
    codigo,
    descripcion,
    cantidad: parseInt(cantidad),
    unidad:
      document.getElementById("unidadMaterial").selectedOptions[0].textContent,
    precio: parseFloat(precio) || 0,
    tipo,
    justificacion,
    estado: "pendiente",
    fecha: new Date().toISOString().split("T")[0],
  };

  materialesExtra.push(materialExtra);
  actualizarEstadisticas();

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalNuevoItem")
  );
  modal.hide();
  alert("Material extra solicitado para aprobación");
}

function eliminarMaterialExtra(index) {
  if (confirm("¿Está seguro de eliminar este material extra?")) {
    materialesExtra.splice(index, 1);
    actualizarEstadisticas();
    actualizarCarrito();
  }
}

function eliminarPedidoExtra(index) {
  if (confirm("¿Está seguro de cancelar este pedido fuera de presupuesto?")) {
    pedidosFueraPresupuesto.splice(index, 1);
    actualizarEstadisticas();
    actualizarCarrito();
  }
}

function solicitarJustificacionPedidoExtra(
  componente,
  item,
  cantidadSolicitada,
  cantidadMaxima
) {
  window.pedidoExtraTemp = {
    componente,
    item,
    cantidadSolicitada,
    cantidadMaxima,
  };

  document.getElementById("infoComponenteExtra").innerHTML = `
    <div class="alert alert-warning">
      <h6><i class="bi bi-exclamation-triangle"></i> Pedido Fuera de Presupuesto</h6>
      <p class="mb-1"><strong>Componente:</strong> ${componente.descripcion}</p>
      <p class="mb-1"><strong>Item:</strong> ${item.codigo_item} - ${
    item.nombre_item
  }</p>
      <p class="mb-1"><strong>Cantidad máxima permitida:</strong> ${cantidadMaxima.toFixed(
        4
      )} ${componente.unidad}</p>
      <p class="mb-1"><strong>Cantidad solicitada:</strong> ${cantidadSolicitada.toFixed(
        4
      )} ${componente.unidad}</p>
      <p class="mb-0"><strong>Cantidad extra:</strong> <span class="text-danger">+${(
        cantidadSolicitada - cantidadMaxima
      ).toFixed(4)} ${componente.unidad}</span></p>
    </div>
  `;

  document.getElementById("justificacionPedidoExtra").value = "";

  const modal = new bootstrap.Modal(
    document.getElementById("modalJustificacionExtra")
  );
  modal.show();
}

function confirmarPedidoExtra() {
  const justificacion = document
    .getElementById("justificacionPedidoExtra")
    .value.trim();

  if (!justificacion) {
    alert(
      "Debe proporcionar una justificación para el pedido fuera de presupuesto"
    );
    return;
  }

  const { componente, item, cantidadSolicitada, cantidadMaxima } =
    window.pedidoExtraTemp;

  const pedidoExtra = {
    id_componente: componente.id_componente,
    id_item: item.id_item,
    codigo_item: item.codigo_item,
    nombre_item: item.nombre_item,
    descripcion_componente: componente.descripcion,
    tipo_componente: componente.tipo_componente,
    unidad: componente.unidad,
    cantidad_maxima: cantidadMaxima,
    cantidad_solicitada: cantidadSolicitada,
    cantidad_extra: cantidadSolicitada - cantidadMaxima,
    precio_unitario: componente.precio_unitario,
    justificacion: justificacion,
    estado: "pendiente_aprobacion",
    fecha: new Date().toISOString(),
  };

  const indexExistente = pedidosFueraPresupuesto.findIndex(
    (p) =>
      p.id_componente === componente.id_componente && p.id_item === item.id_item
  );

  if (indexExistente >= 0) {
    pedidosFueraPresupuesto[indexExistente] = pedidoExtra;
  } else {
    pedidosFueraPresupuesto.push(pedidoExtra);
  }

  componente.pedido = cantidadMaxima;

  actualizarEstadisticas();
  actualizarCarrito();
  actualizarBotonDesglose(item.id_item);

  const input = document.querySelector(
    `input[data-componente-id="${componente.id_componente}"]`
  );
  if (input) {
    input.value = cantidadMaxima;
  }

  const row = input?.closest("tr");
  if (row) {
    const subtotalElement = row.querySelector(".subtotal-componente");
    if (subtotalElement) {
      subtotalElement.textContent = `$${(
        cantidadMaxima * componente.precio_unitario
      ).toFixed(2)}`;
    }
  }

  actualizarTotalComponentesItem(item.id_item);

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalJustificacionExtra")
  );
  modal.hide();

  delete window.pedidoExtraTemp;

  alert("Pedido fuera de presupuesto agregado. Requiere aprobación.");
}

async function confirmarPedido() {
  const btn = document.getElementById("btnConfirmarPedido");
  const originalBtnHtml = btn ? btn.innerHTML : null;

  const componentesConPedido = [];

  if (itemsData.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach((componente) => {
      if (componente.pedido > 0) {
        componentesConPedido.push({
          id_componente: componente.id_componente,
          nombre_componente: componente.nombre_componente,
          tipo_componente: componente.tipo_componente,
          unidad_componente: componente.unidad_componente,
          precio_unitario: componente.precio_unitario,
          pedido: componente.pedido,
          total_necesario: componente.total_necesario,
          capitulos: componente.capitulos,
        });
      }
    });
  }

  if (
    componentesConPedido.length === 0 &&
    materialesExtra.length === 0 &&
    pedidosFueraPresupuesto.length === 0
  ) {
    alert("No hay componentes seleccionados para el pedido");
    return;
  }

  if (!confirm("¿Está seguro de confirmar este pedido?")) return;

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Confirmando...';
    }

    const pedidoData = {
      seleccionActual,
      componentes: componentesConPedido,
      materialesExtra,
      pedidosFueraPresupuesto,
      total: componentesConPedido.reduce(
        (sum, comp) => sum + (comp.pedido || 0) * comp.precio_unitario,
        0
      ),
      fecha: new Date().toISOString(),
    };

    const formData = new FormData();
    formData.append("pedido_data", JSON.stringify(pedidoData));

    const response = await fetch(API_PRESUPUESTOS + "?action=guardarPedido", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      alert(
        "Pedido confirmado exitosamente. ID del pedido: " + result.id_pedido
      );

      // Limpiar carrito/extra en memoria
      materialesExtra = [];
      pedidosFueraPresupuesto = [];
      if (itemsData.componentesAgrupados) {
        itemsData.componentesAgrupados.forEach((c) => (c.pedido = 0));
      }
      // Limpiar también los componentes individuales si existen
      if (Array.isArray(itemsData)) {
        itemsData.forEach((it) =>
          it.componentes?.forEach((c) => (c.pedido = 0))
        );
      } else if (itemsData.itemsIndividuales) {
        itemsData.itemsIndividuales.forEach((it) =>
          it.componentes?.forEach((c) => (c.pedido = 0))
        );
      }

      actualizarCarrito();
      actualizarEstadisticas();

      // Recargar los datos del presupuesto actual para reflejar ya_pedido actualizado
      await cargarItems();
    } else {
      alert("Error al guardar el pedido: " + result.error);
    }
  } catch (error) {
    console.error("Error confirmando pedido:", error);
    alert("Error al confirmar el pedido");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml || "Confirmar Pedido";
    }
  }
}

function agruparComponentesPorDescripcion(items) {
  const mapaComponentes = {};

  items.forEach((item) => {
    if (!item.componentes) return;

    item.componentes.forEach((comp) => {
      const tipo = comp.tipo_componente || "otro";
      const clave = `${comp.descripcion}_${comp.precio_unitario}_${comp.unidad}`;

      if (!mapaComponentes[clave]) {
        mapaComponentes[clave] = {
          id_componente_unico: comp.id_componente,
          tipo_componente: tipo,
          descripcion: comp.descripcion,
          unidad: comp.unidad,
          precio_unitario: parseFloat(comp.precio_unitario),
          cantidad_total: 0,
          pedido: 0,
          items_que_usan: [],
        };
      }

      const cantidadEnItem =
        parseFloat(comp.cantidad) * parseFloat(item.cantidad);
      mapaComponentes[clave].cantidad_total += cantidadEnItem;

      if (comp.pedido) {
        mapaComponentes[clave].pedido += parseFloat(comp.pedido);
      }

      mapaComponentes[clave].items_que_usan.push({
        id_item: item.id_item,
        codigo_item: item.codigo_item,
        nombre_item: item.nombre_item,
        nombre_capitulo: item.nombre_capitulo,
        cantidad_componente: parseFloat(comp.cantidad).toFixed(4),
      });
    });
  });

  return Object.values(mapaComponentes);
}

function toggleDesgloseComponente(idComponente) {
  const desglose = document.getElementById(`desglose-comp-${idComponente}`);
  if (desglose) {
    desglose.style.display =
      desglose.style.display === "none" ? "block" : "none";
  }
}

function actualizarCantidadComponenteAgrupado(input) {
  const nuevaCantidad = parseFloat(input.value) || 0;
  const componenteId = input.dataset.componenteId;

  const componente = itemsData.componentesAgrupados?.find(
    (comp) => String(comp.id_componente) === String(componenteId)
  );
  if (!componente) return;

  const totalNecesario = parseFloat(componente.total_necesario) || 0;
  const yaPedido = parseFloat(componente.ya_pedido) || 0;
  const maxPermitido = Math.max(0, totalNecesario - yaPedido);

  if (nuevaCantidad > maxPermitido) {
    solicitarJustificacionPedidoExtra(componente, nuevaCantidad, maxPermitido);
    input.value = componente.pedido || 0;
    return;
  }

  componente.pedido = nuevaCantidad;

  const idxExtra = pedidosFueraPresupuesto.findIndex(
    (p) => p.id_componente === componente.id_componente && !p.id_item
  );
  if (idxExtra >= 0) {
    const extraActual = Math.max(0, (componente.pedido || 0) - maxPermitido);
    if (extraActual <= 0) {
      pedidosFueraPresupuesto.splice(idxExtra, 1);
    } else {
      pedidosFueraPresupuesto[idxExtra].cantidad_extra = extraActual;
    }
  }

  const card = input.closest(".card");
  if (card) {
    const subtotalElement = card.querySelector(".col-md-2 .text-success");
    if (subtotalElement) {
      const precioUnitario = parseFloat(input.dataset.precio) || 0;
      const subtotal = nuevaCantidad * precioUnitario;
      subtotalElement.textContent = `${formatCurrency(subtotal)}`;
    }

    const porcentajeYaPedido =
      totalNecesario > 0 ? (yaPedido / totalNecesario) * 100 : 0;
    const porcentajePedidoActual =
      totalNecesario > 0 ? (nuevaCantidad / totalNecesario) * 100 : 0;
    const porcentajeTotal = Math.min(
      porcentajeYaPedido + porcentajePedidoActual,
      100
    );

    const resumenProgreso = card.querySelector(
      ".mb-2 .d-flex small:last-child"
    );
    if (resumenProgreso) {
      resumenProgreso.textContent = `${porcentajeYaPedido.toFixed(
        1
      )}% ya pedido + ${porcentajePedidoActual.toFixed(
        1
      )}% nuevo = ${porcentajeTotal.toFixed(1)}% total`;
    }

    const barras = card.querySelectorAll(".progress .progress-bar");
    if (barras.length >= 2) {
      barras[0].style.width = `${Math.max(
        0,
        Math.min(100, porcentajeYaPedido)
      )}%`;
      barras[0].setAttribute("aria-valuenow", porcentajeYaPedido.toFixed(1));
      barras[1].style.width = `${Math.max(
        0,
        Math.min(100, porcentajePedidoActual)
      )}%`;
      barras[1].setAttribute(
        "aria-valuenow",
        porcentajePedidoActual.toFixed(1)
      );
      const estado = obtenerColorProgreso(porcentajeTotal);
      barras[1].className = `progress-bar ${estado.colorClass}`;
    }

    // Actualizar indicador de pedido extra pendiente
    const extraObj = pedidosFueraPresupuesto.find(
      (p) => p.id_componente === componente.id_componente && !p.id_item
    );
    const extraCant = extraObj ? parseFloat(extraObj.cantidad_extra) || 0 : 0;
    const extraDiv = card.querySelector('.pedido-extra-info');
    if (extraDiv) {
      if (extraCant > 0) {
        extraDiv.style.display = '';
        extraDiv.innerHTML = `
          <small class="text-warning">
            <i class="bi bi-exclamation-triangle"></i> Pedido extra pendiente: 
            <strong class="text-warning">+${extraCant.toFixed(4)} ${input.dataset.unidad || componente.unidad_componente || ''}</strong>
          </small>
        `;
      } else {
        extraDiv.style.display = 'none';
      }
    }

    const badge = card.querySelector(".card-header .badge.ms-1");
    if (badge) {
      const estado = obtenerColorProgreso(porcentajeTotal);
      badge.className = `badge ${estado.colorClass} ms-1`;
      badge.textContent = estado.colorText;
    }
  }

  actualizarCarrito();
  actualizarEstadisticas();
}

document.addEventListener("DOMContentLoaded", () => {
  cargarProyectos();
});

function solicitarJustificacionPedidoExtra(
  componente,
  cantidadSolicitada,
  cantidadMaxima
) {
  window.pedidoExtraTemp = {
    componente: componente,
    cantidadSolicitada: cantidadSolicitada,
    cantidadMaxima: cantidadMaxima,
  };

  document.getElementById("infoComponenteExtra").innerHTML = `
    <div class="alert alert-warning">
      <h6><i class="bi bi-exclamation-triangle"></i> Pedido Fuera de Presupuesto</h6>
      <p class="mb-1"><strong>Componente:</strong> ${
        componente.nombre_componente
      }</p>
      <p class="mb-1"><strong>Cantidad máxima permitida:</strong> ${cantidadMaxima.toFixed(
        4
      )} ${componente.unidad_componente}</p>
      <p class="mb-1"><strong>Cantidad solicitada:</strong> ${cantidadSolicitada.toFixed(
        4
      )} ${componente.unidad_componente}</p>
      <p class="mb-0"><strong>Cantidad extra:</strong> <span class="text-danger">+${(
        cantidadSolicitada - cantidadMaxima
      ).toFixed(4)} ${componente.unidad_componente}</span></p>
    </div>
  `;

  document.getElementById("justificacionPedidoExtra").value = "";

  const modal = new bootstrap.Modal(
    document.getElementById("modalJustificacionExtra")
  );
  modal.show();
}

function confirmarPedidoExtra() {
  const justificacion = document
    .getElementById("justificacionPedidoExtra")
    .value.trim();

  if (!justificacion) {
    alert(
      "Debe proporcionar una justificación para el pedido fuera de presupuesto"
    );
    return;
  }

  const { componente, cantidadSolicitada, cantidadMaxima } =
    window.pedidoExtraTemp;

  const pedidoExtra = {
    id_componente: componente.id_componente,
    nombre_componente: componente.nombre_componente,
    tipo_componente: componente.tipo_componente,
    unidad: componente.unidad_componente,
    cantidad_maxima: cantidadMaxima,
    cantidad_solicitada: cantidadSolicitada,
    cantidad_extra: cantidadSolicitada - cantidadMaxima,
    precio_unitario: componente.precio_unitario,
    justificacion: justificacion,
    estado: "pendiente_aprobacion",
    fecha: new Date().toISOString(),
  };

  const indexExistente = pedidosFueraPresupuesto.findIndex(
    (p) => p.id_componente === componente.id_componente
  );

  if (indexExistente >= 0) {
    pedidosFueraPresupuesto[indexExistente] = pedidoExtra;
  } else {
    pedidosFueraPresupuesto.push(pedidoExtra);
  }

  componente.pedido = cantidadMaxima;

  actualizarEstadisticas();
  actualizarCarrito();

  const input = document.querySelector(
    `input[data-componente-id="${componente.id_componente}"]`
  );
  if (input) {
    input.value = cantidadMaxima;
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalJustificacionExtra")
  );
  modal.hide();

  delete window.pedidoExtraTemp;

  alert("Pedido fuera de presupuesto agregado. Requiere aprobación.");
}

function solicitarJustificacionPedidoExtra(
  componente,
  cantidadSolicitada,
  cantidadMaxima
) {
  window.pedidoExtraTemp = {
    componente: componente,
    cantidadSolicitada: cantidadSolicitada,
    cantidadMaxima: cantidadMaxima,
  };

  document.getElementById("infoComponenteExtra").innerHTML = `
    <div class="alert alert-warning">
      <h6><i class="bi bi-exclamation-triangle"></i> Pedido Fuera de Presupuesto</h6>
      <p class="mb-1"><strong>Componente:</strong> ${
        componente.nombre_componente
      }</p>
      <p class="mb-1"><strong>Cantidad máxima permitida:</strong> ${cantidadMaxima.toFixed(
        4
      )} ${componente.unidad_componente}</p>
      <p class="mb-1"><strong>Cantidad solicitada:</strong> ${cantidadSolicitada.toFixed(
        4
      )} ${componente.unidad_componente}</p>
      <p class="mb-0"><strong>Cantidad extra:</strong> <span class="text-danger">+${(
        cantidadSolicitada - cantidadMaxima
      ).toFixed(4)} ${componente.unidad_componente}</span></p>
    </div>
  `;

  document.getElementById("justificacionPedidoExtra").value = "";

  const modal = new bootstrap.Modal(
    document.getElementById("modalJustificacionExtra")
  );
  modal.show();
}

function confirmarPedidoExtra() {
  const justificacion = document
    .getElementById("justificacionPedidoExtra")
    .value.trim();

  if (!justificacion) {
    alert(
      "Debe proporcionar una justificación para el pedido fuera de presupuesto"
    );
    return;
  }

  const { componente, cantidadSolicitada, cantidadMaxima } =
    window.pedidoExtraTemp;

  const pedidoExtra = {
    id_componente: componente.id_componente,
    nombre_componente: componente.nombre_componente,
    tipo_componente: componente.tipo_componente,
    unidad: componente.unidad_componente,
    cantidad_maxima: cantidadMaxima,
    cantidad_solicitada: cantidadSolicitada,
    cantidad_extra: cantidadSolicitada - cantidadMaxima,
    precio_unitario: componente.precio_unitario,
    justificacion: justificacion,
    estado: "pendiente_aprobacion",
    fecha: new Date().toISOString(),
  };

  const indexExistente = pedidosFueraPresupuesto.findIndex(
    (p) => p.id_componente === componente.id_componente
  );

  if (indexExistente >= 0) {
    pedidosFueraPresupuesto[indexExistente] = pedidoExtra;
  } else {
    pedidosFueraPresupuesto.push(pedidoExtra);
  }

  componente.pedido = cantidadMaxima;

  actualizarEstadisticas();
  actualizarCarrito();

  const input = document.querySelector(
    `input[data-componente-id="${componente.id_componente}"]`
  );
  if (input) {
    input.value = cantidadMaxima;
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalJustificacionExtra")
  );
  modal.hide();

  delete window.pedidoExtraTemp;

  alert("Pedido fuera de presupuesto agregado. Requiere aprobación.");
}

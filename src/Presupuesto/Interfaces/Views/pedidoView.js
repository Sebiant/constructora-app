let proyectosData = [];
let itemsData = { componentesAgrupados: [], itemsIndividuales: [] };
let materialesExtra = [];
let pedidosFueraPresupuesto = [];
let seleccionActual = null;

function obtenerClaseBadgeEstadoMaterial(estado = 'pendiente') {
  switch ((estado || '').toLowerCase()) {
    case 'aprobado':
      return 'badge bg-success';
    case 'rechazado':
      return 'badge bg-danger';
    case 'en_proceso':
    case 'en_progreso':
    case 'proceso':
      return 'badge bg-primary';
    default:
      return 'badge bg-warning text-dark';
  }
}

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
            <div class="col-md-12">
              <div class="table-responsive">
                <table class="table table-sm table-bordered mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="text-center">Presupuestado</th>
                      <th class="text-center bg-success text-white">Aprobado</th>
                      <th class="text-center bg-warning">Pendiente</th>
                      <th class="text-center bg-danger text-white">Rechazado</th>
                      <th class="text-center bg-primary text-white">Total Pedido</th>
                      <th class="text-center bg-secondary text-white">Disponible</th>
                      <th class="text-center">Precio Unit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center"><strong>${parseFloat(cantidadTotal).toFixed(4)} ${unidad}</strong></td>
                      <td class="text-center ${(parseFloat(comp.ya_pedido_aprobado || 0) + parseFloat(comp.excedente_aprobado || 0)) > 0 ? 'table-success' : ''}">
                        <strong>${(parseFloat(comp.ya_pedido_aprobado || 0) + parseFloat(comp.excedente_aprobado || 0)).toFixed(4)}</strong>
                      </td>
                      <td class="text-center ${(parseFloat(comp.ya_pedido_pendiente || 0) + parseFloat(comp.excedente_pendiente || 0)) > 0 ? 'table-warning' : ''}">
                        <strong>${(parseFloat(comp.ya_pedido_pendiente || 0) + parseFloat(comp.excedente_pendiente || 0)).toFixed(4)}</strong>
                      </td>
                      <td class="text-center ${(parseFloat(comp.ya_pedido_rechazado || 0) + parseFloat(comp.excedente_rechazado || 0)) > 0 ? 'table-danger' : ''}">
                        <strong>${(parseFloat(comp.ya_pedido_rechazado || 0) + parseFloat(comp.excedente_rechazado || 0)).toFixed(4)}</strong>
                      </td>
                      <td class="text-center ${parseFloat(yaPedido) > 0 ? 'table-primary' : ''}">
                        <strong>${parseFloat(yaPedido).toFixed(4)}</strong>
                        <br><small class="text-muted">(${porcentajeYaPedido.toFixed(1)}%)</small>
                      </td>
                      <td class="text-center table-secondary">
                        <strong>${parseFloat(comp.disponible || 0).toFixed(4)}</strong>
                      </td>
                      <td class="text-center">
                        <strong>$${formatCurrency(comp.precio_unitario)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="alert alert-info mt-2 mb-0">
                <small>
                  <i class="bi bi-info-circle"></i> Este componente se debe pedir item por item. Use el botón "Desglose" para registrar cantidades específicas.
                  ${parseFloat(yaPedido) > 0 ? `<br><strong>Total pedido (aprobado): ${parseFloat(yaPedido).toFixed(4)} ${unidad}</strong>` : ''}
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
                                 data-max="${maxPermitido.toFixed(4)}"
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
  let value = parseFloat(input.value) || 0;

  if (value < 0) value = 0;
  // No forzamos el valor al input aquí para permitir que el usuario escriba
  // Solo actualizamos si es válido
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
      const max = parseFloat(input.dataset.max) || 0;
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
    solicitarJustificacionPedidoExtra(
      componente,
      item,
      nuevoValor,
      maxPermitido
    );
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
  if (typeof actualizarCarrito === 'function') {
    actualizarCarrito();
  }
  actualizarEstadisticas();
  renderMaterialesExtraCard();
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
        ${pedidoExtra
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
                 class="form-control form-control-sm cantidad-componente ${pedidoExtra ? "border-warning" : ""
      }"
                 value="${cantidadActual}"
                 min="0"
                 step="0.0001"
                 data-componente-id="${componente.id_componente}"
                 data-item-id="${itemId}"
                 data-precio="${componente.precio_unitario}"
                 data-unidad="${componente.unidad}">
          <span class="input-group-text">${componente.unidad}</span>
        </div>
        <small class="text-muted">Máx: ${cantidadMaxima.toFixed(4)}</small>
        ${pedidoExtra
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
        <button class="btn btn-sm btn-outline-success" onclick="agregarTodoComponente(${componente.id_componente
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
  if (typeof actualizarCarrito === 'function') {
    actualizarCarrito();
  }
  actualizarBotonDesglose(itemId);
  renderMaterialesExtraCard();
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
          <h6 class="text-primary">${nombresTipo[tipo] || tipo
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
  if (projectInfo) {
    projectInfo.style.display = "none";
  }
  try {
    resetarGestion();
  } catch (e) {
    console.error('Error en resetarGestion al cambiar proyecto:', e);
  }

  if (proyectoId) {
    try {
      selectPresupuesto.innerHTML =
        '<option value="">Cargando presupuestos...</option>';

      const formData = new FormData();
      formData.append("proyecto_id", proyectoId);

      const response = await fetch(
        API_PRESUPUESTOS + "?action=getPresupuestosByProyecto",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al cargar presupuestos`);
      }

      const rawText = await response.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        console.error('Respuesta no-JSON al cargar presupuestos. Preview:', rawText?.slice(0, 300));
        throw new Error('Respuesta inválida del servidor (no es JSON). Revise logs del servidor.');
      }

      if (!result?.success) throw new Error(result?.error || result?.message || 'No se pudieron cargar los presupuestos');

      const presupuestos = result?.data || result?.presupuestos || [];

      selectPresupuesto.innerHTML =
        '<option value="">-- Seleccionar Presupuesto --</option>';

      if (Array.isArray(presupuestos) && presupuestos.length > 0) {
        selectPresupuesto.disabled = false;
        presupuestos.forEach((presupuesto) => {
          const option = document.createElement("option");
          option.value = presupuesto.id_presupuesto;
          option.textContent = `${presupuesto.nombre_proyecto || presupuesto.nombre || ('Presupuesto ' + presupuesto.id_presupuesto)
            } - $${parseFloat(presupuesto.monto_total || 0).toLocaleString()}`;
          option.setAttribute("data-presupuesto", JSON.stringify(presupuesto));
          selectPresupuesto.appendChild(option);
        });
      } else {
        selectPresupuesto.disabled = true;
        selectPresupuesto.innerHTML =
          '<option value="">No hay presupuestos para este proyecto</option>';
      }
    } catch (error) {
      console.error("Error cargando presupuestos:", error);
      alert("Error al cargar los presupuestos: " + error.message);

      selectPresupuesto.disabled = true;
      selectPresupuesto.innerHTML =
        '<option value="">Error al cargar presupuestos</option>';
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
      const btnResumen = document.getElementById("btnVerResumen");
      if (btnResumen) {
        btnResumen.disabled = false;
      }
      document.getElementById("filterCapitulo").disabled = false;

      mostrarItemsConComponentes(items);
      actualizarEstadisticas();
      mostrarInformacionProyecto(proyecto, presupuesto);

      cargarMaterialesExtraDesdeDB().then(materialesExtraDB => {
        materialesExtra.length = 0;
        materialesExtra.push(
          ...(materialesExtraDB || []).map((m) => ({
            ...m,
            en_pedido_actual: false,
          }))
        );
        actualizarEstadisticas();
        renderMaterialesExtraCard();
      });
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

/**
 * Agrupa componentes con el mismo nombre+tipo+unidad en una sola card
 * Preserva el mapeo id_componente_original para cada item
 */
function agruparComponentesPorNombre(componentes) {
  const gruposMap = new Map();

  componentes.forEach(comp => {
    // Clave única por nombre, tipo y unidad
    const clave = `${comp.nombre_componente}|${comp.tipo_componente}|${comp.unidad_componente}`;

    if (!gruposMap.has(clave)) {
      // Primera vez que vemos este componente
      gruposMap.set(clave, {
        ...comp,
        // Guardar el primer id como referencia (aunque no se usará para guardar)
        id_componente: comp.id_componente,
        ids_componentes: [comp.id_componente], // Array de todos los IDs agrupados
      });
    } else {
      // Ya existe, combinar
      const existente = gruposMap.get(clave);

      // Agregar este id_componente a la lista
      existente.ids_componentes.push(comp.id_componente);

      // Combinar items_que_usan (cada item ya tiene su id_componente_original)
      existente.items_que_usan = existente.items_que_usan.concat(comp.items_que_usan);

      // Sumar totales
      existente.total_necesario += comp.total_necesario;
      existente.ya_pedido += comp.ya_pedido;
      existente.disponible += comp.disponible;

      // Sumar campos de estado de pedidos
      existente.ya_pedido_aprobado += comp.ya_pedido_aprobado || 0;
      existente.ya_pedido_pendiente += comp.ya_pedido_pendiente || 0;
      existente.ya_pedido_rechazado += comp.ya_pedido_rechazado || 0;
      existente.excedente_aprobado += comp.excedente_aprobado || 0;
      existente.excedente_pendiente += comp.excedente_pendiente || 0;
      existente.excedente_rechazado += comp.excedente_rechazado || 0;

      // Promediar precio (no es crítico, es solo para display)
      existente.precio_unitario = (existente.precio_unitario + comp.precio_unitario) / 2;

      // Combinar capitulos
      if (comp.capitulos && comp.capitulos.length > 0) {
        existente.capitulos = [...new Set([...existente.capitulos, ...comp.capitulos])];
      }

      // Actualizar contadores
      existente.cantidad_items += comp.cantidad_items;
      existente.cantidad_capitulos = Math.max(existente.cantidad_capitulos, comp.cantidad_capitulos);
    }
  });

  return Array.from(gruposMap.values());
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
      const componentesProcessed = result.data.map((comp) => {
        const unidad = comp.unidad_componente?.trim() || "UND";
        const cantidadTotal = parseFloat(comp.total_necesario) || 0;

        const componente = {
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

          // Nuevos campos de estado de pedidos
          ya_pedido_aprobado: parseFloat(comp.ya_pedido_aprobado) || 0,
          ya_pedido_pendiente: parseFloat(comp.ya_pedido_pendiente) || 0,
          ya_pedido_rechazado: parseFloat(comp.ya_pedido_rechazado) || 0,
          excedente_aprobado: parseFloat(comp.excedente_aprobado) || 0,
          excedente_pendiente: parseFloat(comp.excedente_pendiente) || 0,
          excedente_rechazado: parseFloat(comp.excedente_rechazado) || 0,

          pedido_inicial: parseFloat(comp.pedido_inicial) || 0,
          capitulos: comp.capitulos || [],
          cantidad_items: comp.cantidad_items || 0,
          cantidad_capitulos: comp.cantidad_capitulos || 0,
          pedido: 0,
          items_que_usan: parseDetalleSerializado(comp.detalle_serializado),
        };

        // Agregar id_componente a cada item para preservar el mapeo
        componente.items_que_usan.forEach(item => {
          item.id_componente_original = comp.id_componente;
        });

        // RECALCULAR ya_pedido como suma de ya_pedido_item de todos los items
        // Esto asegura que el resumen coincida con la tabla de desglose
        componente.ya_pedido = componente.items_que_usan.reduce((sum, item) => {
          return sum + (parseFloat(item.ya_pedido_item) || 0);
        }, 0);

        // Recalcular disponible basado en el ya_pedido corregido
        componente.disponible = Math.max(0, componente.total_necesario - componente.ya_pedido);

        return componente;
      });

      // AGRUPAR componentes con el mismo nombre
      const componentesAgrupados = agruparComponentesPorNombre(componentesProcessed);

      return componentesAgrupados;
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
      // En algunas vistas este select no existe; evitar que falle toda la carga
      if (!selectUnidad) return;

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
  // 0% -> rojo (danger)
  if (porcentaje === 0)
    return { colorClass: "bg-danger", colorText: "Sin uso" };
  // 1% - 69% -> verde (success)
  if (porcentaje < 70)
    return { colorClass: "bg-success", colorText: "Dentro del presupuesto" };
  // 70% - 89% -> amarillo (warning)
  if (porcentaje < 90)
    return { colorClass: "bg-warning", colorText: "Cerca del límite" };
  // 90% - 99% -> naranja (custom orange)
  if (porcentaje < 100)
    return { colorClass: "bg-orange", colorText: "Alto riesgo" };
  // 100% o más -> rojo (danger)
  return { colorClass: "bg-danger", colorText: "Límite alcanzado" };
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
  const value = parseFloat(amount || 0);
  if (Number.isNaN(value)) return '0.00';

  // Formato: 1,234,567.89
  return value
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function actualizarEstadisticas() {
  let componentesSeleccionados = 0;
  let totalCantidad = 0;
  let valorTotal = 0;

  if (itemsData && itemsData.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach((componente) => {
      if (componente.pedido > 0) {
        componentesSeleccionados++;
        totalCantidad += componente.pedido;
        valorTotal += componente.pedido * componente.precio_unitario;
      }
    });
  }

  const statSel = document.getElementById("statSeleccionados");
  if (statSel) statSel.textContent = componentesSeleccionados;

  const statTotalItems = document.getElementById("statTotalItems");
  if (statTotalItems) statTotalItems.textContent = totalCantidad.toFixed(2);

  const statValorTotal = document.getElementById("statValorTotal");
  if (statValorTotal) statValorTotal.textContent = `$${valorTotal.toFixed(2)}`;

  const statExtras = document.getElementById("statExtras");
  if (statExtras) statExtras.textContent = (materialesExtra || []).length;

  const alertPendientes = document.getElementById(
    "alertPendientesAutorizacion"
  );
  const statPendientes = document.getElementById(
    "statPendientesAutorizacion"
  );

  if (alertPendientes && statPendientes) {
    if (pedidosFueraPresupuesto && pedidosFueraPresupuesto.length > 0) {
      alertPendientes.style.display = "block";
      statPendientes.textContent = pedidosFueraPresupuesto.length;
    } else {
      alertPendientes.style.display = "none";
    }
  }

  const btnConfirmar = document.getElementById("btnConfirmarPedido");
  if (btnConfirmar) {
    const btnDisabled =
      componentesSeleccionados === 0 &&
      (!pedidosFueraPresupuesto || pedidosFueraPresupuesto.length === 0);
    btnConfirmar.disabled = btnDisabled;
  }

  renderResumenCarrito();
}

function renderResumenCarrito() {
  const container = document.getElementById('resumenCarritoList');
  if (!container) return;

  const itemsCarrito = [];
  const itemsFueraPresupuesto = [];

  if (itemsData && Array.isArray(itemsData.componentesAgrupados)) {
    itemsData.componentesAgrupados.forEach((componente) => {
      if (!Array.isArray(componente.items_que_usan)) return;
      componente.items_que_usan.forEach((item) => {
        const cantidad = parseFloat(item.pedido_actual) || 0;
        if (cantidad <= 0) return;

        const precio = parseFloat(componente.precio_unitario) || 0;
        itemsCarrito.push({
          titulo: `${item.codigo_item} - ${componente.nombre_componente}`,
          detalle: item.nombre_item,
          unidad: componente.unidad_componente || componente.unidad || 'UND',
          cantidad,
          subtotal: cantidad * precio,
        });
      });
    });
  }

  if (Array.isArray(materialesExtra) && materialesExtra.length > 0) {
    materialesExtra.forEach((extra) => {
      if (!extra || extra.en_pedido_actual !== true) return;
      const cantidad = parseFloat(extra.cantidad) || 0;
      if (cantidad <= 0) return;
      const precio = parseFloat(extra.precio_unitario) || 0;
      itemsCarrito.push({
        titulo: `${extra.codigo || 'EXTRA'} - ${extra.descripcion || ''}`,
        detalle: 'Material extra',
        unidad: extra.unidad || 'UND',
        cantidad,
        subtotal: cantidad * precio,
      });
    });
  }

  if (Array.isArray(pedidosFueraPresupuesto) && pedidosFueraPresupuesto.length > 0) {
    pedidosFueraPresupuesto.forEach((p) => {
      if (!p) return;
      const cantidad = parseFloat(p.cantidad_extra ?? p.cantidad_solicitada ?? 0) || 0;
      if (cantidad <= 0) return;
      const precio = parseFloat(p.precio_unitario) || 0;
      itemsFueraPresupuesto.push({
        titulo: `${p.codigo_item || ''} - ${p.descripcion_componente || ''}`.trim(),
        detalle: `${p.nombre_item || ''} (pendiente aprobación)`.trim(),
        unidad: p.unidad || 'UND',
        cantidad,
        subtotal: cantidad * precio,
      });
    });
  }

  if (itemsCarrito.length === 0 && itemsFueraPresupuesto.length === 0) {
    container.innerHTML = `
      <div class="text-muted small">
        <i class="bi bi-cart"></i> Carrito vacío
      </div>
    `;
    return;
  }

  const total = itemsCarrito.reduce((sum, it) => sum + (parseFloat(it.subtotal) || 0), 0);
  const totalFuera = itemsFueraPresupuesto.reduce((sum, it) => sum + (parseFloat(it.subtotal) || 0), 0);

  const filas = itemsCarrito
    .sort((a, b) => (b.subtotal || 0) - (a.subtotal || 0))
    .slice(0, 8)
    .map((it) => {
      return `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="me-2" style="min-width: 0;">
            <div class="small fw-semibold text-truncate">${it.titulo}</div>
            <div class="small text-muted text-truncate">${it.detalle}</div>
            <div class="small text-muted">${it.cantidad.toFixed(4)} ${it.unidad}</div>
          </div>
          <div class="small fw-bold text-end">$${formatCurrency(it.subtotal)}</div>
        </div>
      `;
    })
    .join('');

  const extraCount = Math.max(0, itemsCarrito.length - 8);

  const filasFuera = itemsFueraPresupuesto
    .sort((a, b) => (b.subtotal || 0) - (a.subtotal || 0))
    .slice(0, 5)
    .map((it) => {
      return `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="me-2" style="min-width: 0;">
            <div class="small fw-semibold text-truncate">${it.titulo}</div>
            <div class="small text-muted text-truncate">${it.detalle}</div>
            <div class="small text-muted">${it.cantidad.toFixed(4)} ${it.unidad}</div>
          </div>
          <div class="small fw-bold text-end">$${formatCurrency(it.subtotal)}</div>
        </div>
      `;
    })
    .join('');

  const extraFueraCount = Math.max(0, itemsFueraPresupuesto.length - 5);

  container.innerHTML = `
    <div class="border rounded p-2" style="background: #f8f9fa;">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="small fw-bold"><i class="bi bi-cart-check"></i> Carrito</div>
        <div class="small text-muted">${itemsCarrito.length} items</div>
      </div>
      <div style="max-height: 260px; overflow: auto;">${filas}</div>
      ${extraCount > 0 ? `<div class="small text-muted mt-2">+${extraCount} más...</div>` : ''}
      ${itemsFueraPresupuesto.length > 0 ? `
        <div class="mt-2 pt-2 border-top">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="small fw-bold text-warning"><i class="bi bi-exclamation-triangle"></i> Fuera de presupuesto</div>
            <div class="small text-muted">${itemsFueraPresupuesto.length} items</div>
          </div>
          <div>${filasFuera}</div>
          ${extraFueraCount > 0 ? `<div class="small text-muted mt-2">+${extraFueraCount} más...</div>` : ''}
          <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
            <div class="small fw-bold text-warning">Total fuera de presupuesto</div>
            <div class="small fw-bold text-warning">$${formatCurrency(totalFuera)}</div>
          </div>
        </div>
      ` : ''}
      <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
        <div class="small fw-bold">Total carrito</div>
        <div class="small fw-bold">$${formatCurrency(total)}</div>
      </div>
    </div>
  `;
}

async function refrescarMaterialesExtra(btn) {
  if (!seleccionActual?.datos?.presupuestoId) {
    alert('Seleccione un presupuesto antes de refrescar los materiales extra.');
    return;
  }

  const originalHtml = btn ? btn.innerHTML : null;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Actualizando...';
  }

  try {
    document.getElementById("materialesExtraList").innerHTML = `
      <div class="text-center text-muted py-3">
        <div class="spinner-border text-warning" role="status"></div>
        <p class="mt-2 mb-0">Actualizando información...</p>
      </div>
    `;

    const materialesExtraDB = await cargarMaterialesExtraDesdeDB();
    materialesExtra.length = 0;
    materialesExtra.push(
      ...(materialesExtraDB || []).map((m) => ({
        ...m,
        en_pedido_actual: false,
      }))
    );
    actualizarEstadisticas();
    renderMaterialesExtraCard();
  } catch (error) {
    console.error('Error refrescando materiales extra:', error);
    alert('No se pudieron actualizar los materiales extra. Intente nuevamente.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function solicitarMaterialExtra() {
  const idMaterial = document.getElementById('selectMaterial').value;
  const idCapitulo = document.getElementById('capituloMaterialExtra').value;
  const cantidad = document.getElementById('cantidadMaterialExtra').value;
  const justificacion = document.getElementById('justificacionMaterial').value;

  if (!idMaterial || !materialSeleccionadoData) {
    alert('Por favor seleccione un material de la lista');
    return;
  }

  if (!idCapitulo) {
    alert('Por favor seleccione un capítulo');
    return;
  }

  if (!cantidad || parseFloat(cantidad) <= 0) {
    alert('Por favor ingrese una cantidad válida');
    return;
  }

  if (!justificacion.trim()) {
    alert('Por favor ingrese una justificación');
    return;
  }

  // Guardar en base de datos
  const formData = new FormData();
  formData.append('id_presupuesto', seleccionActual.datos.presupuestoId);
  formData.append('id_material', materialSeleccionadoData.id_material);
  formData.append('id_capitulo', idCapitulo);
  formData.append('cantidad', cantidad);
  formData.append('justificacion', justificacion);

  fetch(API_PRESUPUESTOS + '?action=guardarMaterialExtra', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const materialExtra = {
          id_material_extra: data.data?.id_material_extra,
          id_material: materialSeleccionadoData.id_material,
          id_componente: materialSeleccionadoData.id_material,
          codigo: materialSeleccionadoData.cod_material,
          descripcion: materialSeleccionadoData.nombre_material,
          cantidad: parseFloat(cantidad),
          unidad: materialSeleccionadoData.unidad,
          precio_unitario: parseFloat(materialSeleccionadoData.precio_actual),

          tipo_componente: materialSeleccionadoData.id_tipo_material,
          tipo_material: materialSeleccionadoData.tipo_material,
          id_capitulo: parseInt(idCapitulo),
          nombre_capitulo:
            document.querySelector('#capituloMaterialExtra option:checked')?.textContent?.trim() ||
            'N/A',
          justificacion: justificacion,
          estado: 'pendiente',
          fecha: new Date().toISOString().split('T')[0],
          es_material_extra: true,
          en_pedido_actual: true
        };
        materialesExtra.push(materialExtra);

        actualizarEstadisticas();
        renderMaterialesExtraCard();
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoItem'));
        modal.hide();
        alert('Material guardado en el presupuesto');
        cargarItems();
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al guardar');
    });
}

function eliminarMaterialExtra(index) {
  if (confirm("¿Está seguro de eliminar este material extra?")) {
    materialesExtra.splice(index, 1);
    actualizarEstadisticas();
    if (typeof actualizarCarrito === 'function') {
      actualizarCarrito();
    }
    renderMaterialesExtraCard();
  }
}

function eliminarPedidoExtra(index) {
  if (confirm("¿Está seguro de cancelar este pedido fuera de presupuesto?")) {
    pedidosFueraPresupuesto.splice(index, 1);
    actualizarEstadisticas();
    if (typeof actualizarCarrito === 'function') {
      actualizarCarrito();
    }
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
      <p class="mb-1"><strong>Item:</strong> ${item.codigo_item} - ${item.nombre_item
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
  try {
    const justificacion = document
      .getElementById("justificacionPedidoExtra")
      .value.trim();

    if (!justificacion) {
      alert(
        "Debe proporcionar una justificación para el pedido fuera de presupuesto"
      );
      return;
    }

    // Validar que existe window.pedidoExtraTemp
    if (!window.pedidoExtraTemp) {
      console.error("No hay datos temporales del pedido extra");
      alert("Error: No se encontraron los datos del pedido. Por favor, intente nuevamente.");
      return;
    }

    const { componente, item, cantidadSolicitada, cantidadMaxima } =
      window.pedidoExtraTemp;

    // Validar que todos los datos necesarios existen
    if (!componente || !item) {
      console.error("Datos incompletos en pedidoExtraTemp:", window.pedidoExtraTemp);
      alert("Error: Datos incompletos. Por favor, intente nuevamente.");
      return;
    }

    const idComponenteReal = item.id_componente_original || componente.id_componente;

    const pedidoExtra = {
      id_componente: idComponenteReal,
      id_item: item.id_item,
      codigo_item: item.codigo_item,
      nombre_item: item.nombre_item,
      descripcion_componente: componente.descripcion || componente.nombre_componente,
      tipo_componente: componente.tipo_componente,
      unidad: componente.unidad || componente.unidad_componente,
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
        String(p.id_componente) === String(idComponenteReal) && String(p.id_item) === String(item.id_item)
    );

    if (indexExistente >= 0) {
      pedidosFueraPresupuesto[indexExistente] = pedidoExtra;
    } else {
      pedidosFueraPresupuesto.push(pedidoExtra);
    }

    // Actualizar el pedido normal al máximo permitido
    item.pedido_actual = cantidadMaxima;

    // Actualizar input específico del item
    const input = document.querySelector(
      `input.cantidad-componente-item[data-componente-id="${componente.id_componente}"][data-item-id="${item.id_item}"]`
    );

    if (input) {
      input.value = cantidadMaxima.toFixed(4);

      // Actualizar subtotal en la fila
      const row = input.closest("tr");
      if (row) {
        const subtotalElement = row.querySelector(".subtotal-item");
        if (subtotalElement) {
          subtotalElement.textContent = `$${formatCurrency(
            cantidadMaxima * componente.precio_unitario
          )}`;
        }
      }
    }

    // Actualizar totales
    if (typeof actualizarTotalesDesglose === 'function') {
      actualizarTotalesDesglose(componente);
    }
    if (typeof actualizarResumenComponente === 'function') {
      actualizarResumenComponente(componente);
    }

    actualizarEstadisticas();

    if (typeof actualizarCarrito === 'function') {
      actualizarCarrito();
    }

    delete window.pedidoExtraTemp;

    alert("Pedido fuera de presupuesto agregado. Requiere aprobación.");
  } catch (error) {
    console.error("Error en confirmarPedidoExtra:", error);
    alert("Error al procesar el pedido extra: " + error.message);
  } finally {
    // SIEMPRE cerrar el modal, incluso si hay errores
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalJustificacionExtra")
    );
    if (modal) {
      modal.hide();
    }
  }
}

async function confirmarPedido() {
  const btn = document.getElementById("btnConfirmarPedido");
  const originalBtnHtml = btn ? btn.innerHTML : null;

  const componentesConPedido = [];

  // CAMBIADO: Ahora enviamos los pedidos por ITEM, no por componente agregado
  if (itemsData.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach((componente) => {
      // Verificar si hay pedidos en items individuales (desglose)
      if (componente.items_que_usan && Array.isArray(componente.items_que_usan)) {
        componente.items_que_usan.forEach((item) => {
          const cantidadItem = parseFloat(item.pedido_actual) || 0;
          if (cantidadItem > 0) {
            // Usar id_componente_original del item (preservado durante agrupación)
            // Esto asegura que cada pedido se guarde con el componente correcto
            const idComponenteParaGuardar = item.id_componente_original || componente.id_componente;

            componentesConPedido.push({
              id_componente: idComponenteParaGuardar, // ID específico del item
              nombre_componente: componente.nombre_componente,
              tipo_componente: componente.tipo_componente,
              unidad_componente: componente.unidad_componente,
              precio_unitario: componente.precio_unitario,
              pedido: cantidadItem,
              id_item: item.id_item, // ¡CRÍTICO! Agregar id_item
              total_necesario: componente.total_necesario,
              capitulos: componente.capitulos,
            });
          }
        });
      }
      // Si no hay desglose por items, enviar el pedido agregado (compatibilidad)
      else if (componente.pedido > 0) {
        componentesConPedido.push({
          id_componente: componente.id_componente,
          nombre_componente: componente.nombre_componente,
          tipo_componente: componente.tipo_componente,
          unidad_componente: componente.unidad_componente,
          precio_unitario: componente.precio_unitario,
          pedido: componente.pedido,
          id_item: null, // Sin id_item específico (pedidos antiguos)
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
      materialesExtra: [],
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

      if (typeof actualizarCarrito === 'function') {
        actualizarCarrito();
      }
      actualizarEstadisticas();

      // Recargar los datos del presupuesto actual para reflejar ya_pedido actualizado
      await cargarItems();
    } else {
      alert("Error al guardar el pedido: " + result.error);
    }
  } catch (error) {
    console.error("Error confirmando pedido:", error);
    // Solo mostrar alert si realmente hay un error crítico
    if (error.message && !error.message.includes('pedidoExtraTemp')) {
      alert("Error al confirmar el pedido: " + error.message);
    }
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
    // Usar el primer item de items_que_usan como representante
    const itemRepresentante = componente.items_que_usan && componente.items_que_usan.length > 0
      ? componente.items_que_usan[0]
      : { id_item: null, codigo_item: 'N/A', nombre_item: 'Componente Agrupado' };

    solicitarJustificacionPedidoExtra(componente, itemRepresentante, nuevaCantidad, maxPermitido);
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

  if (typeof actualizarCarrito === 'function') {
    actualizarCarrito();
  }
  actualizarEstadisticas();
  renderMaterialesExtraCard();
}


// ==============================================
// FUNCIONES PARA RESUMEN Y EXPORTACIÓN
// ==============================================

/**
 * Abre el modal de resumen con vista unificada de materiales
 */
function abrirModalResumen() {
  const datosResumen = generarDatosResumen();

  // Actualizar estadísticas generales
  document.getElementById('resumenTotalItems').textContent = datosResumen.totalItems || 0;
  document.getElementById('resumenTotalComponentes').textContent = datosResumen.totalComponentes || 0;
  document.getElementById('resumenCompletados').textContent = datosResumen.componentesCompletados || 0;
  document.getElementById('resumenValorTotal').textContent = `$${(datosResumen.valorTotal || 0).toLocaleString('es-CO')}`;

  // Llenar tabla unificada
  const tablaResumen = document.getElementById('tablaResumenUnificada');

  if (datosResumen.componentesPorItem.length > 0) {
    let html = '';

    datosResumen.componentesPorItem.forEach((item, idx) => {
      const detalleId = `desglose-resumen-${idx}`;

      // Fila del item (colapsable)
      html += `
        <tr class="table-light cursor-pointer fw-bold" onclick="toggleDesglose('${detalleId}')" style="cursor: pointer;">
          <td colspan="7">
            <i class="bi bi-chevron-right me-2" id="icon-${detalleId}"></i>
            <strong>${item.codigoItem}</strong> - ${item.nombreItem}
          </td>
          <td class="text-center">
            <span class="badge ${item.porcentajeGlobal >= 100 ? 'bg-success' : item.porcentajeGlobal >= 70 ? 'bg-info' : item.porcentajeGlobal >= 30 ? 'bg-warning text-dark' : 'bg-danger'}">
              ${item.porcentajeGlobal.toFixed(1)}%
            </span>
          </td>
          <td class="text-end"><strong>$${item.valorTotal.toLocaleString('es-CO')}</strong></td>
        </tr>
      `;

      // Filas de desglose (ocultas inicialmente)
      item.componentes.forEach(comp => {
        const porcentaje = comp.porcentaje;
        let badgeClass, badgeText;

        if (porcentaje >= 100) {
          badgeClass = 'bg-success';
          badgeText = 'Completo';
        } else if (porcentaje >= 70) {
          badgeClass = 'bg-info';
          badgeText = `${porcentaje.toFixed(1)}%`;
        } else if (porcentaje >= 30) {
          badgeClass = 'bg-warning text-dark';
          badgeText = `${porcentaje.toFixed(1)}%`;
        } else if (porcentaje > 0) {
          badgeClass = 'bg-danger';
          badgeText = `${porcentaje.toFixed(1)}%`;
        } else {
          badgeClass = 'bg-secondary';
          badgeText = 'Sin pedir';
        }

        html += `
          <tr id="${detalleId}" class="desglose-row" style="display: none;">
            <td class="ps-5">${comp.nombre}</td>
            <td class="text-center">
              <span class="badge bg-secondary">${comp.tipo}</span>
            </td>
            <td class="text-center">${comp.unidad}</td>
            <td class="text-end">${comp.cantidadTotal.toFixed(4)}</td>
            <td class="text-end text-primary">${comp.yaPedido.toFixed(4)}</td>
            <td class="text-end text-success"><strong>${comp.pedidoActual.toFixed(4)}</strong></td>
            <td class="text-end text-warning">${comp.pendiente.toFixed(4)}</td>
            <td class="text-center">
              <span class="badge ${badgeClass}">${badgeText}</span>
            </td>
            <td class="text-end">$${comp.subtotal.toLocaleString('es-CO')}</td>
          </tr>
        `;
      });
    });

    tablaResumen.innerHTML = html;
  } else {
    tablaResumen.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No hay datos para mostrar</td></tr>';
  }

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('modalResumen'));
  modal.show();
}

// Función auxiliar para toggle de desglose
function toggleDesglose(detalleId) {
  const rows = document.querySelectorAll(`tr[id="${detalleId}"]`);
  const icon = document.getElementById(`icon-${detalleId}`);

  rows.forEach(row => {
    if (row.style.display === 'none') {
      row.style.display = '';
      if (icon) icon.className = 'bi bi-chevron-down me-2';
    } else {
      row.style.display = 'none';
      if (icon) icon.className = 'bi bi-chevron-right me-2';
    }
  });
}

/**
 * Genera los datos para el resumen unificado de materiales
 * @returns {Object} Datos estructurados para el resumen
 */
function generarDatosResumen(excedentes = []) {
  const componentesPorItem = new Map();
  let valorTotalGlobal = 0;
  let totalComponentesContados = 0;
  let componentesCompletados = 0;

  const excedentesMap = new Map();
  if (Array.isArray(excedentes)) {
    excedentes.forEach((extra) => {
      const clave = `${extra.id_item || 'GLOBAL'}-${extra.id_componente}`;
      const acumulado = excedentesMap.get(clave) || {
        cantidad: 0,
        justificaciones: []
      };

      acumulado.cantidad += parseFloat(extra.cantidad_extra) || 0;
      if (extra.justificacion) {
        acumulado.justificaciones.push(extra.justificacion.trim());
      }

      excedentesMap.set(clave, acumulado);
    });
  }

  if (!itemsData.componentesAgrupados) {
    return {
      totalItems: 0,
      totalComponentes: 0,
      componentesCompletados: 0,
      valorTotal: 0,
      componentesPorItem: []
    };
  }

  itemsData.componentesAgrupados.forEach(componente => {
    if (!componente.items_que_usan || !Array.isArray(componente.items_que_usan)) {
      return;
    }

    componente.items_que_usan.forEach(item => {
      const cantidadTotal = parseFloat(item.cantidad_componente) || 0;
      const yaPedido = parseFloat(item.ya_pedido_item) || 0;
      const pedidoActual = parseFloat(item.pedido_actual) || 0;
      const pendiente = Math.max(0, cantidadTotal - yaPedido - pedidoActual);
      const precioUnitario = parseFloat(componente.precio_unitario) || 0;

      const porcentaje = cantidadTotal > 0 ? (yaPedido / cantidadTotal) * 100 : 0;
      const subtotal = yaPedido * precioUnitario;

      const excedenteClaveEspecifica = `${item.id_item || 'GLOBAL'}-${componente.id_componente}`;
      const excedenteClaveGeneral = `GLOBAL-${componente.id_componente}`;
      const excedenteInfo = excedentesMap.get(excedenteClaveEspecifica) || excedentesMap.get(excedenteClaveGeneral);
      const cantidadExcedente = excedenteInfo?.cantidad || 0;
      const justificacionExcedente = excedenteInfo?.justificaciones?.join(' | ') || '';

      const itemKey = item.codigo_item;

      if (!componentesPorItem.has(itemKey)) {
        componentesPorItem.set(itemKey, {
          codigoItem: item.codigo_item,
          nombreItem: item.nombre_item,
          capitulo: item.nombre_capitulo || 'N/A',
          componentes: [],
          valorTotal: 0,
          cantidadTotalGlobal: 0,
          cantidadCompletadaGlobal: 0,
          porcentajeGlobal: 0
        });
      }

      const itemData = componentesPorItem.get(itemKey);

      itemData.componentes.push({
        nombre: componente.nombre_componente,
        tipo: componente.tipo_componente,
        unidad: componente.unidad_componente || 'UND',
        cantidadTotal: cantidadTotal,
        yaPedido: yaPedido,
        pedidoActual: pedidoActual,
        excedente: cantidadExcedente,
        justificacion: justificacionExcedente,
        pendiente: pendiente,
        porcentaje: porcentaje,
        precioUnitario: precioUnitario,
        subtotal: subtotal
      });

      itemData.valorTotal += subtotal;
      itemData.cantidadTotalGlobal += cantidadTotal;
      itemData.cantidadCompletadaGlobal += yaPedido;

      valorTotalGlobal += subtotal;
      totalComponentesContados++;

      if (porcentaje >= 100) {
        componentesCompletados++;
      }
    });
  });

  // Calcular porcentaje global para cada item
  componentesPorItem.forEach(itemData => {
    itemData.porcentajeGlobal = itemData.cantidadTotalGlobal > 0
      ? (itemData.cantidadCompletadaGlobal / itemData.cantidadTotalGlobal) * 100
      : 0;
  });

  // Agregar materiales extra como un item separado
  if (materialesExtra && materialesExtra.length > 0) {
    const materialesExtraItem = {
      codigoItem: 'EXTRA',
      nombreItem: 'MATERIALES EXTRA (Fuera de Presupuesto)',
      capitulo: 'Varios',
      componentes: [],
      valorTotal: 0,
      cantidadTotalGlobal: 0,
      cantidadCompletadaGlobal: 0,
      porcentajeGlobal: 0
    };

    materialesExtra.forEach(extra => {
      const cantidad = parseFloat(extra.cantidad) || 0;
      const precio = parseFloat(extra.precio_unitario) || 0;
      const subtotal = 0;

      materialesExtraItem.componentes.push({
        nombre: `${extra.codigo} - ${extra.descripcion}`,
        tipo: extra.tipo_material || 'Material',
        unidad: extra.unidad || 'UND',
        cantidadTotal: cantidad,
        yaPedido: 0,
        pedidoActual: cantidad,
        excedente: 0,
        justificacion: extra.justificacion || '',
        pendiente: 0,
        porcentaje: 100,
        precioUnitario: precio,
        subtotal: subtotal
      });

      materialesExtraItem.valorTotal += subtotal;
      materialesExtraItem.cantidadTotalGlobal += cantidad;
      materialesExtraItem.cantidadCompletadaGlobal += cantidad;
      valorTotalGlobal += subtotal;
      totalComponentesContados++;
      componentesCompletados++;
    });

    materialesExtraItem.porcentajeGlobal = 100;
    componentesPorItem.set('EXTRA', materialesExtraItem);
  }

  return {
    totalItems: componentesPorItem.size,
    totalComponentes: totalComponentesContados,
    componentesCompletados: componentesCompletados,
    valorTotal: valorTotalGlobal,
    componentesPorItem: Array.from(componentesPorItem.values())
  };
}

/**
 * Exporta el resumen unificado a un archivo Excel con formato profesional usando ExcelJS
 * REQUIERE: <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>
 */
async function exportarResumenAExcel() {
  if (typeof ExcelJS === 'undefined') {
    alert('La librería ExcelJS no está disponible. Por favor, recargue la página.');
    return;
  }

  try {
    const presupuestoId = seleccionActual?.datos?.presupuestoId;
    const historialPedidos = typeof obtenerHistorialPedidos === 'function'
      ? await obtenerHistorialPedidos(presupuestoId)
      : [];

    const excedentesHistorial = typeof extraerExcedentesDesdeHistorial === 'function'
      ? extraerExcedentesDesdeHistorial(historialPedidos)
      : [];
    const excedentesActuales = Array.isArray(pedidosFueraPresupuesto)
      ? pedidosFueraPresupuesto
      : [];
    const datosResumen = generarDatosResumen([
      ...excedentesActuales,
      ...excedentesHistorial
    ]);
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Sistema de Gestión de Pedidos';
    workbook.created = new Date();

    // === HOJA 1: RESUMEN DE INSUMOS ===
    await generarHojaResumenInsumosExcel(workbook, datosResumen);

    // === HOJA 2: DETALLE POR ITEMS ===
    await generarHojaDetallePorItemsExcel(workbook, datosResumen);

    // === HOJA 3: HISTORIAL DE PEDIDOS ===
    await generarHojaHistorialPedidosExcel(workbook, historialPedidos);

    // Generar y descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Resumen_Pedido_${seleccionActual?.presupuesto || 'Presupuesto'}_${fecha}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('✅ Archivo Excel generado exitosamente con formato profesional');
  } catch (error) {
    console.error('Error generando archivo Excel:', error);
    alert('Error al generar el archivo Excel: ' + error.message);
  }
}

/**
 * Genera la hoja de RESUMEN DE INSUMOS con ExcelJS y estilos completos
 */
async function generarHojaResumenInsumosExcel(workbook, datosResumen) {
  const worksheet = workbook.addWorksheet('Resumen de Insumos');

  const proyectoNombre = seleccionActual?.proyecto || 'FIRMA CONSTRUCTORA';
  const presupuestoNombre = seleccionActual?.presupuesto || 'PRESUPUESTO';
  const fechaActual = new Date().toLocaleDateString('es-CO');

  // Configurar anchos de columna
  worksheet.columns = [
    { key: 'codigo', width: 12 },
    { key: 'clasif', width: 18 },
    { key: 'descripcion', width: 55 },
    { key: 'und', width: 10 },
    { key: 'cant', width: 10 },
    { key: 'vr_unit', width: 18 },
    { key: 'vr_total', width: 18 }
  ];

  let filaActual = 1;

  // ENCABEZADO PRINCIPAL
  worksheet.mergeCells(`A${filaActual}:G${filaActual}`);
  const celda1 = worksheet.getCell(`A${filaActual}`);
  celda1.value = proyectoNombre;
  celda1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  celda1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  celda1.alignment = { horizontal: 'center', vertical: 'middle' };
  celda1.border = borderCompleto();
  worksheet.getRow(filaActual).height = 25;
  filaActual++;

  // SUBTÍTULO
  worksheet.mergeCells(`A${filaActual}:G${filaActual}`);
  const celda2 = worksheet.getCell(`A${filaActual}`);
  celda2.value = 'RESUMEN DE INSUMOS';
  celda2.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  celda2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  celda2.alignment = { horizontal: 'center', vertical: 'middle' };
  celda2.border = borderCompleto();
  worksheet.getRow(filaActual).height = 22;
  filaActual++;

  const fila4 = worksheet.getRow(filaActual);
  fila4.getCell(6).value = 'FECHA:';
  fila4.getCell(7).value = fechaActual;
  aplicarEstiloCelda(fila4.getCell(6), { bold: true }, 'right');
  aplicarEstiloCelda(fila4.getCell(7), {}, 'left');
  filaActual++;

  // LÍNEA VACÍA
  filaActual++;

  // ENCABEZADOS DE COLUMNAS PRINCIPALES
  const encabezados = worksheet.getRow(filaActual);
  const encabezadoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  encabezados.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
  encabezados.font = { bold: true, size: 10 };
  encabezados.alignment = { horizontal: 'center', vertical: 'middle' };
  encabezados.height = 20;
  encabezados.eachCell((cell) => {
    cell.border = borderCompleto();
    cell.fill = encabezadoFill;
  });
  filaActual++;

  // LÍNEA VACÍA
  filaActual++;

  // Agrupar componentes por tipo
  const componentesPorTipo = agruparComponentesPorTipoParaExcel(datosResumen);

  // MATERIALES (G1)
  if (componentesPorTipo.material.length > 0) {
    const totalMateriales = componentesPorTipo.material.reduce((sum, c) => sum + c.valorTotal, 0);
    const filaG1 = worksheet.getRow(filaActual);
    const grupoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
    filaG1.values = ['G1', '', 'MATERIALES', '', '', '', totalMateriales];
    filaG1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    filaG1.alignment = { horizontal: 'left', vertical: 'middle' };
    filaG1.height = 22;
    filaG1.eachCell((cell) => {
      cell.border = borderCompleto();
      cell.fill = grupoFill;
    });
    filaG1.getCell(7).numFmt = '#,##0.00';
    filaActual++;

    // Subencabezados
    const subEnc = worksheet.getRow(filaActual);
    const subEncFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
    subEnc.font = { bold: true, size: 9 };
    subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
    subEnc.eachCell((cell) => {
      cell.border = borderCompleto();
      cell.fill = subEncFill;
    });
    filaActual++;

    // Items de materiales
    componentesPorTipo.material.forEach(comp => {
      const fila = worksheet.getRow(filaActual);
      fila.values = [
        comp.codigo,
        comp.clasificacion,
        comp.descripcion,
        comp.unidad,
        comp.cantidad,
        comp.precioUnitario,
        comp.valorTotal
      ];
      fila.alignment = { horizontal: 'left', vertical: 'middle' };
      fila.eachCell((cell, colNum) => {
        cell.border = borderCompleto();
        if (colNum >= 4) {
          cell.numFmt = '#,##0.0000';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        if (colNum === 6) {
          cell.numFmt = '#,##0.00';
        }
      });
      filaActual++;
    });

    // MANO DE OBRA (G2)
    if (componentesPorTipo.mano_obra.length > 0) {
      const totalMO = componentesPorTipo.mano_obra.reduce((sum, c) => sum + c.valorTotal, 0);
      const filaG2 = worksheet.getRow(filaActual);
      const grupoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
      filaG2.values = ['', '', 'MANO DE OBRA', '', '', '', totalMO];
      filaG2.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      filaG2.alignment = { horizontal: 'left', vertical: 'middle' };
      filaG2.height = 22;
      filaG2.eachCell((cell, colNum) => {
        cell.border = borderCompleto();
        if (colNum <= 6) {
          cell.fill = grupoFill;
        }
      });
      filaG2.getCell(6).numFmt = '#,##0.00';
      filaActual++;

      const subEnc = worksheet.getRow(filaActual);
      const subEncFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
      subEnc.font = { bold: true, size: 9 };
      subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
      subEnc.eachCell((cell, colNum) => {
        cell.border = borderCompleto();
        if (colNum <= 6) {
          cell.fill = subEncFill;
        }
      });
      filaActual++;

      componentesPorTipo.mano_obra.forEach(comp => {
        const fila = worksheet.getRow(filaActual);
        fila.values = [comp.codigo, comp.clasificacion, comp.descripcion, comp.unidad, comp.cantidad, comp.precioUnitario, comp.valorTotal];
        fila.alignment = { horizontal: 'left', vertical: 'middle' };
        fila.eachCell((cell, colNum) => {
          cell.border = borderCompleto();
          if (colNum >= 4) {
            cell.numFmt = '#,##0.0000';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNum === 6) {
            cell.numFmt = '#,##0.00';
          }
        });
        filaActual++;
      });
      filaActual++;
    }

    // EQUIPO (G3)
    if (componentesPorTipo.equipo.length > 0) {
      const totalEq = componentesPorTipo.equipo.reduce((sum, c) => sum + c.valorTotal, 0);
      const filaG3 = worksheet.getRow(filaActual);
      const grupoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
      filaG3.values = ['', '', 'EQUIPO', '', '', '', totalEq];
      filaG3.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      filaG3.alignment = { horizontal: 'left', vertical: 'middle' };
      filaG3.height = 22;
      filaG3.eachCell((cell, colNum) => {
        cell.border = borderCompleto();
        if (colNum <= 6) {
          cell.fill = grupoFill;
        }
      });
      filaG3.getCell(6).numFmt = '#,##0.00';
      filaActual++;

      const subEnc = worksheet.getRow(filaActual);
      const subEncFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
      subEnc.font = { bold: true, size: 9 };
      subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
      subEnc.eachCell((cell, colNum) => {
        cell.border = borderCompleto();
        if (colNum <= 6) {
          cell.fill = subEncFill;
        }
      });
      filaActual++;

      componentesPorTipo.equipo.forEach(comp => {
        const fila = worksheet.getRow(filaActual);
        fila.values = [comp.codigo, comp.clasificacion, comp.descripcion, comp.unidad, comp.cantidad, comp.precioUnitario, comp.valorTotal];
        fila.alignment = { horizontal: 'left', vertical: 'middle' };
        fila.eachCell((cell, colNum) => {
          cell.border = borderCompleto();
          if (colNum >= 4) {
            cell.numFmt = '#,##0.0000';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNum === 6) {
            cell.numFmt = '#,##0.00';
          }
        });
        filaActual++;
      });
      filaActual++;
    }

    // OTROS/TRANSPORTE (G4)
    if (componentesPorTipo.transporte.length > 0) {
      const totalTr = componentesPorTipo.transporte.reduce((sum, c) => sum + c.valorTotal, 0);
      const filaG4 = worksheet.getRow(filaActual);
      const grupoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
      filaG4.values = ['', '', 'OTROS', '', '', '', totalTr];
      filaG4.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      filaG4.alignment = { horizontal: 'left', vertical: 'middle' };
      filaG4.height = 22;
      filaG4.eachCell((cell, colNum) => {
        cell.border = borderCompleto();
        if (colNum <= 6) {
          cell.fill = grupoFill;
        }
      });
      filaG4.getCell(6).numFmt = '#,##0.00';
      filaActual++;

      const subEnc = worksheet.getRow(filaActual);
      const subEncFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
      subEnc.font = { bold: true, size: 9 };
      subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
      subEnc.eachCell((cell, colNum) => {
        cell.border = borderCompleto();
        if (colNum <= 6) {
          cell.fill = subEncFill;
        }
      });
      filaActual++;

      componentesPorTipo.transporte.forEach(comp => {
        const fila = worksheet.getRow(filaActual);
        fila.values = [comp.codigo, comp.clasificacion, comp.descripcion, comp.unidad, comp.cantidad, comp.precioUnitario, comp.valorTotal];
        fila.alignment = { horizontal: 'left', vertical: 'middle' };
        fila.eachCell((cell, colNum) => {
          cell.border = borderCompleto();
          if (colNum >= 4) {
            cell.numFmt = '#,##0.0000';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNum === 6) cell.numFmt = '#,##0.00';
        });
        filaActual++;
      });
      filaActual++;
    }

    // TOTAL FINAL
    filaActual++;
    const filaTotal = worksheet.getRow(filaActual);
    const totalFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    filaTotal.values = ['', '', '', '', '', 'VALOR TOTAL INSUMOS', datosResumen.valorTotal];
    filaTotal.font = { bold: true, size: 11 };
    filaTotal.alignment = { horizontal: 'right', vertical: 'middle' };
    filaTotal.height = 22;
    filaTotal.eachCell((cell) => {
      cell.border = borderCompleto();
    });
    filaTotal.getCell(7).numFmt = '#,##0.00';

    filaActual++;
  }
}


async function generarHojaDetallePorItemsExcel(workbook, datosResumen) {
  const worksheet = workbook.addWorksheet('Detalle por Items');

  const proyectoNombre = seleccionActual?.proyecto || 'FIRMA CONSTRUCTORA';
  const presupuestoNombre = seleccionActual?.presupuesto || 'PRESUPUESTO';
  const fechaActual = new Date().toLocaleDateString('es-CO');

  // Configurar anchos de columna
  worksheet.columns = [
    { key: 'codigo_item', width: 12 },
    { key: 'nombre_item', width: 40 },
    { key: 'capitulo', width: 20 },
    { key: 'codigo_comp', width: 12 },
    { key: 'nombre_comp', width: 45 },
    { key: 'tipo', width: 15 },
    { key: 'unidad', width: 10 },
    { key: 'cant_total', width: 12 },
    { key: 'ya_pedido', width: 12 },
    { key: 'excedente', width: 12 },
    { key: 'pendiente', width: 12 },
    { key: 'porcentaje', width: 12 },
    { key: 'precio_unit', width: 14 },
    { key: 'subtotal', width: 16 }
  ];

  let filaActual = 1;

  // ENCABEZADO PRINCIPAL
  worksheet.mergeCells(`A${filaActual}:N${filaActual}`);
  const celda1 = worksheet.getCell(`A${filaActual}`);
  celda1.value = proyectoNombre;
  celda1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  celda1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  celda1.alignment = { horizontal: 'center', vertical: 'middle' };
  celda1.border = borderCompleto();
  worksheet.getRow(filaActual).height = 25;
  filaActual++;

  // SUBTÍTULO
  worksheet.mergeCells(`A${filaActual}:N${filaActual}`);
  const celda2 = worksheet.getCell(`A${filaActual}`);
  celda2.value = 'DETALLE DE COMPONENTES POR ITEM';
  celda2.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  celda2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  celda2.alignment = { horizontal: 'center', vertical: 'middle' };
  celda2.border = borderCompleto();
  worksheet.getRow(filaActual).height = 22;
  filaActual++;

  // INFO FECHA
  const fila3 = worksheet.getRow(filaActual);
  fila3.getCell(13).value = 'FECHA:';
  fila3.getCell(14).value = fechaActual;
  aplicarEstiloCelda(fila3.getCell(13), { bold: true }, 'right');
  aplicarEstiloCelda(fila3.getCell(14), {}, 'left');
  filaActual++;

  // LÍNEA VACÍA
  filaActual++;

  // ENCABEZADOS DE COLUMNAS
  const encabezados = worksheet.getRow(filaActual);
  const encabezadoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  encabezados.values = [
    'COD. ITEM', 'NOMBRE ITEM', 'CAPITULO', 'COD. COMP', 'COMPONENTE',
    'TIPO', 'UND', 'CANT. TOTAL', 'YA PEDIDO', 'EXCEDENTE',
    'PENDIENTE', '%', 'PRECIO UNIT.', 'SUBTOTAL'
  ];
  encabezados.font = { bold: true, size: 9 };
  encabezados.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  encabezados.height = 30;
  encabezados.eachCell((cell) => {
    cell.border = borderCompleto();
    cell.fill = encabezadoFill;
  });
  filaActual++;

  // Agregar datos por item
  if (datosResumen.componentesPorItem && datosResumen.componentesPorItem.length > 0) {
    datosResumen.componentesPorItem.forEach((item, itemIdx) => {
      let primeraFilaItem = true;

      item.componentes.forEach((comp) => {
        const porcentaje = comp.porcentaje || 0;

        const fila = worksheet.getRow(filaActual);
        fila.values = [
          primeraFilaItem ? item.codigoItem : '',
          primeraFilaItem ? item.nombreItem : '',
          primeraFilaItem ? item.capitulo : '',
          '', // código componente (se puede agregar si está disponible)
          comp.nombre,
          comp.tipo.toUpperCase(),
          comp.unidad,
          comp.cantidadTotal,
          comp.yaPedido,
          comp.excedente || 0,
          comp.pendiente,
          porcentaje.toFixed(1) + '%',
          comp.precioUnitario,
          comp.subtotal
        ];

        // Estilo de la fila
        fila.alignment = { horizontal: 'left', vertical: 'middle' };
        fila.eachCell((cell, colNum) => {
          cell.border = borderLigero();

          // Alineación y formato numérico
          if (colNum >= 8 && colNum <= 11) {
            cell.numFmt = colNum === 10 ? '#,##0.0000' : '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNum === 12) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          if (colNum === 13) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNum === 14) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }

          // Colorear las primeras 3 columnas si es la primera fila del item
          if (primeraFilaItem && colNum <= 3) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            cell.font = { bold: true };
          }
        });

        // Resaltar excedentes
        if ((comp.excedente || 0) > 0) {
          fila.eachCell((cell) => {
            if (!cell.fill || cell.fill.fgColor?.argb !== 'FFF2F2F2') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5B4' } };
            }
          });
        }

        primeraFilaItem = false;
        filaActual++;
      });

      // Línea separadora entre items
      if (itemIdx < datosResumen.componentesPorItem.length - 1) {
        filaActual++;
      }
    });

    // TOTAL FINAL
    filaActual++;
    const filaTotal = worksheet.getRow(filaActual);
    const totalDetalleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    filaTotal.values = ['', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL:', datosResumen.valorTotal];
    filaTotal.font = { bold: true, size: 11 };
    filaTotal.alignment = { horizontal: 'right', vertical: 'middle' };
    filaTotal.height = 22;
    filaTotal.eachCell((cell, col) => {
      cell.border = borderCompleto();
      cell.fill = totalDetalleFill;
      if (col === 14) {
        cell.numFmt = '#,##0.00';
      }
    });
  } else {
    const fila = worksheet.getRow(filaActual);
    fila.values = ['No hay datos para mostrar'];
    worksheet.mergeCells(`A${filaActual}:N${filaActual}`);
    const celda = worksheet.getCell(`A${filaActual}`);

    celda.alignment = { horizontal: 'center', vertical: 'middle' };
    celda.font = { italic: true, color: { argb: 'FF757575' } };
    fila.height = 30;
  }
}

async function generarHojaHistorialPedidosExcel(workbook, pedidosHistorial = []) {
  const worksheet = workbook.addWorksheet('Historial de Pedidos');

  worksheet.columns = [
    { key: 'id_pedido', width: 12 },
    { key: 'fecha', width: 18 },
    { key: 'estado', width: 20 },
    { key: 'usuario', width: 28 },
    { key: 'capitulo', width: 22 },
    { key: 'codigo_item', width: 15 },
    { key: 'nombre_item', width: 30 },
    { key: 'componente', width: 40 },
    { key: 'tipo', width: 15 },
    { key: 'unidad', width: 10 },
    { key: 'cantidad', width: 12 },
    { key: 'precio_unit', width: 14 },
    { key: 'subtotal', width: 16 },
    { key: 'justificacion_detalle', width: 35 },
    { key: 'motivo_estado', width: 40 }
  ];

  let filaActual = 1;

  worksheet.mergeCells(`A${filaActual}:O${filaActual}`);

  const titulo = worksheet.getCell(`A${filaActual}`);
  titulo.value = 'Historial de Pedidos del Presupuesto';
  titulo.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF38598B' } };
  titulo.alignment = { horizontal: 'center', vertical: 'middle' };

  filaActual += 2;

  const encabezados = worksheet.getRow(filaActual);
  const encabezadoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  encabezados.values = [
    'ID Pedido', 'Fecha', 'Estado', 'Responsable', 'Capítulo',
    'Código Item', 'Nombre Item', 'Componente', 'Tipo', 'Unidad',
    'Cantidad', 'Precio Unit.', 'Subtotal', 'Justificación Detalle',
    'Motivo aprobación/rechazo'
  ];
  encabezados.font = { bold: true, size: 10 };
  encabezados.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  encabezados.height = 22;
  encabezados.eachCell((cell) => {
    cell.border = borderCompleto();
    cell.fill = encabezadoFill;
  });
  filaActual++;

  if (!Array.isArray(pedidosHistorial) || pedidosHistorial.length === 0) {
    worksheet.getRow(filaActual).values = ['Sin pedidos registrados'];
    worksheet.mergeCells(`A${filaActual}:O${filaActual}`);

    const celda = worksheet.getCell(`A${filaActual}`);
    celda.alignment = { horizontal: 'center', vertical: 'middle' };
    celda.font = { italic: true, color: { argb: 'FF757575' } };
    return;
  }

  pedidosHistorial.forEach((pedido, index) => {
    const estadoTexto = pedido.estado_descripcion || pedido.estado || 'N/A';
    const estadoColor = obtenerColorEstadoExcel(pedido.estado_color);
    const fechaTexto = formatearFechaCorta(pedido.fecha_pedido);

    if (!pedido.detalles || pedido.detalles.length === 0) {
      const fila = worksheet.getRow(filaActual);
      fila.values = [
        pedido.id_pedido,
        fechaTexto,
        estadoTexto,
        pedido.nombre_usuario || 'N/A',
        'Sin detalles',
        '',
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        '',
        pedido.observaciones || ''
      ];

      aplicarEstiloFilaHistorial(fila, estadoColor, false);
      filaActual++;
      return;
    }

    pedido.detalles.forEach((detalle) => {
      const fila = worksheet.getRow(filaActual);
      const esExcedente = parseInt(detalle.es_excedente, 10) === 1;
      const sinItemAsociado = !detalle.codigo_item && !detalle.nombre_item;

      const tieneMaterialExtra = !!(detalle.codigo_material_extra && detalle.nombre_material_extra);

      const capitulo = sinItemAsociado
        ? 'MATERIAL EXTRA'
        : (detalle.nombre_capitulo || 'N/A');

      const codigoItem = sinItemAsociado
        ? (tieneMaterialExtra ? detalle.codigo_material_extra : 'EXTRA')
        : (detalle.codigo_item || '');

      const nombreItem = sinItemAsociado
        ? (tieneMaterialExtra
          ? detalle.nombre_material_extra
          : 'MATERIAL EXTRA FUERA DE PRESUPUESTO')
        : (detalle.nombre_item || '');

      const descripcionComponente = sinItemAsociado
        ? (detalle.justificacion
          ? `Material extra: ${detalle.justificacion}`
          : 'Material extra sin descripción detallada')
        : (detalle.descripcion_componente || 'Sin descripción');

      const tipoComponente = sinItemAsociado
        ? 'MATERIAL EXTRA'
        : obtenerNombreTipoComponente(detalle.tipo_componente || 'material');

      fila.values = [
        pedido.id_pedido,
        fechaTexto,
        estadoTexto,
        pedido.nombre_usuario || 'N/A',
        capitulo,
        codigoItem,
        nombreItem,
        descripcionComponente,
        tipoComponente,
        detalle.unidad_componente || detalle.unidad_item || 'UND',
        detalle.cantidad || 0,
        detalle.precio_unitario || 0,
        detalle.subtotal || 0,
        detalle.justificacion || '',
        pedido.observaciones || ''
      ];

      aplicarEstiloFilaHistorial(fila, estadoColor, esExcedente);
      filaActual++;
    });

    if (index < pedidosHistorial.length - 1) {
      filaActual++;
    }
  });

  const totalFila = worksheet.getRow(filaActual + 1);
  totalFila.values = ['', '', '', '', '', '', '', '', '', 'TOTAL:', '', '', calcularTotalHistorial(pedidosHistorial), '', ''];

  totalFila.font = { bold: true };
  totalFila.alignment = { horizontal: 'right', vertical: 'middle' };
  totalFila.eachCell((cell) => {
    cell.border = borderCompleto();
  });
  totalFila.getCell(13).numFmt = '#,##0.00';
}

function aplicarEstiloFilaHistorial(fila, estadoColor, esExcedente) {
  fila.alignment = { vertical: 'middle' };
  fila.eachCell((cell, col) => {
    cell.border = borderLigero();
    if (col >= 11 && col <= 13) {
      cell.numFmt = col === 11 ? '#,##0.0000' : '#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
    if (col === 3 && estadoColor) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estadoColor } };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  if (esExcedente) {
    fila.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5B4' } };
    });
  }
}

function obtenerColorEstadoExcel(colorNombre = '') {
  const mapa = {
    success: 'FFC6EFCE',
    info: 'FFBDD7EE',
    warning: 'FFFFF2CC',
    danger: 'FFF8CBAD',
    primary: 'FFB4C6E7',
    secondary: 'FFE2E2E2',
    dark: 'FFBFBFBF'
  };
  return mapa[colorNombre] || 'FFE7E6E6';
}

function formatearFechaCorta(fecha) {
  if (!fecha) return 'N/A';
  try {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return fecha;
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  } catch (error) {
    return fecha;
  }
}

function calcularTotalHistorial(pedidosHistorial = []) {
  let total = 0;
  pedidosHistorial.forEach((pedido) => {
    const estado = String(pedido.estado || pedido.estado_descripcion || '').toLowerCase();
    const esAprobado = estado.includes('aprob');
    if (!esAprobado) {
      return;
    }
    if (Array.isArray(pedido.detalles)) {
      pedido.detalles.forEach((detalle) => {
        total += parseFloat(detalle.subtotal) || 0;
      });
    }
  });
  return total;
}

async function obtenerHistorialPedidos(presupuestoId) {
  if (!presupuestoId) return [];
  try {
    const formData = new FormData();
    formData.append('presupuesto_id', presupuestoId);
    const response = await fetch(API_PRESUPUESTOS + '?action=getPedidosByPresupuesto', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      return result.data || [];
    }
    console.warn('No se pudo obtener el historial de pedidos:', result.error);
    return [];
  } catch (error) {
    console.error('Error obteniendo historial de pedidos:', error);
    return [];
  }
}

function extraerExcedentesDesdeHistorial(pedidosHistorial = []) {
  const excedentes = [];
  pedidosHistorial.forEach((pedido) => {
    if (!Array.isArray(pedido.detalles)) {
      return;
    }

    pedido.detalles.forEach((detalle) => {
      if (parseInt(detalle.es_excedente, 10) !== 1) {
        return;
      }

      excedentes.push({
        id_item: detalle.id_item || null,
        id_componente: detalle.id_componente,
        cantidad_extra: detalle.cantidad,
        justificacion: detalle.justificacion || '',
        tipo_componente: detalle.tipo_componente,
        precio_unitario: detalle.precio_unitario
      });
    });
  });

  return excedentes;
}

function aplicarEstiloCelda(celda, font = {}, alignment = 'left') {
  celda.font = { ...font };
  celda.alignment = { horizontal: alignment, vertical: 'middle' };
  celda.border = borderCompleto();
}

function borderCompleto() {
  return {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
}

function borderLigero() {
  return {
    top: { style: 'hair', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
    left: { style: 'hair', color: { argb: 'FFCCCCCC' } },
    right: { style: 'hair', color: { argb: 'FFCCCCCC' } }
  };
}

function agruparComponentesPorTipoParaExcel(datosResumen) {
  const grupos = {
    material: [],
    mano_obra: [],
    equipo: [],
    transporte: []
  };

  const componentesUnicos = new Map();

  datosResumen.componentesPorItem.forEach(item => {
    item.componentes.forEach(comp => {
      const clave = `${comp.nombre}_${comp.tipo}_${comp.unidad}`;

      if (!componentesUnicos.has(clave)) {
        componentesUnicos.set(clave, {
          codigo: comp.codigo || generarCodigoComponente(comp),
          clasificacion: comp.clasificacion || obtenerClasificacionPorTipo(comp.tipo),
          descripcion: comp.nombre,
          unidad: comp.unidad,
          tipo: comp.tipo,
          cantidad: 0,
          precioUnitario: comp.precioUnitario,
          valorTotal: 0
        });
      }

      const existente = componentesUnicos.get(clave);
      existente.cantidad += comp.yaPedido;
      existente.valorTotal += comp.subtotal;
    });
  });

  componentesUnicos.forEach(comp => {
    let tipo = comp.tipo;
    if (tipo === 'otro') tipo = 'transporte';

    if (grupos[tipo]) {
      grupos[tipo].push(comp);
    } else {
      grupos.transporte.push(comp);
    }
  });

  Object.keys(grupos).forEach(key => {
    grupos[key].sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  return grupos;
}

function generarCodigoComponente(comp) {
  const prefijos = {
    material: '100',
    mano_obra: '200',
    equipo: '300',
    transporte: '440',
    otro: '440'
  };

  const prefijo = prefijos[comp.tipo] || '100';
  const hash = Math.abs(hashCode(comp.nombre)) % 1000;
  return `${prefijo}${hash.toString().padStart(3, '0')}`;
}

function obtenerClasificacionPorTipo(tipo) {
  const clasificaciones = {
    material: 'MATERIALES',
    mano_obra: 'MANO DE OBRA',
    equipo: 'EQUIPO',
    transporte: 'TRANSPORTE',
    otro: 'OTROS'
  };
  return clasificaciones[tipo] || 'OTROS';
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

window.generarHojaResumenInsumosExcel = generarHojaResumenInsumosExcel;
window.generarHojaDetallePorItemsExcel = generarHojaDetallePorItemsExcel;
window.generarHojaHistorialPedidosExcel = generarHojaHistorialPedidosExcel;
window.obtenerHistorialPedidos = obtenerHistorialPedidos;
window.extraerExcedentesDesdeHistorial = extraerExcedentesDesdeHistorial;

function buscarMaterialesAutocompletar() {
  const input = document.getElementById('buscarMaterial');
  const query = input.value.trim();
  const resultados = document.getElementById('resultadosBusqueda');

  // Limpiar timeout anterior
  if (busquedaMaterialTimeout) {
    clearTimeout(busquedaMaterialTimeout);
  }

  // Si la búsqueda es muy corta, ocultar resultados
  if (query.length < 2) {
    resultados.style.display = 'none';
    return;
  }

  // Debounce de 300ms
  busquedaMaterialTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `${API_PRESUPUESTOS}?action=buscarMateriales&query=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        mostrarResultadosBusqueda(data.data);
      } else {
        resultados.innerHTML = '<div class="list-group-item text-muted">No se encontraron materiales</div>';
        resultados.style.display = 'block';
      }
    } catch (error) {
      console.error('Error buscando materiales:', error);
      resultados.innerHTML = '<div class="list-group-item text-danger">Error en la búsqueda</div>';
      resultados.style.display = 'block';
    }
  }, 300);
}
function mostrarResultadosBusqueda(materiales) {
  const resultados = document.getElementById('resultadosBusqueda');
  let html = '';

  materiales.forEach(material => {
    html += `
            <button type="button" class="list-group-item list-group-item-action" 
                    onclick="seleccionarMaterial(${material.id_material})">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${material.cod_material}</strong> - ${material.nombre_material}
                        <br>
                        <small class="text-muted">${material.tipo_material} | ${material.unidad}</small>
                    </div>
                    <span class="badge bg-primary">$${parseFloat(material.precio_actual).toFixed(2)}</span>
                </div>
            </button>
        `;
  });

  resultados.innerHTML = html;
  resultados.style.display = 'block';
}

async function seleccionarMaterial(idMaterial) {
  try {
    const response = await fetch(
      `${API_PRESUPUESTOS}?action=getMaterialDetalle&id_material=${idMaterial}`
    );
    const data = await response.json();

    if (data.success) {
      materialSeleccionadoData = data.data;

      // Actualizar campos ocultos
      document.getElementById('idMaterialSeleccionado').value = data.data.id_material;

      // Actualizar input de búsqueda
      document.getElementById('buscarMaterial').value =
        `${data.data.cod_material} - ${data.data.nombre_material}`;

      // Ocultar resultados
      document.getElementById('resultadosBusqueda').style.display = 'none';

      // Mostrar vista previa
      document.getElementById('previewCodigo').textContent = data.data.cod_material;
      document.getElementById('previewDescripcion').textContent = data.data.nombre_material;
      document.getElementById('previewUnidad').textContent = data.data.unidad;
      document.getElementById('previewPrecio').textContent = parseFloat(data.data.precio_actual).toFixed(2);
      document.getElementById('previewTipo').textContent = data.data.tipo_material;
      document.getElementById('vistaPreviewMaterial').style.display = 'block';
    }
  } catch (error) {
    console.error('Error cargando detalles del material:', error);
    alert('Error al cargar los detalles del material');
  }
}

async function cargarCapitulosParaMaterialExtra() {
  const presupuestoId = seleccionActual?.datos?.presupuestoId;
  if (!presupuestoId) return;

  try {
    const formData = new FormData();
    formData.append('id_presupuesto', presupuestoId);

    const response = await fetch(API_PRESUPUESTOS + '?action=getCapitulosByPresupuesto', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      const select = document.getElementById('capituloMaterialExtra');
      select.innerHTML = '<option value="">Seleccionar capítulo...</option>';

      data.data.forEach(capitulo => {
        const option = document.createElement('option');
        option.value = capitulo.id_capitulo;
        option.textContent = `${capitulo.numero_ordinal}. ${capitulo.nombre_cap}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando capítulos:', error);
  }
}

async function cargarTodosMateriales() {
  const response = await fetch(`${API_PRESUPUESTOS}?action=getAllMateriales`);
  const data = await response.json();
  if (data.success) {
    const select = document.getElementById('selectMaterial');
    select.innerHTML = '<option value="">Seleccionar...</option>';
    data.data.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id_material;
      opt.textContent = `${m.cod_material} - ${m.nombre_material}`;
      opt.dataset.material = JSON.stringify(m);
      select.appendChild(opt);
    });
  }
}

// Cargar materiales extra del presupuesto desde la BD
async function cargarMaterialesExtraDesdeDB() {
  const presupuestoId = seleccionActual?.datos?.presupuestoId;
  if (!presupuestoId) return [];

  try {
    const response = await fetch(
      `${API_PRESUPUESTOS}?action=getMaterialesExtra&id_presupuesto=${presupuestoId}&_=${Date.now()}`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    if (data.success && data.data) {
      return data.data.map(extra => ({
        id_material: extra.id_material,
        id_componente: null,
        codigo: extra.cod_material,
        descripcion: extra.nombre_material,
        cantidad: parseFloat(extra.cantidad),
        unidad: extra.unidad,
        precio_unitario: parseFloat(extra.precio_unitario),
        tipo_componente: 'material',
        tipo_material: extra.tipo_material,
        id_capitulo: extra.id_capitulo,
        nombre_capitulo: extra.nombre_capitulo || 'N/A',
        justificacion: extra.justificacion,
        estado: extra.estado,
        fecha: extra.fecha_agregado,
        es_material_extra: true
      }));
    }
    return [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

function onMaterialSeleccionado() {
  const select = document.getElementById('selectMaterial');
  const opt = select.options[select.selectedIndex];
  if (!opt.value) {
    document.getElementById('vistaPreviewMaterial').style.display = 'none';
    return;
  }
  materialSeleccionadoData = JSON.parse(opt.dataset.material);
  document.getElementById('previewCodigo').textContent = materialSeleccionadoData.cod_material;
  document.getElementById('previewDescripcion').textContent = materialSeleccionadoData.nombre_material;
  document.getElementById('previewUnidad').textContent = materialSeleccionadoData.unidad;
  document.getElementById('previewPrecio').textContent = parseFloat(materialSeleccionadoData.precio_actual).toFixed(2);
  document.getElementById('previewTipo').textContent = materialSeleccionadoData.tipo_material;
  document.getElementById('vistaPreviewMaterial').style.display = 'block';
}
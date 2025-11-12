let proyectosData = [];
let itemsData = [];
let materialesExtra = [];
let pedidosFueraPresupuesto = [];
let seleccionActual = null;

document.addEventListener("DOMContentLoaded", function () {
  cargarProyectos();
  cargarUnidades();
  cargarTiposMaterial();
});

async function cargarProyectos() {
  try {
    const response = await fetch(API_PRESUPUESTOS + "?action=getProyectos");
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

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

      if (!result.success) {
        throw new Error(result.error);
      }

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
        datos: {
          proyectoId,
          presupuestoId,
          capituloId: null,
          presupuesto,
        },
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

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "No se pudieron cargar los capítulos");
    }
  } catch (error) {
    console.error("Error cargando capítulos:", error);
    throw error;
  }
}

async function cargarItemsPresupuesto(presupuestoId, capituloId = null) {
  try {
    const items = await obtenerItemsReales(presupuestoId, capituloId);
    return items;
  } catch (error) {
    console.error("Error cargando items:", error);
    mostrarErrorItems();
    return [];
  }
}

async function obtenerItemsReales(presupuestoId, capituloId = null) {
  try {
    const formData = new FormData();
    formData.append("presupuesto_id", presupuestoId);
    if (capituloId) {
      formData.append("capitulo_id", capituloId);
    }

    const response = await fetch(
      API_PRESUPUESTOS + "?action=getItemsByPresupuesto",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor");
    }

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
        pedido: parseInt(item.pedido) || 0,
        subtotal:
          (parseFloat(item.cantidad) || 0) *
          (parseFloat(item.precio_unitario) || 0),
        componentes: item.componentes || [],
        id_det_presupuesto: item.id_det_presupuesto,
        disponible:
          parseFloat(item.disponible) || parseFloat(item.cantidad) || 0,
      }));
    } else {
      throw new Error(result.error || "No se pudieron cargar los items");
    }
  } catch (error) {
    console.error("Error cargando items reales:", error);
    throw error;
  }
}

function mostrarErrorItems() {
  const container = document.getElementById("materialesList");
  container.innerHTML = `
    <div class="text-center text-danger py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="mt-3">Error al cargar los items del presupuesto</p>
      <button class="btn btn-warning" onclick="reintentarCargaItems()">
        Reintentar
      </button>
    </div>
  `;
}

function reintentarCargaItems() {
  const presupuestoId = document.getElementById("selectPresupuesto").value;
  if (presupuestoId) {
    cargarItems();
  }
}

function mostrarItemsConComponentes(items) {
  const container = document.getElementById("materialesList");

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <div class="spinner-border text-muted" role="status"></div>
        <p class="mt-3">No hay items en este presupuesto/capítulo</p>
      </div>
    `;
    document.getElementById("contadorMateriales").textContent = "0 items";
    return;
  }

  let html = "";

  items.forEach((item) => {
    const disponible = item.disponible || item.cantidad - (item.pedido || 0);
    const porcentajeUsado =
      item.cantidad > 0 ? ((item.pedido || 0) / item.cantidad) * 100 : 0;
    const { colorClass, colorText } = obtenerColorProgreso(porcentajeUsado);

    const buttonClass = (item.pedido || 0) > 0 ? "btn-warning" : "btn-primary";
    const buttonText =
      (item.pedido || 0) > 0 ? "En carrito" : "Agregar al carrito";
    const subtotal = ((item.pedido || 0) * item.precio_unitario).toFixed(2);

    // Verificar si ya existe un pedido extra para este item
    const tienePedidoExtra = pedidosFueraPresupuesto.some(
      (pedido) => pedido.id_item === item.id_item
    );
    const mostrarBotonPedidoExtra = porcentajeUsado >= 100 || tienePedidoExtra;

    const componentesPorTipo = organizarComponentesPorTipo(item.componentes);

    html += `
      <div class="card mb-3 item-presupuesto" data-item-id="${
        item.id_item
      }" data-capitulo="${item.id_capitulo}">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h6 class="mb-0 text-primary">${item.codigo_item} - ${
      item.nombre_item
    }</h6>
          <div>
            <span class="badge bg-info">${item.unidad}</span>
            <span class="badge ${colorClass} ms-1">${colorText}</span>
            <button class="btn btn-sm btn-outline-primary ms-2" onclick="toggleDesglose(${
              item.id_item
            })">
              Desglose
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-4">
              <strong>Capítulo:</strong> ${item.nombre_capitulo}
            </div>
            <div class="col-md-4">
              <strong>Precio Unitario:</strong> $${formatCurrency(
                item.precio_unitario
              )}
            </div>
            <div class="col-md-4">
              <strong>Subtotal:</strong> $${formatCurrency(item.subtotal)}
            </div>
          </div>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted">Progreso del pedido</small>
              <small class="text-muted">${Math.round(
                porcentajeUsado
              )}% usado</small>
            </div>
            <div class="progress" style="height: 8px;">
              <div class="progress-bar ${colorClass}" role="progressbar" 
                   style="width: ${Math.min(porcentajeUsado, 100)}%" 
                   aria-valuenow="${porcentajeUsado}" aria-valuemin="0" aria-valuemax="100">
              </div>
            </div>
            <div class="d-flex justify-content-between mt-1">
              <small>Pedido: ${item.pedido || 0} ${item.unidad}</small>
              <small>Presupuestado: ${item.cantidad} ${item.unidad}</small>
            </div>
          </div>
          
          <div class="row align-items-center mb-3">
            <div class="col-md-8">
              <div class="input-group input-group-sm">
                <input type="number" class="form-control cantidad-input" 
                       value="${item.pedido || 0}" 
                       min="0" max="${item.cantidad}"
                       data-item-id="${item.id_item}"
                       onchange="actualizarCantidadItem(${
                         item.id_item
                       }, this.value)">
                <span class="input-group-text">/ ${item.cantidad}</span>
                <button class="btn ${buttonClass} btn-sm" onclick="agregarItemAlCarrito(${
      item.id_item
    })">
                  ${buttonText}
                </button>
              </div>
            </div>
            <div class="col-md-4 text-end">
              <div class="mt-1">
                <small class="text-info">Subtotal: $<span class="subtotal">${subtotal}</span></small>
              </div>
              <!-- EL BOTÓN "PEDIR MÁS" SE CREARÁ DINÁMICAMENTE EN actualizarInterfazItem -->
            </div>
          </div>
          
          <div id="desglose-${
            item.id_item
          }" class="desglose-componentes" style="display: none;">
            <h6 class="text-success mb-3">Composición del Ítem (APU):</h6>
            ${generarDesgloseComponentes(componentesPorTipo)}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  document.getElementById(
    "contadorMateriales"
  ).textContent = `${items.length} items`;

  items.forEach((item) => {
    actualizarInterfazItem(item.id_item);
  });
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

function generarDesgloseComponentes(componentesPorTipo) {
  let html = "";

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

  return html;
}

function formatCurrency(amount) {
  return parseFloat(amount || 0)
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

function toggleDesglose(itemId) {
  const desglose = document.getElementById(`desglose-${itemId}`);
  const button = document.querySelector(
    `[onclick="toggleDesglose(${itemId})"]`
  );

  if (desglose.style.display === "none") {
    desglose.style.display = "block";
    button.textContent = "Ocultar";
  } else {
    desglose.style.display = "none";
    button.textContent = "Desglose";
  }
}

function actualizarCantidadItem(itemId, cantidad) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (item) {
    const cantidadNumerica = parseInt(cantidad) || 0;

    // No permitir cantidades mayores al presupuestado
    if (cantidadNumerica > item.cantidad) {
      alert(
        `No puede pedir más de ${item.cantidad} ${item.unidad} en el pedido normal. Use el botón "Pedir más" para solicitar cantidades adicionales.`
      );
      item.pedido = item.cantidad;
    } else {
      item.pedido = cantidadNumerica;
    }

    actualizarInterfazItem(itemId);
    actualizarEstadisticas();
    actualizarCarrito();
  }
}

function actualizarInterfazItem(itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (!item) return;

  const card = document.querySelector(`[data-item-id="${itemId}"]`);
  if (card) {
    const subtotalElement = card.querySelector(".subtotal");
    subtotalElement.textContent = (item.pedido * item.precio_unitario).toFixed(
      2
    );

    const input = card.querySelector(".cantidad-input");
    input.value = item.pedido;

    const botonAgregarCarrito = card.querySelector(".input-group .btn-sm");
    if (botonAgregarCarrito) {
      if (item.pedido > 0) {
        botonAgregarCarrito.classList.remove("btn-primary");
        botonAgregarCarrito.classList.add("btn-warning");
        botonAgregarCarrito.textContent = "En carrito";
      } else {
        botonAgregarCarrito.classList.remove("btn-warning");
        botonAgregarCarrito.classList.add("btn-primary");
        botonAgregarCarrito.textContent = "Agregar al carrito";
      }
    }

    const porcentajeUsado =
      item.cantidad > 0 ? (item.pedido / item.cantidad) * 100 : 0;
    const { colorClass, colorText } = obtenerColorProgreso(porcentajeUsado);

    const progressBar = card.querySelector(".progress-bar");
    const badge = card.querySelector(
      ".badge.bg-success, .badge.bg-warning, .badge.bg-danger, .badge.bg-secondary, .badge.bg-dark"
    );
    const porcentajeText = card.querySelector(".text-muted:last-child");

    if (progressBar) {
      progressBar.className = `progress-bar ${colorClass}`;
      progressBar.style.width = `${Math.min(porcentajeUsado, 100)}%`;
    }
    if (badge) {
      badge.className = `badge ${colorClass} ms-1`;
      badge.textContent = colorText;
    }
    if (porcentajeText) {
      porcentajeText.textContent = `${Math.round(porcentajeUsado)}% usado`;
    }

    const cantidades = card.querySelectorAll("small");
    cantidades.forEach((small) => {
      if (small.textContent.includes("Pedido:")) {
        small.textContent = `Pedido: ${item.pedido} ${item.unidad}`;
      }
    });

    const tienePedidoExtra = pedidosFueraPresupuesto.some(
      (pedido) => pedido.id_item === item.id_item
    );
    const mostrarBotonPedidoExtra = porcentajeUsado >= 100 || tienePedidoExtra;

    const botonContainer = card.querySelector(".col-md-4.text-end");
    let botonPedirMas = botonContainer.querySelector(".btn-outline-warning");

    if (mostrarBotonPedidoExtra) {
      if (!botonPedirMas) {
        botonPedirMas = document.createElement("button");
        botonPedirMas.className = "btn btn-sm btn-outline-warning mt-1";
        botonPedirMas.textContent = "Pedir más";
        botonPedirMas.onclick = function () {
          solicitarPedidoExtra(itemId);
        };
        botonContainer.appendChild(botonPedirMas);
      }
    } else {
      if (botonPedirMas) {
        botonPedirMas.remove();
      }
    }
  }
}

function agregarItemAlCarrito(itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (item) {
    item.pedido = item.cantidad;
    actualizarCantidadItem(itemId, item.cantidad);
  }
}

function solicitarPedidoExtra(itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (!item) return;

  // Verificar si ya existe un pedido extra para este item
  const pedidoExistente = pedidosFueraPresupuesto.find(
    (pedido) => pedido.id_item === item.id_item
  );

  if (pedidoExistente) {
    if (
      confirm(
        `Ya existe un pedido adicional de ${pedidoExistente.cantidad_extra} ${item.unidad} para este item. ¿Desea modificarlo?`
      )
    ) {
      eliminarPedidoExtra(pedidosFueraPresupuesto.indexOf(pedidoExistente));
    } else {
      return;
    }
  }

  const cantidadExtra = prompt(
    `¿Cuántas ${item.unidad} adicionales desea solicitar para ${item.codigo_item}?`,
    "1"
  );
  if (cantidadExtra && !isNaN(cantidadExtra) && parseInt(cantidadExtra) > 0) {
    const justificacion = prompt(
      "Justifique por qué necesita esta cantidad adicional:",
      ""
    );

    if (justificacion) {
      const pedidoExtra = {
        id_item: item.id_item,
        codigo_item: item.codigo_item,
        nombre_item: item.nombre_item,
        unidad: item.unidad,
        cantidad_presupuestada: item.cantidad,
        cantidad_solicitada: parseInt(cantidadExtra),
        cantidad_extra: parseInt(cantidadExtra),
        precio_unitario: item.precio_unitario,
        justificacion: justificacion,
        estado: "pendiente",
        fecha: new Date().toISOString().split("T")[0],
      };

      pedidosFueraPresupuesto.push(pedidoExtra);
      mostrarPedidosExtra();
      actualizarEstadisticas();
      actualizarInterfazItem(itemId);

      alert("Pedido adicional solicitado. Estará pendiente de aprobación.");
    }
  }
}

function mostrarPedidosExtra() {
  const container = document.getElementById("materialesExtraList");
  const cardExtras = document.getElementById("cardExtras");

  if (pedidosFueraPresupuesto.length === 0 && materialesExtra.length === 0) {
    cardExtras.style.display = "none";
    return;
  }

  cardExtras.style.display = "block";

  let html = "";

  if (pedidosFueraPresupuesto.length > 0) {
    html += `<h6 class="text-warning mb-3">Pedidos Fuera de Presupuesto</h6>`;

    pedidosFueraPresupuesto.forEach((pedido, index) => {
      html += `
        <div class="card mb-2 border-warning">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-5">
                <strong class="text-warning">${pedido.codigo_item}</strong>
                <p class="mb-0 small">${pedido.nombre_item}</p>
                <small class="text-muted">Justificación: ${
                  pedido.justificacion
                }</small>
              </div>
              <div class="col-md-3">
                <span class="badge bg-warning">Por aprobar</span>
                <div class="mt-1">
                  <small>+${pedido.cantidad_extra} ${pedido.unidad} (Total: ${
        pedido.cantidad_solicitada
      })</small>
                </div>
              </div>
              <div class="col-md-2">
                <small>$${formatCurrency(pedido.precio_unitario)}</small>
              </div>
              <div class="col-md-2 text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarPedidoExtra(${index})">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  if (materialesExtra.length > 0) {
    html += `<h6 class="text-info mb-3 mt-4">Materiales Extra</h6>`;

    materialesExtra.forEach((material, index) => {
      html += `
        <div class="card mb-2">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-5">
                <strong class="text-info">${material.codigo}</strong>
                <p class="mb-0 small">${material.descripcion}</p>
                <small class="text-muted">Justificación: ${
                  material.justificacion
                }</small>
              </div>
              <div class="col-md-3">
                <span class="badge bg-info">Por aprobar</span>
                <div class="mt-1">
                  <small>${material.cantidad} ${material.unidad}</small>
                </div>
              </div>
              <div class="col-md-2">
                <small>$${material.precio.toFixed(2)}</small>
              </div>
              <div class="col-md-2 text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarMaterialExtra(${index})">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

function eliminarPedidoExtra(index) {
  if (confirm("¿Está seguro de cancelar este pedido adicional?")) {
    const pedidoEliminado = pedidosFueraPresupuesto[index];
    pedidosFueraPresupuesto.splice(index, 1);
    mostrarPedidosExtra();
    actualizarEstadisticas();

    if (pedidoEliminado && pedidoEliminado.id_item) {
      actualizarInterfazItem(pedidoEliminado.id_item);
    }
  }
}

function actualizarCarrito() {
  const itemsEnCarrito = itemsData.filter((m) => (m.pedido || 0) > 0);
  const container = document.getElementById("carritoList");
  const cardCarrito = document.getElementById("cardCarrito");

  if (
    itemsEnCarrito.length === 0 &&
    pedidosFueraPresupuesto.length === 0 &&
    materialesExtra.length === 0
  ) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <div class="spinner-border text-muted" role="status"></div>
        <p class="mt-3">Agregue items del presupuesto para verlos aquí</p>
      </div>
    `;
    cardCarrito.style.display = "none";
    return;
  }

  cardCarrito.style.display = "block";

  let html = "";
  let totalGeneral = 0;

  itemsEnCarrito.forEach((item) => {
    const subtotal = item.pedido * item.precio_unitario;
    totalGeneral += subtotal;

    html += `
      <div class="card mb-2">
        <div class="card-body py-2">
          <div class="row align-items-center">
            <div class="col-md-4">
              <strong class="text-primary">${item.codigo_item}</strong>
              <p class="mb-0 small">${item.nombre_item}</p>
              <small class="text-muted">${item.nombre_capitulo} | ${
      item.unidad
    }</small>
            </div>
            <div class="col-md-2 text-center">
              <span class="badge bg-success">${item.pedido} ${
      item.unidad
    }</span>
            </div>
            <div class="col-md-2">
              <small>$${formatCurrency(item.precio_unitario)} c/u</small>
            </div>
            <div class="col-md-2">
              <strong class="text-success">$${formatCurrency(subtotal)}</strong>
            </div>
            <div class="col-md-2 text-end">
              <button class="btn btn-sm btn-outline-danger" onclick="quitarItemDelCarrito(${
                item.id_item
              })">
                Quitar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  if (pedidosFueraPresupuesto.length > 0) {
    html += `
      <div class="mt-3 pt-3 border-top">
        <h6 class="text-warning">Pedidos Adicionales (Pendientes)</h6>
    `;

    pedidosFueraPresupuesto.forEach((pedido, index) => {
      html += `
        <div class="card mb-2 border-warning">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-4">
                <strong class="text-warning">${
                  pedido.codigo_item
                } (+EXTRA)</strong>
                <p class="mb-0 small">${pedido.nombre_item}</p>
                <small class="text-muted">${
                  pedido.unidad
                } | Pendiente de aprobación</small>
              </div>
              <div class="col-md-2 text-center">
                <span class="badge bg-warning">+${pedido.cantidad_extra}</span>
              </div>
              <div class="col-md-2">
                <small>$${formatCurrency(pedido.precio_unitario)} c/u</small>
              </div>
              <div class="col-md-2">
                <strong class="text-warning">Pendiente</strong>
              </div>
              <div class="col-md-2 text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarPedidoExtra(${index})">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `
    <div class="mt-3 pt-3 border-top">
      <div class="row">
        <div class="col-md-8">
          <strong class="text-dark">TOTAL DEL CARRITO:</strong>
        </div>
        <div class="col-md-4 text-end">
          <h5 class="text-success">$${formatCurrency(totalGeneral)}</h5>
        </div>
      </div>
      ${
        pedidosFueraPresupuesto.length > 0
          ? `
      <div class="row mt-2">
        <div class="col-md-8">
          <small class="text-warning">Los pedidos adicionales requieren aprobación</small>
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;

  container.innerHTML = html;
  document.getElementById(
    "contadorCarrito"
  ).textContent = `${itemsEnCarrito.length} items`;
}

function quitarItemDelCarrito(itemId) {
  const item = itemsData.find((m) => m.id_item == itemId);
  if (item) {
    item.pedido = 0;
    actualizarCantidadItem(itemId, 0);
  }
}

function actualizarEstadisticas() {
  const itemsSeleccionados = itemsData.filter((m) => (m.pedido || 0) > 0);
  const totalItems = itemsSeleccionados.reduce(
    (sum, m) => sum + (m.pedido || 0),
    0
  );
  const valorTotal = itemsSeleccionados.reduce(
    (sum, m) => sum + (m.pedido || 0) * m.precio_unitario,
    0
  );

  document.getElementById("statSeleccionados").textContent =
    itemsSeleccionados.length;
  document.getElementById("statTotalItems").textContent = totalItems;
  document.getElementById(
    "statValorTotal"
  ).textContent = `$${valorTotal.toFixed(2)}`;
  document.getElementById("statExtras").textContent =
    materialesExtra.length + pedidosFueraPresupuesto.length;

  document.getElementById("btnConfirmarPedido").disabled =
    itemsSeleccionados.length === 0 &&
    materialesExtra.length === 0 &&
    pedidosFueraPresupuesto.length === 0;
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
    const response = await fetch(API_PRESUPUESTOS + "?action=getTiposMaterial");
    const result = await response.json();

    if (result.success) {
      const filterTipo = document.getElementById("filterTipo");
      result.data.forEach((tipo) => {
        const option = document.createElement("option");
        option.value = tipo.id_tipo_material;
        option.textContent = tipo.desc_tipo;
        filterTipo.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error cargando tipos de material:", error);
  }
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

function resetarGestion() {
  itemsData = [];
  materialesExtra = [];
  pedidosFueraPresupuesto = [];
  document.getElementById("materialesList").innerHTML = `
    <div class="text-center text-muted py-5">
      <div class="spinner-border text-muted" role="status"></div>
      <p class="mt-3">Seleccione un proyecto y presupuesto para ver los items</p>
    </div>
  `;
  document.getElementById("carritoList").innerHTML = `
    <div class="text-center text-muted py-4">
      <div class="spinner-border text-muted" role="status"></div>
      <p class="mt-3">Agregue items del presupuesto para verlos aquí</p>
    </div>
  `;
  document.getElementById("currentSelectionInfo").textContent =
    "Seleccione un proyecto y presupuesto para comenzar";
  document.getElementById("btnAgregarExtra").disabled = true;
  document.getElementById("btnConfirmarPedido").disabled = true;
  document.getElementById("filterCapitulo").disabled = true;
  document.getElementById("cardCarrito").style.display = "none";
  document.getElementById("cardExtras").style.display = "none";
  actualizarEstadisticas();
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
  mostrarPedidosExtra();
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
    mostrarPedidosExtra();
    actualizarEstadisticas();
  }
}

function filtrarMateriales() {
  const filtroEstado = document.getElementById("filterEstado").value;
  const filtroCapitulo = document.getElementById("filterCapitulo").value;
  const searchTerm = document
    .getElementById("searchMaterial")
    .value.toLowerCase();

  const itemsFiltrados = itemsData.filter((item) => {
    const coincideEstado =
      !filtroEstado ||
      (filtroEstado === "disponible" &&
        (item.disponible || item.cantidad - (item.pedido || 0) > 0)) ||
      (filtroEstado === "agotado" &&
        (item.disponible || item.cantidad - (item.pedido || 0) <= 0)) ||
      (filtroEstado === "pedido" && (item.pedido || 0) > 0);

    const coincideCapitulo =
      !filtroCapitulo || item.id_capitulo == filtroCapitulo;
    const coincideBusqueda =
      !searchTerm ||
      item.codigo_item.toLowerCase().includes(searchTerm) ||
      item.nombre_item.toLowerCase().includes(searchTerm);

    return coincideEstado && coincideCapitulo && coincideBusqueda;
  });

  mostrarItemsConComponentes(itemsFiltrados);
}

async function confirmarPedido() {
  const itemsPedido = itemsData.filter((m) => (m.pedido || 0) > 0);

  if (
    itemsPedido.length === 0 &&
    materialesExtra.length === 0 &&
    pedidosFueraPresupuesto.length === 0
  ) {
    alert("No hay items seleccionados para el pedido");
    return;
  }

  if (confirm("¿Está seguro de confirmar este pedido?")) {
    try {
      const pedidoData = {
        seleccionActual,
        items: itemsPedido,
        materialesExtra,
        pedidosFueraPresupuesto,
        total: itemsPedido.reduce(
          (sum, m) => sum + (m.pedido || 0) * m.precio_unitario,
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
        resetarGestion();
      } else {
        alert("Error al guardar el pedido: " + result.error);
      }
    } catch (error) {
      console.error("Error confirmando pedido:", error);
      alert("Error al confirmar el pedido");
    }
  }
}

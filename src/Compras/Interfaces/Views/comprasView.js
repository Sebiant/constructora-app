let pedidos = [];
let pedidoSeleccionado = null;
let provedores = [];
let totalCompraTouched = false;
let compras = [];

function qs(id) {
  return document.getElementById(id);
}

function getFiltrosCompras() {
  return {
    proyecto: qs('filterProyectoCompras')?.value || '',
    busqueda: qs('searchCompras')?.value?.trim?.() || '',
    fechaDesde: qs('fechaDesdeCompras')?.value || '',
    fechaHasta: qs('fechaHastaCompras')?.value || '',
  };
}

async function cargarCompras() {
  const tbody = qs('tablaCompras');
  if (!tbody) return;

  const filtros = getFiltrosCompras();
  const params = new URLSearchParams();
  params.set('action', 'getCompras');
  if (filtros.proyecto) params.set('proyecto', filtros.proyecto);
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
  if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);

  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Cargando historial...</td></tr>';

  const data = await apiGet(`?${params.toString()}`);
  compras = Array.isArray(data) ? data : [];
  renderTablaCompras();
}

function renderTablaCompras() {
  const tbody = qs('tablaCompras');
  if (!tbody) return;

  if (!compras.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay compras para los filtros seleccionados.</td></tr>';
    return;
  }

  tbody.innerHTML = compras
    .map((c) => {
      const fecha = c.fecha_compra ? new Date(c.fecha_compra).toLocaleString('es-CO') : '-';
      return `
        <tr>
          <td>${escapeHtml(c.id_compra)}</td>
          <td>${escapeHtml(c.id_pedido)}</td>
          <td>${escapeHtml(fecha)}</td>
          <td>${escapeHtml(c.nombre_proyecto || '')}</td>
          <td>${escapeHtml(c.nombre_provedor || '')}</td>
          <td class="text-end">$${formatMoney(c.total)}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary" onclick="verDetalleCompra(${Number(c.id_compra)})">
              <i class="bi bi-eye"></i> Ver
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

async function verDetalleCompra(idCompra) {
  try {
    qs('detalleCompraId').textContent = String(idCompra);
    qs('detalleCompraContenido').innerHTML = '<div class="text-center text-muted py-3"><div class="spinner-border" role="status"></div><div class="mt-2">Cargando...</div></div>';

    const data = await apiGet(`?action=getCompraDetalle&id_compra=${encodeURIComponent(idCompra)}`);

    const fecha = data.fecha_compra ? new Date(data.fecha_compra).toLocaleString('es-CO') : '-';
    const detalles = Array.isArray(data.detalles) ? data.detalles : [];
    const filas = detalles
      .map((d) => `
        <tr>
          <td>
            <div class="fw-semibold">${escapeHtml(d.descripcion)}</div>
            <div class="text-muted small">Proveedor: ${escapeHtml(d.nombre_provedor || '—')}</div>
          </td>
          <td class="text-end">${escapeHtml(Number(d.cantidad || 0).toFixed(4))} ${escapeHtml(d.unidad || '')}</td>
          <td class="text-end">$${formatMoney(d.precio_unitario)}</td>
          <td class="text-end fw-bold">$${formatMoney(d.subtotal)}</td>
        </tr>
      `)
      .join('');

    qs('detalleCompraContenido').innerHTML = `
      <div class="row g-2 mb-2">
        <div class="col-md-3"><div class="text-muted small">Compra</div><div class="fw-bold">#${escapeHtml(data.id_compra)}</div></div>
        <div class="col-md-3"><div class="text-muted small">Pedido</div><div class="fw-bold">#${escapeHtml(data.id_pedido)}</div></div>
        <div class="col-md-3"><div class="text-muted small">Fecha</div><div class="fw-bold">${escapeHtml(fecha)}</div></div>
        <div class="col-md-3"><div class="text-muted small">Total</div><div class="fw-bold">$${formatMoney(data.total)}</div></div>
      </div>
      <div class="mb-2">
        <div class="text-muted small">Proyecto</div>
        <div class="fw-bold">${escapeHtml(data.nombre_proyecto || '')}</div>
      </div>
      ${data.numero_factura ? `<div class="mb-2"><span class="text-muted small">Factura:</span> <strong>${escapeHtml(data.numero_factura)}</strong></div>` : ''}
      ${data.observaciones ? `<div class="mb-2"><div class="text-muted small">Observaciones</div><div>${escapeHtml(data.observaciones)}</div></div>` : ''}
      <div class="table-responsive" style="max-height: 420px; overflow:auto;">
        <table class="table table-sm table-hover">
          <thead class="table-light" style="position: sticky; top: 0; z-index: 1;">
            <tr>
              <th>Ítem / Proveedor</th>
              <th class="text-end">Cantidad</th>
              <th class="text-end">Vr. Unit.</th>
              <th class="text-end">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${filas || '<tr><td colspan="4" class="text-muted">Sin detalle.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    const modalEl = qs('modalDetalleCompra');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    }
  } catch (e) {
    console.error(e);
    qs('detalleCompraContenido').innerHTML = `<div class="alert alert-danger">${escapeHtml(e.message)}</div>`;
  }
}

function autollenarTotalCompra() {
  const el = qs('totalCompra');
  if (!el) return;
  if (totalCompraTouched) return;

  const totalPedido = Number(pedidoSeleccionado?.total || 0);
  el.value = totalPedido ? totalPedido.toFixed(2) : '';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(val) {
  const n = Number(val || 0);
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoney(val) {
  const n = Number(val || 0);
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function onGuardarCompra(e) {
  e.preventDefault();
  console.log('Iniciando guardado de compra...');

  const numeroFactura = qs('numeroFactura').value.trim();
  if (!numeroFactura) {
    alert('El número de factura es obligatorio');
    qs('numeroFactura').focus();
    return;
  }

  // Recopilar información de items con sus proveedores asignados
  const itemsConProveedor = [];
  const cards = document.querySelectorAll('.item-proveedor-card');
  console.log('Items encontrados:', cards.length);
  
  cards.forEach(card => {
    const idDetPedido = card.dataset.idDetPedido;
    const proveedorSelect = card.querySelector('.proveedor-item-select');
    const idProveedor = proveedorSelect.value;
    
    console.log('Item:', idDetPedido, 'Proveedor:', idProveedor);
    
    if (!idProveedor) {
      // Resaltar el item que falta proveedor
      card.classList.add('border-danger', 'bg-light');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      proveedorSelect.focus();
      alert('Todos los items deben tener un proveedor asignado');
      return;
    }
    
    itemsConProveedor.push({
      id_det_pedido: idDetPedido,
      id_provedor: idProveedor
    });
  });

  if (itemsConProveedor.length === 0) {
    alert('No hay items para procesar');
    return;
  }

  const payload = {
    id_pedido: qs('idPedido').value,
    numero_factura: numeroFactura,
    total: qs('totalCompra').value,
    observaciones: qs('observaciones').value.trim(),
    items: itemsConProveedor
  };

  console.log('Payload a enviar:', payload);

  // Mostrar estado de carga
  const btnGuardar = qs('btnGuardarCompra');
  const originalText = btnGuardar.innerHTML;
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  btnGuardar.className = 'btn btn-warning w-100';

  try {
    const response = await apiPost('guardarCompra', payload);
    console.log('Respuesta del servidor:', response);
    alert('Compra registrada exitosamente');
    limpiarSeleccionPedido();
    cargarCompras(); // Recargar la tabla de compras
  } catch (error) {
    console.error('Error al guardar compra:', error);
    alert('Error al registrar compra: ' + error.message);
  } finally {
    // Restaurar estado del botón
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = originalText;
    btnGuardar.className = 'btn btn-success w-100';
    actualizarTotalCompra(); // Actualizar estado del botón
  }
}

async function apiGet(path) {
  const res = await fetch(`${API_COMPRAS}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const txt = await res.text();
  let json;
  try {
    json = JSON.parse(txt);
  } catch (e) {
    console.error('Respuesta no JSON:', txt);
    throw new Error('Respuesta inválida del servidor');
  }
  if (!json.success) throw new Error(json.error || 'Error');
  return json.data;
}

async function apiPost(action, payload) {
  const res = await fetch(`${API_COMPRAS}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const txt = await res.text();
  let json;
  try {
    json = JSON.parse(txt);
  } catch (e) {
    console.error('Respuesta no JSON:', txt);
    throw new Error('Respuesta inválida del servidor');
  }
  if (!json.success) throw new Error(json.error || 'Error');
  return json;
}

async function cargarProyectos() {
  const data = await apiGet('?action=getProyectos');
  const sel = qs('filterProyecto');
  sel.innerHTML = '<option value="">Todos</option>';
  const selCompras = qs('filterProyectoCompras');
  if (selCompras) selCompras.innerHTML = '<option value="">Todos</option>';
  data.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id_proyecto;
    opt.textContent = p.nombre;
    sel.appendChild(opt);

    if (selCompras) {
      const opt2 = document.createElement('option');
      opt2.value = p.id_proyecto;
      opt2.textContent = p.nombre;
      selCompras.appendChild(opt2);
    }
  });
}

async function cargarProvedores() {
  const data = await apiGet('?action=getProvedoresActivos');
  provedores = Array.isArray(data) ? data : [];
}

function generarHtmlItemsConProveedor(items) {
  if (!items || !items.length) {
    return '<div class="text-muted text-center py-3">No hay items en el pedido</div>';
  }

  const proveedoresOptions = provedores.map(p => 
    `<option value="${p.id_provedor}">${escapeHtml(p.nombre)}</option>`
  ).join('');

  return items.map((item, index) => `
    <div class="border-bottom pb-2 mb-2 item-proveedor-card" data-id-det-pedido="${item.id_det_pedido}">
      <div class="row g-2 align-items-center">
        <div class="col-auto">
          <span class="badge bg-primary">${index + 1}</span>
        </div>
        <div class="col">
          <div class="fw-bold text-primary small">${escapeHtml(item.descripcion)}</div>
          <div class="text-muted small">
            Cant: ${item.cantidad} | 
            Precio: ${formatCurrency(item.precio_unitario)} | 
            Subtotal: ${formatCurrency(item.subtotal)}
          </div>
        </div>
        <div class="col-md-4 col-12">
          <select class="form-select form-select-sm proveedor-item-select" required>
            <option value="">Seleccionar proveedor...</option>
            ${proveedoresOptions}
          </select>
        </div>
        <div class="col-auto">
          <div class="subtotal-badge badge bg-success">${formatCurrency(item.subtotal)}</div>
          <div class="proveedor-status mt-1">
            <span class="badge bg-secondary small">Sin proveedor</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function actualizarTotalCompra() {
  const cards = document.querySelectorAll('.item-proveedor-card');
  let total = 0;
  let todosConProveedor = true;

  console.log('Items encontrados:', cards.length);

  cards.forEach(card => {
    const subtotalText = card.querySelector('.subtotal-badge').textContent;
    const subtotal = parseFloat(subtotalText.replace(/[^0-9.-]/g, ''));
    const proveedorSelect = card.querySelector('.proveedor-item-select');
    const statusBadge = card.querySelector('.proveedor-status span');
    
    console.log('Item subtotal:', subtotal, 'Proveedor seleccionado:', proveedorSelect.value);
    
    if (!isNaN(subtotal)) {
      total += subtotal;
    }
    
    // Actualizar estado visual del item
    if (proveedorSelect.value) {
      statusBadge.className = 'badge bg-success small';
      statusBadge.innerHTML = '<i class="bi bi-check-circle"></i> Con proveedor';
      card.classList.remove('border-warning');
      card.classList.add('border-success');
    } else {
      todosConProveedor = false;
      statusBadge.className = 'badge bg-warning small';
      statusBadge.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Sin proveedor';
      card.classList.remove('border-success');
      card.classList.add('border-warning');
    }
  });

  // Autocalcular total solo si el usuario no lo ha modificado manualmente
  const totalElement = qs('totalCompra');
  const currentTotal = parseFloat(totalElement.value) || 0;
  
  // Si el total actual es 0 o coincide con el cálculo, actualizarlo
  if (currentTotal === 0 || Math.abs(currentTotal - total) < 0.01) {
    totalElement.value = total.toFixed(2);
    
    // Animación de actualización
    totalElement.classList.add('text-success', 'fw-bold');
    setTimeout(() => {
      totalElement.classList.remove('text-success', 'fw-bold');
    }, 1000);
  }
  
  // Habilitar/deshabilitar botón de guardar
  const btnGuardar = qs('btnGuardarCompra');
  const numeroFactura = qs('numeroFactura').value.trim();
  
  console.log('Estado del botón:', {
    todosConProveedor,
    numeroFactura: !!numeroFactura,
    hasRows: cards.length > 0,
    willBeDisabled: !(todosConProveedor && numeroFactura && cards.length > 0)
  });
  
  btnGuardar.disabled = !(todosConProveedor && numeroFactura && cards.length > 0);
  
  // Actualizar estado visual del botón
  if (btnGuardar.disabled) {
    btnGuardar.innerHTML = '<i class="bi bi-lock"></i> Completar datos para registrar';
    btnGuardar.className = 'btn btn-secondary w-100';
  } else {
    btnGuardar.innerHTML = '<i class="bi bi-check-circle"></i> Registrar Compra';
    btnGuardar.className = 'btn btn-success w-100';
  }
}

function actualizarDatosProvedorSeleccionado() {
  const checks = document.querySelectorAll('.provedor-check:checked');

  if (checks.length === 1) {
    const opt = checks[0];
    qs('proveedorTelefono').value = opt.dataset.telefono || '';
    qs('proveedorWhatsapp').value = opt.dataset.whatsapp || '';
    qs('proveedorEmail').value = opt.dataset.email || '';
    qs('proveedorContacto').value = opt.dataset.contacto || '';
    return;
  }

  qs('proveedorTelefono').value = '';
  qs('proveedorWhatsapp').value = '';
  qs('proveedorEmail').value = '';
  qs('proveedorContacto').value = '';
}

function filtrarProveedores(termino) {
  const cont = qs('provedoresMulti');
  if (!cont) return;
  const term = (termino || '').trim().toLowerCase();
  const checkboxes = cont.querySelectorAll('.form-check');
  checkboxes.forEach(div => {
    const label = div.querySelector('label')?.textContent?.toLowerCase() || '';
    const match = !term || label.includes(term);
    div.style.display = match ? '' : 'none';
  });
}

function getFiltros() {
  return {
    proyecto: qs('filterProyecto').value,
    busqueda: qs('searchInput').value.trim(),
    fechaDesde: qs('fechaDesde').value,
    fechaHasta: qs('fechaHasta').value,
  };
}

async function cargarPedidos() {
  const filtros = getFiltros();
  const params = new URLSearchParams();
  params.set('action', 'getPedidosAprobados');
  if (filtros.proyecto) params.set('proyecto', filtros.proyecto);
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
  if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);

  qs('listaPedidos').innerHTML = `
    <div class="text-center text-muted py-4">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2">Cargando pedidos...</div>
    </div>
  `;

  const data = await apiGet(`?${params.toString()}`);
  pedidos = data || [];
  renderListaPedidos();
}

function renderListaPedidos() {
  const cont = qs('listaPedidos');
  const contador = qs('contadorPedidos');

  contador.textContent = `(${pedidos.length})`;

  if (!pedidos || pedidos.length === 0) {
    cont.innerHTML = '<div class="text-muted">No hay pedidos aprobados para los filtros seleccionados.</div>';
    return;
  }

  const html = pedidos
    .map((p) => {
      const id = p.id_pedido;
      const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleString('es-CO') : '-';
      return `
        <div class="card mb-2" style="cursor:pointer;" onclick="seleccionarPedido(${id})">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-bold">Pedido #${escapeHtml(id)}</div>
                <div class="text-muted small">${escapeHtml(p.nombre_proyecto)} • ${escapeHtml(fecha)}</div>
              </div>
              <div class="text-end">
                <div class="fw-bold">$${formatMoney(p.total)}</div>
                <div class="text-muted small">${escapeHtml(p.total_items)} items</div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  cont.innerHTML = html;
}

async function seleccionarPedido(idPedido) {
  try {
    qs('detallePedido').innerHTML = `
      <div class="text-center text-muted py-3">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Cargando detalle...</div>
      </div>
    `;

    const data = await apiGet(`?action=getPedidoDetalle&id_pedido=${encodeURIComponent(idPedido)}`);
    pedidoSeleccionado = data;
    qs('idPedido').value = String(idPedido);

    // Al seleccionar un nuevo pedido, autollenar el total de compra con el total del pedido.
    // Luego el usuario puede modificarlo manualmente.
    totalCompraTouched = false;
    autollenarTotalCompra();

    renderDetallePedido();
    actualizarBotones();
  } catch (e) {
    console.error(e);
    qs('detallePedido').innerHTML = `<div class="alert alert-danger">${escapeHtml(e.message)}</div>`;
    pedidoSeleccionado = null;
    actualizarBotones();
  }
}

function renderDetallePedido() {
  const cont = qs('detallePedido');
  const itemsCont = qs('itemsConProveedor');
  
  if (!pedidoSeleccionado || !pedidoSeleccionado.detalles) {
    cont.innerHTML = '<div class="text-muted">No hay detalles disponibles.</div>';
    itemsCont.innerHTML = '<div class="text-muted text-center py-3">No hay items en el pedido</div>';
    return;
  }

  const detalles = pedidoSeleccionado.detalles;
  
  // Renderizar resumen del pedido
  cont.innerHTML = `
    <div class="alert alert-info">
      <div class="row">
        <div class="col-md-6">
          <strong>Pedido #${pedidoSeleccionado.id_pedido}</strong><br>
          <small class="text-muted">${pedidoSeleccionado.nombre_proyecto || ''}</small>
        </div>
        <div class="col-md-6 text-end">
          <strong>Total: ${formatCurrency(pedidoSeleccionado.total)}</strong><br>
          <small class="text-muted">${detalles.length} items</small>
        </div>
      </div>
    </div>
  `;

  // Generar HTML de items con selector de proveedor
  itemsCont.innerHTML = generarHtmlItemsConProveedor(detalles);
  
  // Agregar event listeners a los selects de proveedor
  itemsCont.querySelectorAll('.proveedor-item-select').forEach(select => {
    select.addEventListener('change', actualizarTotalCompra);
  });
  
  // Actualizar total inicial
  actualizarTotalCompra();
}

function actualizarBotones() {
  const tienePedido = !!(pedidoSeleccionado && qs('idPedido').value);
  qs('btnGuardarCompra').disabled = !tienePedido;
}

function limpiarSeleccionPedido() {
  pedidoSeleccionado = null;
  totalCompraTouched = false;
  qs('idPedido').value = '';
  qs('numeroFactura').value = '';
  qs('totalCompra').value = '';
  qs('observaciones').value = '';
  qs('itemsConProveedor').innerHTML = '<div class="text-muted text-center py-3">Seleccione un pedido para ver los items</div>';
  qs('detallePedido').innerHTML = '<div class="text-muted">Seleccione un pedido para ver el detalle.</div>';
  actualizarTotalCompra();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarProyectos();
    await cargarProvedores();
    await cargarPedidos();
    await cargarCompras();
  } catch (e) {
    console.error(e);
    qs('listaPedidos').innerHTML = `<div class="alert alert-danger">${escapeHtml(e.message)}</div>`;
  }

  qs('btnRefrescar').addEventListener('click', cargarPedidos);
  qs('btnBuscar').addEventListener('click', cargarPedidos);

  if (qs('btnRefrescarCompras')) qs('btnRefrescarCompras').addEventListener('click', cargarCompras);
  if (qs('filterProyectoCompras')) qs('filterProyectoCompras').addEventListener('change', cargarCompras);
  if (qs('fechaDesdeCompras')) qs('fechaDesdeCompras').addEventListener('change', cargarCompras);
  if (qs('fechaHastaCompras')) qs('fechaHastaCompras').addEventListener('change', cargarCompras);
  if (qs('searchCompras')) {
    let t = null;
    qs('searchCompras').addEventListener('input', () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        cargarCompras();
      }, 350);
    });
  }

  qs('filterProyecto').addEventListener('change', cargarPedidos);
  qs('fechaDesde').addEventListener('change', cargarPedidos);
  qs('fechaHasta').addEventListener('change', cargarPedidos);
  qs('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') cargarPedidos();
  });

  ['proveedorTelefono', 'proveedorWhatsapp', 'proveedorEmail'].forEach((id) => {
    const element = qs(id);
    if (element) {
      element.addEventListener('input', actualizarBotones);
    }
  });

  if (qs('totalCompra')) {
    qs('totalCompra').addEventListener('input', () => {
      totalCompraTouched = true;
    });
  }

  // Añadir evento para detectar cambios en el campo número de factura
  if (qs('numeroFactura')) {
    qs('numeroFactura').addEventListener('input', actualizarTotalCompra);
  }

  if (qs('busquedaProveedor')) {
    qs('busquedaProveedor').addEventListener('input', (e) => {
      filtrarProveedores(e.target.value);
    });
  }

  const modal = qs('modalGestionProvedores');
  if (modal) {
    modal.addEventListener('hidden.bs.modal', async () => {
      try {
        await cargarProvedores();
        actualizarBotones();
      } catch (e) {
        console.error(e);
      }
    });
  }

  qs('formCompra').addEventListener('submit', onGuardarCompra);
  actualizarBotones();
});

// Exponer para onclick inline
window.seleccionarPedido = seleccionarPedido;
window.verDetalleCompra = verDetalleCompra;

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
          <td>${escapeHtml(d.descripcion)}</td>
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
      <div class="row g-2 mb-2">
        <div class="col-md-6"><div class="text-muted small">Proyecto</div><div class="fw-bold">${escapeHtml(data.nombre_proyecto || '')}</div></div>
        <div class="col-md-6"><div class="text-muted small">Provedor</div><div class="fw-bold">${escapeHtml(data.nombre_provedor || '')}</div></div>
      </div>
      ${data.numero_factura ? `<div class="mb-2"><span class="text-muted small">Factura:</span> <strong>${escapeHtml(data.numero_factura)}</strong></div>` : ''}
      ${data.observaciones ? `<div class="mb-2"><div class="text-muted small">Observaciones</div><div>${escapeHtml(data.observaciones)}</div></div>` : ''}
      <div class="table-responsive" style="max-height: 420px; overflow:auto;">
        <table class="table table-sm table-hover">
          <thead class="table-light" style="position: sticky; top: 0; z-index: 1;">
            <tr>
              <th>Ítem</th>
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

function formatMoney(val) {
  const n = Number(val || 0);
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const cont = qs('provedoresMulti');
  cont.innerHTML = '';

  if (!provedores.length) {
    cont.innerHTML = '<div class="text-muted">No hay provedores activos.</div>';
    actualizarDatosProvedorSeleccionado();
    return;
  }

  const html = provedores
    .map((p) => {
      const id = Number(p.id_provedor);
      const nombre = String(p.nombre || '');
      const telefono = String(p.telefono || '');
      const whatsapp = String(p.whatsapp || '');
      const email = String(p.email || '');
      const contacto = String(p.contacto || '');
      return `
        <div class="form-check">
          <input
            class="form-check-input provedor-check"
            type="checkbox"
            value="${id}"
            id="provedor_${id}"
            data-telefono="${telefono.replace(/"/g, '&quot;')}"
            data-whatsapp="${whatsapp.replace(/"/g, '&quot;')}"
            data-email="${email.replace(/"/g, '&quot;')}"
            data-contacto="${contacto.replace(/"/g, '&quot;')}"
            data-nombre="${nombre.replace(/"/g, '&quot;')}"
          />
          <label class="form-check-label" for="provedor_${id}">${escapeHtml(nombre)}</label>
        </div>
      `;
    })
    .join('');

  cont.innerHTML = html;

  cont.querySelectorAll('.provedor-check').forEach((el) => {
    el.addEventListener('change', () => {
      actualizarDatosProvedorSeleccionado();
      actualizarBotones();
    });
  });

  actualizarDatosProvedorSeleccionado();
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

function getProvedoresSeleccionados() {
  const checks = Array.from(document.querySelectorAll('.provedor-check:checked'));
  return checks
    .map((o) => Number(o.value || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
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
  if (!pedidoSeleccionado) {
    qs('detallePedido').innerHTML = '<div class="text-muted">Seleccione un pedido para ver el detalle.</div>';
    return;
  }

  const p = pedidoSeleccionado;
  const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleString('es-CO') : '-';
  const detalles = Array.isArray(p.detalles) ? p.detalles : [];

  const filas = detalles
    .map((d) => {
      const badge = d.es_excedente == 1 ? '<span class="badge bg-warning text-dark">Adicional</span>' : '<span class="badge bg-success">Normal</span>';
      return `
        <tr>
          <td>
            <div class="fw-semibold">${escapeHtml(d.descripcion)}</div>
            <div class="text-muted small">${escapeHtml(d.tipo_componente)} ${badge}</div>
            ${d.justificacion ? `<div class="text-muted small">${escapeHtml(d.justificacion)}</div>` : ''}
          </td>
          <td class="text-end">${escapeHtml(Number(d.cantidad || 0).toFixed(4))} ${escapeHtml(d.unidad || '')}</td>
          <td class="text-end">$${formatMoney(d.precio_unitario)}</td>
          <td class="text-end fw-bold">$${formatMoney(d.subtotal)}</td>
        </tr>
      `;
    })
    .join('');

  qs('detallePedido').innerHTML = `
    <div class="mb-2">
      <div class="fw-bold">Pedido #${escapeHtml(p.id_pedido)}</div>
      <div class="text-muted small">${escapeHtml(p.nombre_proyecto)} • ${escapeHtml(fecha)} • Estado: <span class="badge bg-success">APROBADO</span></div>
      <div class="text-muted small">Total pedido: <strong>$${formatMoney(p.total)}</strong></div>
    </div>
    <div class="table-responsive" style="max-height: 260px; overflow:auto;">
      <table class="table table-sm table-hover">
        <thead class="table-light">
          <tr>
            <th>Ítem</th>
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
  qs('detallePedido').innerHTML = '<div class="text-muted">Seleccione un pedido para ver el detalle.</div>';
}

async function onGuardarCompra(e) {
  e.preventDefault();

  if (!pedidoSeleccionado) {
    alert('Seleccione un pedido');
    return;
  }

  const idsProvedores = getProvedoresSeleccionados();
  if (!idsProvedores.length) {
    alert('Seleccione al menos un provedor');
    return;
  }

  const totalCompra = Number(qs('totalCompra').value || 0);
  if (!totalCompra || totalCompra <= 0) {
    alert('Digite el total de la compra');
    return;
  }

  const detalles = Array.isArray(pedidoSeleccionado.detalles)
    ? pedidoSeleccionado.detalles.map((d) => ({
        id_det_pedido: d.id_det_pedido,
        descripcion: d.descripcion,
        unidad: d.unidad,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
      }))
    : [];

  const payload = {
    id_pedido: Number(qs('idPedido').value),
    id_provedores: idsProvedores,
    numero_factura: qs('numeroFactura').value.trim() || null,
    observaciones: qs('observaciones').value.trim() || null,
    total: totalCompra,
    detalles,
  };

  const btn = qs('btnGuardarCompra');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

  try {
    const res = await apiPost('guardarCompra', payload);
    alert(res.message || 'Compra registrada');

    // El pedido pasa a estado 'comprado' en backend.
    // Refrescar UI para que ya no aparezca en la lista de aprobados.
    limpiarSeleccionPedido();
    await cargarPedidos();
  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  } finally {
    btn.innerHTML = original;
    actualizarBotones();
  }
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
    qs(id).addEventListener('input', actualizarBotones);
  });

  if (qs('totalCompra')) {
    qs('totalCompra').addEventListener('input', () => {
      totalCompraTouched = true;
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

let pedidos = [];
let pedidoSeleccionado = null;

function qs(id) {
  return document.getElementById(id);
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
  data.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id_proyecto;
    opt.textContent = p.nombre;
    sel.appendChild(opt);
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

  const tieneContacto =
    !!qs('proveedorTelefono').value.trim() ||
    !!qs('proveedorWhatsapp').value.trim() ||
    !!qs('proveedorEmail').value.trim();
  qs('btnContactar').disabled = !tienePedido || !tieneContacto;
}

function construirLinkContacto() {
  const nombre = qs('proveedorNombre').value.trim();
  const whatsapp = qs('proveedorWhatsapp').value.trim();
  const tel = qs('proveedorTelefono').value.trim();
  const email = qs('proveedorEmail').value.trim();

  const pedidoId = qs('idPedido').value;
  const msgBase = `Hola${nombre ? ' ' + nombre : ''}. Necesitamos cotizar/confirmar compra del pedido #${pedidoId}.`;

  if (whatsapp) {
    const num = whatsapp.replace(/[^0-9]/g, '');
    return `https://wa.me/${encodeURIComponent(num)}?text=${encodeURIComponent(msgBase)}`;
  }

  if (tel) {
    const num = tel.replace(/[^0-9+]/g, '');
    return `tel:${encodeURIComponent(num)}`;
  }

  if (email) {
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Compra pedido #' + pedidoId)}&body=${encodeURIComponent(msgBase)}`;
  }

  return null;
}

async function onGuardarCompra(e) {
  e.preventDefault();

  if (!pedidoSeleccionado) {
    alert('Seleccione un pedido');
    return;
  }

  const proveedorNombre = qs('proveedorNombre').value.trim();
  if (!proveedorNombre) {
    alert('Proveedor requerido');
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
    proveedor_nombre: proveedorNombre,
    proveedor_telefono: qs('proveedorTelefono').value.trim() || null,
    proveedor_email: qs('proveedorEmail').value.trim() || null,
    proveedor_whatsapp: qs('proveedorWhatsapp').value.trim() || null,
    proveedor_contacto: qs('proveedorContacto').value.trim() || null,
    numero_factura: qs('numeroFactura').value.trim() || null,
    estado: qs('estadoCompra').value,
    observaciones: qs('observaciones').value.trim() || null,
    total: Number(pedidoSeleccionado.total || 0),
    detalles,
  };

  const btn = qs('btnGuardarCompra');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

  try {
    const res = await apiPost('guardarCompra', payload);
    alert(res.message || 'Compra registrada');
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
    await cargarPedidos();
  } catch (e) {
    console.error(e);
    qs('listaPedidos').innerHTML = `<div class="alert alert-danger">${escapeHtml(e.message)}</div>`;
  }

  qs('btnRefrescar').addEventListener('click', cargarPedidos);
  qs('btnBuscar').addEventListener('click', cargarPedidos);

  qs('filterProyecto').addEventListener('change', cargarPedidos);
  qs('fechaDesde').addEventListener('change', cargarPedidos);
  qs('fechaHasta').addEventListener('change', cargarPedidos);
  qs('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') cargarPedidos();
  });

  ['proveedorTelefono', 'proveedorWhatsapp', 'proveedorEmail', 'proveedorNombre'].forEach((id) => {
    qs(id).addEventListener('input', actualizarBotones);
  });

  qs('btnContactar').addEventListener('click', () => {
    const link = construirLinkContacto();
    if (!link) {
      alert('Ingrese un teléfono/whatsapp/email para contactar');
      return;
    }
    window.open(link, '_blank');
  });

  qs('formCompra').addEventListener('submit', onGuardarCompra);
  actualizarBotones();
});

// Exponer para onclick inline
window.seleccionarPedido = seleccionarPedido;

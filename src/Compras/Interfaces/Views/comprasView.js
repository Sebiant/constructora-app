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
  try {
    console.log('📡 Cargando compras...');

    // Cargar proyectos primero
    await cargarProyectos();

    // Cargar pedidos para el selector
    await cargarPedidos();

    // Cargar compras
    const tbody = qs('tablaCompras');
    if (!tbody) {
      console.error('No se encontró tabla de compras');
      return;
    }

    // Limpiar tabla
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm" role="status"></div><p class="mb-0 mt-2">Cargando compras...</p></td></tr>';

    const filtros = getFiltrosCompras();
    const params = new URLSearchParams();
    params.set('action', 'getCompras');
    if (filtros.proyecto) params.set('proyecto', filtros.proyecto);
    if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
    if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);

    console.log('🌐 Parámetros de carga de compras:', params.toString());
    console.log('🌐 URL completa:', `${API_COMPRAS}?${params.toString()}`);

    const response = await apiGet(params.toString());
    console.log('📥 Respuesta de compras:', response);

    const compras = response || [];
    console.log('✅ Compras cargadas:', compras.length);

    if (compras.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="alert alert-info"><i class="bi bi-info-circle"></i> No hay compras registradas</div></td></tr>';
      return;
    }

    // Renderizar compras
    tbody.innerHTML = compras.map((compra, index) => {
      const estadoBadge = getEstadoBadge(compra.estado);
      const fechaFormateada = new Date(compra.fecha_compra).toLocaleDateString();

      return `
        <tr>
          <td>${compra.id_compra}</td>
          <td>${compra.id_pedido || '-'}</td>
          <td>${compra.nombre_provedor || '-'}</td>
          <td>${fechaFormateada}</td>
          <td>${formatMoney(compra.total)}</td>
          <td>${compra.numero_factura || '-'}</td>
          <td>${estadoBadge}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary" onclick="verDetalleCompra(${compra.id_compra})">
              <i class="bi bi-eye"></i> Ver
            </button>
          </td>
        </tr>
      `;
    }).join('');

    console.log('✅ Tabla de compras renderizada');

  } catch (error) {
    console.error('❌ Error en cargarCompras:', error);
    console.error('❌ Stack trace:', error.stack);
    const tbody = qs('tablaCompras');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4"><div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar compras: ${escapeHtml(error.message)}</div></td></tr>`;
    }
  }
}

function renderTablaCompras() {
  const tbody = qs('tablaCompras');
  if (!tbody) return;

  if (!compras.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay compras para los filtros seleccionados.</td></tr>';
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

    const data = await apiGet(`action=getCompraDetalle&id_compra=${encodeURIComponent(idCompra)}`);

    const fecha = data.fecha_compra ? new Date(data.fecha_compra).toLocaleString('es-CO') : '-';
    const detalles = Array.isArray(data.detalles) ? data.detalles : [];
    const filas = detalles
      .map((d) => {
        const solicitada = Number(d.cantidad_solicitada || 0);
        const recibida = Number(d.cantidad_recibida || 0);
        const faltante = Number(d.cantidad_faltante || 0);
        const estadoRecibido = recibida >= solicitada ?
          '<span class="badge bg-success">Completo</span>' :
          recibida === 0 ?
            '<span class="badge bg-danger">No llegó</span>' :
            '<span class="badge bg-warning">Parcial</span>';

        return `
          <tr>
            <td>
              <div class="fw-semibold">${escapeHtml(d.descripcion)}</div>
            </td>
            <td class="text-end">${escapeHtml(solicitada.toFixed(4))} ${escapeHtml(d.unidad || '')}</td>
            <td class="text-end">${escapeHtml(recibida.toFixed(4))} ${escapeHtml(d.unidad || '')}</td>
            <td class="text-end">
              ${faltante > 0 ?
            `<span class="text-danger">${escapeHtml(faltante.toFixed(4))} ${escapeHtml(d.unidad || '')}</span>` :
            '<span class="text-success">0</span>'
          }
            </td>
            <td class="text-center">${estadoRecibido}</td>
            <td class="text-end">${formatMoney(d.precio_unitario)}</td>
            <td class="text-end fw-bold">${formatMoney(d.subtotal)}</td>
          </tr>
        `;
      })
      .join('');

    qs('detalleCompraContenido').innerHTML = `
      <div class="row g-2 mb-2">
        <div class="col-md-3"><div class="text-muted small">Compra</div><div class="fw-bold">#${escapeHtml(data.id_compra)}</div></div>
        <div class="col-md-3"><div class="text-muted small">Pedido</div><div class="fw-bold">#${escapeHtml(data.id_pedido)}</div></div>
        <div class="col-md-3"><div class="text-muted small">Fecha</div><div class="fw-bold">${escapeHtml(fecha)}</div></div>
        <div class="col-md-3"><div class="text-muted small">Total</div><div class="fw-bold">${formatMoney(data.total)}</div></div>
      </div>
      <div class="mb-2">
        <div class="text-muted small">Proyecto</div>
        <div class="fw-bold">${escapeHtml(data.nombre_proyecto || '')}</div>
      </div>
      <div class="mb-2">
        <div class="text-muted small">Proveedor</div>
        <div class="fw-bold">${escapeHtml(data.nombre_provedor || '')}</div>
      </div>
      ${data.numero_factura ? `<div class="mb-2"><span class="text-muted small">Factura:</span> <strong>${escapeHtml(data.numero_factura)}</strong></div>` : ''}
      ${data.observaciones ? `<div class="mb-2"><div class="text-muted small">Observaciones</div><div>${escapeHtml(data.observaciones)}</div></div>` : ''}
      <div class="table-responsive" style="max-height: 420px; overflow:auto;">
        <table class="table table-sm table-hover">
          <thead class="table-light" style="position: sticky; top: 0; z-index: 1;">
            <tr>
              <th>Ítem / Proveedor</th>
              <th class="text-end">Cant. Solicitada</th>
              <th class="text-end">Cant. Recibida</th>
              <th class="text-end">Cant. Faltante</th>
              <th class="text-center">Estado</th>
              <th class="text-end">Vr. Unit.</th>
              <th class="text-end">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${filas || '<tr><td colspan="7" class="text-muted">Sin detalle.</td></tr>'}
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

  const totalPedido = Number(pedidoSeleccionado?.total || 0);
  el.value = totalPedido ? totalPedido.toFixed(2) : '';

  // Permitir edición manual del total si el usuario lo modifica
  el.addEventListener('input', () => {
    totalCompraTouched = true;
  });
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
  console.log('Iniciando guardado de compra (recepción parcial)...');

  const numeroFactura = qs('numeroFactura').value.trim();
  if (!numeroFactura) {
    alert('El número de factura es obligatorio');
    qs('numeroFactura').focus();
    return;
  }

  const idOrden = qs('idOrdenCompra').value;
  if (!idOrden) {
    alert('Debe seleccionar una orden');
    return;
  }

  // Recopilar datos de recepción de items
  const itemsRecibidos = [];
  const rowsContainer = qs('itemsRecepcion');

  console.log('Buscando itemsRecepcion:', rowsContainer); // Debug

  if (rowsContainer) {
    const rows = rowsContainer.querySelectorAll('tbody tr');
    console.log('Filas encontradas:', rows.length); // Debug

    rows.forEach((tr, index) => {
      console.log(`Procesando fila ${index}:`, tr); // Debug

      const idDetPedidoInput = tr.querySelector('input[name="id_det_pedido"]');
      const cantidadEsperadaInput = tr.querySelector('input[name="cantidad_esperada"]');
      const cantidadRecibidaInput = tr.querySelector('.cantidad-recibida');
      const precioUnitarioInput = tr.querySelector('.precio-unitario');

      console.log('Inputs encontrados:', {
        idDetPedido: idDetPedidoInput,
        cantidadEsperada: cantidadEsperadaInput,
        cantidadRecibida: cantidadRecibidaInput,
        precioUnitario: precioUnitarioInput
      }); // Debug

      if (idDetPedidoInput && cantidadEsperadaInput && cantidadRecibidaInput && precioUnitarioInput) {
        const idDetPedido = idDetPedidoInput.value;
        const cantidadEsperada = parseFloat(cantidadEsperadaInput.value);
        const cantidadRecibida = parseFloat(cantidadRecibidaInput.value);
        const precioUnitario = parseFloat(precioUnitarioInput.value);

        console.log(`Item ${index}:`, {
          idDetPedido,
          cantidadEsperada,
          cantidadRecibida,
          precioUnitario
        }); // Debug

        itemsRecibidos.push({
          id_det_pedido: idDetPedido,
          cantidad_esperada: cantidadEsperada,
          cantidad_recibida: cantidadRecibida,
          precio_unitario: precioUnitario
        });
      } else {
        console.warn('Faltan inputs en la fila:', tr); // Debug
      }
    });
  } else {
    console.warn('No se encontró el contenedor itemsRecepcion'); // Debug
  }

  console.log('Items recibidos finales:', itemsRecibidos); // Debug

  const payload = {
    id_orden_compra: idOrden,
    numero_factura: numeroFactura,
    total: qs('totalCompra').value,
    observaciones: qs('observaciones').value.trim(),
    items_recibidos: itemsRecibidos
  };

  console.log('Payload a enviar:', payload);

  const btnGuardar = qs('btnGuardarCompra');
  const originalText = btnGuardar.innerHTML;
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  btnGuardar.className = 'btn btn-warning w-100';

  try {
    const response = await apiPost('registrarCompraDeOrden', payload);
    console.log('Respuesta del servidor:', response);

    let mensaje = response.message || 'Compra registrada correctamente';

    // Si hay items faltantes, mostrar información adicional
    if (response.recepcion_parcial && response.items_faltantes > 0) {
      mensaje = `Recepción registrada correctamente

RESUMEN:
• Items recibidos: ${response.items_recibidos}
• Items con cantidades faltantes: ${response.items_faltantes}
• Estado de la orden: ${response.estado_orden === 'parcialmente_comprada' ? 'Parcialmente Recibida' : 'Completada'}

NOTA: Puede registrar futuras recepciones de los items faltantes sobre esta misma orden de compra.`;
    }

    alert(mensaje);
    limpiarSeleccionPedido();
    cargarCompras(); // Recargar historial
    cargarPedidos(); // Recargar órdenes disponibles
  } catch (error) {
    console.error('Error al guardar compra:', error);
    alert('Error al registrar compra: ' + error.message);
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = originalText;
    btnGuardar.className = 'btn btn-success w-100';
    actualizarTotalCompra();
  }
}

async function apiGet(path) {
  // Asegurar que el path comience con ?
  const fullPath = path.startsWith('?') ? path : `?${path}`;
  const res = await fetch(`${API_COMPRAS}${fullPath}`);
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

function generarHtmlItemsRecepcion(items) {
  console.log('generarHtmlItemsRecepcion - items recibidos:', items); // Debug

  if (!items || !items.length) {
    console.log('No hay items o items está vacío'); // Debug
    return '<div class="text-muted text-center py-3">No hay items en la orden</div>';
  }

  console.log('Generando HTML para', items.length, 'items'); // Debug

  return `
    <div class="table-responsive" style="max-height: 400px; overflow-y: auto; overflow-x: auto;">
      <table class="table table-sm align-middle mb-0" style="min-width: 1000px;">
        <thead class="table-light" style="position: sticky; top: 0; z-index: 1;">
          <tr>
            <th style="width: 42px;">#</th>
            <th style="min-width: 200px;">Descripción</th>
            <th class="text-center" style="width: 80px;">Unidad</th>
            <th class="text-end" style="width: 100px;">Cant. Total</th>
            <th class="text-end" style="width: 100px;">Ya Recibida</th>
            <th class="text-end" style="width: 100px;">Pendiente</th>
            <th class="text-end" style="width: 120px;">Recibir Ahora</th>
            <th class="text-end" style="width: 120px;">Vr. Unitario</th>
            <th class="text-end" style="width: 120px;">Vr. Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => {
    console.log('Procesando item:', item); // Debug
    const cantTotal = Number(item.cantidad_comprada ?? item.cantidad_solicitada ?? 0);
    const cantYaRecibida = Number(item.cantidad_recibida ?? 0);
    const cantPendiente = cantTotal - cantYaRecibida;
    const precio = Number(item.precio_unitario ?? 0);

    // Por defecto, sugerir recibir toda la cantidad pendiente
    const cantSugerida = cantPendiente > 0 ? cantPendiente : 0;
    const subtotal = cantSugerida * precio;

    console.log('Item procesado - cantTotal:', cantTotal, 'yaRecibida:', cantYaRecibida, 'pendiente:', cantPendiente); // Debug

    // Determinar el estado visual del item
    const estadoClass = cantPendiente <= 0 ? 'table-success' : (cantYaRecibida > 0 ? 'table-warning' : '');

    return `
              <tr class="${estadoClass}">
                <td>${idx + 1}</td>
                <td>
                  <div class="fw-semibold">${escapeHtml(item.descripcion)}</div>
                  ${cantYaRecibida > 0 ? '<small class="text-muted">Recepción parcial previa</small>' : ''}
                  <input type="hidden" name="id_det_pedido" value="${item.id_det_pedido}">
                  <input type="hidden" name="cantidad_esperada" value="${cantTotal}">
                </td>
                <td class="text-center">${escapeHtml(item.unidad || '')}</td>
                <td class="text-end fw-bold">${cantTotal.toFixed(2)}</td>
                <td class="text-end ${cantYaRecibida > 0 ? 'text-warning fw-bold' : 'text-muted'}">${cantYaRecibida.toFixed(2)}</td>
                <td class="text-end ${cantPendiente > 0 ? 'text-danger fw-bold' : 'text-success'}">${cantPendiente.toFixed(2)}</td>
                <td class="text-end">
                  <input type="number" 
                         class="form-control form-control-sm cantidad-recibida text-end" 
                         name="cantidad_recibida" 
                         value="${cantSugerida.toFixed(2)}" 
                         min="0" 
                         max="${cantPendiente}" 
                         step="0.01"
                         data-esperada="${cantTotal}"
                         data-pendiente="${cantPendiente}"
                         ${cantPendiente <= 0 ? 'disabled' : ''}
                         style="width: 100px; font-size: 0.9rem;">
                </td>
                <td class="text-end">
                  <input type="number" 
                         class="form-control form-control-sm precio-unitario text-end" 
                         name="precio_unitario" 
                         value="${precio.toFixed(2)}" 
                         min="0" 
                         step="0.01"
                         data-esperada="${cantTotal}"
                         style="width: 110px; font-size: 0.9rem; font-weight: 500;">
                </td>
                <td class="text-end valor-total-item" style="font-weight: 600; min-width: 100px; padding-right: 15px;">${formatMoney(subtotal)}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function actualizarTotalCompra() {
  // Recalcular total desde la tabla de recepción con valores individuales
  const rowsContainer = qs('itemsRecepcion');
  let total = 0;

  if (rowsContainer && rowsContainer.querySelectorAll('tbody tr').length > 0) {
    rowsContainer.querySelectorAll('tbody tr').forEach(tr => {
      const cantidadRecibidaInput = tr.querySelector('.cantidad-recibida');
      const precioUnitarioInput = tr.querySelector('.precio-unitario');

      const cantidadRecibida = parseFloat(cantidadRecibidaInput?.value || 0);
      const precioUnitario = parseFloat(precioUnitarioInput?.value || 0);

      if (!isNaN(cantidadRecibida) && !isNaN(precioUnitario)) {
        const subtotalItem = cantidadRecibida * precioUnitario;
        total += subtotalItem;

        // Actualizar el valor total visual del item
        const valorTotalTd = tr.querySelector('.valor-total-item');
        if (valorTotalTd) {
          valorTotalTd.textContent = formatMoney(subtotalItem);
        }
      }
    });
  }

  if (total === 0 && pedidoSeleccionado) {
    total = Number(pedidoSeleccionado.total || 0);
  }

  const totalElement = qs('totalCompra');
  if (totalElement) {
    totalElement.value = total.toFixed(2);
  }

  // Habilitar botón únicamente por: orden seleccionada + número de factura
  const btnGuardar = qs('btnGuardarCompra');
  const numeroFactura = (qs('numeroFactura')?.value || '').trim();
  const tieneOrden = !!(qs('idOrdenCompra')?.value || '').trim();

  const habilitado = !!(tieneOrden && numeroFactura);

  if (btnGuardar) {
    btnGuardar.disabled = !habilitado;
    btnGuardar.className = habilitado ? 'btn btn-success w-100' : 'btn btn-secondary w-100';
    btnGuardar.innerHTML = habilitado
      ? '<i class="bi bi-check-circle"></i> Registrar Compra'
      : '<i class="bi bi-lock"></i> Completar datos para registrar';
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
  params.set('action', 'getOrdenesParaCompra');
  if (filtros.proyecto) params.set('proyecto', filtros.proyecto);
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
  if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);

  const listaPedidos = qs('listaPedidos');
  if (listaPedidos) {
    listaPedidos.innerHTML = `
      <div class="text-center text-muted py-4">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Cargando órdenes...</div>
      </div>
    `;
  }

  const data = await apiGet(params.toString());
  pedidos = data || [];
  renderListaPedidos();
}

function renderListaPedidos() {
  const cont = qs('listaPedidos');
  const contador = qs('contadorPedidos');

  if (contador) contador.textContent = `(${pedidos.length})`;

  if (!cont) return;

  if (!pedidos || pedidos.length === 0) {
    cont.innerHTML = '<div class="text-muted">No hay órdenes para los filtros seleccionados.</div>';
    return;
  }

  const html = pedidos
    .map((o) => {
      const id = o.id_orden_compra;
      const fecha = o.fecha_orden ? new Date(o.fecha_orden).toLocaleString('es-CO') : '-';

      // Determinar badge según el estado
      let estadoBadge = '';
      if (o.estado === 'parcialmente_comprada') {
        estadoBadge = '<span class="badge bg-warning text-dark ms-2">Recepción Parcial</span>';
      } else if (o.estado === 'aprobada') {
        estadoBadge = '<span class="badge bg-success ms-2">Aprobada</span>';
      } else if (o.estado === 'pendiente') {
        estadoBadge = '<span class="badge bg-secondary ms-2">Pendiente</span>';
      }

      return `
        <div class="card mb-2 ${o.estado === 'parcialmente_comprada' ? 'border-warning' : ''}" style="cursor:pointer;" onclick="seleccionarPedido(${id})">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-bold">
                  OC ${escapeHtml(o.numero_orden || '#' + id)}
                  ${estadoBadge}
                </div>
                <div class="text-muted small">${escapeHtml(o.nombre_proyecto || '')} • ${escapeHtml(fecha)}</div>
              </div>
              <div class="text-end">
                <div class="fw-bold">${formatMoney(o.total)}</div>
                <div class="text-muted small">Pedido #${escapeHtml(o.id_pedido)}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  cont.innerHTML = html;
}

async function seleccionarPedido(idOrden) {
  try {
    const detallePedido = qs('detallePedido');
    if (detallePedido) {
      detallePedido.innerHTML = `
        <div class="text-center text-muted py-3">
          <div class="spinner-border" role="status"></div>
          <div class="mt-2">Cargando detalle...</div>
        </div>
      `;
    }

    const data = await apiGet(`action=getOrdenCompraDetalle&id_orden_compra=${encodeURIComponent(idOrden)}`);
    console.log('Datos recibidos de la orden:', data); // Debug
    pedidoSeleccionado = data;

    const idOrdenElement = qs('idOrdenCompra');
    if (idOrdenElement) idOrdenElement.value = String(idOrden);

    // Autollenar el total de compra con el total de la orden (editable)
    totalCompraTouched = false;
    const totalEl = qs('totalCompra');
    if (totalEl) totalEl.value = (Number(pedidoSeleccionado.total || 0)).toFixed(2);

    renderDetallePedido();
    actualizarBotones();
  } catch (e) {
    console.error(e);
    const detallePedido = qs('detallePedido');
    if (detallePedido) {
      detallePedido.innerHTML = `<div class="alert alert-danger">${escapeHtml(e.message)}</div>`;
    }
    pedidoSeleccionado = null;
    actualizarBotones();
  }
}

function renderDetallePedido() {
  const cont = qs('detallePedido');
  const itemsCont = qs('itemsRecepcion');

  console.log('renderDetallePedido - pedidoSeleccionado:', pedidoSeleccionado); // Debug
  console.log('renderDetallePedido - detalles:', pedidoSeleccionado?.detalles); // Debug

  if (!pedidoSeleccionado || !pedidoSeleccionado.detalles) {
    if (cont) cont.innerHTML = '<div class="text-muted">No hay detalles disponibles.</div>';
    if (itemsCont) itemsCont.innerHTML = '<div class="text-muted text-center py-3">No hay items en la orden</div>';
    return;
  }

  const detalles = pedidoSeleccionado.detalles;
  console.log('Cantidad de detalles:', detalles.length); // Debug

  if (cont) {
    cont.innerHTML = `
      <div class="alert alert-info">
        <div class="row">
          <div class="col-md-6">
            <strong>OC ${escapeHtml(pedidoSeleccionado.numero_orden || ('#' + pedidoSeleccionado.id_orden_compra))}</strong><br>
            <small class="text-muted">Pedido #${escapeHtml(pedidoSeleccionado.id_pedido || '')}</small>
          </div>
          <div class="col-md-6 text-end">
            <strong>Total: ${formatCurrency(pedidoSeleccionado.total)}</strong><br>
            <small class="text-muted">${detalles.length} items</small>
          </div>
        </div>
      </div>
    `;
  }

  // Mostrar proveedor de la orden (viene desde backend)
  const inputProv = qs('proveedorOrden');
  if (inputProv) inputProv.value = pedidoSeleccionado.nombre_provedor || '';

  // Render de items para recepción parcial
  if (itemsCont) {
    const htmlItems = generarHtmlItemsRecepcion(detalles);
    console.log('HTML generado para items:', htmlItems); // Debug
    itemsCont.innerHTML = htmlItems;
  }

  // Agregar eventos para los checkboxes y cantidades
  agregarEventosRecepcion();

  actualizarTotalCompra();
}

function actualizarBotones() {
  // La habilitación real se controla en actualizarTotalCompra()
  actualizarTotalCompra();
}

function limpiarSeleccionPedido() {
  pedidoSeleccionado = null;
  totalCompraTouched = false;

  const idOrden = qs('idOrdenCompra');
  const numeroFactura = qs('numeroFactura');
  const totalCompra = qs('totalCompra');
  const observaciones = qs('observaciones');
  const itemsRecepcion = qs('itemsRecepcion');
  const detallePedido = qs('detallePedido');

  if (idOrden) idOrden.value = '';
  if (numeroFactura) numeroFactura.value = '';
  if (totalCompra) totalCompra.value = '';
  if (observaciones) observaciones.value = '';
  if (itemsRecepcion) itemsRecepcion.innerHTML = '<div class="text-muted text-center py-3">Seleccione una orden de compra para ver los items</div>';
  if (detallePedido) detallePedido.innerHTML = '<div class="text-muted">Seleccione una orden de compra para ver el detalle.</div>';

  actualizarTotalCompra();
}

function agregarEventosRecepcion() {
  // Evento para cambios en cantidades recibidas
  document.querySelectorAll('.cantidad-recibida').forEach(input => {
    input.addEventListener('input', function () {
      actualizarTotalCompra();
    });
  });

  // Evento para cambios en precios unitarios
  document.querySelectorAll('.precio-unitario').forEach(input => {
    input.addEventListener('input', function () {
      actualizarTotalCompra();
    });
  });
}

function getEstadoBadge(estado) {
  const badges = {
    'pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
    'aprobada': '<span class="badge bg-success">Aprobada</span>',
    'parcialmente_comprada': '<span class="badge bg-info">Parcialmente Comprada</span>',
    'comprada': '<span class="badge bg-primary">Comprada</span>',
    'cancelada': '<span class="badge bg-danger">Cancelada</span>'
  };
  return badges[estado] || '<span class="badge bg-secondary">' + estado + '</span>';
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarProyectos();
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

  // Campos de proveedor eliminados

  if (qs('totalCompra')) {
    qs('totalCompra').addEventListener('input', () => {
      totalCompraTouched = true;
    });
  }

  // Añadir evento para detectar cambios en el campo número de factura
  if (qs('numeroFactura')) {
    qs('numeroFactura').addEventListener('input', actualizarTotalCompra);
  }

  // Búsqueda de proveedores eliminada

  // Modal de proveedores eliminado

  qs('formCompra').addEventListener('submit', onGuardarCompra);
  actualizarTotalCompra();
});

// Exponer para onclick inline
window.seleccionarPedido = seleccionarPedido;
window.verDetalleCompra = verDetalleCompra;

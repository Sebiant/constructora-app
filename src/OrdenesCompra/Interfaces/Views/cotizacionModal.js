/**
 * cotizacionModal.js
 * Módulo para gestionar el modal de cotización comparativa por proveedor
 * al generar órdenes de compra.
 */

const CotizacionModal = (() => {
  /* ── Estado interno ─────────────────────────────────────────── */
  const state = {
    proveedores: [],          // Todos los proveedores activos [{id, nombre}]
    proveedoresSeleccionados: [], // IDs de proveedores en la cotización actual
    productos: [],            // Productos del pedido seleccionado [{id, descripcion, unidad, cantidad, ...}]
    cotizaciones: {},         // { id_producto: { id_proveedor: precio } }
    seleccionados: {},        // { id_producto: id_proveedor }  — ganador por producto
    modalInstance: null,
    onConfirm: null           // callback(grupos) donde grupos = [{id_provedor, productos:[...]}]
  };

  const API_ORDENES = '/sgigescon/src/OrdenesCompra/Interfaces/OrdenesCompraController.php';

  /* ── Inicialización ─────────────────────────────────────────── */
  function init() {
    const el = document.getElementById('modalCotizacion');
    if (el && window.bootstrap) {
      state.modalInstance = new bootstrap.Modal(el);
    }
    _bindEventos();
  }

  function _bindEventos() {
    document.getElementById('btnConfirmarCotizacion')
      ?.addEventListener('click', confirmarCotizacion);

    // Seleccionador de cotizaciones existentes
    document.getElementById('selectCotizacionExistente')
      ?.addEventListener('change', (e) => {
        const idCot = e.target.value;
        if (idCot) cargarDetalleCotizacionSeleccionada(idCot);
      });
  }

  /* ── API pública ─────────────────────────────────────────── */

  /**
   * Abrir el modal de cotización.
   * @param {Array}    productos  Lista de productos del pedido
   * @param {Array}    proveedores  Lista de proveedores disponibles [{id_provedor, nombre}]
   * @param {Function} onConfirm  Callback cuando se confirman las órdenes agrupadas
   */
  function abrir(idPedido, productos, proveedores, onConfirm) {
    state.idPedido = idPedido;
    state.productos = productos;
    state.proveedores = proveedores;
    state.proveedoresSeleccionados = [];
    state.cotizaciones = {};
    state.seleccionados = {};
    state.onConfirm = onConfirm;

    _renderTabla();
    _actualizarResumenCotizacion();
    _cargarCotizacionesDisponibles(idPedido);

    if (state.modalInstance) {
      state.modalInstance.show();
    }
  }

  async function _cargarCotizacionesDisponibles(idPedido) {
    const select = document.getElementById('selectCotizacionExistente');
    if (!select) return;

    select.innerHTML = '<option value="">-- Buscando cotizaciones... --</option>';

    try {
      const resp = await fetch(`/sgigescon/src/Cotizacion/Interfaces/CotizacionController.php?action=getCotizacionesByPedido&id_pedido=${idPedido}`);
      const res = await resp.json();

      if (res.success && res.data.length > 0) {
        let html = '<option value="">-- Seleccione una cotización --</option>';
        res.data.forEach(c => {
          html += `<option value="${c.id_cotizacion}">${c.nombre} (${c.total_proveedores} provs, ${c.total_recursos_cotizados} precios)</option>`;
        });
        select.innerHTML = html;
        
        _showToast(`Se encontraron ${res.data.length} cotizaciones para este pedido`, 'info');
      } else {
        select.innerHTML = '<option value="">-- No hay cotizaciones importadas --</option>';
        _showToast('Este pedido no tiene cotizaciones importadas. Ve al módulo de Pedidos para subir precios de proveedores.', 'warning');
      }
    } catch (e) {
      select.innerHTML = '<option value="">-- Error al cargar --</option>';
    }
  }

  async function cargarDetalleCotizacionSeleccionada(idCotizacion) {
    _showToast('Cargando datos de cotización...', 'info');
    
    try {
      const resp = await fetch(`/sgigescon/src/Cotizacion/Interfaces/CotizacionController.php?action=getCotizacionDetalle&id_cotizacion=${idCotizacion}`);
      const res = await resp.json();

      if (res.success) {
        // Reiniciar estado local
        state.proveedoresSeleccionados = [];
        state.cotizaciones = {};
        state.seleccionados = {};

        // 1. Poblar proveedores
        res.proveedores.forEach(pv => {
          state.proveedoresSeleccionados.push(pv.id_cot_prov);
          
          // Buscar si ya existe en state.proveedores (por id_provedor alias id_cot_prov)
          const existe = state.proveedores.find(p => String(p.id_provedor) === String(pv.id_cot_prov));
          if (!existe) {
             state.proveedores.push({
               id_provedor: pv.id_cot_prov, // Alias local para coincidir con selección
               nombre: pv.nombre_proveedor,
               id_real_sistema: pv.id_provedor // ID real de la DB de proveedores (puede ser null)
             });
          }
        });

        // 2. Poblar precios
        res.proveedores.forEach(pv => {
           Object.entries(pv.precios).forEach(([idDetPedido, precio]) => {
              const producto = state.productos.find(p => {
                const pid = Array.isArray(p.id_det_pedido) ? p.id_det_pedido[0] : p.id_det_pedido;
                return String(pid) === String(idDetPedido);
              });

              if (producto) {
                const key = _keyProducto(producto);
                if (!state.cotizaciones[key]) state.cotizaciones[key] = {};
                state.cotizaciones[key][pv.id_cot_prov] = precio;
              }
           });
        });

        _renderTabla();
        _actualizarResumenCotizacion();
        _showToast('Cotización cargada. Seleccione los proveedores ganadores para cada recurso.', 'success');
      }
    } catch (e) {
      console.error(e);
      _showToast('Error al cargar detalle de cotización', 'danger');
    }
  }

  function cerrar() {
    if (state.modalInstance) {
      state.modalInstance.hide();
    }
  }

  /* ── Renderizado de la tabla ─────────────────────────────────── */

  function _renderTabla() {
    const contenedor = document.getElementById('contenedorTablaCotizacion');
    if (!contenedor) return;

    if (state.proveedoresSeleccionados.length === 0) {
      contenedor.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-shop display-3 opacity-50"></i>
          <p class="mt-3">Seleccione una cotización para comenzar</p>
        </div>`;
      return;
    }

    const provNombres = state.proveedoresSeleccionados.map(id => ({
      id,
      nombre: _getNombreProveedor(id)
    }));

    let html = `
    <div class="table-responsive">
      <table class="table table-bordered align-middle mb-0" id="tablaCotizacion">
        <thead>
          <tr class="table-dark">
            <th style="min-width:220px;">Recurso</th>
            <th class="text-center" style="width:80px;">Unidad</th>
            <th class="text-center" style="width:90px;">Cant.</th>
            ${provNombres.map(pv => `
              <th class="text-center prov-col" style="min-width:160px;">
                <span class="text-truncate" title="${_esc(pv.nombre)}">${_esc(pv.nombre)}</span>
              </th>`).join('')}
            <th class="text-center bg-success text-white" style="min-width:160px;">
              <i class="bi bi-trophy-fill"></i> Mejor Opción
            </th>
            <th class="text-end bg-success text-white" style="width:110px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${state.productos.map(p => _renderFila(p, provNombres)).join('')}
        </tbody>
        <tfoot>
          <tr class="table-light fw-bold">
            <td colspan="${3 + provNombres.length}" class="text-end">Total estimado:</td>
            <td class="text-end" id="cotTotalGeneral">—</td>
            <td id="cotTotalSubtotal" class="text-end">$0.00</td>
          </tr>
        </tfoot>
      </table>
    </div>`;

    contenedor.innerHTML = html;

    contenedor.querySelectorAll('.radio-ganador').forEach(radio => {
      radio.addEventListener('change', () => _onGanadorChange(radio));
    });

    _actualizarTotalesTabla();
  }

  function _renderFila(producto, provNombres) {
    const key = _keyProducto(producto);
    const cantDisp = parseFloat(producto.cantidad_disponible ?? producto.cantidad ?? 0);
    const ganadorActual = state.seleccionados[key];

    let mejorPrecio = null;
    let mejorProvId = null;

    provNombres.forEach(pv => {
      const precio = parseFloat(state.cotizaciones[key]?.[pv.id] ?? 0);
      if (precio > 0 && (mejorPrecio === null || precio < mejorPrecio)) {
        mejorPrecio = precio;
        mejorProvId = pv.id;
      }
    });

    const celdas = provNombres.map(pv => {
      const val = state.cotizaciones[key]?.[pv.id] ?? 0;
      const esMejor = pv.id === mejorProvId && mejorPrecio !== null;
      const subtotalCelda = val > 0 ? _fmt(parseFloat(val) * cantDisp) : '—';

      return `
        <td class="text-center align-middle cot-celda ${esMejor ? 'table-success' : ''}">
          <div class="d-flex flex-column gap-1">
            <span class="fw-bold">${val > 0 ? '$' + _fmt(val) : '—'}</span>
            <small class="text-muted subtotal-celda">${subtotalCelda !== '—' ? '$' + subtotalCelda : '—'}</small>
          </div>
        </td>`;
    }).join('');

    const opcionesGanador = provNombres.map(pv => {
      const precio = parseFloat(state.cotizaciones[key]?.[pv.id] ?? 0);
      const checked = ganadorActual === pv.id ? 'checked' : '';
      const disabled = precio <= 0 ? 'disabled' : '';
      const esMejor = pv.id === mejorProvId && mejorPrecio !== null;
      return `
        <div class="form-check mb-1">
          <input class="form-check-input radio-ganador" type="radio"
                 name="ganador_${_esc(key)}"
                 id="rad_${_esc(key)}_${pv.id}"
                 value="${pv.id}"
                 data-key="${_esc(key)}"
                 ${checked} ${disabled}>
          <label class="form-check-label small ${esMejor ? 'fw-bold text-success' : ''}"
                 for="rad_${_esc(key)}_${pv.id}">
            ${_esc(pv.nombre)}
            ${esMejor ? '<i class="bi bi-star-fill text-warning ms-1"></i>' : ''}
          </label>
        </div>`;
    }).join('');

    let subtotalGanador = 0;
    if (ganadorActual) {
      const precioGanador = parseFloat(state.cotizaciones[key]?.[ganadorActual] ?? 0);
      subtotalGanador = precioGanador * cantDisp;
    }

    const tieneGanador = !!ganadorActual;

    return `
      <tr class="cot-row ${tieneGanador ? 'table-light' : ''}" data-key="${_esc(key)}">
        <td>
          <div class="fw-semibold small">${_esc(producto.descripcion ?? '')}</div>
          <small class="text-muted">${_esc(producto.unidad ?? '')}</small>
        </td>
        <td class="text-center">
          <span class="badge bg-secondary">${_esc(producto.unidad ?? 'UND')}</span>
        </td>
        <td class="text-center fw-bold">${cantDisp.toFixed(2)}</td>
        ${celdas}
        <td class="align-middle">
          <div class="px-1" id="opciones_ganador_${_esc(key)}">
            ${opcionesGanador.length > 0 ? opcionesGanador : '<small class="text-muted">Sin precios</small>'}
          </div>
        </td>
        <td class="text-end fw-bold subtotal-ganador" id="subtotal_ganador_${_esc(key)}">
          ${tieneGanador ? '$' + _fmt(subtotalGanador) : '<span class="text-muted">—</span>'}
        </td>
      </tr>`;
  }

  /* ── Manejadores de evento ───────────────────────────────────── */

  function _onGanadorChange(radio) {
    const key = radio.dataset.key;
    const provId = parseInt(radio.value);
    state.seleccionados[key] = provId;

    const precio = parseFloat(state.cotizaciones[key]?.[provId] ?? 0);
    const cantidad = _getCantidadByKey(key);
    const subtotalEl = document.getElementById(`subtotal_ganador_${key}`);
    if (subtotalEl) {
      subtotalEl.innerHTML = precio > 0
        ? `$${_fmt(precio * cantidad)}`
        : '<span class="text-muted">—</span>';
    }

    _actualizarTotalesTabla();
    _actualizarResumenCotizacion();
  }

  function _actualizarTotalesTabla() {
    let total = 0;
    let count = 0;

    state.productos.forEach(p => {
      const key = _keyProducto(p);
      const ganadorId = state.seleccionados[key];
      if (!ganadorId) return;
      const precio = parseFloat(state.cotizaciones[key]?.[ganadorId] ?? 0);
      const cantidad = parseFloat(p.cantidad_disponible ?? p.cantidad ?? 0);
      if (precio > 0) {
        total += precio * cantidad;
        count++;
      }
    });

    const elTotal = document.getElementById('cotTotalSubtotal');
    const elGeneral = document.getElementById('cotTotalGeneral');
    if (elTotal) elTotal.textContent = '$' + _fmt(total);
    if (elGeneral) {
      elGeneral.textContent = `${count} de ${state.productos.length} asignados`;
    }
  }

  function _actualizarResumenCotizacion() {
    const resumen = document.getElementById('resumenCotizacion');
    if (!resumen) return;

    const total = state.productos.length;
    const asignados = Object.keys(state.seleccionados).length;
    const faltantes = total - asignados;

    let totalImporte = 0;
    state.productos.forEach(p => {
      const key = _keyProducto(p);
      const ganadorId = state.seleccionados[key];
      if (!ganadorId) return;
      const precio = parseFloat(state.cotizaciones[key]?.[ganadorId] ?? 0);
      const cantidad = parseFloat(p.cantidad_disponible ?? p.cantidad ?? 0);
      totalImporte += precio * cantidad;
    });

    const pct = total > 0 ? Math.round((asignados / total) * 100) : 0;
    const colorBarra = pct === 100 ? 'bg-success' : pct > 50 ? 'bg-warning' : 'bg-danger';

    resumen.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-1">
        <small class="text-muted">Recursos asignados: <strong>${asignados}/${total}</strong></small>
        <small class="fw-bold text-primary">$${_fmt(totalImporte)}</small>
      </div>
      <div class="progress" style="height:6px;">
        <div class="progress-bar ${colorBarra}" style="width:${pct}%"></div>
      </div>
      ${faltantes > 0 ? `<small class="text-warning mt-1 d-block"><i class="bi bi-exclamation-triangle"></i> ${faltantes} recurso(s) sin asignar</small>` : ''}`;

    const btnConfirmar = document.getElementById('btnConfirmarCotizacion');
    if (btnConfirmar) {
      btnConfirmar.disabled = asignados === 0;
    }
  }

  /* ── Confirmación y agrupación por proveedor ─────────────────── */

  function confirmarCotizacion() {
    if (Object.keys(state.seleccionados).length === 0) {
      _showToast('Asigne al menos un proveedor a un recurso', 'warning');
      return;
    }

    const grupos = {};

    state.productos.forEach(p => {
      const key = _keyProducto(p);
      const ganadorId = state.seleccionados[key];
      if (!ganadorId) return;

      const precio = parseFloat(state.cotizaciones[key]?.[ganadorId] ?? 0);
      const cantidad = parseFloat(p.cantidad_disponible ?? p.cantidad ?? 0);

      const provData = state.proveedores.find(pv => String(pv.id_provedor) === String(ganadorId));
      const idFinal = provData?.id_real_sistema || ganadorId; 

      if (!grupos[ganadorId]) {
        grupos[ganadorId] = {
          id_provedor: idFinal,
          nombre_proveedor: provData?.nombre || `Proveedor #${ganadorId}`,
          productos: []
        };
      }

      grupos[ganadorId].productos.push({
        ...p,
        precio_unitario_cotizado: precio,
        cantidad_comprar: cantidad,
        subtotal_cotizado: precio * cantidad
      });
    });

    const gruposArray = Object.values(grupos);

    if (typeof state.onConfirm === 'function') {
      state.onConfirm(gruposArray);
    }

    cerrar();
  }

  /* ── Helpers ─────────────────────────────────────────────────── */

  function _keyProducto(p) {
    const id = Array.isArray(p.id_det_pedido) ? p.id_det_pedido[0] : p.id_det_pedido;
    return String(id ?? p.id_componente ?? p.descripcion ?? Math.random());
  }

  function _getCantidadByKey(key) {
    const p = state.productos.find(pr => _keyProducto(pr) === key);
    return parseFloat(p?.cantidad_disponible ?? p?.cantidad ?? 0);
  }

  function _getNombreProveedor(id) {
    const pv = state.proveedores.find(p => p.id_provedor === id || p.id_provedor === String(id));
    return pv?.nombre ?? `Proveedor #${id}`;
  }

  function _fmt(n) {
    return parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _showToast(msg, type = 'info') {
    if (typeof OrdenesCompraUI !== 'undefined' && typeof OrdenesCompraUI.showToast === 'function') {
      OrdenesCompraUI.showToast(msg, type);
    } else {
      console.log(`[CotizacionModal] ${type}: ${msg}`);
    }
  }


  /* ── Auto-selección del mejor precio ───────────────────────────── */
  function _autoSeleccionarMejores() {
    let cambios = 0;
    state.productos.forEach(p => {
      const key = _keyProducto(p);
      let mejorPrecio = null;
      let mejorProvId = null;

      state.proveedoresSeleccionados.forEach(id => {
        const precio = parseFloat(state.cotizaciones[key]?.[id] ?? 0);
        if (precio > 0 && (mejorPrecio === null || precio < mejorPrecio)) {
          mejorPrecio = precio;
          mejorProvId = id;
        }
      });

      if (mejorProvId !== null) {
        state.seleccionados[key] = mejorProvId;
        // Marcar el radio
        const radio = document.getElementById(`rad_${key}_${mejorProvId}`);
        if (radio) radio.checked = true;
        // Actualizar subtotal
        const cantidad = _getCantidadByKey(key);
        const subtotalEl = document.getElementById(`subtotal_ganador_${key}`);
        if (subtotalEl) {
          subtotalEl.innerHTML = `$${_fmt(mejorPrecio * cantidad)}`;
        }
        cambios++;
      }
    });

    _actualizarTotalesTabla();
    _actualizarResumenCotizacion();

    if (cambios > 0) {
      _showToast(`Se seleccionó el mejor precio para ${cambios} recurso(s)`, 'success');
    } else {
      _showToast('Ingresa precios primero para poder auto-seleccionar', 'warning');
    }
  }

  /* ── Exportar API pública ────────────────────────────────────── */
  return {
    init,
    abrir,
    cerrar,
    confirmarCotizacion,
    _autoSeleccionarMejores,
    cargarDetalleCotizacionSeleccionada
  };
})();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', CotizacionModal.init);
} else {
  CotizacionModal.init();
}

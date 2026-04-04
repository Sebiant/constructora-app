/**
 * cotizacionesPedido.js
 * Gestión de cotizaciones desde el módulo de Pedidos.
 * Responsabilidades:
 *   - Abrir modal de cotizaciones para un pedido dado
 *   - Exportar plantilla Excel (llama a exportarCotizacion.php)
 *   - Importar Excel llenado, parsear con SheetJS y guardar en BD
 *   - Listar / eliminar cotizaciones existentes del pedido
 */

const CotizacionesPedido = (() => {
  const API_COT    = '/sgigescon/src/Cotizacion/Interfaces/CotizacionController.php';
  const API_EXPORT = '/sgigescon/src/OrdenesCompra/Interfaces/Views/exportarCotizacion.php';

  let _idPedidoActual  = null;
  let _nombrePedido    = '';
  let _modal           = null;
  let _proveedoresDB   = [];  // Lista de proveedores del sistema para matching

  /* ── Inicializar ─────────────────────────────────────────────── */
  function init() {
    const el = document.getElementById('modalCotizacionesPedido');
    if (el && window.bootstrap) {
      _modal = new bootstrap.Modal(el);
    }

    document.getElementById('btnExportarPlantillaPedido')
      ?.addEventListener('click', _exportarPlantilla);

    document.getElementById('inputSubirCotizacion')
      ?.addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        if (f) _importarExcel(f);
        e.target.value = '';
      });
  }

  /* ── API pública ─────────────────────────────────────────────── */

  /**
   * Abrir el modal para un pedido específico.
   * @param {number} idPedido
   * @param {string} nombrePedido  Etiqueta descriptiva del pedido
   * @param {Array}  proveedoresDB Lista de proveedores activos del sistema
   */
  function abrir(idPedido, nombrePedido, proveedoresDB = []) {
    _idPedidoActual = idPedido;
    _nombrePedido   = nombrePedido;
    _proveedoresDB  = proveedoresDB;

    const labelEl = document.getElementById('labelNomPedidoCot');
    if (labelEl) labelEl.textContent = `Pedido #${idPedido} — ${nombrePedido}`;

    _cargarListaCotizaciones();

    if (_modal) _modal.show();
  }

  /* ── Export ──────────────────────────────────────────────────── */
  function _exportarPlantilla() {
    if (!_idPedidoActual) {
      _toast('No hay pedido seleccionado', 'warning');
      return;
    }
    window.open(`${API_EXPORT}?id_pedido=${_idPedidoActual}`, '_blank');
    _toast('Descargando plantilla Excel…', 'info');
  }

  /* ── Import Excel → Parse → Guardar en BD ────────────────────── */
  function _importarExcel(file) {
    if (typeof XLSX === 'undefined') {
      _toast('La librería XLSX no está disponible', 'danger');
      return;
    }

    const labelBtn = document.querySelector('label[for="inputSubirCotizacion"]');
    if (labelBtn) {
      labelBtn.classList.add('disabled');
      labelBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Procesando…';
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data  = new Uint8Array(e.target.result);
        const wb    = XLSX.read(data, { type: 'array' });
        const ws    = wb.Sheets[wb.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const payload = _parsearFilasExcel(filas);
        if (!payload) return; // _parsearFilasExcel ya mostró el error

        await _guardarEnBD(payload);

      } catch (err) {
        _toast('Error al leer el archivo: ' + err.message, 'danger');
      } finally {
        if (labelBtn) {
          labelBtn.classList.remove('disabled');
          labelBtn.innerHTML = '<i class="bi bi-file-earmark-arrow-up me-1"></i>2. Importar precios (Excel)';
        }
      }
    };
    reader.onerror = () => {
      _toast('Error al leer el archivo', 'danger');
      if (labelBtn) {
        labelBtn.classList.remove('disabled');
        labelBtn.innerHTML = '<i class="bi bi-file-earmark-arrow-up me-1"></i>2. Importar precios (Excel)';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Parsea las filas del Excel exportado por exportarCotizacion.php.
   * Estructura esperada:
   *   Fila 1 (idx 0): Título
   *   Fila 2 (idx 1): Instrucciones
   *   Fila 3 (idx 2): Encabezados (ID_INTERNO | TIPO | DESC | UNIDAD | CANT | spacer | PROVEEDOR 1 merge | ... )
   *   Fila 4 (idx 3): Sub-encabezados (blancos para fijas | NOMBRE DEL PROVEEDOR | PRECIO_UNITARIO | ...)
   *   Fila 5+ (idx 4+): Datos  — col 0 = id_det_pedido, col 6,8,10... = nombre prov, col 7,9,11... = precio
   *
   * @returns {Object|null}  Payload para importarCotizacion o null si hay error
   */
  function _parsearFilasExcel(filas) {
    if (!filas || filas.length < 5) {
      _toast('El archivo no tiene el formato correcto de la plantilla de cotización.', 'warning');
      return null;
    }

    // Fila 4 (idx 3): nombres de proveedor en columnas 6, 8, 10 … (0-indexed)
    const filaNombres = filas[3];
    const FIXED = 6;  // columnas fijas antes de los proveedores

    // Detectar proveedores por pares (nombre, precio)
    const proveedoresExcel = [];
    for (let c = FIXED; c < filaNombres.length; c += 2) {
      const nombreRaw = String(filaNombres[c] ?? '').trim();
      if (!nombreRaw ||
          nombreRaw.toUpperCase() === 'NOMBRE DEL PROVEEDOR' ||
          nombreRaw.toUpperCase() === 'NOMBRE_PROVEEDOR') {
        continue;  // slot vacío, omitir
      }

      const idProvDB = _matchProveedor(nombreRaw);
      proveedoresExcel.push({
        colNombre:       c,
        colPrecio:       c + 1,
        nombre_proveedor: nombreRaw,
        id_provedor:     idProvDB,
        precios:         {}    // { id_det_pedido: precio }
      });
    }

    if (proveedoresExcel.length === 0) {
      _toast(
        'No se encontraron proveedores. Escribe el nombre del proveedor en la fila 4 (celdas amarillas) del Excel.',
        'warning'
      );
      return null;
    }

    // Leer filas de datos
    let filasLeidas = 0;
    for (let r = 4; r < filas.length; r++) {
      const fila = filas[r];
      if (!fila || fila.every(c => c === '')) continue;

      const idDetRaw = String(fila[0] ?? '').trim();
      if (!idDetRaw || isNaN(parseInt(idDetRaw))) continue;

      const idDet = parseInt(idDetRaw);
      filasLeidas++;

      proveedoresExcel.forEach(pv => {
        const precioRaw = fila[pv.colPrecio];
        const precio = parseFloat(String(precioRaw).replace(/,/g, '.'));
        if (!isNaN(precio) && precio > 0) {
          pv.precios[idDet] = precio;
        }
      });
    }

    if (filasLeidas === 0) {
      _toast('No se encontraron filas de recursos en el archivo.', 'warning');
      return null;
    }

    // Verificar que al menos hay un precio
    const totalPrecios = proveedoresExcel.reduce((s, pv) => s + Object.keys(pv.precios).length, 0);
    if (totalPrecios === 0) {
      _toast('No se encontraron precios en el archivo. Asegúrate de llenar las columnas de precio.', 'warning');
      return null;
    }

    // Construir payload
    return {
      id_pedido:    _idPedidoActual,
      nombre:       `Cotización Excel — ${new Date().toLocaleDateString('es-MX')}`,
      observaciones: `Importada desde archivo Excel. ${proveedoresExcel.length} proveedor(es), ${totalPrecios} precio(s).`,
      proveedores:  proveedoresExcel.map(pv => ({
        nombre_proveedor: pv.nombre_proveedor,
        id_provedor:      pv.id_provedor,
        precios:          pv.precios
      }))
    };
  }

  /* ── Guardar cotización en BD ────────────────────────────────── */
  async function _guardarEnBD(payload) {
    try {
      const resp = await fetch(`${API_COT}?action=importarCotizacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();

      if (!result.success) throw new Error(result.error || 'Error al guardar');

      _toast(`✅ ${result.mensaje}`, 'success');
      _cargarListaCotizaciones();   // Refrescar lista

    } catch (err) {
      _toast('Error al guardar la cotización: ' + err.message, 'danger');
    }
  }

  /* ── Cargar lista de cotizaciones del pedido ─────────────────── */
  async function _cargarListaCotizaciones() {
    if (!_idPedidoActual) return;

    const contenedor = document.getElementById('listaCotizacionesPedido');
    const badge      = document.getElementById('badgeTotalCotizaciones');
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary"></div>
        <span class="ms-2 text-muted">Cargando…</span>
      </div>`;

    try {
      const resp   = await fetch(`${API_COT}?action=getCotizacionesByPedido&id_pedido=${_idPedidoActual}`);
      const result = await resp.json();

      if (!result.success) throw new Error(result.error);

      const cots = result.data || [];
      if (badge) badge.textContent = cots.length;

      if (cots.length === 0) {
        contenedor.innerHTML = `
          <div class="text-center text-muted py-4">
            <i class="bi bi-inbox display-4 opacity-50"></i>
            <p class="mt-2">No hay cotizaciones para este pedido</p>
            <small>Exporta la plantilla, llénala y súbela para crear la primera cotización.</small>
          </div>`;
        return;
      }

      contenedor.innerHTML = cots.map(c => _renderTarjetaCotizacion(c)).join('');

      // Bindear botones de eliminar
      contenedor.querySelectorAll('.btn-eliminar-cot').forEach(btn => {
        btn.addEventListener('click', () => _eliminarCotizacion(btn.dataset.id, btn.dataset.nombre));
      });

    } catch (err) {
      contenedor.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
  }

  function _renderTarjetaCotizacion(c) {
    const fecha = c.fechareg ? new Date(c.fechareg).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—';

    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body py-3">
          <div class="d-flex align-items-center gap-3 flex-wrap">
            <div class="flex-grow-1">
              <div class="fw-semibold">
                <i class="bi bi-clipboard2-check text-success me-1"></i>${_esc(c.nombre)}
              </div>
              <small class="text-muted">
                Creada: ${fecha} ·
                <strong>${c.total_proveedores ?? 0}</strong> proveedor(es) ·
                <strong>${c.total_recursos_cotizados ?? 0}</strong> recurso(s) con precio
              </small>
            </div>
            <div class="d-flex gap-2">
              <span class="badge ${c.estado === 'activa' ? 'bg-success' : 'bg-secondary'} rounded-pill">
                ${c.estado}
              </span>
              <button type="button"
                      class="btn btn-sm btn-outline-danger btn-eliminar-cot"
                      data-id="${c.id_cotizacion}"
                      data-nombre="${_esc(c.nombre)}"
                      title="Eliminar cotización">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ── Eliminar cotización ─────────────────────────────────────── */
  async function _eliminarCotizacion(idCot, nombre) {
    if (!confirm(`¿Eliminar la cotización "${nombre}"?\nEsta acción no se puede deshacer.`)) return;

    try {
      const resp = await fetch(
        `${API_COT}?action=eliminarCotizacion&id_cotizacion=${idCot}`,
        { method: 'POST' }  // POST para que el CSRF no sea problema
      );
      const result = await resp.json();
      if (!result.success) throw new Error(result.error);
      _toast('Cotización eliminada', 'success');
      _cargarListaCotizaciones();
    } catch (err) {
      _toast('Error: ' + err.message, 'danger');
    }
  }

  /* ── Helpers ─────────────────────────────────────────────────── */

  /** Busca el id_provedor en el catálogo del sistema por nombre (exact o parcial) */
  function _matchProveedor(nombre) {
    if (!nombre || !_proveedoresDB.length) return null;
    const n = nombre.trim().toLowerCase();
    const exacto = _proveedoresDB.find(p => p.nombre?.toLowerCase() === n);
    if (exacto) return exacto.id_provedor;
    const parcial = _proveedoresDB.find(p =>
      p.nombre?.toLowerCase().includes(n) || n.includes(p.nombre?.toLowerCase() ?? '')
    );
    return parcial?.id_provedor ?? null;
  }

  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _toast(msg, type = 'info') {
    // Intentar usar toast del sistema si está disponible
    if (typeof OrdenesCompraUI !== 'undefined' && OrdenesCompraUI.showToast) {
      OrdenesCompraUI.showToast(msg, type);
      return;
    }
    // Fallback: alert simple
    if (type === 'danger' || type === 'warning') {
      console.warn('[CotizacionesPedido]', msg);
    } else {
      console.log('[CotizacionesPedido]', msg);
    }
    // Si existe un contenedor de toasts en la vista
    const toastContainer = document.getElementById('toastContainer') ||
                           document.querySelector('.toast-container');
    if (!toastContainer) return;

    const id   = 'toast_' + Date.now();
    const colors = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning text-dark', info: 'bg-info text-dark' };
    const div  = document.createElement('div');
    div.innerHTML = `
      <div id="${id}" class="toast ${colors[type] ?? 'bg-secondary'} text-white align-items-center border-0"
           role="alert" data-bs-autohide="true" data-bs-delay="5000">
        <div class="d-flex">
          <div class="toast-body small">${_esc(msg)}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`;
    toastContainer.appendChild(div.firstElementChild);
    const toastEl = document.getElementById(id);
    new bootstrap.Toast(toastEl).show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }

  /* ── Auto-init ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init, abrir };
})();

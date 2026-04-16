// Control de debounce para evitar demasiadas peticiones a BD al tipear
let _carritoSaveTimer = null;
const CARRITO_DEBOUNCE_MS = 800; // Esperar 800ms tras el último cambio antes de guardar en BD

// ============================================================================
// FUNCIONES DE PERSISTENCIA EN BASE DE DATOS
// El carrito funciona exclusivamente con la base de datos para soporte multi-dispositivo.
// ============================================================================

/**
 * Construye el array de items del carrito en formato para BD
 */
function _buildCarritoItemsParaBD() {
  const mapaItems = new Map(); // key: "comp_item"

  // Vista agrupada: componentesAgrupados -> items_que_usan
  if (itemsData?.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach(comp => {
      if (comp.items_que_usan && Array.isArray(comp.items_que_usan)) {
        comp.items_que_usan.forEach(itemUso => {
          const cantidad = parseFloat(itemUso.pedido_actual) || 0;
          const key = `${comp.id_componente}_${itemUso.id_item}`;
          if (!mapaItems.has(key) || cantidad > 0) {
            mapaItems.set(key, {
              id_componente: comp.id_componente,
              id_item: itemUso.id_item,
              cantidad: cantidad,
              tipo_vista: 'agrupada'
            });
          }
        });
      } else if ((parseFloat(comp.pedido) || 0) > 0) {
        // Componente sin desglose por item
        const key = `${comp.id_componente}_null`;
        mapaItems.set(key, {
          id_componente: comp.id_componente,
          id_item: null,
          cantidad: parseFloat(comp.pedido) || 0,
          tipo_vista: 'agrupada'
        });
      }
    });
  }

  // Vista individual: itemsIndividuales -> componentes
  if (itemsData?.itemsIndividuales) {
    itemsData.itemsIndividuales.forEach(item => {
      if (!item.componentes) return;
      item.componentes.forEach(comp => {
        const cantidad = parseFloat(comp.pedido) || 0;
        const key = `${comp.id_componente}_${item.id_item}`;
        if (cantidad > 0) {
          mapaItems.set(key, {
            id_componente: comp.id_componente,
            id_item: item.id_item,
            cantidad: cantidad,
            tipo_vista: 'individual'
          });
        } else if (!mapaItems.has(key)) {
          mapaItems.set(key, {
            id_componente: comp.id_componente,
            id_item: item.id_item,
            cantidad: 0,
            tipo_vista: 'individual'
          });
        }
      });
    });
  }

  return Array.from(mapaItems.values());
}

/**
 * Guarda el carrito actual exclusivamente en la Base de Datos.
 * Usa debounce para evitar múltiples peticiones al tipear rápido.
 */
function guardarCarritoEnStorage() {
  if (_carritoSaveTimer) clearTimeout(_carritoSaveTimer);
  _carritoSaveTimer = setTimeout(() => {
    _guardarCarritoEnBD();
  }, CARRITO_DEBOUNCE_MS);
}

/**
 * Persistencia en BD (asíncrono, no bloqueante)
 */
async function _guardarCarritoEnBD() {
  const presupuestoId = seleccionActual?.datos?.presupuestoId;
  if (!presupuestoId) return;

  const items = _buildCarritoItemsParaBD();
  const extras = (materialesExtra || []).concat(pedidosFueraPresupuesto || []);

  console.log('%c[CarritoBD] Guardando estado actual...', 'color: #007bff; font-weight: bold;', {
    id_presupuesto: presupuestoId,
    comp_count: items.length,
    extra_count: extras.length,
    data: { items, extras }
  });

  try {
    const response = await fetch(`${API_PRESUPUESTOS}?action=guardarCarritoBD`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_presupuesto: presupuestoId,
        items: items
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log(`[CarritoBD] Guardado en BD exitosamente`);
    } else {
      console.warn('[CarritoBD] Error guardando en BD:', result.error);
    }

    // Guardar también extras
    const tieneExtras = (materialesExtra && materialesExtra.length > 0) ||
                        (pedidosFueraPresupuesto && pedidosFueraPresupuesto.length > 0);
    if (tieneExtras) {
      _guardarCarritoExtrasEnBD();
    }

  } catch (error) {
    console.warn('[CarritoBD] Error de red guardando carrito:', error);
  }
}

/**
 * Guarda los extras del carrito
 */
async function _guardarCarritoExtrasEnBD() {
  const presupuestoId = seleccionActual?.datos?.presupuestoId;
  if (!presupuestoId) return;

  try {
    const response = await fetch(`${API_PRESUPUESTOS}?action=guardarCarritoExtraBD`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_presupuesto: presupuestoId,
        materialesExtra: materialesExtra || [],
        pedidosFueraPresupuesto: pedidosFueraPresupuesto || []
      })
    });

    const result = await response.json();
    if (!result.success) {
      console.warn('[CarritoBD] Error guardando extras en BD:', result.error);
    }
  } catch (error) {
    console.warn('[CarritoBD] Error de red guardando extras:', error);
  }
}

/**
 * Carga el carrito desde la Base de Datos para el presupuesto actual.
 */
async function cargarCarritoDesdeDB(presupuestoId) {
  if (!presupuestoId) return false;

  try {
    console.log('[CarritoBD] Cargando carrito desde BD para presupuesto:', presupuestoId);

    const response = await fetch(`${API_PRESUPUESTOS}?action=cargarCarritoBD&id_presupuesto=${presupuestoId}`);
    const result = await response.json();

    if (!result.success) {
      console.warn('[CarritoBD] Error cargando desde BD:', result.error);
      return false;
    }

    const itemsCarrito = result.carrito || [];
    const itemsExtras  = result.extras  || [];

    if (itemsCarrito.length === 0 && itemsExtras.length === 0) {
      console.log('[CarritoBD] Carrito vacío en BD');
      return false;
    }

    // Aplicar cantidades sobre componentesAgrupados
    if (itemsData?.componentesAgrupados) {
      itemsCarrito.forEach(row => {
        const comp = itemsData.componentesAgrupados.find(
          c => String(c.id_componente) === String(row.id_componente)
        );
        if (comp) {
          if (row.id_item && comp.items_que_usan) {
            const itemUso = comp.items_que_usan.find(
              i => String(i.id_item) === String(row.id_item)
            );
            if (itemUso) {
              itemUso.pedido_actual = parseFloat(row.cantidad) || 0;
            }
          } else {
            comp.pedido = parseFloat(row.cantidad) || 0;
          }
        }
      });
    }

    // Aplicar cantidades sobre itemsIndividuales
    if (itemsData?.itemsIndividuales) {
      itemsCarrito.forEach(row => {
        if (!row.id_item) return;
        const item = itemsData.itemsIndividuales.find(
          i => String(i.id_item) === String(row.id_item)
        );
        if (item && item.componentes) {
          const comp = item.componentes.find(
            c => String(c.id_componente) === String(row.id_componente)
          );
          if (comp) {
            comp.pedido = parseFloat(row.cantidad) || 0;
          }
        }
      });
    }

    // Restaurar extras
    if (result.extras) {
        materialesExtra.length = 0;
        pedidosFueraPresupuesto.length = 0;

        itemsExtras.forEach(e => {
            if (e.tipo === 'material_extra') {
                materialesExtra.push(e.datos_json);
            } else {
                pedidosFueraPresupuesto.push(e.datos_json);
            }
        });
    }

    if (itemsData?.componentesAgrupados && itemsData?.itemsIndividuales) {
      sincronizarDatosEntreVistas();
    }

    console.log('[CarritoBD] Carrito cargado exitosamente');
    return true;

  } catch (error) {
    console.error('[CarritoBD] Error de red cargando carrito:', error);
    return false;
  }
}

/**
 * Limpia el carrito exclusivamente de la BD.
 */
async function limpiarCarritoStorage() {
  const presupuestoId = seleccionActual?.datos?.presupuestoId;
  if (!presupuestoId) return;

  try {
    const response = await fetch(`${API_PRESUPUESTOS}?action=limpiarCarritoBD`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_presupuesto: presupuestoId })
    });
    const result = await response.json();
    if (result.success) {
      console.log('[CarritoBD] Carrito eliminado de BD');
    }
  } catch (error) {
    console.warn('[CarritoBD] Error al limpiar carrito de BD:', error);
  }
}

/**
 * Función de interfaz para vaciar el carrito con confirmación del usuario.
 */
async function vaciarCarritoUI() {
  if (!confirm("¿Está seguro de que desea vaciar completamente el carrito? Esta acción no se puede deshacer.")) {
    return;
  }

  const btn = document.getElementById("btnVaciarCarrito");
  const originalHtml = btn ? btn.innerHTML : null;
  
  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Vaciando...';
    }

    // 1. Limpiar en Base de Datos
    await limpiarCarritoStorage();

    // 2. Limpiar en Memoria
    materialesExtra.length = 0;
    pedidosFueraPresupuesto.length = 0;

    if (itemsData.componentesAgrupados) {
      itemsData.componentesAgrupados.forEach(c => {
        c.pedido = 0;
        if (c.items_que_usan) {
          c.items_que_usan.forEach(i => { i.pedido_actual = 0; });
        }
      });
    }

    if (itemsData.itemsIndividuales) {
      itemsData.itemsIndividuales.forEach(item => {
        if (item.componentes) {
          item.componentes.forEach(c => { c.pedido = 0; });
        }
      });
    }

    // 3. Actualizar UI
    filtrarMaterialesPedido();
    actualizarEstadisticas();
    renderMaterialesExtraCard();

    alert("El carrito se ha vaciado correctamente.");

  } catch (error) {
    console.error("[Carrito] Error al vaciar:", error);
    alert("Hubo un error al intentar vaciar el carrito.");
  } finally {
    if (btn) {
      btn.innerHTML = originalHtml;
      // El estado disabled se recalculará en actualizarEstadisticas
    }
  }
}

/**
 * Elimina un ítem específico del carrito.
 * @param {string} idComponente ID del componente (puede ser string 'null')
 * @param {string} idItem ID del ítem (puede ser string 'null')
 * @param {string|null} tipoExtra Tipo de extra (material_extra, pedido_fuera o null)
 * @param {number|null} indexExtra Índice en el array de extras si aplica
 */
async function eliminarItemCarrito(idComponente, idItem, tipoExtra = 'null', indexExtra = null) {
  // Normalizar valores 'null' de string a null real
  const compId = idComponente === 'null' ? null : idComponente;
  const itemId = idItem === 'null' ? null : idItem;
  const extraType = tipoExtra === 'null' ? null : tipoExtra;

  console.log(`[Carrito] Eliminando ítem: Comp=${compId}, Item=${itemId}, TipoExtra=${extraType}`);

  // 1. ELIMINAR EXTRAS
  if (extraType === 'material_extra' && indexExtra !== null) {
    if (materialesExtra[indexExtra]) {
      materialesExtra[indexExtra].en_pedido_actual = false;
      materialesExtra[indexExtra].cantidad = 0;
      // Opcional: eliminar del array si prefieres no mantenerlo
      materialesExtra.splice(indexExtra, 1);
    }
  } 
  else if (extraType === 'pedido_fuera' && indexExtra !== null) {
    if (pedidosFueraPresupuesto[indexExtra]) {
      pedidosFueraPresupuesto.splice(indexExtra, 1);
    }
  }
  // 2. ELIMINAR ÍTEMS NORMALES
  else {
    // Buscar en componentesAgrupados
    if (itemsData.componentesAgrupados) {
      const comp = itemsData.componentesAgrupados.find(c => String(c.id_componente) === String(compId));
      if (comp) {
        if (itemId && comp.items_que_usan) {
          const u = comp.items_que_usan.find(i => String(i.id_item) === String(itemId));
          if (u) u.pedido_actual = 0;
        } else {
          comp.pedido = 0;
        }
      }
    }

    // Buscar en itemsIndividuales (sincronizar)
    if (itemsData.itemsIndividuales && itemId) {
      const item = itemsData.itemsIndividuales.find(i => String(i.id_item) === String(itemId));
      if (item && item.componentes) {
        const c = item.componentes.find(comp => String(comp.id_componente) === String(compId));
        if (c) c.pedido = 0;
      }
    }
  }

  // 3. Persistir en Base de Datos
  // guardarCarritoEnStorage ya tiene el debounce y usa _guardarCarritoEnBD
  guardarCarritoEnStorage();

  // 4. Actualizar Interfaz
  filtrarMaterialesPedido();
  actualizarEstadisticas();
  renderMaterialesExtraCard();
  
  // Si estamos en la vista de ítems, el input correspondiente debe resetearse visualmente
  const input = document.querySelector(`input[data-componente-id="${compId}"][data-item-id="${itemId}"]`);
  if (input) input.value = 0;
  
  const inputAgrupado = document.querySelector(`input.cantidad-pedido[data-componente-id="${compId}"]`);
  if (inputAgrupado && !itemId) inputAgrupado.value = 0;
}




// ============================================================================
// SISTEMA DE ANEXOS/ARCHIVOS ADJUNTOS PARA COMPONENTES
// ============================================================================
// Permite adjuntar archivos (PDF, Word, imágenes) a componentes específicos
// Los archivos se guardan en: uploads/pedidos_anexos/{proyecto_id}/{presupuesto_id}/

/**
 * Abre el modal para gestionar anexos de un componente
 * @param {string} componenteId - ID del componente
 * @param {string} nombreComponente - Nombre para mostrar
 * @param {string} tipoVista - 'agrupada' o 'individual'
 * @param {string|null} itemId - ID del item (solo para vista individual)
 */
function abrirModalAnexos(componenteId, nombreComponente, tipoVista, itemId) {
  const modal = document.getElementById('modalAnexosComponente');
  if (!modal) {
    console.error('[Anexos] Modal no encontrado');
    return;
  }

  modal.dataset.componenteId = componenteId;
  modal.dataset.tipoVista = tipoVista;
  modal.dataset.itemId = itemId || '';

  const titulo = document.getElementById('tituloModalAnexos');
  if (titulo) {
    titulo.textContent = `Anexos: ${nombreComponente}`;
  }

  cargarListaAnexos(componenteId, tipoVista, itemId);

  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

/**
 * Carga la lista de anexos de un componente
 */
function cargarListaAnexos(componenteId, tipoVista, itemId) {
  const container = document.getElementById('listaAnexosComponente');
  if (!container) return;

  const anexos = obtenerAnexosComponente(componenteId, tipoVista, itemId);

  if (anexos.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-paperclip fs-1"></i>
        <p class="mt-2">No hay anexos para este componente</p>
        <small class="text-muted">Suba PDF, Word o imágenes para describir el pedido</small>
      </div>
    `;
    return;
  }

  let html = '<div class="list-group">';
  anexos.forEach((anexo, index) => {
    const icono = obtenerIconoPorExtension(anexo.extension);
    const fecha = new Date(anexo.fecha_subida).toLocaleString('es-ES');

    html += `
      <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <i class="bi ${icono} fs-4 me-3 text-primary"></i>
          <div>
            <div class="fw-semibold">${anexo.nombre_original}</div>
            <small class="text-muted">${fecha} · ${formatearTamanio(anexo.tamanio)}</small>
            ${anexo.descripcion ? `<div class="small text-muted mt-1">${anexo.descripcion}</div>` : ''}
          </div>
        </div>
        <div class="btn-group">
          <a href="${anexo.ruta_archivo}" target="_blank" class="btn btn-sm btn-outline-primary" title="Ver archivo">
            <i class="bi bi-eye"></i>
          </a>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarAnexoComponente('${componenteId}', ${index}, '${tipoVista}', '${itemId || ''}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Obtiene los anexos de un componente específico
 */
function obtenerAnexosComponente(componenteId, tipoVista, itemId) {
  if (!itemsData) return [];

  if (tipoVista === 'individual' && itemId) {
    const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemId));
    if (!item || !item.componentes) return [];

    const componente = item.componentes.find(c => String(c.id_componente) === String(componenteId));
    return componente?.anexos || [];
  } else {
    const componente = itemsData.componentesAgrupados?.find(c => String(c.id_componente) === String(componenteId));
    return componente?.anexos || [];
  }
}

/**
 * Guarda un anexo en un componente
 */
function guardarAnexoEnComponente(componenteId, anexoData, tipoVista, itemId) {
  if (!itemsData) return false;

  if (tipoVista === 'individual' && itemId) {
    const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemId));
    if (!item || !item.componentes) return false;

    const componente = item.componentes.find(c => String(c.id_componente) === String(componenteId));
    if (!componente) return false;

    if (!componente.anexos) componente.anexos = [];
    componente.anexos.push(anexoData);
  } else {
    const componente = itemsData.componentesAgrupados?.find(c => String(c.id_componente) === String(componenteId));
    if (!componente) return false;

    if (!componente.anexos) componente.anexos = [];
    componente.anexos.push(anexoData);
  }

  sincronizarAnexoEntreVistas(componenteId, anexoData, tipoVista, itemId);
  return true;
}

/**
 * Elimina un anexo de un componente (BD y servidor)
 */
function eliminarAnexoComponente(componenteId, indexAnexo, tipoVista, itemId) {
  if (!confirm('¿Está seguro de eliminar este anexo?')) return;

  const anexos = obtenerAnexosComponente(componenteId, tipoVista, itemId);
  if (!anexos || anexos.length <= indexAnexo) return;

  const anexo = anexos[indexAnexo];

  // Llamar al backend para eliminar de BD y servidor
  fetch(`${API_PRESUPUESTOS}?action=eliminarAnexoComponente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_anexo: anexo.id_anexo,
      ruta_archivo: anexo.ruta_archivo,
      presupuesto_id: seleccionActual?.datos?.presupuestoId,
      item_id: itemId
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      console.log('[Anexos] Eliminado de BD:', result.id_anexo);
    } else {
      console.warn('[Anexos] Error del servidor:', result.error);
    }
  })
  .catch(err => console.error('[Anexos] Error eliminando:', err));

  // Eliminar del estado local
  if (tipoVista === 'individual' && itemId) {
    const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemId));
    if (item && item.componentes) {
      const componente = item.componentes.find(c => String(c.id_componente) === String(componenteId));
      if (componente && componente.anexos) {
        componente.anexos.splice(indexAnexo, 1);
      }
    }
  } else {
    const componente = itemsData.componentesAgrupados?.find(c => String(c.id_componente) === String(componenteId));
    if (componente && componente.anexos) {
      componente.anexos.splice(indexAnexo, 1);
    }
  }

  guardarCarritoEnStorage();
  cargarListaAnexos(componenteId, tipoVista, itemId);
  actualizarIndicadorAnexos(componenteId, tipoVista, itemId);

  console.log('[Anexos] Anexo eliminado:', anexo.nombre_original);
}

/**
 * Sincroniza un anexo entre vistas (agrupada e individual)
 */
function sincronizarAnexoEntreVistas(componenteId, anexoData, tipoVistaOrigen, itemIdOrigen) {
  if (!itemsData) return;

  if (tipoVistaOrigen === 'agrupada') {
    const compAgrupado = itemsData.componentesAgrupados?.find(c => String(c.id_componente) === String(componenteId));
    if (!compAgrupado || !compAgrupado.items_que_usan) return;

    compAgrupado.items_que_usan.forEach(uso => {
      const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(uso.id_item));
      if (!item || !item.componentes) return;

      item.componentes.forEach(comp => {
        const esMismoComponente =
          (uso.id_componente_original && String(comp.id_componente) === String(uso.id_componente_original)) ||
          (comp.descripcion && compAgrupado.nombre_componente && comp.descripcion === compAgrupado.nombre_componente);

        if (esMismoComponente) {
          if (!comp.anexos) comp.anexos = [];
          const existe = comp.anexos.some(a => a.ruta_archivo === anexoData.ruta_archivo);
          if (!existe) {
            comp.anexos.push({ ...anexoData });
          }
        }
      });
    });
  } else if (tipoVistaOrigen === 'individual' && itemIdOrigen) {
    const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemIdOrigen));
    if (!item || !item.componentes) return;

    const compIndividual = item.componentes.find(c => String(c.id_componente) === String(componenteId));
    if (!compIndividual) return;

    itemsData.componentesAgrupados?.forEach(compAgrupado => {
      const esMismoComponente =
        compIndividual.descripcion && compAgrupado.nombre_componente &&
        compIndividual.descripcion === compAgrupado.nombre_componente;

      if (esMismoComponente && compAgrupado.items_que_usan) {
        const uso = compAgrupado.items_que_usan.find(u => String(u.id_item) === String(itemIdOrigen));
        if (uso) {
          if (!compAgrupado.anexos) compAgrupado.anexos = [];
          const existe = compAgrupado.anexos.some(a => a.ruta_archivo === anexoData.ruta_archivo);
          if (!existe) {
            compAgrupado.anexos.push({ ...anexoData });
          }
        }
      }
    });
  }
}

/**
 * Actualiza el indicador visual de anexos en la UI
 */
function actualizarIndicadorAnexos(componenteId, tipoVista, itemId) {
  const anexos = obtenerAnexosComponente(componenteId, tipoVista, itemId);
  const badge = document.querySelector(`[data-anexo-badge="${componenteId}"]`);

  if (badge) {
    if (anexos.length > 0) {
      badge.textContent = anexos.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

/**
 * Maneja la subida de archivos desde el input file
 */
function manejarSubidaArchivos(input) {
  const modal = document.getElementById('modalAnexosComponente');
  if (!modal) return;

  const componenteId = modal.dataset.componenteId;
  const tipoVista = modal.dataset.tipoVista;
  const itemId = modal.dataset.itemId || null;

  const files = input.files;
  if (!files || files.length === 0) return;

  const descripcion = document.getElementById('descripcionAnexo')?.value || '';
  const progressContainer = document.getElementById('progressSubidaAnexos');
  const progressBar = document.getElementById('progressBarAnexos');

  if (progressContainer) progressContainer.style.display = 'block';

  let procesados = 0;
  const total = files.length;

  Array.from(files).forEach((file) => {
    subirArchivoComponente(file, componenteId, tipoVista, itemId, descripcion)
      .then(() => {
        procesados++;
        if (progressBar) {
          progressBar.style.width = `${(procesados / total) * 100}%`;
          progressBar.textContent = `${Math.round((procesados / total) * 100)}%`;
        }

        if (procesados === total) {
          setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
            if (progressBar) progressBar.style.width = '0%';
            input.value = '';
            document.getElementById('descripcionAnexo').value = '';
          }, 500);
        }
      })
      .catch(error => {
        console.error('[Anexos] Error subiendo archivo:', error);
        alert(`Error al subir ${file.name}: ${error.message}`);
        procesados++;
      });
  });
}

/**
 * Sube un archivo al servidor y guarda en BD
 */
async function subirArchivoComponente(file, componenteId, tipoVista, itemId, descripcion) {
  const proyectoId = seleccionActual?.datos?.proyectoId;
  const presupuestoId = seleccionActual?.datos?.presupuestoId;

  if (!proyectoId || !presupuestoId) {
    throw new Error('No hay proyecto o presupuesto seleccionado');
  }

  if (!itemId) {
    // Para vista agrupada, necesitamos encontrar un item que use este componente
    const compAgrupado = itemsData.componentesAgrupados?.find(c => String(c.id_componente) === String(componenteId));
    if (compAgrupado?.items_que_usan?.length > 0) {
      itemId = compAgrupado.items_que_usan[0].id_item;
    }
  }

  if (!itemId) {
    throw new Error('No se pudo determinar el item para asociar el anexo');
  }

  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('proyecto_id', proyectoId);
  formData.append('presupuesto_id', presupuestoId);
  formData.append('componente_id', componenteId);
  formData.append('item_id', itemId);
  formData.append('descripcion', descripcion);
  formData.append('id_usuario', 1); // TODO: Obtener usuario actual

  const response = await fetch(`${API_PRESUPUESTOS}?action=subirAnexoComponente`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Error en la respuesta del servidor');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Error al subir archivo');
  }

  const anexoData = {
    id_anexo: result.id_anexo,
    nombre_original: result.nombre_original || file.name,
    ruta_archivo: result.ruta_archivo,
    extension: result.extension,
    tamanio: result.tamanio || file.size,
    descripcion: descripcion || result.descripcion,
    fecha_subida: result.fecha_subida || new Date().toISOString(),
    tipo_vista_origen: tipoVista,
    item_id_origen: itemId
  };

  guardarAnexoEnComponente(componenteId, anexoData, tipoVista, itemId);
  guardarCarritoEnStorage();
  cargarListaAnexos(componenteId, tipoVista, itemId);
  actualizarIndicadorAnexos(componenteId, tipoVista, itemId);

  console.log('[Anexos] Archivo subido y guardado en BD:', file.name, 'ID:', result.id_anexo);
  return result;
}

/**
 * Obtiene el icono de Bootstrap según la extensión del archivo
 */
function obtenerIconoPorExtension(extension) {
  const iconos = {
    'pdf': 'bi-file-earmark-pdf',
    'doc': 'bi-file-earmark-word',
    'docx': 'bi-file-earmark-word',
    'xls': 'bi-file-earmark-excel',
    'xlsx': 'bi-file-earmark-excel',
    'ppt': 'bi-file-earmark-ppt',
    'pptx': 'bi-file-earmark-ppt',
    'jpg': 'bi-file-earmark-image',
    'jpeg': 'bi-file-earmark-image',
    'png': 'bi-file-earmark-image',
    'gif': 'bi-file-earmark-image',
    'bmp': 'bi-file-earmark-image',
    'zip': 'bi-file-earmark-zip',
    'rar': 'bi-file-earmark-zip',
    'txt': 'bi-file-earmark-text',
    'csv': 'bi-file-earmark-spreadsheet'
  };
  return iconos[extension?.toLowerCase()] || 'bi-file-earmark';
}

/**
 * Formatea el tamaño del archivo en bytes a legible
 */
function formatearTamanio(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Carga los anexos desde la base de datos para un presupuesto
 * y los asigna a los componentes correspondientes
 */
async function cargarAnexosDesdeBD(presupuestoId) {
  try {
    console.log('[Anexos] Cargando anexos desde BD para presupuesto:', presupuestoId);

    const response = await fetch(`${API_PRESUPUESTOS}?action=obtenerAnexosComponente&presupuesto_id=${presupuestoId}`);
    const result = await response.json();

    if (!result.success) {
      console.warn('[Anexos] Error cargando desde BD:', result.error);
      return;
    }

    const anexosOrganizados = result.anexos_organizados || {};
    let totalAsignados = 0;

    // Asignar anexos a componentes en items individuales
    if (itemsData?.itemsIndividuales) {
      itemsData.itemsIndividuales.forEach(item => {
        if (!item.componentes) return;

        item.componentes.forEach(comp => {
          const key = `${item.id_item}_${comp.id_componente}`;
          if (anexosOrganizados[key]) {
            comp.anexos = anexosOrganizados[key];
            totalAsignados += anexosOrganizados[key].length;
          } else {
            comp.anexos = [];
          }
        });
      });
    }

    // Asignar anexos a componentes agrupados (copiar desde los items)
    if (itemsData?.componentesAgrupados) {
      itemsData.componentesAgrupados.forEach(comp => {
        if (!comp.items_que_usan || comp.items_que_usan.length === 0) {
          comp.anexos = [];
          return;
        }

        // Tomar los anexos del primer item que use este componente
        const primerUso = comp.items_que_usan[0];
        const key = `${primerUso.id_item}_${comp.id_componente}`;

        if (anexosOrganizados[key]) {
          comp.anexos = anexosOrganizados[key];
        } else {
          comp.anexos = [];
        }
      });
    }

    console.log(`[Anexos] Cargados ${result.total} anexos de BD, asignados a ${totalAsignados} componentes`);

    // Guardar en localStorage para persistencia offline
    guardarCarritoEnStorage();

  } catch (error) {
    console.error('[Anexos] Error cargando anexos desde BD:', error);
  }
}

var proyectosData = [];
var itemsData = { componentesAgrupados: [], itemsIndividuales: [] };
var materialesExtra = [];
var pedidosFueraPresupuesto = [];
var seleccionActual = null;

// Variable de estado para la vista actual: 'productos' o 'items'
var vistaActualPedido = 'productos';

// Control de peticiones concurrentes para evitar condiciones de carrera al cambiar proyecto
var _presupuestosAbortController = null;
var _presupuestosRequestToken = 0;

function resetarGestion() {
  itemsData = { componentesAgrupados: [], itemsIndividuales: [] };
  seleccionActual = null;
  pedidosFueraPresupuesto = [];
  materialesExtra = [];

  const projectInfo = document.getElementById("projectInfo");
  if (projectInfo) projectInfo.style.display = "none";

  const materialesList = document.getElementById("materialesList");
  if (materialesList) {
    materialesList.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-inbox display-4"></i>
        <p class="mt-3">Seleccione un proyecto y presupuesto para ver los materiales</p>
      </div>
    `;
  }

  const contadorMateriales = document.getElementById("contadorMateriales");
  if (contadorMateriales) contadorMateriales.textContent = "0 materiales";

  const cardExtras = document.getElementById("cardExtras");
  if (cardExtras) cardExtras.style.display = "none";

  const materialesExtraList = document.getElementById("materialesExtraList");
  if (materialesExtraList) materialesExtraList.innerHTML = "";
}

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
    if (!materialesList || !materialesList.parentNode) return;

    const existente = document.getElementById("paginacionContainer");
    if (existente) return;

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
    if (!document.getElementById("paginacionContainer")) {
      this.crearControlesPaginacion();
    }
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

    const elDesde = document.getElementById("paginacionDesde");
    const elHasta = document.getElementById("paginacionHasta");
    const elTotal = document.getElementById("paginacionTotal");
    if (!elDesde || !elHasta || !elTotal) {
      return;
    }

    if (totalItems > 0) {
      elDesde.textContent = inicio;
      elHasta.textContent = fin;
    } else {
      elDesde.textContent = "0";
      elHasta.textContent = "0";
    }
    elTotal.textContent = totalItems;

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
            <span class="btn btn-sm btn-outline-secondary ms-1 disabled" style="cursor: default; opacity: 0.7;" title="Total anexos del componente (gestión en filas individuales)">
              <i class="bi bi-paperclip"></i>
              <span class="badge bg-primary ms-1" data-anexo-badge="${comp.id_componente}" style="display: ${comp.anexos?.length > 0 ? 'inline-block' : 'none'}">${comp.anexos?.length || 0}</span>
            </span>
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
                      <th class="text-center bg-secondary text-white">Comprado</th>
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
                        <strong>${parseFloat(comp.ya_comprado || 0).toFixed(4)}</strong>
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
                  ${parseFloat(yaPedido) > 0 ? `<br><strong>Total pedido (sin rechazados): ${parseFloat(yaPedido).toFixed(4)} ${unidad}</strong>` : ''}
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
                        <button class="btn btn-sm btn-outline-success mb-1" type="button" data-action="max-item" title="Máxima cantidad">
                          <i class="bi bi-plus-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" type="button" onclick="abrirModalAnexos('${comp.id_componente}', '${comp.nombre_componente.replace(/'/g, "\\'")}', 'agrupada')" title="Anexos">
                          <i class="bi bi-paperclip"></i>
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

  // Guardar carrito en localStorage
  guardarCarritoEnStorage();
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

var paginador = new PaginadorPresupuestos();

function toggleDesglose(itemId) {
  const desglose = document.getElementById(`desglose-${itemId}`);
  const button = document.querySelector(
    `[onclick="toggleDesglose(${itemId})"]`
  );

  if (desglose.style.display === "none") {
    desglose.style.display = "block";
    button.textContent = "Ocultar";

    const item = (itemsData.itemsIndividuales || itemsData).find((m) => m.id_item == itemId);
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
  const item = (itemsData.itemsIndividuales || itemsData).find((m) => m.id_item == itemId);
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
  const item = (itemsData.itemsIndividuales || itemsData).find((m) => m.id_item == itemId);
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
  const item = (itemsData.itemsIndividuales || itemsData).find((m) => m.id_item == itemId);
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

// Inicialización: se ejecuta directamente (no usa DOMContentLoaded porque
// cuando el componente se carga vía AJAX/innerHTML, ese evento ya se disparó)
function _initPedidoComponent() {
  if (typeof PROYECTO_ID !== 'undefined' && PROYECTO_ID > 0) {
    inicializarProyecto();
    cargarUnidades();
    cargarTiposMaterial();
    resetarGestion();


    setTimeout(() => {
      paginador.inicializar();
      const paginacionContainer = document.getElementById("paginacionContainer");
      if (paginacionContainer) {
        paginacionContainer.style.display = "none";
      }
    }, 100);

    // Crear modal de anexos si no existe
    crearModalAnexos();
  }
}

/**
 * Crea el modal HTML para gestión de anexos dinámicamente
 */
function crearModalAnexos() {
  if (document.getElementById('modalAnexosComponente')) return;

  const modalHTML = `
    <div class="modal fade" id="modalAnexosComponente" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="tituloModalAnexos">
              <i class="bi bi-paperclip me-2"></i>Anexos del Componente
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <!-- Formulario de subida -->
            <div class="card mb-3">
              <div class="card-header bg-light">
                <strong><i class="bi bi-cloud-upload me-2"></i>Subir Nuevos Archivos</strong>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="descripcionAnexo" class="form-label">Descripción (opcional):</label>
                  <textarea class="form-control form-control-sm" id="descripcionAnexo" rows="2"
                    placeholder="Describa el contenido de los archivos o información relevante del pedido..."></textarea>
                </div>
                <div class="mb-2">
                  <label for="inputArchivosAnexo" class="form-label">Seleccionar archivos:</label>
                  <input type="file" class="form-control form-control-sm" id="inputArchivosAnexo" multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar,.txt,.csv"
                    onchange="manejarSubidaArchivos(this)">
                  <div class="form-text">
                    Formatos permitidos: PDF, Word, Excel, PowerPoint, imágenes, ZIP, TXT.<br>
                    Tamaño máximo: 10MB por archivo.
                  </div>
                </div>
                <!-- Barra de progreso -->
                <div id="progressSubidaAnexos" style="display: none;">
                  <div class="progress" style="height: 25px;">
                    <div id="progressBarAnexos" class="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar" style="width: 0%">0%</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Lista de anexos existentes -->
            <div class="card">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <strong><i class="bi bi-folder me-2"></i>Archivos Adjuntos</strong>
                <span class="badge bg-secondary" id="contadorAnexos">0</span>
              </div>
              <div class="card-body p-0">
                <div id="listaAnexosComponente" style="max-height: 300px; overflow-y: auto;">
                  <!-- Los anexos se cargan dinámicamente -->
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="bi bi-x-lg me-1"></i>Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insertar al final del body
  const div = document.createElement('div');
  div.innerHTML = modalHTML;
  document.body.appendChild(div.firstElementChild);

  console.log('[Anexos] Modal creado exitosamente');
}

// Inicializar proyecto usando PROYECTO_ID pasado desde PHP
function inicializarProyecto() {
  // Guardar en proyectosData para compatibilidad
  proyectosData = [{ id_proyecto: PROYECTO_ID, nombre: PROYECTO_NOMBRE }];

  // Cargar presupuestos inmediatamente
  cargarPresupuestos();
}

async function cargarPresupuestos() {
  const proyectoId = PROYECTO_ID;

  // Cancelar cualquier petición de presupuestos anterior (evita condición de carrera al cambiar proyecto)
  if (_presupuestosAbortController) {
    _presupuestosAbortController.abort();
  }
  _presupuestosAbortController = new AbortController();
  const miToken = ++_presupuestosRequestToken;

  const selectPresupuesto = document.getElementById("selectPresupuesto");
  const projectInfo = document.getElementById("projectInfo");

  if (!selectPresupuesto) return; // El componente ya no está en el DOM

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
          signal: _presupuestosAbortController.signal,
        }
      );

      // Si llegó una petición más reciente, ignorar esta respuesta
      if (miToken !== _presupuestosRequestToken) return;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al cargar presupuestos`);
      }

      const rawText = await response.text();

      // Verificar nuevamente por si cambió mientras parseábamos
      if (miToken !== _presupuestosRequestToken) return;

      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        console.error('Respuesta no-JSON al cargar presupuestos. Preview:', rawText?.slice(0, 300));
        throw new Error('Respuesta inválida del servidor (no es JSON). Revise logs del servidor.');
      }

      if (!result?.success) throw new Error(result?.error || result?.message || 'No se pudieron cargar los presupuestos');

      const presupuestos = result?.data || result?.presupuestos || [];

      // Verificar que el DOM aun tenga el select del proyecto correcto
      const selectActual = document.getElementById("selectPresupuesto");
      if (!selectActual) return;

      selectActual.innerHTML =
        '<option value="">-- Seleccionar Presupuesto --</option>';

      if (Array.isArray(presupuestos) && presupuestos.length > 0) {
        selectActual.disabled = false;
        presupuestos.forEach((presupuesto) => {
          const option = document.createElement("option");
          option.value = presupuesto.id_presupuesto;
          option.textContent = `${presupuesto.nombre || presupuesto.codigo || ('Presupuesto ' + presupuesto.id_presupuesto)
            } - ${presupuesto.nombre_proyecto || 'Sin proyecto'} - $${parseFloat(presupuesto.monto_total || 0).toLocaleString()}`;
          option.setAttribute("data-presupuesto", JSON.stringify(presupuesto));
          selectActual.appendChild(option);
        });
      } else {
        selectActual.disabled = true;
        selectActual.innerHTML =
          '<option value="">No hay presupuestos para este proyecto</option>';
      }
    } catch (error) {
      // Ignorar errores de peticiones canceladas (AbortError)
      if (error.name === 'AbortError') {
        console.log('[Pedidos] Petición de presupuestos cancelada (cambio de proyecto)');
        return;
      }

      if (miToken !== _presupuestosRequestToken) return;

      console.error("Error cargando presupuestos:", error);
      alert("Error al cargar los presupuestos: " + error.message);

      const selectActual = document.getElementById("selectPresupuesto");
      if (selectActual) {
        selectActual.disabled = true;
        selectActual.innerHTML =
          '<option value="">Error al cargar presupuestos</option>';
      }
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

      const rawPres = selectedOption.getAttribute("data-presupuesto");
      const presupuesto = rawPres ? JSON.parse(rawPres) : null;
      const proyectoId = PROYECTO_ID;
      const proyecto = proyectosData.find((p) => p.id_proyecto == proyectoId) || null;

      const proyectoNombre = proyecto?.nombre || PROYECTO_NOMBRE || '';

      const items = await cargarItemsPresupuesto(presupuestoId);
      await cargarCapitulosParaFiltro(presupuestoId);

      itemsData = items;
      seleccionActual = {
        proyecto: proyectoNombre,
        presupuesto: presupuesto?.nombre || presupuesto?.codigo || `Presupuesto ${presupuestoId}`,
        capitulo: "Todos los capítulos",
        datos: { proyectoId, presupuestoId, capituloId: null, presupuesto: presupuesto || {} },
      };

      document.getElementById(
        "currentSelectionInfo"
      ).textContent = `${seleccionActual.proyecto} - ${seleccionActual.presupuesto}`;
      document.getElementById("btnAgregarExtra").disabled = false;
      const btnResumen = document.getElementById("btnVerResumen");
      if (btnResumen) {
        btnResumen.disabled = false;
      }
      document.getElementById("filterCapitulo").disabled = false;



      mostrarItemsConComponentes(items);

      // Cargar anexos desde la base de datos
      await cargarAnexosDesdeBD(presupuestoId);

      // Cargar carrito desde Base de Datos (persistencia mutli-dispositivo)
      const carritoEncontrado = await cargarCarritoDesdeDB(presupuestoId);
      if (carritoEncontrado) {
        console.log('[CarritoBD] Carrito de BD aplicado, actualizando UI...');
      }
      
      // Aplicar filtros o renderizar vista limpia
      setTimeout(filtrarMaterialesPedido, 0);


      actualizarEstadisticas();
      mostrarInformacionProyecto(proyecto || { nombre: proyectoNombre }, presupuesto || {});

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
      existente.ya_comprado = (parseFloat(existente.ya_comprado) || 0) + (parseFloat(comp.ya_comprado) || 0);
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
          ya_comprado: parseFloat(comp.ya_comprado) || 0,

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

        if (partes.length < 11) {
          console.warn("Detalle serializado incompleto:", partes);
          return null;
        }

        return {
          id_item: partes[0]?.trim() || null,
          codigo_item: partes[1]?.trim() || "N/A",
          nombre_item: partes[2]?.trim() || "N/A",
          id_capitulo: partes[3]?.trim() || null,
          nombre_capitulo: partes[4]?.trim() || "N/A",
          cantidad_por_unidad: parseFloat(partes[5]) || 0,
          unidad_componente: partes[6]?.trim() || "UND",
          unidad_item: partes[7]?.trim() || "UND",
          cantidad_item_presupuesto: parseFloat(partes[8]) || 0,
          cantidad_componente: parseFloat(partes[9]) || 0,
          pedido_actual: 0,
          ya_pedido_item: parseFloat(partes[10]) || 0,
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
                <p class="mt-3">No hay recursos en este presupuesto/capítulo</p>
            </div>
        `;
    document.getElementById("contadorMateriales").textContent = "0 recursos";

    const paginacionContainer = document.getElementById("paginacionContainer");
    if (paginacionContainer) paginacionContainer.style.display = "none";
    return;
  }

  paginador.configurar(componentesAgrupados);
  const paginacionContainer = document.getElementById("paginacionContainer");
  if (paginacionContainer) paginacionContainer.style.display = "flex";

  document.getElementById(
    "contadorMateriales"
  ).textContent = `${componentesAgrupados.length} recursos`;
}

function mostrarErrorItems() {
  const container = document.getElementById("materialesList");
  container.innerHTML = `
    <div class="text-center text-danger py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="mt-3">Error al cargar los recursos del presupuesto</p>
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
  const totalItems = Array.isArray(itemsData)
    ? itemsData.length
    : (Array.isArray(itemsData?.itemsIndividuales) ? itemsData.itemsIndividuales.length : 0);
  document.getElementById("infoItems").textContent = totalItems;
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

  // Procesar vista de productos agrupados
  if (itemsData && itemsData.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach((componente) => {
      if (componente.pedido > 0) {
        componentesSeleccionados++;
        totalCantidad += componente.pedido;
        valorTotal += componente.pedido * componente.precio_unitario;
      }
    });
  }

  // Procesar vista de items individuales
  if (itemsData && itemsData.itemsIndividuales && Array.isArray(itemsData.itemsIndividuales)) {
    itemsData.itemsIndividuales.forEach((item) => {
      if (!item.componentes || !Array.isArray(item.componentes)) return;
      item.componentes.forEach((componente) => {
        const cantidadPedido = parseFloat(componente.pedido) || 0;
        if (cantidadPedido > 0) {
          componentesSeleccionados++;
          totalCantidad += cantidadPedido;
          valorTotal += cantidadPedido * (parseFloat(componente.precio_unitario) || 0);
        }
      });
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
  const btnVaciar = document.getElementById("btnVaciarCarrito");
  
  const haySeleccion = componentesSeleccionados > 0 || 
                      (pedidosFueraPresupuesto && pedidosFueraPresupuesto.length > 0) ||
                      (materialesExtra && materialesExtra.length > 0);

  if (btnConfirmar) {
    btnConfirmar.disabled = !haySeleccion;
  }
  
  if (btnVaciar) {
    btnVaciar.disabled = !haySeleccion;
  }


  renderResumenCarrito();
}

function renderResumenCarrito() {
  const container = document.getElementById('resumenCarritoList');
  if (!container) return;

  const itemsCarrito = [];
  const itemsFueraPresupuesto = [];

  // Determinar qué vista está activa
  const vistaActual = window.vistaActualPedido || 'productos';

  // Procesar según la vista activa
  if (vistaActual === 'items') {
    // Vista por items - solo procesar itemsIndividuales
    if (itemsData && Array.isArray(itemsData.itemsIndividuales)) {
      itemsData.itemsIndividuales.forEach((item) => {
        if (!Array.isArray(item.componentes)) return;
        item.componentes.forEach((componente) => {
          const cantidad = parseFloat(componente.pedido) || 0;
          if (cantidad <= 0) return;

          const precio = parseFloat(componente.precio_unitario) || 0;
          itemsCarrito.push({
            id_componente: componente.id_componente,
            id_item: item.id_item,
            tipo_extra: null,
            titulo: `${item.codigo_item} - ${componente.descripcion || componente.nombre_componente}`,
            detalle: item.nombre_item,
            unidad: componente.unidad || 'UND',
            cantidad,
            subtotal: cantidad * precio,
          });
        });
      });
    }
  } else {
    // Vista por productos (agrupada) - solo procesar componentesAgrupados
    if (itemsData && Array.isArray(itemsData.componentesAgrupados)) {
      itemsData.componentesAgrupados.forEach((componente) => {
        if (!Array.isArray(componente.items_que_usan)) return;
        componente.items_que_usan.forEach((item) => {
          const cantidad = parseFloat(item.pedido_actual) || 0;
          if (cantidad <= 0) return;

          const precio = parseFloat(componente.precio_unitario) || 0;
          itemsCarrito.push({
            id_componente: componente.id_componente,
            id_item: item.id_item,
            tipo_extra: null,
            titulo: `${item.codigo_item} - ${componente.nombre_componente}`,
            detalle: item.nombre_item,
            unidad: componente.unidad_componente || componente.unidad || 'UND',
            cantidad,
            subtotal: cantidad * precio,
          });
        });
      });
    }
  }

  if (Array.isArray(materialesExtra) && materialesExtra.length > 0) {
    materialesExtra.forEach((extra, idx) => {
      if (!extra || extra.en_pedido_actual !== true) return;
      const cantidad = parseFloat(extra.cantidad) || 0;
      if (cantidad <= 0) return;
      const precio = parseFloat(extra.precio_unitario) || 0;
      itemsCarrito.push({
        id_componente: null,
        id_item: null,
        tipo_extra: 'material_extra',
        index_extra: idx,
        titulo: `${extra.codigo || 'EXTRA'} - ${extra.descripcion || ''}`,
        detalle: 'Material extra',
        unidad: extra.unidad || 'UND',
        cantidad,
        subtotal: cantidad * precio,
      });
    });
  }

  if (Array.isArray(pedidosFueraPresupuesto) && pedidosFueraPresupuesto.length > 0) {
    pedidosFueraPresupuesto.forEach((p, idx) => {
      if (!p) return;
      const cantidad = parseFloat(p.cantidad_extra ?? p.cantidad_solicitada ?? 0) || 0;
      if (cantidad <= 0) return;
      const precio = parseFloat(p.precio_unitario) || 0;
      itemsFueraPresupuesto.push({
        id_componente: p.id_componente,
        id_item: p.id_item,
        tipo_extra: 'pedido_fuera',
        index_extra: idx,
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
      <div class="text-muted small text-center py-3">
        <i class="bi bi-cart"></i> Carrito vacío
      </div>
    `;
    return;
  }

  const total = itemsCarrito.reduce((sum, it) => sum + (parseFloat(it.subtotal) || 0), 0);
  const totalFuera = itemsFueraPresupuesto.reduce((sum, it) => sum + (parseFloat(it.subtotal) || 0), 0);

  const filas = itemsCarrito
    .sort((a, b) => (b.subtotal || 0) - (a.subtotal || 0))
    .slice(0, 10)
    .map((it) => {
      return `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="me-2" style="min-width: 0; flex-grow: 1;">
            <div class="small fw-semibold text-truncate" title="${it.titulo}">${it.titulo}</div>
            <div class="small text-muted text-truncate" style="font-size: 0.75rem;">${it.detalle}</div>
            <div class="small text-muted" style="font-size: 0.75rem;">${it.cantidad.toFixed(4)} ${it.unidad} x $${formatCurrency(it.subtotal/it.cantidad)}</div>
          </div>
          <div class="d-flex align-items-center">
            <div class="small fw-bold text-end me-2">$${formatCurrency(it.subtotal)}</div>
            <button class="btn btn-sm btn-link text-danger p-0" 
                    onclick="eliminarItemCarrito('${it.id_componente}', '${it.id_item}', '${it.tipo_extra}', ${it.index_extra ?? 'null'})"
                    title="Eliminar ítem">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  const extraCount = Math.max(0, itemsCarrito.length - 10);

  const filasFuera = itemsFueraPresupuesto
    .sort((a, b) => (b.subtotal || 0) - (a.subtotal || 0))
    .slice(0, 5)
    .map((it) => {
      return `
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

function renderMaterialesExtraCard() {
  const container = document.getElementById('materialesExtraList');
  if (!container) return;

  const cardExtras = document.getElementById('cardExtras');
  if (cardExtras) {
    cardExtras.style.display = materialesExtra.length > 0 ? '' : 'none';
  }

  if (!Array.isArray(materialesExtra) || materialesExtra.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-3">No hay materiales extra registrados.</div>';
    return;
  }

  container.innerHTML = materialesExtra
    .map((m, idx) => {
      const codigo = m.codigo || '';
      const descripcion = m.descripcion || '';
      const unidad = m.unidad || 'UND';
      const cantidad = Number(m.cantidad || 0);
      const estado = String(m.estado || 'pendiente');
      const badge = obtenerClaseBadgeEstadoMaterial(estado);
      const capitulo = m.nombre_capitulo || 'N/A';
      const justificacion = m.justificacion ? String(m.justificacion) : '';
      return `
        <div class="border rounded p-2 mb-2" style="background:#fff;">
          <div class="d-flex justify-content-between align-items-start">
            <div class="me-2" style="min-width:0;">
              <div class="fw-semibold text-truncate">${codigo} - ${descripcion}</div>
              <div class="small text-muted">${capitulo}</div>
              <div class="small">${cantidad.toFixed(4)} ${unidad} <span class="${badge}">${estado}</span></div>
              ${justificacion ? `<div class="small text-muted text-truncate">${justificacion}</div>` : ''}
            </div>
            <div class="text-end">
              <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarMaterialExtra(${idx})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function mostrarModalNuevoItem() {
  try {
    if (!seleccionActual?.datos?.presupuestoId) {
      alert('Seleccione un presupuesto primero');
      return;
    }

    const selectMaterial = document.getElementById('selectMaterial');
    if (selectMaterial) {
      selectMaterial.onchange = onMaterialSeleccionado;
    }

    materialSeleccionadoData = null;

    const preview = document.getElementById('vistaPreviewMaterial');
    if (preview) preview.style.display = 'none';

    const cantidadEl = document.getElementById('cantidadMaterialExtra');
    if (cantidadEl) cantidadEl.value = '';

    const justifEl = document.getElementById('justificacionMaterial');
    if (justifEl) justifEl.value = '';

    const capEl = document.getElementById('capituloMaterialExtra');
    if (capEl) capEl.value = '';

    if (typeof cargarTodosMateriales === 'function') {
      cargarTodosMateriales();
    }
    if (typeof cargarCapitulosParaMaterialExtra === 'function') {
      cargarCapitulosParaMaterialExtra();
    }

    const modalEl = document.getElementById('modalNuevoItem');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (e) {
    console.error('Error abriendo modal de material extra:', e);
    alert('No se pudo abrir el formulario de material extra');
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

    // Guardar carrito en localStorage
    guardarCarritoEnStorage();
  }
}

function eliminarPedidoExtra(index) {
  if (confirm("¿Está seguro de cancelar este pedido fuera de presupuesto?")) {
    pedidosFueraPresupuesto.splice(index, 1);
    actualizarEstadisticas();
    if (typeof actualizarCarrito === 'function') {
      actualizarCarrito();
    }

    // Guardar carrito en localStorage
    guardarCarritoEnStorage();
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

    // Guardar carrito en localStorage
    guardarCarritoEnStorage();

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

  // Determinar qué vista está activa
  const vistaActual = window.vistaActualPedido || 'productos';

  if (vistaActual === 'items') {
    // VISTA POR ITEMS: Procesar solo itemsIndividuales
    if (itemsData.itemsIndividuales && Array.isArray(itemsData.itemsIndividuales)) {
      itemsData.itemsIndividuales.forEach((item) => {
        if (!item.componentes || !Array.isArray(item.componentes)) return;

        item.componentes.forEach((componente) => {
          const cantidadPedido = parseFloat(componente.pedido) || 0;
          if (cantidadPedido > 0) {
            componentesConPedido.push({
              id_componente: componente.id_componente,
              nombre_componente: componente.descripcion || componente.nombre_componente,
              tipo_componente: componente.tipo_componente || 'material',
              unidad_componente: componente.unidad || 'UND',
              precio_unitario: parseFloat(componente.precio_unitario) || 0,
              pedido: cantidadPedido,
              id_item: item.id_item,
              codigo_item: item.codigo_item,
              nombre_item: item.nombre_item,
              total_necesario: (parseFloat(componente.cantidad) || 0) * (parseFloat(item.cantidad) || 0),
            });
          }
        });
      });
    }
  } else {
    // VISTA POR PRODUCTOS (agrupada): Procesar solo componentesAgrupados
    if (itemsData.componentesAgrupados) {
      itemsData.componentesAgrupados.forEach((componente) => {
        // Verificar si hay pedidos en items individuales (desglose)
        if (componente.items_que_usan && Array.isArray(componente.items_que_usan)) {
          componente.items_que_usan.forEach((item) => {
            const cantidadItem = parseFloat(item.pedido_actual) || 0;
            if (cantidadItem > 0) {
              // Usar id_componente_original del item (preservado durante agrupación)
              const idComponenteParaGuardar = item.id_componente_original || componente.id_componente;

              componentesConPedido.push({
                id_componente: idComponenteParaGuardar,
                nombre_componente: componente.nombre_componente,
                tipo_componente: componente.tipo_componente,
                unidad_componente: componente.unidad_componente,
                precio_unitario: componente.precio_unitario,
                pedido: cantidadItem,
                id_item: item.id_item,
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
            id_item: null,
            total_necesario: componente.total_necesario,
            capitulos: componente.capitulos,
          });
        }
      });
    }
  }

  const datosPedido = {
    id_proyecto: PROYECTO_ID,
    id_presupuesto: seleccionActual.datos.presupuestoId,
    componentes: componentesConPedido,
    materiales_extra: materialesExtra,
    pedidos_fuera: pedidosFueraPresupuesto
  };

  console.log('%c[PedidoFinal] Payload para envío:', 'color: #fd7e14; font-weight: bold;', datosPedido);

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
        itemsData.componentesAgrupados.forEach((c) => {
          c.pedido = 0;
          // Limpiar también el desglose por item dentro del componente agrupado
          if (c.items_que_usan) {
            c.items_que_usan.forEach(i => { i.pedido_actual = 0; });
          }
        });
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


      // Limpiar carrito de BD y localStorage (persistencia multi-dispositivo)
      await limpiarCarritoStorage();

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

  // Guardar carrito en localStorage
  guardarCarritoEnStorage();
}

// FUNCIONES PARA RESUMEN Y EXPORTACIÓN
// ==============================================

function generarDatosResumenParaModal(pedidosHistorial = []) {
  const componentesPorItem = new Map();
  let valorTotalGlobal = 0;
  let totalComponentesContados = 0;
  let componentesCompletados = 0;

  const mapaEstados = construirMapaCantidadesPorEstadoDesdeHistorial(pedidosHistorial);

  if (!itemsData.componentesAgrupados) {
    return {
      totalItems: 0,
      totalComponentes: 0,
      componentesCompletados: 0,
      valorTotal: 0,
      componentesPorItem: []
    };
  }

  itemsData.componentesAgrupados.forEach((componente) => {
    if (!componente.items_que_usan || !Array.isArray(componente.items_que_usan)) {
      return;
    }

    componente.items_que_usan.forEach((item) => {
      const cantidadTotal = parseFloat(item.cantidad_componente) || 0;
      const yaPedido = parseFloat(item.ya_pedido_item ?? item.ya_pedido) || 0;
      const precioUnitario = parseFloat(componente.precio_unitario) || 0;

      const idItemKey = normalizarKeyItemId(item.id_item, item.codigo_item) || 'GLOBAL';
      const idCompKey = normalizarId(item.id_componente_original || componente.id_componente_unico || componente.id_componente) || '';
      const keyEspecifica = `${idItemKey}-${idCompKey}`;
      const keyGeneral = `GLOBAL-${idCompKey}`;

      const estadoInfo = mapaEstados.get(keyEspecifica) || mapaEstados.get(keyGeneral);
      const pedidoActual = ((estadoInfo?.normal?.aprobado || 0) + (estadoInfo?.normal?.pendiente || 0));

      const pendiente = Math.max(0, cantidadTotal - yaPedido - pedidoActual);
      const porcentaje = cantidadTotal > 0 ? (yaPedido / cantidadTotal) * 100 : 0;
      const subtotal = yaPedido * precioUnitario;

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

  if (Array.isArray(materialesExtra) && materialesExtra.length > 0) {
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

    const extrasCompradosMap = new Map();
    const extrasPendientesMap = new Map();
    if (Array.isArray(pedidosHistorial)) {
      pedidosHistorial.forEach((pedido) => {
        const estado = normalizarEstadoPedido(pedido.estado || pedido.estado_descripcion);
        if (!Array.isArray(pedido.detalles)) return;

        pedido.detalles.forEach((detalle) => {
          if (!detalle.id_material_extra) return;
          const codigoExtra = String(detalle.codigo_material_extra || '').trim();
          const nombreExtra = String(detalle.nombre_material_extra || '').trim();
          const key = codigoExtra || `MEP-${detalle.id_material_extra}`;
          const cantidad = parseFloat(detalle.cantidad) || 0;
          const precio = parseFloat(detalle.precio_unitario) || 0;
          if (cantidad <= 0) return;

          const base = {
            codigo: codigoExtra,
            nombre: nombreExtra,
            unidad: detalle.unidad_componente || detalle.unidad_item || 'UND',
            cantidad: 0,
            precio
          };

          if (estado === 'comprado') {
            const acumulado = extrasCompradosMap.get(key) || { ...base };
            acumulado.cantidad += cantidad;
            if (!acumulado.precio && precio) acumulado.precio = precio;
            if (!acumulado.codigo && codigoExtra) acumulado.codigo = codigoExtra;
            if (!acumulado.nombre && nombreExtra) acumulado.nombre = nombreExtra;
            extrasCompradosMap.set(key, acumulado);
          }

          if (estado === 'pendiente') {
            const acumulado = extrasPendientesMap.get(key) || { ...base };
            acumulado.cantidad += cantidad;
            if (!acumulado.precio && precio) acumulado.precio = precio;
            if (!acumulado.codigo && codigoExtra) acumulado.codigo = codigoExtra;
            if (!acumulado.nombre && nombreExtra) acumulado.nombre = nombreExtra;
            extrasPendientesMap.set(key, acumulado);
          }
        });
      });
    }

    materialesExtra.forEach((extra) => {
      if (!extra) return;
      const cantidad = parseFloat(extra.cantidad) || 0;
      const precio = parseFloat(extra.precio_unitario) || 0;

      const codigo = String(extra.codigo || extra.cod_material || '').trim();
      const key = codigo || `EXTRA-${Math.abs(hashCode(String(extra.descripcion || '')))}${Math.abs(hashCode(String(extra.justificacion || '')))}`;
      const compradoInfo = extrasCompradosMap.get(key);
      const pendienteInfo = extrasPendientesMap.get(key);
      const yaPedidoComprado = compradoInfo ? (parseFloat(compradoInfo.cantidad) || 0) : 0;
      const pedidoPendienteHistorial = pendienteInfo ? (parseFloat(pendienteInfo.cantidad) || 0) : 0;
      const precioFinal = parseFloat(compradoInfo?.precio) || precio;

      const pedidoActual = pedidoPendienteHistorial;

      materialesExtraItem.componentes.push({
        nombre: `${extra.codigo || ''} - ${extra.descripcion || ''}`.trim(),
        tipo: (extra.tipo_material || 'Material'),
        unidad: extra.unidad || 'UND',
        cantidadTotal: yaPedidoComprado,
        yaPedido: yaPedidoComprado,
        pedidoActual: pedidoActual,
        pendiente: 0,
        porcentaje: yaPedidoComprado > 0 ? 100 : 0,
        precioUnitario: precioFinal,
        subtotal: yaPedidoComprado * precioFinal
      });

      materialesExtraItem.valorTotal += yaPedidoComprado * precioFinal;
      materialesExtraItem.cantidadTotalGlobal += yaPedidoComprado;
      materialesExtraItem.cantidadCompletadaGlobal += yaPedidoComprado;
      valorTotalGlobal += yaPedidoComprado * precioFinal;
      totalComponentesContados++;
    });

    if (materialesExtraItem.componentes.length > 0) {
      materialesExtraItem.porcentajeGlobal = 100;
      componentesPorItem.set('EXTRA', materialesExtraItem);
    }
  }

  componentesPorItem.forEach((itemData) => {
    itemData.porcentajeGlobal = itemData.cantidadTotalGlobal > 0
      ? (itemData.cantidadCompletadaGlobal / itemData.cantidadTotalGlobal) * 100
      : 0;
  });

  return {
    totalItems: componentesPorItem.size,
    totalComponentes: totalComponentesContados,
    componentesCompletados: componentesCompletados,
    valorTotal: valorTotalGlobal,
    componentesPorItem: Array.from(componentesPorItem.values())
  };
}

/**
 * Abre el modal de resumen con vista unificada de materiales
 */
async function abrirModalResumen() {
  try {
    const presupuestoId = seleccionActual?.datos?.presupuestoId;
    const historialPedidos = typeof obtenerHistorialPedidos === 'function'
      ? await obtenerHistorialPedidos(presupuestoId)
      : [];
    const datosResumen = generarDatosResumenParaModal(historialPedidos);

    // Actualizar estadísticas generales
    const elTotalItems = document.getElementById('resumenTotalItems');
    const elTotalComponentes = document.getElementById('resumenTotalComponentes');
    const elCompletados = document.getElementById('resumenCompletados');

    const elValorTotal = document.getElementById('resumenValorTotal');

    if (elTotalItems) elTotalItems.textContent = datosResumen.totalItems || 0;
    if (elTotalComponentes) elTotalComponentes.textContent = datosResumen.totalComponentes || 0;
    if (elCompletados) elCompletados.textContent = datosResumen.componentesCompletados || 0;
    if (elValorTotal) elValorTotal.textContent = `$${(datosResumen.valorTotal || 0).toLocaleString('es-CO')}`;

    // Llenar tabla unificada
    const tablaResumen = document.getElementById('tablaResumenUnificada');
    if (!tablaResumen) {
      throw new Error('No se encontró la tabla del resumen (tablaResumenUnificada)');
    }

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
          const porcentaje = Number(comp.porcentaje) || 0;
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
              <td class="text-end">${(parseFloat(comp.cantidadTotal) || 0).toFixed(4)}</td>
              <td class="text-end text-primary">${(parseFloat(comp.yaPedido) || 0).toFixed(4)}</td>
              <td class="text-end text-success"><strong>${(parseFloat(comp.pedidoActual) || 0).toFixed(4)}</strong></td>
              <td class="text-end text-warning">${(parseFloat(comp.pendiente) || 0).toFixed(4)}</td>
              <td class="text-center">
                <span class="badge ${badgeClass}">${badgeText}</span>
              </td>
              <td class="text-end">$${(parseFloat(comp.subtotal) || 0).toLocaleString('es-CO')}</td>
            </tr>
          `;
        });
      });

      tablaResumen.innerHTML = html;
    } else {
      tablaResumen.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No hay datos para mostrar</td></tr>';
    }

    // Abrir modal
    const modalEl = document.getElementById('modalResumen');
    if (!modalEl) {
      throw new Error('No se encontró el modal #modalResumen en el DOM');
    }
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
      throw new Error('Bootstrap Modal no está disponible (bootstrap.Modal)');
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } catch (error) {
    console.error('Error abriendo resumen:', error);
    alert('No se pudo abrir el resumen: ' + (error?.message || error));
  }
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

function normalizarEstadoPedido(estadoRaw) {
  const estado = String(estadoRaw || '').trim().toLowerCase();
  if (!estado) return 'desconocido';
  if (estado.includes('aprob')) return 'aprobado';
  if (estado.includes('rechaz')) return 'rechazado';
  if (estado.includes('compr')) return 'comprado';
  if (estado.includes('pend')) return 'pendiente';
  if (estado.includes('proceso')) return 'pendiente';
  return estado;
}

function normalizarId(valor) {
  if (valor === null || typeof valor === 'undefined') return null;
  const v = String(valor).trim();
  return v.length ? v : null;
}

function normalizarKeyItemId(valorId, valorCodigo) {
  return normalizarId(valorId) || normalizarId(valorCodigo) || null;
}

function construirMapaCantidadesPorEstadoDesdeHistorial(pedidosHistorial = []) {
  const mapa = new Map();
  if (!Array.isArray(pedidosHistorial)) return mapa;

  pedidosHistorial.forEach((pedido) => {
    const estado = normalizarEstadoPedido(pedido.estado || pedido.estado_descripcion);
    if (!Array.isArray(pedido.detalles)) return;

    pedido.detalles.forEach((detalle) => {
      const idComponente = normalizarId(detalle.id_componente_unico || detalle.id_componente);
      const idMaterialExtra = normalizarId(detalle.id_material_extra);
      if (!idComponente && !idMaterialExtra) return;

      const idItem = normalizarKeyItemId(detalle.id_item, detalle.codigo_item);
      const cantidad = parseFloat(detalle.cantidad) || 0;
      if (cantidad <= 0) return;

      const key = `${idItem || 'GLOBAL'}-${idComponente || `MEP-${idMaterialExtra}`}`;
      if (!mapa.has(key)) {
        mapa.set(key, {
          normal: { aprobado: 0, pendiente: 0, rechazado: 0, comprado: 0 },
          excedente: {
            aprobado: { cantidad: 0, justificaciones: [] },
            pendiente: { cantidad: 0, justificaciones: [] },
            rechazado: { cantidad: 0, justificaciones: [] },
            comprado: { cantidad: 0, justificaciones: [] }
          }
        });
      }

      const entry = mapa.get(key);
      if (Object.prototype.hasOwnProperty.call(entry.normal, estado)) {
        entry.normal[estado] += cantidad;
      }
    });
  });

  return mapa;
}

/**
 * Genera los datos para el resumen unificado de materiales
 * @returns {Object} Datos estructurados para el resumen
 */
function generarDatosResumen(excedentes = [], pedidosHistorial = []) {
  const componentesPorItem = new Map();
  let valorTotalGlobal = 0;
  let totalComponentesContados = 0;
  let componentesCompletados = 0;

  const mapaEstados = construirMapaCantidadesPorEstadoDesdeHistorial(pedidosHistorial);

  const excedentesMap = new Map();
  if (Array.isArray(excedentes)) {
    excedentes.forEach((extra) => {
      const idItemKey = normalizarKeyItemId(extra.id_item, extra.codigo_item) || 'GLOBAL';
      const idCompKey = normalizarId(extra.id_componente_unico || extra.id_componente) || '';
      const clave = `${idItemKey}-${idCompKey}`;
      const estado = normalizarEstadoPedido(extra.estado || 'pendiente');
      const acumulado = excedentesMap.get(clave) || {
        aprobado: { cantidad: 0, justificaciones: [] },
        pendiente: { cantidad: 0, justificaciones: [] },
        rechazado: { cantidad: 0, justificaciones: [] },
        comprado: { cantidad: 0, justificaciones: [] }
      };

      acumulado[estado].cantidad += parseFloat(extra.cantidad_extra) || 0;
      if (extra.justificacion) {
        acumulado[estado].justificaciones.push(String(extra.justificacion).trim());
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

  const clavesPresupuesto = new Set();
  itemsData.componentesAgrupados.forEach((componente) => {
    if (!componente.items_que_usan || !Array.isArray(componente.items_que_usan)) {
      return;
    }
    componente.items_que_usan.forEach((item) => {
      const idItemKey = normalizarKeyItemId(item.id_item, item.codigo_item) || 'GLOBAL';
      const idCompKey = normalizarId(componente.id_componente_unico || componente.id_componente) || '';
      const keyEspecifica = `${idItemKey}-${idCompKey}`;
      clavesPresupuesto.add(keyEspecifica);
    });
  });

  itemsData.componentesAgrupados.forEach(componente => {
    if (!componente.items_que_usan || !Array.isArray(componente.items_que_usan)) {
      return;
    }

    componente.items_que_usan.forEach(item => {
      const cantidadTotal = parseFloat(item.cantidad_componente) || 0;
      const pedidoActual = parseFloat(item.pedido_actual) || 0;
      const precioUnitario = parseFloat(componente.precio_unitario) || 0;

      const idItemKey = normalizarKeyItemId(item.id_item, item.codigo_item) || 'GLOBAL';
      const idCompKey = normalizarId(componente.id_componente_unico || componente.id_componente) || '';
      const keyEspecifica = `${idItemKey}-${idCompKey}`;
      const keyGeneral = `GLOBAL-${idCompKey}`;

      const estadoInfo = mapaEstados.get(keyEspecifica) || mapaEstados.get(keyGeneral);
      const yaPedidoAprobado = estadoInfo?.normal?.aprobado || 0;
      const yaPedidoPendiente = estadoInfo?.normal?.pendiente || 0;
      const yaPedidoRechazado = estadoInfo?.normal?.rechazado || 0;
      const yaPedidoComprado = estadoInfo?.normal?.comprado || 0;

      const yaPedidoTotal = (yaPedidoAprobado + yaPedidoPendiente + yaPedidoRechazado + yaPedidoComprado) || 0;
      const pendiente = 0;

      const porcentaje = cantidadTotal > 0 ? (yaPedidoComprado / cantidadTotal) * 100 : 0;
      const subtotal = yaPedidoComprado * precioUnitario;

      const excedenteInfo = excedentesMap.get(keyEspecifica) || excedentesMap.get(keyGeneral) || {
        aprobado: { cantidad: 0, justificaciones: [] },
        pendiente: { cantidad: 0, justificaciones: [] },
        rechazado: { cantidad: 0, justificaciones: [] },
        comprado: { cantidad: 0, justificaciones: [] }
      };

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
        yaPedido: yaPedidoTotal,
        yaPedidoAprobado: yaPedidoAprobado,
        yaPedidoPendiente: yaPedidoPendiente,
        yaPedidoRechazado: yaPedidoRechazado,
        yaPedidoComprado: yaPedidoComprado,
        pedidoActual: pedidoActual,
        excedente: 0,
        excedentePendiente: 0,
        excedenteRechazado: 0,
        justificacion: '',
        pendiente: pendiente,
        porcentaje: porcentaje,
        precioUnitario: precioUnitario,
        subtotal: subtotal
      });

      itemData.valorTotal += subtotal;
      itemData.cantidadTotalGlobal += cantidadTotal;
      itemData.cantidadCompletadaGlobal += yaPedidoComprado;

      valorTotalGlobal += subtotal;
      totalComponentesContados++;

      if (porcentaje >= 100) {
        componentesCompletados++;
      }
    });
  });

  const extrasHistorialMap = new Map();
  if (Array.isArray(pedidosHistorial)) {
    pedidosHistorial.forEach((pedido) => {
      const estado = normalizarEstadoPedido(pedido.estado || pedido.estado_descripcion);

      if (!Array.isArray(pedido.detalles)) return;

      pedido.detalles.forEach((detalle) => {
        const cantidad = parseFloat(detalle.cantidad) || 0;
        if (cantidad <= 0) return;

        const idItem = normalizarKeyItemId(detalle.id_item, detalle.codigo_item);
        const idComponente = normalizarId(detalle.id_componente_unico || detalle.id_componente);
        const idMaterialExtra = normalizarId(detalle.id_material_extra);

        const clave = `${idItem || 'GLOBAL'}-${idComponente || (idMaterialExtra ? `MEP-${idMaterialExtra}` : `DET-${detalle.id_det_pedido || ''}`)}`;
        if (idComponente && clavesPresupuesto.has(`${idItem || 'GLOBAL'}-${idComponente}`)) {
          return;
        }

        if (!extrasHistorialMap.has(clave)) {
          const sinItemAsociado = !detalle.codigo_item && !detalle.nombre_item;
          const tieneMaterialExtra = !!(detalle.codigo_material_extra && detalle.nombre_material_extra);
          const nombreItem = sinItemAsociado
            ? (tieneMaterialExtra ? detalle.nombre_material_extra : 'MATERIAL EXTRA FUERA DE PRESUPUESTO')
            : (detalle.nombre_item || 'N/A');
          const codigoItem = sinItemAsociado
            ? (tieneMaterialExtra ? detalle.codigo_material_extra : 'EXTRA')
            : (detalle.codigo_item || 'N/A');
          const capitulo = sinItemAsociado
            ? 'MATERIAL EXTRA'
            : (detalle.nombre_capitulo || 'N/A');
          const descripcionComponente = sinItemAsociado
            ? (tieneMaterialExtra
              ? `${detalle.codigo_material_extra} - ${detalle.nombre_material_extra}`
              : (detalle.justificacion ? `Material extra: ${detalle.justificacion}` : 'Material extra sin descripción detallada'))
            : (detalle.descripcion_componente || 'Sin descripción');

          extrasHistorialMap.set(clave, {
            codigoItem,
            nombreItem,
            capitulo,
            componente: {
              nombre: descripcionComponente,
              tipo: (detalle.tipo_componente || (sinItemAsociado ? 'material' : 'material')),
              unidad: detalle.unidad_componente || detalle.unidad_item || 'UND',
              cantidadTotal: 0,
              yaPedido: 0,
              yaPedidoAprobado: 0,
              yaPedidoPendiente: 0,
              yaPedidoRechazado: 0,
              yaPedidoComprado: 0,
              pedidoActual: 0,
              excedente: 0,
              excedentePendiente: 0,
              excedenteRechazado: 0,
              justificacion: '',
              pendiente: 0,
              porcentaje: 0,
              precioUnitario: parseFloat(detalle.precio_unitario) || 0,
              subtotal: 0
            }
          });
        }

        const entry = extrasHistorialMap.get(clave);
        const precioUnit = entry.componente.precioUnitario || 0;

        if (estado === 'aprobado') entry.componente.yaPedidoAprobado += cantidad;
        if (estado === 'pendiente') entry.componente.yaPedidoPendiente += cantidad;
        if (estado === 'rechazado') entry.componente.yaPedidoRechazado += cantidad;
        if (estado === 'comprado') entry.componente.yaPedidoComprado += cantidad;

        entry.componente.yaPedido =
          (entry.componente.yaPedidoAprobado || 0) +
          (entry.componente.yaPedidoPendiente || 0) +
          (entry.componente.yaPedidoRechazado || 0) +
          (entry.componente.yaPedidoComprado || 0);

        if (!entry.componente.cantidadTotal || entry.componente.cantidadTotal === 0) {
          entry.componente.cantidadTotal = entry.componente.yaPedidoComprado || entry.componente.yaPedido || 0;
        }

        entry.componente.subtotal = (entry.componente.yaPedidoComprado || 0) * precioUnit;
        entry.componente.porcentaje = entry.componente.cantidadTotal > 0
          ? ((entry.componente.yaPedidoComprado || 0) / entry.componente.cantidadTotal) * 100
          : 0;
      });
    });
  }

  if (extrasHistorialMap.size > 0) {
    extrasHistorialMap.forEach((info) => {
      const itemKey = `HISTORIAL-${info.codigoItem}`;
      if (!componentesPorItem.has(itemKey)) {
        componentesPorItem.set(itemKey, {
          codigoItem: info.codigoItem,
          nombreItem: info.nombreItem,
          capitulo: info.capitulo,
          componentes: [],
          valorTotal: 0,
          cantidadTotalGlobal: 0,
          cantidadCompletadaGlobal: 0,
          porcentajeGlobal: 0
        });
      }

      const itemData = componentesPorItem.get(itemKey);
      itemData.componentes.push(info.componente);
      itemData.valorTotal += info.componente.subtotal;
      valorTotalGlobal += info.componente.subtotal;
      totalComponentesContados++;
    });
  }

  // Calcular porcentaje global para cada item
  componentesPorItem.forEach(itemData => {
    itemData.porcentajeGlobal = itemData.cantidadTotalGlobal > 0
      ? (itemData.cantidadCompletadaGlobal / itemData.cantidadTotalGlobal) * 100
      : 0;
  });

  // Agregar materiales extra como un item separado
  const codigosExtraYaEnHistorial = new Set();
  extrasHistorialMap.forEach((info) => {
    if (info?.codigoItem) {
      codigosExtraYaEnHistorial.add(String(info.codigoItem).trim());
    }
  });

  const materialesExtraFiltrados = Array.isArray(materialesExtra)
    ? materialesExtra.filter((extra) => {
      const codigoExtra = String(
        extra?.codigo || extra?.cod_material || extra?.codigo_material_extra || ''
      ).trim();
      if (!codigoExtra) return true;
      return !codigosExtraYaEnHistorial.has(codigoExtra);
    })
    : [];

  if (materialesExtraFiltrados.length > 0) {
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

    materialesExtraFiltrados.forEach(extra => {
      const cantidad = parseFloat(extra.cantidad) || 0;
      const precio = parseFloat(extra.precio_unitario) || 0;
      const subtotal = 0;

      materialesExtraItem.componentes.push({
        nombre: `${extra.codigo} - ${extra.descripcion}`,
        tipo: extra.tipo_material || 'Material',
        unidad: extra.unidad || 'UND',
        cantidadTotal: cantidad,
        yaPedido: 0,
        yaPedidoAprobado: 0,
        yaPedidoPendiente: 0,
        yaPedidoRechazado: 0,
        yaPedidoComprado: 0,
        pedidoActual: cantidad,
        excedente: 0,
        excedentePendiente: 0,
        excedenteRechazado: 0,
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
    ], historialPedidos);

    try {
      window.__debugHistorialPedidos = historialPedidos;
      window.__debugDatosResumen = datosResumen;
      window.__debugExcedentesHistorial = excedentesHistorial;
      window.__debugExcedentesActuales = excedentesActuales;
    } catch (e) {
      // ignore
    }
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

    console.log('Excel generado exitosamente');
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
    { key: 'pedido_aprobado', width: 12 },
    { key: 'pedido_pendiente', width: 12 },
    { key: 'pedido_rechazado', width: 12 },
    { key: 'pedido_comprado', width: 12 },
    { key: 'porcentaje', width: 12 },
    { key: 'precio_unit', width: 14 },
    { key: 'subtotal', width: 16 }
  ];

  let filaActual = 1;

  // ENCABEZADO PRINCIPAL
  worksheet.mergeCells(`A${filaActual}:P${filaActual}`);
  const celda1 = worksheet.getCell(`A${filaActual}`);
  celda1.value = proyectoNombre;
  celda1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  celda1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  celda1.alignment = { horizontal: 'center', vertical: 'middle' };
  celda1.border = borderCompleto();
  worksheet.getRow(filaActual).height = 25;
  filaActual++;

  // SUBTÍTULO
  worksheet.mergeCells(`A${filaActual}:P${filaActual}`);
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
  fila3.getCell(15).value = 'FECHA:';
  fila3.getCell(16).value = fechaActual;
  aplicarEstiloCelda(fila3.getCell(15), { bold: true }, 'right');
  aplicarEstiloCelda(fila3.getCell(16), {}, 'left');
  filaActual++;

  // LÍNEA VACÍA
  filaActual++;

  // ENCABEZADOS DE COLUMNAS
  const encabezados = worksheet.getRow(filaActual);
  const encabezadoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  encabezados.values = [
    'COD. ITEM', 'NOMBRE ITEM', 'CAPITULO', 'COD. COMP', 'COMPONENTE',
    'TIPO', 'UND', 'CANT. TOTAL', 'YA PEDIDO', 'APROBADO',
    'PENDIENTE', 'RECHAZADO', 'COMPRADO', '%', 'PRECIO UNIT.', 'SUBTOTAL'
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
          comp.yaPedidoAprobado || 0,
          comp.yaPedidoPendiente || 0,
          comp.yaPedidoRechazado || 0,
          comp.yaPedidoComprado || 0,
          porcentaje.toFixed(1) + '%',
          comp.precioUnitario,
          comp.subtotal
        ];

        // Estilo de la fila
        fila.alignment = { horizontal: 'left', vertical: 'middle' };
        fila.eachCell((cell, colNum) => {
          cell.border = borderLigero();

          // Alineación y formato numérico
          if (colNum >= 8 && colNum <= 13) {
            cell.numFmt = '#,##0.0000';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNum === 14) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          if (colNum === 15) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNum === 16) {
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
        // sin resaltado de excedentes

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
    filaTotal.values = ['', '', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL:', datosResumen.valorTotal];
    filaTotal.font = { bold: true, size: 11 };
    filaTotal.alignment = { horizontal: 'right', vertical: 'middle' };
    filaTotal.height = 22;
    filaTotal.eachCell((cell, col) => {
      cell.border = borderCompleto();
      cell.fill = totalDetalleFill;
      if (col === 16) {
        cell.numFmt = '#,##0.00';
      }
    });
  } else {
    const fila = worksheet.getRow(filaActual);
    fila.values = ['No hay datos para mostrar'];
    worksheet.mergeCells(`A${filaActual}:P${filaActual}`);

    const celda = worksheet.getCell(`A${filaActual}`);

    celda.alignment = { horizontal: 'center', vertical: 'middle' };
    celda.font = { italic: true, color: { argb: 'FF757575' } };
    fila.height = 30;
  }
}


async function generarHojaHistorialPedidosExcel(workbook, pedidosHistorial = []) {
  // === LOGS DE DEPURACIÓN ===
  console.log('=== DEPURACIÓN: Datos recibidos en generarHojaHistorialPedidosExcel ===');
  console.log('Total de pedidos:', pedidosHistorial.length);

  if (pedidosHistorial.length > 0) {
    const primerPedido = pedidosHistorial[0];
    console.log('Primer pedido:', primerPedido);
    console.log('¿Tiene ordenes_compra?', !!primerPedido.ordenes_compra);
    console.log('Número de órdenes:', primerPedido.ordenes_compra?.length || 0);

    if (primerPedido.ordenes_compra && primerPedido.ordenes_compra.length > 0) {
      const primeraOrden = primerPedido.ordenes_compra[0];
      console.log('Primera orden:', primeraOrden);
      console.log('¿Tiene recepciones?', !!primeraOrden.recepciones);
      console.log('Número de recepciones:', primeraOrden.recepciones?.length || 0);

      if (primeraOrden.recepciones && primeraOrden.recepciones.length > 0) {
        const primeraRecepcion = primeraOrden.recepciones[0];
        console.log('Primera recepción:', primeraRecepcion);
        console.log('¿Tiene items_recibidos?', !!primeraRecepcion.items_recibidos);
        console.log('Número de items recibidos:', primeraRecepcion.items_recibidos?.length || 0);

        if (primeraRecepcion.items_recibidos && primeraRecepcion.items_recibidos.length > 0) {
          console.log('Primer item recibido:', primeraRecepcion.items_recibidos[0]);
        }
      }
    }
  }
  console.log('=== FIN DEPURACIÓN ===');

  const worksheet = workbook.addWorksheet('Historial de Pedidos');


  worksheet.columns = [
    { key: 'nivel', width: 20 },
    { key: 'id_referencia', width: 15 },
    { key: 'fecha', width: 18 },
    { key: 'estado', width: 18 },
    { key: 'proveedor', width: 28 },
    { key: 'factura', width: 18 },
    { key: 'descripcion', width: 45 },
    { key: 'unidad', width: 10 },
    { key: 'cantidad', width: 12 },
    { key: 'precio_presup', width: 14 },      // Nueva columna
    { key: 'precio_recep', width: 14 },       // Renombrada
    { key: 'variacion', width: 12 },          // Nueva columna
    { key: 'subtotal', width: 16 },
    { key: 'porcentaje', width: 14 },
    { key: 'observaciones', width: 35 }
  ];

  let filaActual = 1;

  // TÍTULO
  worksheet.mergeCells(`A${filaActual}:O${filaActual}`);  // Cambiado de M a O (2 columnas más)
  const titulo = worksheet.getCell(`A${filaActual}`);
  titulo.value = 'Historial Completo de Pedidos, Órdenes de Compra y Recepciones';
  titulo.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF38598B' } };
  titulo.alignment = { horizontal: 'center', vertical: 'middle' };
  titulo.border = borderCompleto();
  worksheet.getRow(filaActual).height = 25;
  filaActual += 2;

  // ENCABEZADOS
  const encabezados = worksheet.getRow(filaActual);
  const encabezadoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  encabezados.values = [
    'NIVEL',
    'ID/REFERENCIA',
    'FECHA',
    'ESTADO',
    'PROVEEDOR',
    'FACTURA',
    'DESCRIPCIÓN',
    'UNIDAD',
    'CANTIDAD',
    'PRECIO PRESUP.',    // Nueva columna
    'PRECIO RECEP.',     // Renombrada
    'VARIACIÓN %',       // Nueva columna
    'SUBTOTAL',
    '% CUMPLIMIENTO',
    'OBSERVACIONES'
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
    worksheet.mergeCells(`A${filaActual}:M${filaActual}`);
    const celda = worksheet.getCell(`A${filaActual}`);
    celda.alignment = { horizontal: 'center', vertical: 'middle' };
    celda.font = { italic: true, color: { argb: 'FF757575' } };
    return;
  }

  let totalGeneral = 0;

  pedidosHistorial.forEach((pedido, pedidoIdx) => {
    const estadoTexto = pedido.estado_descripcion || pedido.estado || 'N/A';
    const estadoColor = obtenerColorEstadoExcel(pedido.estado_color);
    const fechaPedido = formatearFechaCorta(pedido.fecha_pedido);
    const porcentajePedido = pedido.porcentaje_recibido_pedido || 0;

    // === NIVEL 1: PEDIDO ===
    const filaPedido = worksheet.getRow(filaActual);
    const pedidoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    filaPedido.values = [
      `PEDIDO #${pedido.id_pedido}`,
      pedido.id_pedido,
      fechaPedido,
      estadoTexto,
      pedido.nombre_usuario || 'N/A',
      '',
      `Pedido con ${pedido.total_items} item(s) - ${pedido.ordenes_compra?.length || 0} orden(es) de compra`,
      '',
      '',
      '',
      '',
      '',
      parseFloat(pedido.total || 0),
      `${porcentajePedido}%`,
      pedido.observaciones || ''
    ];

    filaPedido.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    filaPedido.alignment = { horizontal: 'left', vertical: 'middle' };
    filaPedido.height = 25;
    filaPedido.eachCell((cell, colNum) => {
      cell.border = borderCompleto();
      if (colNum === 4) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estadoColor } };
      } else {
        cell.fill = pedidoFill;
      }
      if (colNum === 13) {  // Cambiado de 11 a 13
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
    filaActual++;

    totalGeneral += parseFloat(pedido.total || 0);

    // === NIVEL 2: ÓRDENES DE COMPRA ===
    console.log(`DEBUG PEDIDO #${pedido.id_pedido}: Tiene ${pedido.ordenes_compra?.length || 0} órdenes de compra`);
    if (pedido._debug_ordenes) {
      console.log('DEBUG BACKEND INFO:', JSON.stringify(pedido._debug_ordenes, null, 2));
    }
    if (pedido.ordenes_compra && pedido.ordenes_compra.length > 0) {
      pedido.ordenes_compra.forEach((orden, ordenIdx) => {
        console.log(`DEBUG ORDEN ${ordenIdx + 1}:`, JSON.stringify({
          numero_orden: orden.numero_orden,
          id_orden_compra: orden.id_orden_compra,
          total: orden.total,
          subtotal: orden.subtotal,
          impuestos: orden.impuestos,
          estado: orden.estado,
          nombre_proveedor: orden.nombre_proveedor,
          numero_factura: orden.numero_factura,
          num_recepciones: orden.recepciones?.length || 0,
          num_items: orden.items_orden?.length || 0
        }, null, 2));

        const filaOrden = worksheet.getRow(filaActual);
        const ordenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8FAADC' } };
        const porcentajeOrden = orden.porcentaje_recibido || 0;

        filaOrden.values = [
          `  ├─ ORDEN #${orden.numero_orden || orden.id_orden_compra}`,
          orden.numero_orden || orden.id_orden_compra,
          formatearFechaCorta(orden.fecha_orden),
          orden.estado || 'N/A',
          orden.nombre_proveedor || 'N/A',
          orden.numero_factura || '',
          `${orden.recepciones?.length || 0} recepción(es) - ${orden.items_orden?.length || 0} item(s)`,
          '',
          '',
          '',
          '',
          '',
          parseFloat(orden.total || 0),
          `${porcentajeOrden}%`,
          orden.observaciones || ''
        ];

        filaOrden.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        filaOrden.alignment = { horizontal: 'left', vertical: 'middle' };
        filaOrden.height = 22;
        filaOrden.eachCell((cell, colNum) => {
          cell.border = borderCompleto();
          cell.fill = ordenFill;
          if (colNum === 13) {  // Cambiado de 11 a 13
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        });
        filaActual++;

        // === NIVEL 3: RECEPCIONES ===
        console.log(`DEBUG: Orden ${orden.numero_orden} tiene ${orden.recepciones?.length || 0} recepciones`);
        if (orden.recepciones && orden.recepciones.length > 0) {
          orden.recepciones.forEach((recepcion, recepcionIdx) => {
            console.log(`DEBUG RECEPCIÓN ${recepcionIdx + 1} de orden ${orden.numero_orden}:`, JSON.stringify({
              id_compra: recepcion.id_compra,
              fecha_compra: recepcion.fecha_compra,
              total: recepcion.total,
              numero_factura: recepcion.numero_factura,
              num_items: recepcion.items_recibidos?.length || 0
            }, null, 2));

            const filaRecepcion = worksheet.getRow(filaActual);
            const recepcionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };

            filaRecepcion.values = [
              `    ├─ RECEPCIÓN #${recepcionIdx + 1}`,
              `COMPRA-${recepcion.id_compra}`,
              formatearFechaCorta(recepcion.fecha_compra),
              recepcion.estado || 'N/A',
              recepcion.nombre_proveedor || 'N/A',
              recepcion.numero_factura || '',
              `${recepcion.items_recibidos?.length || 0} item(s) recibido(s)`,
              '',
              '',
              '',
              '',
              '',
              parseFloat(recepcion.total || 0),
              '',
              recepcion.observaciones || ''
            ];

            filaRecepcion.font = { bold: true, size: 9 };
            filaRecepcion.alignment = { horizontal: 'left', vertical: 'middle' };
            filaRecepcion.height = 20;
            filaRecepcion.eachCell((cell, colNum) => {
              cell.border = borderLigero();
              cell.fill = recepcionFill;
              if (colNum === 13) {  // Cambiado de 11 a 13
                cell.numFmt = '#,##0.00';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
              }
            });
            filaActual++;

            // === NIVEL 4: ITEMS RECIBIDOS ===
            console.log(`DEBUG: Procesando items de recepción #${recepcionIdx + 1}`);
            console.log('DEBUG: recepcion.items_recibidos:', recepcion.items_recibidos);
            console.log('DEBUG: ¿Es array?', Array.isArray(recepcion.items_recibidos));
            console.log('DEBUG: Longitud:', recepcion.items_recibidos?.length);

            if (recepcion.items_recibidos && recepcion.items_recibidos.length > 0) {
              console.log(`DEBUG: Entrando a forEach de ${recepcion.items_recibidos.length} items`);
              recepcion.items_recibidos.forEach((item, itemIdx) => {
                console.log(`DEBUG: Procesando item ${itemIdx + 1}:`, item);
                const filaItem = worksheet.getRow(filaActual);

                // Calcular variación porcentual
                const precioPresup = parseFloat(item.precio_presupuestado || 0);
                const precioRecep = parseFloat(item.precio_recepcion || 0);
                let variacionPorcentual = '';
                let variacionColor = null;

                if (precioPresup > 0 && precioRecep > 0) {
                  const variacion = ((precioRecep - precioPresup) / precioPresup) * 100;
                  variacionPorcentual = `${variacion > 0 ? '+' : ''}${variacion.toFixed(2)}%`;

                  // Verde si es negativo (ahorro), rojo si es positivo (sobrecosto)
                  if (variacion < 0) {
                    variacionColor = 'FF00B050'; // Verde
                  } else if (variacion > 0) {
                    variacionColor = 'FFFF0000'; // Rojo
                  }
                }

                filaItem.values = [
                  `      └─ Item ${itemIdx + 1}`,
                  '',
                  '',
                  '',
                  '',
                  '',
                  item.descripcion || 'Sin descripción',
                  item.unidad || 'UND',
                  parseFloat(item.cantidad || 0),
                  precioPresup,                    // Precio presupuestado
                  precioRecep,                     // Precio de recepción
                  variacionPorcentual,             // Variación %
                  parseFloat(item.subtotal || 0),
                  '',
                  ''
                ];

                filaItem.alignment = { horizontal: 'left', vertical: 'middle' };
                filaItem.eachCell((cell, colNum) => {
                  cell.border = borderLigero();

                  // Columnas 1-6: Fondo gris claro
                  if (colNum <= 6) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                    cell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
                  }

                  // Columna 9: Cantidad
                  if (colNum === 9) {
                    cell.numFmt = '#,##0.0000';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                  }

                  // Columnas 10-11: Precios (presupuestado y recepción)
                  if (colNum === 10 || colNum === 11) {
                    cell.numFmt = '#,##0.00';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                  }

                  // Columna 12: Variación % (con color)
                  if (colNum === 12) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.font = { bold: true, size: 9 };
                    if (variacionColor) {
                      cell.font = { ...cell.font, color: { argb: variacionColor } };
                    }
                  }

                  // Columna 13: Subtotal
                  if (colNum === 13) {
                    cell.numFmt = '#,##0.00';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                  }
                });
                console.log(`DEBUG: Fila ${filaActual} creada para item ${itemIdx + 1}`);
                filaActual++;
              });
            } else {
              console.log('DEBUG: No hay items recibidos o el array está vacío');
              // Sin items recibidos
              const filaVacia = worksheet.getRow(filaActual);
              worksheet.mergeCells(`A${filaActual}:O${filaActual}`);  // Cambiado de M a O
              filaVacia.getCell(1).value = '      └─ Sin items registrados en esta recepción';
              filaVacia.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
              filaVacia.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF999999' } };
              filaVacia.getCell(1).border = borderLigero();
              filaActual++;
            }
          });
        } else {
          // Sin recepciones
          const filaVacia = worksheet.getRow(filaActual);
          worksheet.mergeCells(`A${filaActual}:O${filaActual}`);  // Cambiado de M a O
          filaVacia.getCell(1).value = '    └─ Sin recepciones registradas para esta orden';
          filaVacia.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
          filaVacia.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF999999' } };
          filaVacia.getCell(1).border = borderLigero();
          filaActual++;
        }
      });
    } else {
      // Sin órdenes de compra
      const filaVacia = worksheet.getRow(filaActual);
      worksheet.mergeCells(`A${filaActual}:O${filaActual}`);  // Cambiado de M a O
      filaVacia.getCell(1).value = '  └─ Sin órdenes de compra para este pedido';
      filaVacia.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      filaVacia.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF999999' } };
      filaVacia.getCell(1).border = borderLigero();
      filaActual++;
    }

    // Separador entre pedidos
    if (pedidoIdx < pedidosHistorial.length - 1) {
      filaActual++;
    }
  });

  // TOTAL FINAL
  filaActual += 2;
  const totalFila = worksheet.getRow(filaActual);
  const totalFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

  totalFila.values = ['', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL GENERAL:', totalGeneral, ''];  // Ajustado para 15 columnas
  totalFila.font = { bold: true, size: 11 };
  totalFila.alignment = { horizontal: 'right', vertical: 'middle' };
  totalFila.height = 25;
  totalFila.eachCell((cell, colNum) => {
    cell.border = borderCompleto();
    cell.fill = totalFill;
    if (colNum === 14) {  // Cambiado de 11 a 14 (columna N)
      cell.numFmt = '#,##0.00';
    }
  });
}


function aplicarEstiloFilaHistorial(fila, estadoColor, esExcedente) {
  fila.alignment = { vertical: 'middle' };
  fila.eachCell((cell, col) => {
    cell.border = borderLigero();
    // Columna 13: Cantidad
    if (col === 13) {
      cell.numFmt = '#,##0.0000';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
    // Columnas 14-15: Precios
    if (col === 14 || col === 15) {
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
    // Columna 16: Variación (texto centrado)
    if (col === 16) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    // Columna 17: Subtotal
    if (col === 17) {
      cell.numFmt = '#,##0.00';
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

function aplicarEstiloFilaHistorialDetalle(fila, esExcedente) {
  fila.alignment = { vertical: 'middle' };
  fila.eachCell((cell, col) => {
    cell.border = borderLigero();

    // Columna 1: ID/Número de item (indentado)
    if (col === 1) {
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    }

    // Columnas 2-6: Vacías (info del pedido ya mostrada en encabezado)
    if (col >= 2 && col <= 6) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    }

    // Columna 13: Cantidad
    if (col === 13) {
      cell.numFmt = '#,##0.0000';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }

    // Columnas 14-15: Precios
    if (col === 14 || col === 15) {
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }

    // Columna 16: Variación (texto centrado)
    if (col === 16) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Columna 17: Subtotal
    if (col === 17) {
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
  });

  // Resaltar excedentes con color especial
  if (esExcedente) {
    fila.eachCell((cell, col) => {
      // No sobrescribir el color de las columnas vacías
      if (col < 2 || col > 6) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5B4' } };
      }
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
      existente.cantidad += (parseFloat(comp.yaPedidoComprado) || 0);
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
window.mostrarModalNuevoItem = mostrarModalNuevoItem;

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

/**
 * Cambia entre la vista de productos agrupados y la vista de items
 * @param {string} vista - 'productos' o 'items'
 * @description Cambia la vista actual del pedido entre productos agrupados y items individuales.
 *              Sincroniza los datos entre vistas antes de cambiar la vista actual.
 */
function cambiarVistaPedido(vista) {
  if (vista !== 'productos' && vista !== 'items') return;

  console.log(`[Vista] Cambiando a vista: ${vista}`);

  // PRIMERO: Sincronizar datos entre vistas ANTES de cambiar la vista actual
  // Esto asegura que los valores del carrito persistan
  if (itemsData?.componentesAgrupados && itemsData?.itemsIndividuales) {
    sincronizarDatosEntreVistas();
    console.log('[Vista] Datos sincronizados entre vistas');
  }

  // Actualizar la vista actual
  vistaActualPedido = vista;

  // Actualizar botones
  const btnProductos = document.getElementById('btnVistaProductos');
  const btnItems = document.getElementById('btnVistaItems');

  if (btnProductos && btnItems) {
    if (vista === 'productos') {
      btnProductos.classList.remove('btn-outline-light');
      btnProductos.classList.add('btn-light', 'active');
      btnItems.classList.remove('btn-light', 'active');
      btnItems.classList.add('btn-outline-light');
    } else {
      btnItems.classList.remove('btn-outline-light');
      btnItems.classList.add('btn-light', 'active');
      btnProductos.classList.remove('btn-light', 'active');
      btnProductos.classList.add('btn-outline-light');
    }
  }

  // Aplicar filtros para mostrar la vista correspondiente
  // Los datos ya están sincronizados, así que se renderizarán con los valores correctos
  filtrarMaterialesPedido();

  // Sincronizar valores del carrito con la nueva vista (por si acaso)
  // Usar un pequeño delay para asegurar que el DOM esté listo
  setTimeout(() => sincronizarCarritoConVistaActiva(), 100);
}

/**
 * Sincroniza los valores del carrito con la vista activa
 * Se ejecuta al cambiar entre vistas para mostrar las cantidades pedidas
 */
function sincronizarCarritoConVistaActiva() {
  console.log('[Sincronización] Sincronizando carrito con vista:', vistaActualPedido);

  if (vistaActualPedido === 'items') {
    // Sincronizar desde componentes agrupados hacia items individuales
    sincronizarCarritoAVistaItems();
  } else {
    // Sincronizar desde items individuales hacia componentes agrupados
    sincronizarCarritoAVistaAgrupada();
  }
}

function sincronizarDatosEntreVistas() {
  if (!itemsData?.componentesAgrupados || !itemsData?.itemsIndividuales) return;

  console.log('[Sincronización] Iniciando sincronización de datos...');

  // 1. Sincronizar desde la estructura Agrupada hacia la Individual
  itemsData.componentesAgrupados.forEach(compAgrupado => {
    if (!compAgrupado.items_que_usan) return;

    compAgrupado.items_que_usan.forEach(uso => {
      // Tomar la cantidad de la estructura de desglose (el origen de la verdad en vista agrupada)
      const cantidadUso = parseFloat(uso.pedido_actual) || 0;
      
      // Buscar el item y componente correspondiente en la estructura individual
      const item = itemsData.itemsIndividuales.find(it => String(it.id_item) === String(uso.id_item));
      if (!item || !item.componentes) return;

      const compIndividual = item.componentes.find(c => 
        String(c.id_componente) === String(uso.id_componente_original || compAgrupado.id_componente)
      );

      if (compIndividual) {
        // PROPAGAR EL VALOR (incluso si es 0 para limpiar)
        compIndividual.pedido = cantidadUso;
      }
    });
  });

  // 2. Sincronizar desde la estructura Individual hacia la Agrupada
  itemsData.itemsIndividuales.forEach(item => {
    if (!item.componentes) return;

    item.componentes.forEach(compIndividual => {
      const cantidadIndividual = parseFloat(compIndividual.pedido) || 0;

      // Buscar el componente agrupado que contiene este ítem
      itemsData.componentesAgrupados.forEach(compAgrupado => {
        if (!compAgrupado.items_que_usan) return;

        const uso = compAgrupado.items_que_usan.find(u => 
          String(u.id_item) === String(item.id_item) && 
          String(u.id_componente_original || compAgrupado.id_componente) === String(compIndividual.id_componente)
        );

        if (uso) {
          // PROPAGAR EL VALOR
          uso.pedido_actual = cantidadIndividual;
        }
      });
    });
  });
  
  // 3. Recalcular los pedidos acumulados de la vista agrupada basándose en sus desgloses actualizados
  itemsData.componentesAgrupados.forEach(compAgrupado => {
    if (compAgrupado.items_que_usan && compAgrupado.items_que_usan.length > 0) {
      const sumaPedido = compAgrupado.items_que_usan.reduce((acc, u) => acc + (parseFloat(u.pedido_actual) || 0), 0);
      compAgrupado.pedido = sumaPedido;
    }
  });

  console.log('[Sincronización] Datos sincronizados correctamente.');
}

function sincronizarCarritoAVistaItems() {
  sincronizarDatosEntreVistas();
  
  // Actualizar todos los inputs de la vista individual basándose en itemsData
  if (itemsData.itemsIndividuales) {
    itemsData.itemsIndividuales.forEach(item => {
      if (!item.componentes) return;
      item.componentes.forEach(comp => {
        const val = parseFloat(comp.pedido) || 0;
        const selector = `input.cantidad-componente-item-por-item[data-item-id="${item.id_item}"][data-componente-id="${comp.id_componente}"]`;
        const inputs = document.querySelectorAll(selector);
        inputs.forEach(input => { input.value = val > 0 ? val.toFixed(4) : 0; });
      });
    });
  }
  actualizarEstadisticas();
}

function sincronizarCarritoAVistaAgrupada() {
  sincronizarDatosEntreVistas();
  
  // Actualizar todos los inputs de la vista agrupada basándose en itemsData
  if (itemsData.componentesAgrupados) {
    itemsData.componentesAgrupados.forEach(comp => {
      const val = parseFloat(comp.pedido) || 0;
      const selector = `input.cantidad-componente[data-componente-id="${comp.id_componente}"]`;
      const inputs = document.querySelectorAll(selector);
      inputs.forEach(input => { input.value = val > 0 ? val.toFixed(4) : 0; });
      
      // Si el componente tiene desglose renderizado, actualizar también los subtotales del desglose si es necesario
      // (por simplicidad, filtrarMaterialesPedido() al cambiar de vista ya renderiza todo de nuevo con los valores de itemsData)
    });
  }
  actualizarEstadisticas();
}

/**
 * Muestra los items individuales con desglose de componentes
 * Esta es la vista alternativa a los productos agrupados
 */
function mostrarItemsPorItem() {
  const container = document.getElementById("materialesList");
  const itemsIndividuales = itemsData.itemsIndividuales || [];

  if (itemsIndividuales.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <div class="spinner-border text-muted" role="status"></div>
        <p class="mt-3">No hay items en este presupuesto/capítulo</p>
      </div>
    `;
    document.getElementById("contadorMateriales").textContent = "0 items";
    return;
  }

  let html = `
    <div class="alert alert-info mb-3">
      <strong>Vista por Items:</strong>
      Cada item muestra sus componentes asociados. Haga clic en "Ver Componentes" para desglosar.
    </div>
  `;

  itemsIndividuales.forEach((item) => {
    const componentes = item.componentes || [];
    const tieneComponentes = componentes.length > 0;
    const unidad = item.unidad || "UND";

    html += `
      <div class="card mb-3 shadow-sm item-card" data-id="${item.id_item}">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0">
              <strong>${item.codigo_item}</strong> - ${item.nombre_item}
            </h6>
            <small class="text-muted">${item.nombre_capitulo || 'Sin capítulo'} | Unidad: ${unidad}</small>
          </div>
          <div>
            <span class="badge bg-primary">${componentes.length} componentes</span>
            ${tieneComponentes ? `
              <button class="btn btn-sm btn-outline-info ms-2" onclick="toggleDesgloseItem('${item.id_item}')">
                Ver Componentes
              </button>
            ` : ''}
          </div>
        </div>
        <div class="card-body">
          <div class="row mb-2">
            <div class="col-md-4">
              <small class="text-muted">Cantidad Item:</small>
              <strong>${parseFloat(item.cantidad || 0).toFixed(4)} ${unidad}</strong>
            </div>
            <div class="col-md-4">
              <small class="text-muted">Precio Unit.:</small>
              <strong>$${formatCurrency(item.precio_unitario)}</strong>
            </div>
            <div class="col-md-4">
              <small class="text-muted">Subtotal:</small>
              <strong>$${formatCurrency(item.subtotal)}</strong>
            </div>
          </div>

          ${tieneComponentes ? `
            <div id="desglose-item-${item.id_item}" style="display: none;" class="mt-3">
              <hr>
              <h6 class="text-primary mb-3">Componentes del Item</h6>
              <div class="table-responsive">
                <table class="table table-sm table-bordered tabla-componentes-item" data-item-id="${item.id_item}">
                  <thead class="table-light">
                    <tr>
                      <th>Componente</th>
                      <th>Tipo</th>
                      <th>Unidad</th>
                      <th class="text-end">Cant. por Unidad</th>
                      <th class="text-end">Cant. Total Necesaria</th>
                      <th class="text-end">Precio Unit.</th>
                      <th class="text-end">Subtotal</th>
                      <th class="text-end">Cant. a Pedir</th>
                      <th class="text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${componentes.map((comp) => {
                      const cantidadPorUnidad = parseFloat(comp.cantidad) || 0;
                      const cantidadTotalNecesaria = cantidadPorUnidad * (parseFloat(item.cantidad) || 0);
                      const precioUnitario = parseFloat(comp.precio_unitario) || 0;
                      const subtotal = cantidadTotalNecesaria * precioUnitario;
                      const unidadComp = comp.unidad || "UND";
                      const pedidoActual = parseFloat(comp.pedido || 0);

                      return `
                        <tr>
                          <td><strong>${comp.descripcion || 'Sin descripción'}</strong></td>
                          <td><span class="badge ${obtenerClaseBadgeTipo(comp.tipo_componente || 'material')}">${obtenerNombreTipoComponente(comp.tipo_componente || 'material')}</span></td>
                          <td>${unidadComp}</td>
                          <td class="text-end">${cantidadPorUnidad.toFixed(4)} ${unidadComp}</td>
                          <td class="text-end">${cantidadTotalNecesaria.toFixed(4)} ${unidadComp}</td>
                          <td class="text-end">$${formatCurrency(precioUnitario)}</td>
                          <td class="text-end">$${formatCurrency(subtotal)}</td>
                          <td class="text-end" style="width: 150px;">
                            <div class="input-group input-group-sm">
                              <input type="number"
                                    class="form-control form-control-sm cantidad-componente-item-por-item"
                                    value="${pedidoActual.toFixed(4)}"
                                    min="0"
                                    max="${cantidadTotalNecesaria.toFixed(4)}"
                                    step="0.0001"
                                    data-item-id="${item.id_item}"
                                    data-componente-id="${comp.id_componente}"
                                    data-precio="${precioUnitario}"
                                    data-unidad="${unidadComp}"
                                    data-max="${cantidadTotalNecesaria.toFixed(4)}"
                                    onchange="actualizarCantidadComponentePorItem(this)">
                              <span class="input-group-text">${unidadComp}</span>
                            </div>
                            <small class="text-muted">Máx: ${cantidadTotalNecesaria.toFixed(4)}</small>
                          </td>
                          <td class="text-center">
                            <button class="btn btn-sm btn-outline-success" type="button" onclick="agregarMaximoCantidadPorItem(this)" data-item-id="${item.id_item}" data-componente-id="${comp.id_componente}">
                              <i class="bi bi-plus-circle"></i>
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                  <tfoot class="table-light">
                    <tr>
                      <td colspan="6" class="text-end"><strong>Total Componentes:</strong></td>
                      <td class="text-end"><strong>$${formatCurrency(componentes.reduce((sum, comp) => {
                        const cantTotal = (parseFloat(comp.cantidad) || 0) * (parseFloat(item.cantidad) || 0);
                        return sum + (cantTotal * (parseFloat(comp.precio_unitario) || 0));
                      }, 0))}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ` : '<div class="text-muted small"><i class="bi bi-info-circle"></i> Este item no tiene componentes asociados.</div>'}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Toggle para mostrar/ocultar el desglose de componentes de un item
 */
function toggleDesgloseItem(itemId) {
  const desglose = document.getElementById(`desglose-item-${itemId}`);
  if (desglose) {
    const isVisible = desglose.style.display !== "none";
    desglose.style.display = isVisible ? "none" : "block";

    // Actualizar texto del botón
    const btn = desglose.closest('.card').querySelector('.btn-outline-info');
    if (btn) {
      btn.textContent = isVisible ? "Ver Componentes" : "Ocultar Componentes";
    }
  }
}

function actualizarCantidadComponentePorItem(input) {
  const nuevaCantidad = parseFloat(input.value) || 0;
  const itemId = input.dataset.itemId;
  const componenteId = input.dataset.componenteId;

  // Buscar el item y el componente correspondiente
  const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemId));
  if (item && item.componentes) {
    const componente = item.componentes.find(c => String(c.id_componente) === String(componenteId));
    if (componente) {
      componente.pedido = nuevaCantidad;

      console.log('%c[Input] Cambio de cantidad:', 'color: #28a745; font-weight: bold;', {
        item: itemId,
        componente: componenteId,
        cantidad: nuevaCantidad
      });

      // Sincronizar con la vista de componentes agrupados (SOLO este componente específico)
      sincronizarPedidoConComponenteAgrupado(itemId, componenteId, nuevaCantidad);

      // Actualizar estadísticas
      actualizarEstadisticas();

      // Guardar carrito en base de datos (con debounce)
      guardarCarritoEnStorage();
    }
  }
}

/**
 * Sincroniza el pedido desde la vista por items hacia los componentes agrupados
 * de forma unívoca por ID de item e ID de componente.
 */
function sincronizarPedidoConComponenteAgrupado(itemId, componenteId, cantidad) {
  if (!itemsData.componentesAgrupados) return;

  // Encontrar el componente agrupado exacto que corresponde a este componenteId
  // y que además contiene el desglose para este itemId
  itemsData.componentesAgrupados.forEach(compAgrupado => {
    // Solo actuar si el ID del componente coincida con el que estamos editando
    if (String(compAgrupado.id_componente) === String(componenteId)) {
        if (compAgrupado.items_que_usan) {
            const itemEnComponente = compAgrupado.items_que_usan.find(u => String(u.id_item) === String(itemId));
            if (itemEnComponente) {
                // Actualizar solo el pedido_actual de ESTE componente para ESTE item
                itemEnComponente.pedido_actual = cantidad;
            }
        }
        
        // Recalcular el total del componente agrupado (suma de todos sus desgloses)
        if (compAgrupado.items_que_usan) {
            compAgrupado.pedido = compAgrupado.items_que_usan.reduce((acc, u) => acc + (parseFloat(u.pedido_actual) || 0), 0);
        }
    }
  });
}

/**
 * Filtra los recursos basándose en la búsqueda, capítulo y tipo.
 * Se ejecuta en tiempo real al cambiar cualquier filtro.
 * Soporta ambas vistas: productos agrupados e items individuales.
 */
function filtrarMaterialesPedido() {
  console.log('[Filtro Pedido] Ejecutando... Vista:', vistaActualPedido);
  const searchInput = document.getElementById('searchResource');
  const busqueda = searchInput?.value.toLowerCase().trim() || '';
  const capituloId = document.getElementById('filterCapitulo')?.value || '';
  const tipo = document.getElementById('filterTipo')?.value || '';

  console.log('[Filtro Pedido] Valores:', { busqueda, capituloId, tipo, vista: vistaActualPedido });

  if (!itemsData) {
    console.warn('[Filtro Pedido] No hay datos cargados');
    return;
  }

  // Vista de Items Individuales
  if (vistaActualPedido === 'items') {
    if (!itemsData.itemsIndividuales) {
      console.warn('[Filtro Pedido] No hay items individuales cargados');
      return;
    }

    const filteredItems = itemsData.itemsIndividuales.filter(item => {
      // 1. Filtrar por texto: código o nombre del item
      const matchBusqueda = !busqueda ||
        (item.codigo_item && item.codigo_item.toLowerCase().includes(busqueda)) ||
        (item.nombre_item && item.nombre_item.toLowerCase().includes(busqueda));

      // 2. Filtrar por capítulo
      const matchCapitulo = !capituloId ||
        String(item.id_capitulo) === String(capituloId);

      // 3. Filtrar por tipo (en componentes del item)
      const matchTipo = !tipo ||
        (item.componentes && item.componentes.some(comp => comp.tipo_componente === tipo));

      return matchBusqueda && matchCapitulo && matchTipo;
    });

    console.log(`[Filtro Pedido - Items] Resultados: ${filteredItems.length} de ${itemsData.itemsIndividuales.length}`);

    // Actualizar contador
    const contadorMateriales = document.getElementById("contadorMateriales");
    if (contadorMateriales) {
      contadorMateriales.textContent = `${filteredItems.length} items`;
    }

    // Configurar paginador con items filtrados
    if (typeof paginador !== 'undefined' && paginador.configurar) {
      // Sobreescribir temporalmente la función mostrarItemsEnVista del paginador
      const originalMostrarItems = paginador.mostrarItemsEnVista.bind(paginador);
      paginador.mostrarItemsEnVista = function(items) {
        mostrarItemsIndividualesEnVista(items);
      };
      paginador.configurar(filteredItems);
      // Restaurar función original
      paginador.mostrarItemsEnVista = originalMostrarItems;
    } else {
      mostrarItemsIndividualesEnVista(filteredItems);
    }
    return;
  }

  // Vista de Productos Agrupados (por defecto)
  if (!itemsData.componentesAgrupados) {
    console.warn('[Filtro Pedido] No hay componentes agrupados cargados');
    return;
  }

  const filteredItems = itemsData.componentesAgrupados.filter(item => {
    // 1. Filtrar por texto: nombre o descripción
    const matchBusqueda = !busqueda ||
      (item.nombre_componente && item.nombre_componente.toLowerCase().includes(busqueda)) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(busqueda));

    // 2. Filtrar por capítulo (usando id_capitulo del componente serializado)
    const matchCapitulo = !capituloId ||
      item.items_que_usan?.some(uso => String(uso.id_capitulo) === String(capituloId));

    // 3. Filtrar por tipo (material, mano_obra, etc.)
    const matchTipo = !tipo || item.tipo_componente === tipo;

    return matchBusqueda && matchCapitulo && matchTipo;
  });

  console.log(`[Filtro Pedido] Resultados: ${filteredItems.length} de ${itemsData.componentesAgrupados.length}`);

  // Actualizar la vista a través del paginador
  if (typeof paginador !== 'undefined' && paginador.configurar) {
    paginador.configurar(filteredItems);
  } else {
    mostrarItemsConComponentes({ componentesAgrupados: filteredItems });
  }
}

/**
 * Muestra items individuales en la vista (usado por el paginador en modo items)
 * VERSIÓN COMPLETA: Con indicadores de estado, barras de progreso y validación de presupuesto
 */
function mostrarItemsIndividualesEnVista(items) {
  const container = document.getElementById("materialesList");

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <div class="spinner-border text-muted" role="status"></div>
        <p class="mt-3">No hay items que coincidan con los filtros</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="alert alert-info mb-3">
      <strong>Vista por Items:</strong>
      Cada item muestra sus componentes asociados con indicadores de estado. Haga clic en "Ver Componentes" para desglosar.
    </div>
  `;

  items.forEach((item) => {
    const componentes = item.componentes || [];
    const tieneComponentes = componentes.length > 0;
    const unidad = item.unidad || "UND";

    html += `
      <div class="card mb-3 shadow-sm item-card" data-id="${item.id_item}">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0">
              <strong>${item.codigo_item}</strong> - ${item.nombre_item}
            </h6>
            <small class="text-muted">${item.nombre_capitulo || 'Sin capítulo'} | Unidad: ${unidad}</small>
          </div>
          <div>
            <span class="badge bg-primary">${componentes.length} componentes</span>
            ${tieneComponentes ? `
              <button class="btn btn-sm btn-outline-info ms-2" onclick="toggleDesgloseItem('${item.id_item}')">
                Ver Componentes
              </button>
            ` : ''}
          </div>
        </div>
        <div class="card-body">
          <div class="row mb-2">
            <div class="col-md-4">
              <small class="text-muted">Cantidad Item:</small>
              <strong>${parseFloat(item.cantidad || 0).toFixed(4)} ${unidad}</strong>
            </div>
            <div class="col-md-4">
              <small class="text-muted">Precio Unit.:</small>
              <strong>$${formatCurrency(item.precio_unitario)}</strong>
            </div>
            <div class="col-md-4">
              <small class="text-muted">Subtotal:</small>
              <strong>$${formatCurrency(item.subtotal)}</strong>
            </div>
          </div>

          ${tieneComponentes ? `
            <div id="desglose-item-${item.id_item}" style="display: none;" class="mt-3">
              <hr>
              <h6 class="text-primary mb-3">Componentes del Item</h6>
              ${componentes.map((comp) => {
                const cantidadPorUnidad = parseFloat(comp.cantidad) || 0;
                const cantidadItem = parseFloat(item.cantidad) || 0;
                const cantidadTotalNecesaria = cantidadPorUnidad * cantidadItem;
                const precioUnitario = parseFloat(comp.precio_unitario) || 0;
                const subtotalPresupuestado = cantidadTotalNecesaria * precioUnitario;
                const unidadComp = comp.unidad || "UND";
                const pedidoActual = parseFloat(comp.pedido || 0);

                // Datos de estado (presupuesto, aprobado, pendiente, rechazado, comprado)
                const yaPedidoAprobado = parseFloat(comp.ya_pedido_aprobado || 0) + parseFloat(comp.excedente_aprobado || 0);
                const yaPedidoPendiente = parseFloat(comp.ya_pedido_pendiente || 0) + parseFloat(comp.excedente_pendiente || 0);
                const yaPedidoRechazado = parseFloat(comp.ya_pedido_rechazado || 0) + parseFloat(comp.excedente_rechazado || 0);
                const yaPedido = parseFloat(comp.ya_pedido || 0);
                const yaComprado = parseFloat(comp.ya_comprado || 0);

                // Cálculo de porcentajes para barras de progreso
                const porcentajeYaPedido = cantidadTotalNecesaria > 0 ? (yaPedido / cantidadTotalNecesaria) * 100 : 0;
                const porcentajePedidoActual = cantidadTotalNecesaria > 0 ? (pedidoActual / cantidadTotalNecesaria) * 100 : 0;
                const porcentajeTotal = Math.min(porcentajeYaPedido + porcentajePedidoActual, 100);
                const estadoProgreso = obtenerColorProgreso(porcentajeYaPedido + porcentajePedidoActual);

                // Calcular máximo permitido sin justificación
                const maxPermitido = Math.max(0, cantidadTotalNecesaria - yaPedido);
                const pedidoExtraActivo = pedidosFueraPresupuesto.find(p =>
                  String(p.id_componente) === String(comp.id_componente) &&
                  String(p.id_item) === String(item.id_item)
                );

                return `
                  <div class="card mb-3 shadow-sm componente-por-item-card" data-item-id="${item.id_item}" data-componente-id="${comp.id_componente}">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                      <div>
                        <h6 class="mb-0">
                          <strong>${comp.descripcion || 'Sin descripción'}</strong>
                        </h6>
                        <small class="text-muted">
                          <span class="badge ${obtenerClaseBadgeTipo(comp.tipo_componente || 'material')}">${obtenerNombreTipoComponente(comp.tipo_componente || 'material')}</span>
                          | ${unidadComp}
                        </small>
                      </div>
                      <div>
                        <span class="badge ${estadoProgreso.colorClass} ms-1">${estadoProgreso.colorText}</span>
                        ${pedidoExtraActivo ? `
                          <span class="badge bg-warning text-dark ms-1">
                            <i class="bi bi-exclamation-triangle"></i> +${pedidoExtraActivo.cantidad_extra.toFixed(4)} pendiente
                          </span>
                        ` : ''}
                      </div>
                    </div>
                    <div class="card-body">
                      <!-- TABLA DE ESTADOS DEL COMPONENTE -->
                      <div class="table-responsive mb-2">
                        <table class="table table-sm table-bordered mb-1" style="font-size: 0.85rem;">
                          <thead class="table-light">
                            <tr class="text-center">
                              <th style="width: 16%;">Presupuestado</th>
                              <th style="width: 14%;" class="bg-success text-white">Aprobado</th>
                              <th style="width: 14%;" class="bg-warning">Pendiente</th>
                              <th style="width: 14%;" class="bg-danger text-white">Rechazado</th>
                              <th style="width: 16%;" class="bg-primary text-white">Total Pedido</th>
                              <th style="width: 12%;" class="bg-secondary text-white">Comprado</th>
                              <th style="width: 14%;">Precio Unit.</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr class="text-center">
                              <td class="fw-bold">${cantidadTotalNecesaria.toFixed(4)} ${unidadComp}</td>
                              <td class="${yaPedidoAprobado > 0 ? 'table-success fw-bold' : ''}">${yaPedidoAprobado.toFixed(4)}</td>
                              <td class="${yaPedidoPendiente > 0 ? 'table-warning fw-bold' : ''}">${yaPedidoPendiente.toFixed(4)}</td>
                              <td class="${yaPedidoRechazado > 0 ? 'table-danger fw-bold text-white' : ''}">${yaPedidoRechazado.toFixed(4)}</td>
                              <td class="${yaPedido > 0 ? 'table-primary fw-bold' : ''}">
                                ${yaPedido.toFixed(4)}
                                <br><small class="text-muted">(${porcentajeYaPedido.toFixed(1)}%)</small>
                              </td>
                              <td class="table-secondary">${yaComprado.toFixed(4)}</td>
                              <td class="fw-bold">$${formatCurrency(precioUnitario)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      ${pedidoExtraActivo ? '<div class="mb-2"><span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle"></i> Pedido extra pendiente de aprobación</span></div>' : ''}

                      <!-- BARRA DE PROGRESO -->
                      <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <small class="text-muted">Progreso del pedido</small>
                          <small class="text-muted">
                            ${porcentajeYaPedido.toFixed(1)}% ya pedido + ${porcentajePedidoActual.toFixed(1)}% nuevo = ${(porcentajeYaPedido + porcentajePedidoActual).toFixed(1)}%
                          </small>
                        </div>
                        <div class="progress" style="height: 12px;">
                          <div class="progress-bar bg-success" role="progressbar"
                               style="width: ${porcentajeYaPedido}%"
                               aria-valuenow="${porcentajeYaPedido}" aria-valuemin="0" aria-valuemax="100"
                               title="Ya pedido: ${porcentajeYaPedido.toFixed(1)}%">
                          </div>
                          <div class="progress-bar ${estadoProgreso.colorClass}" role="progressbar"
                               style="width: ${porcentajePedidoActual}%"
                               aria-valuenow="${porcentajePedidoActual}" aria-valuemin="0" aria-valuemax="100"
                               title="Nuevo pedido: ${porcentajePedidoActual.toFixed(1)}%">
                          </div>
                        </div>
                      </div>

                      <!-- CONTROL DE CANTIDAD A PEDIR -->
                      <div class="row align-items-center">
                        <div class="col-md-6">
                          <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-muted">Cantidad a pedir:</small>
                            <small class="text-muted">Subtotal: <strong id="subtotal-item-comp-${item.id_item}-${comp.id_componente}">$${formatCurrency(pedidoActual * precioUnitario)}</strong></small>
                          </div>
                          <div class="input-group input-group-sm">
                            <input type="number"
                                   class="form-control form-control-sm cantidad-componente-item-por-item ${pedidoExtraActivo ? 'border-warning' : ''} ${maxPermitido <= 0 ? 'bg-light text-muted' : ''}"
                                   value="${pedidoActual.toFixed(4)}"
                                   min="0"
                                   max="${maxPermitido}"
                                   step="0.0001"
                                   ${maxPermitido <= 0 ? 'disabled' : ''}
                                   data-item-id="${item.id_item}"
                                   data-componente-id="${comp.id_componente}"
                                   data-precio="${precioUnitario}"
                                   data-unidad="${unidadComp}"
                                   data-cantidad-total="${cantidadTotalNecesaria}"
                                   data-ya-pedido="${yaPedido}"
                                   data-max-permitido="${maxPermitido}"
                                   data-descripcion="${(comp.descripcion || '').replace(/"/g, '&quot;')}"
                                   data-codigo-item="${(item.codigo_item || '').replace(/"/g, '&quot;')}"
                                   data-nombre-item="${(item.nombre_item || '').replace(/"/g, '&quot;')}"
                                   onchange="validarYActualizarCantidadComponentePorItem(this)">
                            <span class="input-group-text">${unidadComp}</span>
                          </div>
                          <small class="text-muted">
                            ${maxPermitido <= 0 
                              ? '<span class="text-danger"><i class="bi bi-exclamation-circle"></i> Sin disponibilidad - Presupuesto completo</span>' 
                              : `Disponible: <strong class="text-success">${maxPermitido.toFixed(2)} ${unidadComp}</strong>`}
                          </small>
                          ${pedidoExtraActivo ? `
                            <div class="mt-1">
                              <small class="text-warning">
                                <i class="bi bi-info-circle"></i> Exceder solicitará autorización
                              </small>
                            </div>
                          ` : ''}
                        </div>
                        <div class="col-md-6 text-end">
                          <button class="btn btn-sm btn-outline-success" type="button" onclick="agregarMaximoCantidadPorItemV2(this)" data-item-id="${item.id_item}" data-componente-id="${comp.id_componente}">
                            <i class="bi bi-plus-circle"></i> Máxima Cantidad
                          </button>
                          ${pedidoExtraActivo ? `
                            <button class="btn btn-sm btn-outline-warning ms-2" type="button" onclick="eliminarPedidoExtraPorItem('${item.id_item}', '${comp.id_componente}')">
                              <i class="bi bi-trash"></i> Cancelar Extra
                            </button>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}

              <!-- Total del item -->
              <div class="alert alert-light mt-3">
                <div class="row">
                  <div class="col-md-6">
                    <strong>Total Presupuestado:</strong> $${formatCurrency(componentes.reduce((sum, comp) => {
                      const cantTotal = (parseFloat(comp.cantidad) || 0) * (parseFloat(item.cantidad) || 0);
                      return sum + (cantTotal * (parseFloat(comp.precio_unitario) || 0));
                    }, 0))}
                  </div>
                  <div class="col-md-6 text-end">
                    <strong>Total en Pedido Actual:</strong> <span id="total-pedido-item-${item.id_item}">$${formatCurrency(componentes.reduce((sum, comp) => sum + ((parseFloat(comp.pedido) || 0) * (parseFloat(comp.precio_unitario) || 0)), 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          ` : '<div class="text-muted small"><i class="bi bi-info-circle"></i> Este item no tiene componentes asociados.</div>'}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Agrega la cantidad máxima permitida al pedido desde la vista por items
 */
function agregarMaximoCantidadPorItem(button) {
  const itemId = button.dataset.itemId;
  const componenteId = button.dataset.componenteId;
  
  // Buscar el item y componente
  const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemId));
  if (!item || !item.componentes) return;
  
  const componente = item.componentes.find(c => String(c.id_componente) === String(componenteId));
  if (!componente) return;
  
  // Calcular cantidad máxima
  const cantidadPorUnidad = parseFloat(componente.cantidad) || 0;
  const cantidadItem = parseFloat(item.cantidad) || 0;
  const cantidadMaxima = cantidadPorUnidad * cantidadItem;
  
  // Actualizar el pedido
  componente.pedido = cantidadMaxima;
  
  // Actualizar el input
  const input = document.querySelector(`input.cantidad-componente-item-por-item[data-item-id="${itemId}"][data-componente-id="${componenteId}"]`);
  if (input) {
    input.value = cantidadMaxima.toFixed(4);
  }
  
  // Sincronizar con vista agrupada
  sincronizarPedidoConComponenteAgrupado(itemId, componenteId, cantidadMaxima);

  // Actualizar estadísticas y carrito
  actualizarEstadisticas();
  guardarCarritoEnStorage();

  // Notificar al usuario
  console.log(`[Pedido] Agregada cantidad máxima: ${cantidadMaxima.toFixed(4)}`);
}

/**
 * Valida la cantidad ingresada y muestra modal si excede el presupuesto
 * Versión para vista por items con lógica completa de validación
 */
function validarYActualizarCantidadComponentePorItem(input) {
  const nuevaCantidad = parseFloat(input.value) || 0;
  const itemId = input.dataset.itemId;
  const componenteId = input.dataset.componenteId;

  // Obtener datos del input
  const cantidadTotalNecesaria = parseFloat(input.dataset.cantidadTotal) || 0;
  const yaPedido = parseFloat(input.dataset.yaPedido) || 0;
  const maxPermitido = parseFloat(input.dataset.maxPermitido) || 0;
  const precioUnitario = parseFloat(input.dataset.precio) || 0;
  const descripcion = input.dataset.descripcion || '';
  const codigoItem = input.dataset.codigoItem || '';
  const nombreItem = input.dataset.nombreItem || '';
  const unidad = input.dataset.unidad || 'UND';

  // Buscar el item y componente
  const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemId));
  if (!item || !item.componentes) return;

  const componente = item.componentes.find(c => String(c.id_componente) === String(componenteId));
  if (!componente) return;

  // VALIDACIÓN: Si excede el máximo permitido
  if (nuevaCantidad > maxPermitido) {
    // Preparar datos para el modal
    const itemInfo = {
      id_item: itemId,
      codigo_item: codigoItem,
      nombre_item: nombreItem
    };

    const componenteInfo = {
      id_componente: componenteId,
      descripcion: descripcion,
      unidad: unidad,
      precio_unitario: precioUnitario,
      // Agregar items_que_usan para compatibilidad con solicitarJustificacionPedidoExtra
      items_que_usan: [{
        id_item: itemId,
        codigo_item: codigoItem,
        nombre_item: nombreItem,
        cantidad_componente: cantidadTotalNecesaria,
        ya_pedido: yaPedido
      }]
    };

    // Mostrar modal de pedido fuera de presupuesto
    solicitarJustificacionPedidoExtra(
      componenteInfo,
      itemInfo,
      nuevaCantidad,
      maxPermitido
    );

    // Resetear al valor máximo permitido
    input.value = maxPermitido.toFixed(4);
    componente.pedido = maxPermitido;
  } else {
    // Dentro del presupuesto - actualizar normalmente
    componente.pedido = nuevaCantidad;
  }

  // Actualizar subtotal visual
  const subtotalElement = document.getElementById(`subtotal-item-comp-${itemId}-${componenteId}`);
  if (subtotalElement) {
    subtotalElement.textContent = `$${formatCurrency(componente.pedido * precioUnitario)}`;
  }

  // Actualizar total del item
  const totalItemElement = document.getElementById(`total-pedido-item-${itemId}`);
  if (totalItemElement) {
    const totalPedido = item.componentes.reduce((sum, comp) => {
      return sum + ((parseFloat(comp.pedido) || 0) * (parseFloat(comp.precio_unitario) || 0));
    }, 0);
    totalItemElement.textContent = `$${formatCurrency(totalPedido)}`;
  }

  // Sincronizar con vista agrupada
  sincronizarPedidoConComponenteAgrupado(itemId, componenteId, componente.pedido);

  // Actualizar estadísticas
  actualizarEstadisticas();

  // Guardar carrito
  guardarCarritoEnStorage();

  console.log('%c[Validación] Cantidad actualizada:', 'color: #28a745; font-weight: bold;', {
    item: itemId,
    componente: componenteId,
    cantidad: componente.pedido,
    maxPermitido: maxPermitido,
    dentroPresupuesto: componente.pedido <= maxPermitido
  });
}

/**
 * Agrega la cantidad máxima permitida con validación de presupuesto
 * Versión V2 para la nueva UI completa
 */
function agregarMaximoCantidadPorItemV2(button) {
  const itemId = button.dataset.itemId;
  const componenteId = button.dataset.componenteId;

  // Buscar el item y componente
  const item = itemsData.itemsIndividuales?.find(i => String(i.id_item) === String(itemId));
  if (!item || !item.componentes) return;

  const componente = item.componentes.find(c => String(c.id_componente) === String(componenteId));
  if (!componente) return;

  // Calcular cantidades
  const cantidadPorUnidad = parseFloat(componente.cantidad) || 0;
  const cantidadItem = parseFloat(item.cantidad) || 0;
  const cantidadTotalNecesaria = cantidadPorUnidad * cantidadItem;
  const yaPedido = parseFloat(componente.ya_pedido || 0);
  const maxPermitido = Math.max(0, cantidadTotalNecesaria - yaPedido);

  // Actualizar el pedido al máximo permitido
  componente.pedido = maxPermitido;

  // Actualizar el input
  const input = document.querySelector(`input.cantidad-componente-item-por-item[data-item-id="${itemId}"][data-componente-id="${componenteId}"]`);
  if (input) {
    input.value = maxPermitido.toFixed(4);

    // Actualizar subtotal visual
    const precioUnitario = parseFloat(componente.precio_unitario) || 0;
    const subtotalElement = document.getElementById(`subtotal-item-comp-${itemId}-${componenteId}`);
    if (subtotalElement) {
      subtotalElement.textContent = `$${formatCurrency(maxPermitido * precioUnitario)}`;
    }
  }

  // Actualizar total del item
  const totalItemElement = document.getElementById(`total-pedido-item-${itemId}`);
  if (totalItemElement) {
    const totalPedido = item.componentes.reduce((sum, comp) => {
      return sum + ((parseFloat(comp.pedido) || 0) * (parseFloat(comp.precio_unitario) || 0));
    }, 0);
    totalItemElement.textContent = `$${formatCurrency(totalPedido)}`;
  }

  // Sincronizar con vista agrupada
  sincronizarPedidoConComponenteAgrupado(itemId, componenteId, maxPermitido);

  // Actualizar estadísticas y carrito
  actualizarEstadisticas();
  guardarCarritoEnStorage();

  // Notificar al usuario
  if (maxPermitido > 0) {
    console.log(`[Pedido] Agregada cantidad máxima permitida: ${maxPermitido.toFixed(4)}`);
  } else {
    alert('No hay presupuesto disponible para agregar más cantidad de este componente.');
  }
}

/**
 * Elimina un pedido extra/fuera de presupuesto para un item específico
 */
function eliminarPedidoExtraPorItem(itemId, componenteId) {
  if (!confirm('¿Está seguro de cancelar este pedido fuera de presupuesto?')) {
    return;
  }

  // Encontrar y eliminar el pedido extra
  const index = pedidosFueraPresupuesto.findIndex(p =>
    String(p.id_item) === String(itemId) &&
    String(p.id_componente) === String(componenteId)
  );

  if (index >= 0) {
    pedidosFueraPresupuesto.splice(index, 1);

    // Recargar la vista para actualizar la UI
    filtrarMaterialesPedido();

    // Actualizar estadísticas
    actualizarEstadisticas();

    // Guardar carrito
    guardarCarritoEnStorage();

    console.log(`[Pedido Extra] Eliminado pedido extra para item ${itemId}, componente ${componenteId}`);
  }
}

window.agregarMaximoCantidadPorItem = agregarMaximoCantidadPorItem;
window.validarYActualizarCantidadComponentePorItem = validarYActualizarCantidadComponentePorItem;
window.agregarMaximoCantidadPorItemV2 = agregarMaximoCantidadPorItemV2;
window.eliminarPedidoExtraPorItem = eliminarPedidoExtraPorItem;

/**
 * Carga el catálogo de proveedores para matching en cotizaciones
 */
window.filtrarMaterialesPedido = filtrarMaterialesPedido;
window.cambiarVistaPedido = cambiarVistaPedido;
window.mostrarItemsPorItem = mostrarItemsPorItem;
window.mostrarItemsIndividualesEnVista = mostrarItemsIndividualesEnVista;
window.toggleDesgloseItem = toggleDesgloseItem;
window.actualizarCantidadComponentePorItem = actualizarCantidadComponentePorItem;
window.sincronizarPedidoConComponenteAgrupado = sincronizarPedidoConComponenteAgrupado;
window.sincronizarCarritoConVistaActiva = sincronizarCarritoConVistaActiva;
window.sincronizarCarritoAVistaItems = sincronizarCarritoAVistaItems;
window.sincronizarCarritoAVistaAgrupada = sincronizarCarritoAVistaAgrupada;
window.sincronizarDatosEntreVistas = sincronizarDatosEntreVistas;

// Exportar funciones de anexos
window.abrirModalAnexos = abrirModalAnexos;
window.cargarListaAnexos = cargarListaAnexos;
window.obtenerAnexosComponente = obtenerAnexosComponente;
window.guardarAnexoEnComponente = guardarAnexoEnComponente;
window.eliminarAnexoComponente = eliminarAnexoComponente;
window.sincronizarAnexoEntreVistas = sincronizarAnexoEntreVistas;
window.actualizarIndicadorAnexos = actualizarIndicadorAnexos;
window.manejarSubidaArchivos = manejarSubidaArchivos;
window.subirArchivoComponente = subirArchivoComponente;
window.obtenerIconoPorExtension = obtenerIconoPorExtension;
window.formatearTamanio = formatearTamanio;
window.cargarAnexosDesdeBD = cargarAnexosDesdeBD;
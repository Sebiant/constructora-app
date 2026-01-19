const OrdenesCompraUI = (() => {
  const state = {
    ordenes: [],
    ordenesFiltradas: [],
    pedidos: [],
    proveedores: [],
    productosSeleccionados: new Map(),
    modalOrden: null,
    modalDetalle: null,
    vistaActual: 'tabla',
    isCargandoProductos: false,
    inicializado: false
  };

  const API_ORDENES = '/sgigescomnew/src/OrdenesCompra/Interfaces/OrdenesCompraController.php';

  const selectores = {
    tablaOrdenes: '#tablaOrdenesBody',
    contenedorTarjetas: '#contenedorTarjetas',
    modalOrden: '#modalOrdenCompra',
    modalDetalle: '#modalDetalleOrden',
    formOrden: '#formOrdenCompra',
    contadorOrdenes: '#contadorOrdenes',
    totalPendientes: '#totalPendientes',
    totalAprobadas: '#totalAprobadas',
    totalCompradas: '#totalCompradas',
    montoTotal: '#montoTotal'
  };

  // Inicialización
  async function init() {
    state.modalOrden = new bootstrap.Modal(document.querySelector(selectores.modalOrden));
    state.modalDetalle = new bootstrap.Modal(document.querySelector(selectores.modalDetalle));

    // Event listeners
    document.getElementById('btnRefrescar')?.addEventListener('click', cargarOrdenes);
    document.getElementById('btnNuevaOrden')?.addEventListener('click', mostrarModalNuevaOrden);
    document.getElementById('btnBuscar')?.addEventListener('click', filtrarOrdenes);
    document.getElementById('searchInput')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') filtrarOrdenes();
    });

    // Filtros
    document.getElementById('filterEstado')?.addEventListener('change', filtrarOrdenes);
    document.getElementById('filterProveedor')?.addEventListener('change', filtrarOrdenes);
    document.getElementById('fechaDesde')?.addEventListener('change', filtrarOrdenes);
    document.getElementById('fechaHasta')?.addEventListener('change', filtrarOrdenes);

    // Vista toggle
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => cambiarVista(e.target.dataset.view));
    });

    // Formulario
    document.getElementById('idPedido')?.addEventListener('change', cargarProductosPedido);
    document.getElementById('btnGuardarOrden')?.addEventListener('click', guardarOrden);
    document.getElementById('selectAll')?.addEventListener('change', seleccionarTodosProductos);

    // Event listener para recargar proveedores cuando se cierra el modal de agregar proveedor
    const modalProveedor = document.getElementById('modalAgregarProveedor');
    if (modalProveedor) {
      modalProveedor.addEventListener('hidden.bs.modal', function () {
        console.log('Modal de proveedor cerrado, recargando lista de proveedores...');
        cargarProveedores();
      });
    }

    await Promise.all([
      cargarProveedores(),
      cargarPedidos(),
      cargarOrdenes()
    ]);

    // Marcar inicialización completa
    state.inicializado = true;
  }

  // Cargar datos principales
  async function cargarOrdenes() {
    try {
      const response = await fetch(`${API_ORDENES}?action=getOrdenesCompra`);
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error || 'Error al cargar órdenes');
      
      state.ordenes = result.data || [];
      state.ordenesFiltradas = [];
      renderizarOrdenes();
      actualizarResumen();
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      mostrarError('Error al cargar las órdenes de compra');
    }
  }

  async function cargarProveedores() {
    try {
      const response = await fetch(`${API_ORDENES}?action=getProveedores`);
      const result = await response.json();
      
      if (result.success) {
        state.proveedores = result.data || [];
        llenarSelect('filterProveedor', state.proveedores, 'id_provedor', 'nombre');
        llenarSelect('idProveedor', state.proveedores, 'id_provedor', 'nombre');
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  }

  async function cargarPedidos() {
    try {
      console.log('📡 Cargando pedidos disponibles...');
      const response = await fetch(`${API_ORDENES}?action=getPedidosDisponibles`);
      const result = await response.json();
      
      console.log('📥 Respuesta de pedidos:', result);
      
      if (result.success) {
        console.log('✅ Pedidos cargados:', result.data);
        state.pedidos = result.data || [];
        llenarSelect('idPedido', state.pedidos, 'id_pedido', 'descripcion_pedido');
      } else {
        console.error('❌ Error en API de pedidos:', result.error);
        mostrarError(result.error || 'Error al cargar pedidos');
      }
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      mostrarError('Error de conexión al cargar pedidos');
    }
  }

  async function cargarProductosPedido() {
    const idPedido = document.getElementById('idPedido').value;
    console.log('🔍 Cargando productos para pedido ID:', idPedido);

    if (!idPedido) {
      console.log('❌ No se seleccionó pedido');
      return;
    }

    // Verificar si el pedido ya tiene una orden de compra
    try {
      console.log('🔍 Verificando si el pedido ya tiene orden de compra...');
      const response = await fetch(`${API_ORDENES}?action=verificarOrdenExistente&id_pedido=${idPedido}`);
      const result = await response.json();
      
      console.log('📥 Respuesta de verificación:', result);
      
      if (result.success && result.tieneOrdenCompleto) {
        console.log('⚠️ El pedido ya está completamente ordenado (faltante_total=0)');
        alert('Este pedido ya está completamente ordenado. Seleccione otro pedido con faltantes.');
        
        // Limpiar selección
        document.getElementById('idPedido').value = '';
        document.getElementById('tablaProductosBody').innerHTML = '';
        document.getElementById('contadorProductos').textContent = '0 productos';
        
        // Deshabilitar el botón de guardar
        const btnGuardar = document.getElementById('btnGuardarOrden');
        if (btnGuardar) {
          btnGuardar.disabled = true;
          btnGuardar.innerHTML = '<i class="bi bi-lock"></i> Pedido sin faltantes';
          btnGuardar.className = 'btn btn-secondary w-100';
        }
        
        return;
      } else {
        // Rehabilitar botón guardar si hay posibilidad de comprar
        const btnGuardar = document.getElementById('btnGuardarOrden');
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.innerHTML = '<i class="bi bi-check-circle"></i> Guardar Orden';
          btnGuardar.className = 'btn btn-primary';
        }
      }
    } catch (error) {
      console.error('Error al verificar orden existente:', error);
      // Si hay error, continuar con la carga normal
    }

    if (state.isCargandoProductos) {
      console.log('⏳ Ya hay una carga de productos en curso, se omite esta llamada');
      return;
    }

    state.isCargandoProductos = true;
    try {
      console.log('📡 Haciendo llamada a API...');
      const url = `${API_ORDENES}?action=getProductosPedido&id_pedido=${idPedido}`;
      console.log('🌐 URL de llamada:', url);
      
      const response = await fetch(url);
      const raw = await response.text();
      let result;
      try {
        result = JSON.parse(raw);
      } catch (e) {
        console.error('❌ Respuesta no JSON desde el servidor:', raw);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('📥 Respuesta de API:', result);
      console.log('📊 Status HTTP:', response.status);
      console.log('📊 Headers:', response.headers);

      if (result.success) {
        console.log('✅ Productos cargados:', result.data);
        console.log('📊 Cantidad de productos:', result.data ? result.data.length : 0);
        state.productos = result.data || [];
        renderizarTablaProductos();
        actualizarResumen();
      } else {
        console.error('❌ Error en API:', result.error);
        mostrarError(result.error || 'Error al cargar productos del pedido');
      }
    } catch (error) {
      console.error('❌ Error en la llamada:', error);
      console.error('📊 Stack trace:', error.stack);
      mostrarError('Error de conexión al cargar productos');
    } finally {
      state.isCargandoProductos = false;
    }
  }

  // Renderizado
  function renderizarOrdenes() {
    const datos = state.ordenesFiltradas.length ? state.ordenesFiltradas : state.ordenes;
    
    if (state.vistaActual === 'tabla') {
      renderizarVistaTabla(datos);
    } else {
      renderizarVistaTarjetas(datos);
    }

    actualizarContador(datos.length);
  }

  function renderizarVistaTabla(ordenes) {
    const tbody = document.querySelector(selectores.tablaOrdenes);
    
    if (!ordenes.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">
            <i class="bi bi-inbox text-muted" style="font-size: 2rem;"></i>
            <p class="mb-0 mt-2 text-muted">No hay órdenes de compra registradas</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = ordenes.map(orden => `
      <tr>
        <td class="fw-semibold">${orden.numero_orden}</td>
        <td>
          <a href="#" class="text-decoration-none" onclick="OrdenesCompraUI.verDetallePedido(${orden.id_pedido})">
            #${orden.id_pedido}
          </a>
        </td>
        <td>${orden.nombre_proveedor || '-'}</td>
        <td>${formatDate(orden.fecha_orden)}</td>
        <td>${getBadgeEstado(orden.estado)}</td>
        <td class="text-end fw-semibold">$${formatCurrency(orden.total)}</td>
        <td>${orden.numero_factura || '<span class="text-muted">Sin factura</span>'}</td>
        <td class="text-center">
          <button class="btn btn-outline-info btn-sm" title="Inspeccionar orden" 
                  onclick="OrdenesCompraUI.verDetalle(${orden.id_orden_compra})">
            <i class="bi bi-eye"></i> Inspeccionar
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderizarVistaTarjetas(ordenes) {
    const contenedor = document.querySelector(selectores.contenedorTarjetas);
    
    if (!ordenes.length) {
      contenedor.innerHTML = `
        <div class="col-12 text-center py-4">
          <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
          <p class="mb-0 mt-2 text-muted">No hay órdenes de compra registradas</p>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = ordenes.map(orden => `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <strong>${orden.numero_orden}</strong>
            ${getBadgeEstado(orden.estado)}
          </div>
          
          <div class="card-body">
            <div class="mb-2">
              <small class="text-muted">Pedido:</small>
              <div>#${orden.id_pedido}</div>
            </div>
            
            <div class="mb-2">
              <small class="text-muted">Proveedor:</small>
              <div>${orden.nombre_proveedor || '-'}</div>
            </div>
            
            <div class="mb-2">
              <small class="text-muted">Fecha:</small>
              <div>${formatDate(orden.fecha_orden)}</div>
            </div>
            
            <div class="mb-3">
              <small class="text-muted">Total:</small>
              <div class="h5 text-primary mb-0">$${formatCurrency(orden.total)}</div>
            </div>
            
            <div class="d-grid gap-2">
              <button class="btn btn-outline-info btn-sm" 
                      onclick="OrdenesCompraUI.verDetalle(${orden.id_orden_compra})">
                <i class="bi bi-eye"></i> Inspeccionar
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderizarTablaProductos() {
    const contenedor = document.getElementById('tablaProductosBody');
    const contador = document.getElementById('contadorProductos');
    
    console.log('🎨 Renderizando tabla de productos...');
    console.log('📊 Productos en state:', state.productos);
    console.log('📊 Contenedor encontrado:', !!contenedor);
    console.log('📊 Contador encontrado:', !!contador);
    
    if (!contenedor) {
      console.error('❌ No se encontró el contenedor tablaProductosBody');
      return;
    }
    
    if (!state.productos || state.productos.length === 0) {
      console.log('📭 No hay productos para mostrar');
      contenedor.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-3 text-muted">
            <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
            <p class="mb-0 mt-2">Seleccione un pedido para ver sus productos</p>
          </td>
        </tr>
      `;
      if (contador) contador.textContent = '0 productos';
      return;
    }
    
    console.log('📊 Renderizando', state.productos.length, 'productos');
    let html = state.productos.map((producto, index) => {
      const cantPedida = Number(producto.cantidad_solicitada ?? producto.cantidad ?? 0);
      const cantOC = Number(producto.cantidad_comprada ?? 0);
      const precio = Number(producto.precio_unitario ?? 0);
      const subtotal = Number(producto.subtotal ?? (cantOC * precio));
      const disponible = Number(producto.cantidad_disponible ?? 0);
      const cantComprar = Math.min(disponible, cantPedida - cantOC);
      
      // Obtener IDs originales para el checkbox y otros elementos
      const idsOriginales = Array.isArray(producto.id_det_pedido) ? producto.id_det_pedido : [producto.id_det_pedido];
      const primerId = idsOriginales[0]; // Usar el primer ID para el checkbox
      
      // Indicador visual si hay múltiples productos agrupados
      const indicadorAgrupado = idsOriginales.length > 1 ? 
        '<span class="badge bg-info ms-1" title="Productos agrupados"><i class="bi bi-layers"></i></span>' : '';
      
      console.log(`📦 Producto ${index + 1}:`, {
        ids_originales: idsOriginales,
        descripcion: producto.descripcion,
        cantPedida,
        cantOC,
        precio,
        subtotal,
        disponible,
        cantComprar
      });
      
      return `
        <tr>
          <td width="5%">
            <input type="checkbox" class="form-check-input producto-checkbox" 
                   data-id="${primerId}" 
                   data-ids-originales="${JSON.stringify(idsOriginales)}"
                   data-disponible="${disponible}"
                   ${cantComprar <= 0 ? 'disabled' : ''}
                   onchange="OrdenesCompraUI.actualizarProductoSeleccionado(${primerId}, this)">
          </td>
          <td>
            ${escapeHtml(producto.descripcion)}
            ${indicadorAgrupado}
          </td>
          <td class="text-center">${escapeHtml(producto.unidad || '')}</td>
          <td class="text-center">${cantPedida.toFixed(2)}</td>
          <td class="text-center">${cantOC.toFixed(2)}</td>
          <td class="text-center">${disponible.toFixed(2)}</td>
          <td class="text-center">
            <div class="input-group input-group-sm">
              <input type="number" 
                     class="form-control form-control-sm text-center cantidad-comprar" 
                     min="0" 
                     step="any"
                     max="${cantComprar}" 
                     value="${cantComprar}"
                     data-id="${primerId}"
                     data-ids-originales="${JSON.stringify(idsOriginales)}"
                     data-cant-pedida="${cantPedida}"
                     onchange="OrdenesCompraUI.actualizarCantidadComprar(this)">
              <button class="btn btn-outline-primary btn-sm" type="button"
                      title="Usar cantidad pedida"
                      onclick="OrdenesCompraUI.autofillCantidadPedida(${primerId})">
                <i class="bi bi-arrow-repeat"></i>
              </button>
            </div>
          </td>
          <td class="text-end">${formatMoney(precio)}</td>
          <td class="text-end">${formatMoney(subtotal)}</td>
        </tr>
      `;
    }).join('');
    
    console.log('📊 HTML generado, longitud:', html.length);
    
    contenedor.innerHTML = html;
    if (contador) contador.textContent = `${state.productos.length} productos`;
    
    console.log('✅ Tabla renderizada con', state.productos.length, 'productos');
  }

  function renderizarProductosPedido(productos) {
    const tbody = document.getElementById('tablaProductosBody');
    state.productosSeleccionados.clear();
    
    if (!productos.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-3 text-muted">
            El pedido no tiene productos disponibles para órdenes de compra
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = productos.map(producto => `
      <tr data-id-det-pedido="${producto.id_det_pedido}">
        <td>
          <input type="checkbox" class="form-check-input producto-checkbox" 
                 data-id="${producto.id_det_pedido}" 
                 ${producto.cantidad_maxima_seleccionable <= 0 ? 'disabled' : ''} />
        </td>
        <td>
          <div>${producto.descripcion}</div>
          <small class="text-muted">Estado: ${getBadgeEstadoProducto(producto.estado_producto)}</small>
        </td>
        <td class="text-center">${producto.unidad || '-'}</td>
        <td class="text-center">
          <div class="fw-semibold">${producto.cantidad}</div>
        </td>
        <td class="text-center">
          <div class="text-info">${producto.cantidad_comprada}</div>
        </td>
        <td class="text-center">
          <div class="text-success fw-bold">${producto.cantidad_disponible}</div>
        </td>
        <td class="text-center">
          <div class="input-group input-group-sm">
            <input type="number" class="form-control form-control-sm text-center cantidad-comprar" 
                   data-id="${producto.id_det_pedido}" 
                   value="${producto.cantidad_disponible}" 
                   min="0" 
                   max="${producto.cantidad_maxima_seleccionable}"
                   step="0.01"
                   ${producto.cantidad_maxima_seleccionable <= 0 ? 'disabled' : ''} />
            <button class="btn btn-outline-primary btn-sm btn-autofill" 
                    type="button" 
                    data-id="${producto.id_det_pedido}"
                    data-cantidad="${producto.cantidad_disponible}"
                    title="Poner cantidad disponible">
              <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </td>
        <td class="text-end">$${formatCurrency(producto.precio_unitario)}</td>
        <td class="text-end subtotal-producto">$${formatCurrency(producto.subtotal)}</td>
      </tr>
    `).join('');

    // Event listeners para productos
    document.querySelectorAll('.producto-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const cantidadInput = document.querySelector(`.cantidad-comprar[data-id="${id}"]`);
        
        if (e.target.checked) {
          const producto = productos.find(p => p.id_det_pedido == id);
          state.productosSeleccionados.set(id, {
            ...producto,
            cantidad_comprar: parseFloat(cantidadInput.value)
          });
          cantidadInput.disabled = false;
        } else {
          state.productosSeleccionados.delete(id);
          cantidadInput.disabled = true;
        }
        
        actualizarTotales();
      });
    });

    document.querySelectorAll('.cantidad-comprar').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.id;
        const max = parseFloat(e.target.max);
        const value = parseFloat(e.target.value) || 0;
        
        // Validar que no exceda el máximo disponible
        if (value > max) {
          e.target.value = max;
        }
        
        if (state.productosSeleccionados.has(id)) {
          const producto = state.productosSeleccionados.get(id);
          producto.cantidad_comprar = parseFloat(e.target.value) || 0;
          actualizarTotales();
        }
      });
    });

    // Event listeners para botones de autofill
    document.querySelectorAll('.btn-autofill').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const cantidad = e.target.dataset.cantidad;
        const input = document.querySelector(`.cantidad-comprar[data-id="${id}"]`);
        
        if (input) {
          input.value = cantidad;
          input.dispatchEvent(new Event('input'));
        }
      });
    });

    actualizarContadorProductos();
  }

  function getBadgeEstadoProducto(estado) {
    const badges = {
      'disponible': '<span class="badge bg-success">Disponible</span>',
      'parcialmente_comprado': '<span class="badge bg-warning">Parcialmente comprado</span>',
      'comprado': '<span class="badge bg-secondary">Comprado</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
  }

  // Funciones de UI
  function mostrarModalNuevaOrden() {
    console.log('🚀 Mostrando modal de nueva orden...');
    
    // Verificar si hay parámetros en la URL (viene desde notificación)
    const urlParams = new URLSearchParams(window.location.search);
    const idPedidoDesdeURL = urlParams.get('id_pedido');
    
    console.log('📋 Parámetros URL detectados:', {
      idPedidoDesdeURL: idPedidoDesdeURL,
      tieneParametros: urlParams.toString()
    });
    
    // Resetear formulario completamente
    const form = document.querySelector(selectores.formOrden);
    if (form) {
      form.reset();
    }
    
    // Limpiar campos manualmente para asegurar limpieza completa
    const idPedido = document.getElementById('idPedido');
    const idProveedor = document.getElementById('idProveedor');
    const contenidoProductos = document.getElementById('contenidoProductos');
    const subtotalOrden = document.getElementById('subtotalOrden');
    const impuestosOrden = document.getElementById('impuestosOrden');
    const totalOrden = document.getElementById('totalOrden');
    
    console.log('📋 Elementos encontrados:', {
      form: !!form,
      idPedido: !!idPedido,
      idProveedor: !!idProveedor,
      contenidoProductos: !!contenidoProductos
    });
    
    if (idPedido) idPedido.value = '';
    if (idProveedor) idProveedor.value = '';
    if (contenidoProductos) contenidoProductos.innerHTML = '';
    
    // Resetear estado de productos seleccionados
    state.productosSeleccionados.clear();
    
    // Resetear totales
    if (subtotalOrden) subtotalOrden.textContent = '$0.00';
    if (impuestosOrden) impuestosOrden.textContent = '$0.00';
    if (totalOrden) totalOrden.textContent = '$0.00';
    
    // Si viene desde notificación con id_pedido, autocompletar datos
    if (idPedidoDesdeURL) {
      console.log('🔄 Detectado pedido desde notificación, autocompletando datos...');
      idPedido.value = idPedidoDesdeURL;
      
      // Disparar evento change para cargar productos automáticamente
      const changeEvent = new Event('change', { bubbles: true });
      idPedido.dispatchEvent(changeEvent);
      
      console.log('✅ Pedido autocompletado:', idPedidoDesdeURL);
      
      // Esperar un poco más y luego cargar productos
      setTimeout(() => {
        cargarProductosPedido();
      }, 200);
    }
    
    // Mostrar modal limpio
    const modalTitle = document.getElementById('modalOrdenTitle');
    if (modalTitle) {
      modalTitle.innerHTML = '<i class="bi bi-clipboard-plus"></i> Nueva Orden de Compra';
    }
    
    console.log('🎯 Intentando mostrar modal...');
    console.log('Modal title encontrado:', !!modalTitle);
    
    // Verificar si el modal existe
    const modalElement = document.getElementById('modalOrdenCompra');
    console.log('Elemento modal encontrado:', !!modalElement);
    
    if (modalElement) {
      console.log('✅ Modal encontrado, intentando mostrar...');
      try {
        const modal = new bootstrap.Modal(modalElement);
        console.log('📋 Instancia de modal creada:', !!modal);
        modal.show();
        console.log('✅ Modal mostrado exitosamente');
      } catch (error) {
        console.error('❌ Error al mostrar modal:', error);
        alert('Error al abrir el modal de nueva orden');
      }
    } else {
      console.error('❌ No se encontró el elemento modalOrdenCompra');
      alert('Error: No se encontró el modal de nueva orden');
    }
  }

  function cambiarVista(vista) {
    state.vistaActual = vista;
    
    // Actualizar botones
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === vista);
    });
    
    // Mostrar/ocultar vistas
    document.getElementById('vistaTabla').classList.toggle('d-none', vista !== 'tabla');
    document.getElementById('vistaTarjetas').classList.toggle('d-none', vista !== 'tarjetas');
    
    renderizarOrdenes();
  }

  function filtrarOrdenes() {
    const estado = document.getElementById('filterEstado').value;
    const proveedor = document.getElementById('filterProveedor').value;
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    const busqueda = document.getElementById('searchInput').value.toLowerCase();

    state.ordenesFiltradas = state.ordenes.filter(orden => {
      // Filtro por estado
      if (estado && orden.estado !== estado) return false;
      
      // Filtro por proveedor
      if (proveedor && orden.id_provedor != proveedor) return false;
      
      // Filtro por fechas
      if (fechaDesde && orden.fecha_orden < fechaDesde) return false;
      if (fechaHasta && orden.fecha_orden > fechaHasta) return false;
      
      // Búsqueda general
      if (busqueda) {
        const searchText = `${orden.numero_orden} ${orden.id_pedido} ${orden.numero_factura} ${orden.nombre_proveedor}`.toLowerCase();
        if (!searchText.includes(busqueda)) return false;
      }
      
      return true;
    });

    renderizarOrdenes();
  }

  function seleccionarTodosProductos(e) {
    const checkboxes = document.querySelectorAll('.producto-checkbox');
    const inputs = document.querySelectorAll('.cantidad-comprar');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked;
      checkbox.dispatchEvent(new Event('change'));
    });
  }

  function actualizarTotales() {
    let subtotal = 0;
    
    state.productosSeleccionados.forEach(producto => {
      const subtotalProducto = producto.cantidad_comprar * producto.precio_unitario;
      subtotal += subtotalProducto;
      
      // Actualizar subtotal en la tabla
      const row = document.querySelector(`tr[data-id-det-pedido="${producto.id_det_pedido}"]`);
      if (row) {
        row.querySelector('.subtotal-producto').textContent = `$${formatCurrency(subtotalProducto)}`;
      }
    });

    const impuestos = subtotal * 0.16; // 16% IVA (ajustar según configuración)
    const total = subtotal + impuestos;

    document.getElementById('subtotalOrden').textContent = `$${formatCurrency(subtotal)}`;
    document.getElementById('impuestosOrden').textContent = `$${formatCurrency(impuestos)}`;
    document.getElementById('totalOrden').textContent = `$${formatCurrency(total)}`;
  }

  function actualizarContadorProductos() {
    const total = document.querySelectorAll('.producto-checkbox').length;
    const seleccionados = state.productosSeleccionados.size;
    document.getElementById('contadorProductos').textContent = `${seleccionados} de ${total} productos`;
  }

  function actualizarContador(cantidad) {
    document.querySelector(selectores.contadorOrdenes).textContent = 
      `${cantidad} orden${cantidad !== 1 ? 'es' : ''} encontrada${cantidad !== 1 ? 's' : ''}`;
  }

  function actualizarResumen() {
    const pendientes = state.ordenes.filter(o => o.estado === 'pendiente').length;
    const aprobadas = state.ordenes.filter(o => o.estado === 'aprobada').length;
    const compradas = state.ordenes.filter(o => o.estado === 'comprada').length;
    const montoTotal = state.ordenes.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    document.getElementById('totalPendientes').textContent = pendientes;
    document.getElementById('totalAprobadas').textContent = aprobadas;
    document.getElementById('totalCompradas').textContent = compradas;
    document.getElementById('montoTotal').textContent = `$${formatCurrency(montoTotal)}`;
  }

  // Acciones CRUD
  async function guardarOrden() {
    const form = document.querySelector(selectores.formOrden);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (state.productosSeleccionados.size === 0) {
      mostrarError('Debe seleccionar al menos un producto');
      return;
    }

    const productos = Array.from(state.productosSeleccionados.values());
    const ordenData = {
      id_pedido: document.getElementById('idPedido').value,
      id_provedor: document.getElementById('idProveedor').value,
      observaciones: document.getElementById('observaciones').value,
      productos: productos,
      subtotal: document.getElementById('subtotalOrden').textContent.replace(/[$,]/g, ''),
      impuestos: document.getElementById('impuestosOrden').textContent.replace(/[$,]/g, ''),
      total: document.getElementById('totalOrden').textContent.replace(/[$,]/g, '')
    };

    try {
      const response = await fetch(`${API_ORDENES}?action=guardarOrdenCompra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordenData)
      });

      const result = await response.json();
      
      if (!result.success) throw new Error(result.error || 'Error al guardar orden');
      
      mostrarExito('Orden de compra guardada correctamente');
      
      // Cerrar modal antes de refrescar listas
      if (state.modalOrden) { 
        state.modalOrden.hide(); 
        console.log('✅ Modal cerrado exitosamente');
      }
      
      // Refrescar datos
      await Promise.all([
        cargarOrdenes(),
        cargarPedidos() // refrescar listado para excluir pedidos que quedaron sin faltantes
      ]);
      
      // Actualizar notificación de pedidos sin orden dinámicamente
      actualizarNotificacionPedidos();
    } catch (error) {
      console.error('Error guardando orden:', error);
      mostrarError(error.message);
    }
  }

  async function verDetalle(idOrden) {
    console.log('🔍 Botón inspeccionar presionado. ID Orden:', idOrden);
    
    try {
      console.log('📡 Haciendo llamada a la API...');
      
      const response = await fetch(`${API_ORDENES}?action=getDetalleOrden&id_orden_compra=${idOrden}`);
      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📊 Resultado de la API:', result);
      
      if (result.success) {
        console.log('✅ API exitosa, mostrando modal...');
        mostrarModalDetalle(result.data);
      } else {
        console.error('❌ Error en API:', result.error);
        mostrarError('Error al cargar el detalle: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error en la llamada:', error);
      mostrarError('Error al cargar el detalle de la orden');
    }
  }

  function mostrarModalDetalle(orden) {
    console.log('🎨 Renderizando modal con datos:', orden);
    
    const contenido = document.getElementById('contenidoDetalle');
    if (!contenido) {
      console.error('❌ No se encontró el elemento #contenidoDetalle');
      return;
    }
    
    console.log('📝 Escribiendo HTML en el modal...');
    
    // Generar HTML para órdenes relacionadas
    let htmlOrdenesRelacionadas = '';
    if (orden.ordenes_relacionadas && orden.ordenes_relacionadas.length > 0) {
      htmlOrdenesRelacionadas = `
        <div class="alert alert-info mb-3">
          <h6 class="alert-heading"><i class="bi bi-link-45deg"></i> Órdenes Relacionadas</h6>
          <div class="mb-2">
            ${orden.ordenes_relacionadas.map(rel => {
              const badgeClass = rel.tipo === 'original' ? 'bg-primary' : 'bg-warning';
              const icon = rel.tipo === 'original' ? 'bi-arrow-left-circle' : 'bi-arrow-right-circle';
              return `
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span class="badge ${badgeClass} me-2">
                      <i class="bi ${icon}"></i> ${rel.tipo === 'original' ? 'Original' : 'Complementaria'}
                    </span>
                    <strong>${rel.numero_orden}</strong>
                    ${rel.motivo ? `<br><small class="text-muted">${rel.motivo}</small>` : ''}
                  </div>
                  <div>
                    ${getBadgeEstado(rel.estado)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    
    contenido.innerHTML = `
      ${htmlOrdenesRelacionadas}
      
      <div class="row mb-3">
        <div class="col-md-6">
          <strong>Número de Orden:</strong> ${orden.numero_orden}
          ${orden.es_complementaria ? '<span class="badge bg-warning ms-2">Complementaria</span>' : ''}
        </div>
        <div class="col-md-6">
          <strong>Estado:</strong> ${getBadgeEstado(orden.estado)}
        </div>
      </div>
      
      <div class="row mb-3">
        <div class="col-md-6">
          <strong>Pedido:</strong> #${orden.id_pedido}
        </div>
        <div class="col-md-6">
          <strong>Proveedor:</strong> ${orden.nombre_proveedor}
        </div>
      </div>
      
      <div class="row mb-3">
        <div class="col-md-6">
          <strong>Fecha Orden:</strong> ${formatDate(orden.fecha_orden)}
        </div>
        <div class="col-md-6">
          <strong>Factura:</strong> ${orden.numero_factura || 'Sin factura'}
        </div>
      </div>
      
      ${orden.fecha_factura ? `
        <div class="row mb-3">
          <div class="col-md-6">
            <strong>Fecha Factura:</strong> ${formatDate(orden.fecha_factura)}
          </div>
          <div class="col-md-6">
            <strong></strong>
          </div>
        </div>
      ` : ''}
      
      ${orden.observaciones ? `
        <div class="row mb-3">
          <div class="col-12">
            <strong>Observaciones:</strong>
            <div class="mt-1 p-2 bg-light rounded">${orden.observaciones.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      ` : ''}
      
      <div class="row mb-3">
        <div class="col-md-4">
          <strong>Subtotal:</strong> $${parseFloat(orden.subtotal || 0).toFixed(2)}
        </div>
        <div class="col-md-4">
          <strong>Impuestos:</strong> $${parseFloat(orden.impuestos || 0).toFixed(2)}
        </div>
        <div class="col-md-4">
          <strong>Total:</strong> $${parseFloat(orden.total || 0).toFixed(2)}
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <h6 class="fw-bold mb-3">Productos de la Orden</h6>
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th class="text-center">Unidad</th>
                  <th class="text-end">Cant. Solicitada</th>
                  <th class="text-end">Cant. Comprada</th>
                  <th class="text-end">Cant. Recibida</th>
                  <th class="text-end">Precio Unitario</th>
                  <th class="text-end">Subtotal</th>
                  <th class="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  // Agrupar productos por descripción antes de mostrarlos
                  const productosAgrupados = agruparProductosPorDescripcion(orden.productos);
                  
                  return productosAgrupados.map(producto => {
                    const solicitada = parseFloat(producto.cantidad_solicitada || 0);
                    const comprada = parseFloat(producto.cantidad_comprada || 0);
                    const recibida = parseFloat(producto.cantidad_recibida || 0);
                    const precio = parseFloat(producto.precio_unitario || 0);
                    const subtotal = parseFloat(producto.subtotal || 0);
                    
                    // Determinar estado según si es orden original o complementaria
                    const esOrdenOriginal = !orden.es_complementaria;
                    let estadoBadge;
                    
                    if (esOrdenOriginal) {
                      // Orden original: estados más definitivos
                      estadoBadge = '<span class="badge bg-danger">No recibido</span>';
                      if (recibida >= solicitada) {
                        estadoBadge = '<span class="badge bg-success">Recibido completo</span>';
                      } else if (recibida > 0) {
                        estadoBadge = '<span class="badge bg-warning text-dark">Recibido parcial</span>';
                      } else if (comprada > 0) {
                        estadoBadge = '<span class="badge bg-warning">Comprado, no recibido</span>';
                      }
                    } else {
                      // Orden complementaria: estados más temporales
                      estadoBadge = '<span class="badge bg-secondary">Pendiente</span>';
                      if (recibida >= solicitada) {
                        estadoBadge = '<span class="badge bg-success">Recibido completo</span>';
                      } else if (recibida > 0) {
                        estadoBadge = '<span class="badge bg-warning text-dark">Recibido parcial</span>';
                      } else if (comprada > 0) {
                        estadoBadge = '<span class="badge bg-info">Comprado, pendiente recepción</span>';
                      }
                    }
                    
                    // Si hay múltiples IDs originales, mostrar un indicador
                    const indicadorAgrupado = producto.ids_originales.length > 1 ? 
                      '<span class="badge bg-info ms-1" title="Productos agrupados"><i class="bi bi-layers"></i></span>' : '';
                    
                    return `
                      <tr>
                        <td>
                          ${producto.descripcion}
                          ${indicadorAgrupado}
                        </td>
                        <td class="text-center">${producto.unidad}</td>
                        <td class="text-end">${solicitada.toFixed(2)}</td>
                        <td class="text-end">${comprada.toFixed(2)}</td>
                        <td class="text-end">${recibida.toFixed(2)}</td>
                        <td class="text-end">$${precio.toFixed(2)}</td>
                        <td class="text-end">$${subtotal.toFixed(2)}</td>
                        <td class="text-center">${estadoBadge}</td>
                      </tr>
                    `;
                  }).join('');
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      // Historial de recepciones
      ${orden.historial_recepciones && orden.historial_recepciones.length > 0 ? `
        <div class="row mt-4">
          <div class="col-12">
            <h6 class="fw-bold mb-3">
              <i class="bi bi-clock-history"></i> Historial de Recepciones (${orden.historial_recepciones.length})
            </h6>
            <div class="accordion" id="accordionHistorial">
              ${orden.historial_recepciones.map((recepcion, index) => {
                const fecha = new Date(recepcion.fecha_compra).toLocaleString('es-CO');
                const itemsRecibidos = recepcion.items_recibidos || [];
                
                return `
                  <div class="accordion-item">
                    <h2 class="accordion-header" id="heading${index}">
                      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                        <div class="d-flex justify-content-between align-items-center w-100">
                          <div>
                            <strong>Recepción #${recepcion.id_compra}</strong>
                            <span class="badge bg-success ms-2">$${parseFloat(recepcion.total_recepcion || 0).toFixed(2)}</span>
                          </div>
                          <div class="text-end">
                            <small class="text-muted">${fecha}</small>
                            ${recepcion.numero_factura ? `<span class="ms-2">Factura: ${recepcion.numero_factura}</span>` : ''}
                          </div>
                        </div>
                      </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#accordionHistorial">
                      <div class="accordion-body">
                        <div class="row mb-2">
                          <div class="col-md-6">
                            <small class="text-muted">Registrado por:</small><br>
                            <strong>${recepcion.nombre_usuario || 'Sistema'}</strong>
                          </div>
                          <div class="col-md-6 text-end">
                            <small class="text-muted">Total recepción:</small><br>
                            <strong class="text-success">$${parseFloat(recepcion.total_recepcion || 0).toFixed(2)}</strong>
                          </div>
                        </div>
                        ${recepcion.observaciones ? `
                          <div class="mb-2">
                            <small class="text-muted">Observaciones:</small><br>
                            <div>${recepcion.observaciones.replace(/\n/g, '<br>')}</div>
                          </div>
                        ` : ''}
                        ${recepcion.advertencia ? `
                          <div class="alert alert-warning py-2">
                            <small><i class="bi bi-exclamation-triangle"></i> ${recepcion.advertencia}</small>
                          </div>
                        ` : ''}
                        ${itemsRecibidos.length > 0 ? `
                          <div class="table-responsive mt-2">
                            <table class="table table-sm">
                              <thead class="table-light">
                                <tr>
                                  <th>Item</th>
                                  <th class="text-end">Cantidad</th>
                                  <th class="text-end">Vr. Unitario</th>
                                  <th class="text-end">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${itemsRecibidos.map(item => `
                                  <tr>
                                    <td>
                                      <div>${item.descripcion}</div>
                                      <small class="text-muted">${item.unidad || ''}</small>
                                    </td>
                                    <td class="text-end">${parseFloat(item.cantidad_recibida).toFixed(2)}</td>
                                    <td class="text-end">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                                    <td class="text-end fw-bold">$${parseFloat(item.subtotal_item).toFixed(2)}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                          </div>
                        ` : '<div class="text-muted">No hay detalles de items en esta recepción.</div>'}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      ` : ''}
    `;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleOrden'));
    modal.show();
  }

  function editarOrden(idOrden) {
    // Implementar edición
    console.log('Editar orden:', idOrden);
    mostrarError('Función de edición en desarrollo');
  }

  function convertirEnCompra(idOrden) {
    // Implementar conversión a compra
    console.log('Convertir en compra:', idOrden);
    mostrarError('Función de conversión en desarrollo');
  }

  function verDetallePedido(idPedido) {
    // Implementar vista de detalle de pedido
    console.log('Ver detalle pedido:', idPedido);
    mostrarError('Función en desarrollo');
  }

  // Utilidades
  function getBadgeEstado(estado) {
    const badges = {
      '': '<span class="badge bg-secondary">Sin Estado</span>',
      'pendiente': '<span class="badge bg-warning">Pendiente</span>',
      'aprobada': '<span class="badge bg-info">Aprobada</span>',
      'comprada': '<span class="badge bg-success">Comprada</span>',
      'recibida': '<span class="badge bg-primary">Recibida</span>',
      'parcialmente_recibida': '<span class="badge bg-warning text-dark">Parcialmente Recibida</span>',
      'parcialmente_comprada': '<span class="badge bg-warning text-dark">Parcialmente Comprada</span>',
      'cancelada': '<span class="badge bg-danger">Cancelada</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatMoney(amount) {
    return `${formatCurrency(amount)}`;
  }

  function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function agruparProductosPorDescripcion(productos) {
    // Los productos ya vienen agrupados desde el backend, solo necesitamos
    // asegurar que los datos estén correctos para el frontend
    return productos.map(producto => ({
      ...producto,
      ids_originales: Array.isArray(producto.id_det_pedido) ? producto.id_det_pedido : [producto.id_det_pedido]
    }));
  }

  function llenarSelect(id, data, valueField, labelField) {
    const select = document.getElementById(id);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccione...</option>';
    
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item[valueField];
      option.textContent = item[labelField];
      select.appendChild(option);
    });

    // Restaurar valor seleccionado
    if (currentValue) {
      select.value = currentValue;
    }
  }

  function mostrarExito(mensaje) {
    // Implementar notificación de éxito
    alert(mensaje);
  }

  function mostrarError(mensaje) {
    // Implementar notificación de error
    alert(mensaje);
  }

  // Actualización de selección y cantidades desde handlers inline
  function actualizarProductoSeleccionado(idDetPedido, checkboxEl) {
    const cantidadInput = document.querySelector(`.cantidad-comprar[data-id="${idDetPedido}"]`);
    
    // Obtener todos los IDs originales del checkbox
    const idsOriginalesStr = checkboxEl.dataset.idsOriginales;
    const idsOriginales = idsOriginalesStr ? JSON.parse(idsOriginalesStr) : [idDetPedido];
    
    // Buscar el producto en el estado usando cualquiera de los IDs originales
    let producto = null;
    for (const id of idsOriginales) {
      producto = (state.productos || []).find(p => {
        const pIds = Array.isArray(p.id_det_pedido) ? p.id_det_pedido : [p.id_det_pedido];
        return pIds.includes(parseInt(id));
      });
      if (producto) break;
    }
    
    if (!producto) {
      console.error('No se encontró el producto con IDs:', idsOriginales);
      return;
    }

    if (checkboxEl.checked) {
      if (cantidadInput) cantidadInput.disabled = false;
      const cantidad = cantidadInput ? parseFloat(cantidadInput.value) || 0 : 0;
      
      // Guardar el producto con todos sus IDs originales
      state.productosSeleccionados.set(String(idDetPedido), {
        ...producto,
        cantidad_comprar: cantidad,
        ids_originales: idsOriginales
      });
    } else {
      if (cantidadInput) cantidadInput.disabled = true;
      state.productosSeleccionados.delete(String(idDetPedido));
    }
    actualizarTotales();
    actualizarContadorProductos();
  }

  function actualizarCantidadComprar(inputEl) {
    const id = inputEl.dataset.id;
    const max = parseFloat(inputEl.max);
    let value = parseFloat(inputEl.value);
    if (isNaN(value)) value = 0;
    if (!isNaN(max) && value > max) { value = max; inputEl.value = max; }
    if (value < 0) { value = 0; inputEl.value = 0; }

    if (state.productosSeleccionados.has(String(id))) {
      const producto = state.productosSeleccionados.get(String(id));
      producto.cantidad_comprar = value;
      state.productosSeleccionados.set(String(id), producto);
      actualizarTotales();
    }
  }

  function autofillCantidadPedida(idDetPedido) {
    const input = document.querySelector(`.cantidad-comprar[data-id="${idDetPedido}"]`);
    if (!input) return;
    const cantPedidaAttr = input.getAttribute('data-cant-pedida');
    let cantPedida = parseFloat(cantPedidaAttr);
    if (isNaN(cantPedida)) cantPedida = 0;

    // Si hay max (disponible), llenar con el mínimo entre pedida y max para evitar bloqueo por max
    const max = parseFloat(input.max);
    if (!isNaN(max)) {
      input.value = Math.min(cantPedida, max);
    } else {
      input.value = cantPedida;
    }
    actualizarCantidadComprar(input);

    // Marcar/asegurar selección del producto si no lo está
    const checkbox = document.querySelector(`.producto-checkbox[data-id="${idDetPedido}"]`);
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      actualizarProductoSeleccionado(idDetPedido, checkbox);
    }
  }

  // Exponer funciones públicas
  async function abrirNuevaOrdenConPedido(idPedidoPreseleccionado) {
    // Asegurar que el modal y los datos base estén listos
    const form = document.querySelector(selectores.formOrden);
    if (form) form.reset();

    // Limpiar estados y totales
    state.productosSeleccionados.clear();
    const subtotalOrden = document.getElementById('subtotalOrden');
    const impuestosOrden = document.getElementById('impuestosOrden');
    const totalOrden = document.getElementById('totalOrden');
    if (subtotalOrden) subtotalOrden.textContent = '$0.00';
    if (impuestosOrden) impuestosOrden.textContent = '$0.00';
    if (totalOrden) totalOrden.textContent = '$0.00';

    const idPedidoSelect = document.getElementById('idPedido');
    if (!idPedidoSelect) {
      console.error('No se encontró el select #idPedido');
      return;
    }

    // Asegurar que los pedidos estén cargados
    if (state.pedidos.length === 0) {
      try { await cargarPedidos(); } catch (e) { console.warn('No se pudo recargar pedidos antes del autollenado', e); }
    }

    // Si aún no está el option cargado, intentar breve reintento
    const setPedidoYDisparar = () => {
      idPedidoSelect.value = String(idPedidoPreseleccionado);
      const changeEvent = new Event('change', { bubbles: true });
      idPedidoSelect.dispatchEvent(changeEvent);
      // Cargar explícitamente productos como refuerzo
      try { cargarProductosPedido(); } catch (e) {}
      setTimeout(() => {
        try { cargarProductosPedido(); } catch (e) {}
      }, 150);
    };

    if (!Array.from(idPedidoSelect.options).some(op => op.value == idPedidoPreseleccionado)) {
      // Reintentar una vez tras un pequeño delay por si el listado de pedidos está terminando de cargarse
      setTimeout(() => setPedidoYDisparar(), 150);
    } else {
      setPedidoYDisparar();
    }

    // Título del modal y mostrarlo
    const modalTitle = document.getElementById('modalOrdenTitle');
    if (modalTitle) {
      modalTitle.innerHTML = '<i class="bi bi-clipboard-plus"></i> Nueva Orden de Compra';
    }
    const modalElement = document.getElementById('modalOrdenCompra');
    if (modalElement) {
      try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } catch (e) {
        console.error('Error mostrando modal', e);
      }
    }
  }

  // Función para actualizar la notificación de pedidos sin orden dinámicamente
  async function actualizarNotificacionPedidos() {
    try {
      console.log('Actualizando notificación de pedidos sin orden...');
      const response = await fetch(`${API_ORDENES}?action=getPedidosSinOrden`);
      const result = await response.json();

      if (!result.success) return;

      console.log('Notificación actualizada:', result.data);

      // Actualizar el contador en la notificación
      const notificacionBadge = document.querySelector('.notificacion-badge strong');
      if (notificacionBadge) {
        const totalPedidos = result.data.total || 0;
        notificacionBadge.textContent = totalPedidos;

        const notificacionText = notificacionBadge.parentElement;
        if (totalPedidos > 0) {
          notificacionText.innerHTML =
            '<strong>' + totalPedidos + '</strong> pedido' + (totalPedidos > 1 ? 's' : '') + ' aprobado' + (totalPedidos > 1 ? 's' : '') + ' sin orden de compra';
        } else {
          const notificacionContainer = document.querySelector('.notificacion-pedidos');
          if (notificacionContainer) {
            notificacionContainer.style.display = 'none';
          }
        }
      }

      // Actualizar el contenido desplegable si existe
      const contenidoNotificacion = document.getElementById('notificacionContenido');
      if (contenidoNotificacion && result.data.detalles) {
        location.reload();
      }

    } catch (error) {
      console.error('Error actualizando notificación:', error);
    }
  }

  return {
    init,
    verDetalle,
    editarOrden,
    convertirEnCompra,
    verDetallePedido,
    abrirNuevaOrdenConPedido,
    actualizarProductoSeleccionado,
    actualizarCantidadComprar,
    autofillCantidadPedida
  };

  // Event listener para el botón de cerrar del modal
  document.addEventListener('click', function(e) {
    if (e.target.hasAttribute('data-bs-dismiss') || e.target.closest('[data-bs-dismiss]')) {
      if (state.modalOrden) {
        state.modalOrden.hide();
      }
      if (state.modalDetalle) {
        state.modalDetalle.hide();
      }
    }
  });
})();

// Exponer en window para uso en handlers inline
window.OrdenesCompraUI = OrdenesCompraUI;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  OrdenesCompraUI.init();
});

// ============================================
// FUNCIONES PARA GESTIÓN DE PROVEEDORES
// ============================================

// La constante API_PROVEDORES ya está definida arriba, no duplicar

/**
 * Prepara el modal para crear un nuevo proveedor
 */
function cargarModalCrearProvedor() {
  document.getElementById('formProveedores').reset();
  document.getElementById('id_proveedor').value = '';
  document.getElementById('accion_proveedor').value = 'crear';
  document.getElementById('estado_proveedor').value = '1';

  document.getElementById('modalAgregarProveedorLabel').textContent = 'Crear Proveedor';
  document.getElementById('btnGuardarProveedor').style.display = 'inline-block';
  document.getElementById('btnActualizarProveedor').style.display = 'none';
}

/**
 * Guarda un nuevo proveedor
 */
function guardarProveedor() {
  const payload = {
    nombre: document.getElementById('nombre_proveedor').value,
    telefono: document.getElementById('telefono_proveedor').value || null,
    email: document.getElementById('email_proveedor').value || null,
    whatsapp: document.getElementById('whatsapp_proveedor').value || null,
    direccion: document.getElementById('direccion_proveedor').value || null,
    contacto: document.getElementById('contacto_proveedor').value || null,
    estado: document.getElementById('estado_proveedor').value,
  };

  if (!payload.nombre.trim()) {
    alert('Nombre requerido');
    return;
  }

  fetch(API_PROVEDORES + '?action=create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(res => {
    if (res.success) {
      alert('Proveedor creado exitosamente');
      bootstrap.Modal.getInstance(document.getElementById('modalAgregarProveedor')).hide();
      // Recargar la lista de proveedores en el select
      OrdenesCompraUI.cargarProveedores();
    } else {
      alert('Error: ' + (res.error || 'No se pudo crear'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error de conexión al crear proveedor');
  });
}

/**
 * Prepara el modal para editar un proveedor existente
 */
function cargarModalEditarProvedor(id) {
  fetch(API_PROVEDORES + '?action=getById&id=' + id)
    .then(response => response.json())
    .then(res => {
      if (res.id_provedor) {
        document.getElementById('id_proveedor').value = res.id_provedor;
        document.getElementById('nombre_proveedor').value = res.nombre;
        document.getElementById('telefono_proveedor').value = res.telefono || '';
        document.getElementById('email_proveedor').value = res.email || '';
        document.getElementById('whatsapp_proveedor').value = res.whatsapp || '';
        document.getElementById('direccion_proveedor').value = res.direccion || '';
        document.getElementById('contacto_proveedor').value = res.contacto || '';
        document.getElementById('estado_proveedor').value = res.estado ? '1' : '0';

        document.getElementById('accion_proveedor').value = 'editar';
        document.getElementById('modalAgregarProveedorLabel').textContent = 'Editar Proveedor';
        document.getElementById('btnGuardarProveedor').style.display = 'none';
        document.getElementById('btnActualizarProveedor').style.display = 'inline-block';
        
        bootstrap.Modal.getInstance(document.getElementById('modalAgregarProveedor')).show();
      } else {
        alert('Proveedor no encontrado');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al cargar proveedor');
    });
}

/**
 * Actualiza un proveedor existente
 */
function guardarProveedorEditar() {
  const payload = {
    id_provedor: parseInt(document.getElementById('id_proveedor').value),
    nombre: document.getElementById('nombre_proveedor').value,
    telefono: document.getElementById('telefono_proveedor').value || null,
    email: document.getElementById('email_proveedor').value || null,
    whatsapp: document.getElementById('whatsapp_proveedor').value || null,
    direccion: document.getElementById('direccion_proveedor').value || null,
    contacto: document.getElementById('contacto_proveedor').value || null,
    estado: document.getElementById('estado_proveedor').value,
  };

  if (!payload.id_provedor || !payload.nombre.trim()) {
    alert('ID y nombre requeridos');
    return;
  }

  fetch(API_PROVEDORES + '?action=update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(res => {
    if (res.success) {
      alert('Proveedor actualizado exitosamente');
      bootstrap.Modal.getInstance(document.getElementById('modalAgregarProveedor')).hide();
      // Recargar la lista de proveedores en el select
      OrdenesCompraUI.cargarProveedores();
    } else {
      alert('Error: ' + (res.error || 'No se pudo actualizar'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error de conexión al actualizar proveedor');
  });
}

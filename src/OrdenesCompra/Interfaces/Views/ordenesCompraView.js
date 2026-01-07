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
    isCargandoProductos: false
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
      
      if (result.success && result.tieneOrden) {
        console.log('⚠️ El pedido ya tiene una orden de compra creada');
        alert('Este pedido ya tiene una orden de compra creada. No se puede crear otra orden para el mismo pedido.\n\nPara crear una nueva orden, seleccione un pedido que no tenga orden de compra.');
        
        // Limpiar selección
        document.getElementById('idPedido').value = '';
        document.getElementById('tablaProductosBody').innerHTML = '';
        document.getElementById('contadorProductos').textContent = '0 productos';
        
        // Deshabilitar el botón de guardar
        const btnGuardar = document.getElementById('btnGuardarOrden');
        if (btnGuardar) {
          btnGuardar.disabled = true;
          btnGuardar.innerHTML = '<i class="bi bi-lock"></i> Pedido ya tiene orden';
          btnGuardar.className = 'btn btn-secondary w-100';
        }
        
        return;
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
      const response = await fetch(`${API_ORDENES}?action=getProductosPedido&id_pedido=${idPedido}`);
      const result = await response.json();

      console.log('📥 Respuesta de API:', result);

      if (result.success) {
        console.log('✅ Productos cargados:', result.data);
        renderizarProductosPedido(result.data || []);
        // Importante: NO volver a disparar change aquí para evitar bucles y re-render constantes
      } else {
        console.error('❌ Error en API:', result.error);
        mostrarError(result.error || 'Error al cargar productos');
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
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
    
    if (idPedido) idPedido.value = '';
    if (idProveedor) idProveedor.value = '';
    if (contenidoProductos) contenidoProductos.innerHTML = '';
    
    // Resetear estado de productos seleccionados
    state.productosSeleccionados.clear();
    
    // Resetear totales
    if (subtotalOrden) subtotalOrden.textContent = '$0.00';
    if (impuestosOrden) impuestosOrden.textContent = '$0.00';
    if (totalOrden) totalOrden.textContent = '$0.00';
    
    // Mostrar modal limpio
    const modalTitle = document.getElementById('modalOrdenTitle');
    if (modalTitle) {
      modalTitle.innerHTML = '<i class="bi bi-clipboard-plus"></i> Nueva Orden de Compra';
    }
    
    state.modalOrden.show();
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
      // Limpiar y cerrar el modal de forma determinística
      try {
        // Reset de formulario y estado
        const form = document.querySelector(selectores.formOrden);
        if (form) form.reset();
        state.productosSeleccionados.clear();
        const tbody = document.getElementById('tablaProductosBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center py-3 text-muted">Seleccione un pedido para ver sus productos</td></tr>';
      } catch (e) { console.warn('No se pudo limpiar completamente el modal:', e); }
      // Cerrar modal antes de refrescar lista
      if (state.modalOrden) { state.modalOrden.hide(); }
      await cargarOrdenes();
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
                    <span class="badge bg-secondary">${getBadgeEstado(rel.estado)}</span>
                    <button class="btn btn-outline-info btn-sm ms-2" 
                            onclick="OrdenesCompraUI.verDetalle(${rel.id_orden_compra})"
                            title="Ver detalles">
                      <i class="bi bi-eye"></i>
                    </button>
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
                ${orden.productos.map(producto => {
                  const solicitada = parseFloat(producto.cantidad_solicitada || 0);
                  const comprada = parseFloat(producto.cantidad_comprada || 0);
                  const recibida = parseFloat(producto.cantidad_recibida || 0);
                  const precio = parseFloat(producto.precio_unitario || 0);
                  const subtotal = parseFloat(producto.subtotal || 0);
                  
                  let estadoBadge = '<span class="badge bg-secondary">Pendiente</span>';
                  if (recibida >= solicitada) {
                    estadoBadge = '<span class="badge bg-success">Recibido completo</span>';
                  } else if (recibida > 0) {
                    estadoBadge = '<span class="badge bg-warning">Recibido parcial</span>';
                  }
                  
                  return `
                    <tr>
                      <td>${producto.descripcion}</td>
                      <td class="text-center">${producto.unidad}</td>
                      <td class="text-end">${solicitada.toFixed(2)}</td>
                      <td class="text-end">${comprada.toFixed(2)}</td>
                      <td class="text-end">${recibida.toFixed(2)}</td>
                      <td class="text-end">$${precio.toFixed(2)}</td>
                      <td class="text-end">$${subtotal.toFixed(2)}</td>
                      <td class="text-center">${estadoBadge}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
      'parcialmente_comprada': '<span class="badge bg-warning text-dark">Parcialmente Comprada</span>',
      'parcialmente_recibida': '<span class="badge bg-info text-dark">Parcialmente Recibida</span>',
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

  // Exponer funciones públicas
  return {
    init,
    verDetalle,
    editarOrden,
    convertirEnCompra,
    verDetallePedido
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', OrdenesCompraUI.init);

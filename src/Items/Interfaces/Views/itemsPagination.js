// Agregar al estado de ItemsUI
const paginationState = {
  materiales: {
    currentPage: 1,
    perPage: 25,
    totalPages: 1,
  },
  items: {
    currentPage: 1,
    perPage: 25,
    totalPages: 1,
  },
};

// Función para renderizar materiales con paginación
function renderMaterialesPaginated(data) {
  const perPage = paginationState.materiales.perPage;
  const currentPage = paginationState.materiales.currentPage;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / perPage);
  
  paginationState.materiales.totalPages = totalPages;
  
  // Calcular índices
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  
  // Obtener datos de la página actual
  const pageData = data.slice(startIndex, endIndex);
  
  // Renderizar la tabla
  renderMateriales(pageData);
  
  // Actualizar información de paginación
  document.getElementById('materialesShowingStart').textContent = totalItems > 0 ? startIndex + 1 : 0;
  document.getElementById('materialesShowingEnd').textContent = endIndex;
  document.getElementById('materialesTotalCount').textContent = totalItems;
  
  // Renderizar controles de paginación
  renderMaterialesPaginationControls(currentPage, totalPages);
}

function renderMaterialesPaginationControls(currentPage, totalPages) {
  const paginationContainer = document.getElementById('materialesPagination');
  if (!paginationContainer) return;
  
  let html = '';
  
  // Botón Anterior
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${currentPage - 1}); return false;">
        Anterior
      </a>
    </li>
  `;
  
  // Números de página
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  if (startPage > 1) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(1); return false;">1</a>
      </li>
    `;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${i}); return false;">${i}</a>
      </li>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${totalPages}); return false;">${totalPages}</a>
      </li>
    `;
  }
  
  // Botón Siguiente
  html += `
    <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToMaterilesPage(${currentPage + 1}); return false;">
        Siguiente
      </a>
    </li>
  `;
  
  paginationContainer.innerHTML = html;
}

function goToMaterilesPage(page) {
  const totalPages = paginationState.materiales.totalPages;
  if (page < 1 || page > totalPages) return;
  
  paginationState.materiales.currentPage = page;
  const dataToRender = state.materialesFiltrados.length > 0 ? state.materialesFiltrados : state.materiales;
  renderMaterialesPaginated(dataToRender);
}

function changeMaterilesPerPage() {
  const select = document.getElementById('materialesPerPage');
  paginationState.materiales.perPage = parseInt(select.value);
  paginationState.materiales.currentPage = 1;
  const dataToRender = state.materialesFiltrados.length > 0 ? state.materialesFiltrados : state.materiales;
  renderMaterialesPaginated(dataToRender);
}

// Función para renderizar items con paginación
function renderItemsPaginated(data) {
  const perPage = paginationState.items.perPage;
  const currentPage = paginationState.items.currentPage;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / perPage);
  
  paginationState.items.totalPages = totalPages;
  
  // Calcular índices
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  
  // Obtener datos de la página actual
  const pageData = data.slice(startIndex, endIndex);
  
  // Renderizar la tabla
  renderItems(pageData);
  
  // Actualizar información de paginación
  document.getElementById('itemsShowingStart').textContent = totalItems > 0 ? startIndex + 1 : 0;
  document.getElementById('itemsShowingEnd').textContent = endIndex;
  document.getElementById('itemsTotalCount').textContent = totalItems;
  
  // Renderizar controles de paginación
  renderItemsPaginationControls(currentPage, totalPages);
}

function renderItemsPaginationControls(currentPage, totalPages) {
  const paginationContainer = document.getElementById('itemsPagination');
  if (!paginationContainer) return;
  
  let html = '';
  
  // Botón Anterior
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${currentPage - 1}); return false;">
        Anterior
      </a>
    </li>
  `;
  
  // Números de página
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  if (startPage > 1) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(1); return false;">1</a>
      </li>
    `;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${i}); return false;">${i}</a>
      </li>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${totalPages}); return false;">${totalPages}</a>
      </li>
    `;
  }
  
  // Botón Siguiente
  html += `
    <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="ItemsUI.goToItemsPage(${currentPage + 1}); return false;">
        Siguiente
      </a>
    </li>
  `;
  
  paginationContainer.innerHTML = html;
}

function goToItemsPage(page) {
  const totalPages = paginationState.items.totalPages;
  if (page < 1 || page > totalPages) return;
  
  paginationState.items.currentPage = page;
  const dataToRender = state.itemsFiltrados.length > 0 ? state.itemsFiltrados : state.items;
  renderItemsPaginated(dataToRender);
}

function changeItemsPerPage() {
  const select = document.getElementById('itemsPerPage');
  paginationState.items.perPage = parseInt(select.value);
  paginationState.items.currentPage = 1;
  const dataToRender = state.itemsFiltrados.length > 0 ? state.itemsFiltrados : state.items;
  renderItemsPaginated(dataToRender);
}

// Exportar funciones para que estén disponibles en ItemsUI
if (typeof ItemsUI !== 'undefined') {
  ItemsUI.paginationState = paginationState;
  ItemsUI.renderMaterialesPaginated = renderMaterialesPaginated;
  ItemsUI.goToMaterilesPage = goToMaterilesPage;
  ItemsUI.changeMaterilesPerPage = changeMaterilesPerPage;
  ItemsUI.renderItemsPaginated = renderItemsPaginated;
  ItemsUI.goToItemsPage = goToItemsPage;
  ItemsUI.changeItemsPerPage = changeItemsPerPage;
}

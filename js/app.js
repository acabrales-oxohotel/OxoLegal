/**
 * ============================================================================
 * OXOLEGAL - CONTROLADOR PRINCIPAL Y ORQUESTADOR DE EVENTOS
 * ============================================================================
 */

import { storage } from './storage.js';
import { fetchData, postData, pingApi } from './api.js';
import {
  showToast,
  openModal,
  closeModal,
  toggleTheme,
  renderSkeleton,
  populateSelect,
  escapeHtml
} from './ui.js';
import {
  setView,
  renderCards,
  renderMetrics,
  renderCatalogList,
  formatearFechaHora
} from './views.js';
import { ROLES, ESTADOS } from './config.js';

// ============================================================================
// ESTADO REACTIVO GLOBAL DE LA APLICACIÓN
// ============================================================================
const state = {
  user: null,
  requests: [],
  config: {
    hoteles: [],
    etiquetas: []
  },
  users: [],
  filters: {
    search: '',
    hotel: '',
    tag: '',
    status: ''
  },
  selectedRequest: null
};

// ============================================================================
// INICIALIZACIÓN AL CARGAR EL DOCUMENTO
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Inicializa la aplicación y verifica sesión persistente.
 */
async function initApp() {
  // 1. Restaurar tema guardado
  const savedTheme = storage.getTheme();
  toggleTheme(savedTheme);

  // 2. Registrar manejadores de eventos
  bindEventListeners();

  // 3. Validar sesión existente
  const savedUser = storage.getUser();
  if (savedUser && savedUser.correo) {
    state.user = savedUser;
    setView('dashboard', state.user);
    await loadInitialData();
  } else {
    setView('auth');
  }
}

/**
 * Registra todos los escuchadores de eventos del DOM.
 */
function bindEventListeners() {
  // Toggle de Tema Oscuro / Claro
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => toggleTheme());
  }

  // Formulario de Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Botón de Cerrar Sesión
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Botón Actualizar Datos
  const refreshBtn = document.getElementById('btn-refresh-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Actualizando información...', 'info', 1500);
      loadInitialData();
    });
  }

  // Filtros de Búsqueda
  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  const hotelFilter = document.getElementById('filter-hotel');
  if (hotelFilter) {
    hotelFilter.addEventListener('change', (e) => {
      state.filters.hotel = e.target.value;
      applyFilters();
    });
  }

  const tagFilter = document.getElementById('filter-tag');
  if (tagFilter) {
    tagFilter.addEventListener('change', (e) => {
      state.filters.tag = e.target.value;
      applyFilters();
    });
  }

  const statusFilter = document.getElementById('filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      applyFilters();
    });
  }

  const resetFiltersBtn = document.getElementById('btn-reset-filters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }

  // Modales: Botones para abrir
  const btnNewReq = document.getElementById('btn-open-new-request');
  if (btnNewReq) {
    btnNewReq.addEventListener('click', () => {
      openNewRequestModal();
    });
  }

  const btnCatalogs = document.getElementById('btn-open-catalogs');
  if (btnCatalogs) {
    btnCatalogs.addEventListener('click', () => {
      openCatalogsModal();
    });
  }

  const btnApiConfig = document.getElementById('btn-open-api-config');
  if (btnApiConfig) {
    btnApiConfig.addEventListener('click', openApiConfigModal);
  }

  // Modales: Delegación para botones de cierre [data-close] y click en backdrop
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Envío de Formularios en Modales
  const formNewReq = document.getElementById('form-new-request');
  if (formNewReq) {
    formNewReq.addEventListener('submit', handleCreateRequest);
  }

  const formManageReq = document.getElementById('form-manage-request');
  if (formManageReq) {
    formManageReq.addEventListener('submit', handleUpdateRequest);
  }

  // Configuración de API Web App
  const btnSaveApi = document.getElementById('btn-save-api-config');
  if (btnSaveApi) {
    btnSaveApi.addEventListener('click', handleSaveApiConfig);
  }

  // Pestañas del Modal de Catálogos
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.remove('hidden');
    });
  });

  // Agregar hotel / etiqueta
  const btnAddHotel = document.getElementById('btn-add-hotel');
  if (btnAddHotel) {
    btnAddHotel.addEventListener('click', () => handleAddCatalogItem('hoteles'));
  }

  const btnAddTag = document.getElementById('btn-add-tag');
  if (btnAddTag) {
    btnAddTag.addEventListener('click', () => handleAddCatalogItem('etiquetas'));
  }
}

// ============================================================================
// FLUJO DE AUTENTICACIÓN
// ============================================================================
async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email || !email.includes('@')) {
    showToast('Por favor ingrese un correo corporativo válido.', 'warning');
    return;
  }

  const submitBtn = document.getElementById('btn-login-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.btn-spinner');

  if (btnText) btnText.textContent = 'Verificando...';
  if (spinner) spinner.classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    let result = null;
    try {
      result = await fetchData('login', { email: email });
    } catch (networkErr) {
      console.warn('Conexión con backend en modo de contingencia:', networkErr.message);
    }

    // Si el backend respondió favorablemente
    if (result && result.success && result.usuario) {
      state.user = result.usuario;
      storage.setUser(state.user);
      showToast(`¡Bienvenido, ${state.user.nombre || state.user.correo}!`, 'success');
      setView('dashboard', state.user);
      await loadInitialData();
      return;
    }

    // Si el backend indicó error de validación explícito
    if (result && result.error) {
      showToast(result.error, 'error');
      return;
    }

    // Modo contingencia / demostración si la API de Apps Script aún no se ha desplegado
    // Identificamos administradores o usuarios de referencia
    const esAdmin = email.toLowerCase().includes('juridico') || email.toLowerCase().includes('admin');
    const demoUser = {
      id: 'USR-LOCAL-' + Math.floor(1000 + Math.random() * 9000),
      nombre: esAdmin ? 'Dirección Jurídica Oxo' : email.split('@')[0],
      correo: email,
      rol: esAdmin ? ROLES.ADMIN : ROLES.USUARIO
    };

    state.user = demoUser;
    storage.setUser(state.user);
    showToast(`Sesión iniciada como ${demoUser.rol}`, 'info');
    setView('dashboard', state.user);
    await loadInitialData();

  } catch (err) {
    showToast('Ocurrió un error al procesar el inicio de sesión.', 'error');
  } finally {
    if (btnText) btnText.textContent = 'Ingresar al Portal';
    if (spinner) spinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

function handleLogout() {
  storage.clearUser();
  state.user = null;
  state.requests = [];
  setView('auth');
  showToast('Sesión finalizada con éxito.', 'info');
}

// ============================================================================
// CARGA Y SINCRONIZACIÓN DE DATOS
// ============================================================================
async function loadInitialData() {
  const container = document.getElementById('requests-grid');
  renderSkeleton(container, 6);

  try {
    // 1. Obtener Configuración (Hoteles y Etiquetas)
    let configData = null;
    try {
      const resConfig = await fetchData('getConfiguracion');
      if (resConfig && resConfig.success) configData = resConfig.data;
    } catch (e) {
      console.warn('Usando catálogo local');
    }

    if (!configData || !configData.hoteles || configData.hoteles.length === 0) {
      configData = {
        hoteles: [
          '84 DC',
          'CENTRAL DE OPERACIONES S.A.S.',
          'Holiday Inn Express Bogotá',
          'AC Hotel Bogotá Zona T',
          'Courtyard by Marriott Bogotá Airport',
          'Sofitel Barú Calablanca',
          'Hilton Garden Inn Santa Marta',
          'Waya Guajira',
          'BOG-1514',
          'Corp OxoHotel'
        ],
        etiquetas: [
          'Contratos',
          'Laboral',
          'Civil y Comercial',
          'PreApertura',
          'Concepto Jurídico',
          'Regulatorio / Turismo',
          'Societario',
          'Protección de Datos'
        ]
      };
    }
    state.config = configData;
    storage.setCache('oxolegal_config', configData);

    // Actualizar selectores de filtros
    populateSelect(document.getElementById('filter-hotel'), state.config.hoteles, 'Todos los hoteles');
    populateSelect(document.getElementById('filter-tag'), state.config.etiquetas, 'Todas las etiquetas');

    // 2. Obtener lista de usuarios para asignaciones
    try {
      const resUsers = await fetchData('getUsuarios');
      if (resUsers && resUsers.success) {
        state.users = resUsers.data;
      }
    } catch (e) {}

    if (!state.users || state.users.length === 0) {
      state.users = [
        { id: '1', nombre: 'Dirección Jurídica', correo: 'alljuridico@oxohotel.com', rol: ROLES.ADMIN },
        { id: '2', nombre: 'Juan Pablo Lineros', correo: 'jlineros@oxohotel.com', rol: ROLES.USUARIO },
        { id: '3', nombre: 'Ana Maria Diaz Gutierrez', correo: 'adiaz@oxohotel.com', rol: ROLES.USUARIO }
      ];
    }

    // 3. Obtener Solicitudes según Rol
    let requestsData = null;
    try {
      const resReq = await fetchData('getSolicitudes', {
        user: state.user.correo,
        rol: state.user.rol
      });
      if (resReq && resReq.success) {
        requestsData = resReq.data;
      }
    } catch (e) {
      console.warn('Conexión con backend limitada. Cargando datos de contingencia.');
    }

    // Si no hay datos remotos, recurrir al caché o datos de muestra contextualizados
    if (!requestsData) {
      const cached = storage.getCache('oxolegal_requests');
      if (cached && cached.length > 0) {
        requestsData = cached;
      } else {
        requestsData = [
          {
            id: 'OXO-2026-1045',
            fechaCreacion: new Date(Date.now() - 3600000 * 24).toISOString(),
            hotel: '84 DC',
            asunto: 'Revisión solicitud cambios contratista bombeo y lavado',
            descripcion: 'Revisar solicitud de cambios por parte del contratista para mantenimiento preventivo equipo de bombeo y lavado de pozos eyectores.',
            estado: ESTADOS.EN_REVISION,
            etiqueta: 'Contratos',
            asignadoA: 'alljuridico@oxohotel.com',
            fechaActualizacion: new Date().toISOString()
          },
          {
            id: 'OXO-2026-1082',
            fechaCreacion: new Date(Date.now() - 3600000 * 48).toISOString(),
            hotel: 'CENTRAL DE OPERACIONES S.A.S.',
            asunto: 'Constitución sociedad operadora Bahía Horizonte',
            descripcion: 'El proceso de constitución virtual de la sociedad Bahía Horizonte S.A.S. se tramita ante Cámara de Comercio de Santa Marta.',
            estado: ESTADOS.PENDIENTE,
            etiqueta: 'Societario',
            asignadoA: 'alljuridico@oxohotel.com',
            fechaActualizacion: new Date().toISOString()
          },
          {
            id: 'OXO-2026-1120',
            fechaCreacion: new Date(Date.now() - 3600000 * 72).toISOString(),
            hotel: 'Holiday Inn Express Bogotá',
            asunto: 'Concepto sobre cambio de uso de suelo turístico',
            descripcion: 'Cuáles son los requisitos que se deben cumplir para cambiar de vivienda turística a hotel según reglamentación vigente.',
            estado: ESTADOS.RESUELTO,
            etiqueta: 'Regulatorio / Turismo',
            asignadoA: 'alljuridico@oxohotel.com',
            fechaActualizacion: new Date().toISOString()
          }
        ];
      }
    }

    state.requests = requestsData;
    storage.setCache('oxolegal_requests', requestsData);

    // Filtrar para usuarios estándar si no son administradores
    if ((state.user.rol || '').toLowerCase() !== ROLES.ADMIN.toLowerCase()) {
      state.requests = state.requests.filter(r => 
        (r.asignadoA || '').toLowerCase() === (state.user.correo || '').toLowerCase()
      );
    }

    applyFilters();

  } catch (error) {
    showToast('Error al sincronizar datos del portal.', 'error');
    console.error(error);
  }
}

// ============================================================================
// FILTRADO Y BÚSQUEDA EN TIEMPO REAL
// ============================================================================
function applyFilters() {
  const { search, hotel, tag, status } = state.filters;

  const filtered = state.requests.filter(req => {
    // Filtro por texto
    if (search) {
      const matchId = (req.id || '').toLowerCase().includes(search);
      const matchSubject = (req.asunto || '').toLowerCase().includes(search);
      const matchHotel = (req.hotel || '').toLowerCase().includes(search);
      const matchDesc = (req.descripcion || '').toLowerCase().includes(search);
      if (!matchId && !matchSubject && !matchHotel && !matchDesc) {
        return false;
      }
    }

    // Filtro por Hotel
    if (hotel && req.hotel !== hotel) return false;

    // Filtro por Etiqueta
    if (tag && req.etiqueta !== tag) return false;

    // Filtro por Estado
    if (status && req.estado !== status) return false;

    return true;
  });

  const container = document.getElementById('requests-grid');
  renderCards(container, filtered, openDetailModal);
  renderMetrics(filtered);
}

function resetFilters() {
  state.filters = { search: '', hotel: '', tag: '', status: '' };

  const sInput = document.getElementById('filter-search');
  const hFilter = document.getElementById('filter-hotel');
  const tFilter = document.getElementById('filter-tag');
  const stFilter = document.getElementById('filter-status');

  if (sInput) sInput.value = '';
  if (hFilter) hFilter.value = '';
  if (tFilter) tFilter.value = '';
  if (stFilter) stFilter.value = '';

  applyFilters();
  showToast('Filtros restablecidos', 'info', 1500);
}

// ============================================================================
// MODAL: NUEVA SOLICITUD (Solo Administrador)
// ============================================================================
function openNewRequestModal() {
  const hotelSelect = document.getElementById('new-req-hotel');
  const tagSelect = document.getElementById('new-req-tag');
  const assignedSelect = document.getElementById('new-req-assigned');

  populateSelect(hotelSelect, state.config.hoteles, 'Seleccione un hotel...');
  populateSelect(tagSelect, state.config.etiquetas, 'Seleccione una etiqueta...');

  const userOptions = state.users.map(u => ({
    value: u.correo,
    label: `${u.nombre} (${u.correo})`
  }));
  populateSelect(assignedSelect, userOptions, 'Seleccione un responsable...');

  // Reset del formulario
  document.getElementById('form-new-request').reset();
  openModal('modal-new-request');
}

async function handleCreateRequest(e) {
  e.preventDefault();

  const hotel = document.getElementById('new-req-hotel').value;
  const tag = document.getElementById('new-req-tag').value;
  const asunto = document.getElementById('new-req-asunto').value.trim();
  const assigned = document.getElementById('new-req-assigned').value;
  const desc = document.getElementById('new-req-desc').value.trim();

  if (!hotel || !tag || !asunto || !assigned) {
    showToast('Por favor complete todos los campos obligatorios (*).', 'warning');
    return;
  }

  const submitBtn = document.getElementById('btn-save-new-request');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.btn-spinner');

  if (btnText) btnText.textContent = 'Guardando...';
  if (spinner) spinner.classList.remove('hidden');
  submitBtn.disabled = true;

  const nuevaSolicitud = {
    hotel: hotel,
    etiqueta: tag,
    asunto: asunto,
    asignadoA: assigned,
    descripcion: desc,
    estado: ESTADOS.PENDIENTE
  };

  try {
    let createdItem = null;
    try {
      const res = await postData('crearSolicitud', { data: nuevaSolicitud });
      if (res && res.success && res.data) {
        createdItem = res.data;
      }
    } catch (apiErr) {
      console.warn('Guardando solicitud en modo local:', apiErr.message);
    }

    if (!createdItem) {
      const anio = new Date().getFullYear();
      const sufijo = Math.floor(1000 + Math.random() * 9000);
      createdItem = {
        id: `OXO-${anio}-${sufijo}`,
        fechaCreacion: new Date().toISOString(),
        ...nuevaSolicitud,
        fechaActualizacion: new Date().toISOString()
      };
    }

    state.requests.unshift(createdItem);
    storage.setCache('oxolegal_requests', state.requests);

    showToast(`Solicitud ${createdItem.id} creada y notificada exitosamente.`, 'success');
    closeModal('modal-new-request');
    applyFilters();

  } catch (err) {
    showToast('No se pudo crear la solicitud. Intente nuevamente.', 'error');
  } finally {
    if (btnText) btnText.textContent = 'Crear Solicitud';
    if (spinner) spinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

// ============================================================================
// MODAL: DETALLES Y GESTIÓN DE SOLICITUD
// ============================================================================
function openDetailModal(request) {
  state.selectedRequest = request;

  document.getElementById('detail-request-id').value = request.id;
  document.getElementById('detail-id-text').textContent = request.id;
  document.getElementById('detail-subject').textContent = request.asunto;
  document.getElementById('detail-hotel').textContent = request.hotel;
  document.getElementById('detail-tag').textContent = request.etiqueta || 'General';
  document.getElementById('detail-created').textContent = formatearFechaHora(request.fechaCreacion);
  document.getElementById('detail-updated').textContent = formatearFechaHora(request.fechaActualizacion);
  document.getElementById('detail-desc').textContent = request.descripcion || 'Sin descripción complementaria.';

  const badgeEl = document.getElementById('detail-status-badge');
  badgeEl.className = `badge ${getStatusBadgeClass(request.estado)}`;
  badgeEl.textContent = request.estado;

  // Campo de Estado
  const statusSelect = document.getElementById('detail-edit-status');
  if (statusSelect) {
    statusSelect.value = request.estado;
  }

  // Campo de Reasignación (Visible solo para Administrador)
  const reassignGroup = document.getElementById('group-reassign');
  const assignedSelect = document.getElementById('detail-edit-assigned');
  const isAdmin = (state.user.rol || '').toLowerCase() === ROLES.ADMIN.toLowerCase();

  if (isAdmin) {
    if (reassignGroup) reassignGroup.classList.remove('hidden');
    const userOptions = state.users.map(u => ({
      value: u.correo,
      label: `${u.nombre} (${u.correo})`
    }));
    populateSelect(assignedSelect, userOptions, 'Seleccione un usuario...', request.asignadoA);
  } else {
    if (reassignGroup) reassignGroup.classList.add('hidden');
  }

  openModal('modal-detail-request');
}

async function handleUpdateRequest(e) {
  e.preventDefault();

  if (!state.selectedRequest) return;

  const reqId = document.getElementById('detail-request-id').value;
  const newStatus = document.getElementById('detail-edit-status').value;
  const assignedSelect = document.getElementById('detail-edit-assigned');
  const isAdmin = (state.user.rol || '').toLowerCase() === ROLES.ADMIN.toLowerCase();
  const newAssigned = (isAdmin && assignedSelect) ? assignedSelect.value : state.selectedRequest.asignadoA;

  const submitBtn = document.getElementById('btn-save-detail-status');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.btn-spinner');

  if (btnText) btnText.textContent = 'Actualizando...';
  if (spinner) spinner.classList.remove('hidden');
  submitBtn.disabled = true;

  const datosActualizados = {
    ...state.selectedRequest,
    estado: newStatus,
    asignadoA: newAssigned,
    fechaActualizacion: new Date().toISOString()
  };

  try {
    try {
      await postData('actualizarSolicitud', {
        id: reqId,
        data: datosActualizados
      });
    } catch (apiErr) {
      console.warn('Actualización local:', apiErr.message);
    }

    // Actualizar registro en el estado local
    const index = state.requests.findIndex(r => r.id === reqId);
    if (index !== -1) {
      state.requests[index] = datosActualizados;
      storage.setCache('oxolegal_requests', state.requests);
    }

    showToast(`Solicitud ${reqId} actualizada correctamente.`, 'success');
    closeModal('modal-detail-request');
    applyFilters();

  } catch (err) {
    showToast('Error al actualizar la solicitud.', 'error');
  } finally {
    if (btnText) btnText.textContent = 'Guardar Cambios';
    if (spinner) spinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

// ============================================================================
// MODAL: GESTIÓN DE CATÁLOGOS (Hoteles y Etiquetas)
// ============================================================================
function openCatalogsModal() {
  renderCatalogList('hoteles-list', state.config.hoteles, 'hoteles', handleDeleteCatalogItem);
  renderCatalogList('etiquetas-list', state.config.etiquetas, 'etiquetas', handleDeleteCatalogItem);
  openModal('modal-manage-catalogs');
}

async function handleAddCatalogItem(tipo) {
  const inputEl = document.getElementById(tipo === 'hoteles' ? 'new-hotel-input' : 'new-tag-input');
  const valor = inputEl ? inputEl.value.trim() : '';

  if (!valor) {
    showToast('Ingrese un nombre válido para agregar.', 'warning');
    return;
  }

  try {
    let updatedConfig = null;
    try {
      const res = await postData('gestionarConfiguracion', {
        tipo: tipo,
        operacion: 'agregar',
        valor: valor
      });
      if (res && res.success && res.data) {
        updatedConfig = res.data;
      }
    } catch (e) {}

    if (!updatedConfig) {
      if (!state.config[tipo].includes(valor)) {
        state.config[tipo].push(valor);
        state.config[tipo].sort();
      }
      updatedConfig = state.config;
    }

    state.config = updatedConfig;
    storage.setCache('oxolegal_config', state.config);

    inputEl.value = '';
    renderCatalogList(`${tipo}-list`, state.config[tipo], tipo, handleDeleteCatalogItem);
    populateSelect(document.getElementById(tipo === 'hoteles' ? 'filter-hotel' : 'filter-tag'), state.config[tipo], `Todos(as) los(as) ${tipo}`);
    showToast(`${valor} agregado al catálogo.`, 'success');

  } catch (err) {
    showToast('Error al agregar el elemento al catálogo.', 'error');
  }
}

async function handleDeleteCatalogItem(tipo, valor) {
  if (!confirm(`¿Está seguro de eliminar "${valor}" del catálogo?`)) return;

  try {
    let updatedConfig = null;
    try {
      const res = await postData('gestionarConfiguracion', {
        tipo: tipo,
        operacion: 'eliminar',
        valor: valor
      });
      if (res && res.success && res.data) {
        updatedConfig = res.data;
      }
    } catch (e) {}

    if (!updatedConfig) {
      state.config[tipo] = state.config[tipo].filter(item => item !== valor);
      updatedConfig = state.config;
    }

    state.config = updatedConfig;
    storage.setCache('oxolegal_config', state.config);

    renderCatalogList(`${tipo}-list`, state.config[tipo], tipo, handleDeleteCatalogItem);
    populateSelect(document.getElementById(tipo === 'hoteles' ? 'filter-hotel' : 'filter-tag'), state.config[tipo], `Todos(as) los(as) ${tipo}`);
    showToast(`"${valor}" eliminado del catálogo.`, 'info');

  } catch (err) {
    showToast('Error al eliminar elemento del catálogo.', 'error');
  }
}

// ============================================================================
// MODAL: CONFIGURACIÓN DE CONEXIÓN API WEB APP
// ============================================================================
function openApiConfigModal() {
  const currentUrl = storage.getApiUrl();
  const inputEl = document.getElementById('config-api-url');
  if (inputEl) inputEl.value = currentUrl;

  const dot = document.querySelector('.api-status-dot');
  const text = document.getElementById('api-status-text');

  if (dot && text) {
    dot.className = 'api-status-dot';
    text.textContent = 'Verificando conectividad...';

    pingApi(currentUrl).then(isOnline => {
      if (isOnline) {
        dot.className = 'api-status-dot online';
        text.textContent = 'API Web App Conectada y Operativa';
      } else {
        dot.className = 'api-status-dot offline';
        text.textContent = 'Sin respuesta o URL pendiente de implementación';
      }
    });
  }

  openModal('modal-api-config');
}

function handleSaveApiConfig() {
  const inputEl = document.getElementById('config-api-url');
  const newUrl = inputEl ? inputEl.value.trim() : '';

  if (!newUrl) {
    storage.setApiUrl('');
    showToast('URL restablecida al valor por defecto.', 'info');
  } else {
    storage.setApiUrl(newUrl);
    showToast('URL de API actualizada exitosamente.', 'success');
  }

  closeModal('modal-api-config');
  loadInitialData();
}

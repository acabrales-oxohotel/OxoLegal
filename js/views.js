/**
 * ============================================================================
 * OXOLEGAL - VISTAS Y RENDERIZADO DE COMPONENTES DEL DOM
 * ============================================================================
 */

import { escapeHtml, getStatusBadgeClass } from './ui.js';
import { ROLES } from './config.js';

/**
 * Renderiza la lista de tarjetas de solicitudes en el Grid.
 * @param {HTMLElement} container
 * @param {Array<object>} requests
 * @param {Function} onCardClick Callback al presionar una tarjeta
 */
export function renderCards(container, requests = [], onCardClick) {
  if (!container) return;
  container.innerHTML = '';

  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');

  if (resultsCount) {
    resultsCount.textContent = `${requests.length} ${requests.length === 1 ? 'registro' : 'registros'}`;
  }

  if (requests.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  requests.forEach(req => {
    const card = document.createElement('article');
    card.className = 'request-card';
    card.setAttribute('data-id', req.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Solicitud ${req.id}: ${req.asunto}`);

    const badgeClass = getStatusBadgeClass(req.estado);
    const fechaFormateada = formatearFechaCorta(req.fechaCreacion);

    card.innerHTML = `
      <div class="card-top">
        <span class="card-id-tag">${escapeHtml(req.id)}</span>
        <span class="card-hotel-tag">${escapeHtml(req.hotel)}</span>
      </div>

      <div>
        <div style="margin-bottom: 0.35rem;">
          <span class="badge ${badgeClass}">${escapeHtml(req.estado)}</span>
          <span class="badge" style="background: var(--color-surface-alt); color: var(--color-text-muted); border: 1px solid var(--color-border); margin-left: 0.25rem;">
            ${escapeHtml(req.etiqueta || 'General')}
          </span>
        </div>
        <h3 class="card-title">${escapeHtml(req.asunto)}</h3>
      </div>

      <p class="card-desc-snippet">${escapeHtml(req.descripcion || 'Sin descripción adicional.')}</p>

      <div class="card-meta-row">
        <span class="card-assigned-to" title="${escapeHtml(req.asignadoA || 'Sin asignar')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>${escapeHtml(req.asignadoA ? req.asignadoA.split('@')[0] : 'Sin asignar')}</span>
        </span>
        <span class="card-date">${fechaFormateada}</span>
      </div>
    `;

    card.addEventListener('click', () => onCardClick(req));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick(req);
      }
    });

    container.appendChild(card);
  });
}

/**
 * Actualiza los contadores de métricas del Dashboard.
 * @param {Array<object>} requests
 */
export function renderMetrics(requests = []) {
  const totalEl = document.getElementById('metric-total');
  const pendingEl = document.getElementById('metric-pending');
  const reviewEl = document.getElementById('metric-review');
  const resolvedEl = document.getElementById('metric-resolved');

  const total = requests.length;
  let pending = 0;
  let review = 0;
  let resolved = 0;

  requests.forEach(r => {
    const st = (r.estado || '').toLowerCase();
    if (st === 'pendiente') pending++;
    else if (st === 'en revisión' || st === 'en revision') review++;
    else if (st === 'resuelto' || st === 'aprobado') resolved++;
  });

  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (reviewEl) reviewEl.textContent = review;
  if (resolvedEl) resolvedEl.textContent = resolved;
}

/**
 * Renderiza la lista de elementos en el modal de catálogos.
 * @param {string} containerId
 * @param {Array<string>} items
 * @param {'hoteles'|'etiquetas'} type
 * @param {Function} onDelete Callback de eliminación
 */
export function renderCatalogList(containerId, items = [], type, onDelete) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `<div style="padding: 0.5rem; color: var(--color-text-muted); font-size: 0.85rem;">No hay elementos registrados.</div>`;
    return;
  }

  items.forEach(val => {
    const itemEl = document.createElement('div');
    itemEl.className = 'catalog-item';
    itemEl.innerHTML = `
      <span>${escapeHtml(val)}</span>
      <button type="button" class="catalog-delete-btn" title="Eliminar ${val}" aria-label="Eliminar ${val}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;

    const delBtn = itemEl.querySelector('.catalog-delete-btn');
    delBtn.addEventListener('click', () => onDelete(type, val));

    container.appendChild(itemEl);
  });
}

/**
 * Alterna entre la vista de Autenticación y el Dashboard.
 * @param {'auth'|'dashboard'} viewName
 * @param {object|null} user
 */
export function setView(viewName, user = null) {
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  const userPill = document.getElementById('user-pill');
  const logoutBtn = document.getElementById('logout-btn');
  const adminActions = document.getElementById('admin-actions-bar');
  const btnNewRequest = document.getElementById('btn-open-new-request');
  const btnCatalogs = document.getElementById('btn-open-catalogs');

  if (viewName === 'dashboard' && user) {
    if (authView) authView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');

    if (userPill) {
      userPill.classList.remove('hidden');
      const nameEl = document.getElementById('user-display-name');
      const roleEl = document.getElementById('user-display-role');
      if (nameEl) nameEl.textContent = user.nombre || user.correo;
      if (roleEl) roleEl.textContent = user.rol || ROLES.USUARIO;
    }

    if (logoutBtn) logoutBtn.classList.remove('hidden');

    // Visibilidad de controles de Administrador
    const isAdmin = (user.rol || '').toLowerCase() === ROLES.ADMIN.toLowerCase();
    if (btnNewRequest) {
      if (isAdmin) btnNewRequest.classList.remove('hidden');
      else btnNewRequest.classList.add('hidden');
    }
    if (btnCatalogs) {
      if (isAdmin) btnCatalogs.classList.remove('hidden');
      else btnCatalogs.classList.add('hidden');
    }
  } else {
    if (authView) authView.classList.remove('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
    if (userPill) userPill.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }
}

/**
 * Formatea una fecha a cadena legible estándar (ej. 24 Oct 2026).
 * @param {string|Date} dateVal
 * @returns {string}
 */
export function formatearFechaCorta(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateVal);
  }
}

/**
 * Formatea una fecha y hora completa (ej. 24/10/2026 14:30).
 * @param {string|Date} dateVal
 * @returns {string}
 */
export function formatearFechaHora(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return `${d.toLocaleDateString('es-CO')} ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return String(dateVal);
  }
}

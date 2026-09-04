/**
 * ============================================================================
 * OXOLEGAL - SERVICIOS DE INTERFAZ DE USUARIO (MODALES, TOASTS, TEMAS, SKELETON)
 * ============================================================================
 */

import { storage } from './storage.js';

/**
 * Muestra una notificación emergente temporal (Toast).
 * @param {string} message Mensaje a mostrar
 * @param {'success'|'error'|'info'|'warning'} type Tipo de notificación
 * @param {number} duration Duración en milisegundos (default: 3500)
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hiding');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, duration);
}

/**
 * Abre un modal por su ID.
 * @param {string} modalId
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Cierra un modal por su ID.
 * @param {string} modalId
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Aplica y alterna el tema visual entre 'light' y 'dark'.
 * @param {'light'|'dark'} [specificTheme]
 */
export function toggleTheme(specificTheme) {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = specificTheme || (currentTheme === 'dark' ? 'light' : 'dark');

  document.documentElement.setAttribute('data-theme', newTheme);
  storage.setTheme(newTheme);

  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  if (sunIcon && moonIcon) {
    if (newTheme === 'dark') {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    } else {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    }
  }
}

/**
 * Renderiza tarjetas con efecto shimmer (Skeleton Loading) en un contenedor.
 * @param {HTMLElement} container
 * @param {number} count Cantidad de tarjetas esqueleto
 */
export function renderSkeleton(container, count = 4) {
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-header">
        <div class="skeleton-box skeleton-badge"></div>
        <div class="skeleton-box skeleton-id"></div>
      </div>
      <div class="skeleton-box skeleton-title"></div>
      <div class="skeleton-box skeleton-line"></div>
      <div class="skeleton-box skeleton-line-short"></div>
      <div class="skeleton-footer">
        <div class="skeleton-box skeleton-user"></div>
        <div class="skeleton-box skeleton-date"></div>
      </div>
    `;
    container.appendChild(card);
  }
}

/**
 * Devuelve la clase de estilo CSS adecuada para el estado de la solicitud.
 * @param {string} status
 * @returns {string}
 */
export function getStatusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'pendiente':
      return 'badge-pending';
    case 'en revisión':
    case 'en revision':
      return 'badge-review';
    case 'aprobado':
      return 'badge-approved';
    case 'rechazado':
      return 'badge-rejected';
    case 'resuelto':
      return 'badge-resolved';
    default:
      return 'badge-pending';
  }
}

/**
 * Llena un elemento <select> con opciones dinámicas.
 * @param {HTMLSelectElement} selectEl
 * @param {Array<string|object>} items
 * @param {string} defaultText
 * @param {string} [selectedValue]
 */
export function populateSelect(selectEl, items = [], defaultText = 'Seleccionar...', selectedValue = '') {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="">${defaultText}</option>`;

  items.forEach(item => {
    const val = typeof item === 'object' ? item.value || item.id || item.correo : item;
    const label = typeof item === 'object' ? item.label || item.nombre || item.correo : item;

    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if (selectedValue && String(val) === String(selectedValue)) {
      opt.selected = true;
    }
    selectEl.appendChild(opt);
  });
}

/**
 * Evita inyecciones de código escapando caracteres HTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

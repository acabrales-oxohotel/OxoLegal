/**
 * ============================================================================
 * OXOLEGAL - GESTOR DE ALMACENAMIENTO LOCAL (LOCALSTORAGE)
 * ============================================================================
 */

import { STORAGE_KEYS, DEFAULT_API_URL } from './config.js';

export const storage = {
  /**
   * Obtiene la sesión activa del usuario.
   * @returns {object|null}
   */
  getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error al leer sesión de usuario:', e);
      return null;
    }
  },

  /**
   * Guarda los datos del usuario en sesión activa.
   * @param {object} user
   */
  setUser(user) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error al guardar sesión:', e);
    }
  },

  /**
   * Elimina la sesión activa del usuario.
   */
  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Obtiene el tema guardado ('light' o 'dark').
   * @returns {string}
   */
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  /**
   * Guarda la preferencia de tema.
   * @param {'light'|'dark'} theme
   */
  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  /**
   * Obtiene la URL de la API de Apps Script configurada por el usuario.
   * @returns {string}
   */
  getApiUrl() {
    return localStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
  },

  /**
   * Establece una nueva URL de API en localStorage.
   * @param {string} url
   */
  setApiUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEYS.API_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_URL);
    }
  },

  /**
   * Guarda datos temporales en caché local.
   * @param {string} key
   * @param {any} value
   */
  setCache(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Error al guardar en caché:', e);
    }
  },

  /**
   * Obtiene datos de la caché local.
   * @param {string} key
   * @returns {any|null}
   */
  getCache(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
};

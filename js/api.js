/**
 * ============================================================================
 * OXOLEGAL - SERVICIO DE COMUNICACIÓN CON EL BACKEND (API FETCH)
 * ============================================================================
 */

import { storage } from './storage.js';

/**
 * Realiza una petición GET al Web App de Google Apps Script.
 * @param {string} action Acción requerida por el backend
 * @param {object} params Parámetros adicionales en la URL
 * @returns {Promise<any>}
 */
export async function fetchData(action, params = {}) {
  const apiUrl = storage.getApiUrl();
  const url = new URL(apiUrl);
  url.searchParams.set('action', action);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.warn(`[API GET ${action}] Falló la petición de red:`, error.message);
    throw error;
  }
}

/**
 * Realiza una petición POST al Web App de Google Apps Script.
 * Usa text/plain en el envío para prevenir bloqueos de preflight OPTIONS en GAS.
 * @param {string} action Acción POST a ejecutar
 * @param {object} payload Datos enviados en el cuerpo
 * @returns {Promise<any>}
 */
export async function postData(action, payload = {}) {
  const apiUrl = storage.getApiUrl();
  const bodyData = {
    action: action,
    ...payload
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error(`[API POST ${action}] Error en la llamada:`, error);
    throw error;
  }
}

/**
 * Prueba la conectividad con el Web App.
 * @param {string} testUrl URL opcional a evaluar
 * @returns {Promise<boolean>}
 */
export async function pingApi(testUrl) {
  const url = new URL(testUrl || storage.getApiUrl());
  url.searchParams.set('action', 'ping');

  try {
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return data && data.success === true;
  } catch (e) {
    return false;
  }
}

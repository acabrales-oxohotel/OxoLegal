/**
 * ============================================================================
 * OXOLEGAL - CONFIGURACIÓN Y CONSTANTES DEL BACKEND
 * ============================================================================
 */

// ID de la hoja de cálculo de Google Sheets
const SPREADSHEET_ID = '1G-LmTW0XhDBpdNFGoPypoN67zAucyEV_GbZDmIHjKj4';

// Nombres de las hojas de cálculo
const SHEETS = {
  USUARIOS: 'Usuarios',
  SOLICITUDES: 'Solicitudes',
  CONFIGURACION: 'Configuracion'
};

// Estados oficiales de una solicitud
const ESTADOS = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  RESUELTO: 'Resuelto'
};

// Roles del sistema
const ROLES = {
  ADMIN: 'Administrador',
  USUARIO: 'Usuario'
};

/**
 * Genera una respuesta estándar JSON para Web Apps con cabeceras CORS.
 * @param {object} payload
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function crearRespuestaJson(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Normaliza fechas al formato ISO estándar.
 * @param {any} val
 * @returns {string}
 */
function formatearFecha(val) {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

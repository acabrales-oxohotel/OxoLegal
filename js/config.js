/**
 * ============================================================================
 * OXOLEGAL - CONFIGURACIÓN Y CONSTANTES DEL CLIENTE
 * ============================================================================
 */

// URL oficial del Web App de Google Apps Script desplegado
export const DEFAULT_API_URL = 'https://script.google.com/a/macros/oxohotel.com/s/AKfycbxaBFrZro-3DowLzEWrfm46G07-eQa5R2MCGTGKF-PjXaoyQWDHT_cbZtpB_QbZOszc/exec';

// Claves de persistencia en localStorage
export const STORAGE_KEYS = {
  USER: 'oxolegal_user_session',
  THEME: 'oxolegal_theme_preference',
  API_URL: 'oxolegal_api_url_custom',
  CACHED_REQUESTS: 'oxolegal_cache_requests',
  CACHED_CONFIG: 'oxolegal_cache_config'
};

// Estados oficiales de las solicitudes
export const ESTADOS = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  RESUELTO: 'Resuelto'
};

// Roles de usuario
export const ROLES = {
  ADMIN: 'Administrador',
  USUARIO: 'Usuario'
};

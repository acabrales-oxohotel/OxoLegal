/**
 * ============================================================================
 * OXOLEGAL - ENRUTADOR Y CONTROLADOR PRINCIPAL API Y WEB APP (GAS)
 * ============================================================================
 * Maneja el servicio HTML para la aplicación web y las rutas API (GET / POST).
 */

/**
 * Despachador para solicitudes GET.
 * - Si no hay parámetro 'action' o action='view': Sirve la interfaz web HTML de OxoLegal.
 * - Si hay parámetro 'action': Devuelve respuesta JSON para la API.
 * 
 * @param {object} e Parámetros del evento HTTP
 * @returns {GoogleAppsScript.HTML.HtmlOutput|GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action;

    // Si se invoca una acción específica de API vía GET (ej. ?action=getSolicitudes)
    if (action && action !== 'view' && action !== 'web') {
      return handleApiGet(action, params);
    }

    // De lo contrario, renderizar la aplicación web PWA en Apps Script
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('OxoLegal - Portal de Solicitudes Dirección Jurídica')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=5.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setFaviconUrl('https://acabrales-oxohotel.github.io/OxoLegal/media/OxoLegal-logo.ico');

  } catch (err) {
    return crearRespuestaJson({
      success: false,
      error: 'Error al procesar solicitud GET: ' + (err.message || err.toString())
    });
  }
}

/**
 * Helper para inclusión modular de archivos HTML (estilos y scripts) en plantillas.
 * Permite usar <?!= include('nombre_archivo'); ?> en index.html.
 * 
 * @param {string} filename Nombre del archivo .html sin la extensión
 * @returns {string} Contenido HTML evaluado
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Procesa consultas API GET.
 * @param {string} action
 * @param {object} params
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function handleApiGet(action, params) {
  let result = { success: false, error: 'Acción GET desconocida' };

  switch (action) {
    case 'ping':
      result = {
        success: true,
        message: 'OxoLegal API en línea',
        timestamp: new Date().toISOString()
      };
      break;

    case 'login':
      result = loginUsuario(params.email || params.correo);
      break;

    case 'getUsuarios':
      result = {
        success: true,
        data: getUsuarios()
      };
      break;

    case 'getSolicitudes':
      result = {
        success: true,
        data: getSolicitudes(params.user || params.correo || params.email, params.rol)
      };
      break;

    case 'getConfiguracion':
      result = {
        success: true,
        data: getConfiguracion()
      };
      break;

    case 'init':
      result = inicializarBaseDatos();
      break;

    default:
      result = { success: false, error: 'Acción no reconocida: ' + action };
      break;
  }

  return crearRespuestaJson(result);
}

/**
 * Despachador para solicitudes POST (Inserciones, mutaciones y actualizaciones).
 * @param {object} e Objeto del evento con e.postData.contents
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    let result = { success: false, error: 'Acción POST no especificada' };

    switch (action) {
      case 'login':
        result = loginUsuario(payload.email || payload.correo);
        break;

      case 'getSolicitudes':
        result = {
          success: true,
          data: getSolicitudes(payload.email || payload.correo, payload.rol)
        };
        break;

      case 'crearSolicitud':
        result = crearSolicitud(payload.data || payload);
        break;

      case 'actualizarSolicitud':
        result = actualizarSolicitud(payload.id || (payload.data && payload.data.id), payload.data || payload);
        break;

      case 'gestionarConfiguracion':
        result = gestionarConfiguracion(payload.tipo, payload.operacion, payload.valor);
        break;

      case 'getUsuarios':
        result = {
          success: true,
          data: getUsuarios()
        };
        break;

      case 'getConfiguracion':
        result = {
          success: true,
          data: getConfiguracion()
        };
        break;

      default:
        result = { success: false, error: 'Acción POST inválida: ' + action };
        break;
    }

    return crearRespuestaJson(result);
  } catch (err) {
    return crearRespuestaJson({
      success: false,
      error: err.message || err.toString()
    });
  }
}

/**
 * ============================================================================
 * OXOLEGAL - GESTOR DE BASE DE DATOS (GOOGLE SHEETS)
 * ============================================================================
 */

/**
 * Obtiene la referencia a la hoja de cálculo activa o vinculada.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID !== 'TU_SPREADSHEET_ID_AQUI') {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (error) {
    console.warn('No se pudo abrir por ID, usando activeSpreadsheet:', error.message);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Inicializa automáticamente la estructura de la base de datos si las hojas no existen.
 */
function inicializarBaseDatos() {
  const ss = getSpreadsheet();

  // 1. Hoja "Usuarios"
  let sheetUsuarios = ss.getSheetByName(SHEETS.USUARIOS);
  if (!sheetUsuarios) {
    sheetUsuarios = ss.insertSheet(SHEETS.USUARIOS);
    sheetUsuarios.appendRow(['ID_Usuario', 'Nombre_Completo', 'Correo', 'Rol']);
    sheetUsuarios.getRange(1, 1, 1, 4)
      .setFontWeight('bold')
      .setBackground('#0B1120')
      .setFontColor('#FFFFFF');
    // Registro inicial administrador
    sheetUsuarios.appendRow([
      'USR-' + Utilities.getUuid().slice(0, 8),
      'Dirección Jurídica Oxo',
      'alljuridico@oxohotel.com',
      ROLES.ADMIN
    ]);
  }

  // 2. Hoja "Solicitudes"
  let sheetSolicitudes = ss.getSheetByName(SHEETS.SOLICITUDES);
  if (!sheetSolicitudes) {
    sheetSolicitudes = ss.insertSheet(SHEETS.SOLICITUDES);
    sheetSolicitudes.appendRow([
      'ID_Solicitud',
      'Fecha_Creacion',
      'Hotel',
      'Asunto',
      'Descripcion',
      'Estado',
      'Etiqueta',
      'Asignado_A',
      'Fecha_Actualizacion'
    ]);
    sheetSolicitudes.getRange(1, 1, 1, 9)
      .setFontWeight('bold')
      .setBackground('#0B1120')
      .setFontColor('#FFFFFF');
  }

  // 3. Hoja "Configuracion"
  let sheetConfig = ss.getSheetByName(SHEETS.CONFIGURACION);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEETS.CONFIGURACION);
    sheetConfig.appendRow(['Lista_Hoteles', 'Lista_Etiquetas']);
    sheetConfig.getRange(1, 1, 1, 2)
      .setFontWeight('bold')
      .setBackground('#0B1120')
      .setFontColor('#FFFFFF');

    // Catálogo semilla tomado de proyectos y operaciones reales
    const hotelesSemilla = [
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
    ];

    const etiquetasSemilla = [
      'Contratos',
      'Laboral',
      'Civil y Comercial',
      'PreApertura',
      'Concepto Jurídico',
      'Regulatorio / Turismo',
      'Societario',
      'Protección de Datos'
    ];

    const maxFilas = Math.max(hotelesSemilla.length, etiquetasSemilla.length);
    for (let i = 0; i < maxFilas; i++) {
      sheetConfig.appendRow([
        hotelesSemilla[i] || '',
        etiquetasSemilla[i] || ''
      ]);
    }
  }

  return { success: true, message: 'Base de datos inicializada correctamente.' };
}

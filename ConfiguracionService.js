/**
 * ============================================================================
 * OXOLEGAL - SERVICIO DE CONFIGURACIÓN Y CATÁLOGOS
 * ============================================================================
 */

/**
 * Obtiene los catálogos de hoteles y etiquetas desde la hoja "Configuracion".
 * @returns {object} { hoteles: string[], etiquetas: string[] }
 */
function getConfiguracion() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CONFIGURACION);
  if (!sheet) {
    return { hoteles: [], etiquetas: [] };
  }

  const data = sheet.getDataRange().getValues();
  const hoteles = [];
  const etiquetas = [];

  for (let i = 1; i < data.length; i++) {
    const hotel = String(data[i][0] || '').trim();
    const etiqueta = String(data[i][1] || '').trim();

    if (hotel && !hoteles.includes(hotel)) hoteles.push(hotel);
    if (etiqueta && !etiquetas.includes(etiqueta)) etiquetas.push(etiqueta);
  }

  return {
    hoteles: hoteles.sort(),
    etiquetas: etiquetas.sort()
  };
}

/**
 * Añade o elimina valores de los catálogos (Hoteles o Etiquetas).
 * @param {'hoteles'|'etiquetas'} tipo Catálogo objetivo
 * @param {'agregar'|'eliminar'} operacion Acción a realizar
 * @param {string} valor Texto del hotel o etiqueta
 * @returns {object}
 */
function gestionarConfiguracion(tipo, operacion, valor) {
  if (!tipo || !operacion || !valor) {
    return { success: false, error: 'Parámetros incompletos.' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.CONFIGURACION);
  if (!sheet) return { success: false, error: 'Hoja de Configuración no encontrada.' };

  const colIndex = tipo.toLowerCase() === 'hoteles' ? 1 : 2;
  const data = sheet.getDataRange().getValues();
  const valorLimpio = valor.trim();

  if (operacion === 'agregar') {
    // Verificar si ya existe
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colIndex - 1]).toLowerCase() === valorLimpio.toLowerCase()) {
        return { success: false, error: 'El valor ya se encuentra registrado.' };
      }
    }

    let filaInsertada = false;
    for (let i = 1; i < data.length; i++) {
      if (!data[i][colIndex - 1]) {
        sheet.getRange(i + 1, colIndex).setValue(valorLimpio);
        filaInsertada = true;
        break;
      }
    }

    if (!filaInsertada) {
      const nuevaFila = colIndex === 1 ? [valorLimpio, ''] : ['', valorLimpio];
      sheet.appendRow(nuevaFila);
    }

    return {
      success: true,
      message: `Elemento agregado a ${tipo}.`,
      data: getConfiguracion()
    };
  }

  if (operacion === 'eliminar') {
    let encontrado = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colIndex - 1]).toLowerCase() === valorLimpio.toLowerCase()) {
        sheet.getRange(i + 1, colIndex).setValue('');
        encontrado = true;
        break;
      }
    }

    if (!encontrado) {
      return { success: false, error: 'Elemento no encontrado para eliminar.' };
    }

    return {
      success: true,
      message: `Elemento eliminado de ${tipo}.`,
      data: getConfiguracion()
    };
  }

  return { success: false, error: 'Operación no soportada.' };
}

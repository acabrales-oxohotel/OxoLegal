/**
 * ============================================================================
 * OXOLEGAL - SERVICIO DE GESTIÓN DE SOLICITUDES
 * ============================================================================
 */

/**
 * Obtiene las solicitudes filtradas según el rol del usuario.
 * - Administrador: Visualiza todas las solicitudes.
 * - Usuario: Solo las solicitudes donde Col H ("Asignado_A") coincide con su correo.
 * 
 * @param {string} correo Correo del usuario autenticado
 * @param {string} rol Rol del usuario (Administrador | Usuario)
 * @returns {Array<object>}
 */
function getSolicitudes(correo, rol) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const correoNorm = (correo || '').trim().toLowerCase();
  const esAdmin = (rol || '').trim().toLowerCase() === ROLES.ADMIN.toLowerCase();

  const solicitudes = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Fila vacía

    const asignadoA = String(row[7] || '').trim();
    const asignadoNorm = asignadoA.toLowerCase();

    // Filtro estricto por rol
    if (!esAdmin && asignadoNorm !== correoNorm) {
      continue;
    }

    solicitudes.push({
      id: String(row[0]),
      fechaCreacion: formatearFecha(row[1]),
      hotel: String(row[2] || ''),
      asunto: String(row[3] || ''),
      descripcion: String(row[4] || ''),
      estado: String(row[5] || ESTADOS.PENDIENTE),
      etiqueta: String(row[6] || 'General'),
      asignadoA: asignadoA,
      fechaActualizacion: formatearFecha(row[8])
    });
  }

  // Orden cronológico inverso (las más recientes primero)
  solicitudes.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

  return solicitudes;
}

/**
 * Registra una nueva solicitud jurídica y envía notificación por correo.
 * @param {object} datos Datos de la solicitud a crear
 * @returns {object} { success: boolean, data?: object, error?: string }
 */
function crearSolicitud(datos) {
  if (!datos || !datos.asunto || !datos.hotel) {
    return { success: false, error: 'El Hotel y el Asunto son obligatorios.' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
  if (!sheet) {
    return { success: false, error: 'No se encontró la hoja de Solicitudes.' };
  }

  const anio = new Date().getFullYear();
  const sufijo = Math.floor(1000 + Math.random() * 9000);
  const idSolicitud = `OXO-${anio}-${sufijo}`;
  const fechaActual = new Date();

  const nuevaFila = [
    idSolicitud,
    fechaActual,
    String(datos.hotel).trim(),
    String(datos.asunto).trim(),
    String(datos.descripcion || '').trim(),
    String(datos.estado || ESTADOS.PENDIENTE).trim(),
    String(datos.etiqueta || 'General').trim(),
    String(datos.asignadoA || '').trim(),
    fechaActual
  ];

  sheet.appendRow(nuevaFila);

  const solicitudCreada = {
    id: idSolicitud,
    fechaCreacion: formatearFecha(fechaActual),
    hotel: datos.hotel,
    asunto: datos.asunto,
    descripcion: datos.descripcion || '',
    estado: datos.estado || ESTADOS.PENDIENTE,
    etiqueta: datos.etiqueta || 'General',
    asignadoA: datos.asignadoA || '',
    fechaActualizacion: formatearFecha(fechaActual)
  };

  try {
    notificar('NUEVA_SOLICITUD', solicitudCreada);
  } catch (err) {
    console.error('Error al enviar correo para nueva solicitud:', err.message);
  }

  return {
    success: true,
    message: 'Solicitud creada satisfactoriamente.',
    data: solicitudCreada
  };
}

/**
 * Actualiza una solicitud existente por su ID_Solicitud.
 * @param {string} id ID único de la solicitud
 * @param {object} datos Campos a actualizar
 * @returns {object} { success: boolean, data?: object, error?: string }
 */
function actualizarSolicitud(id, datos) {
  if (!id) {
    return { success: false, error: 'ID de solicitud requerido para actualizar.' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SOLICITUDES);
  if (!sheet) {
    return { success: false, error: 'Hoja Solicitudes no disponible.' };
  }

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: `Solicitud ${id} no encontrada en la base de datos.` };
  }

  const filaOriginal = data[rowIndex - 1];
  const estadoAnterior = filaOriginal[5];
  const asignadoAnterior = filaOriginal[7];

  const nuevoHotel = datos.hotel !== undefined ? datos.hotel : filaOriginal[2];
  const nuevoAsunto = datos.asunto !== undefined ? datos.asunto : filaOriginal[3];
  const nuevaDesc = datos.descripcion !== undefined ? datos.descripcion : filaOriginal[4];
  const nuevoEstado = datos.estado !== undefined ? datos.estado : filaOriginal[5];
  const nuevaEtiqueta = datos.etiqueta !== undefined ? datos.etiqueta : filaOriginal[6];
  const nuevoAsignado = datos.asignadoA !== undefined ? datos.asignadoA : filaOriginal[7];
  const fechaActualizacion = new Date();

  sheet.getRange(rowIndex, 3).setValue(nuevoHotel);
  sheet.getRange(rowIndex, 4).setValue(nuevoAsunto);
  sheet.getRange(rowIndex, 5).setValue(nuevaDesc);
  sheet.getRange(rowIndex, 6).setValue(nuevoEstado);
  sheet.getRange(rowIndex, 7).setValue(nuevaEtiqueta);
  sheet.getRange(rowIndex, 8).setValue(nuevoAsignado);
  sheet.getRange(rowIndex, 9).setValue(fechaActualizacion);

  const solicitudActualizada = {
    id: id,
    fechaCreacion: formatearFecha(filaOriginal[1]),
    hotel: nuevoHotel,
    asunto: nuevoAsunto,
    descripcion: nuevaDesc,
    estado: nuevoEstado,
    etiqueta: nuevaEtiqueta,
    asignadoA: nuevoAsignado,
    fechaActualizacion: formatearFecha(fechaActualizacion),
    estadoAnterior: estadoAnterior,
    asignadoAnterior: asignadoAnterior
  };

  try {
    if (estadoAnterior !== nuevoEstado || asignadoAnterior !== nuevoAsignado) {
      notificar('CAMBIO_ESTADO', solicitudActualizada);
    }
  } catch (err) {
    console.error('Error al notificar actualización:', err.message);
  }

  return {
    success: true,
    message: 'Solicitud actualizada correctamente.',
    data: solicitudActualizada
  };
}

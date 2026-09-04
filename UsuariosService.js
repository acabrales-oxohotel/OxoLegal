/**
 * ============================================================================
 * OXOLEGAL - SERVICIO DE USUARIOS Y AUTENTICACIÓN
 * ============================================================================
 */

/**
 * Valida si un correo existe en la base de datos de usuarios y recupera su información y rol.
 * @param {string} email Correo del usuario que inicia sesión
 * @returns {object} { success: boolean, usuario?: object, error?: string }
 */
function loginUsuario(email) {
  if (!email || typeof email !== 'string') {
    return { success: false, error: 'Debe ingresar un correo electrónico válido.' };
  }

  const usuarios = getUsuarios();
  const emailNorm = email.trim().toLowerCase();
  const usuarioEncontrado = usuarios.find(u => u.correo && u.correo.trim().toLowerCase() === emailNorm);

  if (!usuarioEncontrado) {
    return {
      success: false,
      error: 'El correo no está registrado en el sistema. Contacte a la Dirección Jurídica.'
    };
  }

  return {
    success: true,
    usuario: usuarioEncontrado
  };
}

/**
 * Retorna todos los registros de la hoja "Usuarios".
 * @returns {Array<object>}
 */
function getUsuarios() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USUARIOS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const usuarios = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[2]) continue;

    usuarios.push({
      id: String(row[0] || ''),
      nombre: String(row[1] || ''),
      correo: String(row[2] || ''),
      rol: String(row[3] || ROLES.USUARIO)
    });
  }

  return usuarios;
}

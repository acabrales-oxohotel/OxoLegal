/**
 * ============================================================================
 * OXOLEGAL - SERVICIO DE NOTIFICACIONES POR CORREO (GMAILAPP)
 * ============================================================================
 */

/**
 * Envía un correo con diseño corporativo HTML "OxoLegal" a través de GmailApp.
 * @param {'NUEVA_SOLICITUD'|'CAMBIO_ESTADO'} tipo Tipo de evento notificado
 * @param {object} datos Datos de la solicitud
 */
function notificar(tipo, datos) {
  const usuarios = getUsuarios();
  const admins = usuarios.filter(u => u.rol === ROLES.ADMIN).map(u => u.correo);
  const destinatariosSet = new Set(admins);

  if (datos.asignadoA && datos.asignadoA.includes('@')) {
    destinatariosSet.add(datos.asignadoA.trim());
  }

  const destinatarios = Array.from(destinatariosSet).filter(Boolean);
  if (destinatarios.length === 0) return;

  const toList = destinatarios.join(',');
  let badgeColor = '#2563EB'; // Azul primario
  let badgeText = datos.estado || ESTADOS.PENDIENTE;

  if (datos.estado === ESTADOS.RESUELTO) badgeColor = '#059669'; // Verde
  else if (datos.estado === ESTADOS.EN_REVISION) badgeColor = '#D97706'; // Ámbar
  else if (datos.estado === ESTADOS.RECHAZADO) badgeColor = '#DC2626'; // Rojo
  else if (datos.estado === ESTADOS.APROBADO) badgeColor = '#0D9488'; // Verde azulado

  let asuntoCorreo = '';
  let cuerpoTitulo = '';
  let mensajeEncabezado = '';

  if (tipo === 'NUEVA_SOLICITUD') {
    asuntoCorreo = `[OxoLegal] Nueva Solicitud Jurídica: ${datos.id} - ${datos.hotel}`;
    cuerpoTitulo = 'Nueva Solicitud Jurídica';
    mensajeEncabezado = 'Se ha generado una nueva solicitud en el portal de gestión jurídica:';
  } else {
    asuntoCorreo = `[OxoLegal] Actualización de Solicitud: ${datos.id} [${datos.estado}]`;
    cuerpoTitulo = 'Actualización de Solicitud';
    mensajeEncabezado = `La solicitud <strong>${datos.id}</strong> ha registrado una actualización:`;
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; margin: 0; padding: 24px; color: #1E293B; }
        .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #E2E8F0; }
        .header { background: #0B1120; padding: 28px; text-align: center; border-bottom: 2px solid #D97706; }
        .logo-title { color: #F8FAFC; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; margin: 0; }
        .logo-sub { color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
        .content { padding: 32px 28px; }
        .headline { font-size: 18px; font-weight: 600; color: #0F172A; margin-bottom: 8px; }
        .subtext { font-size: 14px; color: #64748B; margin-bottom: 24px; line-height: 1.5; }
        .card-details { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; }
        .detail-label { font-weight: 600; color: #475569; width: 35%; }
        .detail-val { color: #0F172A; width: 65%; word-break: break-word; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #FFFFFF; background-color: ${badgeColor}; }
        .desc-box { margin-top: 16px; padding: 14px; background: #FFFFFF; border-radius: 6px; border: 1px solid #E2E8F0; font-size: 13px; color: #334155; line-height: 1.6; }
        .footer { background: #F1F5F9; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
        .btn { display: inline-block; padding: 12px 24px; background: #0B1120; color: #FFFFFF !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; border: 1px solid #D97706; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-title">OxoLegal</div>
          <div class="logo-sub">Dirección Jurídica oxoHotel</div>
        </div>
        <div class="content">
          <div class="headline">${cuerpoTitulo}</div>
          <p class="subtext">${mensajeEncabezado}</p>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">ID Solicitud:</span>
              <span class="detail-val"><strong>${datos.id}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado:</span>
              <span class="detail-val"><span class="badge">${badgeText}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hotel:</span>
              <span class="detail-val">${datos.hotel}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Asunto:</span>
              <span class="detail-val">${datos.asunto}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Etiqueta:</span>
              <span class="detail-val">${datos.etiqueta}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Asignado a:</span>
              <span class="detail-val">${datos.asignadoA || 'Sin asignar'}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Fecha:</span>
              <span class="detail-val">${datos.fechaActualizacion || datos.fechaCreacion}</span>
            </div>

            <div class="desc-box">
              <strong>Descripción:</strong><br>
              ${datos.descripcion ? datos.descripcion.replace(/\n/g, '<br>') : '<em>Sin descripción complementaria.</em>'}
            </div>
          </div>

          <div style="text-align: center;">
            <a href="https://acabrales-oxohotel.github.io/OxoLegal/" class="btn">Abrir Portal OxoLegal</a>
          </div>
        </div>
        <div class="footer">
          Mensaje automático generado por OxoLegal Desk. Por favor no responda directamente a este correo.<br>
          © ${new Date().getFullYear()} oxoHotel S.A.S. - Confidencial
        </div>
      </div>
    </body>
    </html>
  `;

  GmailApp.sendEmail(toList, asuntoCorreo, `[OxoLegal] ${cuerpoTitulo} - ${datos.id}: ${datos.asunto}`, {
    htmlBody: htmlBody,
    name: 'OxoLegal Desk'
  });
}

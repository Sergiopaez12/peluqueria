const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS   // Contraseña de aplicación de Google
    }
});

const from = `"BarberApp ✂️" <${process.env.EMAIL_USER}>`;

// ── Templates ──────────────────────────────────────────────────────

const htmlBase = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background: #0a0a0f; font-family: 'Helvetica Neue', Arial, sans-serif; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #12121a; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 36px; }
  .logo { text-align: center; margin-bottom: 28px; }
  .logo h1 { font-size: 24px; color: #a78bfa; margin: 8px 0 0; }
  .logo span { font-size: 36px; }
  h2 { color: #f1f0f5; font-size: 20px; margin: 0 0 16px; }
  p { color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 12px; }
  .detail-box { background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2); border-radius: 12px; padding: 20px; margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { color: #6b7280; }
  .detail-value { color: #f1f0f5; font-weight: 600; }
  .badge { display: inline-block; padding: 4px 14px; border-radius: 50px; font-size: 12px; font-weight: 700; }
  .badge-green  { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
  .badge-red    { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
  .badge-yellow { background: rgba(251,191,36,0.15);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
  .footer { text-align: center; margin-top: 24px; color: #4b5563; font-size: 12px; }
</style></head>
<body><div class="wrapper"><div class="card">${contenido}</div>
<div class="footer">© 2026 BarberApp · Gestión de peluquería</div>
</div></body></html>`;

const detallesTurno = (turno) => `
<div class="detail-box">
  <div class="detail-row"><span class="detail-label">Servicio</span><span class="detail-value">${turno.servicio}</span></div>
  <div class="detail-row"><span class="detail-label">Fecha</span><span class="detail-value">${turno.fecha}</span></div>
  <div class="detail-row"><span class="detail-label">Hora</span><span class="detail-value">${turno.hora} hs</span></div>
</div>`;

// ── Funciones de envío ─────────────────────────────────────────────

exports.enviarConfirmacion = async (turno, usuario) => {
    await transporter.sendMail({
        from,
        to: usuario.email,
        subject: '✅ Tu turno fue confirmado - BarberApp',
        html: htmlBase(`
            <div class="logo"><span>✂️</span><h1>BarberApp</h1></div>
            <h2>¡Tu turno está confirmado! ✅</h2>
            <p>Hola <strong style="color:#f1f0f5">${usuario.nombre}</strong>, te avisamos que tu turno fue <span class="badge badge-green">Confirmado</span></p>
            ${detallesTurno(turno)}
            <p>¡Te esperamos! Recordá llegar unos minutos antes. 💈</p>
        `)
    });
    console.log(`📧 Confirmación enviada a ${usuario.email}`);
};

exports.enviarRechazo = async (turno, usuario) => {
    await transporter.sendMail({
        from,
        to: usuario.email,
        subject: '❌ Tu turno fue rechazado - BarberApp',
        html: htmlBase(`
            <div class="logo"><span>✂️</span><h1>BarberApp</h1></div>
            <h2>Turno no disponible ❌</h2>
            <p>Hola <strong style="color:#f1f0f5">${usuario.nombre}</strong>, lamentablemente tu turno fue <span class="badge badge-red">Rechazado</span></p>
            ${detallesTurno(turno)}
            <p>Por favor ingresá a la app para elegir otro horario. Disculpá las molestias.</p>
        `)
    });
    console.log(`📧 Rechazo enviado a ${usuario.email}`);
};

exports.enviarRecordatorio = async (turno, usuario) => {
    await transporter.sendMail({
        from,
        to: usuario.email,
        subject: '🔔 Recordatorio: tenés turno mañana - BarberApp',
        html: htmlBase(`
            <div class="logo"><span>✂️</span><h1>BarberApp</h1></div>
            <h2>¡Tu turno es mañana! 🔔</h2>
            <p>Hola <strong style="color:#f1f0f5">${usuario.nombre}</strong>, este es un recordatorio de tu turno de mañana:</p>
            ${detallesTurno(turno)}
            <p>Si necesitás cancelar, hacelo con al menos <strong style="color:#f1f0f5">2 horas de anticipación</strong> desde la app.</p>
            <p style="margin-top:16px">¡Nos vemos! 💈</p>
        `)
    });
    console.log(`📧 Recordatorio enviado a ${usuario.email}`);
};

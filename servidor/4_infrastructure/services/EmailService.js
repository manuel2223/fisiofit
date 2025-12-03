// En servidor/4_infrastructure/services/EmailService.js
const nodemailer = require('nodemailer');

// 1. Configurar el "Transportador" (quién envía el correo)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class EmailService {
  
  static async enviarConfirmacionCita(destinatario, nombrePaciente, fecha, hora, tipo) {
    try {
      const info = await transporter.sendMail({
        from: '"FisioFit 🏥" <tu_correo_real@gmail.com>', // El remitente bonito
        to: destinatario, // El email del paciente
        subject: '✅ Reserva Confirmada - FisioFit',
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #008080;">¡Hola ${nombrePaciente}!</h2>
            <p>Tu cita ha sido reservada correctamente.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📅 Fecha:</strong> ${fecha}</p>
              <p><strong>⏰ Hora:</strong> ${hora}</p>
              <p><strong>🩺 Tipo:</strong> ${tipo}</p>
            </div>
            <p>Si necesitas cancelarla, puedes hacerlo desde tu área personal.</p>
            <p><em>El equipo de FisioFit</em></p>
          </div>
        `,
      });
      console.log("Email enviado: %s", info.messageId);
    } catch (error) {
      console.error("Error enviando email:", error);
      // No lanzamos error para no romper la reserva si falla el correo
    }
  }

  static async enviarAvisoFisio(nombrePaciente, fecha, hora, tipo, motivo) {
    try {
      // Enviamos el aviso a TU correo (como si fueras el fisio)
      await transporter.sendMail({
        from: '"Sistema FisioFit 🤖" <tu_correo_real@gmail.com>',
        to: process.env.EMAIL_USER, // Se lo mandamos al propio fisio
        subject: '📅 Nueva Cita Reservada',
        html: `
          <h3>Nueva reserva recibida</h3>
          <ul>
            <li><strong>Paciente:</strong> ${nombrePaciente}</li>
            <li><strong>Fecha:</strong> ${fecha} a las ${hora}</li>
            <li><strong>Tipo:</strong> ${tipo}</li>
            <li><strong>Motivo:</strong> ${motivo || 'Sin especificar'}</li>
          </ul>
        `,
      });
    } catch (error) {
      console.error("Error enviando aviso al fisio:", error);
    }
  }

  static async enviarCancelacion(destinatario, nombrePaciente, fecha, hora) {
    try {
        await transporter.sendMail({
          from: '"FisioFit 🏥" <tu_correo_real@gmail.com>',
          to: destinatario,
          subject: '❌ Cita Cancelada',
          html: `
            <p>Hola ${nombrePaciente},</p>
            <p>Te confirmamos que tu cita del <strong>${fecha}</strong> a las <strong>${hora}</strong> ha sido cancelada.</p>
          `,
        });
    } catch (error) {
        console.error("Error enviando cancelación:", error);
    }
  }
}

module.exports = EmailService;
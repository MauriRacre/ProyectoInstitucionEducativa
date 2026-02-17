const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});


async function sendMail({ to, subject, html }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

async function sendPaymentMail(to, data) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Confirmación de pago registrado",
    html: `
      <p>Estimado/a tutor/a,</p>
      <p>Se registró correctamente un pago.</p>
      <ul>
        <li>Estudiante: ${data.student}</li>
        <li>Concepto: ${data.concept}</li>
        <li>Monto pagado: $${data.paid}</li>
        <li>Descuento: $${data.discount}</li>
      </ul>
      <p>Gracias por su responsabilidad.</p>
    `,
  });
}

async function sendRecoveryMail(to, nombre, ping) {
  await transporter.sendMail({
    from: `"Unidad Educativa Maravillas del Saber" <${process.env.MAIL_USER}>`,
    to,
    subject: "Recuperación de PIN de acceso",
    html: `
      <p>Estimado/a ${nombre},</p>
      <p>Se ha solicitado la recuperación de su PIN.</p>
      <p><strong>Su nuevo PIN de acceso es:</strong></p>
      <h2>${ping}</h2>
      <p>Si usted no realizó esta solicitud, comuníquese con la institución.</p>
      <br>
      <p>Unidad Educativa Maravillas del Saber</p>
    `,
  });
}

module.exports = { sendMail, sendPaymentMail, sendRecoveryMail };


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

module.exports = { sendMail, sendPaymentMail };

const pool = require("../config/db");

async function updateEstadoMensualidad(mensualidadId) {
  const [[concept]] = await pool.query(
    `SELECT total FROM mensualidades WHERE id = ?`,
    [mensualidadId]
  );

  const [[sum]] = await pool.query(
    `SELECT COALESCE(SUM(monto + descuento),0) AS totalPagado
     FROM pagos
     WHERE mensualidad_id = ?`,
    [mensualidadId]
  );

  const total = concept.total;
  const totalPagado = sum.totalPagado;
  const pendiente = total - totalPagado;

  let estado = "PENDIENTE";

  if (totalPagado > 0 && pendiente > 0) {
    estado = "PARCIAL";
  }

  if (pendiente <= 0) {
    estado = "PAGADO";
  }

  await pool.query(
    `UPDATE mensualidades SET estado = ? WHERE id = ?`,
    [estado, mensualidadId]
  );

  return pendiente;
}

module.exports = { updateEstadoMensualidad };

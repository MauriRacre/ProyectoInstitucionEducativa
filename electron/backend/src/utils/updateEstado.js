const pool = require("../config/db");

async function updateEstadoMensualidad(db, id) {
  const [[concept]] = await db.query(
    `SELECT total FROM mensualidades WHERE id = ?`,
    [id]
  );

  if (!concept) return;

  const [[sum]] = await db.query(
    `SELECT COALESCE(SUM(monto + descuento),0) AS pagado
     FROM pagos
     WHERE tipo = 'MENSUALIDAD'
     AND referencia_id = ?
     AND reversed = 0`,
    [id]
  );

  const pendiente = concept.total - sum.pagado;

  const nuevoEstado =
    pendiente <= 0 ? "PAGADO" : "PENDIENTE";

  await db.query(
    `UPDATE mensualidades SET estado = ? WHERE id = ?`,
    [nuevoEstado, id]
  );

  return pendiente;
}
async function updateEstadoServicio(db, id) {
  const [[concept]] = await db.query(
    `SELECT total, evento_id
     FROM estudiante_servicio
     WHERE id = ?`,
    [id]
  );

  if (!concept) return;

  const [[sum]] = await db.query(
    `SELECT COALESCE(SUM(monto + descuento),0) AS pagado
     FROM pagos
     WHERE tipo = 'SERVICIO'
     AND referencia_id = ?
     AND reversed = 0`,
    [id]
  );

  const pendiente = concept.total - sum.pagado;

  let nuevoEstado;

  if (concept.evento_id) {
    nuevoEstado =
      pendiente <= 0 ? "EVENTO_PAGADO" : "EVENTO_PENDIENTE";
  } else {
    nuevoEstado =
      pendiente <= 0 ? "PAGADO" : "PENDIENTE";
  }

  await db.query(
    `UPDATE estudiante_servicio
     SET estado = ?
     WHERE id = ?`,
    [nuevoEstado, id]
  );

  return pendiente;
}
async function updateEstadoGasto(db, id) {
  const [[concept]] = await db.query(
    `SELECT total FROM gastos_ocacionales WHERE id = ?`,
    [id]
  );

  if (!concept) return;

  const [[sum]] = await db.query(
    `SELECT COALESCE(SUM(monto + descuento),0) AS pagado
     FROM pagos
     WHERE tipo = 'GASTO_OCASIONAL'
     AND referencia_id = ?
     AND reversed = 0`,
    [id]
  );

  const pendiente = concept.total - sum.pagado;

  const nuevoEstado =
    pendiente <= 0 ? "PAGADO" : "PENDIENTE";

  await db.query(
    `UPDATE gastos_ocacionales SET estado = ? WHERE id = ?`,
    [nuevoEstado, id]
  );

  return pendiente;
}
module.exports = {
  updateEstadoMensualidad,
  updateEstadoServicio,
  updateEstadoGasto
};
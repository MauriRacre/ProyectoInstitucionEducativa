const pool = require("../config/db");

async function updateEstadoMensualidad(id) {
  const [[concept]] = await pool.query(
    `SELECT total FROM mensualidades WHERE id = ?`,
    [id]
  );

  const [[sum]] = await pool.query(
    `SELECT COALESCE(SUM(monto + descuento),0) AS pagado
     FROM pagos
     WHERE tipo = 'MENSUALIDAD'
     AND referencia_id = ?
     AND reversed = 0`,
    [id]
  );

  const nuevoEstado =
    sum.pagado >= concept.total ? "PAGADO" : "PENDIENTE";

  await pool.query(
    `UPDATE mensualidades SET estado = ? WHERE id = ?`,
    [nuevoEstado, id]
  );

  return concept.total - sum.pagado;
}

async function updateEstadoServicio(id) {
  const [[concept]] = await pool.query(
    `SELECT total, servicio_id, evento_id
     FROM estudiante_servicio
     WHERE id = ?`,
    [id]
  );

  if (!concept) return;

  const tipo = concept.evento_id ? "EVENTO" : "SERVICIO";
  console.log(tipo);
  const [[sum]] = await pool.query(
    `SELECT COALESCE(SUM(monto + descuento),0) AS pagado
     FROM pagos
     WHERE tipo = "SERVICIO"
     AND referencia_id = ?
     AND reversed = 0`,
    [ id]
  );

  let nuevoEstado;

  if (tipo === "EVENTO") {
    nuevoEstado =
      sum.pagado >= concept.total
        ? "EVENTO_PAGADO"
        : "EVENTO_PENDIENTE";
  } else {
    nuevoEstado =
      sum.pagado >= concept.total
        ? "PAGADO"
        : "PENDIENTE";
  }
  await pool.query(
    `UPDATE estudiante_servicio
     SET estado = ?
     WHERE id = ?`,
    [nuevoEstado, id]
  );

  return concept.total - sum.pagado;
}
async function updateEstadoGasto(id) {

  const [[concept]] = await pool.query(
    `SELECT total FROM gastos_ocacionales WHERE id = ?`,
    [id]
  );

  const [[sum]] = await pool.query(
      `SELECT COALESCE(SUM(monto + descuento),0) AS total
      FROM pagos
      WHERE tipo = 'GASTO_OCASIONAL'
      AND referencia_id = ?
      AND reversed = 0`,
      [id]
    );

    const pendiente = concept.total - sum.total;

    const estado = pendiente <= 0 ? "PAGADO" : "PENDIENTE";

    await pool.query(
      `UPDATE gastos_ocacionales SET estado = ? WHERE id = ?`,
      [estado, id]
    );

    return pendiente;
  }
module.exports = {
  updateEstadoMensualidad,
  updateEstadoServicio,
  updateEstadoGasto
};
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");

router.post("/:conceptId", async (req, res) => {
  try {
    const { conceptId } = req.params;
    const {
      paid = 0,
      discount = 0,
      note = null,
      responsible = null,
      dateISO
    } = req.body;

    if (paid < 0 || discount < 0) {
      return apiError(res, "VALIDATION_ERROR", "Montos inválidos");
    }

    const [[concept]] = await pool.query(
      `SELECT monto FROM mensualidades WHERE id = ?`,
      [conceptId]
    );

    if (!concept) {
      return apiError(res, "NOT_FOUND", "Concepto no encontrado");
    }

    const [[sum]] = await pool.query(
      `SELECT 
          COALESCE(SUM(monto + descuento),0) AS total
       FROM pagos
       WHERE mensualidad_id = ?`,
      [conceptId]
    );

    const pendienteActual = concept.monto - sum.total;
    const aplicando = paid + discount;

    if (aplicando > pendienteActual) {
      return apiError(
        res,
        "BUSINESS_RULE",
        "El pago supera el pendiente"
      );
    }

    const fecha = dateISO || new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO pagos 
        (mensualidad_id, fecha, monto, descuento, nota, responsable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [conceptId, fecha, paid, discount, note, responsible]
    );

    const nuevoPendiente = pendienteActual - aplicando;

    res.json({
      movementId: result.insertId,
      conceptId,
      newPending: nuevoPendiente
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo registrar el pago");
  }
});

module.exports = router;

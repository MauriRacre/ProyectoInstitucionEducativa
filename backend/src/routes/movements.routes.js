const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");
const { updateEstadoMensualidad } = require("../utils/updateEstadoMensualidad");
const { sendPaymentMail } = require("../utils/mailer");

// Registrar movimiento
router.post("/payment-concepts/:conceptId/movements", async (req, res) => {

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
      `SELECT total, estado FROM mensualidades WHERE id = ?`,
      [conceptId]
    );

    if (!concept) {
      return apiError(res, "NOT_FOUND", "Concepto no encontrado");
    }
    if (concept.estado === "PAGADO") {
      return apiError(
        res,
        "CONFLICT",
        "La mensualidad ya está cancelada"
      );
    }

    const [[sum]] = await pool.query(
      `SELECT 
          COALESCE(SUM(monto + descuento),0) AS total
       FROM pagos
       WHERE mensualidad_id = ?`,
      [conceptId]
    );

    const pendienteActual = concept.total - sum.total;
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

     // obtener tutor y alumno
    const [[info]] = await pool.query(
      `SELECT 
          t.correo AS email,
          t.nombre AS tutor,
          e.nombre AS student
      FROM mensualidades m
      JOIN estudiantes e ON e.id = m.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id
      WHERE m.id = ?`,
      [conceptId]
    );

      try {
      if (info?.email) {
        await sendPaymentMail(info.email, {
          student: info.student,
          concept: `Mensualidad`,
          paid,
          discount
        });
      }
    } catch (mailError) {
      console.error("Error enviando correo:", mailError.message);
    }



    const newPending = await updateEstadoMensualidad(conceptId);

    res.json({
    movementId: result.insertId,
    conceptId,
    newPending,
  });
  


  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo registrar el pago");
  }
});

// Revertir
router.post("/movements/:movementId/reversal", async (req, res) => {

  try {
    const { movementId } = req.params;
    const { reason = null, responsible = null } = req.body;

    // 1️⃣ buscar movimiento original
    const [[movement]] = await pool.query(
      `SELECT * FROM pagos WHERE id = ?`,
      [movementId]
    );

    if (!movement) {
      return apiError(res, "NOT_FOUND", "Movimiento no existe");
    }

    if (movement.reversed) {
      return apiError(res, "CONFLICT", "El movimiento ya fue revertido");
    }

    // 2️⃣ crear reverso (negativo)
    const fecha = new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO pagos
        (mensualidad_id, fecha, monto, descuento, nota, responsable, reversed)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        movement.mensualidad_id,
        fecha,
        -movement.monto,
        -movement.descuento,
        reason || "REVERSAL",
        responsible
      ]
    );

    // 3️⃣ marcar original como revertido
    await pool.query(
      `UPDATE pagos SET reversed = 1 WHERE id = ?`,
      [movementId]
    );

    // 4️⃣ recalcular pendiente
    const [[concept]] = await pool.query(
      `SELECT monto FROM mensualidades WHERE id = ?`,
      [movement.mensualidad_id]
    );

    const [[sum]] = await pool.query(
      `SELECT COALESCE(SUM(monto + descuento),0) AS total
       FROM pagos
       WHERE mensualidad_id = ?`,
      [movement.mensualidad_id]
    );

      const newPending = await updateEstadoMensualidad(
      movement.mensualidad_id
    );


    res.json({
      ok: true,
      reversalMovementId: result.insertId,
      newPending
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo revertir");
  }
});


module.exports = router;

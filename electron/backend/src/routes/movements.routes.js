const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");
//const { updateEstadoMensualidad } = require("../utils/updateEstadoMensualidad");
const { sendPaymentMail } = require("../utils/mailer");
const {
  updateEstadoMensualidad,
  updateEstadoServicio,
  updateEstadoGasto
} = require("../utils/updateEstado");
// Registrar movimiento
router.post("/payment-concepts/:tipo/:conceptId/movements", async (req, res) => {
  try {

    const { tipo, conceptId } = req.params;
    const id = Number(conceptId);

    const {
      paid = 0,
      discount = 0,
      note = null,
      responsible = null,
      dateISO,
      metodo_pago = "EFECTIVO"
    } = req.body;

    /* ================= VALIDACIÓN TIPO ================= */

    if (!["MENSUALIDAD", "SERVICIO", "GASTO_OCASIONAL"].includes(tipo)) {
      return apiError(res, "VALIDATION_ERROR", "Tipo inválido");
    }

    if (paid < 0 || discount < 0) {
      return apiError(res, "VALIDATION_ERROR", "Montos inválidos");
    }

    /* ================= TABLA SEGÚN TIPO ================= */

    let table;

    if (tipo === "MENSUALIDAD") {
      table = "mensualidades";
    } 
    else if (tipo === "SERVICIO") {
      table = "estudiante_servicio";
    } 
    else {
      table = "gastos_ocacionales";
    }

    /* ================= OBTENER CONCEPTO ================= */

    const [[concept]] = await pool.query(
      `SELECT total, estado FROM ${table} WHERE id = ?`,
      [id]
    );

    if (!concept) {
      return apiError(res, "NOT_FOUND", "Concepto no encontrado");
    }

    if (concept.estado === "PAGADO" || concept.estado === "EVENTO_PAGADO") {
      return apiError(res, "CONFLICT", "El concepto ya está pagado");
    }

    /* ================= CALCULAR PAGOS PREVIOS ================= */

    const [[sum]] = await pool.query(
      `SELECT COALESCE(SUM(monto + descuento),0) AS total
       FROM pagos
       WHERE tipo = ? AND referencia_id = ? AND reversed = 0`,
      [tipo, id]
    );

    const pendienteActual = concept.total - sum.total;
    const aplicando = paid + discount;

    if (aplicando > pendienteActual) {
      return apiError(res, "BUSINESS_RULE", "El pago supera el pendiente");
    }

    const fecha = dateISO || new Date().toISOString().slice(0, 10);

    /* ================= REGISTRAR PAGO ================= */

    const [result] = await pool.query(
      `INSERT INTO pagos 
        (tipo, referencia_id, fecha, monto, descuento, nota, responsable, metodo_pago)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, id, fecha, paid, discount, note, responsible, metodo_pago]
    );

    /* ================= REGISTRAR MOVIMIENTO ================= */

    if (paid > 0) {
      await pool.query(
        `INSERT INTO movimientos (tipo, concepto, monto, encargado)
         VALUES ('INGRESO', ?, ?, ?)`,
        [
          `Pago ${tipo} ID ${id}`,
          paid,
          responsible || "Sistema"
        ]
      );
    }

    /* ================= ACTUALIZAR ESTADO ================= */

    let newPending;

    if (tipo === "MENSUALIDAD") {
      newPending = await updateEstadoMensualidad(id);
    } 
    else if (tipo === "SERVICIO") {
      newPending = await updateEstadoServicio(id);
    }
    else {
      newPending = await updateEstadoGasto(id);
    }

    /* ================= OBTENER INFO PARA CORREO ================= */

    let info = null;

    if (tipo === "MENSUALIDAD") {

      const [[data]] = await pool.query(
        `SELECT 
            t.correo AS email,
            t.nombre AS tutor,
            e.nombre AS student
         FROM mensualidades m
         JOIN estudiantes e ON e.id = m.estudiante_id
         JOIN tutores t ON t.id = e.tutor_id
         WHERE m.id = ?`,
        [id]
      );

      info = data;

    } 
    else if (tipo === "SERVICIO") {

      const [[data]] = await pool.query(
        `SELECT 
            t.correo AS email,
            t.nombre AS tutor,
            e.nombre AS student,
            s.nombre AS serviceName
         FROM estudiante_servicio es
         JOIN estudiantes e ON e.id = es.estudiante_id
         JOIN tutores t ON t.id = e.tutor_id
         JOIN servicios s ON s.id = es.servicio_id
         WHERE es.id = ?`,
        [id]
      );

      info = data;

    }

    const conceptLabel =
      tipo === "SERVICIO"
        ? `Servicio - ${info?.serviceName || ""}`
        : tipo === "GASTO_OCASIONAL"
        ? "Gasto ocasional"
        : "Mensualidad";

    /* ================= ENVÍO DE CORREO ================= */

    try {

      if (info?.email) {

        await sendPaymentMail(info.email, {
          student: info.student,
          concept: conceptLabel,
          paid,
          discount
        });

      }

    } catch (mailError) {

      console.error("Error enviando correo:", mailError.message);

    }

    /* ================= RESPUESTA ================= */

    res.json({
      movementId: result.insertId,
      conceptId: id,
      newPending
    });

  } catch (error) {

    console.error(error);

    apiError(res, "BUSINESS_RULE", "No se pudo registrar el pago");

  }
});

router.post("/movements/:movementId/reversal", async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { movementId } = req.params;
    const { reason = null, responsible = null } = req.body;

    await conn.beginTransaction();

    const [[movement]] = await conn.query(
      `SELECT * FROM pagos WHERE id = ?`,
      [movementId]
    );

    if (!movement) {
      await conn.rollback();
      return apiError(res, "NOT_FOUND", "Movimiento no existe");
    }

    if (movement.reversed) {
      await conn.rollback();
      return apiError(res, "CONFLICT", "El movimiento ya fue revertido");
    }

    const fecha = new Date().toISOString().slice(0, 10);

    const [result] = await conn.query(
      `INSERT INTO pagos
        (tipo, referencia_id, fecha, monto, descuento, nota, responsable, reversed)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        movement.tipo,
        movement.referencia_id,
        fecha,
        -movement.monto,
        -movement.descuento,
        reason || "REVERSAL",
        responsible
      ]
    );

    await conn.query(
      `UPDATE pagos SET reversed = 1 WHERE id = ?`,
      [movementId]
    );

    if (movement.monto > 0) {
      await conn.query(
        `INSERT INTO movimientos (tipo, concepto, monto, encargado)
         VALUES ('GASTO', ?, ?, ?)`,
        [
          `Reverso ${movement.tipo} ID ${movement.referencia_id}`,
          movement.monto,
          responsible || "Sistema"
        ]
      );
    }

    let newPending;

    if (movement.tipo === "MENSUALIDAD") {
      newPending = await updateEstadoMensualidad(movement.referencia_id);
    } else {
      newPending = await updateEstadoServicio(movement.referencia_id);
    }

    await conn.commit();

    res.json({
      ok: true,
      reversalMovementId: result.insertId,
      newPending
    });

  } catch (error) {
    await conn.rollback();
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo revertir");
  } finally {
    conn.release();
  }
});

router.post("/gasto-salida", async (req, res) => {
  try {

    const { encargado, concepto, monto, metodo_pago } = req.body;

    /* ================= VALIDACIONES ================= */

    if (!encargado || !concepto || !monto) {
      return res.status(400).json({
        message: "Encargado, concepto y monto son obligatorios"
      });
    }

    if (monto <= 0) {
      return res.status(400).json({
        message: "El monto debe ser mayor a 0"
      });
    }

    if (metodo_pago && !["EFECTIVO", "QR"].includes(metodo_pago)) {
      return res.status(400).json({
        message: "Método de pago inválido (EFECTIVO o QR)"
      });
    }

    /* ================= INSERT ================= */

    await pool.query(
      `
      INSERT INTO movimientos (tipo, concepto, monto, encargado, metodo_pago)
      VALUES ('GASTO', ?, ?, ?, ?)
      `,
      [
        concepto,
        monto,
        encargado,
        metodo_pago || null
      ]
    );

    res.json({
      message: "Gasto registrado correctamente"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error registrando gasto"
    });

  }
});


module.exports = router;

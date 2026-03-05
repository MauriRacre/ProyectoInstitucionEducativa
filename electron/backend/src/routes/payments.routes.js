const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");

router.get("/view/:tutorId", async (req, res) => {
  try {
    const { tutorId } = req.params;
    const [tutores] = await pool.query(
      `SELECT id, nombre AS name, telefono AS phone, correo AS email
       FROM tutores
       WHERE id = ?`,
      [tutorId]
    );

    if (tutores.length === 0) {
      return apiError(res, "NOT_FOUND", "Tutor no encontrado");
    }

    const tutor = tutores[0];
    const [students] = await pool.query(
      `SELECT id, nombre AS name, grado AS grade, paralelo AS parallel
       FROM estudiantes
       WHERE tutor_id = ?`,
      [tutorId]
    );
    const [mensualidades] = await pool.query(
      `SELECT *
       FROM mensualidades
       WHERE estudiante_id IN (
         SELECT id FROM estudiantes WHERE tutor_id = ?
       )`,
      [tutorId]
    );
    const [extraServices] = await pool.query(
      `
      SELECT 
        es.id,
        es.estudiante_id,
        es.mes,
        es.anio,
        es.total,
        s.nombre AS servicio_nombre
      FROM estudiante_servicio es
      JOIN servicios s ON s.id = es.servicio_id
      WHERE es.estudiante_id IN (
        SELECT id FROM estudiantes WHERE tutor_id = ?
      )
      `,
      [tutorId]
    );
    const [payments] = await pool.query(
      `
      SELECT *
      FROM pagos
      WHERE 
      (
        tipo = 'MENSUALIDAD'
        AND referencia_id IN (
          SELECT id FROM mensualidades
          WHERE estudiante_id IN (
            SELECT id FROM estudiantes WHERE tutor_id = ?
          )
        )
      )
      OR
      (
        tipo = 'SERVICIO'
        AND referencia_id IN (
          SELECT id FROM estudiante_servicio
          WHERE estudiante_id IN (
            SELECT id FROM estudiantes WHERE tutor_id = ?
          )
        )
      )
      `,
      [tutorId, tutorId]
    );
    const paymentsByChild = {};

    for (const student of students) {
      paymentsByChild[student.id] = [];
    }
    for (const m of mensualidades) {

      const history = payments
        .filter(p => 
          p.referencia_id === m.id &&
          p.referencia_tipo === "MENSUALIDAD"
        )
        .map(p => ({
          id: p.id,
          dateISO: p.fecha,
          type: p.tipo || "PAYMENT",
          conceptLabel: "Pago mensualidad",
          paid: p.monto,
          discount: p.descuento || 0,
          appliedTotal: p.monto + (p.descuento || 0),
          note: p.nota || null,
          reversed: false
        }));

      paymentsByChild[m.estudiante_id].push({
        id: m.id,
        studentId: m.estudiante_id,
        categoryId: 1,
        categoryName: "MENSUALIDAD",
        concept: `Mensualidad ${m.mes}/${m.anio}`,
        period: { year: m.anio, month: m.mes },
        amountTotal: m.monto,
        pending: m.monto - history.reduce((a, b) => a + b.appliedTotal, 0),
        history
      });
    }
    for (const s of extraServices) {

      const history = payments
        .filter(p => 
          p.referencia_id === s.id &&
          p.referencia_tipo === "SERVICIO"
        )
        .map(p => ({
          id: p.id,
          dateISO: p.fecha,
          type: p.tipo || "PAYMENT",
          conceptLabel: "Pago servicio",
          paid: p.monto,
          discount: p.descuento || 0,
          appliedTotal: p.monto + (p.descuento || 0),
          note: p.nota || null,
          reversed: false
        }));

      paymentsByChild[s.estudiante_id].push({
        id: s.id,
        studentId: s.estudiante_id,
        categoryId: 2,
        categoryName: "SERVICIO",
        concept: `Servicio ${s.servicio_nombre} ${s.mes}/${s.anio}`,
        period: { year: s.anio, month: s.mes },
        amountTotal: s.total,
        pending: s.total - history.reduce((a, b) => a + b.appliedTotal, 0),
        history
      });
    }
    res.json({
      tutor,
      children: students,
      paymentsByChild
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error al obtener datos de pago");
  }
});


module.exports = router;

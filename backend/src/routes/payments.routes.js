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
    const [concepts] = await pool.query(
      `SELECT *
       FROM mensualidades
       WHERE estudiante_id IN (
         SELECT id FROM estudiantes WHERE tutor_id = ?
       )`,
      [tutorId]
    );
    const [payments] = await pool.query(
      `SELECT *
       FROM pagos
       WHERE mensualidad_id IN (
         SELECT id FROM mensualidades
         WHERE estudiante_id IN (
           SELECT id FROM estudiantes WHERE tutor_id = ?
         )
       )`,
      [tutorId]
    );

    const paymentsByChild = {};

    for (const student of students) {
      paymentsByChild[student.id] = [];
    }

    for (const c of concepts) {
      const history = payments
        .filter(p => p.mensualidad_id === c.id)
        .map(p => ({
          id: p.id,
          dateISO: p.fecha,
          type: p.tipo || "PAYMENT",
          conceptLabel: "Pago registrado",
          paid: p.monto,
          discount: 0,
          appliedTotal: p.monto,
          note: p.nota || null,
          reversed: false
        }));

      paymentsByChild[c.estudiante_id].push({
        id: c.id,
        studentId: c.estudiante_id,
        categoryId: 1,
        concept: `Mensualidad ${c.mes}/${c.anio}`,
        period: { year: c.anio, month: c.mes },
        amountTotal: c.monto,
        pending: c.monto - history.reduce((a, b) => a + b.appliedTotal, 0),
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

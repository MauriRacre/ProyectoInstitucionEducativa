const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

// Listar estudiantes por tutor
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM estudiantes WHERE tutor_id = ?',
      [tutorId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.get("/", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT 
      id,
      tutor_id AS tutorId,
      nombre AS name,
      grado AS grade,
      paralelo AS parallel
    FROM estudiantes
  `);

  res.json(rows);
});

router.get("/:studentId/payment-concepts", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, includeHistory } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }

    // =============================
    // verificar estudiante
    // =============================
    const [[student]] = await pool.query(
      `SELECT id FROM estudiantes WHERE id = ?`,
      [studentId]
    );

    if (!student) {
      return apiError(res, "NOT_FOUND", "Alumno no encontrado");
    }

    // =============================
    // conceptos
    // =============================
    const [concepts] = await pool.query(
      `SELECT id, mes, anio, monto
       FROM mensualidades
       WHERE estudiante_id = ? AND anio = ?`,
      [studentId, year]
    );

    const items = [];

    for (const c of concepts) {

      // =============================
      // pagos aplicados
      // =============================
      const [[sum]] = await pool.query(
        `SELECT COALESCE(SUM(monto + descuento),0) AS total
         FROM pagos
         WHERE mensualidad_id = ?`,
        [c.id]
      );

      const pending = c.monto - sum.total;

      let history = [];
      if (includeHistory === "true") {
        const [rows] = await pool.query(
          `SELECT id, fecha, monto, descuento, nota, responsable
           FROM pagos
           WHERE mensualidad_id = ?`,
          [c.id]
        );

        history = rows.map(r => ({
          id: r.id,
          dateISO: r.fecha,
          type: "PAYMENT",
          conceptLabel: `Mensualidad ${c.mes}/${c.anio}`,
          paid: r.monto,
          discount: r.descuento,
          appliedTotal: r.monto + r.descuento,
          note: r.nota,
          staff: r.responsable,
          movementId: r.id,
          reversed: false
        }));
      }

      items.push({
        id: c.id,
        studentId: studentId,
        categoryId: "MONTHLY",
        concept: `Mensualidad ${c.mes}/${c.anio}`,
        period: { year: c.anio, month: c.mes },
        amountTotal: c.monto,
        pending,
        history
      });
    }

    res.json({ items });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo conceptos");
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, grado, paralelo, tutor_id } = req.body;

    const [result] = await pool.query(
      "INSERT INTO estudiantes (nombre, grado, paralelo, tutor_id) VALUES (?, ?, ?, ?)",
      [nombre, grado, paralelo, tutor_id]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;

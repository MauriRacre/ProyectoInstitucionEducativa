const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");


// Obtener todos los tutores
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.id,
        t.nombre AS name,
        t.correo AS email,
        t.telefono AS phone,
        COALESCE(SUM(
          CASE WHEN m.estado = 'PENDIENTE' THEN m.monto ELSE 0 END
        ), 0) AS balance
      FROM tutores t
      LEFT JOIN estudiantes e ON e.tutor_id = t.id
      LEFT JOIN mensualidades m ON m.estudiante_id = e.id
      GROUP BY t.id
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "Error al obtener tutores");
  }
});


router.get("/:id/full", async (req, res) => {
  try {
    const tutorId = req.params.id;
    const [tutores] = await pool.query(
      `SELECT id, nombre AS name, correo AS email, telefono AS phone
       FROM tutores
       WHERE id = ?`,
      [tutorId]
    );

    if (tutores.length === 0) {
      return apiError(res, "NOT_FOUND", "Tutor no encontrado", null, 404);
    }

    const tutor = tutores[0];
    const [students] = await pool.query(
      `
      SELECT 
        e.id,
        e.nombre AS name,
        e.grado AS grade,
        e.paralelo AS parallel,
        COALESCE(SUM(
          CASE WHEN m.estado = 'PENDIENTE' THEN m.monto ELSE 0 END
        ), 0) AS balance
      FROM estudiantes e
      LEFT JOIN mensualidades m ON m.estudiante_id = e.id
      WHERE e.tutor_id = ?
      GROUP BY e.id
      `,
      [tutorId]
    );
    const totalBalance = students.reduce(
      (acc, s) => acc + Number(s.balance),
      0
    );

    res.json({
      ...tutor,
      balance: totalBalance,
      students,
    });

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "Error al obtener información");
  }
});


router.post("/", async (req, res) => {
  try {
    const { parent, students } = req.body;

    // validar básicos
    if (!parent?.name || !parent?.phone) {
      return apiError(res, "VALIDATION_ERROR", "Nombre y teléfono son requeridos");
    }

    const [resultTutor] = await pool.query(
      `INSERT INTO tutores (nombre, correo, telefono)
       VALUES (?, ?, ?)`,
      [parent.name, parent.email || null, parent.phone]
    );

    const tutorId = resultTutor.insertId;

    for (const st of students) {
      await pool.query(
        `INSERT INTO estudiantes (tutor_id, nombre, grado, paralelo)
         VALUES (?, ?, ?, ?)`,
        [tutorId, st.name, st.grade, st.parallel]
      );
    }

    res.json({ ok: true, id: tutorId });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo registrar el tutor");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const tutorId = req.params.id;
    const { parent, students } = req.body;
    await pool.query(
      `UPDATE tutores
       SET nombre = ?, correo = ?, telefono = ?
       WHERE id = ?`,
      [parent.name, parent.email || null, parent.phone, tutorId]
    );
    for (const st of students) {
      if (st.id) {
        await pool.query(
          `UPDATE estudiantes
           SET nombre = ?, grado = ?, paralelo = ?
           WHERE id = ?`,
          [st.name, st.grade, st.parallel, st.id]
        );
      } else {
        await pool.query(
          `INSERT INTO estudiantes (tutor_id, nombre, grado, paralelo)
           VALUES (?, ?, ?, ?)`,
          [tutorId, st.name, st.grade, st.parallel]
        );
      }
    }

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo actualizar");
  }
});


module.exports = router;


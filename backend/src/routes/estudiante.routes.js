const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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


// Crear estudiante
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

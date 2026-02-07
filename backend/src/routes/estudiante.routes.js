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

// Crear estudiante
router.post('/', async (req, res) => {
  try {
    const { tutor_id, nombre, grado } = req.body;

    const [result] = await pool.query(
      'INSERT INTO estudiantes (tutor_id, nombre, grado) VALUES (?, ?, ?)',
      [tutor_id, nombre, grado]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;

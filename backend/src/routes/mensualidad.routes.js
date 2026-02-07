const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Listar mensualidades de un estudiante
router.get('/estudiante/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM mensualidades WHERE estudiante_id = ?',
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

// Crear mensualidad
router.post('/', async (req, res) => {
  try {
    const { estudiante_id, mes, anio, monto } = req.body;

    const [result] = await pool.query(
      `INSERT INTO mensualidades (estudiante_id, mes, anio, monto)
       VALUES (?, ?, ?, ?)`,
      [estudiante_id, mes, anio, monto]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.get('/deudores', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.nombre AS estudiante,
        m.mes,
        m.anio,
        m.monto
      FROM mensualidades m
      JOIN estudiantes e ON e.id = m.estudiante_id
      WHERE m.estado = 'PENDIENTE'
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;

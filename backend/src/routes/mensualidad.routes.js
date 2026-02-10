const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

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
    
  const { estudiante_id, period, monto } = req.body;

  if (!period) {
    return apiError(res, "VALIDATION_ERROR", "Periodo requerido");
  }

  const { year, month } = period;

  if (!year || year < 2026) {
    return apiError(res, "VALIDATION_ERROR", "Año inválido", {
      year: "Debe ser mayor o igual a 2026"
    });
  }

  if (month < 1 || month > 12) {
    return apiError(
      res,
      "VALIDATION_ERROR",
      "Mes inválido",
      { month: "Debe estar entre 1 y 12" }
    );
  } 
    const [result] = await pool.query(
      `INSERT INTO mensualidades (estudiante_id, mes, anio, monto)
       VALUES (?, ?, ?, ?)`,
      [estudiante_id, month, year, monto]
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

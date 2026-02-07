const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Obtener todos los tutores
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tutores');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});


router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, direccion } = req.body;

    const [result] = await pool.query(
      'INSERT INTO tutores(nombre, telefono, direccion) VALUES (?, ?, ?)',
      [nombre, telefono, direccion]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;


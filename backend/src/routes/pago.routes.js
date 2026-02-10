const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
  try {
    const { mensualidad_id, monto_pagado } = req.body;

    // guardar pago
    await pool.query(
      'INSERT INTO pagos (mensualidad_id, monto_pagado) VALUES (?, ?)',
      [mensualidad_id, monto_pagado]
    );

    // cambiar estado
    await pool.query(
      'UPDATE mensualidades SET estado = "PAGADO" WHERE id = ?',
      [mensualidad_id]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;

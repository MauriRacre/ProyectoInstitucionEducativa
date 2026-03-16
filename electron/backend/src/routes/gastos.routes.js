const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
  try {

    const {
      estudiante_id = null,
      concepto,
      descripcion = null,
      fecha,
      base_amount,
      extra_amount = 0,
      discount_amount = 0,
      encargado = null
    } = req.body;

    const total = base_amount + extra_amount - discount_amount;

    const [result] = await pool.query(
      `INSERT INTO gastos_ocacionales
      (estudiante_id, concepto, descripcion, fecha, base_amount, extra_amount, discount_amount, total, encargado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        estudiante_id,
        concepto,
        descripcion,
        fecha,
        base_amount,
        extra_amount,
        discount_amount,
        total,
        encargado
      ]
    );

    res.json({
      ok: true,
      id: result.insertId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      ok: false
    });

  }
});

module.exports = router;
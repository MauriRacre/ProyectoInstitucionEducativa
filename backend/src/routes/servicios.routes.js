const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

router.post('/', async (req, res) => {
  try {

    const {
      estudiante_id,
      servicio_id,
      period,
      base_amount,
      extra_amount = 0,
      discount_amount = 0
    } = req.body;

    if (!estudiante_id || !servicio_id || !period) {
      return apiError(res, "VALIDATION_ERROR", "Datos incompletos");
    }

    const { year, month } = period;

    if (!year || year < 2026) {
      return apiError(res, "VALIDATION_ERROR", "Año inválido");
    }

    if (month && (month < 1 || month > 12)) {
      return apiError(res, "VALIDATION_ERROR", "Mes inválido");
    }

    if (discount_amount < 0) {
      return apiError(res, "VALIDATION_ERROR", "Descuento inválido");
    }

    if (discount_amount > (base_amount + extra_amount)) {
      return apiError(res, "VALIDATION_ERROR", "Descuento mayor al monto");
    }

    const total = base_amount + extra_amount - discount_amount;

    const [result] = await pool.query(
      `INSERT INTO estudiante_servicio
        (estudiante_id, servicio_id, mes, anio,
         base_amount, extra_amount, discount_amount, total, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [
        estudiante_id,
        servicio_id,
        month || null,
        year,
        base_amount,
        extra_amount,
        discount_amount,
        total
      ]
    );

    res.status(201).json({ id: result.insertId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.delete('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    // Verificar si tiene pagos
    const [[payment]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM pagos_servicio
       WHERE estudiante_servicio_id = ?`,
      [id]
    );

    if (payment.total > 0) {
      return apiError(
        res,
        "BUSINESS_RULE",
        "No se puede eliminar, el servicio tiene pagos registrados"
      );
    }

    await pool.query(
      `DELETE FROM estudiante_servicio WHERE id = ?`,
      [id]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {

    const { studentId } = req.params;
    const { year } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }

    const [rows] = await pool.query(
      `SELECT 
        es.id,
        s.nombre,
        es.mes,
        es.anio,
        es.base_amount,
        es.extra_amount,
        es.discount_amount,
        es.total,
        es.estado
      FROM estudiante_servicio es
      JOIN servicios s ON s.id = es.servicio_id
      WHERE es.estudiante_id = ? AND es.anio = ?`,
      [studentId, year]
    );

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});
module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

// Listar mensualidades de un estudiante
router.post('/', async (req, res) => {
  try {

    const { 
      estudiante_id, 
      period, 
      base_amount = 490, 
      extra_amount = 0, 
      discount_amount = 0,
      tipo,
      nombre_servicio = null
    } = req.body;

    if (!period) {
      return apiError(res, "VALIDATION_ERROR", "Periodo requerido");
    }

    const { year, month } = period;

    if (!year || year < 2026) {
      return apiError(res, "VALIDATION_ERROR", "Año inválido");
    }

    if (month < 1 || month > 12) {
      return apiError(res, "VALIDATION_ERROR", "Mes inválido");
    }

    if (tipo === "SERVICIO" && !nombre_servicio) {
      return apiError(res, "VALIDATION_ERROR", "Nombre del servicio requerido");
    }

    // ✅ Validación descuento
    if (discount_amount < 0) {
      return apiError(res, "VALIDATION_ERROR", "Descuento inválido");
    }

    if (discount_amount > (base_amount + extra_amount)) {
      return apiError(res, "VALIDATION_ERROR", "El descuento no puede ser mayor al monto");
    }

    const total = base_amount + extra_amount - discount_amount;

    const [result] = await pool.query(
      `INSERT INTO mensualidades 
        (estudiante_id, mes, anio, base_amount, extra_amount, discount_amount, total, tipo, nombre_servicio, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [
        estudiante_id,
        month,
        year,
        base_amount,
        extra_amount,
        discount_amount,
        total,
        tipo,
        tipo === "SERVICIO" ? nombre_servicio : null
      ]
    );

    res.status(201).json({ id: result.insertId });

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
        m.total,
        m.tipo,
        CASE 
          WHEN m.tipo = 'SERVICIO' THEN m.nombre_servicio
          ELSE 'Mensualidad'
        END AS concepto
      FROM mensualidades m
      JOIN estudiantes e ON e.id = m.estudiante_id
      WHERE m.estado = 'PENDIENTE'
      ORDER BY m.anio ASC, m.mes ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.get("/morosidad", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return apiError(res, "VALIDATION_ERROR", "Mes y año requeridos");
    }

    const [[result]] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'PAGADO' THEN 1 ELSE 0 END) AS pagados,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes
      FROM mensualidades
      WHERE mes = ? AND anio = ?
    `, [month, year]);

    const total = result.total || 0;
    const pendientes = result.pendientes || 0;

    const porcentaje = total > 0 
      ? Number(((pendientes / total) * 100).toFixed(2))
      : 0;

    res.json({
      total,
      pagados: result.pagados || 0,
      pendientes,
      porcentaje_morosidad: porcentaje
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo morosidad" });
  }
});

module.exports = router;

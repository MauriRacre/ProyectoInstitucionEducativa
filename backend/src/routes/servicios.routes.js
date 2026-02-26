const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

//inscirbir - crear una mensualidad para algun servicio
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

//desinscribir a un estudiante
router.patch("/:id/desuscribir", async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    const [[registro]] = await conn.query(
      `
      SELECT * 
      FROM estudiante_servicio
      WHERE id = ?
      `,
      [id]
    );

    if (!registro) {
      await conn.rollback();
      return apiError(res, "NOT_FOUND", "Registro no encontrado");
    }

    if (registro.estado === "CANCELADO") {
      await conn.rollback();
      return apiError(res, "CONFLICT", "El alumno ya está desinscrito");
    }

    if (registro.estado === "PAGADO") {
      await conn.rollback();
      return apiError(
        res,
        "BUSINESS_RULE",
        "No se puede desinscribir porque ya está pagado"
      );
    }

    await conn.query(
      `
      UPDATE estudiante_servicio
      SET estado = 'CANCELADO'
      WHERE id = ?
      `,
      [id]
    );

    await conn.commit();

    res.json({
      ok: true,
      message: "Alumno desinscrito correctamente"
    });

  } catch (error) {
    await conn.rollback();
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error desinscribiendo alumno");
  } finally {
    conn.release();
  }
});

//deuda por estudiante
router.get('/estudiante/:studentId', async (req, res) => {
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

//total inscritos por curso extra
router.get("/total-inscritos", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return apiError(res, "VALIDATION_ERROR", "Mes y año son requeridos");
    }

    const [rows] = await pool.query(
      `
      SELECT 
        s.nombre AS curso,
        COUNT(es.id) AS total
      FROM estudiante_servicio es
      JOIN servicios s ON s.id = es.servicio_id
      WHERE es.mes = ?
        AND es.anio = ?
        AND s.activo = 1
      GROUP BY s.id, s.nombre
      ORDER BY s.nombre ASC
      `,
      [month, year]
    );

    res.json(rows);

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo inscritos por curso");
  }
});

//ingresos por curso
router.get("/ingresos-curso", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return apiError(res, "VALIDATION_ERROR", "Mes y año son requeridos");
    }

    const [rows] = await pool.query(
      `
      SELECT 
        s.nombre AS curso,
        COALESCE(SUM(p.monto + p.descuento), 0) AS total
      FROM pagos p
      JOIN mensualidades m ON m.id = p.referencia_id
      JOIN estudiante_servicio es ON es.id = m.estudiante_id
      JOIN servicios s ON s.id = es.servicio_id
      WHERE es.mes = ?
        AND es.anio = ?
        AND p.reversed = 0
      GROUP BY s.id, s.nombre
      ORDER BY s.nombre ASC
      `,
      [month, year]
    );

    res.json(rows);

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo ingresos por curso");
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");


//Reporte de ingresos de las mensualidades 
router.get("/mensualidad", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return apiError(res, "VALIDATION_ERROR", "Mes y año son requeridos");
    }

    const [[totalMensualidades]] = await pool.query(
      `
      SELECT COALESCE(SUM(total),0) AS total
      FROM mensualidades
      WHERE mes = ?
        AND anio = ?
      `,
      [month, year]
    );

    const [[totalPagado]] = await pool.query(
      `
      SELECT COALESCE(SUM(p.monto + p.descuento),0) AS total
      FROM pagos p
      JOIN mensualidades m ON m.id = p.referencia_id
      WHERE m.mes = ?
        AND m.anio = ?
        AND p.reversed = 0
      `,
      [month, year]
    );

    const pagado = Number(totalPagado.total);
    const pendiente = Number(totalMensualidades.total) - pagado;

    res.json({
      pagado,
      pendiente
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo resumen de pagos");
  }
});

//Reporte de ingresos de los servicios 
router.get("/servicios", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return apiError(res, "VALIDATION_ERROR", "Mes y año son requeridos");
    }

    const [[totalMensualidades]] = await pool.query(
      `
      SELECT COALESCE(SUM(total),0) AS total
      FROM estudiante_servicio
      WHERE mes = ?
        AND anio = ?
      `,
      [month, year]
    );

    const [[totalPagado]] = await pool.query(
      `
      SELECT COALESCE(SUM(p.monto + p.descuento),0) AS total
      FROM pagos p
      JOIN estudiante_servicio e ON e.id = p.referencia_id
      WHERE e.mes = ?
        AND e.anio = ?
        AND p.reversed = 0
      `,
      [month, year]
    );

    const pagado = Number(totalPagado.total);
    const pendiente = Number(totalMensualidades.total) - pagado;

    res.json({
      pagado,
      pendiente
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo resumen de pagos");
  }
});

router.get("/descuentos-general", async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año es requerido");
    }

    const [rows] = await pool.query(
      `
      SELECT 
        m.mes,
        COALESCE(SUM(m.discount_amount), 0) AS total
      FROM mensualidades m
      LEFT JOIN pagos p 
        ON p.referencia_id = m.id
        AND p.reversed = 0
      WHERE m.anio = ?
      GROUP BY m.mes
      `,
      [year]
    );

    const meses = {
      1: "Enero",
      2: "Febrero",
      3: "Marzo",
      4: "Abril",
      5: "Mayo",
      6: "Junio",
      7: "Julio",
      8: "Agosto",
      9: "Septiembre",
      10: "Octubre",
      11: "Noviembre",
      12: "Diciembre"
    };

    const result = {};

    // Inicializar todos en 0
    Object.values(meses).forEach(nombre => {
      result[nombre] = 0;
    });

    rows.forEach(r => {
      result[meses[r.mes]] = Number(r.total);
    });

    res.json(result);

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo descuentos del año");
  }
});

router.get("/descuentos-mes", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return apiError(res, "VALIDATION_ERROR", "Mes y año son requeridos");
    }

    const [[result]] = await pool.query(
      `
      SELECT COALESCE(SUM(m.discount_amount), 0) AS total
      FROM mensualidades m 
      WHERE m.mes = ?
        AND m.anio = ?
      `,
      [month, year]
    );

    res.json({
      month: Number(month),
      year: Number(year),
      total: Number(result.total)
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo descuento del mes");
  }
});
router.get("/descuentos-anual", async (req, res) => {
  try {

    const { year } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }

    const [rows] = await pool.query(`
      SELECT 
        MONTH(fecha) AS mes,
        SUM(descuento) AS total
      FROM pagos
      WHERE YEAR(fecha) = ?
      AND descuento > 0
      AND reversed = 0
      GROUP BY MONTH(fecha)
      ORDER BY mes
    `, [year]);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo descuentos"
    });

  }
});

router.get("/caja/hoy", async (req, res) => {
  try {
    const { date } = req.query;
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_pagos,

        SUM(CASE 
            WHEN metodo_pago = 'EFECTIVO' AND reversed = 0 
            THEN monto 
            ELSE 0 
        END) AS efectivo,

        SUM(CASE 
            WHEN metodo_pago = 'QR' AND reversed = 0 
            THEN monto 
            ELSE 0 
        END) AS qr,

        SUM(CASE 
            WHEN reversed = 0 
            THEN descuento 
            ELSE 0 
        END) AS descuentos,

        SUM(CASE 
            WHEN reversed = 0 
            THEN monto 
            ELSE 0 
        END) AS total

      FROM pagos
      WHERE fecha = ?
    `,[date]);

    res.json(rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo caja del día"
    });

  }
});

router.get("/descuentos-anual", async (req, res) => {
  try {

    const { year } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }

    const [rows] = await pool.query(`
      SELECT 
        MONTH(fecha) AS mes,
        SUM(descuento) AS total
      FROM pagos
      WHERE YEAR(fecha) = ?
      AND descuento > 0
      AND reversed = 0
      GROUP BY MONTH(fecha)
      ORDER BY mes
    `, [year]);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo descuentos"
    });

  }
});

router.get("/caja/total", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_pagos,

        SUM(CASE 
            WHEN metodo_pago = 'EFECTIVO' AND reversed = 0 
            THEN monto 
            ELSE 0 
        END) AS efectivo,

        SUM(CASE 
            WHEN metodo_pago = 'QR' AND reversed = 0 
            THEN monto 
            ELSE 0 
        END) AS qr,

        SUM(CASE 
            WHEN reversed = 0 
            THEN descuento 
            ELSE 0 
        END) AS descuentos,

        SUM(CASE 
            WHEN reversed = 0 
            THEN monto 
            ELSE 0 
        END) AS total

      FROM pagos
      WHERE DATE(fecha)<=CURDATE()
    `);

    res.json(rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo caja del día"
    });

  }
});

router.get("/ingresos-por-curso", async (req, res) => {
  try {

    const { year } = req.query;

    let yearFilter = "";
    const params = [];

    if (year) {
      yearFilter = "AND YEAR(p.fecha) = ?";
      params.push(year);
    }

    const [rows] = await pool.query(`

      SELECT 
        e.grado,
        e.paralelo,
        SUM(p.monto) AS total_ingresos

      FROM pagos p
      JOIN mensualidades m 
        ON p.referencia_id = m.id
        AND p.tipo = 'MENSUALIDAD'
      JOIN estudiantes e 
        ON e.id = m.estudiante_id

      WHERE p.reversed = 0
      ${yearFilter}

      GROUP BY e.grado, e.paralelo

      UNION ALL

      SELECT 
        e.grado,
        e.paralelo,
        SUM(p.monto) AS total_ingresos

      FROM pagos p
      JOIN estudiante_servicio es 
        ON p.referencia_id = es.id
        AND p.tipo IN ('SERVICIO','EVENTO')
      JOIN estudiantes e 
        ON e.id = es.estudiante_id

      WHERE p.reversed = 0
      ${yearFilter}

      GROUP BY e.grado, e.paralelo

      UNION ALL

      SELECT
        e.grado,
        e.paralelo,
        SUM(p.monto) AS total_ingresos

      FROM pagos p
      JOIN gastos_ocacionales g 
        ON p.referencia_id = g.id
        AND p.tipo = 'GASTO_OCASIONAL'
      JOIN estudiantes e 
        ON e.id = g.estudiante_id

      WHERE p.reversed = 0
      ${yearFilter}

      GROUP BY e.grado, e.paralelo

    `, [...params, ...params, ...params]);

    /* ================= AGRUPAR RESULTADO FINAL ================= */

    const result = {};

    rows.forEach(row => {
      const key = `${row.grado}-${row.paralelo}`;

      if (!result[key]) {
        result[key] = {
          grado: row.grado,
          paralelo: row.paralelo,
          total: 0
        };
      }

      result[key].total += Number(row.total_ingresos);
    });

    res.json(Object.values(result));

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo reporte"
    });

  }
});

module.exports = router;
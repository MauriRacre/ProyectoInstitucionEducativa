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

module.exports = router;
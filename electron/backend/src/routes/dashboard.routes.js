const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");


router.get("/stats", async (req, res) => {
  try {

    const [[totalIngresos]] = await pool.query(`
      SELECT IFNULL(SUM(monto - descuento), 0) as total
      FROM pagos
      WHERE reversed = 0
    `);

    const [[ingresosMes]] = await pool.query(`
      SELECT IFNULL(SUM(monto - descuento), 0) as total
      FROM pagos
      WHERE reversed = 0
      AND MONTH(fecha) = MONTH(CURRENT_DATE())
      AND YEAR(fecha) = YEAR(CURRENT_DATE())
    `);

    const [[descuentos]] = await pool.query(`
      SELECT IFNULL(SUM(descuento), 0) as total
      FROM pagos
      WHERE reversed = 0
    `);

    const [[reversiones]] = await pool.query(`
      SELECT COUNT(*) as total
      FROM pagos
      WHERE reversed = 1
    `);

    res.json({
      totalIngresos: totalIngresos.total,
      ingresosMes: ingresosMes.total,
      descuentos: descuentos.total,
      reversiones: reversiones.total
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo estadísticas");
  }
});
module.exports = router;

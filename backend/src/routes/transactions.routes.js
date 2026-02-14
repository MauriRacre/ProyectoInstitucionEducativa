const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");


router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
      `SELECT 
          p.id,
          DATE(p.fecha) AS dateISO,
          TIME(p.fecha) AS time,
          'PAYMENT' AS type,
          p.responsable AS staff,
          t.nombre AS tutor,
          e.nombre AS student,
          e.grado AS grade,
          e.paralelo AS parallel,
          CONCAT('Mensualidad ', m.mes, ' ', m.anio) AS concept,
          p.nota AS note,
          (p.monto + p.descuento) AS amount
       FROM pagos p
       JOIN mensualidades m ON m.id = p.mensualidad_id
       JOIN estudiantes e ON e.id = m.estudiante_id
       JOIN tutores t ON t.id = e.tutor_id
       ORDER BY p.fecha DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pagos`
    );

    res.json({
      items: rows,
      page,
      pageSize,
      total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error obteniendo historial"
    });
  }
});

// filtro para transacciones, muestra los datos de las tranacciones segun quien lo haya hecho, nombre de tutor 
// ejemplos para que lo pruebes GET http://localhost:3000/api/transactions/search?tutor=juan 
// GET http://localhost:3000/api/transactions/search?responsible=caja&tutor=juan
router.get("/search", async (req, res) => {
  try {
    const {
      responsible = "",
      tutor = "",
      type = "ALL",
      from,
      to,
      page = 1,
      pageSize = 10
    } = req.query;

    const offset = (page - 1) * pageSize;

    let where = "WHERE 1=1 ";
    const params = [];

    // responsable
    if (responsible) {
      where += "AND p.responsable LIKE ? ";
      params.push(`%${responsible}%`);
    }

    // tutor
    if (tutor) {
      where += "AND t.nombre LIKE ? ";
      params.push(`%${tutor}%`);
    }

    // fechas
    if (from) {
      where += "AND p.fecha >= ? ";
      params.push(from);
    }

    if (to) {
      where += "AND p.fecha <= ? ";
      params.push(to);
    }

    // tipo
    if (type !== "ALL") {
      if (type === "REVERSAL") {
        where += "AND (p.reversed = 1 OR p.monto < 0) ";
      }
      if (type === "DISCOUNT") {
        where += "AND (p.monto = 0 AND p.descuento > 0) ";
      }
      if (type === "PAYMENT") {
        where += "AND (p.monto > 0 AND p.reversed = 0) ";
      }
    }

    // total
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM pagos p
       JOIN mensualidades m ON m.id = p.mensualidad_id
       JOIN estudiantes e ON e.id = m.estudiante_id
       JOIN tutores t ON t.id = e.tutor_id
       ${where}`,
      params
    );

    // data
    const [rows] = await pool.query(
      `SELECT 
          p.id,
          p.fecha,
          p.responsable,
          t.nombre as tutor,
          e.nombre as student,
          CASE 
            WHEN p.reversed = 1 OR p.monto < 0 THEN 'REVERSAL'
            WHEN p.monto = 0 AND p.descuento > 0 THEN 'DISCOUNT'
            ELSE 'PAYMENT'
          END AS type,
          (p.monto + p.descuento) as amount
       FROM pagos p
       JOIN mensualidades m ON m.id = p.mensualidad_id
       JOIN estudiantes e ON e.id = m.estudiante_id
       JOIN tutores t ON t.id = e.tutor_id
       ${where}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)]
    );

    res.json({
      items: rows,
      page: Number(page),
      pageSize: Number(pageSize),
      total
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo historial");
  }
});


module.exports = router;

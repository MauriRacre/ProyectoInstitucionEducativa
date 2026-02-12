const express = require("express");
const router = express.Router();
const pool = require("../config/db");

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

module.exports = router;

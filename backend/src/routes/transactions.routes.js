const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");


router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const baseQuery = `
      SELECT 
        p.id,
        DATE(p.fecha) AS dateISO,
        TIME(p.fecha) AS time,
        CASE 
          WHEN p.reversed = 1 OR p.monto < 0 THEN 'REVERSAL'
          WHEN p.monto = 0 AND p.descuento > 0 THEN 'DISCOUNT'
          ELSE 'PAYMENT'
        END AS type,
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

      UNION ALL

      SELECT
        mov.id,
        DATE(mov.fecha) AS dateISO,
        TIME(mov.fecha) AS time,
        'EXPENSE' AS type,
        mov.encargado AS staff,
        NULL AS tutor,
        NULL AS student,
        NULL AS grade,
        NULL AS parallel,
        mov.concepto AS concept,
        NULL AS note,
        mov.monto AS amount
      FROM movimientos mov
      WHERE tipo="GASTO"
    `;

    // TOTAL
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as combined`
    );

    // DATA PAGINADA
    const [rows] = await pool.query(
      `
      SELECT * FROM (${baseQuery}) as combined
      ORDER BY dateISO DESC, time DESC
      LIMIT ? OFFSET ?
      `,
      [pageSize, offset]
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
      concept = "",
      from,
      to,
      page = 1,
      pageSize = 10
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);

    let wherePagos = "WHERE 1=1 ";
    let whereMovimientos = "WHERE mov.tipo = 'GASTO' "; 

    const paramsPagos = [];
    const paramsMovimientos = [];

    // =========================
    // RESPONSABLE
    // =========================
    if (responsible) {
      wherePagos += "AND p.responsable LIKE ? ";
      paramsPagos.push(`%${responsible}%`);

      whereMovimientos += "AND mov.encargado LIKE ? ";
      paramsMovimientos.push(`%${responsible}%`);
    }

    // =========================
    // TUTOR (solo pagos)
    // =========================
    if (tutor) {
      wherePagos += "AND t.nombre LIKE ? ";
      paramsPagos.push(`%${tutor}%`);
    }

    // =========================
    // FECHAS
    // =========================
    if (from) {
      wherePagos += "AND DATE(p.fecha) >= ? ";
      paramsPagos.push(from);

      whereMovimientos += "AND DATE(mov.fecha) >= ? ";
      paramsMovimientos.push(from);
    }

    if (to) {
      wherePagos += "AND DATE(p.fecha) <= ? ";
      paramsPagos.push(to);

      whereMovimientos += "AND DATE(mov.fecha) <= ? ";
      paramsMovimientos.push(to);
    }

    // =========================
    // TYPE FILTER
    // =========================
    if (type !== "ALL") {

      if (type === "REVERSAL") {
        wherePagos += "AND (p.reversed = 1 OR p.monto < 0) ";
        whereMovimientos += "AND 1=0 ";
      }

      if (type === "DISCOUNT") {
        wherePagos += "AND (p.monto = 0 AND p.descuento > 0) ";
        whereMovimientos += "AND 1=0 ";
      }

      if (type === "PAYMENT") {
        wherePagos += "AND (p.monto > 0 AND p.reversed = 0) ";
        whereMovimientos += "AND 1=0 ";
      }

      if (type === "EXPENSE") {
        wherePagos += "AND 1=0 ";
        whereMovimientos += "AND mov.tipo = 'GASTO' ";
      }
    }

    // =========================
    // CONCEPT
    // =========================
    if (concept) {
      wherePagos += "AND CONCAT('Mensualidad ', m.mes, ' ', m.anio) = ? ";
      paramsPagos.push(concept);

      whereMovimientos += "AND mov.concepto = ? ";
      paramsMovimientos.push(concept);
    }

    // =========================
    // QUERY UNIFICADA
    // =========================
    const baseQuery = `
      SELECT 
        p.id,
        DATE(p.fecha) AS dateISO,
        TIME(p.fecha) AS time,
        CASE 
          WHEN p.reversed = 1 OR p.monto < 0 THEN 'REVERSAL'
          WHEN p.monto = 0 AND p.descuento > 0 THEN 'DISCOUNT'
          ELSE 'PAYMENT'
        END AS type,
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
      ${wherePagos}

      UNION ALL

      SELECT
        mov.id,
        DATE(mov.fecha) AS dateISO,
        TIME(mov.fecha) AS time,
        'EXPENSE' AS type,
        mov.encargado AS staff,
        NULL AS tutor,
        NULL AS student,
        NULL AS grade,
        NULL AS parallel,
        mov.concepto AS concept,
        NULL AS note,
        mov.monto AS amount
      FROM movimientos mov
      ${whereMovimientos}
    `;

    // =========================
    // TOTAL
    // =========================
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as combined`,
      [...paramsPagos, ...paramsMovimientos]
    );

    // =========================
    // DATA PAGINADA
    // =========================
    const [rows] = await pool.query(
      `
      SELECT * FROM (${baseQuery}) as combined
      ORDER BY dateISO DESC, time DESC
      LIMIT ? OFFSET ?
      `,
      [...paramsPagos, ...paramsMovimientos, Number(pageSize), offset]
    );

    res.json({
      items: rows,
      page: Number(page),
      pageSize: Number(pageSize),
      total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error obteniendo historial"
    });
  }
});


router.get("/balance", async (req, res) => {
  try {
    const [[result]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) -
        SUM(CASE WHEN tipo = 'GASTO' THEN monto ELSE 0 END) 
        AS balance
      FROM movimientos
    `);

    res.json({ balance: result.balance || 0 });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo balance" });
  }
});

router.get("/concepts", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT 
        CONCAT('Mensualidad ', m.mes, ' ', m.anio) AS concept
      FROM pagos p
      JOIN mensualidades m ON m.id = p.mensualidad_id
      ORDER BY concept ASC
    `);

    res.json(rows.map(r => r.concept));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo conceptos" });
  }
});

module.exports = router;

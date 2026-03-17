const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");

router.get("/", async (req, res) => {
  try {

    const {
      page = 1,
      pageSize = 10,
      q = "",
      from,
      to,
      paymentMethod,
      type
    } = req.query;

    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;

    let where = "WHERE 1=1 ";
    const params = [];

    /* ================= BUSCADOR ================= */

    if (q) {
      where += `
        AND (
          tutor LIKE ?
          OR student LIKE ?
          OR staff LIKE ?
          OR concept LIKE ?
        )
      `;
      const value = `%${q}%`;
      params.push(value, value, value, value);
    }

    /* ================= FECHAS ================= */

    if (from) {
      where += " AND dateISO >= ? ";
      params.push(from);
    }

    if (to) {
      where += " AND dateISO <= ? ";
      params.push(to);
    }

    /* ================= METODO PAGO ================= */

    if (paymentMethod) {
      where += " AND paymentMethod = ? ";
      params.push(paymentMethod);
    }

    /* ================= TIPO ================= */

    if (type) {
      where += " AND type = ? ";
      params.push(type);
    }

    /* ================= QUERY BASE ================= */

    const baseQuery = `

    SELECT * FROM (

      /* ================= MENSUALIDADES ================= */

      SELECT 
        p.id,
        DATE(p.fecha) AS dateISO,
        TIME(p.fecha) AS time,
        CASE 
          WHEN p.reversed = 1 OR p.monto < 0 THEN 'REVERSAL'
          WHEN p.monto = 0 AND p.descuento > 0 THEN 'DISCOUNT'
          ELSE 'PAYMENT'
        END AS type,
        p.metodo_pago AS paymentMethod,
        p.responsable AS staff,
        t.nombre AS tutor,
        e.nombre AS student,
        e.grado AS grade,
        e.paralelo AS parallel,
        CONCAT('Mensualidad ', m.mes, ' ', m.anio) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN mensualidades m ON m.id = p.referencia_id
      JOIN estudiantes e ON e.id = m.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id
      WHERE p.tipo = 'MENSUALIDAD'

      UNION ALL

      /* ================= SERVICIOS ================= */

      SELECT 
        p.id,
        DATE(p.fecha) AS dateISO,
        TIME(p.fecha) AS time,
        CASE 
          WHEN p.reversed = 1 OR p.monto < 0 THEN 'REVERSAL'
          WHEN p.monto = 0 AND p.descuento > 0 THEN 'DISCOUNT'
          ELSE 'PAYMENT'
        END AS type,
        p.metodo_pago AS paymentMethod,
        p.responsable AS staff,
        t.nombre AS tutor,
        e.nombre AS student,
        e.grado AS grade,
        e.paralelo AS parallel,
        CONCAT('Servicio ', s.nombre) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN estudiante_servicio es ON es.id = p.referencia_id
      JOIN servicios s ON s.id = es.servicio_id
      JOIN estudiantes e ON e.id = es.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id
      WHERE p.tipo = 'SERVICIO' AND es.evento_id IS NULL

      UNION ALL

      /* ================= EVENTOS ================= */

      SELECT 
        p.id,
        DATE(p.fecha) AS dateISO,
        TIME(p.fecha) AS time,
        CASE 
          WHEN p.reversed = 1 OR p.monto < 0 THEN 'REVERSAL'
          WHEN p.monto = 0 AND p.descuento > 0 THEN 'DISCOUNT'
          ELSE 'PAYMENT'
        END AS type,
        p.metodo_pago AS paymentMethod,
        p.responsable AS staff,
        t.nombre AS tutor,
        e.nombre AS student,
        e.grado AS grade,
        e.paralelo AS parallel,
        CONCAT('Evento ', ev.evento) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN estudiante_servicio es ON es.id = p.referencia_id
      JOIN eventos ev ON ev.id = es.evento_id
      JOIN estudiantes e ON e.id = es.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id
      WHERE p.tipo = 'SERVICIO' AND es.evento_id IS NOT NULL

      UNION ALL

      /* ================= GASTOS OCASIONALES ================= */

      SELECT
        p.id,
        DATE(p.fecha) AS dateISO,
        TIME(p.fecha) AS time,
        CASE 
          WHEN p.reversed = 1 OR p.monto < 0 THEN 'REVERSAL'
          WHEN p.monto = 0 AND p.descuento > 0 THEN 'DISCOUNT'
          ELSE 'PAYMENT'
        END AS type,
        p.metodo_pago AS paymentMethod,
        p.responsable AS staff,
        t.nombre AS tutor,
        e.nombre AS student,
        e.grado AS grade,
        e.paralelo AS parallel,
        CONCAT('Gasto ocasional ', g.concepto) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN gastos_ocacionales g ON g.id = p.referencia_id
      LEFT JOIN estudiantes e ON e.id = g.estudiante_id
      LEFT JOIN tutores t ON t.id = e.tutor_id
      WHERE p.tipo = 'GASTO_OCASIONAL'

      UNION ALL

      /* ================= GASTOS DEL SISTEMA ================= */

      SELECT
        mov.id,
        DATE(mov.fecha) AS dateISO,
        TIME(mov.fecha) AS time,
        'EXPENSE' AS type,
        mov.metodo_pago AS paymentMethod,
        mov.encargado AS staff,
        NULL AS tutor,
        NULL AS student,
        NULL AS grade,
        NULL AS parallel,
        mov.concepto AS concept,
        NULL AS note,
        mov.monto AS amount
      FROM movimientos mov
      WHERE mov.tipo = 'GASTO'

    ) AS combined

    ${where}

    `;

    /* ================= TOTAL ================= */

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) AS sub`,
      params
    );

    /* ================= DATA ================= */

    const [rows] = await pool.query(
      `
      ${baseQuery}
      ORDER BY dateISO DESC, time DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      page: Number(page),
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error obteniendo transacciones"
    });

  }
});

// ingresos mes
router.get("/ingresos-mes", async (req, res) => {
  try {
    const year = Number(req.query.year);

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }
    const months = {
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

    Object.values(months).forEach(m => {
      result[m] = 0;
    });

    const [monthly] = await pool.query(`
      SELECT 
        MONTH(fecha) AS month,
        SUM(monto + descuento) AS total
      FROM pagos  
      WHERE YEAR(fecha) = ?
      GROUP BY MONTH(fecha)
    `, [year]);
    const [services] = await pool.query(`
      SELECT 
        MONTH(fecha) AS month,
        SUM(monto + descuento) AS total
      FROM pagos
      WHERE YEAR(fecha) = ?
      GROUP BY MONTH(fecha)
    `, [year]);
    const mergeData = {};

    for (const row of monthly) {
      mergeData[row.month] = Number(row.total);
    }

    for (const row of services) {
      if (mergeData[row.month]) {
        mergeData[row.month] += Number(row.total);
      } else {
        mergeData[row.month] = Number(row.total);
      }
    }
    for (let i = 1; i <= 12; i++) {
      if (mergeData[i]) {
        result[months[i]] = mergeData[i];
      }
    }

    return res.json(result);

  } catch (error) {
    console.error("ERROR EN income-by-month:", error);
    return apiError(res, "BUSINESS_RULE", "Error obteniendo ingresos por mes");
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
      JOIN mensualidades m ON m.id = p.referencia_id
      ORDER BY concept ASC
    `);

    res.json(rows.map(r => r.concept));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo conceptos" });
  }
});

module.exports = router;

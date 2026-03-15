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
        CONCAT(
          'Mensualidad ',
          CASE m.mes
            WHEN 1 THEN 'enero'
            WHEN 2 THEN 'febrero'
            WHEN 3 THEN 'marzo'
            WHEN 4 THEN 'abril'
            WHEN 5 THEN 'mayo'
            WHEN 6 THEN 'junio'
            WHEN 7 THEN 'julio'
            WHEN 8 THEN 'agosto'
            WHEN 9 THEN 'septiembre'
            WHEN 10 THEN 'octubre'
            WHEN 11 THEN 'noviembre'
            WHEN 12 THEN 'diciembre'
          END,
          ' ',
          m.anio
        ) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN mensualidades m 
          ON m.id = p.referencia_id
          AND p.tipo = 'MENSUALIDAD'
      JOIN estudiantes e ON e.id = m.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id

      UNION ALL

      /* =========================
         PAGOS SERVICIOS
      ==========================*/
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
            CONCAT(
        'Servicio ',
        s.nombre,
        ' ',
        CASE es.mes
          WHEN 1 THEN 'enero'
          WHEN 2 THEN 'febrero'
          WHEN 3 THEN 'marzo'
          WHEN 4 THEN 'abril'
          WHEN 5 THEN 'mayo'
          WHEN 6 THEN 'junio'
          WHEN 7 THEN 'julio'
          WHEN 8 THEN 'agosto'
          WHEN 9 THEN 'septiembre'
          WHEN 10 THEN 'octubre'
          WHEN 11 THEN 'noviembre'
          WHEN 12 THEN 'diciembre'
        END,
        ' ',
        es.anio
      ) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN estudiante_servicio es 
          ON es.id = p.referencia_id
          AND p.tipo = 'SERVICIO'
      JOIN servicios s ON s.id = es.servicio_id
      JOIN estudiantes e ON e.id = es.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id

      UNION ALL

      /* =========================
        PAGOS EVENTOS
      =========================*/
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
        CONCAT(
          'Evento ',
          ev.evento
        ) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN estudiante_servicio es
          ON es.id = p.referencia_id
          AND p.tipo = 'SERVICIO'
      JOIN eventos ev ON ev.id = es.evento_id
      JOIN estudiantes e ON e.id = es.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id
      UNION ALL

      /* =========================
         GASTOS
      ==========================*/
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
      WHERE mov.tipo = "GASTO"
    `;

    /* =========================
       TOTAL
    ==========================*/
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as combined`
    );

    /* =========================
       DATA PAGINADA
    ==========================*/
    const [rows] = await pool.query(
      `
      SELECT * FROM (${baseQuery}) as combined
      ORDER BY dateISO DESC, time DESC
      LIMIT ? OFFSET ?
      `,
      [pageSize, offset]
    );

    res.json({
      data: rows,
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

    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;

    // =========================
    // CONSTRUCCIÓN FILTROS PAGOS
    // =========================
    let wherePagos = "WHERE 1=1 ";
    const paramsPagos = [];

    if (responsible) {
      wherePagos += "AND p.responsable LIKE ? ";
      paramsPagos.push(`%${responsible}%`);
    }

    if (tutor) {
      wherePagos += "AND tutor LIKE ? ";
      paramsPagos.push(`%${tutor}%`);
    }

    if (from) {
      wherePagos += "AND DATE(p.fecha) >= ? ";
      paramsPagos.push(from);
    }

    if (to) {
      wherePagos += "AND DATE(p.fecha) <= ? ";
      paramsPagos.push(to);
    }

    if (type === "PAYMENT") {
      wherePagos += "AND p.monto > 0 AND p.reversed = 0 ";
    }

    if (type === "REVERSAL") {
      wherePagos += "AND (p.reversed = 1 OR p.monto < 0) ";
    }

    if (type === "DISCOUNT") {
      wherePagos += "AND p.monto = 0 AND p.descuento > 0 ";
    }

    if (concept) {
      wherePagos += "AND concept LIKE ? ";
      paramsPagos.push(`%${concept}%`);
    }

    // =========================
    // CONSTRUCCIÓN FILTROS MOVIMIENTOS
    // =========================
    let whereMov = "WHERE mov.tipo = 'GASTO' ";
    const paramsMov = [];

    if (responsible) {
      whereMov += "AND mov.encargado LIKE ? ";
      paramsMov.push(`%${responsible}%`);
    }

    if (from) {
      whereMov += "AND DATE(mov.fecha) >= ? ";
      paramsMov.push(from);
    }

    if (to) {
      whereMov += "AND DATE(mov.fecha) <= ? ";
      paramsMov.push(to);
    }

    if (type === "EXPENSE") {
      // solo gastos
    } else if (type !== "ALL") {
      whereMov += "AND 1=0 ";
    }

    if (concept) {
      whereMov += "AND mov.concepto LIKE ? ";
      paramsMov.push(`%${concept}%`);
    }

    // =========================
    // QUERY UNIFICADA CORRECTA
    // =========================
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
          p.responsable AS staff,
          t.nombre AS tutor,
          e.nombre AS student,
          e.grado AS grade,
          e.paralelo AS parallel,
          CONCAT('Servicio ', s.nombre, ' ', es.mes, ' ', es.anio) AS concept,
          p.nota AS note,
          (p.monto + p.descuento) AS amount
        FROM pagos p
        JOIN estudiante_servicio es ON es.id = p.referencia_id
        JOIN servicios s ON s.id = es.servicio_id
        JOIN estudiantes e ON e.id = es.estudiante_id
        JOIN tutores t ON t.id = e.tutor_id
        WHERE p.tipo = 'SERVICIO'

        UNION ALL

        /* ================= GASTOS ================= */
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
        ${whereMov}

      ) AS combined
      ${wherePagos.replace("WHERE 1=1", "WHERE 1=1")}
    `;

    // =========================
    // TOTAL
    // =========================
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as sub`,
      [...paramsPagos, ...paramsMov]
    );

    // =========================
    // DATA PAGINADA
    // =========================
    const [rows] = await pool.query(
      `
      SELECT * FROM (${baseQuery}) as sub
      ORDER BY dateISO DESC, time DESC
      LIMIT ? OFFSET ?
      `,
      [...paramsPagos, ...paramsMov, limit, offset]
    );

    res.json({
      items: rows,
      page: Number(page),
      pageSize: limit,
      total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error obteniendo historial"
    });
  }
});

router.get("/search-modificado", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type,
      from,
      to
    } = req.query;

    const offset = (page - 1) * limit;

    let whereCombined = "WHERE 1=1 ";
    const params = [];

    /* ================= FILTRO POR TIPO ================= */
    if (type === "PAYMENT") {
      whereCombined += "AND type = 'PAYMENT' ";
    }

    if (type === "REVERSAL") {
      whereCombined += "AND type = 'REVERSAL' ";
    }

    if (type === "DISCOUNT") {
      whereCombined += "AND type = 'DISCOUNT' ";
    }

    if (type === "EXPENSE") {
      whereCombined += "AND type = 'EXPENSE' ";
    }

    /* ================= FILTRO POR FECHA ================= */
    if (from) {
      whereCombined += "AND dateISO >= ? ";
      params.push(from);
    }

    if (to) {
      whereCombined += "AND dateISO <= ? ";
      params.push(to);
    }

    /* ================= BUSCADOR GENERAL ================= */
    if (search) {
      whereCombined += `
        AND (
          tutor LIKE ?
          OR student LIKE ?
          OR staff LIKE ?
          OR concept LIKE ?
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue);
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
          p.responsable AS staff,
          t.nombre AS tutor,
          e.nombre AS student,
          e.grado AS grade,
          e.paralelo AS parallel,
          CONCAT(
            'Mensualidad ',
            CASE m.mes
              WHEN 1 THEN 'enero'
              WHEN 2 THEN 'febrero'
              WHEN 3 THEN 'marzo'
              WHEN 4 THEN 'abril'
              WHEN 5 THEN 'mayo'
              WHEN 6 THEN 'junio'
              WHEN 7 THEN 'julio'
              WHEN 8 THEN 'agosto'
              WHEN 9 THEN 'septiembre'
              WHEN 10 THEN 'octubre'
              WHEN 11 THEN 'noviembre'
              WHEN 12 THEN 'diciembre'
            END,
            ' ',
            m.anio
          ) AS concept,
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
          p.responsable AS staff,
          t.nombre AS tutor,
          e.nombre AS student,
          e.grado AS grade,
          e.paralelo AS parallel,
          CONCAT(
            'Servicio ',
            s.nombre,
            ' ',
            CASE es.mes
              WHEN 1 THEN 'enero'
              WHEN 2 THEN 'febrero'
              WHEN 3 THEN 'marzo'
              WHEN 4 THEN 'abril'
              WHEN 5 THEN 'mayo'
              WHEN 6 THEN 'junio'
              WHEN 7 THEN 'julio'
              WHEN 8 THEN 'agosto'
              WHEN 9 THEN 'septiembre'
              WHEN 10 THEN 'octubre'
              WHEN 11 THEN 'noviembre'
              WHEN 12 THEN 'diciembre'
            END,
            ' ',
            es.anio
          ) AS concept,
          p.nota AS note,
          (p.monto + p.descuento) AS amount
        FROM pagos p
        JOIN estudiante_servicio es ON es.id = p.referencia_id
        JOIN servicios s ON s.id = es.servicio_id
        JOIN estudiantes e ON e.id = es.estudiante_id
        JOIN tutores t ON t.id = e.tutor_id
        WHERE p.tipo = 'SERVICIO'

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
        p.responsable AS staff,
        t.nombre AS tutor,
        e.nombre AS student,
        e.grado AS grade,
        e.paralelo AS parallel,
        CONCAT(
          'Evento ',
          ev.evento
        ) AS concept,
        p.nota AS note,
        (p.monto + p.descuento) AS amount
      FROM pagos p
      JOIN estudiante_servicio es ON es.id = p.referencia_id
      JOIN eventos ev ON ev.id = es.evento_id
      JOIN estudiantes e ON e.id = es.estudiante_id
      JOIN tutores t ON t.id = e.tutor_id
      WHERE p.tipo = 'SERVICIO'
        UNION ALL

        /* ================= GASTOS ================= */
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
        WHERE mov.tipo = 'GASTO'

      ) AS combined
      ${whereCombined}
    `;

    /* ================= TOTAL ================= */
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as sub`,
      params
    );

    const total = totalResult[0].total;

    /* ================= PAGINACIÓN ================= */
    const [rows] = await pool.query(
      `${baseQuery}
       ORDER BY dateISO DESC, time DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
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

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");
// api para total estudiantes
router.get("/total", async (req, res) => {
  try {

    const [[row]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM estudiantes
    `);

    return res.json({
      total: row.total
    });

  } catch (error) {
    console.error("ERROR EN /students/total:", error);
    return apiError(res, "BUSINESS_RULE", "Error obteniendo total de estudiantes");
  }
});
// Listar estudiantes por tutor

router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM estudiantes WHERE tutor_id = ?',
      [tutorId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});
//cuotas creadas
router.get("/cuotas-creadas", async (req, res) => {
  try {
    const { estudiante_id, year } = req.query;

    if (!estudiante_id || !year) {
      return apiError(res, "VALIDATION_ERROR", "estudiante_id y year son requeridos");
    }

    const [rows] = await pool.query(
      `
      SELECT mes
      FROM mensualidades
      WHERE estudiante_id = ?
        AND anio = ?
      ORDER BY mes ASC
      `,
      [estudiante_id, year]
    );

    const mesesPagados = rows.map(r => Number(r.mes));

    res.json({
      estudiante_id: Number(estudiante_id),
      year: Number(year),
      meses_creados: mesesPagados
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo meses pagados");
  }
});


//servicios creados
router.get("/servicios-creados", async (req, res) => {
  try {
    const { estudiante_id, year } = req.query;

    if (!estudiante_id || !year) {
      return apiError(res, "VALIDATION_ERROR", "estudiante_id y year son requeridos");
    }

    const [rows] = await pool.query(
      `
      SELECT 
        e.mes,
        e.servicio_id,
        s.nombre
      FROM estudiante_servicio e
      JOIN servicios s ON e.servicio_id = s.id
      WHERE e.estudiante_id = ?
        AND e.anio = ?
        AND e.estado != "CANCELADO"
      ORDER BY e.mes ASC
      `,
      [estudiante_id, year]
    );

    const serviciosProcesados = rows.map(r => ({
      mes: Number(r.mes),
      servicio_id: r.servicio_id,
      nombre_servicio: r.nombre
    }));

    res.json({
      estudiante_id: Number(estudiante_id),
      year: Number(year),
      servicios_creados: serviciosProcesados
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo servicios creados");
  }
});

router.get("/", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT 
      id,
      tutor_id AS tutorId,
      nombre AS name,
      grado AS grade,
      paralelo AS parallel
    FROM estudiantes
  `);

  res.json(rows);
});

router.get("/:studentId/payment-concepts", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, includeHistory } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }

    // =============================
    // verificar estudiante
    // =============================
    const [[student]] = await pool.query(
      `SELECT id FROM estudiantes WHERE id = ?`,
      [studentId]
    );

    if (!student) {
      return apiError(res, "NOT_FOUND", "Alumno no encontrado");
    }

    // =============================
    // conceptos
    // =============================
    const [concepts] = await pool.query(
      `SELECT id, mes, anio, monto
       FROM mensualidades
       WHERE estudiante_id = ? AND anio = ?`,
      [studentId, year]
    );

    const items = [];

    for (const c of concepts) {

      // =============================
      // pagos aplicados
      // =============================
      const [[sum]] = await pool.query(
        `SELECT COALESCE(SUM(monto + descuento),0) AS total
         FROM pagos
         WHERE referencia_id = ? and reversed=0`,
        [c.id]
      );

      const pending = c.monto - sum.total;

      let history = [];
      if (includeHistory === "true") {
        const [rows] = await pool.query(
          `SELECT id, fecha, monto, descuento, nota, responsable
           FROM pagos
           WHERE referencia_id = ? and nota="Reversión manual"`,
          [c.id]
        );

        history = rows.map(r => ({
          id: r.id,
          dateISO: r.fecha,
          type: "PAYMENT",
          conceptLabel: `Mensualidad ${c.mes}/${c.anio}`,
          paid: r.monto,
          discount: r.descuento,
          appliedTotal: r.monto + r.descuento,
          note: r.nota,
          staff: r.responsable,
          movementId: r.id,
          reversed: false
        }));
      }

      items.push({
        id: c.id,
        studentId: studentId,
        categoryId: "MONTHLY",
        concept: `Mensualidad ${c.mes}/${c.anio}`,
        period: { year: c.anio, month: c.mes },
        amountTotal: c.monto,
        pending,
        history
      });
    }

    res.json({ items });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo conceptos");
  }
});

router.get("/servicios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[student]] = await pool.query(
      `
      SELECT 
        e.id,
        e.nombre,
        e.grado,
        e.paralelo
      FROM estudiantes e
      WHERE e.id = ?
      `,
      [id]
    );

    if (!student) {
      return apiError(res, "NOT_FOUND", "Estudiante no encontrado");
    }

    const [cursos] = await pool.query(
  `
      SELECT 
        es.id AS inscripcion_id,
        s.id AS servicio_id,
        s.nombre,
        es.estado
      FROM estudiante_servicio es
      JOIN servicios s ON s.id = es.servicio_id
      WHERE es.id IN (
          SELECT MAX(id)
          FROM estudiante_servicio
          WHERE estudiante_id = ?
            AND estado != 'CANCELADO'
          GROUP BY servicio_id
      )
      ORDER BY s.nombre ASC
      `,
      [id]
    );

    res.json({
      estudiante: student,
      cursos_extra: cursos
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo cursos del estudiante");
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, grado, paralelo, tutor_id } = req.body;

    const [result] = await pool.query(
      "INSERT INTO estudiantes (nombre, grado, paralelo, tutor_id) VALUES (?, ?, ?, ?)",
      [nombre, grado, paralelo, tutor_id]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});
router.get("/nomina/courses", async(req, res)=>{
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.grado AS grade,
        e.paralelo AS parallel,
        COUNT(*) AS count
      FROM estudiantes e
      GROUP BY e.grado, e.paralelo
      ORDER BY e.grado ASC, e.paralelo ASC
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo cursos");
  }
});
router.get("/nomina", async (req, res) => {
  try {
    const grade = String(req.query.grade || '');
    const parallel = String(req.query.parallel || '');
    const q = String(req.query.q || '');
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    if (!grade || !parallel) {
      return apiError(res, "VALIDATION_ERROR", "grade y parallel son requeridos");
    }

    const offset = (page - 1) * pageSize;
    const search = `%${q}%`;

    let whereSearch = "";
    let searchParams = [];

    if (q.trim() !== "") {
      whereSearch = `
        AND (
          e.nombre LIKE ?
          OR t.nombre LIKE ?
          OR t.telefono LIKE ?
          OR t.correo LIKE ?
        )
      `;
      searchParams = [search, search, search, search];
    }

    // COUNT
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM estudiantes e
      JOIN tutores t ON t.id = e.tutor_id
      WHERE e.grado = ?
        AND e.paralelo = ?
        ${whereSearch}
      `,
      [grade, parallel, ...searchParams]
    );

    const total = countRows[0]?.total ?? 0;

    // DATA
    const [rows] = await pool.query(
      `
      SELECT 
        e.id,
        e.nombre AS name,
        t.nombre AS tutorName,
        t.telefono AS tutorPhone,
        t.correo AS tutorEmail,
        e.grado AS grade,
        e.paralelo AS parallel
      FROM estudiantes e
      JOIN tutores t ON t.id = e.tutor_id
      WHERE e.grado = ?
        AND e.paralelo = ?
        ${whereSearch}
      ORDER BY e.nombre ASC
      LIMIT ? OFFSET ?
      `,
      [grade, parallel, ...searchParams, pageSize, offset]
    );

    return res.json({
      items: rows,
      total
    });

  } catch (error) {
    console.error("ERROR EN /nomina:", error);
    return apiError(res, "BUSINESS_RULE", "Error obteniendo estudiantes");
  }
});
router.get("/ranking-estudiantes", async (req, res) => {
  try {
    const { month, year } = req.query;

    const [rows] = await pool.query(`
      SELECT 
        e.id,
        e.nombre,
        COUNT(CASE WHEN m.estado = 'PENDIENTE' THEN 1 END) AS pendientes,
        COUNT(CASE WHEN m.estado = 'PAGADO' THEN 1 END) AS pagados
      FROM estudiantes e
      JOIN mensualidades m ON m.estudiante_id = e.id
      WHERE m.mes = ? AND m.anio = ?
      GROUP BY e.id, e.nombre
      ORDER BY pendientes DESC
    `, [month, year]);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo ranking" });
  }
});
module.exports = router;

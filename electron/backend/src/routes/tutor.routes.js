const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

router.get("/por-curso", async (req, res) => {
  try {

    const { grado, paralelo } = req.query;

    if (!grado) {
      return apiError(res, "VALIDATION_ERROR", "El grado es requerido");
    }

    let where = `WHERE e.grado = ?`;
    const params = [grado];

    if (paralelo) {
      where += ` AND e.paralelo = ?`;
      params.push(paralelo);
    }

    const [rows] = await pool.query(
      `
      SELECT 
        t.id AS tutorId,
        t.nombre AS tutorName,
        t.telefono AS phone,
        t.correo AS email,
        e.id AS studentId,
        e.nombre AS studentName,
        e.grado,
        e.paralelo
      FROM estudiantes e
      JOIN tutores t ON t.id = e.tutor_id
      ${where}
      ORDER BY e.grado, e.paralelo, e.nombre
      `,
      params
    );

    const result = {};

    for (const r of rows) {

      if (!result[r.tutorId]) {
        result[r.tutorId] = {
          id: r.tutorId,
          name: r.tutorName,
          phone: r.phone,
          email: r.email,
          students: []
        };
      }

      result[r.tutorId].students.push({
        id: r.studentId,
        name: r.studentName,
        grade: r.grado,
        parallel: r.paralelo
      });
    }

    res.json(Object.values(result));

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error filtrando por curso");
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      status = "ALL",
      page = 1,
      pageSize = 10
    } = req.query;

    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;
    const search = `%${q}%`;

    let where = `
      WHERE (
        t.nombre LIKE ?
        OR t.correo LIKE ?
        OR t.telefono LIKE ?
        OR e.nombre LIKE ?
      )
    `;

    const params = [search, search, search, search];

    const baseQuery = `
      SELECT
        t.id,
        t.nombre AS name,
        t.correo AS email,
        t.telefono AS phone,
        GROUP_CONCAT(DISTINCT e.nombre SEPARATOR '||') AS students,
        /* BALANCE CALCULADO */
        (
        /* TOTAL PAGADO */
        COALESCE((
          SELECT SUM(p.monto + p.descuento)
          FROM pagos p
          JOIN estudiantes e2 ON (
            (p.tipo = 'MENSUALIDAD' AND EXISTS (
                SELECT 1 FROM mensualidades m2 
                WHERE m2.id = p.referencia_id 
                AND m2.estudiante_id = e2.id
            ))
            OR
            (p.tipo = 'SERVICIO' AND EXISTS (
                SELECT 1 FROM estudiante_servicio es2 
                WHERE es2.id = p.referencia_id 
                AND es2.estudiante_id = e2.id
            ))
          )
          WHERE e2.tutor_id = t.id
            /*AND p.reversed = 0*/
        ),0)

        -

        /* TOTAL DEUDA */
        (
          COALESCE((
            SELECT SUM(m2.total)
            FROM mensualidades m2
            JOIN estudiantes e3 ON e3.id = m2.estudiante_id
            WHERE e3.tutor_id = t.id
          ),0)

          +

          COALESCE((
            SELECT SUM(es2.total)
            FROM estudiante_servicio es2
            JOIN estudiantes e4 ON e4.id = es2.estudiante_id
            WHERE e4.tutor_id = t.id
              AND es2.estado != 'CANCELADO'
          ),0)
        )

      ) AS balance

      FROM tutores t
      LEFT JOIN estudiantes e ON e.tutor_id = t.id
      LEFT JOIN mensualidades m ON m.estudiante_id = e.id
      LEFT JOIN estudiante_servicio es ON es.estudiante_id = e.id AND es.estado != 'CANCELADO'
      LEFT JOIN pagos p 
        ON (
          (p.tipo = 'MENSUALIDAD' AND p.referencia_id = m.id)
          OR
          (p.tipo = 'SERVICIO' AND p.referencia_id = es.id)
        )
      ${where}
      GROUP BY t.id
    `;

    let having = "";
    if (status === "DEBT") {
      having = "HAVING balance < 0";
    }
    if (status === "OK") {
      having = "HAVING balance >= 0";
    }

    // TOTAL REAL
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM (${baseQuery} ${having}) as sub`,
      params
    );

    // DATA
    const [rows] = await pool.query(
      `
      SELECT * FROM (${baseQuery} ${having}) as sub
      ORDER BY name ASC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );
    const formatted = rows.map(r => ({
      ...r,
      students: r.students
        ? r.students.split('||')
        : []
    }));
    res.json({
      items: formatted,
      page: Number(page),
      pageSize: limit,
      total
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error listando tutores");
  }
});

// filtro por busqueda, te muestra los datos del tutor si lo buscas por nombre de tutor, hijo o celular
// ejemplo para que lo pruebes jaelsita - GET http://localhost:3000/api/tutores/search?q=juan
router.get("/search", async (req, res) => {
  try {
    const {
      q = "",
      page = 1,
      pageSize = 10
    } = req.query;

    const offset = (page - 1) * pageSize;
    const search = `%${q}%`;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT t.id) as total
       FROM tutores t
       LEFT JOIN estudiantes e ON e.tutor_id = t.id
       WHERE t.nombre LIKE ?
          OR t.telefono LIKE ?
          OR e.nombre LIKE ?`,
      [search, search, search]
    );

    const [tutores] = await pool.query(
      `SELECT DISTINCT
          t.id, t.nombre, t.correo AS email, t.telefono
       FROM tutores t
       LEFT JOIN estudiantes e ON e.tutor_id = t.id
       WHERE t.nombre LIKE ?
          OR t.telefono LIKE ?
          OR e.nombre LIKE ?
       LIMIT ? OFFSET ?`,
      [search, search, search, Number(pageSize), Number(offset)]
    );

    res.json({
      items: tutores,
      page: Number(page),
      pageSize: Number(pageSize),
      total
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error en búsqueda");
  }
});

//estudaintes total 
router.get("/total", async (req, res) => {
  try {

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM tutores`
    );

    res.json({ total });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo total de tutores");
  }
});
//tutor con id y estudiantes con id 
router.get("/:tutorId", async (req, res) => {
  try {
    const { tutorId } = req.params;

    const [[tutor]] = await pool.query(
      `SELECT id, nombre, correo AS email, telefono
       FROM tutores
       WHERE id = ?`,
      [tutorId]
    );

    if (!tutor) {
      return apiError(res, "NOT_FOUND", "Tutor no encontrado");
    }

    const [students] = await pool.query(
      `SELECT id, tutor_id, nombre, grado, paralelo
       FROM estudiantes
       WHERE tutor_id = ?`,
      [tutorId]
    );
    const [[{ balance }]] = await pool.query(
      `SELECT 
          COALESCE((
            SELECT SUM(p.monto + p.descuento)
            FROM pagos p
            JOIN mensualidades mm ON mm.id = p.referencia_id
            JOIN estudiantes ee ON ee.id = mm.estudiante_id
            WHERE ee.tutor_id = ?
          ),0)
          -
          COALESCE((
            SELECT SUM(m.total)
            FROM mensualidades m
            JOIN estudiantes e ON e.id = m.estudiante_id
            WHERE e.tutor_id = ?
          ),0) AS balance`,
      [tutorId, tutorId]
    );

    res.json({
      parent: {
        id: tutor.id,
        name: tutor.nombre,
        email: tutor.email,
        phone: tutor.telefono,
        balance
      },
      students: students.map(s => ({
        id: s.id,
        tutorId: s.tutor_id,
        name: s.nombre,
        grade: s.grado,
        parallel: s.paralelo
      }))
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo tutor");
  }
});

//api para la vista de inscripciones
router.get("/:tutorId/pay-view", async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { year, includeHistory } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }

    /* =========================
        Tutor
    ==========================*/
    const [[tutor]] = await pool.query(
      `SELECT id, nombre, telefono, correo AS email
        FROM tutores
        WHERE id = ?`,
      [tutorId]
    );

    if (!tutor) {
      return apiError(res, "NOT_FOUND", "Tutor no encontrado");
    }

    /* =========================
        Hijos
    ==========================*/
    const [children] = await pool.query(
      `SELECT id, nombre, grado, paralelo
        FROM estudiantes
        WHERE tutor_id = ?`,
      [tutorId]
    );

    const paymentsByChild = {};

    for (const child of children) {

      /* =========================
          Mensualidades
      ==========================*/
      const [mensualidades] = await pool.query(
        `SELECT id, mes, anio,total AS monto
          FROM mensualidades
          WHERE estudiante_id = ? AND anio = ?
          ORDER BY anio DESC, mes DESC`,
        [child.id, year]
      );

      /* =========================
          Servicios extra
      ==========================*/
      const [conceptosExtra] = await pool.query(
        `SELECT 
            es.id,
            es.mes,
            es.anio,
            es.total AS monto,
            es.servicio_id,
            es.evento_id,
            s.nombre AS nombre_servicio,
            ev.evento AS nombre_evento
        FROM estudiante_servicio es
        LEFT JOIN servicios s ON s.id = es.servicio_id
        LEFT JOIN eventos ev ON ev.id = es.evento_id
        WHERE es.estudiante_id = ?
          AND es.estado != 'CANCELADO'
        ORDER BY es.anio DESC, es.mes DESC`,
        [child.id, year]
      );
      const childConcepts = [];

      /* =========================
        Procesar mensualidades
      ==========================*/
      for (const m of mensualidades) {

        const [[sum]] = await pool.query(
          `SELECT COALESCE(SUM(monto + descuento),0) AS total
           FROM pagos
           WHERE referencia_id = ?
           AND tipo = 'MENSUALIDAD'`,
          [m.id]
        );

        const pending = m.monto - sum.total;
        let history = [];

        if (includeHistory === "true") {
          const [rows] = await pool.query(
            `SELECT id, fecha, monto, descuento, nota, responsable
             FROM pagos
             WHERE referencia_id = ?
             AND tipo = 'MENSUALIDAD' AND reversed!=1`,
            [m.id]
          );

          history = rows.map(r => ({
            id: r.id,
            dateISO: r.fecha,
            type: "PAYMENT",
            conceptLabel: `Mensualidad ${m.mes}/${m.anio}`,
            paid: r.monto,
            discount: r.descuento,
            appliedTotal: Number(r.monto) + Number(r.descuento),
            note: r.nota,
            staff: r.responsable,
            movementId: r.id,
            reversed: false
          }));
        }

        childConcepts.push({
          id: m.id,
          studentId: child.id,
          categoryId: 1,
          categoryName: "MENSUALIDAD",
          concept: `Mensualidad ${m.mes}/${m.anio}`,
          period: { year: m.anio, month: m.mes },
          amountTotal: m.monto,
          pending,
          history
        });
      }
      for (const item of conceptosExtra) {

        const tipo = item.evento_id ? "EVENTO" : "SERVICIO";

        const [[sum]] = await pool.query(
          `SELECT COALESCE(SUM(monto + descuento),0) AS total
          FROM pagos
          WHERE referencia_id = ?
          AND tipo = "SERVICIO"`,
          [item.id]
        );

        const pending = item.monto - sum.total;
        let history = [];

        if (includeHistory === "true") {
          const [rows] = await pool.query(
            `SELECT id, fecha, monto, descuento, nota, responsable
            FROM pagos
           WHERE (referencia_id = ?
            AND tipo = "SERVICIO" ) AND (nota="Reversión manual" or reversed =0)`,
            [item.id, tipo]
          );

          history = rows.map(r => ({
            id: r.id,
            dateISO: r.fecha,
            type: "PAYMENT",
            conceptLabel: tipo === "EVENTO"
              ? `Evento ${item.nombre_evento}`
              : `Servicio ${item.nombre_servicio} ${item.mes}/${item.anio}`,
            paid: r.monto,
            discount: r.descuento,
            appliedTotal: r.monto + r.descuento,
            note: r.nota,
            staff: r.responsable,
            movementId: r.id,
            reversed: false
          }));
        }

        childConcepts.push({
          id: item.id,
          studentId: child.id,
          categoryId: tipo === "EVENTO" ? 3 : 2,
          categoryName: tipo,
          concept: tipo === "EVENTO"
            ? `Evento ${item.nombre_evento}`
            : `Servicio ${item.nombre_servicio} ${item.mes}/${item.anio}`,
          period: { year: item.anio, month: item.mes },
          amountTotal: item.monto,
          pending,
          history
        });
      }

      paymentsByChild[child.id] = childConcepts;
    }

    res.json({
      tutor: {
        id: tutor.id,
        name: tutor.nombre,
        phone: tutor.telefono,
        email: tutor.email
      },
      children: children.map(c => ({
        id: c.id,
        name: c.nombre,
        grade: c.grado,
        parallel: c.paralelo
      })),
      paymentsByChild
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error construyendo PayView");
  }
});

router.get("/:id/full", async (req, res) => {
  try {
    const tutorId = req.params.id;
    const [tutores] = await pool.query(
      `SELECT id, nombre AS name, correo AS email, telefono AS phone
       FROM tutores
       WHERE id = ?`,
      [tutorId]
    );

    if (tutores.length === 0) {
      return apiError(res, "NOT_FOUND", "Tutor no encontrado", null, 404);
    }

    const tutor = tutores[0];
    const [students] = await pool.query(
      `
      SELECT 
        e.id,
        e.nombre AS name,
        e.grado AS grade,
        e.paralelo AS parallel,
        COALESCE(SUM(
          CASE WHEN m.estado = 'PENDIENTE' THEN m.monto ELSE 0 END
        ), 0) AS balance
      FROM estudiantes e
      LEFT JOIN mensualidades m ON m.estudiante_id = e.id
      WHERE e.tutor_id = ?
      GROUP BY e.id
      `,
      [tutorId]
    );
    const totalBalance = students.reduce(
      (acc, s) => acc + Number(s.balance),
      0
    );

    res.json({
      ...tutor,
      balance: totalBalance,
      students,
    });

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "Error al obtener información");
  }
});

router.post("/", async (req, res) => {
  try {
    const { parent, students } = req.body;
    if (!parent?.name || !parent?.phone) {
      return apiError(res, "VALIDATION_ERROR", "Nombre y teléfono son requeridos");
    }

    const [resultTutor] = await pool.query(
      `INSERT INTO tutores (nombre, correo, telefono)
       VALUES (?, ?, ?)`,
      [parent.name, parent.email || null, parent.phone]
    );

    const tutorId = resultTutor.insertId;

    for (const st of students) {
      await pool.query(
        `INSERT INTO estudiantes (tutor_id, nombre, grado, paralelo)
         VALUES (?, ?, ?, ?)`,
        [tutorId, st.name, st.grade, st.parallel]
      );
    }

    res.json({ ok: true, id: tutorId });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo registrar el tutor");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const tutorId = req.params.id;
    const { parent, students } = req.body;
    await pool.query(
      `UPDATE tutores
       SET nombre = ?, correo = ?, telefono = ?
       WHERE id = ?`,
      [parent.name, parent.email || null, parent.phone, tutorId]
    );
    for (const st of students) {
      if (st.id) {
        await pool.query(
          `UPDATE estudiantes
           SET nombre = ?, grado = ?, paralelo = ?
           WHERE id = ?`,
          [st.name, st.grade, st.parallel, st.id]
        );
      } else {
        await pool.query(
          `INSERT INTO estudiantes (tutor_id, nombre, grado, paralelo)
           VALUES (?, ?, ?, ?)`,
          [tutorId, st.name, st.grade, st.parallel]
        );
      }
    }

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "No se pudo actualizar");
  }
});




module.exports = router;



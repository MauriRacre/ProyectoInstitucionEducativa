const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      status = "ALL",
      page = 1,
      pageSize = 10
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);

    // total registros
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM tutores
       WHERE nombre LIKE ?`,
      [`%${q}%`]
    );

    // lista base
    const [tutores] = await pool.query(
      `SELECT id, nombre, correo AS email, telefono
       FROM tutores
       WHERE nombre LIKE ?
       LIMIT ? OFFSET ?`,
      [`%${q}%`, Number(pageSize), offset]
    );

    const items = [];

    for (const t of tutores) {

      // alumnos
      const [students] = await pool.query(
        `SELECT nombre FROM estudiantes WHERE tutor_id = ?`,
        [t.id]
      );

      // 🔥 BALANCE = pagado - total
      const [[{ balance }]] = await pool.query(
        `SELECT 
            COALESCE((
              SELECT SUM(p.monto + p.descuento)
              FROM pagos p
              JOIN mensualidades mm ON mm.id = p.mensualidad_id
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
        [t.id, t.id]
      );

      items.push({
        id: t.id,
        name: t.nombre,
        email: t.email,
        phone: t.telefono,
        students: students.map(s => s.nombre),
        balance
      });
    }

    // filtros
    let filtered = items;

    if (status === "DEBT") {
      filtered = items.filter(i => i.balance < 0);
    }

    if (status === "OK") {
      filtered = items.filter(i => i.balance >= 0);
    }

    res.json({
      items: filtered,
      page: Number(page),
      pageSize: Number(pageSize),
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

    // 🔥 mismo cálculo correcto
    const [[{ balance }]] = await pool.query(
      `SELECT 
          COALESCE((
            SELECT SUM(p.monto + p.descuento)
            FROM pagos p
            JOIN mensualidades mm ON mm.id = p.mensualidad_id
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

router.get("/:tutorId/pay-view", async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { year, includeHistory } = req.query;

    if (!year) {
      return apiError(res, "VALIDATION_ERROR", "Año requerido");
    }

    const [[tutor]] = await pool.query(
      `SELECT id, nombre, telefono, correo AS email
       FROM tutores
       WHERE id = ?`,
      [tutorId]
    );

    if (!tutor) {
      return apiError(res, "NOT_FOUND", "Tutor no encontrado");
    }

    const [children] = await pool.query(
      `SELECT id, nombre, grado, paralelo
       FROM estudiantes
       WHERE tutor_id = ?`,
      [tutorId]
    );

    const paymentsByChild = {};

    for (const child of children) {

      const [concepts] = await pool.query(
        `SELECT id, mes, anio, total AS monto
         FROM mensualidades
         WHERE estudiante_id = ? AND anio = ?`,
        [child.id, year]
      );

      const childConcepts = [];

      for (const c of concepts) {

        const [[sum]] = await pool.query(
          `SELECT COALESCE(SUM(monto + descuento),0) AS total
           FROM pagos
           WHERE mensualidad_id = ?`,
          [c.id]
        );

        const pending = c.monto - sum.total;

        let history = [];

        if (includeHistory === "true") {
          const [rows] = await pool.query(
            `SELECT id, fecha, monto, descuento, nota, responsable
             FROM pagos
             WHERE mensualidad_id = ?`,
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

        childConcepts.push({
          id: c.id,
          studentId: child.id,
          categoryId: "MONTHLY",
          concept: `Mensualidad ${c.mes}/${c.anio}`,
          period: { year: c.anio, month: c.mes },
          amountTotal: c.monto,
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



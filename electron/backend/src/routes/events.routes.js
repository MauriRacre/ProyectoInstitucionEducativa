const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, evento, concepto, destino, monto
        FROM eventos
        WHERE activo = 1
        ORDER BY id`
    );

    res.json({ items: rows });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error listando eventos");
  }
});


router.get("/:id", async (req, res) => {
  try {
    const [[event]] = await pool.query(
      `SELECT id, evento, concepto, destino, monto
       FROM eventos
       WHERE id = ?`,
      [req.params.id]
    );

    if (!event) {
      return apiError(res, "NOT_FOUND", "Evento no encontrado");
    }

    res.json(event);

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo evento");
  }
});

router.post("/", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { evento, concepto, destino, monto } = req.body;

    const [result] = await connection.query(
      `INSERT INTO eventos (evento, concepto, destino, monto)
       VALUES (?, ?, ?, ?)`,
      [evento, concepto, destino, monto]
    );

    const eventoId = result.insertId;
    const [estudiantes] = await connection.query(
      `SELECT id 
       FROM estudiantes
       WHERE CONCAT(grado, ' ', paralelo) = ?`,
      [destino]
    );

    for (const estudiante of estudiantes) {
            await connection.query(
        `INSERT INTO estudiante_servicio
        (estudiante_id, evento_id, total, estado)
        VALUES (?, ?, ?, 'EVENTO')`,
        [
          estudiante.id,
          eventoId,
          monto
        ]

      );
    }

    await connection.commit();

    res.status(201).json({ id: eventoId });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error creando evento");
  } finally {
    connection.release();
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;   // ✅ AQUÍ
    const { evento, concepto, destino, monto } = req.body;

    await pool.query(
      `UPDATE eventos
      SET evento = ?, concepto = ?, destino = ?, monto = ?
      WHERE id = ?`,
      [evento, concepto, destino, monto, id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error actualizando evento");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query(
      `UPDATE eventos SET activo = 0 WHERE id = ?`,
      [req.params.id]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error eliminando evento");
  }
});

module.exports = router;


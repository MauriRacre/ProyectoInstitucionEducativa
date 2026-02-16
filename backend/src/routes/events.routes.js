const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { apiError } = require("../utils/apiError");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, evento, concepto, destino
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
      `SELECT id, evento, concepto, destino
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
  try {
    const { evento, concepto, destino } = req.body;

    const [result] = await pool.query(
      `INSERT INTO eventos (evento, concepto, destino)
       VALUES (?, ?, ?)`,
      [evento, concepto, destino]
    );

    res.status(201).json({ id: result.insertId });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error creando evento");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { evento, concepto, destino } = req.body;

    await pool.query(
      `UPDATE eventos
       SET evento = ?, concepto = ?, destino = ?
       WHERE id = ?`,
      [evento, concepto, destino, req.params.id]
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


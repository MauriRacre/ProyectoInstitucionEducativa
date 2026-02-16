const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id,
        nombre as name,
        username,
        email,
        ping
       FROM usuarios
       ORDER BY id`
    );

    res.json({ items: rows });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error listando usuarios");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[user]] = await pool.query(
      `SELECT 
        id,
        nombre as name,
        username,
        email,
        ping,
        rol
       FROM usuarios
       WHERE id = ?`,
      [id]
    );

    if (!user) {
      return apiError(res, "NOT_FOUND", "Usuario no encontrado");
    }

    res.json(user);

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error obteniendo usuario");
  }
});


router.post("/", async (req, res) => {
  try {
    const { nombre, username, password, rol, email } = req.body;

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, username, password, rol, email)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, username, password, rol, email]
    );

    res.status(201).json({ id: result.insertId });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error creando usuario");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, username, rol, email } = req.body;

    await pool.query(
      `UPDATE usuarios
       SET nombre = ?, username = ?, rol = ?, email = ?
       WHERE id = ?`,
      [nombre, username, rol, email, id]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error actualizando usuario");
  }
});


module.exports = router;

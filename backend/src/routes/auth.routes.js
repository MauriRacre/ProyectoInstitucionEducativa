const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

router.post("/login", async (req, res) => {
  try {
    const { username, ping } = req.body;

    const [[user]] = await pool.query(
      `SELECT id, nombre, rol
       FROM usuarios
       WHERE username = ? AND ping = ?`,
      [username, ping]
    );

    if (!user) {
      return apiError(res, "UNAUTHORIZED", "Credenciales inválidas");
    }

    res.json(user);

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error en login");
  }
});


module.exports = router;

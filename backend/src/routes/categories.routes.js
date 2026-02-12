const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");


router.get("/", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM categorias");
  res.json(rows);
});

router.post("/", async (req, res) => {
  try {
    const { name, type, active } = req.body;

    if (!name) {
      return apiError(res, "VALIDATION_ERROR", "Nombre requerido");
    }

    if (!type) {
      return apiError(res, "VALIDATION_ERROR", "Tipo requerido");
    }

    const [result] = await pool.query(
      `INSERT INTO categorias (name, type, active)
       VALUES (?, ?, ?)`,
      [name, type, active ?? true]
    );

    res.json({ ok: true, id: result.insertId });

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "No se pudo crear la categoría");
  }
});


module.exports = router;

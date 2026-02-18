const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { grades } = require("../catalogs/grades.catalog");
const { categories } = require("../catalogs/categories.catalog");
const { apiError } = require("../utils/apiError");


router.get("/", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM categorias");
  res.json(rows);
});

router.get("/categorias/modal", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categorias");

    const categorias = rows;

    const mensualidad = {
      id: 0, 
      name: "Mensualidad",
      type: "SERVICE",
      active: 1
    };

    res.json([mensualidad, ...categorias]);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});
router.get("/allCourses", async (req, res) => {
  try {

    const [grados] = await pool.query(`
      SELECT DISTINCT CONCAT(grado, ' ', paralelo) AS nombre
      FROM estudiantes
      ORDER BY grado, paralelo
    `);

    const [especiales] = await pool.query(`
      SELECT name AS nombre
      FROM categorias
    `);

    return res.json([
      ...grados.map(g => g.nombre),
      ...especiales.map(e => e.nombre)
    ]);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error obteniendo cursos"
    });
  }
});

// ======================================================
// GET BY ID
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [rows] = await pool.query(
      "SELECT * FROM categorias WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return apiError(res, "NOT_FOUND", "Categoría no encontrada");
    }

    res.json(rows[0]);

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "Error obteniendo categoría");
  }
});


// ======================================================
// CREATE
// ======================================================
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
      `
      INSERT INTO categorias (name, type, active)
      VALUES (?, ?, ?)
      `,
      [name, type, active ?? true]
    );

    res.json({ ok: true, id: result.insertId });

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "No se pudo crear la categoría");
  }
});


// ======================================================
// UPDATE
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, type, active } = req.body;

    if (!name) {
      return apiError(res, "VALIDATION_ERROR", "Nombre requerido");
    }

    if (!type) {
      return apiError(res, "VALIDATION_ERROR", "Tipo requerido");
    }

    const [result] = await pool.query(
      `
      UPDATE categorias
      SET name = ?, type = ?, active = ?
      WHERE id = ?
      `,
      [name, type, active ?? true, id]
    );

    if (result.affectedRows === 0) {
      return apiError(res, "NOT_FOUND", "Categoría no encontrada");
    }

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "No se pudo actualizar la categoría");
  }
});


// ======================================================
// DELETE (hard delete)
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result] = await pool.query(
      "DELETE FROM categorias WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return apiError(res, "NOT_FOUND", "Categoría no encontrada");
    }

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    return apiError(res, "BUSINESS_RULE", "No se pudo eliminar la categoría");
  }
});

module.exports = router;

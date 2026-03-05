const express = require("express");
const router = express.Router();
const { grades } = require("../catalogs/grades.catalog");
const { categories } = require("../catalogs/categories.catalog");
const pool = require("../config/db");


router.get("/grades", (req, res) => {
  res.json(grades);
});

router.get("/categories", (req, res) => {
  const { active } = req.query;

  let result = categories;
  if (active !== undefined) {
    const isActive = active === "true";
    result = categories.filter(c => c.active === isActive);
  }

  res.json({ categories: result });
});

router.get("/services", async (req, res) => {
  try {
    const { active } = req.query;

    let query = `SELECT * FROM servicios`;
    const params = [];

    if (active !== undefined) {
      query += ` WHERE activo = ?`;
      params.push(active === "true" ? 1 : 0);
    }

    const [rows] = await pool.query(query, params);

    res.json({ services: rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo servicios" });
  }
});


module.exports = router;

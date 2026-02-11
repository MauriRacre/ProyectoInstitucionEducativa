const express = require("express");
const router = express.Router();
const { grades } = require("../catalogs/grades.catalog");
const { categories } = require("../catalogs/categories.catalog");

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



module.exports = router;

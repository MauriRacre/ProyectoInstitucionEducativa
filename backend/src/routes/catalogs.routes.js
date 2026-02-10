const express = require("express");
const router = express.Router();
const { grades } = require("../catalogs/grades.catalog");

router.get("/grades", (req, res) => {
  res.json(grades);
});

module.exports = router;

const pool = require("../config/db");

async function createServicio(data) {
  const { nombre, descripcion } = data;

  if (!nombre) {
    throw new Error("El nombre es obligatorio");
  }

  const [result] = await pool.query(
    `INSERT INTO servicios (nombre, descripcion, activo)
     VALUES (?, ?, 1)`,
    [nombre, descripcion || null]
  );

  return {
    id: result.insertId,
    nombre,
    descripcion,
    activo: 1
  };
}

async function getServicios() {
  const [rows] = await pool.query(
    `SELECT * FROM servicios WHERE activo = 1`
  );
  return rows;
}

async function getServicioById(id) {
  const [[row]] = await pool.query(
    `SELECT * FROM servicios WHERE id = ?`,
    [id]
  );
  return row;
}

async function updateServicio(id, data) {
  const { nombre, descripcion, activo } = data;

  const [result] = await pool.query(
    `UPDATE servicios
     SET nombre = ?, descripcion = ?, activo = ?
     WHERE id = ?`,
    [
      nombre,
      descripcion,
      activo !== undefined ? activo : 1,
      id
    ]
  );

  return result.affectedRows > 0;
}

async function deleteServicio(id) {
  // Soft delete
  const [result] = await pool.query(
    `UPDATE servicios SET activo = 0 WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createServicio,
  getServicios,
  getServicioById,
  updateServicio,
  deleteServicio
};
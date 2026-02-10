const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Usuario no existe' });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;

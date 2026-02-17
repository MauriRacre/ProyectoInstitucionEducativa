const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { apiError } = require("../utils/apiError");
const { generateUniquePing } = require("../utils/generatePing");
const { sendMail } = require("../utils/mailer");
const { sendRecoveryMail } = require("../utils/mailer");



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
    const { nombre, username, email } = req.body;
    const ping = await generateUniquePing(pool);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, username, email, rol, ping)
       VALUES (?, ?, ?,'USER', ?)`,
      [nombre, username, email, ping]
    );

    // Enviar correo
    await sendMail({
      to: email,
      subject: "Acceso al Sistema",
      html: `
        <h3>Bienvenido ${nombre}</h3>
        <p>Su acceso ha sido creado.</p>
        <p><strong>Usuario:</strong> ${username}</p>
        <p><strong>PIN:</strong> ${ping}</p>
        <p>Use estos datos para ingresar al sistema.</p>
      `
    });

    res.status(201).json({
      id: result.insertId,
      message: "Usuario creado y PIN enviado por correo"
    });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error creando usuario");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, rol, email } = req.body;

    await pool.query(
      `UPDATE usuarios
       SET nombre = ?, username = ?, rol = ?, email = ?
       WHERE id = ?`,
      [name, username, rol, email, id]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    apiError(res, "BUSINESS_RULE", "Error actualizando usuario");
  }
});

router.post("/recover-ping", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Correo requerido" });
    }

    const [[user]] = await pool.query(
      "SELECT id, nombre FROM usuarios WHERE email = ?",
      [email]
    );

    if (!user) {
      // Respuesta genérica por seguridad
      return res.json({
        message: "Si el correo está registrado, recibirás un nuevo PIN."
      });
    }

    // Generar nuevo PIN único
    const nuevoPing = await generateUniquePing(pool);

    // Actualizar en BD
    await pool.query(
      "UPDATE usuarios SET ping = ? WHERE id = ?",
      [nuevoPing, user.id]
    );

    // Enviar correo
    await sendRecoveryMail(email, user.nombre, nuevoPing);

    res.json({
      message: "Si el correo está registrado, recibirás un nuevo PIN."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error recuperando PIN" });
  }
});

module.exports = router;

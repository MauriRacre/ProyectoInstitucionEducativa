async function generarMensualidades(pool) {
  try {
    const fecha = new Date();
    const mes = fecha.getMonth() + 1; // 1 - 12
    const anio = fecha.getFullYear();

    console.log(`Generando mensualidades para ${mes}/${anio}`);

    const [estudiantes] = await pool.query(
      "SELECT id FROM estudiantes"

    );

    for (const estudiante of estudiantes) {
      await pool.query(
        `
        INSERT INTO mensualidades 
        (estudiante_id, mes, anio, monto, estado, base_amount, extra_amount, discount_amount, total)
        VALUES (?, ?, ?, 490, 'PENDIENTE', 490, 0, 0, 490)
        ON DUPLICATE KEY UPDATE estudiante_id = estudiante_id
        `,
        [estudiante.id, mes, anio]
      );
    }

    console.log("Mensualidades generadas correctamente ✅");

  } catch (error) {
    console.error("Error generando mensualidades:", error);
  }
}

module.exports = { generarMensualidades };

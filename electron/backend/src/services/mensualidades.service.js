async function generarMensualidades(pool) {
  try {
    const fecha = new Date();
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();

    console.log(`Generando mensualidades para ${mes}/${anio}`);

    /* ================= TRAER MONTO DESDE ESTUDIANTES ================= */

    const [estudiantes] = await pool.query(
      "SELECT id, monto FROM estudiantes"
    );

    for (const estudiante of estudiantes) {

      const monto = estudiante.monto || 0;

      await pool.query(
        `
        INSERT INTO mensualidades 
        (estudiante_id, mes, anio, monto, estado, base_amount, extra_amount, discount_amount, total)
        VALUES (?, ?, ?, ?, 'PENDIENTE', ?, 0, 0, ?)
        ON DUPLICATE KEY UPDATE estudiante_id = estudiante_id
        `,
        [
          estudiante.id,
          mes,
          anio,
          monto,
          monto,
          monto
        ]
      );
    }

    /* ================= SERVICIOS ================= */

    const [serviciosActivos] = await pool.query(
      `
      SELECT DISTINCT estudiante_id, servicio_id, total
      FROM estudiante_servicio
      WHERE estado IN ('PENDIENTE', 'PAGADO')
      `
    );

    for (const s of serviciosActivos) {

      await pool.query(
        `
        INSERT INTO estudiante_servicio
        (estudiante_id, servicio_id, mes, anio, total, estado)
        VALUES (?, ?, ?, ?, ?, 'PENDIENTE')
        ON DUPLICATE KEY UPDATE estudiante_id = estudiante_id
        `,
        [s.estudiante_id, s.servicio_id, mes, anio, s.total]
      );
    }

    console.log("Mensualidades y servicios generados correctamente");

  } catch (error) {
    console.error("Error generando mensualidades:", error);
  }
}

module.exports = { generarMensualidades };
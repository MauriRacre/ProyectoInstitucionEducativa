async function generarMensualidades(pool) {
  try {
    const fecha = new Date();
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();

    console.log(`Generando mensualidades y servicios para ${mes}/${anio}`);

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

    const [serviciosActivos] = await pool.query(
      `
      SELECT DISTINCT estudiante_id, servicio_id, total
      FROM estudiante_servicio
      WHERE estado = 'PAGADO' AND estado='PENDIENTE'
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
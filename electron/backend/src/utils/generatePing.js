// Genera un PIN numérico de 4 dígitos
function generatePing() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Genera un PIN único validando que no exista en la BD
async function generateUniquePing(pool) {
  let ping;
  let exists = true;

  while (exists) {
    ping = generatePing();

    const [[row]] = await pool.query(
      "SELECT id FROM usuarios WHERE ping = ?",
      [ping]
    );

    exists = !!row;
  }

  return ping;
}

module.exports = { generatePing, generateUniquePing };

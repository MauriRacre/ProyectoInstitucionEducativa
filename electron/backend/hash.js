const bcrypt = require('bcrypt');

async function generarHash() {
  try {
    const passwordPlano = '123456';
    const hash = await bcrypt.hash(passwordPlano, 10);
    console.log('HASH:', hash);
  } catch (error) {
    console.error(error);
  }
}

generarHash();

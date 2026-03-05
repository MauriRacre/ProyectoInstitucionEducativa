const path = require('path');
const fs = require('fs');

// Carga de variables de entorno
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const appPath = path.resolve(__dirname, 'app.js');

try {
    const app = require(appPath);
    const PORT = process.env.PORT || 8000;

    // Escuchamos en 127.0.0.1 para evitar conflictos de DNS en Windows
    const server = app.listen(PORT, '127.0.0.1');

    server.on('error', (err) => {
        process.exit(1);
    });
} catch (error) {
    process.exit(1);
}
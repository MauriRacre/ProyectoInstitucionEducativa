const path = require('path');
const moduleAlias = require('module');

// Forzamos a Node a buscar en la carpeta node_modules del backend
const nodeModulesPath = path.join(__dirname, '../node_modules');

// Inyectamos la ruta en el motor de búsqueda de Node
process.env.NODE_PATH = nodeModulesPath;
require('module').Module._initPaths();

console.log("Inyectando NODE_PATH:", nodeModulesPath);

// Ahora sí, cargamos tu servidor real
require('./server.js');
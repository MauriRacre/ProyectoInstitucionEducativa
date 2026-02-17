const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
console.log("MAIL_USER:", process.env.MAIL_USER);


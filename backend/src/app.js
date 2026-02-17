const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tutores", require("./routes/tutor.routes"));
app.use("/api/estudiantes", require("./routes/estudiante.routes"));
app.use("/api/mensualidades", require("./routes/mensualidad.routes"));
app.use("/api/auth", require("./routes/auth.routes"));

app.use("/api/catalogs", require("./routes/catalogs.routes"));
app.use("/api/categories", require("./routes/categories.routes"));
app.use("/api/payments", require("./routes/payments.routes"));
app.use("/api", require("./routes/movements.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/events", require("./routes/events.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/transactions", require("./routes/transactions.routes"));


const { generarMensualidades } = require("./services/mensualidades.service");

cron.schedule("0 0 1 * *", async () => {
  console.log("⏰ Generación mensual automática");
  await generarMensualidades(pool);
});

(async () => {
  await generarMensualidades(pool);
})();

module.exports = app;

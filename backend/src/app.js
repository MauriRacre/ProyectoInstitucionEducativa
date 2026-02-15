const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const tutorRoutes = require('./routes/tutor.routes');
app.use('/api/tutores', tutorRoutes);

const estudianteRoutes = require('./routes/estudiante.routes');
app.use('/api/estudiantes', estudianteRoutes);

const mensualidadRoutes = require('./routes/mensualidad.routes');
app.use('/api/mensualidades', mensualidadRoutes);

//const pagoRoutes = require('./routes/pago.routes');
//app.use('/api/pagos', pagoRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

app.use("/api/catalogs", require("./routes/catalogs.routes"));
app.use("/api/categories", require("./routes/categories.routes"));
app.use("/api/payments", require("./routes/payments.routes"));
app.use("/api", require("./routes/movements.routes"));

app.use("/api/transactions", require("./routes/transactions.routes"));
module.exports = app;

const { initAppLifecycle } = require("./bootstrap/appLifecycle");
const { createMainWindow } = require("./windows/mainWindow");
const { registerIpc } = require("./ipc/registerIpc");

// ===============================
// 1️⃣ Registrar IPC (front ↔ backend)
// ===============================
registerIpc();
// ===============================
// 2️⃣ Inicializar ciclo de vida
// ===============================
initAppLifecycle(createMainWindow);

const { app, BrowserWindow } = require("electron");

/**
 * Inicializa el ciclo de vida de la app
 * @param {Function} createMainWindow - función que crea la ventana principal
 */
function initAppLifecycle(createMainWindow) {

  // 🔒 Evita abrir la app más de una vez
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  // Si el usuario intenta abrir otra instancia
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  // 🚀 App lista
  app.whenReady().then(() => {
    createMainWindow();

    // macOS: recrear ventana al hacer click en el dock
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  // ❌ Cierre de la app
  app.on("window-all-closed", () => {
    // macOS mantiene la app viva
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  // 🧹 Limpieza al salir
  app.on("before-quit", () => {
    console.log("🧹 Cerrando aplicación...");
    // cerrar DB, limpiar procesos, etc.
  });

  // Señales del sistema (Ctrl + C)
  process.on("SIGINT", () => app.quit());
  process.on("SIGTERM", () => app.quit());
}

module.exports = { initAppLifecycle };

/**
 * aqui entra la conexion con apis de backend
 * const { ipcMain } = require("electron");

// Handlers por feature
const { registerDirectoryHandlers } = require("../../backend/features/directory/directory.handlers");
const { registerPaymentsHandlers } = require("../../backend/features/payments/payments.handlers");
const { registerSettingsHandlers } = require("../../backend/features/settings/settings.handlers");

function registerIpc() {
  registerDirectoryHandlers(ipcMain);
  registerPaymentsHandlers(ipcMain);
  registerSettingsHandlers(ipcMain);

  console.log("📡 IPC registrado correctamente");
}

module.exports = { registerIpc };
 */
const { contextBridge } = require("electron");

const directoryApi = require("./expose/directory.expose");
const paymentsApi  = require("./expose/payments.expose");
const settingsApi  = require("./expose/settings.expose");

// 🔐 Exponer una sola API global
contextBridge.exposeInMainWorld("api", {
    directory: directoryApi,
    payments: paymentsApi,
    settings: settingsApi,
});

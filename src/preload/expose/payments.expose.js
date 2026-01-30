/**
 * const { ipcRenderer } = require("electron");
const { CHANNELS } = require("../../shared/channels");

module.exports = {
  create(payload) {
    return ipcRenderer.invoke(CHANNELS.PAYMENTS.CREATE, payload);
  },

  list(filters) {
    return ipcRenderer.invoke(CHANNELS.PAYMENTS.LIST, filters);
  },
};

 */
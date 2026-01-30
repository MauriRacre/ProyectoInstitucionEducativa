/**const { ipcRenderer } = require("electron");
const { CHANNELS } = require("../../shared/channels");

module.exports = {
  get() {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.GET);
  },

  set(data) {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.SET, data);
  },
};
 */
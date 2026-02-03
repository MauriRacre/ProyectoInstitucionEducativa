const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      //preload: path.join(__dirname, 'preload.js')
    }
  });
  const isDev = !app.isPackaged;
  //const isDev = false;

  if (isDev) {
    // Angular en desarrollo
    win.loadURL("http://localhost:4200");
    win.webContents.openDevTools();
  } else {
    // Angular compilado (producción)
    // OJO: esta ruta depende de tu build output
    win.loadFile(
      path.join(__dirname, "renderer", "dist", "renderer", "browser", "index.html")
    );
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

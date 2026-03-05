const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const fs = require("fs");

let backendProcess;

function createWindow() {
  const isProd = app.isPackaged;
  
  // Configuración de Rutas
  const backendDir = isProd
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "backend");

  const backendPath = path.join(backendDir, "src", "server.js");
  const modulesPath = isProd 
    ? path.join(backendDir, "dependencias") 
    : path.join(backendDir, "node_modules");

  // Inicio del Backend (Modo Producción)
  if (fs.existsSync(backendPath)) {
    backendProcess = fork(backendPath, [], {
      cwd: backendDir,
      stdio: "ignore", // Silencia la salida del backend para ahorrar recursos
      env: { 
        ...process.env, 
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: modulesPath
      }
    });

    backendProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) console.error("Backend exited:", code);
    });
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true, // Opcional: oculta el menú Alt en Windows
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const indexPath = isProd
    ? path.join(app.getAppPath(), "renderer/dist/renderer/browser/index.html")
    : path.join(__dirname, "renderer/dist/renderer/browser/index.html");

  win.loadFile(indexPath).catch(err => console.error("Load Error:", err));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== "darwin") app.quit();
});
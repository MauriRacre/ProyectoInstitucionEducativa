const { BrowserWindow, shell } = require("electron");
const path = require("path");

function isDev() {
  return !appIsPackagedSafe();
}

// Evita require circular: electron.app se usa dentro de función
function appIsPackagedSafe() {
  try {
    const { app } = require("electron");
    return app.isPackaged;
  } catch {
    return false;
  }
}

function createMainWindow() {
  const { app } = require("electron");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false, // ✅ mostrar cuando esté listo
    backgroundColor: "#f3f4f6", // gris suave (match tailwind bg-gray-100)
    webPreferences: {
      // 🔐 Seguridad
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,

      // Preload
      preload: path.join(__dirname, "..", "..", "preload", "preload.js"),

      // Opcional: evita warnings si usas APIs modernas
      // enableBlinkFeatures: "CSSColorSchemeUARendering"
    },
  });

  // ✅ Carga del frontend (tu caso: sin servidor, archivo local)
  const indexPath = path.join(__dirname, "..", "..", "renderer", "index.html");
  win.loadFile(indexPath);

  // Mostrar cuando está listo (evita pantalla blanca)
  win.once("ready-to-show", () => {
    win.show();
    if (!app.isPackaged) {
      win.webContents.openDevTools({ mode: "detach" });
    }
  });

  // ✅ Abrir links externos en navegador, no dentro de Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Si quieres permitir solo https:
    if (url.startsWith("https://") || url.startsWith("http://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Si alguien intenta navegar fuera del index (por links)
  win.webContents.on("will-navigate", (event, url) => {
    const allowed = url.startsWith("file://");
    if (!allowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Limpieza
  win.on("closed", () => {
    // Si luego guardas referencia global, aquí la limpias
  });

  return win;
}

module.exports = { createMainWindow };

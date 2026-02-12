const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');

function createWindow() {
  // levantar backend
  exec('cd ../backend && npm run dev');
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  });

  win.loadURL('http://localhost:4200');
}

app.whenReady().then(createWindow);

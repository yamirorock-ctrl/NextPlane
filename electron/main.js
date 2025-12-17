process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple demos; usually true in prod with preload
      webSecurity: false, // Allow CORS for Facebook API calls
    },
  });

  // Check if we are in dev mode (looking for the dev server url)
  const devUrl = "http://localhost:5173";

  // In production, we'll probably set an env var or check if we are packaged
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the local index.html
    // We assume the build output is in ../dist relative to this file
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

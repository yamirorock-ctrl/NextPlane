process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic.replace("app.asar", "app.asar.unpacked"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Video Compression Handler
ipcMain.handle("compress-video", async (event, inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      app.getPath("temp"),
      `compressed-${Date.now()}.mp4`
    );

    console.log(`Starting compression: ${inputPath} -> ${outputPath}`);

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-profile:v main", // Better compatibility
        "-crf 28", // Slightly higher quality
        "-preset veryfast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        // Removed explicit mapping to let ffmpeg pick best streams auto
      ])
      .outputOptions(["-c:a aac", "-b:a 128k", "-ac 2", "-ar 44100"])
      .on("end", () => {
        console.log("Compression finished");
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("Compression error:", err);
        reject(err.message);
      })
      .save(outputPath);
  });
});

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

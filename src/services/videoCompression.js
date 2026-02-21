/**
 * Service to handle video compression via Electron IPC
 */
export const compressVideo = async (file) => {
  // 1. Detect Electron Environment
  let ipc = null;
  let electronFs = null;
  let electronPath = null;
  let electronOs = null;

  try {
    if (window.electronAPI) {
      ipc = window.electronAPI;
    } else if (window.require) {
      const electron = window.require("electron");
      ipc = electron.ipcRenderer;
      electronFs = window.require("fs");
      electronPath = window.require("path");
      electronOs = window.require("os");
    }
  } catch (e) {
    console.warn("Electron detection failed", e);
  }

  if (!ipc) {
    console.warn(
      "Video conversion is only available in Electron app. Skipping.",
    );
    return file;
  }

  try {
    const fs = electronFs || window.require?.("fs");
    const path = electronPath || window.require?.("path");
    const os = electronOs || window.require?.("os");

    // 1. Get Input Path (robustly)
    let inputPath = file.path;

    // If file.path is missing (common in modern Electron), write to temp
    if (!inputPath) {
      console.log("No file.path found, writing to temp file...");
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(
        tempDir,
        `upload-temp-${Date.now()}-${file.name}`,
      );

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(tempFilePath, buffer);
      inputPath = tempFilePath;
    }

    console.log("Requesting compression for:", inputPath);

    // 2. Send to Main process
    // We expect the main process to optimize heavily to ensure < 50MB
    const compressedPath = await ipc.invoke("compress-video", inputPath);

    console.log("Compression success, new path:", compressedPath);

    // 3. Read back result (using fs to avoid CSP/Fetch errors with file://)
    // Since we have nodeIntegration: true, we can use fs directly
    const compressedBuffer = fs.readFileSync(compressedPath);
    const blob = new Blob([compressedBuffer], { type: "video/mp4" });

    // Create new File object
    const newFile = new File([blob], file.name, { type: "video/mp4" });

    // Clean up temp input if we created it
    if (file.path !== inputPath) {
      try {
        fs.unlinkSync(inputPath);
      } catch (e) {
        /* ignore */
      }
    }

    return newFile;
  } catch (error) {
    console.error("Compression Logic Failed:", error);
    // Fallback to original file
    return file;
  }
};

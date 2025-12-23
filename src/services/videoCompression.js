/**
 * Service to handle video compression via Electron IPC
 */
export const compressVideo = async (file) => {
  // Check if running in Electron
  const isElectron = window.require && window.require("electron");

  if (!isElectron) {
    console.warn(
      "Video compression is only available in Electron app. Skipping."
    );
    return file;
  }

  try {
    const { ipcRenderer } = window.require("electron");
    const fs = window.require("fs");
    const path = window.require("path");
    const os = window.require("os");

    // 1. Get Input Path (robustly)
    let inputPath = file.path;

    // If file.path is missing (common in modern Electron), write to temp
    if (!inputPath) {
      console.log("No file.path found, writing to temp file...");
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(
        tempDir,
        `upload-temp-${Date.now()}-${file.name}`
      );

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(tempFilePath, buffer);
      inputPath = tempFilePath;
    }

    console.log("Requesting compression for:", inputPath);

    // 2. Send to Main process
    // We expect the main process to optimize heavily to ensure < 50MB
    const compressedPath = await ipcRenderer.invoke(
      "compress-video",
      inputPath
    );

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

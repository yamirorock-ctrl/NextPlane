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

    // We need the full path for ffmpeg. File object in Electron has 'path' property
    const inputPath = file.path;

    if (!inputPath) {
      console.warn("No file path found on File object. Are we in Electron?");
      return file;
    }

    console.log("Requesting compression for:", inputPath);

    // Send to Main process
    const compressedPath = await ipcRenderer.invoke(
      "compress-video",
      inputPath
    );

    console.log("Compression success, new path:", compressedPath);

    // Fetch the local file to create a new Blob/File object
    const response = await fetch(`file://${compressedPath}`);
    const blob = await response.blob();

    // Create new File object
    const newFile = new File([blob], file.name, { type: "video/mp4" });

    // Attach path property again if needed by other electron logic (though uploads usually use blob)
    // Note: 'path' is read-only on File usually, but we can try to define it or just rely on blob
    Object.defineProperty(newFile, "path", {
      value: compressedPath,
      writable: false,
    });

    return newFile;
  } catch (error) {
    console.error("Compression Failed:", error);
    // Fallback to original file
    return file;
  }
};

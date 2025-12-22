/**
 * Simple Video Renderer using Canvas API + MediaRecorder
 */

export const renderVideo = async ({
  images, // Array of image/video URLs
  audioUrl, // URL of audio file (optional)
  audioStartTime = 0, // Start time in seconds
  duration, // Duration per slide in seconds (default 3s)
  textOverlay, // Text to display (e.g., Hook)
  onProgress, // Callback (progress 0-1)
}) => {
  const width = 1080; // Instagram/TikTok Resolution
  const height = 1920;
  const fps = 30;

  // 1. Load Assets (Images OR Videos)
  const loadedMedia = await Promise.all(images.map(loadMedia));

  // Calculate total duration
  let totalDuration;
  if (images.length === 1 && loadedMedia[0].type === "video") {
    // If it's a single video, use its natural duration
    totalDuration = loadedMedia[0].element.duration;
    if (!totalDuration || isNaN(totalDuration)) totalDuration = 10; // Fallback
  } else {
    // Slideshow mode
    const slideDuration = duration || 3;
    totalDuration = images.length * slideDuration;
  }

  // 2. Setup Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 3. Audio Setup (Web Audio API for mixing)
  let audioCtx, source, dest, audioBuffer;

  if (audioUrl) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      dest = audioCtx.createMediaStreamDestination();

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);
      // Loop if audio is shorter than video
      source.loop = true;
    } catch (e) {
      console.warn("Audio load failed", e);
    }
  }

  // 4. Setup Stream & Recorder
  const canvasStream = canvas.captureStream(fps);
  const combinedTracks = [...canvasStream.getVideoTracks()];

  if (dest) {
    combinedTracks.push(...dest.stream.getAudioTracks());
  }

  const combinedStream = new MediaStream(combinedTracks);
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: "video/webm;codecs=vp9", // Chrome/Electron standard
    videoBitsPerSecond: 5000000, // High Quality
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(blob);
      // Cleanup
      if (audioCtx) audioCtx.close();
      loadedMedia.forEach((m) => {
        if (m.type === "video") {
          m.element.pause();
          m.element.src = "";
        }
      });
    };

    recorder.start();
    if (source) {
      // Start audio with offset
      // source.start(when, offset, duration)
      source.start(0, audioStartTime);
    }

    // Start videos (muted)
    loadedMedia.forEach((m) => {
      if (m.type === "video") {
        m.element.currentTime = 0;
        m.element.muted = true;
        m.element.play();
      }
    });

    // 5. Animation Loop
    let startTime = performance.now();

    // Slideshow Config
    const slideDuration = duration || 3;

    const renderFrame = () => {
      // Calculate progress
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        recorder.stop();
        if (source) source.stop();
        return;
      }

      // Draw Background (Black)
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      // Determine content to draw
      if (loadedMedia.length === 1 && loadedMedia[0].type === "video") {
        // Video Mode
        drawImageProp(ctx, loadedMedia[0].element, 0, 0, width, height);
      } else {
        // Slideshow Mode
        const slideIndex =
          Math.floor(elapsed / slideDuration) % loadedMedia.length;
        const currentMedia = loadedMedia[slideIndex];
        drawImageProp(ctx, currentMedia.element, 0, 0, width, height);
      }

      // Overlay Text
      if (textOverlay) {
        ctx.fillStyle = "white";
        ctx.font = "bold 60px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 4;

        // Wrap text
        const words = textOverlay.split(" ");
        let line = "";
        let y = height * 0.25;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > width - 100 && n > 0) {
            ctx.strokeText(line, width / 2, y);
            ctx.fillText(line, width / 2, y);
            line = words[n] + " ";
            y += 70;
          } else {
            line = testLine;
          }
        }
        ctx.strokeText(line, width / 2, y);
        ctx.fillText(line, width / 2, y);
      }

      // Progress callback (optional)
      if (onProgress) onProgress(elapsed / totalDuration);

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  });
};

/**
 * Helper to scale image/video to cover
 */
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
  if (arguments.length === 2) {
    x = y = 0;
    w = ctx.canvas.width;
    h = ctx.canvas.height;
  }

  offsetX = typeof offsetX === "number" ? offsetX : 0.5;
  offsetY = typeof offsetY === "number" ? offsetY : 0.5;

  if (offsetX < 0) offsetX = 0;
  if (offsetY < 0) offsetY = 0;
  if (offsetX > 1) offsetX = 1;
  if (offsetY > 1) offsetY = 1;

  // Supports both Image and Video element properties
  var iw = img.videoWidth || img.width,
    ih = img.videoHeight || img.height,
    r = Math.min(w / iw, h / ih),
    nw = iw * r, // new prop. width
    nh = ih * r, // new prop. height
    cx,
    cy,
    cw,
    ch,
    ar = 1;

  // decide which gap to fill
  if (nw < w) ar = w / nw;
  if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
  nw *= ar;
  nh *= ar;

  // calc source rectangle
  cw = iw / (nw / w);
  ch = ih / (nh / h);

  cx = (iw - cw) * offsetX;
  cy = (ih - ch) * offsetY;

  // make sure source rectangle is valid
  if (cx < 0) cx = 0;
  if (cy < 0) cy = 0;
  if (cw > iw) cw = iw;
  if (ch > ih) ch = ih;

  // fill image in dest. rectangle
  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

// Unified Media Loader (Image or Video)
async function loadMedia(url) {
  const isVideo = url.match(/\.(mp4|webm|mov)$/i) || url.startsWith("blob:");

  if (isVideo) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = url;
      video.crossOrigin = "anonymous";
      video.muted = true; // Required to autoplay without user interaction
      video.loop = true;
      // Wait for metadata to get duration/dimensions
      video.onloadedmetadata = () => {
        resolve({ type: "video", element: video });
      };
      video.onerror = reject;
    });
  } else {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve({ type: "image", element: img });
      img.onerror = reject;
    });
  }
}

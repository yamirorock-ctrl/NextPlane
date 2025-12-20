/**
 * Simple Video Renderer using Canvas API + MediaRecorder
 */

export const renderVideo = async ({
  images, // Array of image URLs
  audioUrl, // URL of audio file (optional)
  duration, // Duration per slide in seconds (default 3s)
  textOverlay, // Text to display (e.g., Hook)
  onProgress, // Callback (progress 0-1)
}) => {
  const width = 1080; // Instagram/TikTok Resolution
  const height = 1920;
  const fps = 30;
  const slideDuration = duration || 3;
  const totalDuration = images.length * slideDuration;

  // 1. Setup Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 2. Load Assets
  const loadedImages = await Promise.all(images.map(loadBitmap));

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
    };

    recorder.start();
    if (source) source.start();

    // 5. Animation Loop
    let startTime = performance.now();
    let frameCount = 0;
    const totalFrames = totalDuration * fps;

    const renderFrame = () => {
      // Calculate progress
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        recorder.stop();
        if (source) source.stop();
        return;
      }

      // Determine current slide
      const slideIndex =
        Math.floor(elapsed / slideDuration) % loadedImages.length;
      const img = loadedImages[slideIndex];
      const nextImg = loadedImages[(slideIndex + 1) % loadedImages.length];

      // Transition logic (simple crossfade for last 0.5s of slide)
      const timeInSlide = elapsed % slideDuration;
      const transitionStart = slideDuration - 0.5;
      let opacity = 1;

      // Draw Background (Black)
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      // Draw Main Image (Cover)
      drawImageProp(ctx, img, 0, 0, width, height);

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
 * Helper to scale image to cover
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

  var iw = img.width,
    ih = img.height,
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

async function loadBitmap(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

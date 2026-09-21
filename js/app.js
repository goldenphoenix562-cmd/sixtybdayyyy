(() => {
  "use strict";

  const CONFIG = window.SITE_CONFIG || {};

  const allScenes = [...document.querySelectorAll(".scene")];
  const flowOrder = ["hero", "lilies", "password", "memories", "letter", "edit-1", "edit-2", "edit-3", "final"];
  const flowScenes = flowOrder
    .map((key) => document.querySelector(`.scene[data-scene="${key}"]`))
    .filter(Boolean);

  const sceneNumber = document.getElementById("sceneNumber");
  const sceneTotal = document.getElementById("sceneTotal");

  const heartTrigger = document.getElementById("heartTrigger");
  const heartCanvas = document.getElementById("heartCanvas");

  const passwordForm = document.getElementById("passwordForm");
  const passwordInput = document.getElementById("passwordInput");
  const passwordMessage = document.getElementById("passwordMessage");

  const letterScene = document.querySelector('[data-scene="letter"]');
  const envelope = document.getElementById("envelope");
  const envelopePrompt = document.getElementById("envelopePrompt");
  const letterDate = document.getElementById("letterDate");
  const letterText = document.getElementById("letterText");
  const letterSignoff = document.getElementById("letterSignoff");

  const memoryStage = document.getElementById("memoryStage");
  const memoryNext = document.getElementById("memoryNext");
  const memoryPrev = document.getElementById("memoryPrev");
  const memoryIndex = document.getElementById("memoryIndex");
  const memoryCaption = document.getElementById("memoryCaption");

  const backgroundMusic = document.getElementById("backgroundMusic");
  const musicToggle = document.getElementById("musicToggle");

  const finalMessage = document.getElementById("finalMessage");
  const editVideos = [...document.querySelectorAll(".edit-video")];

  let currentFlowIndex = 0;
  let currentMemory = 0;
  let musicEnabled = false;
  let heartAnimationPaused = false;

  function updateSceneCounter() {
    if (sceneNumber) {
      sceneNumber.textContent = String(currentFlowIndex + 1).padStart(2, "0");
    }

    if (sceneTotal) {
      sceneTotal.textContent = String(flowScenes.length).padStart(2, "0");
    }
  }

  function updateMusicToggle() {
    if (!musicToggle) return;

    const isPlaying = musicEnabled && backgroundMusic && !backgroundMusic.paused;
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
  }

  function isVideoSceneActive() {
    const activeScene = flowScenes[currentFlowIndex];
    return Boolean(activeScene && activeScene.classList.contains("scene-edit"));
  }

  function pauseMusicForVideo() {
    if (!backgroundMusic) return;

    backgroundMusic.pause();
    updateMusicToggle();
  }

  async function resumeMusicIfAllowed() {
    if (!backgroundMusic || !musicEnabled || isVideoSceneActive()) {
      if (isVideoSceneActive()) {
        pauseMusicForVideo();
      }
      return;
    }

    try {
      await backgroundMusic.play();
    } catch (error) {
      console.warn("Background music could not resume:", error);
    }

    updateMusicToggle();
  }

  async function unlockAudio() {
    if (!backgroundMusic || !CONFIG.music) return;

    backgroundMusic.src = CONFIG.music;
    backgroundMusic.loop = true;
    backgroundMusic.volume = Number(CONFIG.backgroundMusicVolume ?? 0.35);
    musicEnabled = true;

    try {
      await backgroundMusic.play();
    } catch (error) {
      console.warn("Background music could not start on first interaction:", error);
    }

    updateMusicToggle();
  }

  function showScene(index) {
    if (!flowScenes.length) return;

    const safeIndex = Math.max(0, Math.min(index, flowScenes.length - 1));
    stopAllEditVideos();
    currentFlowIndex = safeIndex;

    allScenes.forEach((scene) => {
      const active = flowScenes[safeIndex] === scene;
      scene.classList.toggle("is-active", active);
      scene.setAttribute("aria-hidden", active ? "false" : "true");
    });

    updateSceneCounter();

    const activeScene = flowScenes[safeIndex];

    if (activeScene && activeScene.classList.contains("scene-edit")) {
      prepareEditScene(activeScene);
      pauseMusicForVideo();
    } else {
      resumeMusicIfAllowed();
    }

    if (activeScene && activeScene.dataset.scene === "memories") {
      showMemory(currentMemory);
      updateMemoryButtons();
    }

    if (activeScene && activeScene.dataset.scene === "password") {
      setTimeout(() => passwordInput?.focus(), 120);
    }
  }

  function setPasswordMessage(message, isError = false) {
    if (!passwordMessage) return;
    passwordMessage.textContent = message;
    passwordMessage.classList.toggle("is-error", isError);
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    const expected = String(CONFIG.password ?? "").trim();
    const entered = String(passwordInput?.value ?? "").trim();

    if (!entered) {
      setPasswordMessage("say the little word and I’ll let you in", true);
      passwordInput?.focus();
      return;
    }

    if (entered.toLowerCase() !== expected.toLowerCase()) {
      setPasswordMessage("that isn’t it yet — try again", true);
      if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
      }
      return;
    }

    setPasswordMessage("you found it", false);
    if (passwordInput) {
      passwordInput.value = "";
    }
    setTimeout(() => {
      nextScene();
    }, 420);
  }

  function nextScene() {
    if (currentFlowIndex < flowScenes.length - 1) {
      showScene(currentFlowIndex + 1);
    }
  }

  function previousScene() {
    if (currentFlowIndex > 0) {
      showScene(currentFlowIndex - 1);
    }
  }

  function updateMemoryButtons() {
    if (!memoryNext || !memoryPrev) return;

    const photoTotal = Math.max(1, (Array.isArray(CONFIG.photos) ? CONFIG.photos.length : 0) || 1);
    const isLastPhoto = currentMemory >= photoTotal - 1;

    memoryPrev.innerHTML = '<span>←</span> previous';
    memoryNext.innerHTML = isLastPhoto ? 'continue <span>→</span>' : 'next photo <span>→</span>';
  }

  function createMemories() {
    if (!memoryStage) return;

    const photos = Array.isArray(CONFIG.photos) ? CONFIG.photos : [];
    memoryStage.innerHTML = `
      <div class="memory-card is-visible">
        <img class="memory-image" alt="Photo 1" />
      </div>
    `;

    if (!photos.length) {
      memoryStage.querySelector(".memory-card").innerHTML = '<div class="photo-fallback">Add your photos in assets/images/</div>';
      updateMemoryButtons();
      return;
    }

    memoryStage.dataset.photoCount = String(photos.length);
    memoryStage.addEventListener("click", () => {
      if (currentMemory < photos.length - 1) {
        showMemory(currentMemory + 1);
      } else {
        nextScene();
      }
    }, { once: false });

    showMemory(0);
  }

  function showMemory(index) {
    const photos = Array.isArray(CONFIG.photos) ? CONFIG.photos : [];
    const card = memoryStage?.querySelector(".memory-card");
    const image = memoryStage?.querySelector(".memory-image");
    if (!card || !photos.length) return;

    currentMemory = (index + photos.length) % photos.length;
    card.style.setProperty("--tilt", `${currentMemory % 2 === 0 ? -2 : 2}deg`);
    card.classList.add("is-visible");

    if (image) {
      image.src = photos[currentMemory];
      image.alt = `Photo ${currentMemory + 1}`;
      image.onerror = () => {
        card.innerHTML = `<div class="photo-fallback">Photo ${currentMemory + 1} could not be loaded.</div>`;
      };
    }

    if (memoryIndex) {
      memoryIndex.textContent = String(currentMemory + 1).padStart(2, "0");
    }

    if (memoryCaption) {
      const captions = Array.isArray(CONFIG.photoCaptions) ? CONFIG.photoCaptions : [];
      memoryCaption.textContent = captions[currentMemory] || "A little memory I want to keep forever.";
    }

    updateMemoryButtons();
  }

  function setupFinalMessage() {
    if (!finalMessage) return;

    finalMessage.innerHTML = "";
    const text = String(CONFIG.finalMessage || "").trim();
    if (!text) return;

    text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph.trim();
      finalMessage.appendChild(p);
    });
  }

  function setupLoveLetter() {
    if (letterDate) {
      letterDate.textContent = String(CONFIG.letterDate || "");
    }

    if (letterText) {
      letterText.innerHTML = "";
      const text = String(CONFIG.loveLetter || "").trim();

      text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph.trim();
        letterText.appendChild(p);
      });
    }

    if (letterSignoff) {
      letterSignoff.innerHTML = String(CONFIG.letterSignoff || "");
    }
  }

  function openLoveLetter() {
    if (!letterScene || !envelope) return;

    letterScene.classList.add("is-open");
    envelope.setAttribute("aria-expanded", "true");
    envelope.setAttribute("aria-label", "Love letter opened");
    envelopePrompt?.classList.add("is-hidden");
  }

  function initHeartCanvas() {
    if (!heartCanvas) return;

    const ctx = heartCanvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const heartHint = document.getElementById("heartHint");
    const points = [];
    const layers = 5;
    const pointsPerLayer = 31;

    for (let layer = 0; layer < layers; layer += 1) {
      const z = (layer - (layers - 1) / 2) * 25;
      const depthScale = 1 - Math.abs(z) / 250;

      for (let point = 0; point < pointsPerLayer; point += 1) {
        const t = (point / pointsPerLayer) * Math.PI * 2 + layer * 0.04;

        const x = 10.7 * Math.sin(t) ** 3 * depthScale;
        const y = -(
          8.7 * Math.cos(t) -
          3.7 * Math.cos(2 * t) -
          1.6 * Math.cos(3 * t) -
          0.8 * Math.cos(4 * t)
        );

        points.push({
          x: x * 15,
          y: y * 15,
          z,
          bright: (point + layer) % 4 === 0
        });
      }
    }

    let angle = -0.4;
    let paused = false;
    let dragging = false;
    let moved = false;
    let wasPaused = false;
    let lastX = 0;
    let previousTime = 0;
    let animationFrame = 0;

    function resize() {
      const bounds = heartCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

      heartCanvas.width = Math.round(bounds.width * ratio);
      heartCanvas.height = Math.round(bounds.height * ratio);

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function draw() {
      const width = heartCanvas.clientWidth;
      const height = heartCanvas.clientHeight;

      if (!width || !height) return;

      const fit = Math.min(width, height) / 560;
      const viewer = 430 * fit;
      const sine = Math.sin(angle);
      const cosine = Math.cos(angle);
      const projected = [];

      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, 240 * fit
      );

      glow.addColorStop(0, "rgba(247, 120, 174, .10)");
      glow.addColorStop(1, "rgba(247, 120, 174, 0)");

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (const point of points) {
        const x = point.x * cosine + point.z * sine;
        const z = -point.x * sine + point.z * cosine;
        const perspective = viewer / (viewer - z);

        projected.push({
          x: width / 2 + x * perspective * fit,
          y: height / 2 + point.y * perspective * fit,
          z,
          scale: perspective,
          bright: point.bright
        });
      }

      projected.sort((a, b) => a.z - b.z);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const point of projected) {
        ctx.font = `700 ${Math.max(7, 10 * point.scale * fit)}px ui-monospace, monospace`;
        ctx.fillStyle = point.bright ? "#ffd8e9" : "#f5a7cd";
        ctx.globalAlpha = Math.min(0.96, Math.max(0.22, 0.48 + point.z / 290));
        ctx.fillText("I LOVE YOU", point.x, point.y);
      }

      ctx.globalAlpha = 1;
    }

    function stop() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    function animate(time) {
      const elapsed = Math.min(34, time - (previousTime || time));
      previousTime = time;

      angle += elapsed * 0.00038;
      draw();

      animationFrame = requestAnimationFrame(animate);
    }

    function play() {
      if (paused || animationFrame) return;
      previousTime = 0;
      animationFrame = requestAnimationFrame(animate);
    }

    function setPaused(next) {
      paused = next;

      if (heartHint) {
        heartHint.textContent = paused ? "paused · click to play" : "drag to turn · click to pause";
      }

      if (paused) stop();
      else play();
    }

    heartTrigger?.addEventListener("click", async () => {
      await unlockAudio();
      setPaused(!paused);
    });

    heartCanvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      moved = false;
      wasPaused = paused;
      lastX = event.clientX;
      heartCanvas.setPointerCapture(event.pointerId);
      stop();
    });

    heartCanvas.addEventListener("pointermove", (event) => {
      if (!dragging) return;

      const distance = event.clientX - lastX;
      if (Math.abs(distance) > 0.5) moved = true;
      lastX = event.clientX;
      angle += distance * 0.011;
      draw();
    });

    heartCanvas.addEventListener("pointerup", () => {
      dragging = false;

      if (moved) setPaused(wasPaused);
      else setPaused(!wasPaused);
    });

    heartCanvas.addEventListener("pointercancel", () => {
      dragging = false;
      setPaused(wasPaused);
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(heartCanvas);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();
    play();
  }

  function setupEditVideoNavigation() {
    document.querySelectorAll("[data-edit-prev]").forEach((button) => {
      button.addEventListener("click", () => {
        const scene = button.closest(".scene-edit");
        if (!scene) return;
        const video = scene.querySelector(".edit-video");
        if (!video) return;
        const index = Number(video.dataset.edit ?? 0);
        const targetIndex = Math.max(0, index - 1);
        const targetVideo = editVideos[targetIndex];
        const targetScene = targetVideo?.closest(".scene-edit");
        if (targetScene) {
          showScene(flowScenes.indexOf(targetScene));
        }
      });
    });

    document.querySelectorAll("[data-edit-next]").forEach((button) => {
      button.addEventListener("click", () => {
        const scene = button.closest(".scene-edit");
        if (!scene) return;
        const video = scene.querySelector(".edit-video");
        if (!video) return;
        const index = Number(video.dataset.edit ?? 0);
        if (index >= editVideos.length - 1) {
          nextScene();
          return;
        }
        const targetIndex = Math.min(editVideos.length - 1, index + 1);
        const targetVideo = editVideos[targetIndex];
        const targetScene = targetVideo?.closest(".scene-edit");
        if (targetScene) {
          showScene(flowScenes.indexOf(targetScene));
        }
      });
    });

    document.querySelectorAll("[data-edit-continue]").forEach((button) => {
      button.addEventListener("click", () => {
        const scene = button.closest(".scene-edit");
        if (!scene) return;
        const video = scene.querySelector(".edit-video");
        if (!video) return;
        const index = Number(video.dataset.edit ?? 0);
        if (index < editVideos.length - 1) {
          const nextVideo = editVideos[index + 1];
          const nextSceneElement = nextVideo?.closest(".scene-edit");
          if (nextSceneElement) {
            showScene(flowScenes.indexOf(nextSceneElement));
          }
        } else {
          nextScene();
        }
      });
    });
  }

  function setupEditVideoControls() {
    document.querySelectorAll(".scene-edit").forEach((scene) => {
      const video = scene.querySelector(".edit-video");
      const playButton = scene.querySelector("[data-video-play]");
      const muteButton = scene.querySelector("[data-video-mute]");
      if (!video || !playButton || !muteButton) return;

      const updateControls = () => {
        playButton.textContent = video.paused ? "play" : "pause";
        playButton.setAttribute("aria-label", video.paused ? "Play video" : "Pause video");
        muteButton.textContent = video.muted ? "unmute" : "mute";
        muteButton.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
      };

      playButton.addEventListener("click", () => {
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
        updateControls();
      });

      muteButton.addEventListener("click", () => {
        video.muted = !video.muted;
        updateControls();
        if (!video.paused) {
          video.play().catch(() => {});
        }
      });

      video.addEventListener("play", updateControls);
      video.addEventListener("pause", updateControls);
      video.addEventListener("volumechange", updateControls);
      updateControls();
    });
  }

  function stopAllEditVideos() {
    editVideos.forEach((video) => {
      if (video && !video.paused) {
        video.pause();
      }
    });
  }

  function prepareEditScene(scene) {
    const video = scene?.querySelector(".edit-video");
    if (!video) return;

    const index = Number(video.dataset.edit ?? 0);
    const source = Array.isArray(CONFIG.edits) ? CONFIG.edits[index] : "";
    if (!source) return;

    if (video.dataset.loadedSource !== source) {
      video.src = source;
      video.dataset.loadedSource = source;
      video.load();
    }
    video.muted = Boolean(CONFIG.editVideosMuted);
    video.playsInline = true;
    video.preload = "metadata";
    try {
      video.currentTime = 0;
    } catch (error) {
      console.warn("Edit video could not reset yet:", error);
    }

    const downloadLink = scene.querySelector("[data-video-download]");
    if (downloadLink) {
      downloadLink.href = source;
      downloadLink.setAttribute("download", source.split("/").pop() || `edit-${index + 1}.mp4`);
    }

    const continueButton = scene.querySelector("[data-edit-continue]");
    if (continueButton) {
      continueButton.classList.add("is-hidden");
    }

    if (scene.classList.contains("is-active")) {
      video.play().catch(() => {
        if (continueButton) {
          continueButton.classList.remove("is-hidden");
        }
      });
    }

    video.onended = () => {
      if (continueButton) {
        continueButton.classList.remove("is-hidden");
      }
    };
  }

  if (memoryNext) {
    memoryNext.addEventListener("click", () => {
      const photoCount = Array.isArray(CONFIG.photos) ? CONFIG.photos.length : 0;
      if (currentMemory < photoCount - 1) {
        showMemory(currentMemory + 1);
      } else {
        nextScene();
      }
    });
  }

  if (memoryPrev) {
    memoryPrev.addEventListener("click", () => {
      if (currentMemory > 0) {
        showMemory(currentMemory - 1);
      } else {
        previousScene();
      }
    });
  }

  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      nextScene();
    });
  });

  if (musicToggle && backgroundMusic) {
    musicToggle.addEventListener("click", async () => {
      if (backgroundMusic.paused) {
        musicEnabled = true;
        await unlockAudio();
      } else {
        musicEnabled = false;
        backgroundMusic.pause();
      }
      updateMusicToggle();
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordSubmit);
  }

  if (envelope) {
    envelope.addEventListener("click", openLoveLetter);
  }

  document.addEventListener("keydown", (event) => {
    if (event.target && ["input", "textarea"].includes(event.target.tagName.toLowerCase())) {
      return;
    }

    if (event.key === "ArrowRight") nextScene();
    if (event.key === "ArrowLeft") previousScene();
  });

  function init() {
    if (backgroundMusic && CONFIG.music) {
      backgroundMusic.src = CONFIG.music;
      backgroundMusic.loop = true;
      backgroundMusic.volume = Number(CONFIG.backgroundMusicVolume ?? 0.35);
      backgroundMusic.load();
    }

    createMemories();
    setupLoveLetter();
    setupFinalMessage();
    setupEditVideoNavigation();
    setupEditVideoControls();
    initHeartCanvas();
    updateSceneCounter();
    showScene(0);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
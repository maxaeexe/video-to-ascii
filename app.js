/**
 * ASCII.VIDEO // Minimalist Siyah & Beyaz Video -> ASCII Dönüştürücü
 * Sade, yumuşatılmış hatlara sahip, istemci taraflı video işleme motoru.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. KARAKTER PALETLERİ (RAMPLER)
  // =========================================================================
  const CHAR_PRESETS = {
    detailed: " `.'^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    standard: " .:-=+*#%@",
    blocks: " ░▒▓█",
    minimal: " .·oO@",
    binary: " 01",
    dots: " ·:•*",
    custom: " .:-=+*#%@"
  };

  // Renk Temaları (Siyah/Beyaz ve Gri Tonları)
  const THEME_CONFIG = {
    mono: { char: '#f4f4f5', bg: '#000000' },
    silver: { char: '#d4d4d8', bg: '#050607' },
    darkcharcoal: { char: '#a1a1aa', bg: '#000000' },
    inverted: { char: '#090a0b', bg: '#ffffff' },
    color: { char: null, bg: '#000000' }
  };

  // =========================================================================
  // 2. UYGULAMA DURUMU (STATE)
  // =========================================================================
  const state = {
    // Kaynaklar
    sourceType: 'none', // 'file', 'demo', 'webcam'
    videoUrl: null,
    webcamStream: null,
    demoInterval: null,
    
    // Dönüştürme Parametreleri
    charPresetKey: 'detailed',
    charRamp: CHAR_PRESETS.detailed,
    colorTheme: 'mono',
    cols: 120,
    rows: 60,
    aspectRatioCorrection: 0.55,
    contrast: 1.2,
    brightness: 1.0,
    invert: false,
    sobelEdge: false,
    
    // Görünüm & UI
    viewMode: 'canvas', // 'canvas' | 'text'
    pipVisible: true,
    
    // Kayıt
    isRecording: false,
    mediaRecorder: null,
    recordedChunks: [],
    
    // FPS & Döngü
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: performance.now(),
    animationFrameId: null
  };

  let els = {};
  let canvasCtx = null;
  let offscreenCtx = null;
  let currentAsciiText = '';

  // =========================================================================
  // 3. BAŞLANGIÇ & BAĞLANTILAR
  // =========================================================================
  function init() {
    els = {
      videoInput: document.getElementById('videoInput'),
      dropZone: document.getElementById('dropZone'),
      sampleBtn: document.getElementById('sampleBtn'),
      webcamBtn: document.getElementById('webcamBtn'),
      welcomeStartDemo: document.getElementById('welcomeStartDemo'),
      welcomeOverlay: document.getElementById('welcomeOverlay'),
      
      sourceVideo: document.getElementById('sourceVideo'),
      pipContainer: document.getElementById('pipContainer'),
      closePipBtn: document.getElementById('closePipBtn'),
      pipToggle: document.getElementById('pipToggle'),
      pipLabel: document.getElementById('pipLabel'),
      
      asciiCanvas: document.getElementById('asciiCanvas'),
      asciiPre: document.getElementById('asciiPre'),
      offscreenCanvas: document.getElementById('offscreenCanvas'),
      viewportWrapper: document.getElementById('viewportWrapper'),
      
      tabCanvas: document.getElementById('tabCanvas'),
      tabText: document.getElementById('tabText'),
      fullscreenBtn: document.getElementById('fullscreenBtn'),
      
      charPreset: document.getElementById('charPreset'),
      customCharRow: document.getElementById('customCharRow'),
      customChars: document.getElementById('customChars'),
      colorTheme: document.getElementById('colorTheme'),
      resSlider: document.getElementById('resSlider'),
      resVal: document.getElementById('resVal'),
      contrastSlider: document.getElementById('contrastSlider'),
      contrastVal: document.getElementById('contrastVal'),
      brightnessSlider: document.getElementById('brightnessSlider'),
      brightnessVal: document.getElementById('brightnessVal'),
      aspectSlider: document.getElementById('aspectSlider'),
      aspectVal: document.getElementById('aspectVal'),
      invertCheck: document.getElementById('invertCheck'),
      edgeCheck: document.getElementById('edgeCheck'),
      resetDefaultsBtn: document.getElementById('resetDefaultsBtn'),
      
      recordBtn: document.getElementById('recordBtn'),
      recordText: document.getElementById('recordText'),
      snapFrameBtn: document.getElementById('snapFrameBtn'),
      snapPngBtn: document.getElementById('snapPngBtn'),
      
      playPauseBtn: document.getElementById('playPauseBtn'),
      playIcon: document.getElementById('playIcon'),
      stopBtn: document.getElementById('stopBtn'),
      loopBtn: document.getElementById('loopBtn'),
      progressBar: document.getElementById('progressBar'),
      currentTime: document.getElementById('currentTime'),
      totalTime: document.getElementById('totalTime'),
      muteBtn: document.getElementById('muteBtn'),
      volIcon: document.getElementById('volIcon'),
      volumeSlider: document.getElementById('volumeSlider'),
      speedSelect: document.getElementById('speedSelect'),
      
      fileNameDisplay: document.getElementById('fileNameDisplay'),
      fpsBadge: document.getElementById('fpsBadge'),
      dimBadge: document.getElementById('dimBadge')
    };

    canvasCtx = els.asciiCanvas.getContext('2d', { alpha: false });
    offscreenCtx = els.offscreenCanvas.getContext('2d', { willReadFrequently: true });

    setupEventListeners();
    setupDropZone();
    updateThemeClass();
    updateDimensionsBadge();
  }

  function setupEventListeners() {
    // Dosya & Demo Eylemleri
    els.videoInput.addEventListener('change', handleFileSelect);
    els.sampleBtn.addEventListener('click', startDemoAnimation);
    els.welcomeStartDemo.addEventListener('click', startDemoAnimation);
    els.webcamBtn.addEventListener('click', toggleWebcam);

    // Ayar Kontrolleri
    els.charPreset.addEventListener('change', (e) => {
      state.charPresetKey = e.target.value;
      if (state.charPresetKey === 'custom') {
        els.customCharRow.style.display = 'flex';
        state.charRamp = els.customChars.value || ' .:-=+*#%@';
      } else {
        els.customCharRow.style.display = 'none';
        state.charRamp = CHAR_PRESETS[state.charPresetKey];
      }
      processCurrentFrame();
    });

    els.customChars.addEventListener('input', (e) => {
      if (state.charPresetKey === 'custom') {
        state.charRamp = e.target.value || ' ';
        processCurrentFrame();
      }
    });

    els.colorTheme.addEventListener('change', (e) => {
      state.colorTheme = e.target.value;
      updateThemeClass();
      processCurrentFrame();
    });

    els.resSlider.addEventListener('input', (e) => {
      state.cols = parseInt(e.target.value, 10);
      els.resVal.textContent = `${state.cols} sütun`;
      updateDimensionsBadge();
      processCurrentFrame();
    });

    els.contrastSlider.addEventListener('input', (e) => {
      state.contrast = parseFloat(e.target.value);
      els.contrastVal.textContent = `${state.contrast.toFixed(1)}x`;
      processCurrentFrame();
    });

    els.brightnessSlider.addEventListener('input', (e) => {
      state.brightness = parseFloat(e.target.value);
      els.brightnessVal.textContent = `${state.brightness.toFixed(2)}x`;
      processCurrentFrame();
    });

    els.aspectSlider.addEventListener('input', (e) => {
      state.aspectRatioCorrection = parseFloat(e.target.value);
      els.aspectVal.textContent = state.aspectRatioCorrection.toFixed(2);
      updateDimensionsBadge();
      processCurrentFrame();
    });

    els.invertCheck.addEventListener('change', (e) => {
      state.invert = e.target.checked;
      processCurrentFrame();
    });

    els.edgeCheck.addEventListener('change', (e) => {
      state.sobelEdge = e.target.checked;
      processCurrentFrame();
    });

    // Sekmeler (Canvas vs Saf Metin)
    els.tabCanvas.addEventListener('click', () => switchViewMode('canvas'));
    els.tabText.addEventListener('click', () => switchViewMode('text'));

    // PIP & Tam Ekran
    els.closePipBtn.addEventListener('click', togglePip);
    els.pipToggle.addEventListener('click', togglePip);
    els.fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Sahneye Tıklama ile Oynat / Duraklat
    els.viewportWrapper.addEventListener('click', (e) => {
      if (e.target.closest('#pipContainer') || e.target.closest('.welcome-box button')) return;
      if (state.sourceType !== 'none') {
        togglePlayPause();
      }
    });

    // Oynatıcı Kontrolleri
    els.playPauseBtn.addEventListener('click', togglePlayPause);
    els.stopBtn.addEventListener('click', stopVideo);
    els.loopBtn.addEventListener('click', toggleLoop);
    els.muteBtn.addEventListener('click', toggleMute);
    els.volumeSlider.addEventListener('input', handleVolumeChange);
    els.speedSelect.addEventListener('change', handleSpeedChange);
    els.progressBar.addEventListener('input', handleScrub);

    // Video Olayları
    els.sourceVideo.addEventListener('timeupdate', handleTimeUpdate);
    els.sourceVideo.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
    els.sourceVideo.addEventListener('ended', handleVideoEnded);
    els.sourceVideo.addEventListener('play', () => {
      els.playIcon.textContent = '❚❚';
      startProcessingLoop();
    });
    els.sourceVideo.addEventListener('pause', () => {
      els.playIcon.textContent = '▶';
    });

    // Dışa Aktarma Eylemleri
    els.recordBtn.addEventListener('click', toggleRecording);
    els.snapFrameBtn.addEventListener('click', copyFrameToClipboard);
    els.snapPngBtn.addEventListener('click', saveFrameAsPng);
    els.resetDefaultsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetDefaults();
    });

    // Kısayollar
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    });
  }

  // =========================================================================
  // 4. SÜRÜKLE & BIRAK VE DOSYA YÜKLEME
  // =========================================================================
  function setupDropZone() {
    const dropZone = els.dropZone;
    dropZone.addEventListener('click', () => els.videoInput.click());

    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length && files[0].type.startsWith('video/')) {
        loadVideoFile(files[0]);
      } else {
        alert('Lütfen geçerli bir video dosyası (MP4, WebM, MOV vb.) bırakın.');
      }
    });
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      loadVideoFile(file);
    }
  }

  function loadVideoFile(file) {
    stopCurrentSources();
    state.sourceType = 'file';

    const url = URL.createObjectURL(file);
    state.videoUrl = url;

    els.sourceVideo.src = url;
    els.fileNameDisplay.textContent = file.name;
    hideWelcomeOverlay();

    els.sourceVideo.play().catch(err => {
      console.warn('Otomatik oynatma engellendi, lütfen oynat düğmesine basınız:', err);
    });
  }

  function stopCurrentSources() {
    if (state.webcamStream) {
      state.webcamStream.getTracks().forEach(t => t.stop());
      state.webcamStream = null;
    }
    if (state.demoInterval) {
      clearInterval(state.demoInterval);
      state.demoInterval = null;
    }
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
      state.videoUrl = null;
    }
    els.sourceVideo.pause();
    els.sourceVideo.srcObject = null;
    els.sourceVideo.removeAttribute('src');
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
  }

  function hideWelcomeOverlay() {
    els.welcomeOverlay.classList.add('hidden');
  }

  // =========================================================================
  // 5. SADE MİNİMAL DEMO VİDEO & WEBCAM
  // =========================================================================
  function startDemoAnimation() {
    stopCurrentSources();
    state.sourceType = 'demo';
    hideWelcomeOverlay();
    els.fileNameDisplay.textContent = 'Dahili Demo Animasyonu';

    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 480;
    demoCanvas.height = 360;
    const dctx = demoCanvas.getContext('2d');

    let angle = 0;
    function renderDemo() {
      angle += 0.03;
      // Sade siyah arka plan
      dctx.fillStyle = '#000000';
      dctx.fillRect(0, 0, demoCanvas.width, demoCanvas.height);

      const cx = demoCanvas.width / 2;
      const cy = demoCanvas.height / 2;

      // 3D Dönen Tel Kafes Geometri
      const size = 95 + Math.sin(angle * 1.5) * 12;
      const nodes = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
      ];
      const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7]
      ];

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosB = Math.cos(angle * 0.7);
      const sinB = Math.sin(angle * 0.7);

      const projected = nodes.map(n => {
        let x = n[0] * cosA - n[2] * sinA;
        let z = n[0] * sinA + n[2] * cosA;
        let y = n[1];
        let y2 = y * cosB - z * sinB;
        let z2 = y * sinB + z * cosB;

        const fov = 3.2;
        const depth = fov / (fov + z2 * 0.6);
        return [cx + x * size * depth, cy + y2 * size * depth, depth];
      });

      // Sade Beyaz Çizgiler (Neon Yok)
      dctx.strokeStyle = '#ffffff';
      dctx.lineWidth = 3;
      edges.forEach(e => {
        const p1 = projected[e[0]];
        const p2 = projected[e[1]];
        dctx.beginPath();
        dctx.moveTo(p1[0], p1[1]);
        dctx.lineTo(p2[0], p2[1]);
        dctx.stroke();
      });

      // Yumuşak merkez dairesi
      dctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      dctx.beginPath();
      dctx.arc(cx, cy, 40 + Math.cos(angle * 2) * 10, 0, Math.PI * 2);
      dctx.fill();

      // Sade Başlık Metni
      dctx.fillStyle = '#ffffff';
      dctx.font = '500 18px monospace';
      dctx.textAlign = 'center';
      dctx.fillText('ASCII.VIDEO', cx, demoCanvas.height - 30);
    }

    if (demoCanvas.captureStream) {
      const stream = demoCanvas.captureStream(30);
      els.sourceVideo.srcObject = stream;
      els.sourceVideo.play().catch(e => console.error(e));
      state.demoInterval = setInterval(renderDemo, 1000 / 30);
    } else {
      alert('Tarayıcınız demo akışını desteklemiyor.');
    }
  }

  async function toggleWebcam() {
    if (state.sourceType === 'webcam') {
      stopCurrentSources();
      els.fileNameDisplay.textContent = 'Kamera Kapatıldı';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      stopCurrentSources();
      state.sourceType = 'webcam';
      state.webcamStream = stream;
      els.sourceVideo.srcObject = stream;
      els.sourceVideo.play();
      els.fileNameDisplay.textContent = 'Canlı Kamera';
      hideWelcomeOverlay();
    } catch (err) {
      alert('Kameraya erişilemedi: ' + err.message);
    }
  }

  // =========================================================================
  // 6. GERÇEK ZAMANLI DÖNÜŞTÜRME MOTORU
  // =========================================================================
  function startProcessingLoop() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
    }

    function loop() {
      if (els.sourceVideo.paused || els.sourceVideo.ended) {
        state.animationFrameId = null;
        return;
      }

      processCurrentFrame();
      updateFpsCounter();

      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && state.sourceType !== 'demo') {
        els.sourceVideo.requestVideoFrameCallback(loop);
      } else {
        state.animationFrameId = requestAnimationFrame(loop);
      }
    }

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && state.sourceType !== 'demo') {
      els.sourceVideo.requestVideoFrameCallback(loop);
    } else {
      state.animationFrameId = requestAnimationFrame(loop);
    }
  }

  function processCurrentFrame() {
    const video = els.sourceVideo;
    if (!video.videoWidth || !video.videoHeight) return;

    const cols = state.cols;
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const rows = Math.max(10, Math.floor(cols * (vHeight / vWidth) * state.aspectRatioCorrection));
    state.rows = rows;

    if (els.offscreenCanvas.width !== cols || els.offscreenCanvas.height !== rows) {
      els.offscreenCanvas.width = cols;
      els.offscreenCanvas.height = rows;
      updateDimensionsBadge();
    }

    offscreenCtx.drawImage(video, 0, 0, cols, rows);
    const imgData = offscreenCtx.getImageData(0, 0, cols, rows);
    const data = imgData.data;

    let edgeData = null;
    if (state.sobelEdge) {
      edgeData = computeSobelEdges(data, cols, rows);
    }

    const ramp = state.charRamp;
    const rampMaxIdx = ramp.length - 1;
    const contrast = state.contrast;
    const brightness = state.brightness;
    const invert = state.invert;
    const themeConfig = THEME_CONFIG[state.colorTheme] || THEME_CONFIG.mono;

    if (state.viewMode === 'canvas') {
      renderFrameToCanvas(data, edgeData, cols, rows, ramp, rampMaxIdx, contrast, brightness, invert, themeConfig);
    } else {
      renderFrameToText(data, edgeData, cols, rows, ramp, rampMaxIdx, contrast, brightness, invert);
    }
  }

  function computeSobelEdges(data, width, height) {
    const edges = new Float32Array(width * height);
    const gray = new Float32Array(width * height);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    for (let y = 1; y < height - 1; y++) {
      const yw = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = yw + x;
        const gx = 
          -gray[idx - width - 1] + gray[idx - width + 1] +
          -2 * gray[idx - 1]     + 2 * gray[idx + 1] +
          -gray[idx + width - 1] + gray[idx + width + 1];

        const gy = 
          -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1] +
           gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];

        edges[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return edges;
  }

  // =========================================================================
  // 7. EKRANA ÇİZİM (CANVAS & TEXT)
  // =========================================================================
  function renderFrameToCanvas(data, edgeData, cols, rows, ramp, rampMaxIdx, contrast, brightness, invert, themeConfig) {
    const charW = 7;
    const charH = 12;
    const targetW = cols * charW;
    const targetH = rows * charH;

    if (els.asciiCanvas.width !== targetW || els.asciiCanvas.height !== targetH) {
      els.asciiCanvas.width = targetW;
      els.asciiCanvas.height = targetH;
    }

    // Sade Arka Plan (Neon Yok)
    canvasCtx.fillStyle = themeConfig.bg;
    canvasCtx.fillRect(0, 0, targetW, targetH);

    canvasCtx.font = `500 ${charH - 1}px 'JetBrains Mono', Consolas, monospace`;
    canvasCtx.textBaseline = 'top';

    const isColorTheme = state.colorTheme === 'color';
    if (!isColorTheme) {
      canvasCtx.fillStyle = themeConfig.char;
    }

    let textBuilder = '';

    for (let y = 0; y < rows; y++) {
      const rowOffset = y * cols;
      const posY = y * charH;

      for (let x = 0; x < cols; x++) {
        const pixelIdx = rowOffset + x;
        const dataIdx = pixelIdx * 4;

        let r = data[dataIdx];
        let g = data[dataIdx + 1];
        let b = data[dataIdx + 2];

        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lum = ((lum / 255 - 0.5) * contrast + 0.5) * brightness * 255;
        lum = Math.max(0, Math.min(255, lum));

        if (edgeData) {
          const edgeMag = edgeData[pixelIdx];
          if (edgeMag > 50) {
            lum = Math.min(255, lum + edgeMag * 0.7);
          }
        }

        let rampPos = (lum / 255) * rampMaxIdx;
        let charIdx = Math.round(rampPos);
        if (invert) charIdx = rampMaxIdx - charIdx;
        charIdx = Math.max(0, Math.min(rampMaxIdx, charIdx));

        const char = ramp[charIdx] || ' ';
        textBuilder += char;

        if (char === ' ') continue;

        const posX = x * charW;

        if (isColorTheme) {
          canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
          canvasCtx.fillText(char, posX, posY);
        } else {
          canvasCtx.fillText(char, posX, posY);
        }
      }
      textBuilder += '\n';
    }

    currentAsciiText = textBuilder;
  }

  function renderFrameToText(data, edgeData, cols, rows, ramp, rampMaxIdx, contrast, brightness, invert) {
    let result = '';

    for (let y = 0; y < rows; y++) {
      const rowOffset = y * cols;
      for (let x = 0; x < cols; x++) {
        const pixelIdx = rowOffset + x;
        const dataIdx = pixelIdx * 4;

        let r = data[dataIdx];
        let g = data[dataIdx + 1];
        let b = data[dataIdx + 2];

        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lum = ((lum / 255 - 0.5) * contrast + 0.5) * brightness * 255;
        lum = Math.max(0, Math.min(255, lum));

        if (edgeData) {
          const edgeMag = edgeData[pixelIdx];
          if (edgeMag > 50) {
            lum = Math.min(255, lum + edgeMag * 0.7);
          }
        }

        let rampPos = (lum / 255) * rampMaxIdx;
        let charIdx = Math.round(rampPos);
        if (invert) charIdx = rampMaxIdx - charIdx;
        charIdx = Math.max(0, Math.min(rampMaxIdx, charIdx));

        result += ramp[charIdx] || ' ';
      }
      result += '\n';
    }

    currentAsciiText = result;
    els.asciiPre.textContent = result;
  }

  // =========================================================================
  // 8. GÖRÜNÜM VE ARAYÜZ YÖNETİMİ
  // =========================================================================
  function switchViewMode(mode) {
    state.viewMode = mode;
    if (mode === 'canvas') {
      els.asciiCanvas.style.display = 'block';
      els.asciiPre.style.display = 'none';
      els.tabCanvas.classList.add('active');
      els.tabText.classList.remove('active');
    } else {
      els.asciiCanvas.style.display = 'none';
      els.asciiPre.style.display = 'block';
      els.tabCanvas.classList.remove('active');
      els.tabText.classList.add('active');
    }
    processCurrentFrame();
  }

  function updateThemeClass() {
    document.body.className = `theme-${state.colorTheme}`;
  }

  function togglePip() {
    state.pipVisible = !state.pipVisible;
    els.pipContainer.classList.toggle('hidden', !state.pipVisible);
    els.pipLabel.textContent = `Orijinal: ${state.pipVisible ? 'Açık' : 'Kapalı'}`;
  }

  function toggleFullscreen() {
    const elem = els.viewportWrapper;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function updateDimensionsBadge() {
    els.dimBadge.textContent = `${state.cols} × ${state.rows}`;
  }

  function updateFpsCounter() {
    state.frameCount++;
    const now = performance.now();
    const elapsed = now - state.lastFpsUpdate;

    if (elapsed >= 500) {
      state.fps = Math.round((state.frameCount * 1000) / elapsed);
      els.fpsBadge.textContent = `FPS: ${state.fps}`;
      state.frameCount = 0;
      state.lastFpsUpdate = now;
    }
  }

  // =========================================================================
  // 9. OYNATICI KONTROLLERİ VE SES
  // =========================================================================
  function togglePlayPause() {
    const video = els.sourceVideo;
    if (video.paused || video.ended) {
      video.play().catch(e => console.log('Oynatılamadı:', e));
    } else {
      video.pause();
    }
  }

  function stopVideo() {
    const video = els.sourceVideo;
    video.pause();
    video.currentTime = 0;
    els.progressBar.value = 0;
    els.currentTime.textContent = '00:00';
  }

  function toggleLoop() {
    const video = els.sourceVideo;
    video.loop = !video.loop;
    els.loopBtn.setAttribute('data-active', video.loop ? 'true' : 'false');
  }

  function toggleMute() {
    const video = els.sourceVideo;
    video.muted = !video.muted;
    els.volIcon.textContent = video.muted ? '🔇' : '🔊';
  }

  function handleVolumeChange(e) {
    const val = parseFloat(e.target.value);
    els.sourceVideo.volume = val;
    els.sourceVideo.muted = false;
    els.volIcon.textContent = val === 0 ? '🔇' : '🔊';
  }

  function handleSpeedChange(e) {
    els.sourceVideo.playbackRate = parseFloat(e.target.value);
  }

  function handleScrub(e) {
    const video = els.sourceVideo;
    if (video.duration && isFinite(video.duration)) {
      const targetTime = (parseFloat(e.target.value) / 100) * video.duration;
      video.currentTime = targetTime;
    }
  }

  function handleTimeUpdate() {
    const video = els.sourceVideo;
    if (!video.duration || !isFinite(video.duration)) {
      els.currentTime.textContent = 'CANLI';
      els.totalTime.textContent = 'CANLI';
      els.progressBar.value = 0;
      return;
    }

    const progress = (video.currentTime / video.duration) * 100;
    els.progressBar.value = progress;
    els.currentTime.textContent = formatTime(video.currentTime);
  }

  function handleVideoLoadedMetadata() {
    if (els.sourceVideo.duration && isFinite(els.sourceVideo.duration)) {
      els.totalTime.textContent = formatTime(els.sourceVideo.duration);
    } else {
      els.totalTime.textContent = 'CANLI';
    }
    processCurrentFrame();
  }

  function handleVideoEnded() {
    els.playIcon.textContent = '▶';
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // =========================================================================
  // 10. KAYIT VE DIŞA AKTARMA (WEBM, TEXT, PNG)
  // =========================================================================
  function toggleRecording() {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function startRecording() {
    if (!els.asciiCanvas || els.asciiCanvas.width === 0) {
      alert('Kayıt başlatmak için önce bir video oynatmalısınız.');
      return;
    }

    try {
      const stream = els.asciiCanvas.captureStream(30);

      try {
        const audioTracks = els.sourceVideo.captureStream ? els.sourceVideo.captureStream().getAudioTracks() : [];
        if (audioTracks.length > 0) {
          stream.addTrack(audioTracks[0]);
        }
      } catch (err) {
        console.warn('Ses akışı eklenemedi:', err);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      state.recordedChunks = [];
      state.mediaRecorder = new MediaRecorder(stream, { mimeType });

      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          state.recordedChunks.push(e.data);
        }
      };

      state.mediaRecorder.onstop = saveRecordedVideo;

      state.mediaRecorder.start(100);
      state.isRecording = true;
      els.recordBtn.classList.add('recording');
      els.recordText.textContent = 'Kaydı Durdur ve İndir...';
    } catch (err) {
      alert('Kayıt başlatılamadı: ' + err.message);
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
      state.isRecording = false;
      els.recordBtn.classList.remove('recording');
      els.recordText.textContent = 'ASCII Video Kaydet (WebM)';
    }
  }

  function saveRecordedVideo() {
    const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-video-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function copyFrameToClipboard() {
    if (!currentAsciiText) {
      alert('Kopyalanacak kare bulunamadı.');
      return;
    }
    navigator.clipboard.writeText(currentAsciiText)
      .then(() => {
        const prevText = els.snapFrameBtn.textContent;
        els.snapFrameBtn.textContent = 'Kopyalandı!';
        setTimeout(() => {
          els.snapFrameBtn.textContent = prevText;
        }, 1500);
      })
      .catch(err => {
        alert('Kopyalama başarısız: ' + err);
      });
  }

  function saveFrameAsPng() {
    if (!els.asciiCanvas) return;
    const url = els.asciiCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-frame-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function resetDefaults() {
    state.cols = 120;
    state.contrast = 1.2;
    state.brightness = 1.0;
    state.aspectRatioCorrection = 0.55;
    state.invert = false;
    state.sobelEdge = false;
    state.colorTheme = 'mono';
    state.charPresetKey = 'detailed';
    state.charRamp = CHAR_PRESETS.detailed;

    els.resSlider.value = 120;
    els.resVal.textContent = '120 sütun';
    els.contrastSlider.value = 1.2;
    els.contrastVal.textContent = '1.2x';
    els.brightnessSlider.value = 1.0;
    els.brightnessVal.textContent = '1.0x';
    els.aspectSlider.value = 0.55;
    els.aspectVal.textContent = '0.55';
    els.invertCheck.checked = false;
    els.edgeCheck.checked = false;
    els.colorTheme.value = 'mono';
    els.charPreset.value = 'detailed';
    els.customCharRow.style.display = 'none';

    updateThemeClass();
    updateDimensionsBadge();
    processCurrentFrame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

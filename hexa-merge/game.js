/**
 * HEXA MERGE: 2.5D QUANTUM 2048
 * Complete Production-Quality Hexagonal Drop & Merge Puzzle Engine
 * 3D Beveled Hexagons · Cascade Fusion Reactions · Web Audio API
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     AUDIO SYNTHESIS ENGINE (Web Audio API)
     ══════════════════════════════════════════════════════════════ */
  let audioCtx = null;
  let sfxEnabled = true;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type, val) {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'drop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'merge') {
        const power = Math.log2(val || 4);
        const baseFreq = 261.63; // C4
        const freq = baseFreq * Math.pow(1.12, power);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let gameSave = {
    highScore: 0,
    maxTile: 2
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('hexa_merge_save_v1');
      if (data) gameSave = Object.assign(gameSave, JSON.parse(data));
    } catch (e) {}
  }

  function writeSave() {
    try {
      localStorage.setItem('hexa_merge_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     COLOR SPECTRUM (POWERS OF 2)
     ══════════════════════════════════════════════════════════════ */
  const TILE_COLORS = {
    2: { top: '#00f0d0', side: '#0e7490', text: '#050814' },
    4: { top: '#38bdf8', side: '#0369a1', text: '#050814' },
    8: { top: '#818cf8', side: '#4338ca', text: '#fff' },
    16: { top: '#a855f7', side: '#6b21a8', text: '#fff' },
    32: { top: '#d946ef', side: '#86198f', text: '#fff' },
    64: { top: '#ff2a85', side: '#9f1239', text: '#fff' },
    128: { top: '#f43f5e', side: '#9f1239', text: '#fff' },
    256: { top: '#f97316', side: '#9a3412', text: '#fff' },
    512: { top: '#facc15', side: '#854d0e', text: '#050814' },
    1024: { top: '#10b981', side: '#065f46', text: '#fff' },
    2048: { top: '#e11d48', side: '#4c0519', text: '#fff' }
  };

  /* ══════════════════════════════════════════════════════════════
     ENGINE VARIABLES
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let gameState = 'menu'; // 'menu', 'playing', 'gameover'

  const COLS = 5;
  const ROWS = 7;
  const hexRadius = 32;

  let grid = []; // 2D array [row][col] (null or tile object)
  let nextTileVal = 2;
  let activeDropCol = 2;
  let score = 0;
  let screenShake = 0;
  let particles = [];
  let isDropping = false;
  let lastTimestamp = 0;

  /* ══════════════════════════════════════════════════════════════
     CANVAS SIZING
     ══════════════════════════════════════════════════════════════ */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resize);

  function getHexScreenPos(c, r) {
    const originX = width / 2 - ((COLS - 1) * (hexRadius * 1.6)) / 2;
    const originY = height * 0.26;
    const x = originX + c * (hexRadius * 1.7);
    const y = originY + r * (hexRadius * 1.5) + (c % 2) * (hexRadius * 0.75);
    return { x, y };
  }

  /* ══════════════════════════════════════════════════════════════
     BOARD INIT & LOGIC
     ══════════════════════════════════════════════════════════════ */
  function initBoard() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = null;
      }
    }
    score = 0;
    generateNextTile();
    updateHUD();
  }

  function generateNextTile() {
    const values = [2, 4, 8, 16];
    nextTileVal = values[Math.floor(Math.random() * values.length)];
    document.getElementById('nextTileVal').textContent = nextTileVal;
    const cObj = TILE_COLORS[nextTileVal] || TILE_COLORS[2];
    document.getElementById('nextTileVal').style.color = cObj.top;
  }

  function dropTile(col) {
    if (isDropping || gameState !== 'playing') return;

    // Find lowest empty row in this column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][col]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      // Column full!
      return;
    }

    isDropping = true;
    playSound('drop');

    grid[targetRow][col] = {
      val: nextTileVal,
      scale: 0.2
    };

    // Pop animation
    setTimeout(() => {
      if (grid[targetRow][col]) grid[targetRow][col].scale = 1.0;
      processMerges(targetRow, col, () => {
        isDropping = false;
        generateNextTile();
        checkGameOver();
      });
    }, 80);
  }

  /* ══════════════════════════════════════════════════════════════
     AUTO-MERGE CASCADE ENGINE
     ══════════════════════════════════════════════════════════════ */
  function processMerges(startR, startC, onComplete) {
    let mergedAny = false;
    const tile = grid[startR][startC];
    if (!tile) {
      if (onComplete) onComplete();
      return;
    }

    const val = tile.val;
    const neighbors = getNeighbors(startR, startC);
    const matchingNeighbors = neighbors.filter(n => grid[n.r][n.c] && grid[n.r][n.c].val === val);

    if (matchingNeighbors.length >= 1) {
      mergedAny = true;
      playSound('merge', val * 2);
      screenShake = 10;

      // New upgraded tile
      tile.val = val * 2;
      score += tile.val;
      updateHUD();

      // Clear matching neighbors
      matchingNeighbors.forEach(n => {
        grid[n.r][n.c] = null;
        spawnParticles(getHexScreenPos(n.c, n.r));
      });

      // Chain reaction check
      setTimeout(() => {
        processMerges(startR, startC, onComplete);
      }, 140);
    } else {
      if (onComplete) onComplete();
    }
  }

  function getNeighbors(r, c) {
    const isOdd = c % 2 !== 0;
    const diffs = isOdd ? [
      { r: -1, c: 0 }, { r: 1, c: 0 },
      { r: 0, c: -1 }, { r: 1, c: -1 },
      { r: 0, c: 1 }, { r: 1, c: 1 }
    ] : [
      { r: -1, c: 0 }, { r: 1, c: 0 },
      { r: -1, c: -1 }, { r: 0, c: -1 },
      { r: -1, c: 1 }, { r: 0, c: 1 }
    ];

    return diffs
      .map(d => ({ r: r + d.r, c: c + d.c }))
      .filter(n => n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS);
  }

  function spawnParticles(pos) {
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 140 + 40;
      particles.push({
        x: pos.x, y: pos.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: '#00f0d0',
        size: Math.random() * 3 + 1,
        life: 0.4,
        maxLife: 0.4
      });
    }
  }

  function checkGameOver() {
    let allFull = true;
    for (let c = 0; c < COLS; c++) {
      if (!grid[0][c]) {
        allFull = false;
        break;
      }
    }
    if (allFull) {
      gameState = 'gameover';
      writeSave();
      document.getElementById('goScore').textContent = score;
      document.getElementById('gameOverModal').classList.add('open');
    }
  }

  function updateHUD() {
    document.getElementById('currentScore').textContent = score;
    const best = Math.max(score, gameSave.highScore);
    document.getElementById('highScore').textContent = best;
  }

  /* ══════════════════════════════════════════════════════════════
     2.5D RENDER LOOP
     ══════════════════════════════════════════════════════════════ */
  function render() {
    ctx.save();
    if (screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    ctx.clearRect(0, 0, width, height);

    // Grid Slots (Empty & Filled)
    drawHexGrid();

    // Aim Indicator Drop Arrow
    if (gameState === 'playing') {
      const pos = getHexScreenPos(activeDropCol, 0);
      ctx.save();
      ctx.fillStyle = '#00f0d0';
      ctx.shadowColor = '#00f0d0';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 45);
      ctx.lineTo(pos.x - 12, pos.y - 60);
      ctx.lineTo(pos.x + 12, pos.y - 60);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Particles
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  function drawHexGrid() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const pos = getHexScreenPos(c, r);
        const tile = grid[r][c];

        if (tile) {
          // Draw 3D Beveled Hexagon Tile
          draw3DHexagon(pos.x, pos.y, hexRadius, tile.val, tile.scale || 1.0);
        } else {
          // Empty Slot Outline
          drawHexPath(pos.x, pos.y, hexRadius);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
  }

  function drawHexPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function draw3DHexagon(x, y, r, val, scale) {
    const cObj = TILE_COLORS[val] || TILE_COLORS[2];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Cast Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    drawHexPath(0, 8, r);
    ctx.fill();

    // 2.5D Extruded Depth Bevel
    ctx.fillStyle = cObj.side;
    drawHexPath(0, 4, r);
    ctx.fill();

    // Glossy Top Face
    ctx.fillStyle = cObj.top;
    ctx.shadowColor = cObj.top;
    ctx.shadowBlur = 16;
    drawHexPath(0, 0, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Number Text
    ctx.fillStyle = cObj.text;
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val, 0, 1);

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     USER CONTROLS
     ══════════════════════════════════════════════════════════════ */
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const originX = width / 2 - ((COLS - 1) * (hexRadius * 1.6)) / 2;
    const colW = hexRadius * 1.7;
    const col = Math.max(0, Math.min(COLS - 1, Math.round((mx - originX) / colW)));
    activeDropCol = col;
  });

  canvas.addEventListener('click', () => {
    dropTile(activeDropCol);
  });

  /* ══════════════════════════════════════════════════════════════
     ENGINE LOOP & INIT
     ══════════════════════════════════════════════════════════════ */
  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(0.04, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    // Particles decay
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    if (screenShake > 0) screenShake *= 0.88;

    render();
    requestAnimationFrame(loop);
  }

  document.getElementById('startMergeBtn').addEventListener('click', () => {
    gameState = 'playing';
    document.getElementById('menuModal').classList.remove('open');
    initBoard();
  });

  document.getElementById('retryBtn').addEventListener('click', () => {
    gameState = 'playing';
    document.getElementById('gameOverModal').classList.remove('open');
    initBoard();
  });

  const sfxBtn = document.getElementById('sfxBtn');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      sfxBtn.classList.toggle('active', sfxEnabled);
      sfxBtn.textContent = sfxEnabled ? '🔊 SFX' : '🔇 SFX';
    });
  }

  loadSave();
  resize();
  document.getElementById('menuModal').classList.add('open');
  requestAnimationFrame(loop);

}());

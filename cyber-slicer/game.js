/**
 * CYBER SLICER: NEON BLADE
 * High-Octane Kinetic Cyberpunk Slicing Engine
 * 100% Vanilla HTML5 Canvas & Web Audio API
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

  function playSound(type, param) {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'swoosh') {
        // Param is speed normalized (0.2 to 1.5)
        const speed = Math.max(0.3, Math.min(1.8, param || 1));
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 * speed, now);
        osc.frequency.exponentialRampToValueAtTime(560 * speed, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'slice') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'combo') {
        // Pentatonic chord burst
        const notes = [440, 554.37, 659.25, 830.61];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.04);
          g.gain.setValueAtTime(0.06, now + i * 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.2);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.04);
          o.stop(now + i * 0.04 + 0.22);
        });
      } else if (type === 'bomb') {
        // Deep explosion
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
        osc.start(now);
        osc.stop(now + 0.46);
      } else if (type === 'slowmo') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let gameSave = {
    credits: 0,
    equippedBlade: 'cyan',
    unlockedBlades: ['cyan'],
    highScores: { arcade: 0, zen: 0, hyper: 0 }
  };

  const BLADES = {
    cyan: { name: 'Cyan Plasma', color: '#00f0d0', glow: 'rgba(0, 240, 208, 0.6)', price: 0 },
    crimson: { name: 'Crimson Katana', color: '#ff2a85', glow: 'rgba(255, 42, 133, 0.6)', price: 500 },
    solar: { name: 'Solar Arc', color: '#facc15', glow: 'rgba(250, 204, 21, 0.6)', price: 1200 },
    void: { name: 'Void Shadow', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)', price: 2500 }
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('cyber_slicer_save_v1');
      if (data) {
        gameSave = Object.assign(gameSave, JSON.parse(data));
      }
    } catch (e) {}
    updateHudCredits();
  }

  function writeSave() {
    try {
      localStorage.setItem('cyber_slicer_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
    updateHudCredits();
  }

  function updateHudCredits() {
    const el = document.getElementById('creditsVal');
    if (el) el.textContent = gameSave.credits || 0;
  }

  /* ══════════════════════════════════════════════════════════════
     GAME VARIABLES & CONSTANTS
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let gameState = 'menu'; // 'menu', 'playing', 'gameover'
  let currentMode = 'arcade'; // 'arcade', 'zen', 'hyper'
  let isPaused = false;

  let score = 0;
  let lives = 3;
  let timeLeft = 60; // Zen mode timer
  let comboCount = 0;
  let comboTimer = 0;
  let timeScale = 1.0;
  let slowMoTimer = 0;
  let screenShake = 0;

  let objects = [];
  let slicedPieces = [];
  let particles = [];
  let floatingTexts = [];
  let trailPoints = []; // Blade swipe points [{x, y, time}]

  let spawnTimer = 0;
  let spawnInterval = 1.4;
  let lastTimestamp = 0;
  let isPointerDown = false;

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

  /* ══════════════════════════════════════════════════════════════
     PHYSICS OBJECTS & TARGET SPAWNER
     ══════════════════════════════════════════════════════════════ */
  function spawnBatch() {
    const count = currentMode === 'hyper' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < count; i++) {
      spawnTarget();
    }
  }

  function spawnTarget() {
    // Types: 'cube' (cyan), 'sphere' (magenta), 'chrono' (yellow time-slow), 'bomb' (hazard)
    let type = 'cube';
    const rand = Math.random();

    if (currentMode !== 'zen' && rand < 0.22) {
      type = 'bomb';
    } else if (rand < 0.32) {
      type = 'chrono';
    } else if (rand < 0.55) {
      type = 'sphere';
    }

    const radius = 30 + Math.random() * 10;
    const x = Math.random() * (width - 200) + 100;
    const y = height + radius + 10;

    // Velocity towards center arc
    const targetX = width * 0.5 + (Math.random() - 0.5) * (width * 0.4);
    const vx = (targetX - x) / 1.6;
    const vy = -(Math.random() * 160 + (height * 0.95)); // Launch power

    objects.push({
      x, y, vx, vy,
      radius,
      type,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 4,
      sliced: false
    });
  }

  /* ══════════════════════════════════════════════════════════════
     INTERSECTION & SLICE CALCULATION
     ══════════════════════════════════════════════════════════════ */
  function checkBladeIntersections(p1, p2) {
    let slicedThisStroke = 0;

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj.sliced) continue;

      // Distance from point to line segment
      const dist = distToSegment({ x: obj.x, y: obj.y }, p1, p2);
      if (dist < obj.radius) {
        obj.sliced = true;
        slicedThisStroke++;

        if (obj.type === 'bomb') {
          handleBombHit(obj);
        } else {
          handleTargetSliced(obj, p1, p2);
        }
      }
    }

    if (slicedThisStroke > 0) {
      // Blade speed sound
      const swipeSpeed = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      playSound('swoosh', swipeSpeed / 50);

      if (slicedThisStroke >= 3) {
        triggerCombo(slicedThisStroke);
      }
    }
  }

  function distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  function handleTargetSliced(obj, p1, p2) {
    playSound('slice');
    const cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    let pts = 10;
    let color = '#00f0d0';

    if (obj.type === 'sphere') {
      pts = 25;
      color = '#ff2a85';
    } else if (obj.type === 'chrono') {
      pts = 50;
      color = '#facc15';
      triggerSlowMo();
    }

    score += pts;
    gameSave.credits += Math.ceil(pts / 5);
    updateHudCredits();

    // Spawn 2 split halves
    const sepSpeed = 120;
    const nx = Math.cos(cutAngle + Math.PI / 2);
    const ny = Math.sin(cutAngle + Math.PI / 2);

    slicedPieces.push({
      x: obj.x, y: obj.y,
      vx: obj.vx + nx * sepSpeed,
      vy: obj.vy + ny * sepSpeed - 40,
      radius: obj.radius * 0.8,
      rotation: obj.rotation,
      vRot: obj.vRot - 3,
      color: color,
      type: obj.type,
      half: 1,
      alpha: 1
    });

    slicedPieces.push({
      x: obj.x, y: obj.y,
      vx: obj.vx - nx * sepSpeed,
      vy: obj.vy - ny * sepSpeed - 40,
      radius: obj.radius * 0.8,
      rotation: obj.rotation,
      vRot: obj.vRot + 3,
      color: color,
      type: obj.type,
      half: 2,
      alpha: 1
    });

    // Particle Burst
    for (let j = 0; j < 25; j++) {
      const spd = Math.random() * 240 + 60;
      const ang = Math.random() * Math.PI * 2;
      particles.push({
        x: obj.x, y: obj.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: color,
        size: Math.random() * 3 + 1.5,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }

    // Floating text
    floatingTexts.push({
      x: obj.x, y: obj.y,
      text: `+${pts}`,
      color: color,
      life: 0.8,
      vy: -60
    });

    document.getElementById('currentScore').textContent = score;
  }

  function handleBombHit(obj) {
    playSound('bomb');
    screenShake = 18;

    // Red screen flash
    for (let j = 0; j < 45; j++) {
      const spd = Math.random() * 300 + 80;
      const ang = Math.random() * Math.PI * 2;
      particles.push({
        x: obj.x, y: obj.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: '#ff2a85',
        size: Math.random() * 4 + 2,
        life: 0.8,
        maxLife: 0.8
      });
    }

    if (currentMode === 'arcade') {
      lives--;
      updateLivesDisplay();
      if (lives <= 0) {
        gameOver();
      }
    }
  }

  function triggerCombo(count) {
    playSound('combo');
    const bonus = count * 25;
    score += bonus;
    gameSave.credits += count * 5;
    writeSave();

    const banner = document.getElementById('comboBanner');
    if (banner) {
      banner.textContent = `${count}X CYBER SLICE! +${bonus}`;
      banner.classList.add('active');
      clearTimeout(banner.timer);
      banner.timer = setTimeout(() => banner.classList.remove('active'), 1400);
    }
  }

  function triggerSlowMo() {
    playSound('slowmo');
    timeScale = 0.35;
    slowMoTimer = 4.0; // 4 seconds in real-time
  }

  function updateLivesDisplay() {
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById(`heart${i}`);
      if (heart) {
        heart.classList.toggle('lost', i > lives);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     GAME LOOP & UPDATE
     ══════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (gameState !== 'playing') return;

    // Slow-mo decay
    if (slowMoTimer > 0) {
      slowMoTimer -= dt;
      if (slowMoTimer <= 0) timeScale = 1.0;
    }

    const simDt = dt * timeScale;

    // Spawner
    spawnTimer -= simDt;
    if (spawnTimer <= 0) {
      spawnBatch();
      spawnInterval = Math.max(0.65, spawnInterval - 0.01);
      spawnTimer = spawnInterval;
    }

    // Zen Mode Timer
    if (currentMode === 'zen') {
      timeLeft -= dt;
      const min = Math.floor(Math.max(0, timeLeft) / 60);
      const sec = Math.floor(Math.max(0, timeLeft) % 60);
      document.getElementById('timerVal').textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
      if (timeLeft <= 0) {
        gameOver();
        return;
      }
    }

    // Gravity
    const gravity = 480;

    // Update active targets
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.x += obj.vx * simDt;
      obj.y += obj.vy * simDt;
      obj.vy += gravity * simDt;
      obj.rotation += obj.vRot * simDt;

      // Missed targets in Arcade mode (cubes only)
      if (obj.y > height + 80 && obj.vy > 0) {
        if (!obj.sliced && obj.type !== 'bomb' && currentMode === 'arcade') {
          lives--;
          updateLivesDisplay();
          if (lives <= 0) {
            gameOver();
            return;
          }
        }
        objects.splice(i, 1);
      } else if (obj.sliced) {
        objects.splice(i, 1);
      }
    }

    // Update sliced pieces
    for (let i = slicedPieces.length - 1; i >= 0; i--) {
      const p = slicedPieces[i];
      p.x += p.vx * simDt;
      p.y += p.vy * simDt;
      p.vy += gravity * simDt;
      p.rotation += p.vRot * simDt;
      p.alpha -= simDt * 0.8;

      if (p.y > height + 100 || p.alpha <= 0) {
        slicedPieces.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Update floating score texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Prune old blade trail points
    const now = performance.now();
    trailPoints = trailPoints.filter(p => now - p.time < 180);

    // Screen Shake decay
    if (screenShake > 0) screenShake *= 0.88;
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER LOOP
     ══════════════════════════════════════════════════════════════ */
  function render() {
    ctx.save();

    // Apply Screen Shake
    if (screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
    }

    ctx.clearRect(0, 0, width, height);

    // Draw Cyber Background Grid
    drawGrid();

    // Draw Sliced Pieces
    slicedPieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;

      // Draw semi-cut polygon
      ctx.beginPath();
      if (p.half === 1) {
        ctx.arc(0, 0, p.radius, 0, Math.PI);
      } else {
        ctx.arc(0, 0, p.radius, Math.PI, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Draw Active Targets
    objects.forEach(obj => {
      if (obj.sliced) return;

      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);

      if (obj.type === 'bomb') {
        // Skull Bomb
        ctx.shadowColor = '#ff2a85';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ff2a85';
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 0);
      } else if (obj.type === 'chrono') {
        // Chrono Time Warp
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⌛', 0, 0);
      } else if (obj.type === 'sphere') {
        // Quantum Sphere
        ctx.shadowColor = '#ff2a85';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255, 42, 133, 0.25)';
        ctx.strokeStyle = '#ff2a85';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Data Cube (Cyan)
        ctx.shadowColor = '#00f0d0';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(0, 240, 208, 0.2)';
        ctx.strokeStyle = '#00f0d0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const r = obj.radius;
        ctx.rect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
        ctx.fill();
        ctx.stroke();

        // Inner cross
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.8, 0);
        ctx.moveTo(0, -r * 0.8); ctx.lineTo(0, r * 0.8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    });

    // Draw Particles
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Floating Texts
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / 0.8);
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Draw Glowing Blade Trail
    drawBladeTrail();

    ctx.restore();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 240, 208, 0.04)';
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }

  function drawBladeTrail() {
    if (trailPoints.length < 2) return;

    const blade = BLADES[gameSave.equippedBlade] || BLADES.cyan;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < trailPoints.length; i++) {
      const p1 = trailPoints[i - 1];
      const p2 = trailPoints[i];
      const ageRatio = i / trailPoints.length;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      // Outer Glow
      ctx.strokeStyle = blade.color;
      ctx.shadowColor = blade.color;
      ctx.shadowBlur = 24 * ageRatio;
      ctx.lineWidth = 12 * ageRatio;
      ctx.globalAlpha = ageRatio * 0.7;
      ctx.stroke();

      // Inner White Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4 * ageRatio;
      ctx.globalAlpha = ageRatio;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     USER INPUT & BLADE SWIPE TRACKING
     ══════════════════════════════════════════════════════════════ */
  function addTrailPoint(x, y) {
    const pt = { x, y, time: performance.now() };
    trailPoints.push(pt);

    if (trailPoints.length >= 2 && gameState === 'playing') {
      const pPrev = trailPoints[trailPoints.length - 2];
      checkBladeIntersections(pPrev, pt);
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    trailPoints = [];
    addTrailPoint(e.clientX, e.clientY);
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    addTrailPoint(e.clientX, e.clientY);
  });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
  });

  /* ══════════════════════════════════════════════════════════════
     GAME FLOW CONTROLS
     ══════════════════════════════════════════════════════════════ */
  function startGame(mode) {
    currentMode = mode || 'arcade';
    gameState = 'playing';
    score = 0;
    lives = 3;
    timeLeft = 60;
    objects = [];
    slicedPieces = [];
    particles = [];
    trailPoints = [];
    spawnInterval = 1.4;
    spawnTimer = 0.5;
    timeScale = 1.0;

    document.getElementById('currentScore').textContent = '0';
    updateLivesDisplay();

    // Mode-specific HUD elements
    document.getElementById('livesRow').style.display = currentMode === 'arcade' ? 'flex' : 'none';
    document.getElementById('timerBox').style.display = currentMode === 'zen' ? 'block' : 'none';

    isPaused = false;
    const pauseModal = document.getElementById('pauseModal');
    if (pauseModal) pauseModal.classList.remove('open');
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ PAUSE';

    document.getElementById('menuModal').classList.remove('open');
    document.getElementById('gameOverModal').classList.remove('open');
  }

  function gameOver() {
    gameState = 'gameover';
    writeSave();

    // Update High Score
    const prevBest = gameSave.highScores[currentMode] || 0;
    if (score > prevBest) {
      gameSave.highScores[currentMode] = score;
      writeSave();
    }

    document.getElementById('goScore').textContent = score;
    document.getElementById('goBest').textContent = Math.max(score, prevBest);
    document.getElementById('goCredits').textContent = `+${Math.floor(score / 5)} 💎`;

    document.getElementById('gameOverModal').classList.add('open');
  }

  /* ══════════════════════════════════════════════════════════════
     MAIN ENGINE LOOP
     ══════════════════════════════════════════════════════════════ */
  function togglePause() {
    if (gameState !== 'playing') return;
    isPaused = !isPaused;
    const pauseModal = document.getElementById('pauseModal');
    const pauseBtn = document.getElementById('pauseBtn');
    if (isPaused) {
      if (pauseModal) pauseModal.classList.add('open');
      if (pauseBtn) pauseBtn.textContent = '▶ RESUME';
    } else {
      if (pauseModal) pauseModal.classList.remove('open');
      if (pauseBtn) pauseBtn.textContent = '⏸️ PAUSE';
      lastTimestamp = performance.now();
    }
  }

  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(0.04, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    if (gameState === 'playing' && !isPaused) {
      update(dt);
    }
    render();

    requestAnimationFrame(loop);
  }

  /* ══════════════════════════════════════════════════════════════
     ARSENAL SHOP LOGIC
     ══════════════════════════════════════════════════════════════ */
  function renderArsenal() {
    const grid = document.getElementById('arsenalGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(BLADES).forEach(id => {
      const blade = BLADES[id];
      const isUnlocked = gameSave.unlockedBlades.includes(id);
      const isEquipped = gameSave.equippedBlade === id;

      const card = document.createElement('div');
      card.className = `blade-card ${isEquipped ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      card.innerHTML = `
        <div class="blade-name">${blade.name}</div>
        <div class="blade-aura" style="background:${blade.color}; box-shadow: 0 0 10px ${blade.glow}"></div>
        <div class="blade-price">${isEquipped ? '✓ EQUIPPED' : isUnlocked ? 'EQUIP' : `${blade.price} 💎`}</div>
      `;

      card.addEventListener('click', () => {
        if (isUnlocked) {
          gameSave.equippedBlade = id;
          writeSave();
          renderArsenal();
        } else if (gameSave.credits >= blade.price) {
          gameSave.credits -= blade.price;
          gameSave.unlockedBlades.push(id);
          gameSave.equippedBlade = id;
          writeSave();
          renderArsenal();
        }
      });

      grid.appendChild(card);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     EVENT BINDINGS & INIT
     ══════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentMode = card.getAttribute('data-mode');
    });
  });

  document.getElementById('startPlayBtn').addEventListener('click', () => {
    startGame(currentMode);
  });

  document.getElementById('playAgainBtn').addEventListener('click', () => {
    startGame(currentMode);
  });

  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('gameOverModal').classList.remove('open');
    document.getElementById('menuModal').classList.add('open');
  });

  // Arsenal Modal
  const arsenalBtn = document.getElementById('arsenalBtn');
  const arsenalModal = document.getElementById('arsenalModal');
  const closeArsenalBtn = document.getElementById('closeArsenalBtn');

  if (arsenalBtn && arsenalModal) {
    arsenalBtn.addEventListener('click', () => {
      renderArsenal();
      arsenalModal.classList.add('open');
    });
    closeArsenalBtn.addEventListener('click', () => {
      arsenalModal.classList.remove('open');
    });
  }

  // Audio Toggle
  const sfxBtn = document.getElementById('sfxBtn');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      sfxBtn.classList.toggle('active', sfxEnabled);
      sfxBtn.textContent = sfxEnabled ? '🔊 SFX' : '🔇 SFX';
    });
  }

  // Pause Controls
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

  const resumeBtn = document.getElementById('resumeBtn');
  if (resumeBtn) resumeBtn.addEventListener('click', togglePause);

  const pauseRestartBtn = document.getElementById('pauseRestartBtn');
  if (pauseRestartBtn) {
    pauseRestartBtn.addEventListener('click', () => {
      togglePause();
      startGame(currentMode);
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'playing') {
      togglePause();
    }
  });

  loadSave();
  resize();
  document.getElementById('menuModal').classList.add('open');
  requestAnimationFrame(loop);

}());

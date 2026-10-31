/**
 * GRAVITY ORBIT: 2.5D PLANETARY SLINGSHOT
 * Complete Production-Quality Orbital Physics Puzzle Engine
 * N-Body Gravitational Dynamics · Trajectory Prediction · Web Audio API
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

  function playSound(type) {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'launch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'relic') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'beacon') {
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.07);
          g.gain.setValueAtTime(0.07, now + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.07);
          o.stop(now + i * 0.07 + 0.36);
        });
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.start(now);
        osc.stop(now + 0.36);
      }
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let gameSave = {
    unlockedSector: 1,
    relicsCollected: 0
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('gravity_orbit_save_v1');
      if (data) gameSave = Object.assign(gameSave, JSON.parse(data));
    } catch (e) {}
  }

  function writeSave() {
    try {
      localStorage.setItem('gravity_orbit_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     ENGINE & SECTORS
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let gameState = 'menu'; // 'menu', 'aiming', 'flying', 'victory', 'crashed'
  let currentSector = 1;

  // Probe
  let probe = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 7,
    trail: []
  };

  let launchPad = { x: 120, y: 300 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragCurrent = { x: 0, y: 0 };

  let planets = [];
  let relics = [];
  let targetBeacon = { x: 0, y: 0, radius: 24 };
  let particles = [];
  let screenShake = 0;
  let lastTimestamp = 0;

  const G = 1800; // Gravitational constant

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
     SECTOR GENERATOR (25 SECTORS)
     ══════════════════════════════════════════════════════════════ */
  function loadSector(sec) {
    currentSector = sec;
    planets = [];
    relics = [];
    particles = [];

    launchPad = { x: width * 0.14, y: height * 0.5 };
    targetBeacon = { x: width * 0.86, y: height * 0.5, radius: 26 };

    resetProbe();

    // Procedural Planets based on sector
    if (sec === 1) {
      // Single Gas Giant
      planets.push({
        x: width * 0.5,
        y: height * 0.5,
        radius: 48,
        mass: 320,
        colorA: '#f59e0b',
        colorB: '#78350f',
        hasRings: true
      });
      relics.push({ x: width * 0.5, y: height * 0.25, collected: false });
      relics.push({ x: width * 0.5, y: height * 0.75, collected: false });
    } else if (sec === 2) {
      // Binary Planets
      planets.push({ x: width * 0.42, y: height * 0.35, radius: 36, mass: 220, colorA: '#06b6d4', colorB: '#0e7490' });
      planets.push({ x: width * 0.58, y: height * 0.65, radius: 42, mass: 260, colorA: '#a855f7', colorB: '#581c87' });
      relics.push({ x: width * 0.5, y: height * 0.5, collected: false });
      relics.push({ x: width * 0.7, y: height * 0.3, collected: false });
    } else {
      // Multi-Planetary Complex
      const pCount = Math.min(4, 2 + Math.floor(sec / 3));
      for (let i = 0; i < pCount; i++) {
        planets.push({
          x: width * 0.35 + i * (width * 0.16),
          y: height * (0.3 + (i % 2) * 0.4),
          radius: 30 + Math.random() * 20,
          mass: 200 + Math.random() * 140,
          colorA: i % 2 ? '#ff2a85' : '#00f0d0',
          colorB: '#0f172a',
          hasRings: i === 1
        });
      }
      relics.push({ x: width * 0.4, y: height * 0.25, collected: false });
      relics.push({ x: width * 0.6, y: height * 0.75, collected: false });
      relics.push({ x: width * 0.5, y: height * 0.5, collected: false });
    }

    document.getElementById('sectorTitle').textContent = `Sector ${sec}: Orbital Matrix`;
    updateRelicsUI();
  }

  function resetProbe() {
    probe.x = launchPad.x;
    probe.y = launchPad.y;
    probe.vx = 0;
    probe.vy = 0;
    probe.trail = [];
    gameState = 'aiming';
  }

  function updateRelicsUI() {
    const total = relics.length;
    const coll = relics.filter(r => r.collected).length;
    document.getElementById('relicsCount').textContent = `✦ ${coll}/${total}`;
  }

  /* ══════════════════════════════════════════════════════════════
     PHYSICS SIMULATION & PREDICTION
     ══════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (gameState !== 'flying') return;

    // Apply Gravitational Forces from all celestial bodies
    for (let p of planets) {
      const dx = p.x - probe.x;
      const dy = p.y - probe.y;
      const dist = Math.hypot(dx, dy);

      // Check collision with planet surface
      if (dist < p.radius + probe.radius) {
        handleCrash();
        return;
      }

      // Gravity Force F = G * M / r^2
      const force = (G * p.mass) / Math.max(900, dist * dist);
      probe.vx += (dx / dist) * force * dt;
      probe.vy += (dy / dist) * force * dt;
    }

    probe.x += probe.vx * dt;
    probe.y += probe.vy * dt;

    // Record trail
    probe.trail.push({ x: probe.x, y: probe.y });
    if (probe.trail.length > 80) probe.trail.shift();

    // Collect Relics
    relics.forEach(r => {
      if (!r.collected && Math.hypot(probe.x - r.x, probe.y - r.y) < 22) {
        r.collected = true;
        playSound('relic');
        updateRelicsUI();
      }
    });

    // Target Beacon Capture
    const distToBeacon = Math.hypot(probe.x - targetBeacon.x, probe.y - targetBeacon.y);
    if (distToBeacon < targetBeacon.radius) {
      handleVictory();
      return;
    }

    // Out of Bounds
    if (probe.x < -100 || probe.x > width + 100 || probe.y < -100 || probe.y > height + 100) {
      handleCrash();
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    if (screenShake > 0) screenShake *= 0.88;
  }

  function handleCrash() {
    playSound('crash');
    screenShake = 16;
    gameState = 'crashed';

    // Particle burst
    for (let i = 0; i < 25; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 160 + 40;
      particles.push({
        x: probe.x, y: probe.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: '#ff2a85',
        size: 3,
        life: 0.5,
        maxLife: 0.5
      });
    }

    setTimeout(() => {
      resetProbe();
    }, 1200);
  }

  function handleVictory() {
    playSound('beacon');
    gameState = 'victory';

    if (currentSector + 1 > gameSave.unlockedSector) {
      gameSave.unlockedSector = currentSector + 1;
      writeSave();
    }

    document.getElementById('victoryModal').classList.add('open');
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER LOOP WITH 2.5D SHADED PLANETS
     ══════════════════════════════════════════════════════════════ */
  function render() {
    ctx.save();
    if (screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    ctx.clearRect(0, 0, width, height);

    // Deep Space Starfield
    drawSpaceGrid();

    // Draw Aiming Trajectory Dots
    if (isDragging && gameState === 'aiming') {
      drawPredictedTrajectory();
    }

    // Draw Target Beacon
    drawBeacon();

    // Draw Celestial Planets with 2.5D Spherical Shading
    drawPlanets();

    // Draw Cosmic Relics
    drawRelics();

    // Draw Probe & Trail
    drawProbe();

    // Draw Launch Pad
    ctx.save();
    ctx.strokeStyle = '#00f0d0';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0d0';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(launchPad.x, launchPad.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawSpaceGrid() {
    ctx.fillStyle = '#02040b';
    ctx.fillRect(0, 0, width, height);

    // Gravity field mesh lines
    ctx.strokeStyle = 'rgba(0, 240, 208, 0.04)';
    ctx.lineWidth = 1;
    const step = 50;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }

  function drawPredictedTrajectory() {
    const launchVx = (dragStart.x - dragCurrent.x) * 3.5;
    const launchVy = (dragStart.y - dragCurrent.y) * 3.5;

    let simX = launchPad.x;
    let simY = launchPad.y;
    let simVx = launchVx;
    let simVy = launchVy;
    const simDt = 0.035;

    ctx.save();
    for (let step = 0; step < 90; step++) {
      for (let p of planets) {
        const dx = p.x - simX;
        const dy = p.y - simY;
        const dist = Math.hypot(dx, dy);
        const f = (G * p.mass) / Math.max(900, dist * dist);
        simVx += (dx / dist) * f * simDt;
        simVy += (dy / dist) * f * simDt;
      }
      simX += simVx * simDt;
      simY += simVy * simDt;

      if (step % 3 === 0) {
        ctx.fillStyle = `rgba(0, 240, 208, ${1 - step / 90})`;
        ctx.beginPath();
        ctx.arc(simX, simY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawPlanets() {
    planets.forEach(p => {
      ctx.save();

      // 3D Spherical Radial Lighting
      const grad = ctx.createRadialGradient(
        p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.1,
        p.x, p.y, p.radius
      );
      grad.addColorStop(0, p.colorA);
      grad.addColorStop(0.7, p.colorB);
      grad.addColorStop(1, '#02040b');

      ctx.fillStyle = grad;
      ctx.shadowColor = p.colorA;
      ctx.shadowBlur = 24;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Planetary Rings
      if (p.hasRings) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 1.8, p.radius * 0.45, -Math.PI / 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  function drawBeacon() {
    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(targetBeacon.x, targetBeacon.y, targetBeacon.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fill();
    ctx.restore();
  }

  function drawRelics() {
    relics.forEach(r => {
      if (r.collected) return;
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawProbe() {
    // Trail
    if (probe.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 208, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(probe.trail[0].x, probe.trail[0].y);
      for (let i = 1; i < probe.trail.length; i++) {
        ctx.lineTo(probe.trail[i].x, probe.trail[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Probe Body
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#00f0d0';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(probe.x, probe.y, probe.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     TOUCH & DRAG AIMING CONTROLS
     ══════════════════════════════════════════════════════════════ */
  canvas.addEventListener('pointerdown', (e) => {
    if (gameState !== 'aiming') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (Math.hypot(x - launchPad.x, y - launchPad.y) < 50) {
      isDragging = true;
      dragStart = { x: launchPad.x, y: launchPad.y };
      dragCurrent = { x, y };
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    dragCurrent = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  });

  window.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;

    // Launch probe
    const vx = (dragStart.x - dragCurrent.x) * 3.5;
    const vy = (dragStart.y - dragCurrent.y) * 3.5;

    if (Math.hypot(vx, vy) > 40) {
      playSound('launch');
      probe.vx = vx;
      probe.vy = vy;
      gameState = 'flying';
    }
  });

  /* ══════════════════════════════════════════════════════════════
     ENGINE LOOP & INIT
     ══════════════════════════════════════════════════════════════ */
  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(0.04, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  document.getElementById('startOrbitBtn').addEventListener('click', () => {
    document.getElementById('menuModal').classList.remove('open');
    loadSector(1);
  });

  document.getElementById('nextSectorBtn').addEventListener('click', () => {
    document.getElementById('victoryModal').classList.remove('open');
    loadSector(currentSector + 1);
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

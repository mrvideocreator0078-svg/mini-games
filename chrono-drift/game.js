/**
 * CHRONO DRIFT: 2.5D CYBER RALLY
 * Complete Production-Quality Pseudo-3D Arcade Highway Racing Engine
 * Scanline Road Projection · Dynamic Banking · AI Traffic · Web Audio API
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     AUDIO SYNTHESIS ENGINE (Web Audio API)
     ══════════════════════════════════════════════════════════════ */
  let audioCtx = null;
  let sfxEnabled = true;
  let engineOsc = null;
  let engineGain = null;

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

  function startEngineAudio() {
    if (!sfxEnabled || engineOsc) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      engineOsc = ctx.createOscillator();
      engineGain = ctx.createGain();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.setValueAtTime(60, ctx.currentTime);
      engineGain.gain.setValueAtTime(0.03, ctx.currentTime);
      engineOsc.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
    } catch (e) {}
  }

  function updateEngineRPM(spd) {
    if (engineOsc && audioCtx) {
      const targetFreq = 50 + (spd / 300) * 160;
      engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);
    }
  }

  function stopEngineAudio() {
    if (engineGain && audioCtx) {
      try {
        engineGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        setTimeout(() => {
          if (engineOsc) {
            engineOsc.stop();
            engineOsc.disconnect();
            engineOsc = null;
            engineGain = null;
          }
        }, 90);
      } catch (e) {
        engineOsc = null;
        engineGain = null;
      }
    }
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

      if (type === 'checkpoint') {
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.07);
          g.gain.setValueAtTime(0.08, now + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.07);
          o.stop(now + i * 0.07 + 0.32);
        });
      } else if (type === 'nitro') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.3);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc.start(now);
        osc.stop(now + 0.42);
      }
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let gameSave = {
    bestDistance: 0,
    bestSpeed: 0
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('chrono_drift_save_v1');
      if (data) gameSave = Object.assign(gameSave, JSON.parse(data));
    } catch (e) {}
  }

  function writeSave() {
    try {
      localStorage.setItem('chrono_drift_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     ENGINE CONSTANTS & VARIABLES
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let gameState = 'menu'; // 'menu', 'racing', 'gameover'

  let player = {
    x: 0, // -1 (left shoulder) to +1 (right shoulder)
    speed: 0,
    maxSpeed: 285,
    nitroSpeed: 340,
    accel: 85,
    brake: 140,
    steer: 0,
    nitro: 100,
    nitroActive: false
  };

  let position = 0;
  let distance = 0;
  let timeLeft = 45;
  let nextCheckpoint = 1200;
  let screenShake = 0;

  let roadSegments = [];
  let trafficCars = [];
  let particles = []; // Tire smoke and nitro fire

  const segmentLength = 200;
  const totalSegments = 1600;
  const cameraDepth = 0.84;

  let keys = { left: false, right: false, up: false, down: false, nitro: false };
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

  /* ══════════════════════════════════════════════════════════════
     2.5D ROAD CURVE GENERATOR
     ══════════════════════════════════════════════════════════════ */
  function buildRoad() {
    roadSegments = [];
    for (let i = 0; i < totalSegments; i++) {
      let curve = 0;
      if (i > 100 && i < 300) curve = 2.2; // Right hairpin
      else if (i > 450 && i < 700) curve = -2.8; // Left sweep
      else if (i > 850 && i < 1100) curve = 3.5; // Neon S-curve
      else if (i > 1200 && i < 1450) curve = -3.0;

      let y = 0;
      if (i > 200 && i < 400) y = Math.sin((i - 200) / 30) * 1200;
      else if (i > 600 && i < 800) y = Math.sin((i - 600) / 40) * 1600;

      roadSegments.push({
        index: i,
        p1: { world: { y: y, z: i * segmentLength }, camera: {}, screen: {} },
        p2: { world: { y: y, z: (i + 1) * segmentLength }, camera: {}, screen: {} },
        curve: curve,
        isCheckpoint: i % 400 === 0 && i > 0
      });
    }

    // Spawn AI Traffic
    trafficCars = [];
    for (let i = 0; i < 45; i++) {
      trafficCars.push({
        z: 800 + i * 700 + Math.random() * 200,
        x: (Math.random() - 0.5) * 1.4,
        speed: 120 + Math.random() * 60,
        color: Math.random() > 0.5 ? '#ff2a85' : '#8b5cf6'
      });
    }
  }

  function project(p, cameraX, cameraY, cameraZ) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;

    const scale = cameraDepth / Math.max(0.001, p.camera.z);
    p.screen.scale = scale;
    p.screen.x = Math.round(width / 2 + scale * p.camera.x * width / 2);
    p.screen.y = Math.round(height / 2 - scale * p.camera.y * height / 2);
    p.screen.w = Math.round(scale * 1800 * width / 2);
  }

  /* ══════════════════════════════════════════════════════════════
     PHYSICS & GAME LOOP UPDATE
     ══════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (gameState !== 'racing') return;

    // Timer Countdown
    timeLeft -= dt;
    document.getElementById('timeCounter').textContent = `${Math.max(0, Math.ceil(timeLeft))}s`;
    if (timeLeft <= 0) {
      gameOver();
      return;
    }

    // Acceleration & Braking
    const maxSpd = player.nitroActive ? player.nitroSpeed : player.maxSpeed;
    if (keys.up) {
      player.speed = Math.min(maxSpd, player.speed + player.accel * dt);
    } else if (keys.down) {
      player.speed = Math.max(0, player.speed - player.brake * dt);
    } else {
      player.speed = Math.max(0, player.speed - 35 * dt); // Natural deceleration
    }

    // Nitro
    if (keys.nitro && player.nitro > 0 && player.speed > 80) {
      player.nitroActive = true;
      player.nitro = Math.max(0, player.nitro - 25 * dt);
      playSound('nitro');
    } else {
      player.nitroActive = false;
      player.nitro = Math.min(100, player.nitro + 6 * dt); // Recharge nitro
    }
    document.getElementById('nitroBar').style.width = `${player.nitro}%`;

    // Steering & Drifting
    player.steer = 0;
    if (keys.left) {
      player.steer = -1;
      player.x -= (1.4 * (player.speed / player.maxSpeed)) * dt;
    }
    if (keys.right) {
      player.steer = 1;
      player.x += (1.4 * (player.speed / player.maxSpeed)) * dt;
    }

    // Keep car clamped slightly past road shoulders
    player.x = Math.max(-1.8, Math.min(1.8, player.x));
    if (Math.abs(player.x) > 1.0) {
      player.speed = Math.max(0, player.speed - 120 * dt); // Off-road penalty
    }

    // Position progress
    position += player.speed * dt * 18;
    distance += (player.speed * dt) / 100;

    // Checkpoint Trigger
    if (position >= nextCheckpoint * segmentLength) {
      playSound('checkpoint');
      timeLeft += 25;
      nextCheckpoint += 400;
    }

    // Update AI Traffic
    for (let c of trafficCars) {
      c.z += c.speed * dt * 18;
      // Collision with player
      if (Math.abs(c.z - position) < 180 && Math.abs(c.x - player.x) < 0.35) {
        playSound('crash');
        screenShake = 16;
        player.speed *= 0.4;
      }
    }

    // Tire Smoke Particles
    if (Math.abs(player.steer) > 0 && player.speed > 140) {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: width / 2 + (player.steer > 0 ? -45 : 45),
          y: height - 60,
          vx: (Math.random() - 0.5) * 80,
          vy: -Math.random() * 50,
          color: 'rgba(0, 240, 208, 0.4)',
          size: Math.random() * 8 + 4,
          life: 0.4,
          maxLife: 0.4
        });
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.size += dt * 8;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Sound & HUD
    updateEngineRPM(player.speed);
    document.getElementById('speedoVal').textContent = Math.floor(player.speed);

    if (screenShake > 0) screenShake *= 0.88;
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

    // Sky & Horizon Parallax
    drawSky();

    // Project & Draw Road
    drawRoad();

    // Draw AI Traffic
    drawTraffic();

    // Draw Particles (Smoke)
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Player 2.5D Sports Car with 3D Banking
    drawPlayerCar();

    ctx.restore();
  }

  function drawSky() {
    const horizon = height * 0.45;
    const bg = ctx.createLinearGradient(0, 0, 0, horizon);
    bg.addColorStop(0, '#02030a');
    bg.addColorStop(1, '#1e1138');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, horizon);

    // Neon Moon
    ctx.save();
    ctx.fillStyle = '#ff2a85';
    ctx.shadowColor = '#ff2a85';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(width * 0.75, horizon * 0.5, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distant City Skyline Silhouettes
    for (let i = 0; i < 20; i++) {
      const bh = 40 + (i * 29 % 70);
      const bx = i * (width / 18);
      ctx.fillStyle = i % 2 ? '#0a0d24' : '#070a1a';
      ctx.fillRect(bx, horizon - bh, width / 18 + 2, bh);
    }
  }

  function drawRoad() {
    const baseSegment = Math.floor(position / segmentLength);
    const cameraZ = position;
    const cameraY = 1200;
    const cameraX = player.x * 1200;

    let maxy = height;
    let dx = 0;

    for (let n = 0; n < 180; n++) {
      const seg = roadSegments[(baseSegment + n) % totalSegments];
      project(seg.p1, cameraX - dx, cameraY, cameraZ);
      project(seg.p2, cameraX - dx - seg.curve, cameraY, cameraZ);
      dx += seg.curve;

      if (seg.p1.camera.z <= cameraDepth || seg.p2.screen.y >= maxy) continue;

      // Draw Road Segment Strip
      const p1 = seg.p1.screen;
      const p2 = seg.p2.screen;
      const isAlt = Math.floor(seg.index / 3) % 2 === 0;

      // Shoulder / Grass
      ctx.fillStyle = isAlt ? '#050818' : '#030510';
      ctx.fillRect(0, p2.y, width, p1.y - p2.y);

      // Rumble Strips
      const r1 = p1.w * 1.15;
      const r2 = p2.w * 1.15;
      ctx.fillStyle = isAlt ? '#ff2a85' : '#fff';
      drawPoly(p1.x - r1, p1.y, p1.x + r1, p1.y, p2.x + r2, p2.y, p2.x - r2, p2.y);

      // Main Asphalt Road
      ctx.fillStyle = isAlt ? '#0f172a' : '#1e293b';
      drawPoly(p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y);

      // Center Lane Divider
      if (isAlt) {
        ctx.fillStyle = '#00f0d0';
        ctx.shadowColor = '#00f0d0';
        ctx.shadowBlur = 6;
        const lw1 = p1.w * 0.04;
        const lw2 = p2.w * 0.04;
        drawPoly(p1.x - lw1, p1.y, p1.x + lw1, p1.y, p2.x + lw2, p2.y, p2.x - lw2, p2.y);
      }

      maxy = p2.y;
    }
  }

  function drawPoly(x1, y1, x2, y2, x3, y3, x4, y4) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function drawTraffic() {
    trafficCars.forEach(c => {
      const relZ = c.z - position;
      if (relZ > 0 && relZ < 25000) {
        const scale = cameraDepth / relZ;
        const sx = width / 2 + scale * (c.x * 1200 - player.x * 1200) * width / 2;
        const sy = height / 2 + scale * 1200 * height / 2;
        const carW = 90 * scale * 15;
        const carH = 45 * scale * 15;

        ctx.save();
        ctx.fillStyle = c.color;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(sx - carW / 2, sy - carH, carW, carH, 6);
        ctx.fill();

        // Red Tail-lights
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(sx - carW * 0.4, sy - carH * 0.35, carW * 0.2, carH * 0.2);
        ctx.fillRect(sx + carW * 0.2, sy - carH * 0.35, carW * 0.2, carH * 0.2);
        ctx.restore();
      }
    });
  }

  function drawPlayerCar() {
    const carX = width / 2;
    const carY = height - 55;
    const tilt = player.steer * 0.12;

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(tilt);

    // Cast 2.5D Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 75, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sports Car Body
    ctx.fillStyle = '#06b6d4';
    ctx.strokeStyle = '#00f0d0';
    ctx.lineWidth = 3;
    ctx.shadowColor = player.nitroActive ? '#facc15' : '#00f0d0';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(-55, 18);
    ctx.lineTo(-45, -12);
    ctx.lineTo(45, -12);
    ctx.lineTo(55, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Canopy Glass
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-35, -12);
    ctx.lineTo(-24, -28);
    ctx.lineTo(24, -28);
    ctx.lineTo(35, -12);
    ctx.closePath();
    ctx.fill();

    // Dual Neon Tail-lights
    ctx.fillStyle = player.nitroActive ? '#facc15' : '#ff2a85';
    ctx.shadowColor = player.nitroActive ? '#facc15' : '#ff2a85';
    ctx.shadowBlur = 18;
    ctx.fillRect(-48, 4, 18, 8);
    ctx.fillRect(30, 4, 18, 8);

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     USER CONTROLS
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ' || e.key === 'Shift') keys.nitro = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === ' ' || e.key === 'Shift') keys.nitro = false;
  });

  // Mobile Controls
  const touchLeft = document.getElementById('touchLeft');
  const touchRight = document.getElementById('touchRight');
  const touchGas = document.getElementById('touchGas');
  const touchNitro = document.getElementById('touchNitro');

  function bindTouch(el, prop) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[prop] = true; });
    el.addEventListener('pointerup', (e) => { e.preventDefault(); keys[prop] = false; });
  }
  bindTouch(touchLeft, 'left');
  bindTouch(touchRight, 'right');
  bindTouch(touchGas, 'up');
  bindTouch(touchNitro, 'nitro');

  function startRace() {
    gameState = 'racing';
    timeLeft = 45;
    position = 0;
    distance = 0;
    player.speed = 0;
    player.x = 0;
    nextCheckpoint = 400;

    document.getElementById('menuModal').classList.remove('open');
    document.getElementById('gameOverModal').classList.remove('open');
    startEngineAudio();
  }

  function gameOver() {
    gameState = 'gameover';
    stopEngineAudio();
    writeSave();

    document.getElementById('finalDist').textContent = `${Math.floor(distance)} km`;
    document.getElementById('gameOverModal').classList.add('open');
  }

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

  document.getElementById('startRaceBtn').addEventListener('click', startRace);
  document.getElementById('retryBtn').addEventListener('click', startRace);

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
  buildRoad();
  document.getElementById('menuModal').classList.add('open');
  requestAnimationFrame(loop);

}());

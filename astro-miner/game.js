/**
 * ASTRO MINER: GRAVITY ODYSSEY
 * Complete Production-Quality 2D Space Physics & Asteroid Mining Simulation
 * 15 Sectors · Realistic Newtonian Thrust · Tractor Beam Mining · Web Audio API
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     AUDIO SYNTHESIS ENGINE (Web Audio API)
     ══════════════════════════════════════════════════════════════ */
  let audioCtx = null;
  let sfxEnabled = true;
  let thrustOsc = null;
  let thrustGain = null;

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

  function startThrustAudio() {
    if (!sfxEnabled || thrustOsc) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      thrustOsc = ctx.createOscillator();
      thrustGain = ctx.createGain();
      thrustOsc.type = 'sawtooth';
      thrustOsc.frequency.setValueAtTime(65, ctx.currentTime);
      thrustGain.gain.setValueAtTime(0.04, ctx.currentTime);
      thrustOsc.connect(thrustGain);
      thrustGain.connect(ctx.destination);
      thrustOsc.start();
    } catch (e) {}
  }

  function stopThrustAudio() {
    if (thrustGain && audioCtx) {
      try {
        thrustGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        setTimeout(() => {
          if (thrustOsc) {
            thrustOsc.stop();
            thrustOsc.disconnect();
            thrustOsc = null;
            thrustGain = null;
          }
        }, 60);
      } catch (e) {
        thrustOsc = null;
        thrustGain = null;
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

      if (type === 'mine') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'collect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.09);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'land') {
        [329.63, 440, 523.25].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.06);
          g.gain.setValueAtTime(0.06, now + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.06);
          o.stop(now + i * 0.06 + 0.32);
        });
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
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
    credits: 0,
    unlockedSector: 1,
    upgrades: {
      fuel: 1,
      hull: 1,
      thruster: 1,
      cargo: 1
    }
  };

  const UPGRADES_INFO = {
    fuel: { name: 'Fuel Cell Capacity', basePrice: 150, mult: 1.3 },
    hull: { name: 'Titanium Hull Plating', basePrice: 200, mult: 1.4 },
    thruster: { name: 'Ion Thruster Tuning', basePrice: 180, mult: 1.35 },
    cargo: { name: 'Pressurized Cargo Bay', basePrice: 120, mult: 1.25 }
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('astro_miner_save_v1');
      if (data) gameSave = Object.assign(gameSave, JSON.parse(data));
    } catch (e) {}
    updateCreditsUI();
  }

  function writeSave() {
    try {
      localStorage.setItem('astro_miner_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
    updateCreditsUI();
  }

  function updateCreditsUI() {
    const el = document.getElementById('creditsCount');
    if (el) el.textContent = `${gameSave.credits} 💰`;
  }

  /* ══════════════════════════════════════════════════════════════
     ENGINE & SHIP VARIABLES
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let gameState = 'menu'; // 'menu', 'flying', 'landed', 'gameover'
  let isPaused = false;
  let currentSector = 1;

  // Lander Ship
  let ship = {
    x: 150,
    y: 120,
    vx: 0,
    vy: 0,
    angle: 0,
    vAngle: 0,
    radius: 16,
    fuel: 100,
    maxFuel: 100,
    hull: 100,
    maxHull: 100,
    cargo: 0,
    maxCargo: 50,
    thrusting: false,
    mining: false
  };

  let terrainPoints = [];
  let landingPads = [];
  let mineralNodes = [];
  let mineralChunks = []; // Floating collected chunks
  let particles = [];
  let screenShake = 0;

  let keys = { left: false, right: false, thrust: false, mine: false };
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
     CAVERN & SECTOR GENERATION
     ══════════════════════════════════════════════════════════════ */
  function generateSector(sec) {
    currentSector = sec;
    terrainPoints = [];
    landingPads = [];
    mineralNodes = [];
    mineralChunks = [];

    // Apply upgrades
    const fLvl = gameSave.upgrades.fuel || 1;
    const hLvl = gameSave.upgrades.hull || 1;
    const cLvl = gameSave.upgrades.cargo || 1;

    ship.maxFuel = 100 + (fLvl - 1) * 35;
    ship.fuel = ship.maxFuel;
    ship.maxHull = 100 + (hLvl - 1) * 40;
    ship.hull = ship.maxHull;
    ship.maxCargo = 40 + (cLvl - 1) * 25;
    ship.cargo = 0;

    // Generate procedural cavern floor & ceiling
    const segments = 24;
    const step = width / segments;

    // Base Pad at start
    const padStartX = 100;
    const padW = 100;
    const padY = height - 100;
    landingPads.push({ x: padStartX, y: padY, w: padW });

    ship.x = padStartX + padW / 2;
    ship.y = padY - 24;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;

    // Cavern Floor
    terrainPoints.push({ x: 0, y: height - 80 });
    for (let i = 0; i <= segments; i++) {
      const px = i * step;
      let py = height - 120 + Math.sin(i * 0.8 + sec) * 70 + Math.cos(i * 1.5) * 40;

      // Keep pad area flat
      if (px >= padStartX - 20 && px <= padStartX + padW + 20) {
        py = padY;
      }
      terrainPoints.push({ x: px, y: py });
    }

    // Mineral Nodes on cavern walls
    const nodeCount = 5 + sec;
    for (let i = 0; i < nodeCount; i++) {
      const nx = padStartX + padW + 60 + Math.random() * (width - padStartX - padW - 120);
      const ny = height - 180 + (Math.random() - 0.5) * 120;
      const type = Math.random() > 0.75 ? 'gold' : Math.random() > 0.4 ? 'purple' : 'cyan';
      mineralNodes.push({
        x: nx,
        y: ny,
        radius: 20 + Math.random() * 10,
        type,
        hp: type === 'gold' ? 8 : type === 'purple' ? 5 : 3,
        color: type === 'gold' ? '#f59e0b' : type === 'purple' ? '#a855f7' : '#00f0d0'
      });
    }

    updateTelemetryUI();
  }

  /* ══════════════════════════════════════════════════════════════
     PHYSICS & SIMULATION
     ══════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (gameState !== 'flying') return;

    const gravity = 90; // Lunar gravity
    const thrustPower = 280;
    const rotSpeed = 3.2;

    // Rotation
    if (keys.left) ship.angle -= rotSpeed * dt;
    if (keys.right) ship.angle += rotSpeed * dt;

    // Main Engine Thrust
    if (keys.thrust && ship.fuel > 0) {
      ship.thrusting = true;
      startThrustAudio();

      const tLvl = gameSave.upgrades.thruster || 1;
      const burnRate = Math.max(8, 16 - (tLvl - 1) * 2);
      ship.fuel = Math.max(0, ship.fuel - burnRate * dt);

      // Thrust vector
      const ax = Math.sin(ship.angle) * thrustPower;
      const ay = -Math.cos(ship.angle) * thrustPower;
      ship.vx += ax * dt;
      ship.vy += ay * dt;

      // Thruster exhaust particles
      for (let i = 0; i < 2; i++) {
        const exhaustAngle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.4;
        const spd = Math.random() * 120 + 80;
        particles.push({
          x: ship.x - Math.sin(ship.angle) * 18,
          y: ship.y + Math.cos(ship.angle) * 18,
          vx: Math.sin(exhaustAngle) * spd + ship.vx * 0.4,
          vy: -Math.cos(exhaustAngle) * spd + ship.vy * 0.4,
          color: Math.random() > 0.4 ? '#00f0d0' : '#f59e0b',
          size: Math.random() * 3 + 1.5,
          life: 0.35,
          maxLife: 0.35
        });
      }
    } else {
      ship.thrusting = false;
      stopThrustAudio();
    }

    // Apply Gravity and Mass
    const massFactor = 1 + (ship.cargo / ship.maxCargo) * 0.3;
    ship.vy += gravity * massFactor * dt;

    // Dampen drag lightly
    ship.vx *= 0.998;
    ship.vy *= 0.998;

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Mining Laser
    if (keys.mine) {
      fireMiningLaser(dt);
    }

    // Update Floating Chunks
    for (let i = mineralChunks.length - 1; i >= 0; i--) {
      const ch = mineralChunks[i];
      // Attracted magnetically to ship
      const dx = ship.x - ch.x;
      const dy = ship.y - ch.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 220) {
        ch.vx += (dx / dist) * 220 * dt;
        ch.vy += (dy / dist) * 220 * dt;
      }
      ch.x += ch.vx * dt;
      ch.y += ch.vy * dt;

      // Collected by ship
      if (dist < ship.radius + 10) {
        collectChunk(ch);
        mineralChunks.splice(i, 1);
        continue;
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Bounds & Collision Check
    checkCollisions();
    updateTelemetryUI();

    if (screenShake > 0) screenShake *= 0.88;
  }

  function fireMiningLaser(dt) {
    playSound('mine');
    const laserRange = 240;
    const lx = ship.x + Math.sin(ship.angle) * laserRange;
    const ly = ship.y - Math.cos(ship.angle) * laserRange;

    // Check mineral nodes hit
    mineralNodes.forEach(node => {
      const dist = Math.hypot(node.x - ship.x, node.y - ship.y);
      if (dist < laserRange) {
        node.hp -= 2.5 * dt;

        // Mineral sparks
        particles.push({
          x: node.x + (Math.random() - 0.5) * 10,
          y: node.y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 100,
          vy: (Math.random() - 0.5) * 100,
          color: node.color,
          size: 2,
          life: 0.3,
          maxLife: 0.3
        });

        if (node.hp <= 0 && !node.exhausted) {
          node.exhausted = true;
          // Spawn 3 floating chunks
          for (let k = 0; k < 3; k++) {
            mineralChunks.push({
              x: node.x,
              y: node.y,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              type: node.type,
              color: node.color,
              value: node.type === 'gold' ? 80 : node.type === 'purple' ? 35 : 15
            });
          }
        }
      }
    });
  }

  function collectChunk(ch) {
    if (ship.cargo < ship.maxCargo) {
      playSound('collect');
      ship.cargo = Math.min(ship.maxCargo, ship.cargo + 10);
      gameSave.credits += ch.value;
      writeSave();
    }
  }

  function checkCollisions() {
    // Check Landing Pad contact
    for (let pad of landingPads) {
      if (ship.x >= pad.x && ship.x <= pad.x + pad.w &&
          ship.y + ship.radius >= pad.y - 2 && ship.y + ship.radius <= pad.y + 14) {

        // Check landing velocity and angle
        const speed = Math.hypot(ship.vx, ship.vy);
        const deg = Math.abs(ship.angle * 180 / Math.PI) % 360;

        if (speed < 110 && (deg < 25 || deg > 335)) {
          // Safe Landing!
          landShip();
          return;
        } else {
          // Hard Crash Landing
          takeDamage(speed * 0.6);
          ship.vy = -ship.vy * 0.3;
        }
      }
    }

    // Floor terrain collision
    for (let i = 0; i < terrainPoints.length - 1; i++) {
      const p1 = terrainPoints[i];
      const p2 = terrainPoints[i + 1];
      if (ship.x >= p1.x && ship.x <= p2.x) {
        const floorY = p1.y + (p2.y - p1.y) * ((ship.x - p1.x) / (p2.x - p1.x));
        if (ship.y + ship.radius >= floorY) {
          const speed = Math.hypot(ship.vx, ship.vy);
          takeDamage(speed * 0.8);
          ship.y = floorY - ship.radius;
          ship.vy = -ship.vy * 0.4;
          ship.vx *= 0.5;
        }
      }
    }
  }

  function takeDamage(dmg) {
    playSound('crash');
    screenShake = 16;
    ship.hull -= dmg;

    if (ship.hull <= 0) {
      gameOver();
    }
  }

  function landShip() {
    gameState = 'landed';
    stopThrustAudio();
    playSound('land');

    // Refuel
    ship.fuel = ship.maxFuel;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;

    // Deposit Cargo
    const deposited = ship.cargo;
    ship.cargo = 0;

    document.getElementById('hangarModal').classList.add('open');
  }

  function gameOver() {
    gameState = 'gameover';
    stopThrustAudio();
    document.getElementById('gameOverModal').classList.add('open');
  }

  function updateTelemetryUI() {
    const fuelPct = Math.max(0, (ship.fuel / ship.maxFuel) * 100);
    const hullPct = Math.max(0, (ship.hull / ship.maxHull) * 100);
    const cargoPct = Math.max(0, (ship.cargo / ship.maxCargo) * 100);

    const fEl = document.getElementById('fuelBar');
    const hEl = document.getElementById('hullBar');
    const cEl = document.getElementById('cargoBar');

    if (fEl) fEl.style.width = `${fuelPct}%`;
    if (hEl) hEl.style.width = `${hullPct}%`;
    if (cEl) cEl.style.width = `${cargoPct}%`;
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER LOOP
     ══════════════════════════════════════════════════════════════ */
  function render() {
    ctx.save();
    if (screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    ctx.clearRect(0, 0, width, height);

    // Deep Space Background with Stars
    drawSpaceBackground();

    // Draw Cavern Terrain
    drawCavern();

    // Draw Landing Pads
    landingPads.forEach(pad => {
      ctx.save();
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillRect(pad.x, pad.y, pad.w, 8);
      ctx.strokeRect(pad.x, pad.y, pad.w, 8);
      ctx.restore();
    });

    // Draw Mineral Nodes
    mineralNodes.forEach(node => {
      if (node.exhausted) return;
      ctx.save();
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Floating Chunks
    mineralChunks.forEach(ch => {
      ctx.save();
      ctx.fillStyle = ch.color;
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Mining Laser Beam
    if (keys.mine && gameState === 'flying') {
      ctx.save();
      ctx.strokeStyle = '#00f0d0';
      ctx.shadowColor = '#00f0d0';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(ship.x + Math.sin(ship.angle) * 240, ship.y - Math.cos(ship.angle) * 240);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Lander Ship
    drawLanderShip();

    // Draw Particles
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

  function drawSpaceBackground() {
    ctx.fillStyle = '#050713';
    ctx.fillRect(0, 0, width, height);

    // Nebula dust gradient
    const grad = ctx.createRadialGradient(width * 0.7, height * 0.3, 20, width * 0.7, height * 0.3, 400);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function drawCavern() {
    if (terrainPoints.length < 2) return;
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(terrainPoints[0].x, terrainPoints[0].y);
    for (let i = 1; i < terrainPoints.length; i++) {
      ctx.lineTo(terrainPoints[i].x, terrainPoints[i].y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawLanderShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Hull Pod
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00f0d0';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0d0';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(14, 10);
    ctx.lineTo(-14, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit Window
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Landing Gear Legs
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 10); ctx.lineTo(-16, 18);
    ctx.moveTo(10, 10); ctx.lineTo(16, 18);
    ctx.stroke();

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     USER CONTROLS & BINDINGS
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.thrust = true;
    if (e.key === ' ' || e.key === 'e' || e.key === 'E') keys.mine = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.thrust = false;
    if (e.key === ' ' || e.key === 'e' || e.key === 'E') keys.mine = false;
  });

  // Mobile Touch Buttons
  const touchLeft = document.getElementById('touchLeft');
  const touchRight = document.getElementById('touchRight');
  const touchThrust = document.getElementById('touchThrust');
  const touchMine = document.getElementById('touchMine');

  function bindTouch(el, prop) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[prop] = true; });
    el.addEventListener('pointerup', (e) => { e.preventDefault(); keys[prop] = false; });
  }
  bindTouch(touchLeft, 'left');
  bindTouch(touchRight, 'right');
  bindTouch(touchThrust, 'thrust');
  bindTouch(touchMine, 'mine');

  /* ══════════════════════════════════════════════════════════════
     HANGAR UPGRADES & FLOW
     ══════════════════════════════════════════════════════════════ */
  function renderHangar() {
    const grid = document.getElementById('hangarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(UPGRADES_INFO).forEach(id => {
      const u = UPGRADES_INFO[id];
      const lvl = gameSave.upgrades[id] || 1;
      const price = Math.floor(u.basePrice * Math.pow(u.mult, lvl - 1));

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-name">${u.name}</div>
        <div class="upgrade-lvl">Level ${lvl} / 5</div>
        <div class="upgrade-price">${lvl >= 5 ? 'MAXED' : `${price} 💰`}</div>
      `;

      if (lvl < 5) {
        card.addEventListener('click', () => {
          if (gameSave.credits >= price) {
            gameSave.credits -= price;
            gameSave.upgrades[id] = lvl + 1;
            writeSave();
            renderHangar();
            generateSector(currentSector);
          }
        });
      }
      grid.appendChild(card);
    });
  }

  function startSector(sec) {
    gameState = 'flying';
    isPaused = false;
    const pauseModal = document.getElementById('pauseModal');
    if (pauseModal) pauseModal.classList.remove('open');
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ PAUSE';

    document.getElementById('menuModal').classList.remove('open');
    document.getElementById('gameOverModal').classList.remove('open');
    document.getElementById('hangarModal').classList.remove('open');
    generateSector(sec || 1);
  }

  /* ══════════════════════════════════════════════════════════════
     ENGINE LOOP
     ══════════════════════════════════════════════════════════════ */
  function togglePause() {
    if (gameState !== 'flying') return;
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

    if (gameState === 'flying' && !isPaused) {
      update(dt);
    }
    render();

    requestAnimationFrame(loop);
  }

  /* ══════════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════════ */
  document.getElementById('launchBtn').addEventListener('click', () => startSector(1));
  document.getElementById('hangarResumeBtn').addEventListener('click', () => {
    gameState = 'flying';
    document.getElementById('hangarModal').classList.remove('open');
  });
  document.getElementById('retryBtn').addEventListener('click', () => startSector(currentSector));

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
      startSector(currentSector);
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'flying') {
      togglePause();
    }
  });

  loadSave();
  resize();
  renderHangar();
  document.getElementById('menuModal').classList.add('open');
  requestAnimationFrame(loop);

}());

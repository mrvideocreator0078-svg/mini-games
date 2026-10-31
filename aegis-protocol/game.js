/**
 * AEGIS PROTOCOL: 2.5D ISOMETRIC TOWER DEFENSE
 * Complete Production-Quality Grid Strategy Engine
 * 4 Turret Classes · Wave Formations · Boss Mechs · Web Audio API
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

      if (type === 'gatling') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'cryo') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(840, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'tesla') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'railgun') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'explode') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let gameSave = {
    bestWave: 1
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('aegis_protocol_save_v1');
      if (data) gameSave = Object.assign(gameSave, JSON.parse(data));
    } catch (e) {}
  }

  function writeSave() {
    try {
      localStorage.setItem('aegis_protocol_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     2.5D GRID & TURRET DATA
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let gameState = 'menu'; // 'menu', 'playing', 'gameover'

  const gridRows = 9;
  const gridCols = 13;
  const tileW = 60;
  const tileH = 30;

  // Winding Path Nodes
  const PATH = [
    { c: 0, r: 2 },
    { c: 4, r: 2 },
    { c: 4, r: 6 },
    { c: 8, r: 6 },
    { c: 8, r: 2 },
    { c: 12, r: 2 }
  ];

  const TURRET_TYPES = {
    gatling: { name: 'Gatling', cost: 100, range: 2.8, fireRate: 0.18, dmg: 14, color: '#00f0d0' },
    cryo: { name: 'Cryo Beam', cost: 150, range: 2.4, fireRate: 0.4, dmg: 8, slow: 0.5, color: '#38bdf8' },
    tesla: { name: 'Tesla Coil', cost: 220, range: 2.2, fireRate: 0.6, dmg: 35, color: '#a855f7' },
    railgun: { name: 'Railgun', cost: 350, range: 3.8, fireRate: 1.1, dmg: 110, color: '#facc15' }
  };

  let selectedTurretType = 'gatling';

  let scrapEnergy = 350;
  let coreHealth = 100;
  let wave = 1;
  let waveTimer = 4.0;
  let waveActive = false;

  let turrets = [];
  let enemies = [];
  let projectiles = [];
  let particles = [];
  let screenShake = 0;
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

  function isoToScreen(c, r) {
    const originX = width / 2;
    const originY = height * 0.22;
    const sx = originX + (c - r) * (tileW / 2);
    const sy = originY + (c + r) * (tileH / 2);
    return { x: sx, y: sy };
  }

  function screenToIso(sx, sy) {
    const originX = width / 2;
    const originY = height * 0.22;
    const x = sx - originX;
    const y = sy - originY;
    const c = (x / (tileW / 2) + y / (tileH / 2)) / 2;
    const r = (y / (tileH / 2) - x / (tileW / 2)) / 2;
    return { c: Math.round(c), r: Math.round(r) };
  }

  function isPathTile(c, r) {
    for (let i = 0; i < PATH.length - 1; i++) {
      const p1 = PATH[i];
      const p2 = PATH[i + 1];
      const minC = Math.min(p1.c, p2.c);
      const maxC = Math.max(p1.c, p2.c);
      const minR = Math.min(p1.r, p2.r);
      const maxR = Math.max(p1.r, p2.r);
      if (c >= minC && c <= maxC && r >= minR && r <= maxR) return true;
    }
    return false;
  }

  /* ══════════════════════════════════════════════════════════════
     ENEMY WAVE SPAWNER
     ══════════════════════════════════════════════════════════════ */
  function startNextWave() {
    waveActive = true;
    const count = 6 + wave * 3;
    for (let i = 0; i < count; i++) {
      const isBoss = (i === count - 1) && (wave % 3 === 0);
      enemies.push({
        pathIdx: 0,
        c: PATH[0].c,
        r: PATH[0].r,
        progress: 0,
        speed: isBoss ? 0.8 : 1.3 + Math.random() * 0.4,
        slowFactor: 1.0,
        hp: isBoss ? 450 + wave * 180 : 45 + wave * 25,
        maxHp: isBoss ? 450 + wave * 180 : 45 + wave * 25,
        isBoss: isBoss,
        delay: i * 1.1
      });
    }
    document.getElementById('waveVal').textContent = wave;
  }

  /* ══════════════════════════════════════════════════════════════
     SIMULATION & TURRET AI
     ══════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (gameState !== 'playing') return;

    // Wave Countdown
    if (!waveActive) {
      waveTimer -= dt;
      if (waveTimer <= 0) {
        startNextWave();
      }
    }

    // Update Enemies along Path
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.delay > 0) {
        e.delay -= dt;
        continue;
      }

      // Progress along path segments
      const p1 = PATH[e.pathIdx];
      const p2 = PATH[e.pathIdx + 1];

      if (!p2) {
        // Reached Core!
        coreHealth -= e.isBoss ? 35 : 10;
        screenShake = 14;
        playSound('explode');
        enemies.splice(i, 1);
        updateHUD();

        if (coreHealth <= 0) {
          gameOver();
          return;
        }
        continue;
      }

      const segLen = Math.hypot(p2.c - p1.c, p2.r - p1.r);
      e.progress += (e.speed * e.slowFactor * dt) / segLen;
      e.slowFactor = Math.min(1.0, e.slowFactor + dt * 0.5); // recover from slow

      e.c = p1.c + (p2.c - p1.c) * e.progress;
      e.r = p1.r + (p2.r - p1.r) * e.progress;

      if (e.progress >= 1.0) {
        e.pathIdx++;
        e.progress = 0;
      }
    }

    // Check wave complete
    if (waveActive && enemies.length === 0) {
      waveActive = false;
      wave++;
      scrapEnergy += 100;
      waveTimer = 5.0;
      updateHUD();
    }

    // Turrets Target & Attack
    turrets.forEach(t => {
      t.fireCooldown -= dt;
      if (t.fireCooldown > 0) return;

      // Find closest enemy in range
      let target = null;
      let closestDist = t.range;

      for (let e of enemies) {
        if (e.delay > 0) continue;
        const dist = Math.hypot(e.c - t.c, e.r - t.r);
        if (dist < closestDist) {
          closestDist = dist;
          target = e;
        }
      }

      if (target) {
        t.fireCooldown = t.fireRate;
        fireTurret(t, target);
      }
    });

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const dx = p.target.c - p.c;
      const dy = p.target.r - p.r;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.3 || p.target.hp <= 0) {
        // Hit!
        damageEnemy(p.target, p.dmg, p.type);
        projectiles.splice(i, 1);
        continue;
      }

      p.c += (dx / dist) * 12 * dt;
      p.r += (dy / dist) * 12 * dt;
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    if (screenShake > 0) screenShake *= 0.88;
  }

  function fireTurret(t, target) {
    playSound(t.type);
    if (t.type === 'gatling' || t.type === 'railgun') {
      projectiles.push({
        c: t.c, r: t.r,
        target: target,
        dmg: t.dmg,
        type: t.type
      });
    } else if (t.type === 'cryo') {
      target.slowFactor = 0.5;
      damageEnemy(target, t.dmg, 'cryo');
    } else if (t.type === 'tesla') {
      damageEnemy(target, t.dmg, 'tesla');
    }
  }

  function damageEnemy(e, dmg, type) {
    e.hp -= dmg;
    if (e.hp <= 0) {
      playSound('explode');
      scrapEnergy += e.isBoss ? 75 : 15;
      updateHUD();

      // Explosion particles
      const sp = isoToScreen(e.c, e.r);
      for (let j = 0; j < 16; j++) {
        particles.push({
          x: sp.x, y: sp.y,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          color: e.isBoss ? '#facc15' : '#ef4444',
          size: Math.random() * 3 + 1.5,
          life: 0.45,
          maxLife: 0.45
        });
      }

      const idx = enemies.indexOf(e);
      if (idx !== -1) enemies.splice(idx, 1);
    }
  }

  function updateHUD() {
    document.getElementById('scrapVal').textContent = `${scrapEnergy} ⚡`;
    document.getElementById('coreVal').textContent = `${Math.max(0, coreHealth)}%`;
  }

  function gameOver() {
    gameState = 'gameover';
    writeSave();
    document.getElementById('goWave').textContent = `Wave ${wave}`;
    document.getElementById('gameOverModal').classList.add('open');
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

    // Draw Isometric Grid
    drawGrid();

    // Draw Turrets
    drawTurrets();

    // Draw Projectiles
    drawProjectiles();

    // Draw Enemies
    drawEnemies();

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

  function drawGrid() {
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const sp = isoToScreen(c, r);
        const onPath = isPathTile(c, r);

        ctx.save();
        ctx.fillStyle = onPath ? '#1e293b' : '#070c1e';
        ctx.strokeStyle = onPath ? '#00f0d0' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = onPath ? 2 : 1;
        if (onPath) {
          ctx.shadowColor = '#00f0d0';
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x + tileW / 2, sp.y + tileH / 2);
        ctx.lineTo(sp.x, sp.y + tileH);
        ctx.lineTo(sp.x - tileW / 2, sp.y + tileH / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawTurrets() {
    turrets.forEach(t => {
      const sp = isoToScreen(t.c, t.r);
      ctx.save();
      ctx.translate(sp.x, sp.y);

      // Turret 2.5D Base
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.roundRect(-14, -10, 28, 20, 4);
      ctx.fill();
      ctx.stroke();

      // Barrel
      ctx.fillStyle = t.color;
      ctx.fillRect(-3, -20, 6, 14);

      ctx.restore();
    });
  }

  function drawProjectiles() {
    projectiles.forEach(p => {
      const sp = isoToScreen(p.c, p.r);
      ctx.save();
      ctx.fillStyle = p.type === 'railgun' ? '#facc15' : '#00f0d0';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y + 10, p.type === 'railgun' ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawEnemies() {
    enemies.forEach(e => {
      if (e.delay > 0) return;
      const sp = isoToScreen(e.c, e.r);
      ctx.save();
      ctx.translate(sp.x, sp.y + 8);

      // Enemy 2.5D Sprite
      ctx.fillStyle = e.isBoss ? '#facc15' : '#ef4444';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = e.isBoss ? 18 : 10;
      ctx.beginPath();
      ctx.arc(0, -6, e.isBoss ? 12 : 7, 0, Math.PI * 2);
      ctx.fill();

      // HP Bar
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-12, -20, 24, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-12, -20, 24 * hpPct, 4);

      ctx.restore();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     USER INPUT & TURRET PLACEMENT
     ══════════════════════════════════════════════════════════════ */
  canvas.addEventListener('click', (e) => {
    if (gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const iso = screenToIso(e.clientX - rect.left, e.clientY - rect.top);

    if (iso.c >= 0 && iso.c < gridCols && iso.r >= 0 && iso.r < gridRows) {
      if (!isPathTile(iso.c, iso.r) && !turrets.some(t => t.c === iso.c && t.r === iso.r)) {
        const info = TURRET_TYPES[selectedTurretType];
        if (scrapEnergy >= info.cost) {
          scrapEnergy -= info.cost;
          turrets.push({
            c: iso.c,
            r: iso.r,
            type: selectedTurretType,
            range: info.range,
            fireRate: info.fireRate,
            dmg: info.dmg,
            color: info.color,
            fireCooldown: 0
          });
          updateHUD();
        }
      }
    }
  });

  document.querySelectorAll('.turret-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.turret-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTurretType = card.getAttribute('data-type');
    });
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

  function startDefense() {
    gameState = 'playing';
    scrapEnergy = 350;
    coreHealth = 100;
    wave = 1;
    turrets = [];
    enemies = [];
    projectiles = [];
    waveTimer = 2.0;
    waveActive = false;

    updateHUD();
    document.getElementById('menuModal').classList.remove('open');
    document.getElementById('gameOverModal').classList.remove('open');
  }

  document.getElementById('startDefenseBtn').addEventListener('click', startDefense);
  document.getElementById('retryBtn').addEventListener('click', startDefense);

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

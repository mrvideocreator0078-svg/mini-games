/**
 * SHADOW REALM: 2.5D ISOMETRIC DUNGEON CRAWLER
 * Complete Production-Quality Isometric Roguelite Engine
 * 2.5D Isometric Projection · Dual Dagger Combat · AI Guardians · Web Audio API
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

      if (type === 'slash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'dash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'loot') {
        [659.25, 880, 1046.50].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.05);
          g.gain.setValueAtTime(0.06, now + i * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.05);
          o.stop(now + i * 0.05 + 0.19);
        });
      }
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let gameSave = {
    bestFloor: 1,
    totalGold: 0
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('shadow_realm_save_v1');
      if (data) gameSave = Object.assign(gameSave, JSON.parse(data));
    } catch (e) {}
  }

  function writeSave() {
    try {
      localStorage.setItem('shadow_realm_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     2.5D ISOMETRIC ENGINE VARIABLES
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let gameState = 'menu'; // 'menu', 'playing', 'floorclear', 'gameover'
  let isPaused = false;
  let currentFloor = 1;

  const mapSize = 14;
  const tileW = 64;
  const tileH = 32;

  // Hero
  let hero = {
    x: 7,
    y: 7,
    angle: 0,
    speed: 4.5,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    isSlashing: false,
    slashTimer: 0,
    isDashing: false,
    dashTimer: 0
  };

  let enemies = [];
  let enemyProjectiles = [];
  let lootChests = [];
  let portalStairs = null;
  let particles = [];
  let screenShake = 0;

  let keys = { up: false, down: false, left: false, right: false, attack: false, dash: false };
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
     ISOMETRIC MATH PROJECTION
     ══════════════════════════════════════════════════════════════ */
  function isoToScreen(ix, iy) {
    const originX = width / 2;
    const originY = height * 0.28;
    const sx = originX + (ix - iy) * (tileW / 2);
    const sy = originY + (ix + iy) * (tileH / 2);
    return { x: sx, y: sy };
  }

  /* ══════════════════════════════════════════════════════════════
     DUNGEON ROOM GENERATION
     ══════════════════════════════════════════════════════════════ */
  function buildFloor(flr) {
    currentFloor = flr;
    enemies = [];
    enemyProjectiles = [];
    lootChests = [];
    portalStairs = null;

    hero.x = 2;
    hero.y = 2;
    hero.hp = hero.maxHp;
    hero.stamina = hero.maxStamina;

    // Spawn Void Skeletons
    const enemyCount = 3 + flr * 2;
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        x: 4 + Math.random() * (mapSize - 6),
        y: 4 + Math.random() * (mapSize - 6),
        hp: 35 + flr * 10,
        maxHp: 35 + flr * 10,
        speed: 1.8 + Math.random() * 0.6,
        type: Math.random() > 0.4 ? 'skeleton' : 'wisp',
        attackCooldown: 1.0,
        hitCooldown: 0
      });
    }

    // Spawn 2 Treasure Chests
    lootChests.push({ x: 11, y: 3, opened: false });
    lootChests.push({ x: 3, y: 11, opened: false });

    // Exit Portal in far corner
    portalStairs = { x: mapSize - 3, y: mapSize - 3, active: false };

    document.getElementById('floorVal').textContent = `F${flr}`;
    updateHeroStatsUI();
  }

  function updateHeroStatsUI() {
    const hpPct = Math.max(0, (hero.hp / hero.maxHp) * 100);
    const stamPct = Math.max(0, (hero.stamina / hero.maxStamina) * 100);
    const hpEl = document.getElementById('hpBar');
    const stEl = document.getElementById('staminaBar');
    if (hpEl) hpEl.style.width = `${hpPct}%`;
    if (stEl) stEl.style.width = `${stamPct}%`;
  }

  /* ══════════════════════════════════════════════════════════════
     GAME UPDATE LOOP & COMBAT
     ══════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (gameState !== 'playing') return;

    // Movement
    let dx = 0, dy = 0;
    if (keys.up) { dx -= 1; dy -= 1; }
    if (keys.down) { dx += 1; dy += 1; }
    if (keys.left) { dx -= 1; dy += 1; }
    if (keys.right) { dx += 1; dy -= 1; }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      hero.angle = Math.atan2(dy, dx);
      const moveSpd = hero.isDashing ? hero.speed * 2.4 : hero.speed;
      hero.x = Math.max(1.2, Math.min(mapSize - 2.2, hero.x + dx * moveSpd * dt));
      hero.y = Math.max(1.2, Math.min(mapSize - 2.2, hero.y + dy * moveSpd * dt));
    }

    // Dash
    if (hero.isDashing) {
      hero.dashTimer -= dt;
      if (hero.dashTimer <= 0) hero.isDashing = false;
    } else if (keys.dash && hero.stamina >= 30) {
      hero.isDashing = true;
      hero.dashTimer = 0.22;
      hero.stamina -= 30;
      playSound('dash');
    }

    // Stamina Recharge
    hero.stamina = Math.min(hero.maxStamina, hero.stamina + 25 * dt);

    // Slash Attack
    if (hero.isSlashing) {
      hero.slashTimer -= dt;
      if (hero.slashTimer <= 0) hero.isSlashing = false;
    } else if (keys.attack) {
      hero.isSlashing = true;
      hero.slashTimer = 0.25;
      playSound('slash');
      performSlashHit();
    }

    // Update Enemies AI
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.hitCooldown > 0) e.hitCooldown -= dt;

      // Distance to hero
      const edx = hero.x - e.x;
      const edy = hero.y - e.y;
      const dist = Math.hypot(edx, edy);

      if (dist < 8) {
        // Move towards hero
        e.x += (edx / dist) * e.speed * dt;
        e.y += (edy / dist) * e.speed * dt;

        // Attack hero
        e.attackCooldown -= dt;
        if (dist < 1.2 && e.attackCooldown <= 0 && !hero.isDashing) {
          hero.hp -= 15;
          screenShake = 12;
          playSound('hit');
          e.attackCooldown = 1.2;
          updateHeroStatsUI();

          if (hero.hp <= 0) {
            gameOver();
            return;
          }
        }
      }
    }

    // Check Loot Chests
    lootChests.forEach(ch => {
      if (!ch.opened && Math.hypot(hero.x - ch.x, hero.y - ch.y) < 1.4) {
        ch.opened = true;
        playSound('loot');
        gameSave.totalGold += 50;
        hero.hp = Math.min(hero.maxHp, hero.hp + 30);
        updateHeroStatsUI();
      }
    });

    // Check Portal Stairs
    if (enemies.length === 0) {
      portalStairs.active = true;
      if (Math.hypot(hero.x - portalStairs.x, hero.y - portalStairs.y) < 1.4) {
        floorClear();
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

    updateHeroStatsUI();
    if (screenShake > 0) screenShake *= 0.88;
  }

  function performSlashHit() {
    enemies.forEach((e, idx) => {
      const dist = Math.hypot(hero.x - e.x, hero.y - e.y);
      if (dist < 2.2) {
        e.hp -= 30;
        e.hitCooldown = 0.2;
        screenShake = 8;
        playSound('hit');

        // Blood/Sparks
        for (let j = 0; j < 14; j++) {
          particles.push({
            x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: '#00f0d0',
            size: 3,
            life: 0.4,
            maxLife: 0.4
          });
        }

        if (e.hp <= 0) {
          enemies.splice(idx, 1);
          playSound('loot');
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     2.5D ISOMETRIC RENDER LOOP
     ══════════════════════════════════════════════════════════════ */
  function render() {
    ctx.save();
    if (screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    ctx.clearRect(0, 0, width, height);

    // Dungeon Floor & Walls
    drawIsometricDungeon();

    // Chests & Portal
    drawInteractables();

    // Draw Enemies
    drawEnemies();

    // Draw Hero Ninja
    drawHero();

    // Draw 2.5D Particles
    particles.forEach(pt => {
      const sp = isoToScreen(pt.x, pt.y);
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  function drawIsometricDungeon() {
    for (let y = 0; y < mapSize; y++) {
      for (let x = 0; x < mapSize; x++) {
        const sp = isoToScreen(x, y);

        // Boundary Wall or Floor
        const isWall = (x === 0 || x === mapSize - 1 || y === 0 || y === mapSize - 1);

        if (isWall) {
          // 2.5D Extruded Stone Wall Block
          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y - 24);
          ctx.lineTo(sp.x + tileW / 2, sp.y - 24 + tileH / 2);
          ctx.lineTo(sp.x, sp.y - 24 + tileH);
          ctx.lineTo(sp.x - tileW / 2, sp.y - 24 + tileH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Wall Front Face
          ctx.fillStyle = '#0a0f24';
          ctx.beginPath();
          ctx.moveTo(sp.x - tileW / 2, sp.y - 24 + tileH / 2);
          ctx.lineTo(sp.x, sp.y - 24 + tileH);
          ctx.lineTo(sp.x, sp.y + tileH);
          ctx.lineTo(sp.x - tileW / 2, sp.y + tileH / 2);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        } else {
          // Isometric Stone Diamond Tile
          ctx.save();
          ctx.fillStyle = (x + y) % 2 === 0 ? '#0b1126' : '#080d1e';
          ctx.strokeStyle = 'rgba(0, 240, 208, 0.08)';
          ctx.lineWidth = 1;

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
  }

  function drawInteractables() {
    // Treasure Chests
    lootChests.forEach(ch => {
      const sp = isoToScreen(ch.x, ch.y);
      ctx.save();
      ctx.fillStyle = ch.opened ? '#64748b' : '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = ch.opened ? 0 : 16;
      ctx.fillRect(sp.x - 12, sp.y - 8, 24, 16);
      ctx.restore();
    });

    // Portal Stairs
    if (portalStairs) {
      const sp = isoToScreen(portalStairs.x, portalStairs.y);
      ctx.save();
      ctx.strokeStyle = portalStairs.active ? '#00f0d0' : '#475569';
      ctx.shadowColor = '#00f0d0';
      ctx.shadowBlur = portalStairs.active ? 22 : 0;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y + 12, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEnemies() {
    enemies.forEach(e => {
      const sp = isoToScreen(e.x, e.y);
      ctx.save();
      ctx.translate(sp.x, sp.y);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Enemy Body
      ctx.fillStyle = e.type === 'skeleton' ? '#e2e8f0' : '#a855f7';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -12, 10, 0, Math.PI * 2);
      ctx.fill();

      // Red Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -14, 2, 3);
      ctx.fillRect(2, -14, 2, 3);

      ctx.restore();
    });
  }

  function drawHero() {
    const sp = isoToScreen(hero.x, hero.y);
    ctx.save();
    ctx.translate(sp.x, sp.y);

    // Cast 2.5D Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cyber Hero Body
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00f0d0';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0d0';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(0, -14, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dual Glowing Daggers
    ctx.fillStyle = '#00f0d0';
    ctx.fillRect(-16, -18, 4, 12);
    ctx.fillRect(12, -18, 4, 12);

    // Slash Arc
    if (hero.isSlashing) {
      ctx.save();
      ctx.strokeStyle = '#00f0d0';
      ctx.shadowColor = '#00f0d0';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -14, 28, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     USER CONTROLS & BINDINGS
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = true;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = true;
    if (e.key === ' ' || e.key === 'Enter') keys.attack = true;
    if (e.key === 'Shift') keys.dash = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
    if (e.key === ' ' || e.key === 'Enter') keys.attack = false;
    if (e.key === 'Shift') keys.dash = false;
  });

  // Mobile Controls
  const touchLeft = document.getElementById('touchLeft');
  const touchRight = document.getElementById('touchRight');
  const touchAttack = document.getElementById('touchAttack');
  const touchDash = document.getElementById('touchDash');

  function bindTouch(el, prop) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[prop] = true; });
    el.addEventListener('pointerup', (e) => { e.preventDefault(); keys[prop] = false; });
  }
  bindTouch(touchLeft, 'left');
  bindTouch(touchRight, 'right');
  bindTouch(touchAttack, 'attack');
  bindTouch(touchDash, 'dash');

  function startDungeon(flr) {
    gameState = 'playing';
    isPaused = false;
    const pauseModal = document.getElementById('pauseModal');
    if (pauseModal) pauseModal.classList.remove('open');
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ PAUSE';

    document.getElementById('menuModal').classList.remove('open');
    document.getElementById('gameOverModal').classList.remove('open');
    document.getElementById('floorClearModal').classList.remove('open');
    buildFloor(flr || 1);
  }

  function floorClear() {
    gameState = 'floorclear';
    playSound('loot');
    if (currentFloor + 1 > gameSave.bestFloor) {
      gameSave.bestFloor = currentFloor + 1;
      writeSave();
    }
    document.getElementById('floorClearModal').classList.add('open');
  }

  function gameOver() {
    gameState = 'gameover';
    writeSave();
    document.getElementById('gameOverModal').classList.add('open');
  }

  /* ══════════════════════════════════════════════════════════════
     ENGINE LOOP
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

  document.getElementById('startCrawlerBtn').addEventListener('click', () => startDungeon(1));
  document.getElementById('nextFloorBtn').addEventListener('click', () => startDungeon(currentFloor + 1));
  document.getElementById('retryBtn').addEventListener('click', () => startDungeon(1));

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
      startDungeon(1);
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

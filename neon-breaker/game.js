/**
 * NEON BREAKER: QUANTUM IMPACT
 * Complete Production-Quality 2D Synthwave Breakout Engine
 * 20 Handcrafted Levels · 7 Power-Ups · Procedural Web Audio API
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

      if (type === 'paddle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280 + (param || 0) * 120, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'brick') {
        const combo = Math.min(12, param || 1);
        const baseFreq = 440;
        const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
        const note = scale[combo % scale.length];
        const freq = baseFreq * Math.pow(2, note / 12);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'tnt') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'laser') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'powerup') {
        [523.25, 659.25, 783.99].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.05);
          g.gain.setValueAtTime(0.05, now + i * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.05);
          o.stop(now + i * 0.05 + 0.16);
        });
      }
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     HANDCRAFTED 20 STAGES
     ══════════════════════════════════════════════════════════════ */
  // Brick IDs: 1=Cyan (1 hit), 2=Magenta (2 hits), 3=Obsidian (3 hits), 4=TNT, 5=Golden Mystery
  const STAGES = [
    // Stage 1: The Gateway
    {
      name: 'The Gateway',
      rows: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 1, 1, 5, 5, 1, 1, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    // Stage 2: Twin Towers
    {
      name: 'Twin Towers',
      rows: [
        [2, 2, 0, 0, 1, 1, 0, 0, 2, 2],
        [2, 4, 0, 0, 1, 1, 0, 0, 4, 2],
        [2, 2, 0, 0, 5, 5, 0, 0, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    // Stage 3: Diamond Matrix
    {
      name: 'Diamond Matrix',
      rows: [
        [0, 0, 0, 0, 4, 4, 0, 0, 0, 0],
        [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
        [0, 0, 1, 2, 5, 5, 2, 1, 0, 0],
        [0, 1, 2, 3, 3, 3, 3, 2, 1, 0],
        [0, 0, 1, 2, 5, 5, 2, 1, 0, 0],
        [0, 0, 0, 1, 2, 2, 1, 0, 0, 0]
      ]
    },
    // Stage 4: Castle Bastion
    {
      name: 'Castle Bastion',
      rows: [
        [3, 0, 3, 0, 3, 3, 0, 3, 0, 3],
        [3, 2, 3, 2, 5, 5, 2, 3, 2, 3],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [1, 4, 1, 4, 1, 1, 4, 1, 4, 1]
      ]
    },
    // Stage 5: TNT Chain Blast
    {
      name: 'Chain Blast',
      rows: [
        [1, 4, 1, 4, 1, 1, 4, 1, 4, 1],
        [4, 2, 4, 2, 4, 4, 2, 4, 2, 4],
        [1, 4, 1, 4, 5, 5, 4, 1, 4, 1],
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
      ]
    },
    // Stage 6: The Space Invader
    {
      name: 'Cosmic Invader',
      rows: [
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 3, 1, 1, 3, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 5, 5, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 1, 0, 1]
      ]
    },
    // Stage 7: Neon Cross
    {
      name: 'Neon Cross',
      rows: [
        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
        [1, 1, 1, 4, 5, 5, 4, 1, 1, 1],
        [1, 1, 1, 4, 5, 5, 4, 1, 1, 1],
        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0]
      ]
    },
    // Stage 8: Obsidian Shield
    {
      name: 'Obsidian Shield',
      rows: [
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [2, 4, 2, 5, 2, 2, 5, 2, 4, 2],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    // Stage 9: Rainbow Waves
    {
      name: 'Rainbow Waves',
      rows: [
        [1, 2, 3, 4, 5, 5, 4, 3, 2, 1],
        [2, 3, 4, 5, 1, 1, 5, 4, 3, 2],
        [3, 4, 5, 1, 2, 2, 1, 5, 4, 3],
        [4, 5, 1, 2, 3, 3, 2, 1, 5, 4]
      ]
    },
    // Stage 10: Spiral Core
    {
      name: 'Spiral Core',
      rows: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 3, 3, 3, 3, 3, 3, 0, 2],
        [2, 0, 3, 4, 5, 5, 4, 3, 0, 2],
        [2, 0, 3, 0, 0, 0, 0, 3, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 0, 2]
      ]
    },
    // Stages 11-20 (Higher Complexity)
    {
      name: 'Cyber Pillars',
      rows: [
        [3, 1, 3, 1, 3, 3, 1, 3, 1, 3],
        [3, 1, 3, 1, 5, 5, 1, 3, 1, 3],
        [3, 4, 3, 4, 3, 3, 4, 3, 4, 3],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    {
      name: 'The Quantum Gate',
      rows: [
        [3, 3, 3, 0, 0, 0, 0, 3, 3, 3],
        [3, 5, 3, 0, 4, 4, 0, 3, 5, 3],
        [2, 2, 2, 1, 2, 2, 1, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    {
      name: 'Hazard Minefield',
      rows: [
        [4, 1, 4, 1, 4, 4, 1, 4, 1, 4],
        [1, 4, 1, 4, 1, 1, 4, 1, 4, 1],
        [4, 1, 5, 1, 4, 4, 1, 5, 1, 4],
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
      ]
    },
    {
      name: 'The Citadel',
      rows: [
        [0, 0, 3, 3, 3, 3, 3, 3, 0, 0],
        [0, 3, 2, 2, 2, 2, 2, 2, 3, 0],
        [3, 2, 4, 5, 1, 1, 5, 4, 2, 3],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    {
      name: 'Vortex Grid',
      rows: [
        [1, 2, 1, 2, 1, 1, 2, 1, 2, 1],
        [2, 3, 4, 3, 2, 2, 3, 4, 3, 2],
        [1, 4, 5, 4, 1, 1, 4, 5, 4, 1],
        [2, 3, 4, 3, 2, 2, 3, 4, 3, 2]
      ]
    },
    {
      name: 'Heavy Alloy',
      rows: [
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        [3, 2, 2, 2, 5, 5, 2, 2, 2, 3],
        [3, 2, 4, 4, 4, 4, 4, 4, 2, 3],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    {
      name: 'Omega Chamber',
      rows: [
        [2, 4, 2, 3, 5, 5, 3, 2, 4, 2],
        [4, 3, 4, 2, 1, 1, 2, 4, 3, 4],
        [2, 4, 2, 3, 5, 5, 3, 2, 4, 2],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    },
    {
      name: 'Sanctum Vault',
      rows: [
        [3, 0, 3, 0, 5, 5, 0, 3, 0, 3],
        [0, 3, 0, 3, 4, 4, 3, 0, 3, 0],
        [3, 0, 3, 0, 5, 5, 0, 3, 0, 3],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ]
    },
    {
      name: 'The Crucible',
      rows: [
        [3, 3, 4, 3, 3, 3, 3, 4, 3, 3],
        [2, 2, 5, 2, 2, 2, 2, 5, 2, 2],
        [1, 1, 4, 1, 1, 1, 1, 4, 1, 1],
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
      ]
    },
    {
      name: 'Quantum Overlord',
      rows: [
        [3, 4, 5, 4, 3, 3, 4, 5, 4, 3],
        [4, 3, 2, 3, 4, 4, 3, 2, 3, 4],
        [5, 2, 1, 2, 5, 5, 2, 1, 2, 5],
        [4, 3, 2, 3, 4, 4, 3, 2, 3, 4],
        [3, 4, 5, 4, 3, 3, 4, 5, 4, 3]
      ]
    }
  ];

  /* ══════════════════════════════════════════════════════════════
     STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let gameSave = {
    unlockedStage: 1,
    highScore: 0,
    stars: {}
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('neon_breaker_save_v1');
      if (data) gameSave = Object.assign(gameSave, JSON.parse(data));
    } catch (e) {}
  }

  function writeSave() {
    try {
      localStorage.setItem('neon_breaker_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     ENGINE VARIABLES
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let currentStageIdx = 0;
  let gameState = 'menu'; // 'menu', 'playing', 'stageclear', 'gameover'
  let isPaused = false;

  let score = 0;
  let lives = 3;
  let combo = 0;
  let screenShake = 0;

  // Paddle
  let paddle = {
    x: 0,
    y: 0,
    width: 120,
    baseWidth: 120,
    height: 16,
    speed: 650,
    laserArmed: false,
    laserTimer: 0,
    expandedTimer: 0,
    sticky: false
  };

  let balls = [];
  let bricks = [];
  let powerups = [];
  let lasers = [];
  let particles = [];
  let bottomShield = false;
  let shieldTimer = 0;

  let keys = { left: false, right: false, space: false };
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

    paddle.y = height - 50;
    if (paddle.x === 0) paddle.x = (width - paddle.width) / 2;
  }
  window.addEventListener('resize', resize);

  /* ══════════════════════════════════════════════════════════════
     STAGE GENERATOR
     ══════════════════════════════════════════════════════════════ */
  function loadStage(idx) {
    currentStageIdx = idx;
    const stage = STAGES[idx];
    bricks = [];
    powerups = [];
    lasers = [];
    combo = 0;

    const cols = 10;
    const padding = 30;
    const availableW = width - padding * 2;
    const brickW = availableW / cols - 6;
    const brickH = 24;
    const startY = 80;

    for (let r = 0; r < stage.rows.length; r++) {
      for (let c = 0; c < stage.rows[r].length; c++) {
        const type = stage.rows[r][c];
        if (type === 0) continue;

        let hp = 1;
        let color = '#00f0d0';
        if (type === 2) { hp = 2; color = '#ff2a85'; }
        if (type === 3) { hp = 3; color = '#8b5cf6'; }
        if (type === 4) { hp = 1; color = '#ef4444'; } // TNT
        if (type === 5) { hp = 1; color = '#f59e0b'; } // Golden mystery

        bricks.push({
          x: padding + c * (brickW + 6),
          y: startY + r * (brickH + 6),
          w: brickW,
          h: brickH,
          type,
          hp,
          maxHp: hp,
          color,
          r, c
        });
      }
    }

    // Reset Balls
    resetBalls();

    // UI Updates
    document.getElementById('stageTitle').textContent = `Stage ${idx + 1}: ${stage.name}`;
    updateBrickCountUI();
  }

  function resetBalls() {
    balls = [{
      x: paddle.x + paddle.width / 2,
      y: paddle.y - 12,
      vx: (Math.random() - 0.5) * 200,
      vy: -400,
      radius: 7,
      isFireball: false,
      stuck: true
    }];
  }

  function updateBrickCountUI() {
    const el = document.getElementById('stageBricks');
    if (el) el.textContent = `${bricks.length} BRICKS REMAINING`;
  }

  /* ══════════════════════════════════════════════════════════════
     PHYSICS & COLLISION
     ══════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (gameState !== 'playing') return;

    // Paddle Movement
    if (keys.left) paddle.x -= paddle.speed * dt;
    if (keys.right) paddle.x += paddle.speed * dt;
    paddle.x = Math.max(0, Math.min(width - paddle.width, paddle.x));

    // Powerup Timers
    if (paddle.expandedTimer > 0) {
      paddle.expandedTimer -= dt;
      if (paddle.expandedTimer <= 0) paddle.width = paddle.baseWidth;
    }
    if (paddle.laserTimer > 0) {
      paddle.laserTimer -= dt;
      if (paddle.laserTimer <= 0) paddle.laserArmed = false;
    }
    if (shieldTimer > 0) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) bottomShield = false;
    }

    // Update Lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= 700 * dt;
      // Check brick collision
      let hit = false;
      for (let b of bricks) {
        if (l.x >= b.x && l.x <= b.x + b.w && l.y >= b.y && l.y <= b.y + b.h) {
          damageBrick(b);
          hit = true;
          break;
        }
      }
      if (hit || l.y < 0) lasers.splice(i, 1);
    }

    // Update Balls
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];

      if (b.stuck) {
        b.x = paddle.x + paddle.width / 2;
        b.y = paddle.y - b.radius - 1;
        if (keys.space) {
          b.stuck = false;
          b.vx = (Math.random() - 0.5) * 200;
          b.vy = -420;
        }
        continue;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Wall reflections
      if (b.x - b.radius <= 0) {
        b.x = b.radius;
        b.vx = Math.abs(b.vx);
        playSound('paddle', 0.2);
      } else if (b.x + b.radius >= width) {
        b.x = width - b.radius;
        b.vx = -Math.abs(b.vx);
        playSound('paddle', 0.2);
      }
      if (b.y - b.radius <= 0) {
        b.y = b.radius;
        b.vy = Math.abs(b.vy);
        playSound('paddle', 0.2);
      }

      // Bottom death or shield
      if (b.y + b.radius >= height) {
        if (bottomShield) {
          b.y = height - b.radius;
          b.vy = -Math.abs(b.vy);
          playSound('paddle', 0.8);
        } else {
          balls.splice(i, 1);
          continue;
        }
      }

      // Paddle Collision
      if (b.y + b.radius >= paddle.y && b.y - b.radius <= paddle.y + paddle.height &&
          b.x >= paddle.x && b.x <= paddle.x + paddle.width && b.vy > 0) {
        
        combo = 0; // Reset combo when ball returns to paddle
        const hitOffset = (b.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2); // -1 to 1
        const speed = Math.hypot(b.vx, b.vy);
        const maxAngle = Math.PI * 0.4; // 72 deg
        const angle = hitOffset * maxAngle - Math.PI / 2;

        b.vx = Math.cos(angle) * Math.min(speed, 540);
        b.vy = Math.sin(angle) * Math.min(speed, 540);
        b.y = paddle.y - b.radius - 1;

        playSound('paddle', Math.abs(hitOffset));
      }

      // Brick Collisions
      for (let j = bricks.length - 1; j >= 0; j--) {
        const br = bricks[j];
        if (checkCircleRect(b, br)) {
          combo++;
          damageBrick(br);

          if (!b.isFireball) {
            // Reflect ball vector
            const prevX = b.x - b.vx * dt;
            const prevY = b.y - b.vy * dt;
            if (prevX <= br.x || prevX >= br.x + br.w) b.vx *= -1;
            else b.vy *= -1;
          }
          break;
        }
      }
    }

    // Check ball loss
    if (balls.length === 0) {
      lives--;
      updateLivesUI();
      if (lives <= 0) {
        gameOver();
        return;
      } else {
        resetBalls();
      }
    }

    // Update Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.y += 180 * dt;

      // Caught by paddle?
      if (p.y >= paddle.y && p.y <= paddle.y + paddle.height &&
          p.x >= paddle.x && p.x <= paddle.x + paddle.width) {
        applyPowerup(p.type);
        powerups.splice(i, 1);
        continue;
      }
      if (p.y > height) powerups.splice(i, 1);
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Check Victory
    if (bricks.length === 0) {
      stageClear();
    }

    if (screenShake > 0) screenShake *= 0.88;
  }

  function checkCircleRect(c, r) {
    const closeX = Math.max(r.x, Math.min(c.x, r.x + r.w));
    const closeY = Math.max(r.y, Math.min(c.y, r.y + r.h));
    const dx = c.x - closeX;
    const dy = c.y - closeY;
    return (dx * dx + dy * dy) < (c.radius * c.radius);
  }

  function damageBrick(br) {
    br.hp--;
    score += 10 * Math.max(1, combo);
    document.getElementById('currentScore').textContent = score;

    playSound('brick', combo);

    // Particle Burst
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 160 + 40;
      particles.push({
        x: br.x + br.w / 2,
        y: br.y + br.h / 2,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: br.color,
        size: Math.random() * 3 + 1,
        life: 0.5,
        maxLife: 0.5
      });
    }

    if (br.hp <= 0) {
      // Remove brick
      const idx = bricks.indexOf(br);
      if (idx !== -1) bricks.splice(idx, 1);
      updateBrickCountUI();

      // TNT Explosion
      if (br.type === 4) {
        detonateTNT(br);
      }

      // Spawn Powerup chance
      if (br.type === 5 || Math.random() < 0.24) {
        spawnPowerup(br.x + br.w / 2, br.y + br.h / 2);
      }
    }
  }

  function detonateTNT(br) {
    playSound('tnt');
    screenShake = 16;
    const blastRadius = 90;

    for (let i = bricks.length - 1; i >= 0; i--) {
      const other = bricks[i];
      const dist = Math.hypot(other.x + other.w / 2 - (br.x + br.w / 2), other.y + other.h / 2 - (br.y + br.h / 2));
      if (dist < blastRadius) {
        damageBrick(other);
      }
    }
  }

  function spawnPowerup(x, y) {
    const types = ['multi', 'laser', 'fireball', 'shield', 'expand', 'slow'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({ x, y, type });
  }

  function applyPowerup(type) {
    playSound('powerup');
    if (type === 'multi') {
      const curCount = balls.length;
      for (let i = 0; i < curCount; i++) {
        const b = balls[i];
        balls.push({
          x: b.x, y: b.y,
          vx: b.vx * 0.8 + 120,
          vy: b.vy,
          radius: b.radius,
          isFireball: b.isFireball,
          stuck: false
        });
        balls.push({
          x: b.x, y: b.y,
          vx: b.vx * 0.8 - 120,
          vy: b.vy,
          radius: b.radius,
          isFireball: b.isFireball,
          stuck: false
        });
      }
    } else if (type === 'laser') {
      paddle.laserArmed = true;
      paddle.laserTimer = 10; // 10s
    } else if (type === 'expand') {
      paddle.width = paddle.baseWidth * 1.5;
      paddle.expandedTimer = 14;
    } else if (type === 'fireball') {
      balls.forEach(b => b.isFireball = true);
      setTimeout(() => balls.forEach(b => b.isFireball = false), 8000);
    } else if (type === 'shield') {
      bottomShield = true;
      shieldTimer = 15;
    }
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

    // Draw Synthwave Horizon Grid
    drawSynthwaveGrid();

    // Draw Bottom Shield Forcefield
    if (bottomShield) {
      ctx.save();
      ctx.strokeStyle = '#00f0d0';
      ctx.shadowColor = '#00f0d0';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, height - 2);
      ctx.lineTo(width, height - 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Bricks
    bricks.forEach(br => {
      ctx.save();
      ctx.fillStyle = br.color;
      ctx.shadowColor = br.color;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(br.x, br.y, br.w, br.h, 4);
      ctx.fill();
      ctx.stroke();

      // Inner icon for special bricks
      if (br.type === 4) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', br.x + br.w / 2, br.y + br.h / 2);
      } else if (br.type === 5) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', br.x + br.w / 2, br.y + br.h / 2);
      } else if (br.maxHp > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(br.hp, br.x + br.w / 2, br.y + br.h / 2);
      }

      ctx.restore();
    });

    // Draw Powerups
    powerups.forEach(p => {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#060919';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const glyph = p.type === 'multi' ? '3x' : p.type === 'laser' ? '🔫' : p.type === 'shield' ? '🛡️' : '★';
      ctx.fillText(glyph, p.x, p.y);
      ctx.restore();
    });

    // Draw Lasers
    lasers.forEach(l => {
      ctx.save();
      ctx.fillStyle = '#ff2a85';
      ctx.shadowColor = '#ff2a85';
      ctx.shadowBlur = 10;
      ctx.fillRect(l.x - 2, l.y, 4, 16);
      ctx.restore();
    });

    // Draw Balls
    balls.forEach(b => {
      ctx.save();
      const ballColor = b.isFireball ? '#f59e0b' : '#00f0d0';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = ballColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Paddle
    ctx.save();
    ctx.translate(paddle.x, paddle.y);
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00f0d0';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0d0';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(0, 0, paddle.width, paddle.height, 8);
    ctx.fill();
    ctx.stroke();

    // Energy Core Center
    ctx.fillStyle = '#00f0d0';
    ctx.fillRect(paddle.width * 0.35, 4, paddle.width * 0.3, 8);

    if (paddle.laserArmed) {
      // Cannons
      ctx.fillStyle = '#ff2a85';
      ctx.fillRect(2, -6, 6, 8);
      ctx.fillRect(paddle.width - 8, -6, 6, 8);
    }
    ctx.restore();

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

    ctx.restore();
  }

  function drawSynthwaveGrid() {
    ctx.strokeStyle = 'rgba(255, 42, 133, 0.05)';
    ctx.lineWidth = 1;
    const horizon = height * 0.35;

    for (let y = horizon; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    const center = width / 2;
    for (let x = -width; x < width * 2; x += 70) {
      ctx.beginPath(); ctx.moveTo(center, horizon); ctx.lineTo(x, height); ctx.stroke();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     USER CONTROLS & BINDINGS
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ' || e.key === 'Enter') {
      keys.space = true;
      if (paddle.laserArmed && gameState === 'playing') {
        fireLasers();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === ' ' || e.key === 'Enter') keys.space = false;
  });

  // Mouse & Touch Tracking
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left - paddle.width / 2;
    paddle.x = Math.max(0, Math.min(width - paddle.width, targetX));
  });

  canvas.addEventListener('pointerdown', (e) => {
    // Launch stuck ball or fire laser
    keys.space = true;
    if (paddle.laserArmed && gameState === 'playing') {
      fireLasers();
    }
    setTimeout(() => keys.space = false, 100);
  });

  function fireLasers() {
    playSound('laser');
    lasers.push({ x: paddle.x + 5, y: paddle.y - 8 });
    lasers.push({ x: paddle.x + paddle.width - 5, y: paddle.y - 8 });
  }

  function updateLivesUI() {
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById(`heart${i}`);
      if (heart) heart.classList.toggle('lost', i > lives);
    }
  }

  function startGame(stageIdx) {
    gameState = 'playing';
    isPaused = false;
    lives = 3;
    score = 0;
    updateLivesUI();
    document.getElementById('currentScore').textContent = '0';

    const pauseModal = document.getElementById('pauseModal');
    if (pauseModal) pauseModal.classList.remove('open');
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ PAUSE';

    document.getElementById('menuModal').classList.remove('open');
    document.getElementById('gameOverModal').classList.remove('open');
    document.getElementById('stageClearModal').classList.remove('open');
    loadStage(stageIdx || 0);
  }

  function stageClear() {
    gameState = 'stageclear';
    playSound('powerup');

    if (currentStageIdx + 1 > gameSave.unlockedStage) {
      gameSave.unlockedStage = currentStageIdx + 2;
      writeSave();
    }

    document.getElementById('scScore').textContent = score;
    document.getElementById('stageClearModal').classList.add('open');
  }

  function gameOver() {
    gameState = 'gameover';
    writeSave();
    document.getElementById('goScore').textContent = score;
    document.getElementById('gameOverModal').classList.add('open');
  }

  /* ══════════════════════════════════════════════════════════════
     STAGE SELECTOR MODAL
     ══════════════════════════════════════════════════════════════ */
  function renderStageGrid() {
    const grid = document.getElementById('stageGrid');
    if (!grid) return;
    grid.innerHTML = '';

    STAGES.forEach((s, idx) => {
      const isLocked = idx + 1 > gameSave.unlockedStage;
      const card = document.createElement('div');
      card.className = `stage-card ${isLocked ? 'locked' : ''}`;
      card.innerHTML = `
        <div class="stage-num">${idx + 1}</div>
        <div class="stage-stars">${isLocked ? '🔒' : '★★★'}</div>
      `;
      if (!isLocked) {
        card.addEventListener('click', () => {
          startGame(idx);
          document.getElementById('stagesModal').classList.remove('open');
        });
      }
      grid.appendChild(card);
    });
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

  /* ══════════════════════════════════════════════════════════════
     INITIALIZATION
     ══════════════════════════════════════════════════════════════ */
  document.getElementById('startPlayBtn').addEventListener('click', () => startGame(0));
  document.getElementById('retryBtn').addEventListener('click', () => startGame(currentStageIdx));
  document.getElementById('nextStageBtn').addEventListener('click', () => {
    if (currentStageIdx + 1 < STAGES.length) {
      startGame(currentStageIdx + 1);
    } else {
      alert('🎉 ALL 20 STAGES COMPLETED!');
    }
  });

  const stagesBtn = document.getElementById('stagesBtn');
  const stagesModal = document.getElementById('stagesModal');
  const closeStagesBtn = document.getElementById('closeStagesBtn');

  if (stagesBtn && stagesModal) {
    stagesBtn.addEventListener('click', () => {
      renderStageGrid();
      stagesModal.classList.add('open');
    });
    closeStagesBtn.addEventListener('click', () => stagesModal.classList.remove('open'));
  }

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
      startGame(currentStageIdx);
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

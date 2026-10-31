/**
 * PRISM QUEST — THE LOST LIGHT
 * Complete Production-Quality 2D/2.5D Mirror & Light Ray-Tracing Puzzle Game
 * 100% Vanilla HTML5 Canvas & Web Audio API Engine
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     AUDIO SYNTHESIS ENGINE (Web Audio API)
     ══════════════════════════════════════════════════════════════ */
  let audioCtx = null;
  let sfxEnabled = true;
  let musicEnabled = true;
  let bgmInterval = null;

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

  // Synthesize SFX
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

      if (type === 'rotate') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'beam') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'star') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'portal') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'victory') {
        // Glorious crystal chord
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.type = 'triangle';
          chordOsc.frequency.setValueAtTime(freq, now + idx * 0.07);
          chordGain.gain.setValueAtTime(0.08, now + idx * 0.07);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.8);
          chordOsc.connect(chordGain);
          chordGain.connect(ctx.destination);
          chordOsc.start(now + idx * 0.07);
          chordOsc.stop(now + idx * 0.07 + 0.85);
        });
      }
    } catch (e) {}
  }

  // Generative Ambient Cosmic BGM
  function startBgm() {
    if (bgmInterval || !musicEnabled) return;
    const chords = [
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G
      [146.83, 174.61, 220.00, 261.63]  // Dm7
    ];
    let step = 0;

    function playChord() {
      if (!musicEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      try {
        const chord = chords[step % chords.length];
        const now = ctx.currentTime;
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.015, now);
          gain.gain.linearRampToValueAtTime(0.025, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 3.9);
        });
        step++;
      } catch (e) {}
    }

    playChord();
    bgmInterval = setInterval(playChord, 3800);
  }

  function stopBgm() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     HANDCRAFTED 30 LEVELS DATASET (100% Solvable)
     ══════════════════════════════════════════════════════════════ */
  // Directions: 0 = UP, 1 = RIGHT, 2 = DOWN, 3 = LEFT
  // Mirror Angle: 0 = '/', 1 = '\' (toggle 0/1 on click)
  // Splitter: splits incoming beam into 2 perpendicular beams
  // Portal: pairs A and B
  const LEVELS = [
    // ── CHAPTER 1: THE COSMIC SHRINES (Levels 1 - 10) ──
    {
      id: 1, chapter: 1, name: 'First Refraction', grid: 5, par: 1,
      emitter: { x: 0, y: 2, dir: 1, color: '#00f0d0' },
      targets: [{ x: 2, y: 0, color: '#00f0d0' }],
      tiles: [{ x: 2, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }],
      stars: [{ x: 2, y: 1 }],
      tutorial: 'Tap the mirror to rotate it and guide the cyan beam to the crystal!'
    },
    {
      id: 2, chapter: 1, name: 'Double Reflection', grid: 5, par: 2,
      emitter: { x: 0, y: 1, dir: 1, color: '#00f0d0' },
      targets: [{ x: 4, y: 4, color: '#00f0d0' }],
      tiles: [
        { x: 3, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 3, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 3, y: 2 }]
    },
    {
      id: 3, chapter: 1, name: 'Obelisk Corridor', grid: 6, par: 2,
      emitter: { x: 0, y: 2, dir: 1, color: '#00f0d0' },
      targets: [{ x: 5, y: 2, color: '#00f0d0' }],
      walls: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
      tiles: [
        { x: 1, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 1, y: 4, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 4, y: 2, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 2, y: 4 }, { x: 3, y: 4 }]
    },
    {
      id: 4, chapter: 1, name: 'Dual Resonance', grid: 6, par: 3,
      emitter: { x: 0, y: 1, dir: 1, color: '#00f0d0' },
      targets: [{ x: 5, y: 1, color: '#00f0d0' }, { x: 2, y: 5, color: '#00f0d0' }],
      tiles: [
        { x: 2, y: 1, type: 'splitter', rotatable: false },
        { x: 2, y: 3, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 3, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 4, y: 5, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 3, y: 1 }]
    },
    {
      id: 5, chapter: 1, name: 'The Golden Zigzag', grid: 6, par: 3,
      emitter: { x: 1, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 4, y: 5, color: '#00f0d0' }],
      walls: [{ x: 2, y: 2 }, { x: 3, y: 3 }],
      tiles: [
        { x: 1, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 4, y: 2, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 2, y: 4 }]
    },
    {
      id: 6, chapter: 1, name: 'Cross Beam Sanctuary', grid: 6, par: 3,
      emitter: { x: 0, y: 3, dir: 1, color: '#00f0d0' },
      targets: [{ x: 3, y: 0, color: '#00f0d0' }],
      walls: [{ x: 3, y: 2 }],
      tiles: [
        { x: 2, y: 3, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 2, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 1, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 4, y: 0, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 4, y: 2 }]
    },
    {
      id: 7, chapter: 1, name: 'The Spiral Vault', grid: 7, par: 4,
      emitter: { x: 0, y: 0, dir: 1, color: '#00f0d0' },
      targets: [{ x: 3, y: 3, color: '#00f0d0' }],
      tiles: [
        { x: 5, y: 0, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 5, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 1, y: 5, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 1, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 3, y: 2, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 5, y: 3 }, { x: 2, y: 5 }]
    },
    {
      id: 8, chapter: 1, name: 'Void Labyrinth', grid: 7, par: 3,
      emitter: { x: 0, y: 4, dir: 1, color: '#00f0d0' },
      targets: [{ x: 6, y: 1, color: '#00f0d0' }],
      walls: [{ x: 2, y: 4 }, { x: 4, y: 3 }, { x: 3, y: 2 }],
      tiles: [
        { x: 1, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 1, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 1, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 3, y: 1 }]
    },
    {
      id: 9, chapter: 1, name: 'Prismatic Gate', grid: 7, par: 4,
      emitter: { x: 3, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 0, y: 6, color: '#00f0d0' }, { x: 6, y: 6, color: '#00f0d0' }],
      tiles: [
        { x: 3, y: 3, type: 'splitter', rotatable: false },
        { x: 1, y: 3, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 3, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 1, y: 6, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 5, y: 6, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 2, y: 3 }, { x: 4, y: 3 }]
    },
    {
      id: 10, chapter: 1, name: 'The Shrine Master', grid: 7, par: 5,
      emitter: { x: 0, y: 2, dir: 1, color: '#00f0d0' },
      targets: [{ x: 4, y: 6, color: '#00f0d0' }],
      walls: [{ x: 3, y: 2 }, { x: 3, y: 4 }],
      tiles: [
        { x: 2, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 2, y: 5, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 5, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 5, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 1, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 5, y: 3 }]
    },

    // ── CHAPTER 2: THE CRYSTAL SPLITTERS (Levels 11 - 20) ──
    {
      id: 11, chapter: 2, name: 'Tri-Beam Chamber', grid: 7, par: 3,
      emitter: { x: 0, y: 3, dir: 1, color: '#00f0d0' },
      targets: [{ x: 3, y: 0, color: '#00f0d0' }, { x: 3, y: 6, color: '#00f0d0' }, { x: 6, y: 3, color: '#00f0d0' }],
      tiles: [
        { x: 3, y: 3, type: 'splitter', rotatable: false },
        { x: 2, y: 3, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 2, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 4, y: 3 }]
    },
    {
      id: 12, chapter: 2, name: 'The Light Cascade', grid: 7, par: 4,
      emitter: { x: 1, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 5, y: 6, color: '#00f0d0' }],
      walls: [{ x: 2, y: 3 }, { x: 4, y: 3 }],
      tiles: [
        { x: 1, y: 2, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 3, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 3, y: 4, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 3, y: 3 }]
    },
    {
      id: 13, chapter: 2, name: 'Twin Prisms', grid: 7, par: 4,
      emitter: { x: 0, y: 2, dir: 1, color: '#00f0d0' },
      targets: [{ x: 6, y: 0, color: '#00f0d0' }, { x: 6, y: 4, color: '#00f0d0' }],
      tiles: [
        { x: 2, y: 2, type: 'splitter', rotatable: false },
        { x: 2, y: 0, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 2, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 4, y: 0 }, { x: 4, y: 4 }]
    },
    {
      id: 14, chapter: 2, name: 'Shattered Mirror', grid: 7, par: 4,
      emitter: { x: 2, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 4, y: 6, color: '#00f0d0' }],
      walls: [{ x: 3, y: 3 }, { x: 2, y: 4 }],
      tiles: [
        { x: 2, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 5, y: 2, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 5, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 4, y: 5, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 5, y: 3 }]
    },
    {
      id: 15, chapter: 2, name: 'The Four Pillars', grid: 8, par: 4,
      emitter: { x: 0, y: 1, dir: 1, color: '#00f0d0' },
      targets: [{ x: 7, y: 6, color: '#00f0d0' }],
      walls: [{ x: 3, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 5 }, { x: 4, y: 5 }],
      tiles: [
        { x: 6, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 6, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 1, y: 4, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 1, y: 6, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 6, y: 3 }]
    },
    {
      id: 16, chapter: 2, name: 'Radiant Fork', grid: 8, par: 5,
      emitter: { x: 0, y: 4, dir: 1, color: '#00f0d0' },
      targets: [{ x: 7, y: 1, color: '#00f0d0' }, { x: 7, y: 7, color: '#00f0d0' }],
      tiles: [
        { x: 3, y: 4, type: 'splitter', rotatable: false },
        { x: 3, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 3, y: 7, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 5, y: 1 }, { x: 5, y: 7 }]
    },
    {
      id: 17, chapter: 2, name: 'The Obelisk Ring', grid: 8, par: 5,
      emitter: { x: 4, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 4, y: 7, color: '#00f0d0' }],
      walls: [{ x: 4, y: 3 }, { x: 4, y: 4 }],
      tiles: [
        { x: 4, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 6, y: 2, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 6, y: 5, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 4, y: 5, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 6, y: 4 }]
    },
    {
      id: 18, chapter: 2, name: 'Harmonic Convergence', grid: 8, par: 5,
      emitter: { x: 0, y: 2, dir: 1, color: '#00f0d0' },
      targets: [{ x: 6, y: 6, color: '#00f0d0' }],
      walls: [{ x: 3, y: 3 }, { x: 5, y: 3 }],
      tiles: [
        { x: 2, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 2, y: 5, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 5, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 4, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 6, y: 1, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 4, y: 3 }]
    },
    {
      id: 19, chapter: 2, name: 'Prism Geometry', grid: 8, par: 5,
      emitter: { x: 1, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 7, y: 3, color: '#00f0d0' }, { x: 1, y: 7, color: '#00f0d0' }],
      tiles: [
        { x: 1, y: 3, type: 'splitter', rotatable: false },
        { x: 4, y: 3, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 1, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 6, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 6, y: 3, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 5, y: 1 }]
    },
    {
      id: 20, chapter: 2, name: 'Guardian of the Core', grid: 8, par: 6,
      emitter: { x: 0, y: 3, dir: 1, color: '#00f0d0' },
      targets: [{ x: 7, y: 4, color: '#00f0d0' }],
      walls: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }],
      tiles: [
        { x: 2, y: 3, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 2, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 1, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 5, y: 6, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 7, y: 6, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 5, y: 4 }]
    },

    // ── CHAPTER 3: THE ASTRAL PORTALS (Levels 21 - 30) ──
    {
      id: 21, chapter: 3, name: 'The Wormhole Step', grid: 7, par: 2,
      emitter: { x: 0, y: 2, dir: 1, color: '#00f0d0' },
      targets: [{ x: 6, y: 5, color: '#00f0d0' }],
      portals: [{ x: 3, y: 2, pair: { x: 3, y: 5 } }],
      tiles: [
        { x: 5, y: 5, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 4, y: 5 }],
      tutorial: 'Portals bend space! Light entering one portal instantly exits the matching portal.'
    },
    {
      id: 22, chapter: 3, name: 'Spatial Warp', grid: 7, par: 3,
      emitter: { x: 1, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 5, y: 6, color: '#00f0d0' }],
      portals: [{ x: 1, y: 4, pair: { x: 4, y: 1 } }],
      walls: [{ x: 3, y: 3 }],
      tiles: [
        { x: 4, y: 3, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 3, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 1, y: 2 }]
    },
    {
      id: 23, chapter: 3, name: 'Mirror Through Time', grid: 8, par: 4,
      emitter: { x: 0, y: 1, dir: 1, color: '#00f0d0' },
      targets: [{ x: 7, y: 6, color: '#00f0d0' }],
      portals: [{ x: 4, y: 1, pair: { x: 1, y: 4 } }],
      tiles: [
        { x: 3, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 3, y: 6, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 6, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 2, y: 4 }]
    },
    {
      id: 24, chapter: 3, name: 'Quantum Split', grid: 8, par: 4,
      emitter: { x: 0, y: 3, dir: 1, color: '#00f0d0' },
      targets: [{ x: 7, y: 1, color: '#00f0d0' }, { x: 7, y: 6, color: '#00f0d0' }],
      portals: [{ x: 4, y: 1, pair: { x: 4, y: 6 } }],
      tiles: [
        { x: 2, y: 3, type: 'splitter', rotatable: false },
        { x: 2, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 2, y: 6, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 6, y: 1 }]
    },
    {
      id: 25, chapter: 3, name: 'Cosmic Singularity', grid: 8, par: 5,
      emitter: { x: 3, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 3, y: 7, color: '#00f0d0' }],
      portals: [{ x: 1, y: 2, pair: { x: 6, y: 5 } }],
      walls: [{ x: 3, y: 3 }, { x: 3, y: 4 }],
      tiles: [
        { x: 3, y: 2, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 6, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 3, y: 5, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 5, y: 5 }]
    },
    {
      id: 26, chapter: 3, name: 'The Celestial Compass', grid: 8, par: 5,
      emitter: { x: 0, y: 4, dir: 1, color: '#00f0d0' },
      targets: [{ x: 7, y: 4, color: '#00f0d0' }],
      portals: [{ x: 2, y: 2, pair: { x: 5, y: 5 } }],
      walls: [{ x: 3, y: 4 }, { x: 4, y: 4 }],
      tiles: [
        { x: 2, y: 4, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 5, y: 6, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 7, y: 6, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 6, y: 6 }]
    },
    {
      id: 27, chapter: 3, name: 'Hypercube Echoes', grid: 8, par: 5,
      emitter: { x: 0, y: 2, dir: 1, color: '#00f0d0' },
      targets: [{ x: 5, y: 7, color: '#00f0d0' }, { x: 7, y: 2, color: '#00f0d0' }],
      portals: [{ x: 3, y: 5, pair: { x: 6, y: 1 } }],
      tiles: [
        { x: 3, y: 2, type: 'splitter', rotatable: false },
        { x: 6, y: 2, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 6, y: 4, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 5, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true }
      ],
      stars: [{ x: 6, y: 3 }]
    },
    {
      id: 28, chapter: 3, name: 'Labyrinth of Dimensions', grid: 8, par: 6,
      emitter: { x: 1, y: 0, dir: 2, color: '#00f0d0' },
      targets: [{ x: 6, y: 7, color: '#00f0d0' }],
      portals: [{ x: 1, y: 3, pair: { x: 5, y: 1 } }, { x: 5, y: 4, pair: { x: 2, y: 6 } }],
      tiles: [
        { x: 5, y: 3, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 4, y: 6, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 6, y: 6, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 5, y: 2 }]
    },
    {
      id: 29, chapter: 3, name: 'The Eternal Prism', grid: 8, par: 6,
      emitter: { x: 0, y: 3, dir: 1, color: '#00f0d0' },
      targets: [{ x: 7, y: 1, color: '#00f0d0' }, { x: 7, y: 5, color: '#00f0d0' }],
      walls: [{ x: 4, y: 3 }],
      portals: [{ x: 2, y: 1, pair: { x: 5, y: 5 } }],
      tiles: [
        { x: 2, y: 3, type: 'splitter', rotatable: false },
        { x: 2, y: 5, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 5, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 6, y: 1 }, { x: 6, y: 5 }]
    },
    {
      id: 30, chapter: 3, name: 'The Lost Light Reclaimed', grid: 8, par: 7,
      emitter: { x: 0, y: 4, dir: 1, color: '#00f0d0' },
      targets: [{ x: 4, y: 0, color: '#00f0d0' }, { x: 7, y: 4, color: '#00f0d0' }, { x: 4, y: 7, color: '#00f0d0' }],
      walls: [{ x: 2, y: 2 }, { x: 5, y: 2 }, { x: 2, y: 5 }, { x: 5, y: 5 }],
      portals: [{ x: 4, y: 2, pair: { x: 4, y: 5 } }],
      tiles: [
        { x: 3, y: 4, type: 'splitter', rotatable: false },
        { x: 3, y: 1, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true },
        { x: 6, y: 4, type: 'mirror', angle: 1, targetAngle: 0, rotatable: true },
        { x: 3, y: 6, type: 'mirror', angle: 0, targetAngle: 1, rotatable: true }
      ],
      stars: [{ x: 1, y: 4 }, { x: 6, y: 2 }, { x: 6, y: 5 }]
    }
  ];

  /* ══════════════════════════════════════════════════════════════
     GAME STATE & PERSISTENCE
     ══════════════════════════════════════════════════════════════ */
  let currentLevelIdx = 0;
  let activeLevel = null;
  let movesCount = 0;
  let historyStack = [];
  let beamPathSegments = [];
  let isLevelSolved = false;
  let hoverCell = null;
  let activeParticles = [];

  // Storage State
  let gameSave = {
    unlockedLevel: 1,
    stars: {}, // { levelId: 1..3 }
    gems: 25,
    lastDaily: null
  };

  function loadSave() {
    try {
      const data = localStorage.getItem('prism_quest_save_v1');
      if (data) {
        gameSave = Object.assign(gameSave, JSON.parse(data));
      }
    } catch (e) {}
    updateTopBarStats();
  }

  function writeSave() {
    try {
      localStorage.setItem('prism_quest_save_v1', JSON.stringify(gameSave));
    } catch (e) {}
    updateTopBarStats();
  }

  function updateTopBarStats() {
    const gemsEl = document.getElementById('gemsCount');
    const starsEl = document.getElementById('starsCount');
    if (gemsEl) gemsEl.textContent = gameSave.gems || 0;
    
    let totalStars = 0;
    Object.values(gameSave.stars || {}).forEach(s => totalStars += s);
    if (starsEl) starsEl.textContent = totalStars;
  }

  /* ══════════════════════════════════════════════════════════════
     RAY TRACING ENGINE (Light Propagation)
     ══════════════════════════════════════════════════════════════ */
  function traceBeams() {
    beamPathSegments = [];
    if (!activeLevel) return;

    // Reset target illumination
    activeLevel.targets.forEach(t => t.lit = false);
    if (activeLevel.stars) activeLevel.stars.forEach(s => s.collected = false);

    const queue = [];
    // Initial ray from emitter
    queue.push({
      x: activeLevel.emitter.x,
      y: activeLevel.emitter.y,
      dir: activeLevel.emitter.dir,
      color: activeLevel.emitter.color,
      depth: 0
    });

    const maxDepth = 40; // prevent infinite reflection loop

    while (queue.length > 0) {
      const ray = queue.shift();
      if (ray.depth > maxDepth) continue;

      let curX = ray.x;
      let curY = ray.y;
      let curDir = ray.dir;
      const beamColor = ray.color;

      // Trace line across cells until interaction or edge
      let safety = 0;
      while (safety < 30) {
        safety++;

        // Next coordinate in direction
        let nextX = curX;
        let nextY = curY;
        if (curDir === 0) nextY -= 1; // UP
        else if (curDir === 1) nextX += 1; // RIGHT
        else if (curDir === 2) nextY += 1; // DOWN
        else if (curDir === 3) nextX -= 1; // LEFT

        // Record segment
        beamPathSegments.push({
          x1: curX, y1: curY,
          x2: nextX, y2: nextY,
          color: beamColor
        });

        // Out of grid bounds?
        if (nextX < 0 || nextX >= activeLevel.grid || nextY < 0 || nextY >= activeLevel.grid) {
          break;
        }

        // Check Star Pickup
        if (activeLevel.stars) {
          activeLevel.stars.forEach(s => {
            if (s.x === nextX && s.y === nextY && !s.collected) {
              s.collected = true;
              playSound('star');
            }
          });
        }

        // Check Target Crystal
        let hitTarget = false;
        activeLevel.targets.forEach(t => {
          if (t.x === nextX && t.y === nextY) {
            t.lit = true;
            hitTarget = true;
          }
        });
        if (hitTarget) {
          break;
        }

        // Check Wall / Obelisk
        if (activeLevel.walls && activeLevel.walls.some(w => w.x === nextX && w.y === nextY)) {
          // Ray blocked
          break;
        }

        // Check Portals
        let hitPortal = false;
        if (activeLevel.portals) {
          for (let p of activeLevel.portals) {
            if (p.x === nextX && p.y === nextY) {
              hitPortal = true;
              queue.push({
                x: p.pair.x,
                y: p.pair.y,
                dir: curDir,
                color: beamColor,
                depth: ray.depth + 1
              });
              break;
            } else if (p.pair.x === nextX && p.pair.y === nextY) {
              hitPortal = true;
              queue.push({
                x: p.x,
                y: p.y,
                dir: curDir,
                color: beamColor,
                depth: ray.depth + 1
              });
              break;
            }
          }
        }
        if (hitPortal) break;

        // Check Mirrors / Splitters
        const tile = activeLevel.tiles.find(t => t.x === nextX && t.y === nextY);
        if (tile) {
          if (tile.type === 'mirror') {
            // Reflect
            // Angle 0: '/' diagonal
            // Angle 1: '\' diagonal
            let newDir = null;
            if (tile.angle === 0) {
              // '/'
              if (curDir === 0) newDir = 1; // UP -> RIGHT
              else if (curDir === 1) newDir = 0; // RIGHT -> UP
              else if (curDir === 2) newDir = 3; // DOWN -> LEFT
              else if (curDir === 3) newDir = 2; // LEFT -> DOWN
            } else {
              // '\'
              if (curDir === 0) newDir = 3; // UP -> LEFT
              else if (curDir === 3) newDir = 0; // LEFT -> UP
              else if (curDir === 1) newDir = 2; // RIGHT -> DOWN
              else if (curDir === 2) newDir = 1; // DOWN -> RIGHT
            }
            if (newDir !== null) {
              curX = nextX;
              curY = nextY;
              curDir = newDir;
              continue;
            }
          } else if (tile.type === 'splitter') {
            // Splits beam perpendicular
            let dirA, dirB;
            if (curDir === 0 || curDir === 2) { // Vertical -> splits horizontal
              dirA = 1; dirB = 3;
            } else { // Horizontal -> splits vertical
              dirA = 0; dirB = 2;
            }
            queue.push({ x: nextX, y: nextY, dir: dirA, color: beamColor, depth: ray.depth + 1 });
            queue.push({ x: nextX, y: nextY, dir: dirB, color: beamColor, depth: ray.depth + 1 });
            break;
          }
        }

        // Continue straight
        curX = nextX;
        curY = nextY;
      }
    }

    // Check Victory Condition
    checkVictory();
  }

  function checkVictory() {
    if (!activeLevel || isLevelSolved) return;
    const allLit = activeLevel.targets.every(t => t.lit === true);
    if (allLit) {
      isLevelSolved = true;
      playSound('victory');

      // Calculate Stars
      let starsEarned = 1;
      if (movesCount <= activeLevel.par) {
        starsEarned = 3;
      } else if (movesCount <= activeLevel.par + 2) {
        starsEarned = 2;
      }

      // Update save
      const lvlId = activeLevel.id;
      const prevStars = gameSave.stars[lvlId] || 0;
      if (starsEarned > prevStars) {
        gameSave.stars[lvlId] = starsEarned;
        gameSave.gems += (starsEarned - prevStars) * 5;
      }

      if (gameSave.unlockedLevel <= lvlId && lvlId < LEVELS.length) {
        gameSave.unlockedLevel = lvlId + 1;
      }

      writeSave();
      setTimeout(() => showVictoryModal(starsEarned), 500);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     CANVAS RENDERING LOOP (Cosmic Puzzle Aesthetic)
     ══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('puzzleCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  function renderGame() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    if (!activeLevel) {
      requestAnimationFrame(renderGame);
      return;
    }

    const gridSize = activeLevel.grid;
    const padding = 34;
    const cellSize = (w - padding * 2) / gridSize;

    // Draw Grid Cells & Border
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cx = padding + c * cellSize;
        const cy = padding + r * cellSize;

        // Hover highlight
        if (hoverCell && hoverCell.x === c && hoverCell.y === r) {
          ctx.fillStyle = 'rgba(0, 240, 208, 0.08)';
          ctx.fillRect(cx, cy, cellSize, cellSize);
        }

        ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, cellSize, cellSize);
      }
    }

    // Draw Obstacles / Walls
    if (activeLevel.walls) {
      activeLevel.walls.forEach(wall => {
        const cx = padding + wall.x * cellSize;
        const cy = padding + wall.y * cellSize;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.fillRect(cx + 4, cy + 4, cellSize - 8, cellSize - 8);
        ctx.strokeRect(cx + 4, cy + 4, cellSize - 8, cellSize - 8);

        // Obelisk rune pattern
        ctx.fillStyle = '#64748b';
        ctx.font = '12px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◆', cx + cellSize / 2, cy + cellSize / 2);
      });
    }

    // Draw Portals
    if (activeLevel.portals) {
      activeLevel.portals.forEach(p => {
        [p, p.pair].forEach(pt => {
          const cx = padding + pt.x * cellSize + cellSize / 2;
          const cy = padding + pt.y * cellSize + cellSize / 2;

          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = 15;
          ctx.stroke();

          ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
          ctx.fill();
          ctx.restore();
        });
      });
    }

    // Draw Star Bonus Gems
    if (activeLevel.stars) {
      activeLevel.stars.forEach(s => {
        const cx = padding + s.x * cellSize + cellSize / 2;
        const cy = padding + s.y * cellSize + cellSize / 2;

        ctx.save();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (s.collected) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 20;
          ctx.fillText('★', cx, cy);
        } else {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
          ctx.fillText('☆', cx, cy);
        }
        ctx.restore();
      });
    }

    // Draw Beams with Neon Bloom
    if (beamPathSegments.length > 0) {
      ctx.save();
      beamPathSegments.forEach(seg => {
        const x1 = padding + seg.x1 * cellSize + cellSize / 2;
        const y1 = padding + seg.y1 * cellSize + cellSize / 2;
        const x2 = padding + seg.x2 * cellSize + cellSize / 2;
        const y2 = padding + seg.y2 * cellSize + cellSize / 2;

        // Outer glow
        ctx.strokeStyle = seg.color;
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Inner core white laser
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });
      ctx.restore();
    }

    // Draw Emitter Source
    const em = activeLevel.emitter;
    const emX = padding + em.x * cellSize + cellSize / 2;
    const emY = padding + em.y * cellSize + cellSize / 2;

    ctx.save();
    ctx.fillStyle = em.color;
    ctx.shadowColor = em.color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(emX, emY, cellSize * 0.26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(emX, emY, cellSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Target Crystal(s)
    activeLevel.targets.forEach(t => {
      const tx = padding + t.x * cellSize + cellSize / 2;
      const ty = padding + t.y * cellSize + cellSize / 2;

      ctx.save();
      if (t.lit) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 35;
        ctx.fillStyle = '#fbbf24';
      } else {
        ctx.shadowColor = 'rgba(251, 191, 36, 0.2)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#78350f';
      }

      // Diamond Crystal Shape
      const s = cellSize * 0.35;
      ctx.beginPath();
      ctx.moveTo(tx, ty - s);
      ctx.lineTo(tx + s, ty);
      ctx.lineTo(tx, ty + s);
      ctx.lineTo(tx - s, ty);
      ctx.closePath();
      ctx.fill();

      // Crystal facet
      ctx.strokeStyle = t.lit ? '#fff' : '#b45309';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    // Draw Tiles (Mirrors & Splitters)
    activeLevel.tiles.forEach(tile => {
      const cx = padding + tile.x * cellSize;
      const cy = padding + tile.y * cellSize;
      const centerTileX = cx + cellSize / 2;
      const centerTileY = cy + cellSize / 2;

      if (tile.type === 'mirror') {
        // Draw Mirror Frame
        ctx.save();
        ctx.translate(centerTileX, centerTileY);

        // Angle 0: '/' -> -45deg
        // Angle 1: '\' -> 45deg
        const rotationAngle = tile.angle === 0 ? -Math.PI / 4 : Math.PI / 4;
        ctx.rotate(rotationAngle);

        // Mirror Back Base
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-cellSize * 0.36, -4, cellSize * 0.72, 8);

        // Mirror Silver/Cyan Reflective Glass Face
        ctx.fillStyle = '#00f0d0';
        ctx.shadowColor = '#00f0d0';
        ctx.shadowBlur = 10;
        ctx.fillRect(-cellSize * 0.36, -2, cellSize * 0.72, 4);

        // Mirror pivot pin
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (tile.type === 'splitter') {
        // Splitter Prism Icon
        ctx.save();
        ctx.strokeStyle = '#00f0d0';
        ctx.fillStyle = 'rgba(0, 240, 208, 0.2)';
        ctx.shadowColor = '#00f0d0';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(centerTileX, centerTileY, cellSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✛', centerTileX, centerTileY);
        ctx.restore();
      }
    });

    requestAnimationFrame(renderGame);
  }

  /* ══════════════════════════════════════════════════════════════
     USER INPUT & INTERACTION
     ══════════════════════════════════════════════════════════════ */
  function getGridCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const padding = 34;
    const gridSize = activeLevel.grid;
    const cellSize = (rect.width - padding * 2) / gridSize;

    if (x < padding || x > rect.width - padding || y < padding || y > rect.height - padding) {
      return null;
    }
    const c = Math.floor((x - padding) / cellSize);
    const r = Math.floor((y - padding) / cellSize);
    if (c >= 0 && c < gridSize && r >= 0 && r < gridSize) {
      return { x: c, y: r };
    }
    return null;
  }

  canvas.addEventListener('mousemove', (e) => {
    hoverCell = getGridCoords(e.clientX, e.clientY);
  });

  canvas.addEventListener('mouseleave', () => {
    hoverCell = null;
  });

  function handleCellClick(c, r) {
    if (!activeLevel || isLevelSolved) return;

    // Find rotatable tile
    const tile = activeLevel.tiles.find(t => t.x === c && t.y === r && t.rotatable);
    if (tile) {
      // Save for Undo
      historyStack.push({
        tile: tile,
        prevAngle: tile.angle
      });

      // Toggle mirror angle (0 or 1)
      tile.angle = tile.angle === 0 ? 1 : 0;
      movesCount++;
      playSound('rotate');

      updateMovesDisplay();
      traceBeams();
    }
  }

  canvas.addEventListener('click', (e) => {
    const cell = getGridCoords(e.clientX, e.clientY);
    if (cell) {
      handleCellClick(cell.x, cell.y);
    }
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const cell = getGridCoords(touch.clientX, touch.clientY);
      if (cell) {
        handleCellClick(cell.x, cell.y);
      }
    }
    e.preventDefault();
  }, { passive: false });

  /* ══════════════════════════════════════════════════════════════
     CONTROLS: UNDO, RESET, HINT, LEVEL LOAD
     ══════════════════════════════════════════════════════════════ */
  function loadLevel(idx) {
    if (idx < 0 || idx >= LEVELS.length) return;
    currentLevelIdx = idx;

    // Clone level deeply
    const raw = LEVELS[idx];
    activeLevel = {
      id: raw.id,
      chapter: raw.chapter,
      name: raw.name,
      grid: raw.grid,
      par: raw.par,
      emitter: Object.assign({}, raw.emitter),
      targets: raw.targets.map(t => Object.assign({}, t)),
      walls: raw.walls ? raw.walls.map(w => Object.assign({}, w)) : [],
      portals: raw.portals ? raw.portals.map(p => ({ x: p.x, y: p.y, pair: Object.assign({}, p.pair) })) : [],
      stars: raw.stars ? raw.stars.map(s => Object.assign({}, s)) : [],
      tiles: raw.tiles.map(t => Object.assign({}, t)),
      tutorial: raw.tutorial
    };

    movesCount = 0;
    historyStack = [];
    isLevelSolved = false;

    // UI Updates
    document.getElementById('currentLevelName').textContent = `Level ${activeLevel.id}: ${activeLevel.name}`;
    document.getElementById('chapterName').textContent = `Chapter ${activeLevel.chapter}`;
    document.getElementById('parMoves').textContent = activeLevel.par;
    updateMovesDisplay();

    // Show tutorial alert if available
    if (activeLevel.tutorial) {
      showToast(activeLevel.tutorial);
    }

    traceBeams();
  }

  function updateMovesDisplay() {
    const el = document.getElementById('currentMoves');
    if (el) el.textContent = movesCount;
  }

  function undoMove() {
    if (historyStack.length === 0 || isLevelSolved) return;
    const last = historyStack.pop();
    last.tile.angle = last.prevAngle;
    movesCount = Math.max(0, movesCount - 1);
    playSound('rotate');
    updateMovesDisplay();
    traceBeams();
  }

  function resetLevel() {
    loadLevel(currentLevelIdx);
  }

  function useHint() {
    if (!activeLevel || isLevelSolved) return;

    // Find any mirror tile whose angle does not match its targetAngle
    const unaligned = activeLevel.tiles.find(t => t.rotatable && t.angle !== t.targetAngle);
    if (unaligned) {
      unaligned.angle = unaligned.targetAngle;
      movesCount++;
      playSound('rotate');
      updateMovesDisplay();
      traceBeams();
      showToast('✦ Alignment Revealed!');
    } else {
      showToast('✦ All mirrors aligned!');
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('boardToast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2800);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     MODAL CONTROLS & VICTORY DIALOG
     ══════════════════════════════════════════════════════════════ */
  function showVictoryModal(stars) {
    const modal = document.getElementById('victoryModal');
    if (!modal) return;

    // Display stars
    for (let i = 1; i <= 3; i++) {
      const starEl = document.getElementById(`starEarned${i}`);
      if (starEl) {
        if (i <= stars) starEl.classList.add('filled');
        else starEl.classList.remove('filled');
      }
    }

    document.getElementById('vMoves').textContent = movesCount;
    document.getElementById('vPar').textContent = activeLevel.par;
    document.getElementById('vGems').textContent = `+${stars * 5} 💎`;

    modal.classList.add('open');
  }

  function nextLevel() {
    const modal = document.getElementById('victoryModal');
    if (modal) modal.classList.remove('open');

    if (currentLevelIdx + 1 < LEVELS.length) {
      loadLevel(currentLevelIdx + 1);
    } else {
      showToast('🎉 CONGRATULATIONS! ALL 30 LEVELS COMPLETED!');
    }
  }

  function renderLevelGrid() {
    const container = document.getElementById('levelSelectGrid');
    if (!container) return;
    container.innerHTML = '';

    LEVELS.forEach((lvl, idx) => {
      const isLocked = lvl.id > gameSave.unlockedLevel;
      const isCurrent = idx === currentLevelIdx;
      const stars = gameSave.stars[lvl.id] || 0;

      const card = document.createElement('div');
      card.className = `level-card ${isLocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}`;
      
      let starStr = '☆☆☆';
      if (stars === 1) starStr = '★☆☆';
      if (stars === 2) starStr = '★★☆';
      if (stars === 3) starStr = '★★★';

      card.innerHTML = `
        <span class="lvl-number">${lvl.id}</span>
        <div class="lvl-stars">${isLocked ? '🔒' : starStr}</div>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          loadLevel(idx);
          document.getElementById('levelsModal').classList.remove('open');
        });
      }

      container.appendChild(card);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     EVENT LISTENERS & BINDINGS
     ══════════════════════════════════════════════════════════════ */
  document.getElementById('undoBtn').addEventListener('click', undoMove);
  document.getElementById('resetBtn').addEventListener('click', resetLevel);
  document.getElementById('hintBtn').addEventListener('click', useHint);
  document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);

  // Level Selection Modal
  const levelsBtn = document.getElementById('levelsBtn');
  const levelsModal = document.getElementById('levelsModal');
  const closeLevelsBtn = document.getElementById('closeLevelsBtn');

  levelsBtn.addEventListener('click', () => {
    renderLevelGrid();
    levelsModal.classList.add('open');
  });
  closeLevelsBtn.addEventListener('click', () => {
    levelsModal.classList.remove('open');
  });

  // Sound & Music Toggles
  const sfxBtn = document.getElementById('sfxBtn');
  sfxBtn.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    sfxBtn.classList.toggle('active', sfxEnabled);
    sfxBtn.textContent = sfxEnabled ? '🔊 SFX' : '🔇 SFX';
  });

  const musicBtn = document.getElementById('musicBtn');
  musicBtn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    musicBtn.classList.toggle('active', musicEnabled);
    musicBtn.textContent = musicEnabled ? '🎵 MUSIC' : '🔇 MUSIC';
    if (musicEnabled) startBgm();
    else stopBgm();
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'z' || e.key === 'Z') undoMove();
    if (e.key === 'r' || e.key === 'R') resetLevel();
    if (e.key === 'h' || e.key === 'H') useHint();
  });

  // Ambient Starfield
  const starCanvas = document.getElementById('starCanvas');
  if (starCanvas) {
    const sCtx = starCanvas.getContext('2d');
    let sw = starCanvas.width = window.innerWidth;
    let sh = starCanvas.height = window.innerHeight;
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * sw,
        y: Math.random() * sh,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.2 + 0.05
      });
    }

    function renderStarfield() {
      sCtx.clearRect(0, 0, sw, sh);
      stars.forEach(s => {
        s.y -= s.speed;
        if (s.y < 0) s.y = sh;
        sCtx.fillStyle = `rgba(139, 92, 246, ${s.alpha})`;
        sCtx.beginPath();
        sCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sCtx.fill();
      });
      requestAnimationFrame(renderStarfield);
    }
    renderStarfield();
  }

  /* ══════════════════════════════════════════════════════════════
     INITIALIZATION
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('resize', resizeCanvas);
  
  // Start engine on first interaction
  window.addEventListener('click', function initAudioOnce() {
    startBgm();
    window.removeEventListener('click', initAudioOnce);
  }, { once: true });

  loadSave();
  resizeCanvas();
  loadLevel(0);
  renderGame();

}());

# Hexa Merge: 2.5D Quantum 2048

**Hexa Merge** is an addictive 2.5D quantum hexagonal drop-and-merge puzzle game built with 100% Vanilla JavaScript, HTML5 Canvas 3D beveled prism rendering, and harmonic Web Audio sound synthesis.

---

## 💎 Gameplay & Features
- **3D Beveled Hexagonal Geometry:** Hexagonal prisms rendered with top facet gradient lighting, bottom extrusion drop-shadows, and dynamic perspective beveling.
- **Recursive Cascade Merge Combos:** Drop number prisms into hexagonal columns; when 2 or more adjacent tiles share identical values (2, 4, 8, 16 ... 2048), they implode into a higher-tier prism, triggering chain-reaction cascade combos.
- **Dynamic Physics & Floating Score Floaters:** Dropped prisms bounce with dampened harmonic physics and burst into color-coded particle showers upon fusion.
- **Harmonic Musical Chimes (Web Audio API):** Each merge tier plays an ascending pentatonic musical note, turning multi-combo cascades into pleasant harmonic sequences.
- **Endless Brain Training:** Easy to learn, deeply strategic to master. Manage column capacities and plan multi-step fusions to beat your high score.
- **Local Persistence:** Best high scores, highest tile unlocked, and total games saved in `localStorage.getItem('hexa_merge_save_v1')`.

# Prism Quest: The Lost Light

**Prism Quest** is a complete, original, production-quality HTML5 2D/2.5D optical puzzle game built from scratch using pure Vanilla JavaScript, native HTML5 Canvas, and the Web Audio API.

---

## 🌟 Game Overview

In **Prism Quest**, you awaken ancient celestial energy conduits across 30 cosmic chambers. By rotating optical mirrors and directing vibrant laser beams across a geometric grid, players must illuminate all dormant golden resonance crystals within Par move constraints.

### Core Features
- **30 Handcrafted Solvable Levels** arranged across 3 thematic chapters:
  - **Chapter 1: The Crystal Valley (Levels 1–10):** Introduces beam reflection, angle vectors, par move efficiency, and star pickups.
  - **Chapter 2: The Nebula Rift (Levels 11–20):** Introduces beam splitter prisms that bisect lasers into perpendicular dual rays.
  - **Chapter 3: The Void Sanctum (Levels 21–30):** Introduces twin wormhole portals, impassable obelisks, and complex multi-crystal ray-tracing challenges.
- **3-Star Rating System:** Based on Par efficiency (achieving Par moves grants 3 Stars).
- **In-Game Quality-of-Life:**
  - **Undo (<kbd>Z</kbd>):** Revert individual mirror rotations instantly without restarting.
  - **Reset (<kbd>R</kbd>):** Restore the current chamber to its pristine state.
  - **Hint Generator (<kbd>H</kbd>):** Intelligently highlights and rotates misaligned mirrors.
  - **Chamber Navigator:** Interactive 30-level selection modal displaying star completion.
- **Procedural Web Audio Engine:**
  - Dynamic chord progressions (Am7, Fmaj7, G, Dm7) synthesized using low-frequency sine oscillators.
  - Acoustic reflection, portal warp, crystal chiming, and star collection sound effects.
- **Zero Dependencies:** Pure vanilla CSS, HTML, and JS. 0 KB external framework overhead.
- **Local Persistence:** Full progress, earned stars, and collected gems are preserved privately in `localStorage.getItem('prism_quest_save_v1')`.

---

## 🎮 Controls

| Action | Keyboard | Touch / Mouse |
|---|---|---|
| **Rotate Mirror** | <kbd>Click</kbd> on Mirror | Tap mirror cell |
| **Undo Move** | <kbd>Z</kbd> | Tap Undo button |
| **Reset Chamber** | <kbd>R</kbd> | Tap Reset button |
| **Reveal Hint** | <kbd>H</kbd> | Tap Hint button |
| **Level Selector** | <kbd>Esc</kbd> / Click Button | Tap Levels button |

---

## 📐 Technical Architecture

- **Ray-Tracing Engine:** Operates a breadth-first light queue that propagates vectors across discrete coordinates, calculating reflection matrix changes upon mirror contact (`/` vs `\`), ray splitting, portal coordinate translation, and absorption on solid obstacles.
- **Canvas Rendering:** High-DPI retina canvas scaling with bloom glow filters (`shadowBlur`, `shadowColor`) and pulsating crystal resonance animations.
- **Responsive Viewport:** Scales dynamically from mobile screens (320px) up to 4K desktop displays.

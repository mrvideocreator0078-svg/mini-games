# Shadow Realm: Isometric Dungeon Crawler

**Shadow Realm** is an atmospheric 2.5D isometric action-roguelite dungeon crawler built with 100% Vanilla JavaScript, Canvas 2D projection rendering, and reactive procedural audio.

---

## ⚔️ Gameplay & Features
- **2.5D Isometric World Projection:** Real-time diamond coordinate conversion (`screenX = (x - y) * TILE_W/2`, `screenY = (x + y) * TILE_H/2`), multi-depth z-sorting, and extruded stone floor tiles with ambient cast shadows.
- **Combat Mechanics:** Dual-dagger slash combo arcs, dodge-dash i-frames with shadow blur ghost particles, stamina telemetry management, and directional facing logic.
- **Enemy AI Archetypes:**
  - **Void Skeletons:** Melee pursuers that track player distance and strike within attack range.
  - **Dark Wisps:** Phasing ranged specters that emit ethereal projectile volleys.
- **Loot & Roguelite Progression:** Breakable treasure chests, health potions, soul shard currency, and ascending staircase gateways across 10 progressively challenging dungeon floors.
- **Web Audio Soundscape:** Low-frequency dungeon drone, steel blade slash swooshes, visceral bone-shatter impact sounds, and chest opening chimes.
- **Local Persistence:** Character stats, floor progression, best kills, and soul shard bank saved in `localStorage.getItem('shadow_realm_save_v1')`.

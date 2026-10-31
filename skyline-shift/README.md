# Skyline Shift — Neon Courier

An original, static HTML5 arcade runner. Switch between three lanes, collect energy orbs, dodge security gates, and beat your distance record.

## Run locally
1. Download and extract the project.
2. Open `index.html` in a modern browser, or run a local server:
   - Python: `python -m http.server 8000`
   - Then visit `http://localhost:8000`

No build step, backend, database, API key, or install is required.

## Deploy to Vercel
1. Create a new Git repository and add `index.html`, `style.css`, `game.js`, and `README.md`.
2. Import the repository in Vercel.
3. Select **Other** as the framework preset.
4. Leave Build Command and Output Directory empty (or set output directory to `.`).
5. Deploy. The project is fully static.

You can also deploy the folder with the Vercel CLI: `vercel` from this directory.

## Controls
- Desktop: Left/Right arrows or A/D.
- Mobile: swipe horizontally in the game area, or tap its left/right half.
- Space: pause/resume.
- Sound can be toggled in the top bar.

## Game rules
- Cyan diamonds are energy orbs. Collect them for points and a multiplier.
- Pink security gates end the run if you collide with them.
- Passing a gate in another lane awards a near-miss bonus.
- Your best score is saved in browser local storage.

## Notes
The game uses original canvas-drawn artwork and Web Audio effects. A Google Font is loaded from Google Fonts; system fallbacks are provided if it is unavailable.

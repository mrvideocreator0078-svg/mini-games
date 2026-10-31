# Mini Game Arcade

A hand-crafted collection of free, original browser arcade games.  
No frameworks, no ads, no downloads — just clean gameplay in vanilla HTML/CSS/JS.

**Live site:** Deploy to Vercel (see below)  
**Current games:** Skyline Shift (lane-runner)

---

## Project Structure

```
mini arcade games/
├── index.html          ← Arcade homepage (game card grid)
├── about.html          ← About page
├── contact.html        ← Contact page (mailto form)
├── privacy.html        ← Privacy Policy
├── terms.html          ← Terms of Use
├── arcade.css          ← Shared site-wide stylesheet
├── favicon.ico         ← Site favicon
├── README.md           ← This file
├── DEPLOYMENT.md       ← Vercel deployment instructions
└── skyline-shift/      ← Game folder (one folder per game)
    ├── index.html      ← Game page (with back-to-arcade nav)
    ├── game.js         ← Game logic
    ├── style.css       ← Game-specific styles
    ├── thumb.jpg       ← Game card thumbnail (16:9)
    └── favicon.ico     ← Tab icon
```

---

## How to Run Locally

No build step required. Serve the root folder with any static file server.

**Using Node.js (built-in, no install needed):**

```bash
node -e "
const h=require('http'),fs=require('fs'),p=require('path');
const mime={'html':'text/html','css':'text/css','js':'application/javascript','ico':'image/x-icon','jpg':'image/jpeg','png':'image/png','webp':'image/webp'};
h.createServer((req,res)=>{
  const url=req.url==='/'?'/index.html':req.url;
  const f=p.join(process.cwd(),url.split('?')[0]);
  const ext=f.split('.').pop();
  const stream=fs.createReadStream(f);
  stream.on('error',()=>{res.writeHead(404);res.end('Not found');});
  stream.on('open',()=>{res.writeHead(200,{'Content-Type':mime[ext]||'text/plain'});stream.pipe(res);});
}).listen(5173,()=>console.log('Open http://localhost:5173'));
"
```

**Using Python:**
```bash
python -m http.server 5173
```

**Using VS Code:** Install the "Live Server" extension, right-click `index.html` → Open with Live Server.

---

## How to Add a New Game

Follow these steps to add a second (or third, or tenth) game to the arcade.

### Step 1 — Create the game folder

```
my-new-game/
├── index.html    ← Game page
├── game.js       ← Game logic
├── style.css     ← Game-specific styles
├── thumb.jpg     ← Card thumbnail, exactly 16:9 ratio (e.g. 640×360px)
└── favicon.ico   ← Optional, can copy from skyline-shift/
```

The game folder name becomes the URL slug:  
`/my-new-game/` → served from `my-new-game/index.html`

### Step 2 — Add the back-to-arcade navigation

Inside your `my-new-game/index.html`, add this near the top of `<body>` (before your game's own header). Copy the style block from `skyline-shift/index.html`:

```html
<style>
  .back-bar{background:#080d1ccc;border-bottom:1px solid #ffffff12;padding:7px 0;
  backdrop-filter:blur(12px);position:sticky;top:0;z-index:300}
  .back-bar .shell-g{max-width:1180px;margin:auto;padding:0 30px}
  .back-bar a{font:500 9px 'DM Mono',monospace;letter-spacing:1.5px;color:#8290aa;
  display:inline-flex;align-items:center;gap:6px;transition:color .2s}
  .back-bar a:hover{color:#43f4e5}
</style>
<nav class="back-bar" aria-label="Return to arcade">
  <div class="shell-g"><a href="../">← Mini Game Arcade</a></div>
</nav>
```

### Step 3 — Add a card to the homepage

Open `index.html` and find the comment block:

```html
<!--
  ╔══════════════════════════════════════════════════╗
  ║  ADD NEW GAME CARDS BELOW THIS COMMENT          ║
  ...
-->
```

Paste a new `<article class="game-card">` block below it:

```html
<article class="game-card" role="listitem" aria-labelledby="card-YOURSLUG-title">
  <div class="card-thumb">
    <img
      src="my-new-game/thumb.jpg"
      alt="Brief description of the game screenshot"
      loading="lazy"
      width="640" height="360"
    >
    <span class="card-badge">NEW</span>
  </div>
  <div class="card-body">
    <span class="card-tag">Category</span>  <!-- e.g. Puzzle / Shooter / Platformer -->
    <h3 class="card-title" id="card-YOURSLUG-title">My New Game</h3>
    <p class="card-desc">
      One or two sentences describing the game. Focus on the core mechanic and goal.
    </p>
    <div class="card-controls" aria-label="Game controls">
      <kbd>←</kbd><kbd>→</kbd><span>Move</span>
      <span class="sep">·</span>
      <kbd>Space</kbd><span>Action</span>
    </div>
    <a class="card-play" href="my-new-game/" aria-label="Play My New Game">
      PLAY NOW <b aria-hidden="true">↗</b>
    </a>
  </div>
</article>
```

Replace `YOURSLUG` with a unique identifier (e.g. `ng` for "Neon Golf").

### Step 4 — Update the hero stat

In `index.html`, find the `<b>1</b><span>GAME LIVE</span>` stat in the hero section and increment the number.

### Step 5 — Test

Start the local server and open `http://localhost:5173`.  
Verify: card appears on homepage → Play button leads to game → back link returns to arcade.

---

## Game Design Guidelines

- **Self-contained:** Each game folder must work independently. No shared game JS or assets between games.
- **No external game libraries:** Keep it vanilla JS and Canvas API.
- **Audio:** Use the Web Audio API (oscillators + gain nodes). No audio files needed.
- **Save data:** Use `localStorage` only. Key prefix: `arcade_<gameslug>_`.  
  e.g. `localStorage.setItem('arcade_skylineshift_best', score)`
- **Mobile:** Support touch/pointer events. Use `touch-action: none` on the canvas.
- **Accessibility:** Add `aria-label` to the canvas and all interactive buttons.
- **No ads:** Do not add ad containers of any kind.

---

## Deploying to Vercel

1. Push this entire folder to a GitHub/GitLab repository.
2. Go to [vercel.com](https://vercel.com) → New Project → Import the repo.
3. Framework preset: **Other** (it's a static site, no build command).
4. Root directory: `./` (leave default).
5. Output directory: `./` (leave default).
6. Build command: None (leave blank).
7. Click Deploy. Done! See `DEPLOYMENT.md` for exact settings.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 (semantic, ARIA-labelled) |
| Styles | Vanilla CSS (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES2020, strict mode) |
| Graphics | Canvas 2D API |
| Audio | Web Audio API |
| Fonts | Google Fonts (Barlow Condensed, DM Mono, Manrope) |
| Hosting | Vercel (static, no build step) |
| Storage | localStorage (scores only, never sent anywhere) |

---

## License

All original game code and artwork in this repository are copyright their respective creators.  
Fonts are licensed under the SIL Open Font License 1.1.  
The thumbnail image for Skyline Shift was AI-generated and is not derived from any third-party copyrighted asset.

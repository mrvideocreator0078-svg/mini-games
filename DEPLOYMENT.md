# Vercel Deployment Guide

This project is a 100% vanilla, zero-dependency static web application. It requires **no build step**, **no compiler**, and **no configuration file (`vercel.json`)**.

---

## Exact Vercel Project Settings

When importing this project into Vercel, use the following exact settings:

| Setting | Value | Notes |
|:---|:---|:---|
| **Framework Preset** | `Other` | Pure static HTML/CSS/JS (no framework) |
| **Root Directory** | `./` | Root containing `index.html` |
| **Build Command** | _None (leave empty / toggle OFF)_ | No build command exists or is needed |
| **Output Directory** | `./` _(or leave blank)_ | Serves all static files directly from root |
| **Install Command** | _None (leave empty / toggle OFF)_ | No `package.json` or `node_modules` |
| **Environment Variables** | _None required_ | Fully client-side |

---

## Routing & Configuration Rules

1. **No `vercel.json` Required:**
   Vercel natively serves static sites with root `index.html` out of the box. Adding an unnecessary `vercel.json` can cause unexpected redirect behavior with relative asset paths.

2. **No SPA Rewrite:**
   This is a multi-page static site with physical HTML files (`index.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`, and `skyline-shift/index.html`). **Do NOT add an SPA catch-all rewrite** (`"source": "/(.*)", "destination": "/index.html"`), as it will break access to all inner pages and game routes.

---

## Deployment Steps

### Method 1: Via Vercel Web Dashboard (Recommended)

1. **Initialize Git & Push to GitHub / GitLab / Bitbucket:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Mini Game Arcade"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Import into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your repository and click **Import**.
   - Under **Project Settings**:
     - Ensure Framework Preset is **Other**.
     - Keep Root Directory as `./`.
     - Leave Build and Output settings unoverridden (default).
   - Click **Deploy**.

---

### Method 2: Via Vercel CLI

```bash
# Deploy preview:
npx vercel

# Deploy production:
npx vercel --prod
```

When prompted:
- **Set up and deploy?** [Y]
- **Which scope?** [Select your account]
- **Link to existing project?** [N]
- **Project name?** `mini-game-arcade`
- **In which directory is your code located?** `./`
- **Want to modify these settings?** [N]

---

## Post-Deployment Verification Checklist

Once deployed to your `.vercel.app` URL, verify:
- [ ] Homepage loads at `https://your-project.vercel.app/`
- [ ] Game loads at `https://your-project.vercel.app/skyline-shift/`
- [ ] Inner pages load (`about.html`, `contact.html`, `privacy.html`, `terms.html`)
- [ ] "← Mini Game Arcade" button in game navigates back to homepage
- [ ] Browser developer console shows 0 errors
- [ ] Game controls (keys and touch) respond properly

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A workflow for building animated **OBS overlays** and publishing them to GitHub Pages. Overlays are used as **Browser Sources** in cloud OBS (IRLToolkit, controlled via neko). The published URL is pasted into a Browser Source; there is no build pipeline for deploy — a `git push` to `main` is the deploy (GitHub Pages serves `/overlays` from repo root).

Public base URL: `https://ilankriger-gmail.github.io/overlays-lives/overlays/<file>.html`

## The hard constraint (overlays must be clean CSS)

Overlays **must be self-contained static HTML + CSS**, animated only with CSS `@keyframes`. **No React, no Babel, no `support.js`, no runtime JS framework.** The only JS allowed is the tiny `fit()` scaler at the bottom of each file.

A raw Claude Design canvas export (`*.dc.html`) dropped in as an overlay **froze OBS** — those exports ship an in-browser Babel transpiler, React, and perpetual polling loops that peg the CEF/encoder CPU. Design projects are the *source of truth for the look*, not the deliverable: read them, then hand-rebuild each scene as clean CSS. Read designs via the **DesignSync** tool (auth with `/design-login`).

## Two overlay families

They live side by side in `overlays/` but are built and structured differently — don't mix their conventions.

**1. `@nextleveldj` "Já volto" scenes** — `comecando/`, `javolto/`, `encerrada/`, `conexao-perdida/`
- Each scene is a **folder** (`<slug>/index.html`) that links shared assets: `../overlay.css`, `../assets/fonts.css` (fonts embedded as base64, works offline), `../assets/avatar.png`.
- A build step inlines those shared files into a **single self-contained** `overlays/<slug>.html` (~144 KB) — that single file is what the uploader publishes.
- **Editing rule:** never edit `overlays/<slug>.html` by hand. Edit `overlays/<slug>/index.html` (or the shared `overlay.css` / `assets/*`) and run `node overlays/build.js` to regenerate. The build script throws if any unembedded `../` reference survives.
- Design source of truth: Claude Design project `56b7b04e-b6fe-4616-8e40-a7bea63f6fea` ("Vídeo 'Já volto' para lives"). Scene configs live in its `live-scene.jsx` (`SCENES.start/.brb/.end/…`), timeline math in `animations.jsx` — periodic time math maps 1:1 to CSS `@keyframes`.

**2. `depois-do-te-amo/` "Depois do Te Amo" scenes** — `comecando`, `ja-volto`, `encerrada`, `conexao-perdida`, plus `index.html` (a visual contact sheet that iframes the four scenes)
- Each is a **fully standalone** HTML file (own `<style>`, Google Fonts via CDN). **Not** part of `build.js` — edit the file directly.
- **Transparent "durante a live" overlays** (`durante.html`, `durante-samuel.html`) also live here: unlike the four full-screen scenes, their background is `transparent` so they sit ABOVE the camera in OBS (don't mark a background color). They surface a card/seal for ~10s and then hide for ~110s of clean screen — pace via the `--loop` CSS var. `durante.html` cross-fades two text cards (edição da Fran); `durante-samuel.html` is a single spinning circular seal (`--spin` var) with the brand logo centered and the show's tagline curving around the rotating ring (edição do Samuel · "Tatuagem falsa"). Copy this pattern per episode.
- Designed for **simultaneous horizontal + vertical broadcast**: all essential content sits inside a central "safe zone" column (`--safe: 600px` CSS var ≈ the 9:16 center crop of a 1080-tall frame) so a center crop for the vertical feed loses nothing. Big titles wrap to fit; watermark is centered at the bottom. Lower `--safe` for a tighter vertical crop.
- Design source of truth: Claude Design project `627475bb-a4a9-4fc2-ad22-4fb57680fdd6` (`Manual de Marca.dc.html` — conceito "Reticências"; fonts Luckiest Guy + Space Grotesk; fire palette on black).

## Shared overlay conventions

- Canvas is a `1920×1080` `#stage`; the `fit()` script scales it to the window via `--s: min(innerWidth/1920, innerHeight/1080)`. In OBS the Browser Source is set to 1920×1080.
- Background is solid (these are full-screen scenes, not transparent camera overlays). `exemplo.html` is a legacy standalone example.

## Commands

```bash
# Run the uploader interface (from repo root)
cd uploader && npm install   # first time only
npm start                    # → http://localhost:3000
# or double-click iniciar-uploader.command (macOS; installs deps on first run)

# Rebuild the single-file @nextleveldj overlays after editing a scene folder or shared CSS
node overlays/build.js       # regenerating unchanged scenes is a no-op
```

There are no tests and no linter.

## The uploader (`uploader/server.js`)

Node/Express app (localhost:3000) that is the non-technical publish path: it writes uploaded/pasted HTML to `/overlays` (filename = `slugify(name).html`), runs `git add -A && git commit && git push` automatically (deletes do the same), derives the GitHub Pages URL from the git `origin` remote, and returns it. `/preview/*` serves overlays straight from disk for instant preview before Pages propagates (~1 min lag). It operates on the repo it lives in (`REPO_ROOT = ..`).

## Previewing without OBS

OBS is remote, so verify overlays locally: serve the repo (`python3 -m http.server` from repo root) and screenshot with headless Chrome (`--headless=new --window-size=1920,1080 --virtual-time-budget=6000 --screenshot=out.png <url>`). For the `depois-do-te-amo` dual-format check, crop the center 9:16 with `sips -c 1080 608 out.png --out crop.png` to see what the vertical feed would show. After publishing, OBS needs a right-click → **Refresh cache of current page** to pick up changes.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive Valentine's Day web page ("¿Serías mi San Valentín?") — a static site with no build tools or package manager. Written in Spanish. Hosted on GitHub Pages.

## Running the Project

Open `index.html` directly in a browser, or use VS Code Live Server (configured on port 5501 in `.vscode/settings.json`).

There is no build step, no linter, and no test suite.

## Architecture

Vanilla HTML/CSS/JS project with two screens:

- **Screen 1 (`.screen-initial`)** — Valentine question with Yes/No buttons, dark mode toggle
- **Screen 2 (`.screen-galaxy`)** — Fullscreen animated galaxy canvas + image carousel with romantic phrases

### Files

- **index.html** — Two-screen layout: `#screenInitial` (question) and `#screenGalaxy` (galaxy experience with canvas + carousel overlay)
- **script.js** (~1015 lines) — Organized in 12 numbered sections:
  1. `slides[]` array — 15 image paths + romantic phrases (from `./assets/img/`)
  2. `CONFIG` object — all tunable parameters (star counts, parallax strength, warp duration, timers, etc.)
  3. `NEBULA_PALETTE` — 5 nebula colors
  4. Utility functions (`lerp`, `clamp`, `starColor`, `isMobile`, `prefersReducedMotion`)
  5. `Galaxy` constructor — cinematic canvas engine (3-layer parallax stars, pre-rendered organic nebulas via offscreen canvases, warp entrance, curved Bézier shooting stars, cosmic events, glow sprite bloom via `globalCompositeOperation: 'lighter'`, FPS-adaptive quality, DeltaTime animation, mouse/gyroscope parallax, auto-drift Lissajous curve, vignette)
  6. `Carousel` constructor — auto-play (5s), swipe, keyboard, dots, text fade via `.ready` class
  7. Screen transitions (`enterGalaxy`/`exitGalaxy`) with cinematic staggered delays
  8-9. No button dodge + dark mode toggle (preserved original)
  10. Visibility handler — pauses galaxy/carousel when tab hidden
- **styles.css** — CSS custom properties (`--gx-accent-rgb`, `--gx-purple-rgb`, `--gx-deep`, `--gx-text`). Mobile-first with breakpoints at 768px and 1024px. `::before` atmospheric layer with `mix-blend-mode: screen`. Glassmorphism via `backdrop-filter: blur(18px)`. CSS keyframe animations (`cssDrift`, `titlePulse`, `containerGlow`). Staggered entrance transition delays. `prefers-reduced-motion` support.
- **assets/img/** — Carousel images (foto01.jpg through foto15.jpg; any size, displayed via `object-fit: cover`)

### Key Configuration (script.js CONFIG object)

- `FAR_STARS:200`, `MID_STARS:90`, `NEAR_STARS:25` — 3-layer star density (multiplied by `MOBILE_D:0.45` on mobile)
- `DUST:50`, `NEBULAS:5` — cosmic dust and nebula count
- `PX_STRENGTH:28` — parallax displacement in pixels
- `WARP_DUR:2.2` — hyperspace entrance duration in seconds
- `SHOOT_MIN/MAX:3/7`, `EVENT_MIN/MAX:7/14` — spawn interval ranges in seconds
- `AUTOPLAY:5000` — carousel auto-advance interval in ms

## Key Behaviors to Preserve

- The No button only starts dodging after the first click (`isFirstClick` flag)
- Yes button triggers galaxy mode (screen transition, canvas starts, carousel auto-plays)
- Back button stops galaxy animation and returns to initial screen
- Dark mode is toggled via `body.dark-mode` class, only affects initial screen
- Galaxy animation pauses on `visibilitychange` (tab hidden) to save battery

## Language

All user-facing text is in Spanish. Maintain this convention.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of browser-based games — no build tools, no package manager, no server required. Every game is a **single self-contained HTML file** with inline CSS and JS. Open the file directly in a browser to play.

## Running Games

```bash
open tictactoe.html        # macOS — opens in default browser
open shooter.html          # same for the top-down shooter (in progress)
```

No build step, no `npm install`, no local server needed.

## Git & GitHub Workflow

- Remote: `https://github.com/nishkgp/claude_test`
- Branch: `main`
- Credential helper: `gh auth git-credential` (configured locally)
- **After every meaningful change**: commit with a descriptive message and push to `origin main`

```bash
git add <file>
git commit -m "Short imperative summary

Longer explanation if needed."
git push
```

## Architecture Conventions

Each game file follows this internal structure (enforced by convention, not tooling):

1. **Constants & Config** — magic numbers, palette colors, tuning values at the top of the script
2. **Utilities** — pure helper functions (`lerp`, `clamp`, etc.)
3. **State objects** — plain JS objects (no classes) for game entities
4. **Update logic** — mutates state, called each tick
5. **Render logic** — reads state, draws to canvas or DOM; never mutates state
6. **Event listeners** — registered once at init, update an `Input` snapshot object
7. **Main loop** — `requestAnimationFrame` with capped delta-time (`dt = min(rawDt, 0.05)`)
8. **Bootstrap** — `init()` call at bottom

### Canvas games (shooter and future games)

- Player is always rendered at canvas center; the camera translates the world around it
- All collision is done in **world space**, rendering in **screen space** via camera transform
- Tile maps are flat arrays indexed `y * mapWidth + x`; solid tile = `1`, floor = `0`
- Particle pool is capped at 200 — reuse dead particles rather than allocating new objects
- Render order: floor tiles → wall tiles → bullets → enemies (y-sorted) → player → particles → HUD overlays

### Color palette (shared across games)

```
Background:  #0d0d1a    Floor:   #1a1a2e    Wall:    #16213e
Player:      #00ff88    Grunt:   #ff4444    Runner:  #44aaff
Tank:        #884400    Bullet:  #ffee00    Accent:  #ff00ff
```

## In-Progress: Top-Down Shooter (`shooter.html`)

Planned as a single HTML file. See `.claude/plans/humble-rolling-wall.md` for the full implementation plan. Key facts:

- 5 levels, wave-based enemy spawning
- 3 enemy types: Grunt (beeline), Runner (zigzag), Tank (slow/heavy)
- Controls: WASD move, mouse aim, left-click shoot, R reload, Enter start/restart
- Audio: synthesized via Web Audio API (no audio files)
- High score persisted in `localStorage`

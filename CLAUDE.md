# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of browser-based games. Every game is a **single self-contained HTML file** with inline CSS and JS — no build tools, no package manager, no server required. Open any file directly in a browser to play.

## Running Games

```bash
open tictactoe.html    # macOS — opens in default browser
open shooter.html
```

## Git & GitHub Workflow

- Remote: `https://github.com/nishkgp/claude_test` (branch: `main`)
- Credential helper: `gh auth git-credential` (configured locally — no password prompts)
- Commit and push after every meaningful change

## Architecture Conventions

All game files share this internal script section order:

1. **Constants & Config** — palette colors, speeds, tuning values
2. **Utilities** — pure helpers (`lerp`, `clamp`, `dist2`, etc.)
3. **State objects** — plain JS objects, no classes
4. **Update logic** — mutates state each tick
5. **Render logic** — reads state only, never mutates
6. **Event listeners** — registered once at init; update a single `Input` snapshot object
7. **Main loop** — `requestAnimationFrame`, delta-time capped at `0.05s` to prevent tunneling on tab-switch
8. **Bootstrap** — `init()` call at bottom

### Canvas game conventions

- Camera: player is always at canvas center; world translates around it
- Coordinate spaces: collision in **world space**, rendering via camera offset to **screen space**
- Tile maps: flat array, index = `y * mapWidth + x`; `0` = floor, `1` = wall, `2` = cover
- Particle pool: capped at 200, reuse dead entries rather than `push`/`splice`
- Render order: floor → walls → bullets → enemies (y-sorted) → player → particles → HUD

### Shared color palette

```
Background  #0d0d1a    Floor    #1a1a2e    Wall     #16213e
Player      #00ff88    Grunt    #ff4444    Runner   #44aaff
Tank        #884400    Bullet   #ffee00    Accent   #ff00ff
```

## In-Progress: Top-Down Shooter (`shooter.html`)

Single HTML file, Canvas 2D, all graphics drawn programmatically (no image assets).

**State machine:** `MENU → PLAYING → LEVEL_COMPLETE → GAME_OVER` (+ `YOU_WIN` after level 5)

**Enemy types:**

| Type   | HP  | Speed | Radius | AI behavior           |
|--------|-----|-------|--------|-----------------------|
| Grunt  | 30  | 70    | 12     | Beeline toward player |
| Runner | 15  | 140   | 9      | Fast zigzag           |
| Tank   | 120 | 35    | 18     | Slow, high HP         |

**5 levels:** simple room → 3-chamber corridors → L-shaped gauntlet → pillar arena → open final stand. Each level introduces new enemy types and multi-wave spawning.

**Controls:** WASD move · mouse aim · left-click shoot (auto-fire) · R reload · Enter start/restart

**Audio:** synthesized via Web Audio API — no audio files. `AudioContext` initialized on first user interaction to satisfy browser autoplay policy.

**Persistence:** high score in `localStorage`.

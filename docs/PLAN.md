# Super Mario Bros — World 1-1 Clone (Browser)

A plan for building a browser-based clone of Super Mario Bros Level 1-1, starting
with a **core-mechanics MVP** and expanding toward a faithful recreation.

> Status: **Planning only.** No implementation yet.

---

## 1. Goals & Non-Goals

### Goals
- Recreate the *feel* of SMB 1-1: tight platforming, run/jump, enemies, coins, pipes, flagpole.
- Run entirely in the browser, 60 FPS, keyboard controls.
- Build incrementally: get game feel right first, then layer on level content.
- Keep the code typed, modular, and easy to extend to other levels later.

### Non-Goals (for now)
- Multiplayer, mobile touch controls, sound-perfect audio.
- Pixel-perfect Nintendo asset reproduction (see Assets — we use original/placeholder art).
- Multiple worlds/levels. We target **1-1 only** first.

---

## 2. Tech Stack

| Concern        | Choice                          | Why |
|----------------|---------------------------------|-----|
| Game framework | **Phaser 3** (v3.90)            | Built-in Arcade Physics, sprites, tilemaps, input, animations. |
| Language       | **TypeScript**                  | Type safety for entities, states, and configs. |
| Build tool     | **Vite**                        | Fast dev server, HMR, simple TS + asset bundling. |
| Physics        | **Arcade Physics** (Phaser)     | AABB physics — ideal for a platformer, cheap and predictable. |
| Art            | **Placeholder / original art**  | Colored rectangles → simple original sprites. No copyright risk. |

---

## 3. Project Structure

```
super-mario/
├─ docs/
│  └─ PLAN.md                 # this file
├─ index.html                 # Vite entry, mounts the canvas
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ public/                    # static assets served as-is
│  └─ assets/
│     ├─ sprites/             # placeholder PNGs / spritesheets
│     └─ tiles/               # tileset image(s)
└─ src/
   ├─ main.ts                 # Phaser.Game config + boot
   ├─ config/
   │  └─ constants.ts         # tunables: gravity, speeds, jump, tile size
   ├─ scenes/
   │  ├─ BootScene.ts         # generate/load placeholder textures
   │  ├─ PreloadScene.ts      # load assets, show loading bar
   │  ├─ GameScene.ts         # the level: world, entities, camera
   │  └─ UIScene.ts           # HUD overlay: score, coins, time, lives
   ├─ entities/
   │  ├─ Player.ts            # Mario: state machine, movement, jump
   │  ├─ Goomba.ts            # walk + stomp/squish
   │  └─ Koopa.ts             # (later) shell mechanics
   ├─ systems/
   │  ├─ input.ts             # keyboard mapping helper
   │  └─ camera.ts            # follow + level bounds
   └─ level/
      ├─ level-1-1.ts         # level data (tilemap or hand-authored array)
      └─ TileMapBuilder.ts    # turns data into colliders/sprites
```

---

## 4. Architecture

### Scenes (Phaser lifecycle: `preload` → `create` → `update`)
- **BootScene** — generate placeholder textures at runtime (colored rects via `Graphics.generateTexture`) so we can build with zero external art on day one.
- **PreloadScene** — load real placeholder assets once they exist; show a loading bar.
- **GameScene** — owns the tilemap/colliders, spawns entities, runs the camera, wires up physics colliders/overlaps.
- **UIScene** — runs in parallel on top of GameScene for the HUD (score/coins/time). Keeps HUD fixed while the world scrolls.

### Physics model (Arcade)
- Global gravity on the world; the **player** and **enemies** are dynamic bodies.
- **Ground, blocks, pipes** are a static group (or a collidable tilemap layer).
- Register persistent colliders once in `create`:
  - `player ↔ solids` (collide)
  - `player ↔ enemies` (overlap → resolve stomp vs damage by relative Y)
  - `enemies ↔ solids` (collide)
  - `player ↔ coins/items` (overlap → collect)

### Player state machine
`idle → walking → running → jumping → falling → (later) skidding / crouching / dead`

Key behaviors to nail for game feel:
- **Acceleration & friction** (not instant velocity) for that slippery Mario momentum.
- **Run button** raises max speed (walk ≈ 160 px/s, run ≈ 240 px/s).
- **Variable jump height**: cut upward velocity when jump is released early.
- **Coyote time** (~80 ms) + **jump buffering** (~100 ms) for forgiving controls.
- Face direction based on velocity; play walk/jump animations accordingly.

---

## 5. Controls

| Action        | Key(s)                    |
|---------------|---------------------------|
| Move left/right | ← / → (and A / D)        |
| Jump          | Space / ↑ / Z             |
| Run / fire    | Shift / X (hold)          |
| Pause (later) | P / Esc                   |

Implementation notes: use `createCursorKeys()` for arrows + space + shift, and
`Phaser.Input.Keyboard.JustDown` for discrete jump presses (buffering).

---

## 6. Placeholder Art Strategy

We start with **generated colored rectangles**, then swap to simple original sprites — no code changes required if we keep texture keys stable.

- Tile size: **16×16** world units, rendered at an integer zoom (e.g. 3×) for a chunky retro look.
- Palette of texture keys created in BootScene: `mario`, `ground`, `brick`, `question`, `pipe`, `coin`, `goomba`, `flag`.
- Each is a flat color + outline initially (e.g. Mario = red box, Goomba = brown box, coin = yellow box).
- Later: replace with hand-drawn 16×16 originals or an openly-licensed set. Keep keys identical so entity code is unaffected.

---

## 7. Level Representation

Two viable options — plan to start simple, migrate if needed:

- **Option A (start here): hand-authored 2D array / string map** in `level/level-1-1.ts`.
  Each char = a tile (`X` ground, `B` brick, `?` question, `P` pipe, `-` empty, `G` goomba spawn, `F` flag). Fast to iterate, no external editor.
- **Option B (later): Tiled + Phaser Tilemap** (`this.make.tilemap`, `createLayer`, `setCollisionByProperty`). Better for the full, long 1-1 layout and for reusing across levels.

The `TileMapBuilder` reads the data and instantiates static colliders + entity spawns, so we can switch A→B behind the same interface.

### 1-1 landmarks to reproduce (reference for full version)
- Opening gap → first Goomba → 4-block row with `?` (coin + mushroom) → pipes of increasing height → the pit → staircase → flagpole + castle.

---

## 8. Tunable Constants (starting values — expect to tune)

```ts
// config/constants.ts  (illustrative starting points, not final)
export const TILE = 16;
export const GRAVITY_Y = 1400;      // world gravity
export const WALK_SPEED = 160;      // px/s max walk
export const RUN_SPEED  = 240;      // px/s max run (Shift held)
export const ACCEL      = 1200;     // px/s^2 ground acceleration
export const FRICTION   = 1000;     // px/s^2 deceleration
export const JUMP_VELOCITY   = -520; // initial jump impulse
export const JUMP_CUT        = 0.45; // velocity multiplier on early release
export const COYOTE_MS   = 80;
export const JUMP_BUFFER_MS = 100;
```

These are the levers for "game feel." We tune them by playtesting, not by spec.

---

## 9. Milestones

Scope for v1 = **Core mechanics MVP** (Milestones 0–3). Everything after is stretch.

### Milestone 0 — Project setup
- [ ] Scaffold Vite + TS + Phaser, `index.html`, `main.ts`, game config.
- [ ] Fixed-size canvas, integer zoom, pixel-art rendering (no smoothing).
- [ ] Empty GameScene renders a background color at 60 FPS.

### Milestone 1 — Movement & physics prototype (game feel)
- [ ] BootScene generates placeholder textures (Mario + ground).
- [ ] Player sprite with Arcade body, gravity, world-bounds collision.
- [ ] Left/right with acceleration + friction; run button; variable-height jump.
- [ ] Coyote time + jump buffering. **Goal: it *feels* like Mario.**

### Milestone 2 — Level & camera
- [ ] `level-1-1.ts` data + `TileMapBuilder` producing ground/brick/pipe colliders.
- [ ] Player collides with all solids; can traverse a short authored section.
- [ ] Camera follows player with level bounds; can't leave the left edge.

### Milestone 3 — Enemies & interactions (MVP complete)
- [ ] Goomba: walks, turns at edges/walls.
- [ ] Stomp resolution: land on top → squish enemy + bounce; side hit → player dies/resets.
- [ ] Coins: overlap to collect + increment counter.
- [ ] Basic HUD (UIScene): score + coins.
- [ ] Death & level reset.

### Milestone 4+ — Toward faithful 1-1 (stretch)
- [ ] `?` blocks: bump, spawn coin/mushroom; brick break.
- [ ] Mushroom power-up (small ↔ big Mario), fire flower + fireballs.
- [ ] Koopa + shell mechanics; multiple enemies.
- [ ] Full 1-1 layout via Tiled; pipes with heights; the pit; staircase.
- [ ] Flagpole slide + level-complete sequence; timer; lives; 1-UPs.
- [ ] Audio (jump/coin/stomp/music), pause menu, title screen.
- [ ] Swap placeholders for finished original sprites.

---

## 10. Risks & Decisions to Watch
- **Game feel is the hard part**, not rendering. Budget real time for tuning constants (Milestone 1).
- **Arcade Physics limitations**: AABB only; fine for SMB. Avoid needing per-pixel/slope physics.
- **One-way platforms / precise stomp detection**: resolve via relative Y velocity & `body.touching`, not just overlap.
- **Assets**: stay on original/placeholder art to avoid Nintendo IP issues if shared publicly.
- **Scope creep**: resist adding power-ups before Milestones 0–3 feel good.

---

## 11. Getting Started (once we implement)

```bash
npm create vite@latest . -- --template vanilla-ts
npm install phaser
npm run dev
```

Definition of done for MVP: Mario runs, jumps (with good feel), traverses an
authored slice of 1-1, stomps a Goomba, collects a coin, and the HUD updates —
all at a stable 60 FPS in the browser.

---

## 12. Open Questions
- Target resolution / zoom factor (e.g. 256×240 native like the NES, scaled up)?
- Do we want the authored-array level (fast) or jump straight to Tiled (scales better)?
- How faithful should physics be — "close enough" or frame-accurate to the original?

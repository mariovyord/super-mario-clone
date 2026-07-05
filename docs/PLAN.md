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
- Multiplayer, mobile touch controls (out of MVP scope — but the input/render architecture is deliberately **mobile-ready**, see §12), sound-perfect audio.
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
   │  ├─ BootScene.ts         # generate placeholder textures at runtime
   │  ├─ PreloadScene.ts      # (post-MVP) load real assets, loading bar
   │  ├─ GameScene.ts         # the level: world, entities, camera
   │  ├─ UIScene.ts           # HUD overlay: score, coins, time, lives
   │  └─ TouchControlsScene.ts # (post-MVP) on-screen d-pad/buttons overlay
   ├─ entities/
   │  ├─ Player.ts            # Mario: state machine, movement, jump
   │  ├─ Goomba.ts            # walk + stomp/squish
   │  └─ Koopa.ts             # (later) shell mechanics
   ├─ systems/
   │  ├─ input/
   │  │  ├─ InputController.ts   # device-agnostic interface → PlayerIntent
   │  │  ├─ PlayerIntent.ts      # normalized per-frame input struct
   │  │  ├─ KeyboardController.ts # MVP: maps keys → PlayerIntent
   │  │  └─ TouchController.ts    # (post-MVP) on-screen controls → PlayerIntent
   │  └─ camera.ts            # follow + level bounds
   └─ level/
      ├─ level-1-1.ts         # level data (tilemap or hand-authored array)
      └─ TileMapBuilder.ts    # turns data into colliders/sprites
```

---

## 4. Architecture

### Scenes (Phaser lifecycle: `preload` → `create` → `update`)
- **BootScene** — generate placeholder textures at runtime (colored rects via `Graphics.generateTexture`) so we can build with zero external art on day one.
- **PreloadScene** — **no-op for the MVP** (all textures are generated in BootScene). It earns its keep only at Milestone 4+ when real assets arrive, where it loads them and shows a loading bar.
- **GameScene** — owns the tilemap/colliders, spawns entities, runs the camera, wires up physics colliders/overlaps.
- **UIScene** — runs in parallel on top of GameScene for the HUD (score/coins/time). Keeps HUD fixed while the world scrolls. GameScene → UIScene communication flows through the shared `game.registry` + its `changedata` events (decoupled), **not** direct scene references.

### Physics model (Arcade)
- Global gravity on the world; the **player** and **enemies** are dynamic bodies.
- **Ground, blocks, pipes** are a static group (or a collidable tilemap layer).
- **Fixed timestep** (`physics.arcade: { fps: 60, fixedStep: true }`) so tuned
  constants feel identical on 60 Hz and 120/144 Hz displays. This is the cheapest
  insurance for consistent "game feel" and largely settles the frame-accuracy question.
- Register persistent colliders/overlaps once in `create`:
  - `player ↔ solids` — **collider** (auto-separates).
  - `player ↔ enemies` — **collider** whose handler classifies the hit via
    `body.touching`: `player.body.touching.down && enemy.body.touching.up` → stomp
    (squish + bounce); otherwise → player takes damage. Prefer this over a bare
    `overlap`, which never separates and makes relative-Y comparisons jittery.
  - `enemies ↔ solids` — **collider**.
  - `player ↔ coins/items` — **overlap** → collect.

### Player state machine
`idle → walking → running → jumping → falling → (later) skidding / crouching / dead`

Key behaviors to nail for game feel:
- **Acceleration & friction** (not instant velocity) for that slippery Mario momentum.
- **Run button** raises max speed (walk ≈ 160 px/s, run ≈ 240 px/s).
- **Variable jump height**: cut upward velocity when jump is released early.
- **Coyote time** (~80 ms) + **jump buffering** (~100 ms) for forgiving controls.
- Face direction based on velocity; play walk/jump animations accordingly.

### Input abstraction (device-agnostic, mobile-ready)
Entities never read the keyboard directly. Each frame the active controller samples
its device and produces a normalized **`PlayerIntent`**; the Player consumes only that:

```ts
export interface PlayerIntent {
  moveX: number;        // -1 left, 0 idle, +1 right
  jumpPressed: boolean; // edge-triggered this frame (feeds jump buffering)
  jumpHeld: boolean;    // level-triggered (feeds variable jump height)
  run: boolean;
}

export interface InputController {
  update(): void;                 // sample the device once per frame
  readonly intent: PlayerIntent;
  destroy(): void;
}
```

- **MVP:** `KeyboardController implements InputController`.
- **Post-MVP mobile:** add a `TouchController` + a `TouchControlsScene` overlay that
  emit the *same* `PlayerIntent`. No changes to `Player`, physics, or level code —
  mobile is purely additive. Select the controller at boot via
  `this.sys.game.device.input.touch` (and/or support both at once).

This is the key extensibility seam: **input is a strategy; entities depend on the
interface, not the device.**

---

## 5. Controls

| Action        | Key(s)                    |
|---------------|---------------------------|
| Move left/right | ← / → (and A / D)        |
| Jump          | Space / ↑ / Z             |
| Run / fire    | Shift / X (hold)          |
| Pause (later) | P / Esc                   |

Implementation notes: `KeyboardController` builds the intent from
`createCursorKeys()` (arrows + space + shift) **plus** `keyboard.addKeys('W,A,S,D,Z,X')`
for the alternate bindings — `createCursorKeys()` alone does **not** cover A/D/Z/X.
Use `Phaser.Input.Keyboard.JustDown` for discrete jump presses (buffering). All of
this lives behind the `InputController` interface (see §4), so the Player is unaware
of the physical keys and a touch controller drops in later without entity changes.

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
export const JUMP_VELOCITY   = -520; // initial impulse (~6 tiles high; may pull toward -430 for a tighter SMB arc)
export const JUMP_CUT        = 0.45; // velocity multiplier on early release
export const COYOTE_MS   = 80;
export const JUMP_BUFFER_MS = 100;
```

Physics runs on a **fixed timestep** so these numbers behave identically regardless
of monitor refresh rate (60 Hz vs. 120/144 Hz):

```ts
// main.ts (Phaser.Game config)
physics: {
  default: 'arcade',
  arcade: { gravity: { y: GRAVITY_Y }, fps: 60, fixedStep: true },
}
```

These are the levers for "game feel." We tune them by playtesting, not by spec.

---

## 9. Milestones

Scope for v1 = **Core mechanics MVP** (Milestones 0–3). Everything after is stretch.

### Milestone 0 — Project setup
- [ ] Scaffold Vite + TS + Phaser 3.90, `index.html`, `main.ts`, game config.
- [ ] Native resolution **256×240** (NES viewport), `zoom: 3`, `pixelArt: true`, `roundPixels: true` — no smoothing.
- [ ] Scale Manager: `Scale.FIT` + `CENTER_BOTH` + resize handling, so the canvas already adapts to any window/mobile viewport (renderer stays device-agnostic).
- [ ] Empty GameScene renders a background color at a stable 60 FPS.

### Milestone 1 — Movement & physics prototype (game feel)
- [ ] Enable **fixed timestep** (`arcade.fps: 60, fixedStep: true`) *before* tuning anything.
- [ ] BootScene generates placeholder textures at runtime (Mario + ground) — no asset files needed yet.
- [ ] Stand up the `InputController` seam; ship `KeyboardController` producing `PlayerIntent`. Player consumes intent only, never raw keys.
- [ ] Player sprite with Arcade body, gravity, world-bounds collision.
- [ ] Left/right with acceleration + friction; run button; variable-height jump (cut velocity on early release).
- [ ] Coyote time + jump buffering. **Goal: it *feels* like Mario.**

### Milestone 2 — Level & camera
- [ ] `level-1-1.ts` data + `TileMapBuilder` producing ground/brick/pipe colliders.
- [ ] Player collides with all solids; can traverse a short authored section.
- [ ] Camera follows player with level bounds; can't leave the left edge.

### Milestone 3 — Enemies & interactions (MVP complete)
- [ ] Goomba: walks, turns at edges/walls.
- [ ] Stomp resolution via `collider` + `body.touching` (down/up), not a bare overlap: land on top → squish enemy + bounce; side hit → player dies/resets.
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
- [ ] **Mobile support (additive):** `TouchController` + `TouchControlsScene` on-screen d-pad/buttons emitting the same `PlayerIntent`; auto-enable on touch devices. No entity/physics changes required.
- [ ] Swap placeholders for finished original sprites.

---

## 10. Risks & Decisions to Watch
- **Game feel is the hard part**, not rendering. Budget real time for tuning constants (Milestone 1).
- **Arcade Physics limitations**: AABB only; fine for SMB. Avoid needing per-pixel/slope physics.
- **One-way platforms / precise stomp detection**: resolve via `collider` + `body.touching` (up/down), not a bare overlap (see §4).
- **Assets**: stay on original/placeholder art to avoid Nintendo IP issues if shared publicly.
- **Scope creep**: resist adding power-ups before Milestones 0–3 feel good.

---

## 11. Getting Started (once we implement)

> ⚠️ This repo already contains `docs/` and `.git/`. Scaffolding into a non-empty
> directory prompts *"Current directory is not empty…"* — choose **"Ignore files
> and continue"** so `docs/PLAN.md` is preserved. Do **not** pick the option that
> removes existing files.

```bash
# Option A — vanilla starter, then add Phaser (explicit, full control):
npm create vite@latest . -- --template vanilla-ts
npm install phaser

# Option B — Phaser's official Vite + TS template (preconfigured, less wiring):
#   npx degit phaserjs/template-vite-ts .

npm run dev
```

Definition of done for MVP: Mario runs, jumps (with good feel), traverses an
authored slice of 1-1, stomps a Goomba, collects a coin, and the HUD updates —
all at a stable 60 FPS in the browser.

---

## 12. Mobile Readiness (designed-in now, built post-MVP)

Mobile is **out of MVP scope**, but the architecture is built so it slots in later
without rework. The seams that make it additive rather than a rewrite:

1. **Input as a strategy** — entities consume `PlayerIntent`, never the keyboard
   (§4). Adding touch = one new `TouchController` + `TouchControlsScene`. Zero changes
   to `Player`, physics, or level code.
2. **Device-agnostic rendering** — the Scale Manager (`FIT` + `CENTER_BOTH`, resize
   handling) is configured from Milestone 0, so the canvas already reflows to any
   viewport/orientation.
3. **Capability detection at boot** — `this.sys.game.device.input.touch` selects the
   controller and whether to launch the on-screen controls overlay.
4. **Overlay, don't fork** — touch controls live in their own parallel Scene, composing
   on top of the game instead of branching its logic.

Net effect: the MVP ships keyboard-only; mobile later is *additive*, not a rewrite.

---

## 13. Decisions (resolved)
- **Resolution / zoom:** ✅ Native **256×240** (NES viewport, 16×15 tiles @ `TILE=16`), `zoom: 3` → 768×720 window, with `Scale.FIT` + `CENTER_BOTH` so it also fits mobile/arbitrary viewports.
- **Level representation:** ✅ Start with the **authored array** (Option A) for the MVP; migrate to **Tiled** (Option B) at Milestone 4 behind the same `TileMapBuilder` interface. Don't pull Tiled forward.
- **Physics faithfulness:** ✅ **"Close enough" + fixed timestep.** Frame-accurate SMB (subpixel accel tables, momentum quirks) is a deep rabbit hole with little MVP payoff; revisit only if the tuning pass disappoints.

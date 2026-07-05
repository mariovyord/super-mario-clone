# Initial Prompt — Super Mario Bros 1-1 (MVP)

> A ready-to-use kickoff prompt for implementing the game. `docs/PLAN.md` is the
> single source of truth; this prompt operationalizes it. Copy the block below to
> start a build session.

---

Build the **MVP (Milestones 0–3)** of the Super Mario Bros World 1-1 browser clone.
`docs/PLAN.md` is the single source of truth — read it first, and follow `AGENTS.md`.
Work **one milestone at a time and stop after each** so I can playtest before you
continue.

## Stack (non-negotiable)
- **Phaser 4.0.0**, TypeScript, Vite, Arcade Physics.
- Load the matching `.opencode/skills/` skill for each area as you work
  (`game-setup-and-config`, `physics-arcade`, `input-keyboard-mouse-touch`, `scenes`,
  `graphics-and-shapes`, `sprites-and-images`, `cameras`, `scale-and-responsive`).

## Milestone 0 — scaffold (do this first, then stop)
1. **Scaffold from the official Phaser template** (its `main` now ships Phaser 4.0.0,
   Vite 6.3.1, TS 5.7.2). The repo is non-empty (`docs/`, `.git/`) and `degit` has no
   "ignore files" prompt, so scaffold into a **temp dir, then move files into the repo
   root, never touching `docs/` or `.git/`**:
   ```bash
   npx degit phaserjs/template-vite-ts .scaffold-tmp
   # move everything except docs/ and .git/ into the root, then:
   rm -rf .scaffold-tmp
   npm install
   ```
2. **Remove the template's `log.js`** phone-home and strip it from `package.json`
   scripts (use plain `vite` / `vite build`).
3. **Reconcile structure to `PLAN.md §3` exactly:** collapse `src/game/main.ts` into
   `src/main.ts`; move scenes to `src/scenes/`; create `src/config/`, `src/entities/`,
   `src/systems/input/`, `src/level/`. Map Boot→`BootScene`, Preloader→`PreloadScene`,
   Game→`GameScene`; add `UIScene`; delete MainMenu/GameOver (out of MVP scope). Clear
   out template logo/bg placeholder usage.
4. **`config/constants.ts`** with the `PLAN.md §8` tunables (TILE, GRAVITY_Y, speeds,
   jump, coyote/buffer, etc.).
5. **Game config (`src/main.ts`):** 256×240, `zoom: 3`, `pixelArt: true`,
   `roundPixels: true`, Scale `FIT` + `CENTER_BOTH` + resize handling, Arcade physics
   `gravity.y: GRAVITY_Y`, **`fps: 60, fixedStep: true`**.
6. **`GameScene`** renders a background color; **`UIScene`** runs in parallel (empty
   HUD shell).
7. **Verify:** `npm run dev` boots clean (no console errors) at a stable 60 FPS on
   `http://localhost:8080`. Stop and report for playtest.

## Architectural rules that must hold from the first commit
- **Entities never read input.** The Player consumes a `PlayerIntent` produced by a
  `KeyboardController implements InputController` (§4/§12) — never bypass the seam.
  This is what keeps mobile support additive later.
- Keep the **fixed timestep** (`arcade.fps: 60, fixedStep: true`) — load-bearing for
  consistent game feel, not optional (§4/§8).
- Stomp detection = **`collider` + `body.touching`** (player `down` + enemy `up`),
  never a bare `overlap` (§4/§10).
- **Placeholder art only:** generate colored-rectangle textures in `BootScene` via
  `Graphics.generateTexture` with stable keys (`mario`, `ground`, `brick`, `question`,
  `pipe`, `coin`, `goomba`, `flag`). Keep keys stable so real art swaps in later with
  no code changes (§6).
- GameScene → UIScene communication flows through `game.registry` + its `changedata`
  events, **not** direct scene references (§4).
- Follow the project structure in §3 and the tunables in §8.
- Commit per-milestone with short lowercase conventional messages (e.g. `feat: …`).

## Subsequent milestones (each ends with a stop-and-playtest)
- **M1 — movement & feel:** `InputController` seam + `KeyboardController` →
  `PlayerIntent`; Player Arcade body with gravity + world bounds; accel/friction, run
  button, variable-height jump (cut velocity on early release), coyote time + jump
  buffering. Goal: **it feels like Mario.**
- **M2 — level & camera:** `level-1-1.ts` authored array + `TileMapBuilder` →
  ground/brick/pipe colliders; player collides with all solids; camera follows with
  level bounds and can't leave the left edge.
- **M3 — enemies & interactions (MVP complete):** Goomba walks + turns at
  edges/walls; stomp (squish + bounce) vs. side-hit (player dies/resets) via
  `body.touching`; coins collected via `overlap`; basic HUD (score + coins); death &
  level reset.

## Definition of done (MVP)
Mario runs and jumps with good feel, traverses an authored slice of 1-1, stomps a
Goomba, collects a coin, and the HUD updates — all at a stable 60 FPS in the browser.

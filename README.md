# Super Mario Bros — Browser Clone

A browser remake of **Super Mario Bros.** — **8 courses across 2 worlds**
(1-1 through 2-4) with a full title → play → game-over → ending loop, built with
[Phaser 4](https://phaser.io/) + TypeScript + Vite on Arcade physics.

Everything you see and hear is generated at runtime — the textures are colored
placeholder rectangles baked in code, and every sound effect and the background
tune are synthesized with the Web Audio API. There are **no external art or
audio assets**; the whole game ships as code.

## Features

- **8 hand-authored courses across 2 worlds** (1-1 → 2-4), each with its own sky
  colour: ground, pipes, floating blocks, staircases, flagpole → castle finish.
- Tight, tunable platforming: acceleration/friction, variable-height jumps, coyote time, and jump buffering.
- Enemies: Goombas, and Koopa Troopas with the full walk → shell → kickable-slide behavior.
- Power-ups: Super Mushroom, Fire Flower (throw fireballs), 1-Up Mushroom, and hidden power-up/1-up blocks.
- Interactive `?`/brick blocks (coins, items, breakable bricks) and collectible coins.
- Score, coins, lives, and a countdown timer with a HUD; a 1-Up every 100 coins.
- Full front-end loop: title screen, per-level intro card, game-over and victory screens, pause menu, and mute.
- Keyboard **and** on-screen touch controls (mobile-ready), with a display that fits/centers to any screen.

## Controls

**Keyboard**

| Action | Keys |
| --- | --- |
| Move | `←` / `→` or `A` / `D` |
| Jump | `Space` / `↑` / `Z` (hold for a higher jump) |
| Run / throw fireball | `Shift` / `X` (hold to run; press to fire as Fire Mario) |
| Pause | `P` / `Esc` |
| Start game | `Enter` / `Space` / tap |
| Mute (on pause screen) | `M` |

**Touch** (shown automatically on touch devices)

On-screen `◀` `▶` movement pad plus `A` (jump) and `B` (run / fire). Multiple
fingers work at once, and keyboard + touch are merged so both drive Mario
simultaneously.

## Getting started

Prerequisites: **Node.js 20+** and npm.

```bash
# install dependencies
npm install

# start the dev server at http://localhost:8080
npm run dev
```

Then open http://localhost:8080 and press `Enter` (or tap) to play.

### Production build

```bash
npm run build      # bundle to dist/
npm run preview    # serve the built dist/ locally
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 8080. |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Serve the built `dist/`. |
| `npm run typecheck` | `tsc --noEmit` — type-check only (the build does **not** type-check). |

> The build prints a warning that the `phaser` chunk exceeds 500 kB. That's
> expected — Phaser is already isolated into its own cached chunk.

## Project structure

```
src/
  main.ts              Game config + scene registration (fixed 60fps timestep)
  config/constants.ts  All tunable "game feel" values (physics, jump, scoring…)
  scenes/              Boot, Preload, Title, LevelIntro, Game, UI, Pause,
                       TouchControls, GameOver, Ending
  entities/            Player, Goomba, Koopa, Block, PowerUp, Fireball
  level/               level-1-1…2-4 (authored tile maps) + levels.ts registry
                       + TileMapBuilder
  systems/
    input/             InputController seam: Keyboard / Touch / Composite
    audio/             AudioBus — procedural Web Audio sound + music
    runState.ts        Per-run registry state (score/coins/lives/levelIndex)
docs/PLAN.md           Design spec, architecture, and decisions
```

## How it works

- **Fixed timestep.** Physics runs at a fixed `60fps` (`fixedStep`), so the tuned
  constants in `config/constants.ts` feel identical on any refresh rate.
- **Input seam.** Entities never read the keyboard or touch directly. Controllers
  translate devices into a device-agnostic `PlayerIntent`, which the `Player`
  consumes — so touch support composes on top without touching gameplay code.
- **Decoupled HUD.** `GameScene` and the `UIScene` HUD share state only through
  Phaser's registry (`score`/`coins`/`lives`/`time`) and its change events; the
  UI, pause, and touch scenes run as parallel overlays.
- **Authored levels.** Each course is a hand-authored `string[]` map (one
  character per tile) parsed by `TileMapBuilder` into solids + entity spawns.
  `level/levels.ts` is the ordered registry — adding a course is appending one
  entry, never touching scene wiring.
- **Registry-driven progression.** A run's `score`/`coins`/`lives`/`levelIndex`
  live in the registry (seeded by `systems/runState.ts`). Clearing a flagpole
  advances `levelIndex`; the front-end scenes (`LevelIntro` → `Game` →
  `GameOver`/`Ending`) drive the title → play → finish loop with camera fades.
  There is no persistence between sessions — a "new game" is just a reset.

## Tech stack

- **[Phaser 4](https://phaser.io/)** (Arcade physics)
- **TypeScript** (strict)
- **[Vite](https://vitejs.dev/)**

## Contributing

- `docs/PLAN.md` is the design/spec/decisions reference.
- `AGENTS.md` documents the architecture invariants and conventions to follow.
- Verify changes with `npm run typecheck` then `npm run build`.

## License

[MIT](./LICENSE)

---

This project is a non-commercial fan tribute for learning purposes. *Super Mario
Bros.* and its characters are trademarks of Nintendo; this repository is not
affiliated with or endorsed by Nintendo.

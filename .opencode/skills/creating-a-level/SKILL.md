---
name: creating-a-level
description: "Use this skill when creating, authoring, editing, or adding a new level/course/world to this Super Mario clone. Covers the string tile-map format, the tile legend, TileMapBuilder wiring, the 15-row grid + ground-strip + reachability constraints, how to register a level, and a validation checklist. Triggers on: create a level, new level, add a world, level design, edit level-1-1, author a course, tile map."
---

# Creating a Level

> Levels in this game are **hand-authored `string[]` tile maps** — one character
> per 16×16 tile — not Tiled/JSON. `TileMapBuilder.build()` parses the rows into
> Arcade static colliders plus spawn arrays (`LevelBuildResult`), and `GameScene`
> turns those spawns into Mario, enemies, blocks, coins, the flagpole and castle.
> To make a level you write a rows array following the legend, respect a few
> grid/physics constraints, and register it. No new art or code is required for a
> standard horizontal course.

**Key source paths:** `src/level/level-1-1.ts` (the reference course + legend), `src/level/levels.ts` (the `LEVELS` registry you append to), `src/level/TileMapBuilder.ts` (parser → `LevelBuildResult`), `src/scenes/GameScene.ts` (`create()` picks the course + spawns everything; `levelCleared()` win path), `src/config/constants.ts` (`TILE`, `GAME_HEIGHT`, jump/gravity), `src/scenes/BootScene.ts` (placeholder texture keys)
**Related references:** `docs/LEVELS_PLAN.md` (multi-level progression plan), `docs/PLAN.md` §7 (level design rationale), `../physics-arcade/SKILL.md`, `../tilemaps/SKILL.md`

---

## Quick Start

1. Copy `src/level/level-1-1.ts` to `src/level/level-1-2.ts`, rename the export
   to `LEVEL_1_2`, and edit the rows (keep **15 rows**, keep the bottom two rows
   as the ground strip):

```ts
// src/level/level-1-2.ts
export const LEVEL_1_2: string[] = [
  '--------------------------------',
  '--------------------------------',
  '--------------------------------',
  '----------------------------F---',   // flagpole near the top
  '--------------------------------',
  '--------------------------------',
  '--------------------------------',
  '----------?-?-?-----------------',   // coin/question row
  '--------------------------------',
  '------------B?U?B---------------',   // block run (flanked power-up works)
  '--------------------------------',
  '-------PP-----------------------',   // a pipe (solid, 2 tiles wide/tall+)
  '-M-----PP------G------G-------C--',   // spawn, pipes, goombas, castle
  'XXXXXXXXXXXX------XXXXXXXXXXXXXXX',   // ground strip row 1 (gap = pit)
  'XXXXXXXXXXXX------XXXXXXXXXXXXXXX',   // ground strip row 2 (same gap)
];
```

2. Register it: add `import { LEVEL_1_2 } from './level-1-2';` to
   `src/level/levels.ts` and append `{ name: '1-2', rows: LEVEL_1_2 }` to the
   `LEVELS` array (optionally with a `backgroundColor`). `GameScene` picks the
   course by `levelIndex` at runtime — see **Registering a level** below.

3. `npm run typecheck && npm run build`, then `npm run dev` (port 8080) and play
   it start-to-flag.

---

## The tile legend

One character = one 16×16 tile. Empty is `-` or space. (Source of truth: the
header comment in `level-1-1.ts` and the `switch` in `TileMapBuilder.ts:95-125`.)

| Char | Tile | Kind | Notes |
| ---- | ---- | ---- | ----- |
| `X` | ground / step | **solid** (static) | Inert collider. Build ground, steps, staircases, platforms. |
| `P` | pipe | **solid** (static) | Inert collider only — **not** enterable (no warps yet). |
| `B` | brick | interactive `Block` | Breakable by **big** Mario; a bonk by small Mario just bumps. |
| `?` | question block | interactive `Block` | Yields a coin when bonked from below. |
| `U` | power-up block | interactive `Block` | Yields mushroom (small Mario) or fire flower (big Mario). Looks like `?`. |
| `L` | 1-up block | interactive `Block` | Yields a green 1-up mushroom. Looks like `?`. |
| `o` | coin | overlap pickup | Free-standing collectable coin. |
| `M` | Mario spawn | marker | **Exactly one.** Last one wins if duplicated; none → default `(2,2)` tiles. |
| `G` | Goomba spawn | enemy | Paces, turns at ledges/walls, stompable. |
| `K` | Koopa spawn | enemy | Walk → shell → sliding-kick → revive. Taller than 1 tile. |
| `F` | flagpole | marker | Touching it starts the win cutscene. Place near the top rows. |
| `C` | castle | marker | Cutscene target — Mario walks here after the flag. |

`X` and `P` become static bodies in `level.solids`. `B`/`?`/`U`/`L` become
`Block` entities. `M`/`G`/`K`/`o`/`F`/`C` are reported as coordinates and spawned
by `GameScene`. Any other character is silently ignored.

---

## Core constraints (load-bearing — the engine assumes these)

### 15 rows, horizontal scroll only
`GAME_HEIGHT 240 / TILE 16 = 15` rows. The camera scrolls **horizontally**, not
vertically, so all 15 rows are always on screen. Keep every level 15 rows tall.
Width is free — `TileMapBuilder` sets `pixelWidth` from the **longest** row
(`TileMapBuilder.ts:74`), and world/camera bounds follow it. Rows may be ragged
(a short row just has empty tiles on the right), but padding every row to the
same length keeps the map readable.

### Bottom two rows are the ground strip
`GameScene` derives `groundSurfaceY = pixelHeight - 2*TILE` (`GameScene.ts:102`)
and `deathY = pixelHeight` (`:98`). So:
- Fill the **bottom two rows** with `X` for solid ground.
- Make a **pit** by leaving a gap in **both** bottom rows (see the `------` gap
  in the Quick Start). Mario falls past `deathY` and dies. A gap in only one row
  is just a one-tile ledge, not a pit.
- The flagpole cutscene lands Mario on `groundSurfaceY`, so keep the flag/castle
  area on normal ground.

### Every course needs `M`, and `F` + `C` to be completable
- **One `M`** or Mario spawns at the default corner.
- The win sequence walks Mario to the castle's x (`marchToCastle`,
  `GameScene.ts:706`). With **no `C`**, `castleX` stays `0` and Mario moon-walks
  to the left edge. With **no `F`** the level can never be cleared. Always
  include both, with `C` to the right of `F`.

### Reachability (jump feel)
Tuned in `constants.ts`: `JUMP_VELOCITY -520`, `GRAVITY_Y 1400`,
`WALK_SPEED 160`, `RUN_SPEED 240`. Practical rules of thumb:
- **Vertical:** ledges/blocks comfortably reachable up to **~4 tiles** above the
  takeoff surface (peak is ~6 tiles, but you must land with margin).
- **Horizontal pits:** **~5 tiles** clearable at a walk, up to **~8** with a
  running start on approach.
- **Block ceilings above a jump:** a `?`/`U` row is bonkable when it sits ~4
  tiles over the floor Mario jumps from.
- These are guidelines — **playtest every gap and climb**.

### Block runs work when flanked
A power-up block packed between question blocks (`B?U?B`) is reachable: the bonk
is redirected to the block directly over Mario's head (`blockOverHead`,
`GameScene.ts:327`). You can author dense block runs freely.

### Enemy behaviour (where it's safe to place `G`/`K`)
Goombas and Koopas share the same patrol AI (`Goomba.ts:34`, `Koopa.ts:104`), so
placement is forgiving:
- **They turn at both walls and ledges.** Each frame they reverse on
  `body.blocked.left/right` (a wall) *and* on an `atLedge` probe that samples for
  a solid tile just past the leading foot (`Goomba.ts:93`, `Koopa.ts:207`). A
  **patrolling** enemy therefore never walks off a platform — it paces back and
  forth on whatever solid run it stands on. Placing a `G`/`K` one tile from a pit
  edge is safe; it just turns around there.
- **But they must _spawn_ on solid ground.** The turn only fires when
  `body.blocked.down` is true. A `G`/`K` authored directly **over** a pit (no `X`
  under it) is airborne at spawn, never "grounded", so it falls straight in.
  Always put a floor tile under every enemy marker.
- **They start walking left** (`dir = -1`). Face this when timing an enemy near
  the level start.
- **A _kicked_ Koopa shell does _not_ turn at ledges** — sliding only ricochets
  off walls (`Koopa.ts:88`), so a shell can rocket off a platform into a pit.
  Don't rely on shells staying on a ledge.
- **Same-type enemies pass through each other.** There's no goomba↔goomba or
  koopa↔koopa collider, and goomba↔koopa is an `overlap` (only a *sliding* shell
  kills a Goomba), so crowding several `G`/`K` on one platform is fine — they
  overlap rather than jam. (Colliders/overlaps are wired in `GameScene.ts:176-194`.)

---

## How a level becomes a running scene (data flow)

```
level-X-Y.ts (string[])
      │  new TileMapBuilder(scene, rows).build()
      ▼
LevelBuildResult { solids, pixelWidth/Height, playerSpawn,
                   goombaSpawns, koopaSpawns, coinSpawns,
                   questionSpawns, powerupSpawns, oneupSpawns,
                   brickSpawns, flagPosition, castlePosition }
      │  GameScene.create()
      ▼
static solids group · Goomba/Koopa/Block/coin objects ·
flagpole+trigger+castle · colliders & overlaps · camera follow
```

- Physics/world/camera bounds come from `pixelWidth/Height` — no manual sizing.
- Interactive `Block`s are grouped by kind and collided as one group; coins are
  overlap-only static bodies.
- You never touch collider wiring to add a level — only the rows.

## Registering a level

Courses live in a registry — `src/level/levels.ts` exports
`LEVELS: LevelDefinition[]`, and `GameScene` builds `LEVELS[levelIndex]`. Adding
a course is data-only:

```ts
// src/level/levels.ts
export interface LevelDefinition {
    name: string;             // HUD/title label, e.g. "1-2"
    rows: string[];           // the authored tile rows
    backgroundColor?: string; // optional per-level sky; defaults to SMB blue
}

export const LEVELS: LevelDefinition[] = [
    { name: '1-1', rows: LEVEL_1_1 },
    { name: '1-2', rows: LEVEL_1_2, backgroundColor: '#6ab0ff' },
    // append here — array order **is** play order
];
```

**Progression is registry-driven** (never cross-scene calls — the registry is
the only channel, per `AGENTS.md`):
- First boot seeds `levelIndex: 0` (guarded by `lives === undefined`,
  `GameScene.ts:88`). `create()` reads it, builds `LEVELS[index]`, and publishes
  `world = def.name` (the HUD + Title read this key) and the camera background
  from `def.backgroundColor ?? '#5c94fc'` (`GameScene.ts:98-103`).
- Reaching the flag runs `levelCleared()` (`GameScene.ts:754`): it bumps
  `levelIndex` and `scene.restart()`s onto the next course, **or**, after the
  **last** entry, runs the victory path. So the final course in `LEVELS` is
  automatically the finale — no flag needed to mark it.
- `returnToTitle()` (game over / victory) resets `levelIndex` to 0
  (`GameScene.ts:653`).

Practical notes:
- **Order = progression.** Put courses in the order you want them played.
- **`backgroundColor`** is the only built-in theming knob (a CSS hex string).
  Anything richer is a Phase 2 code change (`docs/LEVELS_PLAN.md`), not an asset.
- You never touch scene wiring or colliders to add a level — only `levels.ts`
  and the new `level-X-Y.ts`.

---

## Validation checklist

Before considering a level done:

- [ ] Exactly **15 rows**.
- [ ] Bottom **two** rows are ground (`X`), pits are gaps in **both**.
- [ ] Exactly **one `M`**; both **`F`** and **`C`** present, `C` right of `F`.
- [ ] Every jump, climb, and pit is clearable (played it through).
- [ ] Only legend characters used (stray chars are ignored, not errored).
- [ ] Every enemy marker (`G`/`K`) has a solid tile (`X`/`P`) **directly below
      it** — patrolling enemies turn at ledges, but one *spawned* over a pit
      falls straight in.
- [ ] Blocks/`?`/`U`/`L` sit in mid-air rows Mario can bonk from below.
- [ ] `npm run typecheck` clean, `npm run build` succeeds.
- [ ] Added to `LEVELS` in `src/level/levels.ts` (import + array entry).

Most structural checks are scripted — run the bundled validator over your file
(or every level) before playtesting:

```bash
node .opencode/skills/creating-a-level/scripts/validate-level.mjs src/level/level-1-2.ts
node .opencode/skills/creating-a-level/scripts/validate-level.mjs   # all levels
```

It parses the quoted rows straight out of the `.ts` and checks: 15 rows, uniform
width, exactly one `M`/`F`/`C`, `F` left of `C`, pits aligned across **both**
ground rows, and a floor under every `G`/`K`/`M`/`C`. It can't judge jump feel —
**still play it through**.

## Common mistakes

- **Wrong row count** → ground line no longer matches `groundSurfaceY`; Mario
  floats or the cutscene lands wrong. Keep 15.
- **Pit gap in only one ground row** → looks like a hole but Mario stands on the
  lower row; not a real pit.
- **No `C`** → win cutscene walks Mario to x=0. Always pair `F` with `C`.
- **Impossible gaps** → a 10-tile pit or a 6-tile-high wall with no steps softly
  bricks the player. Add steps/platforms; playtest.
- **Adding real sprite/audio assets** for a "themed" level → **don't**;
  placeholders are the intended final state (`AGENTS.md`). Theming is a Phase 2
  code change (`docs/LEVELS_PLAN.md`), not an asset drop.
- **Reading input or emitting cross-scene events** to make level gimmicks →
  forbidden by the invariants. Level data is passive; behaviour lives in
  entities/scene.

## Verify

```bash
npm run typecheck   # strict; vite build does NOT type-check
npm run build       # the >500 kB phaser chunk warning is expected
npm run dev         # http://localhost:8080 — play start → flag
```

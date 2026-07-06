# Adding More Levels — Plan

Status: **proposal / not yet implemented.** This document plans how to grow the
game from a single hand-authored course into a sequence of levels the player
advances through. It is the companion design doc to `PLAN.md` (the original
build spec) and to the `creating-a-level` skill (`.opencode/skills/creating-a-level/`),
which is the hands-on authoring guide.

---

## 1. Assessment: are we feature-complete?

**Mostly yes — with one caveat.**

The *gameplay* is complete. Every mechanic needed to author varied horizontal
levels already ships and is exercised by World 1-1: ground/steps, pipes (solid),
bricks, question / power-up / 1-up blocks, coins, Goombas, Koopas (walk → shell →
slide → kick → revive), fireballs, the pit/timer death paths, and the
flagpole → castle win cutscene. The `B?U?B` flanked-block fix means even tightly
packed block runs behave correctly. You can build a lot of level variety **today
with zero engine changes** — it is purely a matter of writing tile maps.

The caveat: **there is no level-progression infrastructure.** "Just add more
level files" is not enough on its own, because:

| Gap | Where | Effect |
| --- | --- | --- |
| Level is hard-coded | `GameScene.ts:14` (import), `GameScene.ts:93` (build) | Only `LEVEL_1_1` can ever load. |
| Winning loops the **same** level | `levelCleared()` → `this.scene.restart()` (`GameScene.ts:730`) | Clearing the flagpole restarts 1-1 instead of advancing. |
| `"WORLD 1-1"` is hard-coded text | `UIScene.ts:40-41`, `TitleScene.ts:31` | HUD/title can't reflect the current level. |
| No "current level" or level list exists | anywhere | Nothing to advance through. |

So the honest framing is: **we need a thin progression layer first** (a level
list + a "which level am I on" value + advance-on-win). After that, adding a
level really is just authoring a `string[]`. The progression layer is small —
one new file and edits to three scenes — and is Phase 1 below.

---

## 2. Current level lifecycle (verified against source)

- **Load:** `create()` builds one hard-coded course: `new TileMapBuilder(this, LEVEL_1_1).build()` (`GameScene.ts:93`). `TileMapBuilder` is already level-agnostic — `constructor(scene, rows: string[])`, returns a `LevelBuildResult` with solids + spawn arrays + `pixelWidth/Height`.
- **Run state:** seeded in the registry **only on first boot** (`if lives === undefined`) — `score/coins/lives` at `GameScene.ts:82-86`; `time` reset every `create()` at `:87`. This "seed once" guard is what lets a death `restart()` preserve score/lives.
- **Death:** `killPlayer()` (`GameScene.ts:603`) docks a life, then after `RESPAWN_DELAY_MS` either `gameOver()` (lives ≤ 0) or `scene.restart()` — **same level** (correct: retry).
- **Game over:** `gameOver()` (`GameScene.ts:625`) wipes `score/coins/lives` back to defaults, then `scene.start('Title')`.
- **Win:** flag overlap → `onReachFlag` → `marchToCastle` → `levelCleared()` (`GameScene.ts:721`), which tallies the time bonus, shows `COURSE CLEAR!`, then `this.scene.restart()` (`:730`) — **this is the exact hook where "advance to next level" belongs.**
- **Geometry assumptions any new level must honor:** camera/world bounds derive from `pixelWidth/Height`; `deathY = pixelHeight` (`:98`); `groundSurfaceY = pixelHeight - 2*TILE` (`:102`) — i.e. the engine assumes a **two-row bottom ground strip** and a **15-row-tall** grid (`GAME_HEIGHT 240 / TILE 16 = 15`).

---

## 3. Design decisions

All aligned with the invariants in `AGENTS.md` — **do not break these:**

- **Cross-scene state stays registry-only.** The "current level" and the display
  label are new **registry keys**, set by `GameScene` and read by `UIScene` /
  `TitleScene` via `changedata-*`. No `scene.get()` / cross-scene `emit`.
- **`TileMapBuilder.build()` / `LevelBuildResult` stay stable** so the level
  source remains swappable (Tiled is still deferred — `AGENTS.md`).
- **Fixed timestep untouched**; **placeholders remain the final art/audio** (no
  real asset files).

### 3.1 A `LevelDefinition` + a `LEVELS` registry

New file `src/level/levels.ts`:

```ts
import { LEVEL_1_1 } from './level-1-1';
// import { LEVEL_1_2 } from './level-1-2'; …

export interface LevelDefinition {
  /** Display label shown in the HUD + title, e.g. "1-1". */
  name: string;
  /** Authored tile rows (see level-1-1.ts legend). */
  rows: string[];
  /** Optional per-level sky colour; defaults to classic SMB blue. */
  backgroundColor?: string;
}

/** Ordered course list. Index = progression order. */
export const LEVELS: LevelDefinition[] = [
  { name: '1-1', rows: LEVEL_1_1 },
  // { name: '1-2', rows: LEVEL_1_2 },
  // { name: '1-3', rows: LEVEL_1_3 },
];
```

Each individual course keeps living in its own `src/level/level-X-Y.ts` file
(same format as today) — `levels.ts` is just the ordered index.

### 3.2 Track the current level in the registry

Add a `levelIndex` (number) key, seeded alongside the existing run state and
reset on the same occasions:

- **Seed on first boot** — extend the `if (lives === undefined)` block
  (`GameScene.ts:82`) with `this.registry.set('levelIndex', 0)`.
- **Death `restart()`** keeps the same index (no change — the seed guard already
  preserves it) → retry the same level. Correct.
- **Advance on win** in `levelCleared()`.
- **Reset to 0** on `gameOver()` and on the new victory path (§3.4).

`GameScene.create()` then reads it to pick the course:

```ts
const index = this.registry.get('levelIndex') as number;
const def = LEVELS[index];
this.cameras.main.setBackgroundColor(def.backgroundColor ?? '#5c94fc');
this.registry.set('world', def.name);          // HUD/title read this
const level = new TileMapBuilder(this, def.rows).build();
```

### 3.3 Advance on win

Rework `levelCleared()` (`GameScene.ts:721`) so the flagpole advances instead of
looping:

```ts
private levelCleared(): void {
  this.audio.play('clear');
  const time = this.registry.get('time') as number;
  if (time > 0) { this.addScore(time * TIME_BONUS); this.registry.set('time', 0); }

  const next = (this.registry.get('levelIndex') as number) + 1;
  this.showBanner('COURSE CLEAR!');
  this.time.delayedCall(3000, () => {
    if (next >= LEVELS.length) {
      this.victory();                 // beat the last course
    } else {
      this.registry.set('levelIndex', next);
      this.scene.restart();           // GameScene rebuilds with the new index
    }
  });
}
```

### 3.4 New-game / game-over / victory resets

- `gameOver()` already resets `score/coins/lives`; **add** `this.registry.set('levelIndex', 0)` so the next run starts at 1-1.
- Add a `victory()` sibling (beat the final course): show a `THANK YOU!` /
  `YOU WIN` banner, reset run state **and** `levelIndex` to 0 like `gameOver`,
  then `scene.start('Title')`. (Behaviourally it's `gameOver()` with a happier
  banner — factor the shared reset into one helper.)

### 3.5 Data-driven world label

- `UIScene` (`:40-41`): keep the static `"WORLD"` caption; make the `"1-1"` a
  field populated from `this.registry.get('world')` in `refresh()`, and add a
  `changedata-world` listener next to the existing four (`:50-59`).
- `TitleScene` (`:31`): show `LEVELS[0].name` (or a generic subtitle). Minor.

### 3.6 `flagPennant` cleanup (latent bug to fix while here)

`flagPennant` (`GameScene.ts:66`) is set in `setupFlagpole()` but **never reset
in `create()`**. A course with no `F` marker skips `setupFlagpole`, so the field
would keep a stale (destroyed) reference across a `scene.restart()`. Add
`this.flagPennant = undefined;` to the reset block at `create()` (`:75-77`).
(Not a bug in 1-1 today, but a trap the moment a flag-less level exists.)

---

## 4. Phase 1 — MVP (progression layer + author levels)

Small, self-contained, no new mechanics. Deliverables:

| # | Task | Files |
| - | ---- | ----- |
| 1 | Add `LevelDefinition` + `LEVELS` registry | **new** `src/level/levels.ts` |
| 2 | Seed/read/reset `levelIndex`; set `world`; per-level bg; reset `flagPennant` | `src/scenes/GameScene.ts` (`create()` `:74-102`) |
| 3 | Advance-on-win + `victory()` | `src/scenes/GameScene.ts` (`levelCleared()` `:721`, `gameOver()` `:625`) |
| 4 | Data-driven HUD label | `src/scenes/UIScene.ts` (`:40-41`, `:50-59`, `refresh()`) |
| 5 | Title reads `LEVELS[0].name` | `src/scenes/TitleScene.ts` (`:31`) |
| 6 | Author **2–3 new courses** with the existing vocabulary | **new** `src/level/level-1-2.ts`, `level-1-3.ts`; register in `levels.ts` |
| 7 | Verify | `npm run typecheck` → `npm run build` → `npm run dev` playthrough |

New courses in Phase 1 use only what exists: ground/step geometry, pits,
staircases, pipe walls, brick/`?`/power-up/1-up block layouts, coin trails,
Goomba/Koopa placement, and a flag + castle. See the `creating-a-level` skill for
the authoring rules and checklist.

---

## 5. Phase 2 — optional richer variety (each needs new code)

Not required for "more levels"; listed so scope is explicit. Rough cost:

| Feature | Sketch | Cost |
| ------- | ------ | ---- |
| Per-level music / palette / theme | Extend `LevelDefinition` (music key, ground/brick tint); `BootScene` bakes tinted textures; `AudioBus` selects a track | S–M |
| Underground / castle themes | New placeholder textures + bg colour per `LevelDefinition` | S |
| Warp pipes / bonus sub-rooms | New tile char (e.g. `W`), an enter-pipe input + a sub-level load (a second `levelIndex`-like value or a `warpTo` field); reuse the registry pattern | M–L |
| Moving platforms | New entity + a `-`-adjacent marker char; tween/kinematic body; rider carry | M |
| Vertical scrolling levels | Relax the 15-row / `groundSurfaceY = pixelHeight - 2*TILE` assumptions (`GameScene.ts:98,102`); camera follow already handles Y | M |
| New enemies (Piranha, Koopa Paratroopa, Bowser) | New entities + spawn chars + collider wiring | M–L each |
| Checkpoints | Mid-level respawn point stored per attempt (registry) | M |

**Recommendation:** ship Phase 1 first (it makes the game a real multi-level
game), then pull Phase 2 items in only where a specific level needs them.

---

## 6. Level authoring constraints (summary)

Full guide + checklist live in the `creating-a-level` skill. The load-bearing
rules:

- **15 rows tall**, one char = one 16 px tile. Grid scrolls **horizontally
  only**. Width = the longest row (`TileMapBuilder` uses `max row length`).
- **Bottom two rows are the ground strip.** Cut a **pit** by leaving gaps in
  *both* bottom rows (Mario dies below `deathY = pixelHeight`).
- **Exactly one `M`** (Mario spawn). To be completable a course needs **both an
  `F` (flagpole) and a `C` (castle)** — the win cutscene walks Mario to the
  castle x, so a missing `C` leaves `castleX = 0`.
- Reachability rule of thumb (jump `-520`, gravity `1400`): ledges/blocks **≤ ~4
  tiles** above the floor; pits **≤ ~5 tiles** walking, up to ~8 with a running
  start. **Always playtest.**
- Legend (unchanged from `level-1-1.ts`): `X` ground/step · `P` pipe (both
  solid) · `B` brick · `?` question · `U` power-up · `L` 1-up · `o` coin · `M`
  Mario · `G` Goomba · `K` Koopa · `F` flag · `C` castle · `-`/space empty.

---

## 7. Verification

No test runner/linter exists (`AGENTS.md`). For every change:

1. `npm run typecheck` (strict; `vite build` does **not** type-check).
2. `npm run build` (the >500 kB `phaser` chunk warning is expected).
3. `npm run dev` (port 8080) and play: reach the flag → confirm it **advances**
   to the next course; die out → confirm **retry same course**; game over →
   confirm restart at 1-1; beat the last course → confirm victory → title.

---

## 8. Non-goals (respect `AGENTS.md`)

- **No real sprite/audio assets** — placeholders are the intended final state.
- **Don't change** `arcade { fps: 60, fixedStep: true }` or add frame-rate-dependent logic; constants are tuned against it.
- **Tiled stays deferred** — keep `TileMapBuilder.build()` / `LevelBuildResult`
  stable; levels remain authored `string[]` for now.
- Entities never read input; player↔enemy stays `overlap` + `body.touching`.

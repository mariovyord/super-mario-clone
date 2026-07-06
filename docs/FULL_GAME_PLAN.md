# Full Game — Scope & Plan

How to take the current build from a **complete vertical slice** to a **small but
finished game**: a clear start → play → win/lose → persist → replay loop, enough
content to feel like a game, and a light polish pass. Companion to `PLAN.md` (the
original build spec) and `LEVELS_PLAN.md` (the progression layer, now shipped).

> Status: **proposal.** Deliberately conservative — no new engine systems, no
> real assets, no Tiled. Everything below reuses what already ships.

---

## 1. Where we are

The engine and mechanics are **done** (PLAN.md Milestones 0–9) and the
multi-level progression layer (LEVELS_PLAN.md Phase 1) has shipped:

- **Gameplay:** run/jump feel, Goombas, Koopas (shell → slide → kick → revive),
  bricks/`?`/power-up/1-up blocks, coins, mushroom/fire-flower/fireballs, pits,
  timer, lives, 1-UPs, flagpole → castle win cutscene.
- **Flow:** `Title → Game → (advance through `LEVELS`) → victory / game-over →
  Title`. Four courses (`1-1`…`1-4`) with per-level sky colour.
- **Shell:** HUD (`UIScene`), pause + mute (`PauseScene`), touch controls
  (`TouchControlsScene`), synthesized audio (`AudioBus`), keyboard + touch input.
- **Ship:** builds to `dist/`, deployed to GitHub Pages via Actions.

**What's missing is not mechanics — it's "game completeness":** enough content, a
finished front-end loop, and things that persist between sessions.

---

## 2. Definition of "full game" (done = all true)

1. Launch shows a title with the **best score so far**.
2. Play through a **deliberate sequence of levels** grouped into worlds, each
   introduced by a brief **"WORLD X‑Y"** card.
3. Losing all lives shows a **Game Over screen** (final score); winning the last
   course shows an **ending / thanks screen** — both return cleanly to the title.
4. **High score and settings (mute/volume) survive a page reload.**
5. Works on desktop (keyboard) and mobile (touch), all on the existing
   placeholder art + synth audio.

That's it. No level editor, no online leaderboard, no new worlds of mechanics.

---

## 3. Gap analysis

| Area | Have today | Needed for "full game" | Phase |
| ---- | ---------- | ---------------------- | ----- |
| Content | 4 courses | ~8 courses in **2 worlds** (pure authoring) | 1 |
| Level intro | jump straight in | short **"WORLD X‑Y"** card before each course | 2 |
| Game over | a banner over the frozen level | a **Game Over screen** (final + best score) | 2 |
| Victory | a "THANK YOU!" banner | an **ending screen** (win + score + tiny credits) | 2 |
| Persistence | nothing survives reload | **high score + settings** in `localStorage` | 2 |
| HUD | score/coins/lives/world/time | add a **TOP** (high score) readout | 2 |
| Options | mute toggle (not saved) | mute **persisted**; optional volume step | 3 |
| Polish | hard scene cuts | short **fade** transitions; minor juice | 3 |
| Variety | one tile/enemy vocabulary | *optional* themed worlds / 1 new hazard | 4 (defer) |

---

## 4. Design decisions (respect the `AGENTS.md` invariants)

- **Cross-scene state stays registry-only.** New screens (`GameOver`, `Ending`,
  `LevelIntro`) read run state from `this.registry`; no `scene.get()` / direct
  cross-scene `emit`. New keys: `highScore` (number). `world` already exists.
- **Persistence is the one new I/O edge, and it's isolated.** Add a tiny
  `src/systems/save/SaveStore.ts` wrapping `localStorage` (load-all / save-all of
  a small JSON blob), wrapped in `try/catch` so private-mode / disabled storage
  degrades to in-memory. *Only* the boot flow and the score/settings code touch
  it; everything else still goes through the registry. Store **only**:
  `{ highScore, muted, volume }` (optionally `maxLevelReached` for a future level
  select — not used yet).
- **New scenes follow the existing overlay pattern** (like `Pause`/`UI`):
  register them in the `main.ts` scene list; launch as `start` (full-screen
  screens) or `launch` (overlays). No engine wiring changes.
- **Placeholders remain the final art; audio stays synthesized.** "Themed"
  worlds (Phase 4) = per-level **background colour + texture tint + synth track
  choice**, never new asset files (`AGENTS.md` non-goal).
- **Fixed timestep, `TileMapBuilder`/`LevelBuildResult`, input seam, and
  `overlap + body.touching` stomp all stay exactly as they are.**

---

## 5. Phase 1 — Content (make it feel like a game)

Pure level authoring with the existing vocabulary — **zero code**, per the
`creating-a-level` skill. Target **~8 courses in two worlds**.

| # | Task | Files |
| - | ---- | ----- |
| 1 | Author World 2 courses `2-1`…`2-4` (new pit/enemy/block rhythms; reuse legend) | **new** `src/level/level-2-1.ts` … `level-2-4.ts` |
| 2 | Register them in order in `LEVELS` | `src/level/levels.ts` |
| 3 | Validate every course | `node .opencode/skills/creating-a-level/scripts/validate-level.mjs` |
| 4 | Playtest each start→flag; confirm difficulty ramps | `npm run dev` |

Notes:
- **`LEVELS` order is progression order**; the last entry auto-triggers victory.
  No world-grouping code is required — the `name` string (`"2-3"`) already drives
  the HUD/intro label. (If a real "world map" is ever wanted, add a `world:
  number` to `LevelDefinition` — out of scope here.)
- Keep the ramp gentle: 1‑x teaches, 2‑x combines. Lean on the skill's
  reachability rules; **playtest** — the validator can't judge jump feel.

---

## 6. Phase 2 — Front-end loop & persistence

The core of "full game." Small, self-contained scenes + one save module.

| # | Task | Files |
| - | ---- | ----- |
| 1 | `SaveStore`: load/save `{ highScore, muted, volume }` via `localStorage` (try/catch) | **new** `src/systems/save/SaveStore.ts` |
| 2 | On boot, load save → seed `registry.highScore`; apply saved mute/volume to `AudioBus` | `src/scenes/BootScene.ts`, `src/systems/audio/AudioBus.ts` |
| 3 | Bump `highScore` whenever `score` exceeds it; persist on run end | `src/scenes/GameScene.ts` (`addScore`/`returnToTitle`) |
| 4 | HUD **TOP** readout fed by `changedata-highScore` | `src/scenes/UIScene.ts` |
| 5 | `LevelIntroScene`: 1.5 s "WORLD X‑Y" + lives card, then `start('Game')` | **new** `src/scenes/LevelIntroScene.ts`; `GameScene`/flow hands off to it |
| 6 | `GameOverScene`: "GAME OVER", final + best score, PRESS ENTER → Title | **new** `src/scenes/GameOverScene.ts`; `gameOver()` starts it |
| 7 | `EndingScene`: "YOU WIN!", final score, one-screen credits → Title | **new** `src/scenes/EndingScene.ts`; `victory()` starts it |
| 8 | Register the three new scenes | `src/main.ts` (scene list) |

Flow after Phase 2:

```
Title
  └─ start ─▶ LevelIntro("WORLD 1-1") ─▶ Game ─┬─ die, lives>0 ─▶ LevelIntro(same) ─▶ Game
                                               ├─ clear, more levels ─▶ LevelIntro(next) ─▶ Game
                                               ├─ lives = 0 ─▶ GameOver ─▶ Title
                                               └─ clear last level ─▶ Ending ─▶ Title
        (highScore persists across all of the above)
```

- `returnToTitle()` already centralizes the run-state reset; retarget it (or add
  siblings) so game-over routes to `GameOver` and victory to `Ending` instead of
  a bare banner. Keep the reset logic in one helper.
- `LevelIntro` replaces the "cold start" into a course and doubles as the retry
  card after a death — it reads `world`/`lives` from the registry only.

---

## 7. Phase 3 — Options & polish

Cheap wins once the loop is closed.

| # | Task | Files |
| - | ---- | ----- |
| 1 | Persist mute + a small **volume** step (e.g. 3 levels), toggled from Pause | `PauseScene.ts`, `AudioBus.ts`, `SaveStore.ts` |
| 2 | Short **camera fade** in/out between scenes (Title↔Intro↔Game↔over/ending) | the scene `create()`s + `cameras.main.fadeIn/Out` |
| 3 | Minor juice: brief freeze/flash on death, coin/1-UP pop — reuse existing tweens | `GameScene.ts` |
| 4 | Title shows **best score** + a one-line "how to play" (controls already listed) | `TitleScene.ts` |

Keep this pass strictly additive and cosmetic — no timing changes that affect
game feel (fixed timestep is load-bearing).

---

## 8. Phase 4 — Optional variety (defer; only if a level needs it)

Explicitly **out of scope** for "full game," listed so the boundary is clear.
These are the `LEVELS_PLAN.md` §5 Phase 2 items and inherit its costs:

- Themed worlds via **tinted placeholders + bg colour + synth-track choice**
  (extend `LevelDefinition`; `BootScene` bakes tints) — **no asset files**.
- One new **hazard/enemy** (e.g. a static spike or a Piranha in a pipe) as a new
  spawn char + entity.
- Warp/bonus sub-rooms, moving platforms, checkpoints, vertical levels.

Pull these in one at a time, per level need — never as a big bang.

---

## 9. New files & touch points (summary)

**New:** `src/systems/save/SaveStore.ts`, `src/scenes/LevelIntroScene.ts`,
`src/scenes/GameOverScene.ts`, `src/scenes/EndingScene.ts`, `src/level/level-2-1.ts`…`2-4.ts`.

**Edited:** `src/main.ts` (scene list), `src/scenes/BootScene.ts` (load save),
`src/scenes/GameScene.ts` (high-score + route to new screens),
`src/scenes/UIScene.ts` (TOP readout), `src/scenes/TitleScene.ts` (best score),
`src/scenes/PauseScene.ts` (volume), `src/systems/audio/AudioBus.ts`
(apply/persist settings), `src/level/levels.ts` (register World 2).

No changes to entities, physics, input, or `TileMapBuilder`.

---

## 10. Verification

No test runner/linter exists (`AGENTS.md`). For every change:

1. `npm run typecheck` (strict; `vite build` does **not** type-check).
2. `npm run build` (the >500 kB `phaser` chunk warning is expected).
3. `npm run dev` (port 8080) and walk the full loop:
   - Title shows best score → **WORLD card** → play.
   - Beat a course → advances to the next; beat the **last** → **Ending** → Title.
   - Die with lives left → **same** course (via the intro card); lose all → **Game
     Over** → Title.
   - Set a new high score, **reload the page** → best score persisted; mute state
     persisted.
4. Validate all courses: `node .opencode/skills/creating-a-level/scripts/validate-level.mjs`.

---

## 11. Non-goals (unchanged from `AGENTS.md` / `PLAN.md`)

- **No real sprite/audio assets** — placeholders + synth are the final state.
- **No Tiled** — levels stay authored `string[]`; `TileMapBuilder` stays stable.
- **No online leaderboard / accounts / cloud saves** — `localStorage` only.
- **No level editor, no multiplayer.**
- **Don't touch** `arcade { fps: 60, fixedStep: true }` or add frame-rate-dependent
  logic; entities never read input; player↔enemy stays `overlap` + `body.touching`.

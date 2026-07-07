# Full Game — Scope & Plan

How to take the current build from a **complete vertical slice** to a **small but
finished game**: a clear start → play → win/lose → replay loop, enough content to
feel like a game, and a light polish pass. Companion to `PLAN.md` (the original
build spec) and `LEVELS_PLAN.md` (the progression layer, now shipped).

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

**What's missing is not mechanics — it's "game completeness":** enough content,
a finished front-end loop, and a proper win/loss experience.

---

## 2. Definition of "full game" (done = all true)

1. Launch shows a title screen with controls and branding.
2. Play through a **deliberate sequence of levels** grouped into worlds, each
   introduced by a brief **"WORLD X‑Y"** card.
3. Losing all lives shows a **Game Over screen** (final score for that run);
   winning the last course shows an **ending / thanks screen** — both return
   cleanly to the title.
4. **No persistence between sessions** — this is a one-sitting arcade game,
   exactly like the original. Every run starts fresh: 3 lives, score 0, World
   1-1. There is no high-score save, no settings save, no `localStorage`.
5. Works on desktop (keyboard) and mobile (touch), all on the existing
   placeholder art + synth audio.

That's it. No level editor, no online leaderboard, no new worlds of mechanics.

---

## 3. Gap analysis

| Area | Have today | Needed for "full game" | Phase |
| ---- | ---------- | ---------------------- | ----- |
| Content | 4 courses | ~8 courses in **2 worlds** with a clear difficulty ramp | 1 |
| Level intro | jump straight in | short **"WORLD X‑Y"** card before each course | 2 |
| Game over | a banner over the frozen level | a **Game Over screen** (final score for the run) | 2 |
| Victory | a "THANK YOU!" banner | an **ending screen** (win + score + tiny credits) | 2 |
| Polish | hard scene cuts | short **fade** transitions; minor juice | 3 |
| Variety | one tile/enemy vocabulary | *optional* themed worlds / 1 new hazard | 4 (defer) |

**Removed vs original plan:** `localStorage` persistence, `SaveStore`, high-score
HUD readout, and saved mute/volume — none of these fit the arcade model.

---

## 4. Design decisions (respect the `AGENTS.md` invariants)

- **Cross-scene state stays registry-only.** New screens (`GameOver`, `Ending`,
  `LevelIntro`) read run state from `this.registry`; no `scene.get()` / direct
  cross-scene `emit`. `world` already exists; no new persistent keys needed.
- **No I/O edge.** There is no `SaveStore`, no `localStorage`, no file system
  access of any kind. Every run is stateless from the browser's perspective.
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
| 1 | Author World 2 courses `2-1`…`2-4` following the difficulty ramp below | **new** `src/level/level-2-1.ts` … `level-2-4.ts` |
| 2 | Register them in order in `LEVELS` | `src/level/levels.ts` |
| 3 | Validate every course | `node .opencode/skills/creating-a-level/scripts/validate-level.mjs` |
| 4 | Playtest each start→flag; confirm difficulty ramps | `npm run dev` |

### 5.1 Difficulty ramp

The game must be beatable on a good first run by a competent player — not a
cakewalk, but not brutal. The ramp follows the original SMB philosophy: **World
1 teaches, World 2 combines**.

**World 1 — teach one mechanic at a time**

| Course | Theme | New challenge introduced |
| ------ | ----- | ------------------------ |
| 1-1 | Open plains | Baseline: walk, jump, stomp; 1–2 Goombas, no real pits, coins everywhere |
| 1-2 | Rolling hills | First real pit (narrow, 1-2 tiles gap); introduce staircase jumps; mix in 1 Koopa |
| 1-3 | Platform city | Multiple pits, slightly wider gaps; first `?`/power-up block in a tight spot |
| 1-4 | Dense blocks | All 1-x mechanics together; longer pit, Goomba + Koopa mix; 1 tight spring-jump moment |

**World 2 — recombine with fewer hints**

| Course | Theme | Escalation |
| ------ | ----- | ---------- |
| 2-1 | Wider plains | Enemies come in pairs; pits are 2–3 tiles wide; first overhead brick maze |
| 2-2 | Stair world | Multiple staircase formations; Koopas near ledges (dangerous shells); underground-ish feel |
| 2-3 | Enemy rush | Higher enemy density; longer pits (3–4 tiles); power-up harder to reach |
| 2-4 | Final gauntlet | Everything combined: tight jumps, Goomba + Koopa + pit sequences, fast time pressure; still _beatable_ — not a wall |

**Rules of thumb for all courses:**
- Pits: ≤ 3 tiles in World 1; up to 4–5 in World 2. Never wider than a running
  long-jump can clear.
- Enemy density: 1–3 in World 1 sections; 3–6 in World 2. Never two Koopas side
  by side near a pit edge.
- Always place a `U`/`?` power-up before the hardest section of a course.
- End each course with a bit of breathing room before the flagpole so the player
  doesn't die at the finish line.
- **Playtest** — the validator enforces structure, not feel.

Notes:
- **`LEVELS` order is progression order**; the last entry auto-triggers victory.
  No world-grouping code is required — the `name` string (`"2-3"`) already drives
  the HUD/intro label.
- Keep the ramp gentle: lean on the skill's reachability rules, and **playtest**
  every course start→flag before considering it done.

---

## 6. Phase 2 — Front-end loop

The core of "full game." Small, self-contained scenes.

| # | Task | Files |
| - | ---- | ----- |
| 1 | `LevelIntroScene`: 1.5 s "WORLD X‑Y" + lives card, then `start('Game')` | **new** `src/scenes/LevelIntroScene.ts`; `GameScene`/flow hands off to it |
| 2 | `GameOverScene`: "GAME OVER", final score for the run, PRESS ENTER → Title | **new** `src/scenes/GameOverScene.ts`; `gameOver()` starts it |
| 3 | `EndingScene`: "YOU WIN!", final score, one-screen credits → Title | **new** `src/scenes/EndingScene.ts`; `victory()` starts it |
| 4 | Register the three new scenes | `src/main.ts` (scene list) |

Flow after Phase 2:

```
Title
  └─ start ─▶ LevelIntro("WORLD 1-1") ─▶ Game ─┬─ die, lives>0 ─▶ LevelIntro(same) ─▶ Game
                                               ├─ clear, more levels ─▶ LevelIntro(next) ─▶ Game
                                               ├─ lives = 0 ─▶ GameOver ─▶ Title
                                               └─ clear last level ─▶ Ending ─▶ Title
        (all state is reset on Title — no carry-over between runs)
```

- `returnToTitle()` already centralizes the run-state reset; retarget it (or add
  siblings) so game-over routes to `GameOver` and victory to `Ending` instead of
  a bare banner. Keep the reset logic in one helper.
- `LevelIntro` replaces the "cold start" into a course and doubles as the retry
  card after a death — it reads `world`/`lives` from the registry only.
- `GameOverScene` shows the score earned in that run only — no comparison to a
  saved best score (there isn't one).

---

## 7. Phase 3 — Polish

Cheap wins once the loop is closed.

| # | Task | Files |
| - | ---- | ----- |
| 1 | Short **camera fade** in/out between scenes (Title↔Intro↔Game↔over/ending) | the scene `create()`s + `cameras.main.fadeIn/Out` |
| 2 | Minor juice: brief freeze/flash on death, coin/1-UP pop — reuse existing tweens | `GameScene.ts` |
| 3 | Title shows a one-line **"how to play"** (controls already listed) | `TitleScene.ts` |

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

**New:** `src/scenes/LevelIntroScene.ts`, `src/scenes/GameOverScene.ts`,
`src/scenes/EndingScene.ts`, `src/level/level-2-1.ts`…`2-4.ts`.

**Edited:** `src/main.ts` (scene list), `src/scenes/GameScene.ts` (route to new
screens), `src/scenes/TitleScene.ts` (how-to-play line), `src/level/levels.ts`
(register World 2).

**Not touched:** `BootScene` (no save to load), `UIScene` (no TOP readout needed),
`AudioBus` (no persisted settings), `PauseScene` (mute toggle stays session-only),
entities, physics, input, `TileMapBuilder`.

---

## 10. Verification

No test runner/linter exists (`AGENTS.md`). For every change:

1. `npm run typecheck` (strict; `vite build` does **not** type-check).
2. `npm run build` (the >500 kB `phaser` chunk warning is expected).
3. `npm run dev` (port 8080) and walk the full loop:
   - Title → **WORLD card** → play.
   - Beat a course → advances to the next; beat the **last** → **Ending** → Title.
   - Die with lives left → **same** course (via the intro card); lose all → **Game
     Over** → Title.
   - Confirm all state resets on return to Title (score, lives, level index).
   - **Reload the page** → runs start from scratch (no saved state).
4. Validate all courses: `node .opencode/skills/creating-a-level/scripts/validate-level.mjs`.

---

## 11. Non-goals (unchanged from `AGENTS.md` / `PLAN.md`)

- **No real sprite/audio assets** — placeholders + synth are the final state.
- **No Tiled** — levels stay authored `string[]`; `TileMapBuilder` stays stable.
- **No persistence of any kind** — no `localStorage`, no `SaveStore`, no high
  score across sessions. Every run starts at World 1-1 with 3 lives.
- **No level editor, no multiplayer.**
- **Don't touch** `arcade { fps: 60, fixedStep: true }` or add frame-rate-dependent
  logic; entities never read input; player↔enemy stays `overlap` + `body.touching`.

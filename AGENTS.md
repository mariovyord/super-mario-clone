# AGENTS.md

Super Mario Bros World 1-1 clone — Phaser 4.0.0 + TypeScript + Vite (Arcade physics). Milestones M0–M9 are complete.

## Commands
- No test runner and no linter/formatter exist. Verify changes with `npm run typecheck` then `npm run build`.
- `npm run typecheck` (`tsc --noEmit`) is separate — `vite build` does NOT type-check. Strict mode + `noUnusedLocals`/`noUnusedParameters` are on; prefix intentionally-unused params with `_` (e.g. `update(_time, delta)`).
- `npm run dev` serves on http://localhost:8080 (port pinned in `vite.config.ts`); `npm run preview` serves the built `dist/`.
- `npm run build` always warns that the `phaser` chunk exceeds 500 kB — expected. Phaser is already isolated via `manualChunks`; don't try to "fix" it.

## Architecture invariants (don't break)
- **Phaser 4.0.0, not v3.** Renderer internals differ (RenderNodes/Filters). Use the Phaser-4 docs in `.opencode/skills/`; v3 tutorials will mislead.
- **Fixed timestep is load-bearing.** `arcade { fps: 60, fixedStep: true }` (`main.ts`); every constant in `src/config/constants.ts` is tuned against it. Don't change fps/fixedStep or add frame-rate-dependent logic.
- **Entities never read input.** `Player.update(intent, delta)` consumes a device-agnostic `PlayerIntent` from an `InputController` (`src/systems/input/`). GameScene picks `KeyboardController` or `CompositeController([Keyboard, Touch])` from `device.input.touch`. Extend input by adding a controller — never read keys/pointers inside `src/entities/`.
- **Enemy stomp = `overlap` + `body.touching`.** player↔enemy is a `physics.add.overlap`; the handler decides stomp vs damage via `pBody.touching.down && enemyBody.touching.up` — never infer a stomp from overlap presence. Enemy↔solids/blocks use real `collider`s (they populate `body.touching`); coins/power-ups use `overlap`. (PLAN §4/§9 call player↔enemy a "collider"; the shipped code uses `overlap` — trust the code.)
- **Cross-scene comms go through the registry only.** GameScene↔UIScene share state via `this.registry` keys `score`/`coins`/`lives`/`time` + `changedata-*` events. No `scene.get()`/`events.emit()` between scenes. UI, Pause, and Touch run as parallel overlay scenes over GameScene.

## Assets are generated, by design
- **No asset-loading pipeline exists, and that is intentional — keep the placeholders; do not add real sprite/audio files** (PLAN §9 "swap placeholders" is a non-goal).
- All textures are colored rectangles baked at runtime in `BootScene.generatePlaceholderTextures()` (stable keys: `mario`, `ground`, `goomba`, …). `PreloadScene` is a deliberate no-op.
- All sound is synthesized with the Web Audio API in `src/systems/audio/AudioBus.ts` (`getAudio()` singleton); it unlocks on the first pointer/keydown gesture.

## Level
- World 1-1 is an authored `string[]` in `src/level/level-1-1.ts` (1 char = one 16px tile; legend at top of file). `TileMapBuilder.build()` parses it into a `LevelBuildResult` (solids `StaticGroup` + spawn arrays). Tiled is deferred — keep `build()`/`LevelBuildResult` stable so the level source stays swappable.

## Docs & conventions
- `docs/PLAN.md` is the design/spec/decisions reference (game-feel rationale §8, architecture §4, decisions §13). When it disagrees with code, trust the code.
- Use sub-agents where appropriate. Reach for the Task/`explore` agent for codebase-wide searches and multi-file "how is this wired" questions (e.g. tracing collider/registry flow through the ~700-line `GameScene.ts`), and run independent explorations in parallel. Use direct `Read`/`Grep` for a specific known file. This keeps the main context focused.
- Commits: short, lowercase, conventional prefix (`feat:`, `docs:`, `fix:` …).

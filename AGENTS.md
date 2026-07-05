# AGENTS.md

## Repo state (read first)
- **Planning-only: there is no application code yet.** The only tracked files are
  `docs/PLAN.md` and this file. No `package.json`, build, test, lint, typecheck, or
  CI exists — do not run or assume `npm`/build/test commands until the project is
  scaffolded.
- **`docs/PLAN.md` is the single source of truth** (spec, architecture, tunable
  constants, milestones, resolved decisions). Read it before implementing or
  changing scope, and keep it updated when decisions change.

## When you start building (Milestone 0 = scaffold)
Follow the decisions already committed in `docs/PLAN.md`; don't re-derive them. The
constraints most likely to be violated:
- Stack is **Phaser 4.0.0 + TypeScript + Vite** (Arcade physics). Use Phaser **4.0.0**
  — v4 is released and the earlier "3.90, not v4" pin is superseded (see §2, §13).
  The bundled `.opencode/skills/` are written for Phaser 4.
- **Never read input in entity code.** Entities consume a `PlayerIntent` through an
  `InputController` seam; this is the thing that keeps mobile support additive
  later, so don't bypass it (§4, §12).
- Keep the **fixed timestep** (`arcade.fps: 60, fixedStep: true`) — it is
  load-bearing for consistent game feel, not optional (§4, §8).
- Stomp detection uses `collider` + `body.touching`, never a bare `overlap`
  (§4, §10).
- Scaffolding runs into a **non-empty dir** (`docs/`, `.git/`). We use the official
  Phaser Vite+TS template via `degit`, which refuses non-empty dirs and has **no**
  "ignore files" prompt: scaffold into a **temp dir, then move files into the repo
  root**, never touching `docs/` or `.git/` so `docs/PLAN.md` survives (§11).

## Conventions
- Commits: short, lowercase, with a conventional `type:` prefix (e.g. `docs: …`).

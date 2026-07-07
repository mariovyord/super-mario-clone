# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-07

### Added

- **World 2** — four new courses (2-1 through 2-4) with a difficulty ramp, each
  with its own sky colour.
- **Front-end game loop** — level-intro card, game-over, and ending scenes wiring
  the full title → play → finish flow, with a registry-driven course progression.

### Changed

- Polish pass: camera fades between scenes, a death flash, a 1-Up pop, and a
  how-to-play line on the title screen.
- Refreshed the README and repo metadata for the two-world scope: `package.json`
  version + metadata, corrected the LICENSE holder, added `.nvmrc`, and moved to
  Node 20.

## [1.0.0] - 2026-07-07

### Added

- Core platforming engine (milestones 0–9): tunable movement and jump feel with
  coyote time and jump buffering, on a fixed 60fps timestep.
- Device-agnostic input seam with keyboard **and** on-screen mobile touch controls.
- World 1 — courses 1-1 through 1-4 with a level-progression layer.
- Enemies (Goombas, Koopa Troopas with kickable shells), power-ups (Super
  Mushroom, Fire Flower with fireballs, 1-Up Mushroom), interactive `?`/brick
  blocks, and collectible coins.
- HUD with score, coins, lives, and a countdown timer; flagpole finish; a 1-Up
  every 100 coins.
- Procedural runtime assets: colored-rectangle textures and Web Audio sound and
  music; title screen and pause menu.
- GitHub Pages deployment via GitHub Actions.

[1.1.0]: https://github.com/mariovyord/super-mario-clone/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mariovyord/super-mario-clone/releases/tag/v1.0.0

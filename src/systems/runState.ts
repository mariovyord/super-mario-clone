import { START_LIVES } from '../config/constants';

/**
 * Reset the persistent per-run state held in the global registry back to a fresh
 * game: zero score/coins, full lives, first course. Every run starts here —
 * there is no persistence between sessions (see AGENTS.md), so a "new game" is
 * just this reset. Called by TitleScene (the title is always a clean slate) and
 * reused as GameScene's first-boot seed, keeping the reset in exactly one place.
 */
export function resetRunState(registry: Phaser.Data.DataManager): void {
    registry.set('score', 0);
    registry.set('coins', 0);
    registry.set('lives', START_LIVES);
    registry.set('levelIndex', 0);
}

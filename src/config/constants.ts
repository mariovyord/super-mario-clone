/**
 * Tunable constants for the game.
 *
 * These are the levers for "game feel" (see PLAN.md §8). They are starting
 * values and are expected to be tuned by playtesting, not derived from spec.
 * Physics runs on a fixed timestep (see main.ts) so these numbers behave
 * identically regardless of monitor refresh rate.
 */

// --- World ---
/** Tile size in world pixels. The NES viewport is 16x15 tiles. */
export const TILE = 16;
/** Native render resolution (NES viewport), scaled up by ZOOM. */
export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;
/** Integer zoom for a chunky retro look: 256x240 -> 768x720. */
export const ZOOM = 3;

// --- Physics ---
/** World gravity (px/s^2). */
export const GRAVITY_Y = 1400;

// --- Horizontal movement ---
/** Max walk speed (px/s). */
export const WALK_SPEED = 160;
/** Max run speed with the run button held (px/s). */
export const RUN_SPEED = 240;
/** Ground acceleration (px/s^2). */
export const ACCEL = 1200;
/** Deceleration / friction (px/s^2). */
export const FRICTION = 1000;

// --- Jump ---
/** Initial jump impulse (px/s). Negative is up. */
export const JUMP_VELOCITY = -520;
/** Velocity multiplier applied when the jump is released early (variable height). */
export const JUMP_CUT = 0.45;
/** Grace period after leaving a ledge during which a jump still registers (ms). */
export const COYOTE_MS = 80;
/** Window before landing during which a jump press is remembered (ms). */
export const JUMP_BUFFER_MS = 100;

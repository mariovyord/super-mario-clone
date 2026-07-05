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
/**
 * Terminal downward speed (px/s). Arcade `maxVelocity` clamps the absolute
 * vertical speed, so this MUST exceed |JUMP_VELOCITY| or it would clip the jump.
 */
export const MAX_FALL_SPEED = 900;

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

// --- Enemies (Milestone 3) ---
/** Goomba patrol speed (px/s). Slow, like the original. */
export const GOOMBA_SPEED = 40;

// --- Koopa (Milestone 6) ---
/** Koopa Troopa patrol speed (px/s) — a touch faster than a Goomba. */
export const KOOPA_SPEED = 50;
/** Koopa body size (px). Taller than one tile, like the original turtle. */
export const KOOPA_WIDTH = 16;
export const KOOPA_HEIGHT = 24;
/** Speed of a kicked, sliding shell (px/s) — fast enough to be dangerous. */
export const SHELL_SPEED = 220;
/** Points for kicking a stationary shell into motion (first SMB shell score). */
export const SHELL_KICK_SCORE = 400;
/**
 * How long a stationary shell waits before the Koopa climbs back out (ms). It
 * blinks a warning during the final `SHELL_WAKE_BLINK_MS` before reviving.
 */
export const SHELL_REVIVE_MS = 7000;
export const SHELL_WAKE_BLINK_MS = 2000;

// --- Interactions (Milestone 3) ---
/** Upward velocity given to Mario after stomping an enemy (px/s, negative = up). */
export const STOMP_BOUNCE = -320;
/** Death "hop": Mario pops up this fast before falling off-screen (px/s). */
export const DEATH_HOP = -360;
/** Points awarded for stomping a Goomba. */
export const STOMP_SCORE = 100;
/** Points awarded per coin collected. */
export const COIN_SCORE = 200;
/** Points awarded for breaking a brick (big Mario). */
export const BRICK_SCORE = 50;
/** Delay between death and level reset (ms), so the death hop is visible. */
export const RESPAWN_DELAY_MS = 900;

// --- Power-ups (Milestone 5) ---
/** Big/fire Mario body size (px). Small Mario stays 16x16. */
export const BIG_WIDTH = 16;
export const BIG_HEIGHT = 32;
/** Invulnerability window after taking a hit (ms) — Mario blinks during it. */
export const INVINCIBLE_MS = 1500;
/** Mushroom walk speed (px/s). */
export const MUSHROOM_SPEED = 60;
/** Points for collecting a power-up (mushroom / fire flower). */
export const POWERUP_SCORE = 1000;
/** Fireball horizontal speed (px/s). */
export const FIREBALL_SPEED = 260;
/** Max fireballs Mario can have on screen at once (SMB rule). */
export const FIREBALL_MAX = 2;

// --- Progression: lives, timer, level complete (Milestone 7) ---
/** Marios you start with (counting the one in play). Game over at zero. */
export const START_LIVES = 3;
/** Level countdown, in SMB "time units" (not real seconds). */
export const START_TIME = 400;
/** Real milliseconds per time unit — SMB counts down faster than a wall clock. */
export const TIME_TICK_MS = 400;
/** Score awarded per remaining time unit when the flagpole is reached. */
export const TIME_BONUS = 50;
/** Collect this many coins to earn a 1-UP (then the counter rolls over). */
export const COINS_PER_1UP = 100;

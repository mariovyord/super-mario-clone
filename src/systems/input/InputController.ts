import type { PlayerIntent } from './PlayerIntent';

/**
 * Device-agnostic input strategy. Each frame `update()` samples the active
 * device and refreshes `intent`; the Player reads only `intent` and never the
 * device itself.
 *
 * Swapping keyboard for touch later means adding a new implementation of this
 * interface — no changes to Player, physics, or level code (see PLAN.md §4/§12).
 */
export interface InputController {
    /** Sample the device once per frame, refreshing `intent` in place. */
    update(): void;
    /** The latest normalized intent (stable reference, mutated in place). */
    readonly intent: PlayerIntent;
    /** Release any device listeners / registered keys held by this controller. */
    destroy(): void;
}

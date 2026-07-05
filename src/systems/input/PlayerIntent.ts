/**
 * Normalized, device-agnostic input for a single frame. Produced by an
 * `InputController` (keyboard now, touch later) and consumed by the Player.
 *
 * Entities depend on this struct, never on the physical device — this is the
 * seam that keeps mobile support additive (see PLAN.md §4 / §12).
 */
export interface PlayerIntent {
    /** Horizontal move axis: -1 left, 0 idle, +1 right. */
    moveX: number;
    /** Jump was pressed *this frame* (edge-triggered) — feeds jump buffering. */
    jumpPressed: boolean;
    /** Jump is currently held (level-triggered) — feeds variable jump height. */
    jumpHeld: boolean;
    /** Run / fire button is held. */
    run: boolean;
}

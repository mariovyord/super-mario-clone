/**
 * Shared, mutable on-screen control state (PLAN.md §12, Milestone 9).
 *
 * `TouchControlsScene` writes these level-triggered booleans from the on-screen
 * buttons; `TouchController` reads them each frame and derives the edge events
 * (jump/fire pressed) for the `PlayerIntent`. A tiny singleton is the decoupling
 * seam between the overlay scene and the controller — neither references the
 * other, mirroring how the audio engine is shared.
 */
export interface TouchState {
    left: boolean;
    right: boolean;
    jump: boolean;
    run: boolean;
}

let shared: TouchState | null = null;

/** The process-wide touch-button state; created on first use. */
export function getTouchState(): TouchState {
    if (!shared) {
        shared = { left: false, right: false, jump: false, run: false };
    }
    return shared;
}

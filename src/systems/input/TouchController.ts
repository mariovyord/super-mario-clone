import type { InputController } from './InputController';
import type { PlayerIntent } from './PlayerIntent';
import { getTouchState } from './TouchState';

/**
 * Maps the on-screen touch buttons to a `PlayerIntent` (PLAN.md §12, Milestone
 * 9). It reads the shared `TouchState` (written by `TouchControlsScene`) and,
 * exactly like `KeyboardController`, derives the edge-triggered jump/fire flags
 * from frame-to-frame changes. The Player is unaware a touchscreen exists —
 * mobile support is purely additive behind the `InputController` seam.
 */
export class TouchController implements InputController {
    readonly intent: PlayerIntent = {
        moveX: 0,
        jumpPressed: false,
        jumpHeld: false,
        run: false,
        firePressed: false,
    };

    private prevJump = false;
    private prevRun = false;
    private readonly touch = getTouchState();

    update(): void {
        const t = this.touch;
        this.intent.moveX = (t.right ? 1 : 0) - (t.left ? 1 : 0);

        // Edge-trigger a fresh press this frame (feeds jump buffering / one shot).
        this.intent.jumpPressed = t.jump && !this.prevJump;
        this.intent.jumpHeld = t.jump;
        this.intent.run = t.run;
        this.intent.firePressed = t.run && !this.prevRun;

        this.prevJump = t.jump;
        this.prevRun = t.run;
    }

    destroy(): void {
        // No device listeners to release — TouchControlsScene owns the UI.
    }
}

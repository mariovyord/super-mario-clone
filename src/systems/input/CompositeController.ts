import type { InputController } from './InputController';
import type { PlayerIntent } from './PlayerIntent';

/**
 * Merges several `InputController`s into one so keyboard and touch can drive
 * Mario at the same time (PLAN.md §12: "and/or support both at once"). Each
 * frame it updates every part and OR-combines their intents; `moveX` is summed
 * then clamped so opposing inputs cancel. The Player still consumes a single
 * `PlayerIntent`, so this stays purely additive.
 */
export class CompositeController implements InputController {
    readonly intent: PlayerIntent = {
        moveX: 0,
        jumpPressed: false,
        jumpHeld: false,
        run: false,
        firePressed: false,
    };

    constructor(private readonly parts: InputController[]) {}

    update(): void {
        let moveX = 0;
        let jumpPressed = false;
        let jumpHeld = false;
        let run = false;
        let firePressed = false;

        for (const part of this.parts) {
            part.update();
            const i = part.intent;
            moveX += i.moveX;
            jumpPressed = jumpPressed || i.jumpPressed;
            jumpHeld = jumpHeld || i.jumpHeld;
            run = run || i.run;
            firePressed = firePressed || i.firePressed;
        }

        this.intent.moveX = Math.max(-1, Math.min(1, moveX));
        this.intent.jumpPressed = jumpPressed;
        this.intent.jumpHeld = jumpHeld;
        this.intent.run = run;
        this.intent.firePressed = firePressed;
    }

    destroy(): void {
        for (const part of this.parts) {
            part.destroy();
        }
    }
}

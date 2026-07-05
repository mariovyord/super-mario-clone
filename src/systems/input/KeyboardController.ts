import { Input } from 'phaser';
import type { Scene } from 'phaser';
import type { InputController } from './InputController';
import type { PlayerIntent } from './PlayerIntent';

/**
 * Maps the keyboard to a `PlayerIntent` (see PLAN.md §5). Bindings:
 *   move : ← / →  and  A / D
 *   jump : Space / ↑ / Z   (edge-triggered for buffering; held for variable height)
 *   run  : Shift / X       (held)
 *
 * `createCursorKeys()` covers arrows + space + shift; `addKeys()` adds the
 * A/D/Z/X alternates it does not include. The Player consumes the resulting
 * intent and stays unaware of the physical keys, so a touch controller can drop
 * in later with no entity changes.
 */
export class KeyboardController implements InputController {
    readonly intent: PlayerIntent = {
        moveX: 0,
        jumpPressed: false,
        jumpHeld: false,
        run: false,
    };

    private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;

    constructor(private readonly scene: Scene) {
        const keyboard = scene.input.keyboard;
        if (!keyboard) {
            throw new Error('KeyboardController requires the keyboard plugin to be enabled.');
        }
        this.cursors = keyboard.createCursorKeys();
        this.keys = keyboard.addKeys('W,A,S,D,Z,X') as Record<string, Phaser.Input.Keyboard.Key>;
    }

    update(): void {
        const c = this.cursors;
        const k = this.keys;

        const left = c.left.isDown || k.A.isDown;
        const right = c.right.isDown || k.D.isDown;
        this.intent.moveX = (right ? 1 : 0) - (left ? 1 : 0);

        // Evaluate every jump key without short-circuiting so each key's
        // just-pressed flag is consumed consistently this frame.
        const spaceJust = Input.Keyboard.JustDown(c.space);
        const upJust = Input.Keyboard.JustDown(c.up);
        const zJust = Input.Keyboard.JustDown(k.Z);
        this.intent.jumpPressed = spaceJust || upJust || zJust;
        this.intent.jumpHeld = c.space.isDown || c.up.isDown || k.Z.isDown;

        this.intent.run = c.shift.isDown || k.X.isDown;
    }

    destroy(): void {
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) {
            return;
        }
        // Release the alternate keys we registered (cursor keys are owned by the plugin).
        for (const code of ['W', 'A', 'S', 'D', 'Z', 'X']) {
            keyboard.removeKey(code);
        }
    }
}

import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getTouchState } from '../systems/input/TouchState';
import type { TouchState } from '../systems/input/TouchState';
import { UI } from '../visuals/UI';

/**
 * On-screen touch controls (PLAN.md §12, Milestone 9). A parallel overlay,
 * launched by GameScene only on touch devices, that renders a two-button d-pad
 * plus jump / run-fire buttons and writes the shared `TouchState`. It never
 * touches Player/physics/level code — mobile support composes on top via the
 * `InputController` seam. Buttons are pinned to the viewport (`scrollFactor 0`)
 * and support several simultaneous fingers (move + jump + fire).
 */
export class TouchControlsScene extends Scene {
    private readonly touch = getTouchState();

    constructor() {
        super('Touch');
    }

    create() {
        // Allow several concurrent touches so the d-pad + buttons work together.
        this.input.addPointer(3);

        const base = GAME_HEIGHT - 26;
        this.makeButton(24, base, 'left', '\u25C0');
        this.makeButton(62, base, 'right', '\u25B6');
        this.makeButton(GAME_WIDTH - 24, base, 'jump', 'A');
        this.makeButton(GAME_WIDTH - 60, base + 8, 'run', 'B');

        // Never leave a button stuck if the overlay is torn down or backgrounded.
        this.events.on('sleep', this.clear, this);
        this.events.once('shutdown', this.clear, this);
    }

    /** A translucent round button that holds `state[key]` while pressed. */
    private makeButton(x: number, y: number, key: keyof TouchState, label: string): void {
        const radius = 16;
        const accent = key === 'jump' ? UI.gold : key === 'run' ? UI.coral : UI.jade;
        const button = this.add
            .circle(x, y, radius, UI.ink, 0.3)
            .setStrokeStyle(1, accent, 0.65)
            .setScrollFactor(0)
            .setDepth(50)
            .setInteractive();
        this.add
            .text(x, y, label, {
                fontFamily: 'monospace', fontSize: '11px', color: UI.ivory,
                shadow: { offsetX: 0, offsetY: 1, color: '#0b1825', blur: 0, fill: true },
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(51);

        const press = () => {
            this.touch[key] = true;
            button.setFillStyle(accent, 0.45);
            button.setStrokeStyle(1, accent, 1);
        };
        const release = () => {
            this.touch[key] = false;
            button.setFillStyle(UI.ink, 0.3);
            button.setStrokeStyle(1, accent, 0.65);
        };

        button.on('pointerdown', press);
        button.on('pointerup', release);
        button.on('pointerout', release);
        button.on('pointerupoutside', release);
    }

    /** Reset every button (avoids inputs "sticking" across scene changes). */
    private clear(): void {
        const t = this.touch;
        t.left = false;
        t.right = false;
        t.jump = false;
        t.run = false;
    }
}

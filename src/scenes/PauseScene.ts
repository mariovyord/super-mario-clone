import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getAudio } from '../systems/audio/AudioBus';
import { UI, card, heading, label, ornament } from '../visuals/UI';

/**
 * PauseScene is a lightweight modal overlay launched by GameScene (PLAN.md §9,
 * Milestone 8). GameScene freezes itself with `scene.pause()` and runs this on
 * top; this scene owns the "resume" input so the frozen GameScene doesn't need
 * to keep polling. A short arm delay swallows the very key press that opened the
 * menu, so it can't instantly close again.
 */
export class PauseScene extends Scene {
    private canResume = false;

    constructor() {
        super('Pause');
    }

    create() {
        this.canResume = false;

        // Dim the frozen level and label it.
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, UI.ink, 0.64).setOrigin(0);
        card(this, 30, 71, 196, 102);
        label(this, GAME_WIDTH / 2, 87, 'A MOMENT OF QUIET', 7, UI.goldText);
        heading(this, 112, 'Paused', 26);
        ornament(this, 132, 110);
        label(this, GAME_WIDTH / 2, 146, 'P / ESC / TAP TO RESUME', 8);
        label(this, GAME_WIDTH / 2, 160, 'M  TOGGLE SOUND', 7, UI.muted);

        // Ignore the same-frame echo of the key that opened the menu, then arm.
        this.time.delayedCall(180, () => {
            this.canResume = true;
        });

        this.input.keyboard?.on('keydown-P', this.tryResume, this);
        this.input.keyboard?.on('keydown-ESC', this.tryResume, this);
        this.input.keyboard?.on('keydown-M', this.toggleMute, this);
        this.input.on('pointerdown', this.tryResume, this);
    }

    private toggleMute(): void {
        getAudio().toggleMute();
    }

    /** Resume the level (once armed): unfreeze GameScene and close this overlay. */
    private tryResume(): void {
        if (!this.canResume) {
            return;
        }
        getAudio().play('pause');
        getAudio().startMusic();
        this.scene.resume('Game');
        this.scene.stop();
    }
}

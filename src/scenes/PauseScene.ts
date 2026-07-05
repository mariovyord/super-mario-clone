import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getAudio } from '../systems/audio/AudioBus';

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
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, 'PAUSED', {
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#ffffff',
            })
            .setOrigin(0.5);
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 12, 'P / ESC RESUME    M MUTE', {
                fontFamily: 'monospace',
                fontSize: '7px',
                color: '#dddddd',
            })
            .setOrigin(0.5);

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

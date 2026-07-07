import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getAudio } from '../systems/audio/AudioBus';

/**
 * GameOverScene is the end-of-run screen shown when Mario runs out of lives. It
 * reads the final score from the registry (GameScene leaves it intact) and,
 * after a short beat or an input, returns to the title — which is where the run
 * state is actually reset, so the next game starts fresh at World 1-1.
 */
export class GameOverScene extends Scene {
    private done = false;

    constructor() {
        super('GameOver');
    }

    create() {
        this.done = false;
        const cx = GAME_WIDTH / 2;
        this.cameras.main.setBackgroundColor('#000000');

        const score = (this.registry.get('score') as number) ?? 0;

        this.add
            .text(cx, GAME_HEIGHT * 0.42, 'GAME OVER', {
                fontFamily: 'monospace',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#ffffff',
            })
            .setOrigin(0.5);
        this.add
            .text(cx, GAME_HEIGHT * 0.6, `SCORE  ${String(score).padStart(6, '0')}`, {
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#ffe08a',
            })
            .setOrigin(0.5);

        getAudio().stopMusic();

        // Auto-return, or let an impatient player skip once the screen has settled.
        this.time.delayedCall(3600, () => this.toTitle());
        this.time.delayedCall(700, () => {
            this.input.keyboard?.once('keydown', () => this.toTitle());
            this.input.once('pointerdown', () => this.toTitle());
        });
    }

    private toTitle(): void {
        if (this.done) {
            return;
        }
        this.done = true;
        this.scene.start('Title');
    }
}

import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { getAudio } from '../systems/audio/AudioBus';

/**
 * EndingScene is the win screen shown after the final course is cleared. It
 * celebrates, shows the final score (read from the registry, which GameScene
 * leaves intact), rolls a one-line credit, and then — after a beat or an input —
 * returns to the title, where the run state is reset for a fresh playthrough.
 */
export class EndingScene extends Scene {
    private done = false;

    constructor() {
        super('Ending');
    }

    create() {
        this.done = false;
        const cx = GAME_WIDTH / 2;
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(300, 0, 0, 0);

        const score = (this.registry.get('score') as number) ?? 0;

        this.add.image(cx, GAME_HEIGHT * 0.26, 'marioBig').setScale(2);
        this.add
            .text(cx, GAME_HEIGHT * 0.5, 'YOU WIN!', {
                fontFamily: 'monospace',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#ffe08a',
            })
            .setOrigin(0.5);
        this.add
            .text(cx, GAME_HEIGHT * 0.64, `SCORE  ${String(score).padStart(6, '0')}`, {
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#ffffff',
            })
            .setOrigin(0.5);
        this.add
            .text(cx, GAME_HEIGHT * 0.8, 'THANKS FOR PLAYING', {
                fontFamily: 'monospace',
                fontSize: '8px',
                color: '#8ad0ff',
            })
            .setOrigin(0.5);

        getAudio().stopMusic();

        // Linger a little longer than GAME OVER, but allow a skip once settled.
        this.time.delayedCall(6000, () => this.toTitle());
        this.time.delayedCall(900, () => {
            this.input.keyboard?.once('keydown', () => this.toTitle());
            this.input.once('pointerdown', () => this.toTitle());
        });
    }

    private toTitle(): void {
        if (this.done) {
            return;
        }
        this.done = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    }
}

import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { LEVELS } from '../level/levels';
import { getAudio } from '../systems/audio/AudioBus';

/**
 * TitleScene is the front-end shown before play (PLAN.md §9, Milestone 8). It
 * presents the game, lists the controls, and waits for a key press / tap to
 * start. Touching it also satisfies the browser's "user gesture" requirement,
 * so audio is unlocked by the time the level begins.
 */
export class TitleScene extends Scene {
    constructor() {
        super('Title');
    }

    create() {
        const cx = GAME_WIDTH / 2;
        this.cameras.main.setBackgroundColor('#5c94fc');

        // Mascot + title block.
        this.add.image(cx, GAME_HEIGHT * 0.3, 'marioBig').setScale(2);
        this.add
            .text(cx, GAME_HEIGHT * 0.5, 'SUPER MARIO', {
                fontFamily: 'monospace',
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#ffffff',
            })
            .setOrigin(0.5);
        this.add
            .text(cx, GAME_HEIGHT * 0.6, `WORLD ${LEVELS[0].name}`, {
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#ffe08a',
            })
            .setOrigin(0.5);

        // Blinking "press start" prompt.
        const prompt = this.add
            .text(cx, GAME_HEIGHT * 0.76, 'PRESS ENTER / TAP TO START', {
                fontFamily: 'monospace',
                fontSize: '8px',
                color: '#ffffff',
            })
            .setOrigin(0.5);
        this.tweens.add({ targets: prompt, alpha: 0.15, duration: 550, yoyo: true, repeat: -1 });

        this.add
            .text(cx, GAME_HEIGHT * 0.9, 'ARROWS MOVE   Z JUMP   X RUN/FIRE   P PAUSE', {
                fontFamily: 'monospace',
                fontSize: '7px',
                color: '#d0d0d0',
            })
            .setOrigin(0.5);

        // Instantiate the audio engine now so the start gesture unlocks it.
        getAudio();

        const start = () => this.startGame();
        this.input.keyboard?.once('keydown-ENTER', start);
        this.input.keyboard?.once('keydown-SPACE', start);
        this.input.once('pointerdown', start);
    }

    private startGame(): void {
        getAudio().play('coin'); // little confirmation blip
        this.scene.start('Game');
    }
}

import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { LEVELS } from '../level/levels';

/**
 * LevelIntroScene is the between-course card (classic SMB "WORLD 1-1" screen).
 * It sits in front of every course: the title starts it, a death-with-lives
 * returns to it for the same course, and clearing a flagpole advances the
 * `levelIndex` and shows it for the next one. It only *reads* the registry
 * (levelIndex + lives) — it never resets run state — then hands off to GameScene
 * after a short beat, which (re)builds the level and relaunches the HUD.
 */
export class LevelIntroScene extends Scene {
    constructor() {
        super('LevelIntro');
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(300, 0, 0, 0);

        const index = (this.registry.get('levelIndex') as number) ?? 0;
        const lives = (this.registry.get('lives') as number) ?? 0;
        const name = LEVELS[index]?.name ?? LEVELS[0].name;

        this.add
            .text(cx, cy - 22, `WORLD ${name}`, {
                fontFamily: 'monospace',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        // Lives card: a small Mario head + "x N", centred as a pair under the label.
        this.add.image(cx - 8, cy + 14, 'mario').setOrigin(1, 0.5);
        this.add
            .text(cx, cy + 14, `x  ${lives}`, {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#ffffff',
            })
            .setOrigin(0, 0.5);

        // Hold the card briefly, then fade down into the level.
        this.time.delayedCall(1500, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
        });
    }
}

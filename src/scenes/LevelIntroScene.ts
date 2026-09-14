import { Scene } from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { LEVELS } from '../level/levels';
import { themeFor } from '../visuals/Scenery';
import { UI, card, heading, label, menuBackdrop, ornament } from '../visuals/UI';

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
        this.cameras.main.fadeIn(300, 0, 0, 0);

        const index = (this.registry.get('levelIndex') as number) ?? 0;
        const lives = (this.registry.get('lives') as number) ?? 0;
        const name = LEVELS[index]?.name ?? LEVELS[0].name;

        menuBackdrop(this, index);
        const theme = themeFor(index);
        card(this, 27, 65, 202, 113, theme.accent);
        label(this, cx, 81, 'THE TRAIL CONTINUES', 7, UI.goldText);
        heading(this, 105, `World ${name}`, 26);
        label(this, cx, 126, theme.name, 8, UI.jadeText);
        ornament(this, 140, 120, theme.accent);
        this.add.image(cx - 13, 159, 'mario').setDepth(30);
        label(this, cx + 12, 159, `× ${lives}`, 11);
        label(this, cx, 203, 'EVERY GREAT JOURNEY BEGINS WITH A STEP', 6, UI.muted);

        // Hold the card briefly, then fade down into the level.
        this.time.delayedCall(1500, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
        });
    }
}

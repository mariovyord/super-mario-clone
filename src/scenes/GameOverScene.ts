import { Scene } from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { getAudio } from '../systems/audio/AudioBus';
import { UI, card, heading, label, menuBackdrop, ornament } from '../visuals/UI';

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
        menuBackdrop(this, (this.registry.get('levelIndex') as number) ?? 0);
        this.cameras.main.fadeIn(300, 0, 0, 0);

        const score = (this.registry.get('score') as number) ?? 0;

        card(this, 27, 62, 202, 120, UI.coral);
        label(this, cx, 80, 'THE TRAIL RESTS HERE', 7, UI.coralText);
        heading(this, 105, 'Game Over', 26);
        ornament(this, 126, 124, UI.coral);
        label(this, cx, 143, 'FINAL SCORE', 7, UI.muted);
        label(this, cx, 160, String(score).padStart(6, '0'), 14, UI.goldText);
        label(this, cx, 199, 'ANOTHER ADVENTURE AWAITS', 7);
        label(this, cx, 214, 'ANY KEY / TAP TO RETURN', 7, UI.muted);

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
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    }
}

import { Scene } from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { getAudio } from '../systems/audio/AudioBus';
import { UI, card, heading, label, menuBackdrop, ornament } from '../visuals/UI';

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
        menuBackdrop(this, (this.registry.get('levelIndex') as number) ?? 0);
        this.cameras.main.fadeIn(300, 0, 0, 0);

        const score = (this.registry.get('score') as number) ?? 0;

        label(this, cx, 26, 'THE WOODLAND REMEMBERS', 7, UI.goldText);
        this.add.image(cx, 59, 'marioBig').setDepth(30);
        ornament(this, 82, 110);
        card(this, 27, 94, 202, 85);
        heading(this, 114, 'You Win!', 28, UI.goldText);
        label(this, cx, 139, 'ADVENTURE COMPLETE', 7, UI.jadeText);
        label(this, cx, 160, `SCORE  ${String(score).padStart(6, '0')}`, 11);
        label(this, cx, 197, 'THANK YOU FOR WANDERING', 8, UI.goldText);
        label(this, cx, 215, 'ANY KEY / TAP TO RETURN', 7, UI.muted);

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

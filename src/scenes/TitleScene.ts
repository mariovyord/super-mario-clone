import { Scene } from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { LEVELS } from '../level/levels';
import { getAudio } from '../systems/audio/AudioBus';
import { resetRunState } from '../systems/runState';
import { UI, card, heading, label, menuBackdrop, ornament } from '../visuals/UI';

/**
 * TitleScene is the front-end shown before play (PLAN.md §9, Milestone 8). It
 * presents the game, lists the controls, and waits for a key press / tap to
 * start. Touching it also satisfies the browser's "user gesture" requirement,
 * so audio is unlocked by the time the level begins.
 */
export class TitleScene extends Scene {
    private started = false;

    constructor() {
        super('Title');
    }

    create() {
        this.started = false;
        const cx = GAME_WIDTH / 2;
        menuBackdrop(this);
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // The title is the one true "fresh start": clear any leftover run state
        // from a finished game so a new playthrough begins at World 1-1 with a
        // full stock of lives and a zeroed score.
        resetRunState(this.registry);

        label(this, cx, 22, `WOODLAND EDITION  /  WORLD ${LEVELS[0].name}`, 7, UI.goldText);
        label(this, cx, 45, 'SUPER', 14).setLetterSpacing(5);
        heading(this, 75, 'MARIO', 40);
        label(this, cx, 103, 'a woodland adventure', 9, UI.goldText);
        ornament(this, 116, 122);
        this.add.ellipse(cx, 156, 36, 6, UI.ink, 0.55).setDepth(25);
        this.add.image(cx, 139, 'marioBig').setDepth(30);
        card(this, 34, 167, 188, 23);

        // Keep the original start-prompt cadence and every start binding.
        const prompt = label(this, cx, 178, 'ENTER / SPACE / TAP TO START', 8, UI.goldText);
        this.tweens.add({ targets: prompt, alpha: 0.15, duration: 550, yoyo: true, repeat: -1 });
        label(this, cx, 199, 'BRAVE THE WILDS. REACH THE FLAG.', 7, UI.ivory);
        label(this, cx, 212, 'MOVE ← → / A D   JUMP SPACE / ↑ / Z', 7, UI.muted);
        label(this, cx, 223, 'RUN/FIRE SHIFT / X   PAUSE P / ESC', 7, UI.muted);

        // Instantiate the audio engine now so the start gesture unlocks it.
        getAudio();

        const start = () => this.startGame();
        this.input.keyboard?.once('keydown-ENTER', start);
        this.input.keyboard?.once('keydown-SPACE', start);
        this.input.once('pointerdown', start);
    }

    private startGame(): void {
        if (this.started) {
            return; // ignore a second key/tap while the fade is already running
        }
        this.started = true;
        getAudio().play('coin'); // little confirmation blip
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('LevelIntro'));
    }
}

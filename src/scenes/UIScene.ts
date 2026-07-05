import { Scene } from 'phaser';

/**
 * UIScene is the HUD overlay. It runs in parallel on top of GameScene so the
 * readout stays fixed while the world scrolls. It stays decoupled from GameScene:
 * it never references it directly, only reads the shared `this.registry` and
 * reacts to its `changedata` events (see PLAN.md §4).
 *
 * Milestone 3: score + coin counter. Milestone 7 adds the lives counter, the
 * WORLD label, and the SMB countdown timer.
 */
export class UIScene extends Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private coinText!: Phaser.GameObjects.Text;
    private livesText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;

    constructor() {
        super('UI');
    }

    create() {
        const font: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#ffffff',
        };

        // "MARIO / score" block, top-left (classic SMB layout).
        this.add.text(16, 8, 'MARIO', font);
        this.scoreText = this.add.text(16, 18, '', font);

        // Coin counter (top) and lives counter (below), each an icon + count.
        this.add.image(84, 11, 'coin').setScale(0.7);
        this.coinText = this.add.text(92, 8, '', font);
        this.add.image(84, 23, 'mario').setScale(0.7);
        this.livesText = this.add.text(92, 18, '', font);

        // Centre: the world label.
        this.add.text(150, 8, 'WORLD', font);
        this.add.text(158, 18, '1-1', font);

        // Right: the SMB countdown timer.
        this.add.text(206, 8, 'TIME', font);
        this.timeText = this.add.text(210, 18, '', font);

        this.refresh();

        // React to changes GameScene pushes through the registry.
        this.registry.events.on('changedata-score', this.refresh, this);
        this.registry.events.on('changedata-coins', this.refresh, this);
        this.registry.events.on('changedata-lives', this.refresh, this);
        this.registry.events.on('changedata-time', this.refresh, this);
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-score', this.refresh, this);
            this.registry.events.off('changedata-coins', this.refresh, this);
            this.registry.events.off('changedata-lives', this.refresh, this);
            this.registry.events.off('changedata-time', this.refresh, this);
        });
    }

    /** Pull the current values from the registry and repaint the readout. */
    private refresh(): void {
        const score = (this.registry.get('score') as number) ?? 0;
        const coins = (this.registry.get('coins') as number) ?? 0;
        const lives = (this.registry.get('lives') as number) ?? 0;
        const time = (this.registry.get('time') as number) ?? 0;
        this.scoreText.setText(String(score).padStart(6, '0'));
        this.coinText.setText('x' + String(coins).padStart(2, '0'));
        this.livesText.setText('x' + String(lives));
        this.timeText.setText(String(time).padStart(3, '0'));
    }
}

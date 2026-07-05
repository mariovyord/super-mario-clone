import { Scene } from 'phaser';

/**
 * UIScene is the HUD overlay. It runs in parallel on top of GameScene so the
 * readout stays fixed while the world scrolls. It stays decoupled from GameScene:
 * it never references it directly, only reads the shared `this.registry` and
 * reacts to its `changedata` events (see PLAN.md §4).
 *
 * Milestone 3: score + coin counter.
 */
export class UIScene extends Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private coinText!: Phaser.GameObjects.Text;

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

        // Coin counter with a little coin icon, a bit further right.
        this.add.image(96, 22, 'coin');
        this.coinText = this.add.text(104, 18, '', font);

        this.refresh();

        // React to score/coin changes pushed by GameScene through the registry.
        this.registry.events.on('changedata-score', this.refresh, this);
        this.registry.events.on('changedata-coins', this.refresh, this);
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-score', this.refresh, this);
            this.registry.events.off('changedata-coins', this.refresh, this);
        });
    }

    /** Pull the current values from the registry and repaint the readout. */
    private refresh(): void {
        const score = (this.registry.get('score') as number) ?? 0;
        const coins = (this.registry.get('coins') as number) ?? 0;
        this.scoreText.setText(String(score).padStart(6, '0'));
        this.coinText.setText('x' + String(coins).padStart(2, '0'));
    }
}

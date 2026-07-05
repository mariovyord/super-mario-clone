import { Scene } from 'phaser';

/**
 * UIScene is the HUD overlay. It runs in parallel on top of GameScene so the
 * HUD stays fixed while the world scrolls. It reads game state from the shared
 * `this.registry` and reacts to `changedata` events (decoupled from GameScene).
 *
 * Milestone 0: empty shell. The score/coins readout arrives in Milestone 3.
 */
export class UIScene extends Scene {
    constructor() {
        super('UI');
    }

    create() {
        // HUD widgets (score, coins) are added in Milestone 3.
    }
}

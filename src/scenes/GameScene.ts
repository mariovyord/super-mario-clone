import { Scene } from 'phaser';

/**
 * GameScene owns the level: tilemap/colliders, entities, camera, and physics
 * wiring. For the Milestone 0 scaffold it only paints a background color and
 * launches the UIScene in parallel.
 *
 * Communication with the HUD flows through `this.registry` (the shared
 * game-level DataManager) and its `changedata` events — never through direct
 * scene references (see PLAN.md §4).
 */
export class GameScene extends Scene {
    constructor() {
        super('Game');
    }

    create() {
        // Classic SMB 1-1 sky blue.
        this.cameras.main.setBackgroundColor('#5c94fc');

        // Run the HUD overlay in parallel on top of this scene.
        this.scene.launch('UI');
    }
}

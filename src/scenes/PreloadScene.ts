import { Scene } from 'phaser';

/**
 * PreloadScene is a no-op for the MVP: all textures are generated at runtime in
 * BootScene, so there is nothing to load yet. It earns its keep at Milestone 4+
 * when real assets arrive (loading them here and showing a progress bar).
 */
export class PreloadScene extends Scene {
    constructor() {
        super('Preload');
    }

    create() {
        // No assets to load for the MVP. Start the game and its parallel HUD.
        this.scene.start('Game');
    }
}

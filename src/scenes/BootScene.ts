import { Scene } from 'phaser';

/**
 * BootScene runs first. From Milestone 1 onward it will generate all
 * placeholder textures at runtime via `Graphics.generateTexture` (stable keys:
 * mario, ground, brick, question, pipe, coin, goomba, flag) so the game needs
 * zero external art. For the Milestone 0 scaffold it simply hands off to the
 * PreloadScene.
 */
export class BootScene extends Scene {
    constructor() {
        super('Boot');
    }

    create() {
        // Placeholder texture generation lands here in Milestone 1.
        this.scene.start('Preload');
    }
}

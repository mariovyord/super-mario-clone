import { Scene } from 'phaser';
import { generateTextures } from '../visuals/Textures';

/** Bake the woodland pixel art before the procedural, no-loading preload flow. */
export class BootScene extends Scene {
    constructor() {
        super('Boot');
    }

    create() {
        generateTextures(this);
        this.scene.start('Preload');
    }
}

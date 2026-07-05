import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { KeyboardController } from '../systems/input/KeyboardController';
import type { InputController } from '../systems/input/InputController';
import { LEVEL_1_1 } from '../level/level-1-1';
import { TileMapBuilder } from '../level/TileMapBuilder';

/**
 * GameScene owns the level: it builds the tilemap colliders, spawns Mario, wires
 * physics, and runs the scrolling camera. Milestone 2 replaces the M1 sandbox
 * floor with the authored 1-1 slice (see `level-1-1.ts`) and a follow camera.
 *
 * Enemies, coins, and the HUD arrive in Milestone 3; the level already records
 * their spawn points. Communication with the HUD flows through `this.registry`
 * + its `changedata` events, never direct scene references (see PLAN.md §4).
 */
export class GameScene extends Scene {
    private player!: Player;
    private controller!: InputController;

    constructor() {
        super('Game');
    }

    create() {
        // Classic SMB 1-1 sky blue.
        this.cameras.main.setBackgroundColor('#5c94fc');

        // Build the authored level: static solids + spawn data.
        const level = new TileMapBuilder(this, LEVEL_1_1).build();

        // World + camera share the level bounds, so the camera can't drift past
        // the left edge and Mario can't walk out of the world (PLAN.md §M2).
        // NOTE: Mario still collides with the world's bottom edge, so falling in
        // the pit parks him at the floor for now; the death plane is Milestone 3.
        this.physics.world.setBounds(0, 0, level.pixelWidth, level.pixelHeight);
        this.cameras.main.setBounds(0, 0, level.pixelWidth, level.pixelHeight);

        // Decorative end-of-level marker (non-colliding); flagpole logic is M4+.
        if (level.flagPosition) {
            this.add.image(level.flagPosition.x, level.flagPosition.y, 'flag');
        }

        // Input seam + player. Entities consume PlayerIntent, never raw keys.
        this.controller = new KeyboardController(this);
        this.player = new Player(this, level.playerSpawn.x, level.playerSpawn.y);

        // Mario collides with every solid tile.
        this.physics.add.collider(this.player, level.solids);

        // Camera tracks Mario (roundPixels keeps the pixel-art crisp).
        this.cameras.main.startFollow(this.player, true);

        // HUD overlay runs in parallel on top of this scene.
        this.scene.launch('UI');

        // Release the controller's key registrations when the scene tears down.
        this.events.once('shutdown', () => this.controller.destroy());
    }

    update(_time: number, delta: number) {
        this.controller.update();
        this.player.update(this.controller.intent, delta);
    }
}

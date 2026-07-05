import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE } from '../config/constants';
import { Player } from '../entities/Player';
import { KeyboardController } from '../systems/input/KeyboardController';
import type { InputController } from '../systems/input/InputController';

/**
 * GameScene owns the level: entities, camera, and physics wiring. Milestone 1
 * is a movement sandbox — a temporary floor (the physics world's bottom edge)
 * plus Mario driven through the `InputController` seam. Real level colliders and
 * the camera follow arrive in Milestone 2.
 *
 * Communication with the HUD flows through `this.registry` + its `changedata`
 * events, never direct scene references (see PLAN.md §4).
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

        // Temporary M1 floor: shrink the physics world so its bottom edge sits at
        // the top of a decorative ground strip. Mario collides with the world
        // bounds and rests exactly on top of the visible ground.
        const groundHeight = TILE * 2;
        const floorY = GAME_HEIGHT - groundHeight;
        this.physics.world.setBounds(0, 0, GAME_WIDTH, floorY);

        this.add
            .tileSprite(0, floorY, GAME_WIDTH, groundHeight, 'ground')
            .setOrigin(0, 0);

        // Input seam + player. Entities consume PlayerIntent, never raw keys.
        this.controller = new KeyboardController(this);
        this.player = new Player(this, TILE * 3, floorY - TILE * 3);

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

import { Physics } from 'phaser';
import type { Scene } from 'phaser';
import { TILE, MUSHROOM_SPEED } from '../config/constants';

/** Which power-up this is — decided by the scene when a block is bumped. */
export type PowerUpKind = 'mushroom' | 'fire';

/**
 * A power-up that emerges from a bumped block (PLAN.md §9, Milestone 5).
 *   - mushroom  : rises out, then walks and turns at walls (and can fall off).
 *   - fireFlower : rises out and stays put until collected.
 *
 * The scene owns the effect (grow vs. fire) and collection; this entity only
 * handles emerging + movement.
 */
export class PowerUp extends Physics.Arcade.Sprite {
    readonly kind: PowerUpKind;
    private dir: -1 | 1 = 1;
    private emerged = false;

    constructor(scene: Scene, x: number, y: number, kind: PowerUpKind) {
        super(scene, x, y, kind === 'mushroom' ? 'mushroom' : 'fireFlower');
        this.kind = kind;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Physics.Arcade.Body;
        body.setAllowGravity(false);
        this.setVelocity(0, 0);
        this.setCollideWorldBounds(true);
        // Draw beneath the block so it looks like it slides out from within.
        this.setDepth(1);

        // Rise one tile out of the block, then come alive.
        scene.tweens.add({
            targets: this,
            y: y - TILE,
            duration: 260,
            ease: 'Linear',
            onComplete: () => this.activate(),
        });
    }

    private activate(): void {
        this.emerged = true;
        const body = this.body as Physics.Arcade.Body;
        if (this.kind === 'mushroom') {
            body.setAllowGravity(true);
            this.setVelocityX(MUSHROOM_SPEED * this.dir);
        }
    }

    /** Mushrooms reverse at walls; the fire flower never moves. */
    update(): void {
        if (!this.emerged || this.kind !== 'mushroom') {
            return;
        }
        const body = this.body as Physics.Arcade.Body;
        if (body.blocked.left) {
            this.dir = 1;
        } else if (body.blocked.right) {
            this.dir = -1;
        }
        this.setVelocityX(MUSHROOM_SPEED * this.dir);
    }
}

import { Physics } from 'phaser';
import type { Scene } from 'phaser';
import { GOOMBA_SPEED } from '../config/constants';

/**
 * Goomba. A dynamic body that paces left/right at a constant speed and reverses
 * when it meets a wall or reaches a ledge, so it never walks off a platform (see
 * PLAN.md §9, Milestone 3). It has no knowledge of Mario — the GameScene owns the
 * player↔enemy collider and decides stomp vs. damage from `body.touching`.
 */
export class Goomba extends Physics.Arcade.Sprite {
    /** Facing / travel direction: -1 left, +1 right. Starts walking left. */
    private dir: -1 | 1 = -1;
    /** Once stomped, the Goomba stops colliding and squishes before removal. */
    private dead = false;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'goomba');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Turn around at the world edges too, not just at solid tiles.
        this.setCollideWorldBounds(true);
        this.setVelocityX(GOOMBA_SPEED * this.dir);
    }

    /** True once stomped — the scene skips further hit resolution against it. */
    get isDead(): boolean {
        return this.dead;
    }

    /** Advance one frame: reverse at walls/ledges, then hold patrol speed. */
    update(): void {
        if (this.dead) {
            return;
        }

        const body = this.body as Physics.Arcade.Body;

        if (body.blocked.left) {
            this.dir = 1;
        } else if (body.blocked.right) {
            this.dir = -1;
        } else if (body.blocked.down && this.atLedge(body)) {
            // Grounded but no floor just ahead → about to walk off; turn back.
            this.dir = this.dir === 1 ? -1 : 1;
        }

        this.setVelocityX(GOOMBA_SPEED * this.dir);
    }

    /** Squished by a stomp: freeze, flatten, then remove after a beat. */
    stomp(): void {
        if (this.dead) {
            return;
        }
        this.dead = true;

        const body = this.body as Physics.Arcade.Body;
        body.stop();
        body.enable = false;

        // Flatten onto the ground, then fade out and destroy.
        this.scene.tweens.add({
            targets: this,
            scaleY: 0.4,
            y: this.y + 5,
            duration: 90,
        });
        this.scene.time.delayedCall(350, () => this.destroy());
    }

    /**
     * Ledge probe: is there a solid tile just beyond the leading foot? We sample
     * a tiny rect ahead-and-below the body and ask the physics world for static
     * bodies there. Empty result = ledge ahead, so the Goomba should turn.
     */
    private atLedge(body: Physics.Arcade.Body): boolean {
        const aheadX = this.dir < 0 ? body.left - 1 : body.right + 1;
        const belowY = body.bottom + 2;
        const hits = this.scene.physics.overlapRect(aheadX - 1, belowY - 1, 2, 2, false, true);
        return hits.length === 0;
    }
}

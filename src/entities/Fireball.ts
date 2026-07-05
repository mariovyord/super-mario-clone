import { Physics } from 'phaser';
import type { Scene } from 'phaser';
import { FIREBALL_SPEED } from '../config/constants';

/**
 * A fireball thrown by fire Mario (PLAN.md §9, Milestone 5). It travels
 * horizontally, bounces along the ground under gravity, kills enemies on
 * contact, and bursts when it meets a wall or times out. The scene owns the
 * colliders; the fireball just carries its motion and its own self-destruct.
 */
export class Fireball extends Physics.Arcade.Sprite {
    private spent = false;

    constructor(scene: Scene, x: number, y: number, dir: 1 | -1) {
        super(scene, x, y, 'fireball');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(4);
        this.setVelocityX(FIREBALL_SPEED * dir);
        this.setBounceY(1); // lively bounce along the floor
        this.setCollideWorldBounds(false);

        // Safety net: never let a stray fireball live forever.
        scene.time.delayedCall(2500, () => this.burst());
    }

    /** True once the fireball has been consumed (hit a wall/enemy or timed out). */
    get isSpent(): boolean {
        return this.spent;
    }

    /** Called by the scene's solid collider: burst if we struck a vertical wall. */
    onSolidContact(): void {
        const body = this.body as Physics.Arcade.Body;
        if (body.blocked.left || body.blocked.right) {
            this.burst();
        }
    }

    /** Pop and remove. Safe to call more than once. */
    burst(): void {
        if (this.spent) {
            return;
        }
        this.spent = true;
        const body = this.body as Physics.Arcade.Body;
        body.stop();
        body.enable = false;
        this.scene.tweens.add({
            targets: this,
            scale: 1.8,
            alpha: 0,
            duration: 120,
            onComplete: () => this.destroy(),
        });
    }
}

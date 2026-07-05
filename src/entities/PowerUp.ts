import { Physics } from 'phaser';
import type { Scene } from 'phaser';
import { TILE, MUSHROOM_SPEED } from '../config/constants';

/** Which power-up this is — decided by the scene when a block is bumped. */
export type PowerUpKind = 'mushroom' | 'fire' | 'oneup';

/**
 * A power-up that emerges from a bumped block (PLAN.md §9, Milestones 5 & 7).
 *   - mushroom   : rises out, then walks and turns at walls (and can fall off).
 *   - oneup      : a green 1-up mushroom; moves like a mushroom, grants a life.
 *   - fire       : a fire flower; rises out and stays put until collected.
 *
 * The scene owns the effect (grow / fire / extra life) and collection; this
 * entity only handles emerging + movement. Anything that isn't a fire flower
 * walks, so mushrooms and 1-ups share the same pacing behaviour.
 */
export class PowerUp extends Physics.Arcade.Sprite {
    readonly kind: PowerUpKind;
    private dir: -1 | 1 = 1;
    private emerged = false;

    constructor(scene: Scene, x: number, y: number, kind: PowerUpKind) {
        super(scene, x, y, PowerUp.textureFor(kind));
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
        // Everything but the (stationary) fire flower walks off under gravity.
        if (this.kind !== 'fire') {
            body.setAllowGravity(true);
            this.setVelocityX(MUSHROOM_SPEED * this.dir);
        }
    }

    /** Walking power-ups reverse at walls; the fire flower never moves. */
    update(): void {
        if (!this.emerged || this.kind === 'fire') {
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

    /** Texture key for each kind (mushroom, green 1-up, or fire flower). */
    private static textureFor(kind: PowerUpKind): string {
        if (kind === 'mushroom') return 'mushroom';
        if (kind === 'oneup') return 'mushroom1up';
        return 'fireFlower';
    }
}

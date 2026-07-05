import { Physics } from 'phaser';
import type { Scene } from 'phaser';

/** What a block does when Mario bonks it from below. */
export type BumpResult = 'coin' | 'break' | 'none';

/** Interactive block kinds authored in the level map. */
export type BlockKind = 'question' | 'brick';

/**
 * An interactive block with a static body. Solid like any tile, but it reacts
 * when Mario hits it from underneath (PLAN.md §9, Milestone 4):
 *   - question → yields a coin once, then becomes an inert "used" block.
 *   - brick    → breaks apart if big Mario hits it, otherwise just nudges.
 *
 * The block owns its own visuals/animation; the scene owns scoring + the coin
 * pop, reacting to the `BumpResult` this returns.
 */
export class Block extends Physics.Arcade.Sprite {
    private readonly kind: BlockKind;
    /** A question block yields its coin only once. */
    private spent = false;
    /** Guards the nudge tween so a held bonk can't spam it. */
    private bumping = false;

    constructor(scene: Scene, x: number, y: number, kind: BlockKind) {
        super(scene, x, y, kind === 'question' ? 'question' : 'brick');
        this.kind = kind;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body
    }

    /**
     * Resolve an underside bonk. `bigMario` decides whether a brick breaks.
     * Returns what the scene should reward: a coin, a break, or nothing.
     */
    bump(bigMario: boolean): BumpResult {
        if (this.bumping) {
            return 'none';
        }

        if (this.kind === 'brick') {
            if (bigMario) {
                this.shatter();
                return 'break';
            }
            this.nudge();
            return 'none';
        }

        // Question block.
        if (this.spent) {
            this.nudge();
            return 'none';
        }
        this.spent = true;
        this.setTexture('blockUsed');
        this.nudge();
        return 'coin';
    }

    /** Short vertical bump; the static body stays put (purely cosmetic). */
    private nudge(): void {
        this.bumping = true;
        const restY = this.y;
        this.scene.tweens.add({
            targets: this,
            y: restY - 5,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                this.y = restY;
                this.bumping = false;
            },
        });
    }

    /** Break into four tumbling shards and remove the block. */
    private shatter(): void {
        const offsets: Array<[number, number]> = [
            [-4, -1],
            [4, -1],
            [-4, 1],
            [4, 1],
        ];
        for (const [dx, dy] of offsets) {
            const shard = this.scene.add
                .image(this.x, this.y, 'brick')
                .setScale(0.4)
                .setDepth(5);
            this.scene.tweens.add({
                targets: shard,
                x: this.x + dx * 6,
                y: this.y + dy * 6 - 20,
                angle: 360,
                alpha: 0,
                duration: 520,
                ease: 'Quad.easeIn',
                onComplete: () => shard.destroy(),
            });
        }
        this.destroy();
    }
}

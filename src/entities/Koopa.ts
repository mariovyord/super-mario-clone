import { Physics } from 'phaser';
import type { Scene } from 'phaser';
import {
    TILE,
    KOOPA_SPEED,
    KOOPA_WIDTH,
    KOOPA_HEIGHT,
    SHELL_SPEED,
    SHELL_REVIVE_MS,
    SHELL_WAKE_BLINK_MS,
} from '../config/constants';

/** Koopa lifecycle: pacing → retracted shell → sliding shell (and back). */
export type KoopaState = 'walking' | 'shell' | 'sliding';

/**
 * Koopa Troopa with shell mechanics (PLAN.md §9, Milestone 6). Like a Goomba it
 * paces and turns at walls/ledges, but a stomp doesn't kill it — it retreats
 * into a shell. Touching a still shell kicks it into a fast slide that mows down
 * other enemies; stomping a sliding shell stops it again. Left alone, the shell
 * eventually wakes and the Koopa climbs back out.
 *
 * The Koopa owns its own state machine and visuals; the GameScene owns the
 * colliders and decides bounce/damage/score from `state` + `body.touching`.
 */
export class Koopa extends Physics.Arcade.Sprite {
    private koopaState: KoopaState = 'walking';
    /** Facing / travel direction: -1 left, +1 right. Starts walking left. */
    private dir: -1 | 1 = -1;
    /** Knocked out by a fireball / sliding shell — scheduled for removal. */
    private dead = false;
    /**
     * Brief window (ms) after any state change during which the scene ignores
     * player contact. Stops the kicker from being hurt by the shell it just
     * launched, and stops a just-stopped shell from being instantly re-kicked.
     */
    private graceMs = 0;
    /** Time (ms) a stationary shell has been idle — drives the wake-up revive. */
    private idleMs = 0;

    constructor(scene: Scene, x: number, y: number) {
        // Lift a taller-than-a-tile sprite so its feet land where a 16px entity's
        // would, instead of spawning embedded in the ground.
        super(scene, x, y - (KOOPA_HEIGHT - TILE) / 2, 'koopa');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(KOOPA_WIDTH, KOOPA_HEIGHT);
        this.setCollideWorldBounds(true);
        this.setVelocityX(KOOPA_SPEED * this.dir);
    }

    /** Current lifecycle state — the scene branches its hit resolution on this. */
    get phase(): KoopaState {
        return this.koopaState;
    }

    /** True once knocked out (fireball / sliding shell) — skip further hits. */
    get isDead(): boolean {
        return this.dead;
    }

    /**
     * True during the brief post-transition grace. While set, the scene neither
     * kicks a fresh shell nor lets a sliding shell damage the player.
     */
    get inGrace(): boolean {
        return this.graceMs > 0;
    }

    /** Advance one frame. `delta` (ms) drives the shell's wake-up timer. */
    update(delta: number): void {
        if (this.dead) {
            return;
        }
        if (this.graceMs > 0) {
            this.graceMs = Math.max(0, this.graceMs - delta);
        }

        const body = this.body as Physics.Arcade.Body;

        switch (this.koopaState) {
            case 'walking':
                this.patrol(body);
                break;
            case 'sliding':
                // Ricochet off walls; keep barrelling along at shell speed.
                if (body.blocked.left) {
                    this.dir = 1;
                } else if (body.blocked.right) {
                    this.dir = -1;
                }
                this.setVelocityX(SHELL_SPEED * this.dir);
                break;
            case 'shell':
                this.tickRevive(delta);
                break;
        }
    }

    /** Pace at patrol speed, reversing at walls and before ledges (like a Goomba). */
    private patrol(body: Physics.Arcade.Body): void {
        if (body.blocked.left) {
            this.dir = 1;
        } else if (body.blocked.right) {
            this.dir = -1;
        } else if (body.blocked.down && this.atLedge(body)) {
            this.dir = this.dir === 1 ? -1 : 1;
        }
        this.setFlipX(this.dir === 1);
        this.setVelocityX(KOOPA_SPEED * this.dir);
    }

    /** Count down to waking up; blink a warning, then climb back out as a Koopa. */
    private tickRevive(delta: number): void {
        this.idleMs += delta;
        const remaining = SHELL_REVIVE_MS - this.idleMs;
        if (remaining <= 0) {
            this.wake();
            return;
        }
        // Blink during the final stretch to telegraph the revive.
        this.setAlpha(remaining < SHELL_WAKE_BLINK_MS && Math.floor(this.idleMs / 120) % 2 === 0 ? 0.4 : 1);
    }

    /**
     * Stomped while walking: retract into a stationary shell. The scene still
     * bounces Mario and scores; here we just change form.
     */
    stompToShell(): void {
        if (this.koopaState !== 'walking') {
            return;
        }
        this.enterShell();
    }

    /** Stomped while sliding: halt back into a stationary shell. */
    stopShell(): void {
        if (this.koopaState !== 'sliding') {
            return;
        }
        this.enterShell();
    }

    /** Shared transition into the idle shell form (feet kept planted). */
    private enterShell(): void {
        this.koopaState = 'shell';
        this.idleMs = 0;
        this.graceMs = 200;
        const body = this.body as Physics.Arcade.Body;
        body.setVelocityX(0);
        this.morph('shell', TILE, TILE);
        this.setFlipX(false);
    }

    /**
     * Kick a stationary shell into a slide, away from `fromX` (the toucher).
     * Returns false if the shell isn't idle (nothing to kick).
     */
    kick(fromX: number): boolean {
        if (this.koopaState !== 'shell') {
            return false;
        }
        this.koopaState = 'sliding';
        this.dir = fromX <= this.x ? 1 : -1;
        this.graceMs = 150;
        this.setVelocityX(SHELL_SPEED * this.dir);
        return true;
    }

    /** Shell wakes and the Koopa walks again (feet kept planted). */
    private wake(): void {
        this.koopaState = 'walking';
        this.idleMs = 0;
        this.graceMs = 150;
        this.setAlpha(1);
        this.morph('koopa', KOOPA_WIDTH, KOOPA_HEIGHT);
        this.dir = -1;
        this.setVelocityX(KOOPA_SPEED * this.dir);
    }

    /** Knocked out by a fireball or a sliding shell: flip over and tumble away. */
    knockOut(dir: 1 | -1): void {
        if (this.dead) {
            return;
        }
        this.dead = true;
        const body = this.body as Physics.Arcade.Body;
        body.checkCollision.none = true;
        this.setFlipY(true);
        this.setVelocity(40 * dir, -180);
        this.scene.time.delayedCall(800, () => this.destroy());
    }

    /** Swap texture + body height while keeping the feet on the ground. */
    private morph(texture: string, width: number, height: number): void {
        const body = this.body as Physics.Arcade.Body;
        const feet = body.bottom;
        this.setTexture(texture);
        body.setSize(width, height);
        this.y = feet - height / 2;
    }

    /** Ledge probe: no solid tile just beyond the leading foot → turn back. */
    private atLedge(body: Physics.Arcade.Body): boolean {
        const aheadX = this.dir < 0 ? body.left - 1 : body.right + 1;
        const belowY = body.bottom + 2;
        const hits = this.scene.physics.overlapRect(aheadX - 1, belowY - 1, 2, 2, false, true);
        return hits.length === 0;
    }
}

import { Physics } from 'phaser';
import type { Scene } from 'phaser';
import type { PlayerIntent } from '../systems/input/PlayerIntent';
import {
    WALK_SPEED,
    RUN_SPEED,
    ACCEL,
    FRICTION,
    MAX_FALL_SPEED,
    JUMP_VELOCITY,
    JUMP_CUT,
    COYOTE_MS,
    JUMP_BUFFER_MS,
    STOMP_BOUNCE,
    DEATH_HOP,
    BIG_WIDTH,
    BIG_HEIGHT,
    INVINCIBLE_MS,
} from '../config/constants';

/** Mario's power state: small → big → fire, walked back on damage. */
export type PowerState = 'small' | 'big' | 'fire';

/**
 * Mario. Consumes a `PlayerIntent` each frame and never reads input directly
 * (see PLAN.md §4). Movement uses Arcade acceleration + drag with a capped max
 * velocity for momentum; the jump adds the three things that make a platformer
 * feel good:
 *   - variable height  — releasing jump while rising cuts the upward velocity
 *   - coyote time      — a jump still registers briefly after leaving a ledge
 *   - jump buffering   — a jump pressed just before landing still fires
 */
export class Player extends Physics.Arcade.Sprite {
    /** Time left (ms) during which a jump still counts after leaving the ground. */
    private coyoteMs = 0;
    /** Time left (ms) during which a buffered jump press stays valid. */
    private jumpBufferMs = 0;
    /** Guards the variable-height cut so it fires at most once per jump. */
    private cutApplied = false;
    /** Once dead, Mario ignores input and plays out the death hop. */
    private dead = false;
    /** Current power form. */
    private power: PowerState = 'small';
    /** Remaining invulnerability after a hit (ms); Mario blinks while > 0. */
    private invincibleMs = 0;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'mario');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        // Drag only takes effect when accelerationX is 0 (Arcade rule), so it acts
        // purely as stopping friction. Vertical cap must exceed |JUMP_VELOCITY|.
        this.setDragX(FRICTION);
        this.setMaxVelocity(WALK_SPEED, MAX_FALL_SPEED);
    }

    /**
     * Advance the player one frame from the sampled intent.
     * @param intent normalized input for this frame
     * @param delta  frame delta in ms (drives the coyote / buffer timers)
     */
    update(intent: PlayerIntent, delta: number): void {
        const body = this.body as Physics.Arcade.Body;
        // Dead Mario is on rails: skip all input-driven movement.
        if (this.dead) {
            return;
        }
        const onGround = body.blocked.down || body.touching.down;

        // --- Horizontal movement ---
        // Accelerate toward the input direction; cap top speed by walk/run.
        const maxSpeed = intent.run ? RUN_SPEED : WALK_SPEED;
        this.setMaxVelocity(maxSpeed, MAX_FALL_SPEED);

        if (intent.moveX !== 0) {
            this.setAccelerationX(intent.moveX * ACCEL);
            this.setFlipX(intent.moveX < 0);
        } else {
            this.setAccelerationX(0);
        }
        // Friction only on the ground; in the air momentum is preserved (Mario-like).
        this.setDragX(onGround ? FRICTION : 0);

        // --- Jump timers ---
        this.coyoteMs = onGround ? COYOTE_MS : Math.max(0, this.coyoteMs - delta);
        this.jumpBufferMs = intent.jumpPressed
            ? JUMP_BUFFER_MS
            : Math.max(0, this.jumpBufferMs - delta);

        // --- Jump: a buffered press that meets a (recent) grounded state fires ---
        if (this.jumpBufferMs > 0 && this.coyoteMs > 0) {
            this.setVelocityY(JUMP_VELOCITY);
            this.jumpBufferMs = 0;
            this.coyoteMs = 0;
            this.cutApplied = false;
        }

        // --- Variable height: releasing jump while still rising cuts the ascent ---
        if (!this.cutApplied && !intent.jumpHeld && body.velocity.y < 0) {
            this.setVelocityY(body.velocity.y * JUMP_CUT);
            this.cutApplied = true;
        }
        if (onGround) {
            this.cutApplied = false;
        }

        // --- Invulnerability blink after a hit ---
        if (this.invincibleMs > 0) {
            this.invincibleMs -= delta;
            this.setAlpha(Math.floor(this.invincibleMs / 70) % 2 === 0 ? 1 : 0.35);
            if (this.invincibleMs <= 0) {
                this.setAlpha(1);
            }
        }
    }

    /** True once Mario has died (drives the scene's reset timing). */
    get isDead(): boolean {
        return this.dead;
    }

    /** Whether Mario is in his big form — drives brick-breaking. */
    get isBig(): boolean {
        return this.power !== 'small';
    }

    /** Whether Mario can shoot fireballs. */
    get isFire(): boolean {
        return this.power === 'fire';
    }

    /** Facing direction from the sprite flip: +1 right, -1 left. */
    get facing(): 1 | -1 {
        return this.flipX ? -1 : 1;
    }

    /** Grow small → big (a mushroom). Already-big Mario is unaffected. */
    grow(): void {
        if (this.power !== 'small') {
            return;
        }
        this.power = 'big';
        this.morph('marioBig', BIG_WIDTH, BIG_HEIGHT);
    }

    /** Upgrade to fire form (a fire flower), enlarging if still small. */
    upgradeToFire(): void {
        this.power = 'fire';
        this.morph('marioFire', BIG_WIDTH, BIG_HEIGHT);
    }

    /**
     * Take a hit. Big/fire Mario shrinks to small and gets brief invulnerability;
     * small Mario returns `true` to tell the scene he should die. Hits during the
     * invulnerability window are ignored.
     */
    damage(): boolean {
        if (this.dead || this.invincibleMs > 0) {
            return false;
        }
        if (this.power === 'small') {
            return true;
        }
        this.power = 'small';
        this.morph('mario', 16, 16);
        this.invincibleMs = INVINCIBLE_MS;
        return false;
    }

    /**
     * Swap texture + body size while keeping Mario's feet planted (so growing
     * pushes his head up, not his feet down through the floor).
     */
    private morph(texture: string, width: number, height: number): void {
        const body = this.body as Physics.Arcade.Body;
        const feet = body.bottom;
        this.setTexture(texture);
        body.setSize(width, height);
        // With origin 0.5 and a centered body, feet = y + height/2.
        this.y = feet - height / 2;
        this.setAlpha(1);
    }

    /** Little upward hop after stomping an enemy. */
    bounce(): void {
        this.setVelocityY(STOMP_BOUNCE);
    }

    /**
     * Kill Mario: pop up, then let gravity pull him down through the world (we
     * turn off his collisions so he falls past the floor/pit off-screen). The
     * scene schedules the level reset; here we only play out the death motion.
     */
    kill(): void {
        if (this.dead) {
            return;
        }
        this.dead = true;
        const body = this.body as Physics.Arcade.Body;
        this.setAcceleration(0, 0);
        this.setVelocity(0, DEATH_HOP);
        body.checkCollision.none = true;
        this.setCollideWorldBounds(false);
    }
}

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
} from '../config/constants';

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
    }
}

import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { Goomba } from '../entities/Goomba';
import { Block } from '../entities/Block';
import { KeyboardController } from '../systems/input/KeyboardController';
import type { InputController } from '../systems/input/InputController';
import { LEVEL_1_1 } from '../level/level-1-1';
import { TileMapBuilder } from '../level/TileMapBuilder';
import {
    TILE,
    STOMP_SCORE,
    COIN_SCORE,
    BRICK_SCORE,
    RESPAWN_DELAY_MS,
} from '../config/constants';

/**
 * GameScene owns the level: it builds the tilemap colliders, spawns Mario, the
 * enemies and coins, wires up physics, and runs the scrolling camera.
 *
 * Milestone 3 adds the interactions that complete the MVP: Goombas that get
 * stomped (or kill Mario on a side hit), collectible coins, a pit death plane,
 * and death → level reset. Score/coins live in `this.registry`; the HUD (UIScene)
 * reacts to its `changedata` events, so the two scenes stay decoupled (PLAN §4).
 */
export class GameScene extends Scene {
    private player!: Player;
    private controller!: InputController;
    private goombas!: Phaser.GameObjects.Group;
    /** Y below which Mario is considered fallen into a pit (level floor line). */
    private deathY = 0;
    /** True while the death → reset sequence is playing (blocks re-triggering). */
    private resetting = false;

    constructor() {
        super('Game');
    }

    create() {
        this.resetting = false;

        // HUD state: reset each (re)start so a death restarts the run cleanly.
        this.registry.set('score', 0);
        this.registry.set('coins', 0);

        // Classic SMB 1-1 sky blue.
        this.cameras.main.setBackgroundColor('#5c94fc');

        // Build the authored level: static solids + spawn data.
        const level = new TileMapBuilder(this, LEVEL_1_1).build();

        // The camera is clamped to the level, but the physics world extends below
        // it so Mario can actually fall *through* a pit (rather than parking on
        // the world floor). Crossing `deathY` triggers a pit death.
        this.deathY = level.pixelHeight;
        this.physics.world.setBounds(0, 0, level.pixelWidth, level.pixelHeight + 6 * TILE);
        this.cameras.main.setBounds(0, 0, level.pixelWidth, level.pixelHeight);

        // Decorative end-of-level marker (non-colliding); flagpole logic is later.
        if (level.flagPosition) {
            this.add.image(level.flagPosition.x, level.flagPosition.y, 'flag');
        }

        // Input seam + player. Entities consume PlayerIntent, never raw keys.
        this.controller = new KeyboardController(this);
        this.player = new Player(this, level.playerSpawn.x, level.playerSpawn.y);

        // Enemies: one Goomba per spawn, held in a group for batch colliders.
        this.goombas = this.add.group();
        for (const spawn of level.goombaSpawns) {
            this.goombas.add(new Goomba(this, spawn.x, spawn.y));
        }

        // Interactive blocks (question + brick): solid, but bump-reactive.
        const blocks = this.add.group();
        for (const spawn of level.questionSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'question'));
        }
        for (const spawn of level.brickSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'brick'));
        }

        // Coins: static bodies we only ever overlap-test (never separate).
        const coins = this.physics.add.staticGroup();
        for (const spawn of level.coinSpawns) {
            coins.create(spawn.x, spawn.y, 'coin');
        }

        // --- Colliders / overlaps (registered once) ---
        this.physics.add.collider(this.player, level.solids);
        this.physics.add.collider(this.goombas, level.solids);
        this.physics.add.collider(this.goombas, blocks);
        this.physics.add.overlap(this.player, coins, this.onCollectCoin, undefined, this);
        this.physics.add.collider(this.player, blocks, this.onPlayerHitBlock, undefined, this);
        this.physics.add.collider(
            this.player,
            this.goombas,
            this.onPlayerHitGoomba,
            undefined,
            this,
        );

        // Camera tracks Mario (roundPixels keeps the pixel-art crisp).
        this.cameras.main.startFollow(this.player, true);

        // HUD overlay runs in parallel on top of this scene.
        if (!this.scene.isActive('UI')) {
            this.scene.launch('UI');
        }

        // Release the controller's key registrations when the scene tears down.
        this.events.once('shutdown', () => this.controller.destroy());
    }

    update(_time: number, delta: number) {
        if (this.resetting) {
            return;
        }

        this.controller.update();
        this.player.update(this.controller.intent, delta);

        for (const goomba of this.goombas.getChildren()) {
            (goomba as Goomba).update();
        }

        // Pit death plane: fell below the level floor with no ground to catch him.
        if (this.player.y > this.deathY) {
            this.killPlayer();
        }
    }

    /** Coin pickup: remove the coin, bump score + coin count. */
    private onCollectCoin: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, coinObj) => {
        const coin = coinObj as Phaser.Physics.Arcade.Sprite;
        coin.disableBody(true, true);
        this.collectCoin();
    };

    /**
     * Player↔block: only an underside bonk (`touching.up`) counts. A question
     * block yields a coin (which pops out of the top); a brick may shatter.
     */
    private onPlayerHitBlock: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        playerObj,
        blockObj,
    ) => {
        const player = playerObj as Player;
        const block = blockObj as Block;
        const pBody = player.body as Phaser.Physics.Arcade.Body;
        if (!pBody.touching.up) {
            return;
        }

        const result = block.bump(player.isBig);
        if (result === 'coin') {
            this.popCoin(block.x, block.y);
            this.collectCoin();
        } else if (result === 'break') {
            this.addScore(BRICK_SCORE);
        }
    };

    /** A coin bursting out of a bumped block: arcs up over the block, then pops. */
    private popCoin(x: number, y: number): void {
        const coin = this.add.image(x, y - TILE, 'coin').setDepth(5);
        this.tweens.add({
            targets: coin,
            y: y - TILE * 2,
            duration: 160,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => coin.destroy(),
        });
    }

    /** Award one coin (score + counter) — shared by pickups and bumped blocks. */
    private collectCoin(): void {
        this.addScore(COIN_SCORE);
        this.registry.set('coins', (this.registry.get('coins') as number) + 1);
    }

    /**
     * Player↔Goomba resolution. A stomp is "Mario moving down onto the Goomba's
     * top" — classified from `body.touching`, never a bare overlap (PLAN §4/§10).
     * Anything else is a side hit and kills Mario.
     */
    private onPlayerHitGoomba: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        playerObj,
        goombaObj,
    ) => {
        const player = playerObj as Player;
        const goomba = goombaObj as Goomba;
        if (goomba.isDead || player.isDead) {
            return;
        }

        const pBody = player.body as Phaser.Physics.Arcade.Body;
        const gBody = goomba.body as Phaser.Physics.Arcade.Body;

        if (pBody.touching.down && gBody.touching.up) {
            goomba.stomp();
            player.bounce();
            this.addScore(STOMP_SCORE);
        } else {
            this.killPlayer();
        }
    };

    private addScore(points: number): void {
        this.registry.set('score', (this.registry.get('score') as number) + points);
    }

    /** Play the death hop, then restart the level after a short beat. */
    private killPlayer(): void {
        if (this.resetting) {
            return;
        }
        this.resetting = true;
        this.player.kill();
        this.cameras.main.stopFollow();
        this.time.delayedCall(RESPAWN_DELAY_MS, () => this.scene.restart());
    }
}

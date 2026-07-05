import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { Goomba } from '../entities/Goomba';
import { Koopa } from '../entities/Koopa';
import { Block } from '../entities/Block';
import type { BumpResult } from '../entities/Block';
import { PowerUp } from '../entities/PowerUp';
import { Fireball } from '../entities/Fireball';
import { KeyboardController } from '../systems/input/KeyboardController';
import type { InputController } from '../systems/input/InputController';
import { LEVEL_1_1 } from '../level/level-1-1';
import { TileMapBuilder } from '../level/TileMapBuilder';
import {
    TILE,
    STOMP_SCORE,
    COIN_SCORE,
    BRICK_SCORE,
    POWERUP_SCORE,
    SHELL_KICK_SCORE,
    FIREBALL_MAX,
    RESPAWN_DELAY_MS,
} from '../config/constants';

/**
 * GameScene owns the level: it builds the tilemap colliders, spawns Mario, the
 * enemies, blocks, coins and power-ups, wires up physics, and runs the camera.
 *
 * Milestone 5 adds power states: bumping a power-up block yields a mushroom
 * (grow) or a fire flower (shoot fireballs); taking a hit shrinks big/fire Mario
 * instead of killing him. Milestone 6 adds Koopas with kickable shells. Score
 * and coins live in `this.registry`; the HUD reacts to its `changedata` events,
 * so the scenes stay decoupled (PLAN §4).
 */
export class GameScene extends Scene {
    private player!: Player;
    private controller!: InputController;
    private goombas!: Phaser.GameObjects.Group;
    private koopas!: Phaser.GameObjects.Group;
    private powerups!: Phaser.GameObjects.Group;
    private fireballs!: Phaser.GameObjects.Group;
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

        // Koopas: pace like Goombas but retreat into kickable shells (M6).
        this.koopas = this.add.group();
        for (const spawn of level.koopaSpawns) {
            this.koopas.add(new Koopa(this, spawn.x, spawn.y));
        }

        // Interactive blocks (question + power-up + brick): solid, bump-reactive.
        const blocks = this.add.group();
        for (const spawn of level.questionSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'question'));
        }
        for (const spawn of level.powerupSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'powerup'));
        }
        for (const spawn of level.brickSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'brick'));
        }

        // Coins: static bodies we only ever overlap-test (never separate).
        const coins = this.physics.add.staticGroup();
        for (const spawn of level.coinSpawns) {
            coins.create(spawn.x, spawn.y, 'coin');
        }

        // Power-ups and fireballs are spawned dynamically; start empty.
        this.powerups = this.add.group();
        this.fireballs = this.add.group();

        // --- Colliders / overlaps (registered once) ---
        this.physics.add.collider(this.player, level.solids);
        this.physics.add.collider(this.player, blocks, this.onPlayerHitBlock, undefined, this);
        this.physics.add.collider(this.goombas, level.solids);
        this.physics.add.collider(this.goombas, blocks);
        this.physics.add.collider(this.koopas, level.solids);
        this.physics.add.collider(this.koopas, blocks, this.onKoopaHitBlock, undefined, this);
        this.physics.add.collider(this.powerups, level.solids);
        this.physics.add.collider(this.powerups, blocks);
        this.physics.add.collider(this.fireballs, level.solids, this.onFireballSolid, undefined, this);
        this.physics.add.collider(this.fireballs, blocks, this.onFireballSolid, undefined, this);

        this.physics.add.overlap(this.player, coins, this.onCollectCoin, undefined, this);
        this.physics.add.overlap(this.player, this.powerups, this.onCollectPowerUp, undefined, this);
        this.physics.add.overlap(this.player, this.goombas, this.onPlayerHitGoomba, undefined, this);
        this.physics.add.overlap(this.player, this.koopas, this.onPlayerHitKoopa, undefined, this);
        this.physics.add.overlap(this.fireballs, this.goombas, this.onFireballHitGoomba, undefined, this);
        this.physics.add.overlap(this.fireballs, this.koopas, this.onFireballHitKoopa, undefined, this);
        // A sliding shell mows down Goombas it runs into.
        this.physics.add.overlap(this.koopas, this.goombas, this.onShellHitGoomba, undefined, this);

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

        if (this.controller.intent.firePressed) {
            this.tryShootFireball();
        }

        for (const goomba of this.goombas.getChildren()) {
            (goomba as Goomba).update();
        }
        for (const koopa of this.koopas.getChildren()) {
            (koopa as Koopa).update(delta);
        }
        for (const powerup of this.powerups.getChildren()) {
            (powerup as PowerUp).update();
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

    /** Power-up pickup: mushrooms grow Mario, fire flowers arm his fireballs. */
    private onCollectPowerUp: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        _player,
        powerupObj,
    ) => {
        const powerup = powerupObj as PowerUp;
        if (powerup.kind === 'mushroom') {
            this.player.grow();
        } else {
            this.player.upgradeToFire();
        }
        powerup.destroy();
        this.addScore(POWERUP_SCORE);
    };

    /**
     * Player↔block: only an underside bonk (`touching.up`) counts. Question
     * blocks yield a coin, power-up blocks yield an item, bricks may shatter.
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
        this.rewardBlockBump(block, block.bump(player.isBig));
    };

    /**
     * Sliding shell↔block: a kicked shell that slams a block from the side
     * bumps it just like Mario would (and breaks bricks, since a shell is
     * "strong"). Shells rolling along the tops of blocks are ignored.
     */
    private onKoopaHitBlock: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        koopaObj,
        blockObj,
    ) => {
        const koopa = koopaObj as Koopa;
        if (koopa.phase !== 'sliding') {
            return;
        }
        const kBody = koopa.body as Phaser.Physics.Arcade.Body;
        if (!kBody.touching.left && !kBody.touching.right) {
            return;
        }
        this.rewardBlockBump(blockObj as Block, (blockObj as Block).bump(true));
    };

    /** Apply the reward from a bumped block (shared by Mario and shell bumps). */
    private rewardBlockBump(block: Block, result: BumpResult): void {
        if (result === 'coin') {
            this.popCoin(block.x, block.y);
            this.collectCoin();
        } else if (result === 'powerup') {
            this.spawnPowerUp(block.x, block.y);
        } else if (result === 'break') {
            this.addScore(BRICK_SCORE);
        }
    }

    /**
     * Player↔Goomba resolution. A stomp is "Mario moving down onto the Goomba's
     * top" — classified from `body.touching`, never a bare overlap (PLAN §4/§10).
     * A side hit damages Mario (shrinks big/fire, kills small).
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
        } else if (player.damage()) {
            this.killPlayer();
        }
    };

    /**
     * Player↔Koopa resolution, branching on the shell state machine (PLAN §9,
     * M6). Walking: stomp → retreat into a shell (+bounce/score), side → damage.
     * Idle shell: any touch kicks it into a slide (+bounce if stomped), no harm.
     * Sliding shell: stomp → stop it (+bounce), side → damage. A brief post-hit
     * grace (`inGrace`) stops the kicker from being hurt by its own shell.
     */
    private onPlayerHitKoopa: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        playerObj,
        koopaObj,
    ) => {
        const player = playerObj as Player;
        const koopa = koopaObj as Koopa;
        if (koopa.isDead || player.isDead) {
            return;
        }

        const pBody = player.body as Phaser.Physics.Arcade.Body;
        const kBody = koopa.body as Phaser.Physics.Arcade.Body;
        const stomp = pBody.touching.down && kBody.touching.up;

        switch (koopa.phase) {
            case 'walking':
                if (stomp) {
                    koopa.stompToShell();
                    player.bounce();
                    this.addScore(STOMP_SCORE);
                } else if (player.damage()) {
                    this.killPlayer();
                }
                break;

            case 'shell':
                if (koopa.inGrace) {
                    break; // just stopped under Mario — don't instantly re-kick.
                }
                if (koopa.kick(player.x)) {
                    if (stomp) {
                        player.bounce();
                    }
                    this.addScore(SHELL_KICK_SCORE);
                }
                break;

            case 'sliding':
                if (stomp) {
                    koopa.stopShell();
                    player.bounce();
                } else if (!koopa.inGrace && player.damage()) {
                    this.killPlayer();
                }
                break;
        }
    };

    /** Fireball hit a solid: burst only if it struck a vertical wall. */
    private onFireballSolid: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (fireballObj) => {
        (fireballObj as Fireball).onSolidContact();
    };

    /** Fireball hit a Goomba: knock it out and consume the fireball. */
    private onFireballHitGoomba: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        fireballObj,
        goombaObj,
    ) => {
        const fireball = fireballObj as Fireball;
        const goomba = goombaObj as Goomba;
        if (fireball.isSpent || goomba.isDead) {
            return;
        }
        const fBody = fireball.body as Phaser.Physics.Arcade.Body;
        goomba.knockOut(fBody.velocity.x < 0 ? -1 : 1);
        fireball.burst();
        this.addScore(STOMP_SCORE);
    };

    /** Fireball hit a Koopa (in any form): knock it out, consume the fireball. */
    private onFireballHitKoopa: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        fireballObj,
        koopaObj,
    ) => {
        const fireball = fireballObj as Fireball;
        const koopa = koopaObj as Koopa;
        if (fireball.isSpent || koopa.isDead) {
            return;
        }
        const fBody = fireball.body as Phaser.Physics.Arcade.Body;
        koopa.knockOut(fBody.velocity.x < 0 ? -1 : 1);
        fireball.burst();
        this.addScore(STOMP_SCORE);
    };

    /** Sliding shell ran over a Goomba: knock the Goomba out. Shells only. */
    private onShellHitGoomba: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        koopaObj,
        goombaObj,
    ) => {
        const koopa = koopaObj as Koopa;
        const goomba = goombaObj as Goomba;
        if (koopa.phase !== 'sliding' || koopa.isDead || goomba.isDead) {
            return;
        }
        const kBody = koopa.body as Phaser.Physics.Arcade.Body;
        goomba.knockOut(kBody.velocity.x < 0 ? -1 : 1);
        this.addScore(STOMP_SCORE);
    };

    /** Spawn a power-up from a bumped block: mushroom if small, else fire flower. */
    private spawnPowerUp(x: number, y: number): void {
        const kind = this.player.isBig ? 'fire' : 'mushroom';
        this.powerups.add(new PowerUp(this, x, y, kind));
    }

    /** Fire Mario shoots, capped at FIREBALL_MAX live fireballs. */
    private tryShootFireball(): void {
        if (!this.player.isFire || this.player.isDead) {
            return;
        }
        if (this.fireballs.countActive(true) >= FIREBALL_MAX) {
            return;
        }
        const dir = this.player.facing;
        this.fireballs.add(new Fireball(this, this.player.x + dir * 8, this.player.y, dir));
    }

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

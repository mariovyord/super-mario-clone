import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { Goomba } from '../entities/Goomba';
import { Koopa } from '../entities/Koopa';
import { Block } from '../entities/Block';
import type { BumpResult } from '../entities/Block';
import { PowerUp } from '../entities/PowerUp';
import { Fireball } from '../entities/Fireball';
import { KeyboardController } from '../systems/input/KeyboardController';
import { CompositeController } from '../systems/input/CompositeController';
import { TouchController } from '../systems/input/TouchController';
import type { InputController } from '../systems/input/InputController';
import { getAudio } from '../systems/audio/AudioBus';
import { LEVELS } from '../level/levels';
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
    START_LIVES,
    START_TIME,
    TIME_TICK_MS,
    TIME_BONUS,
    COINS_PER_1UP,
} from '../config/constants';

/**
 * GameScene owns the level: it builds the tilemap colliders, spawns Mario, the
 * enemies, blocks, coins and power-ups, wires up physics, and runs the camera.
 *
 * Milestone 5 adds power states: bumping a power-up block yields a mushroom
 * (grow) or a fire flower (shoot fireballs); taking a hit shrinks big/fire Mario
 * instead of killing him. Milestone 6 adds Koopas with kickable shells.
 * Milestone 7 adds the countdown timer, lives + 1-UPs, and the flagpole →
 * castle level-complete sequence. Score, coins, lives and time live in
 * `this.registry`; the HUD reacts to its `changedata` events, so the scenes
 * stay decoupled (PLAN §4).
 */
export class GameScene extends Scene {
    private player!: Player;
    private controller!: InputController;
    private goombas!: Phaser.GameObjects.Group;
    private koopas!: Phaser.GameObjects.Group;
    private powerups!: Phaser.GameObjects.Group;
    private fireballs!: Phaser.GameObjects.Group;
    /** Interactive bump-reactive blocks (question / power-up / 1-up / brick). */
    private blocks!: Phaser.GameObjects.Group;
    /** Y below which Mario is considered fallen into a pit (level floor line). */
    private deathY = 0;
    /** True while the death → reset sequence is playing (blocks re-triggering). */
    private resetting = false;
    /** True once Mario grabs the flagpole — freezes the world for the cutscene. */
    private levelComplete = false;
    /** Accumulates real time to drive the SMB-style game-time countdown. */
    private timeAccumMs = 0;
    /** Flagpole x, castle x, and the ground surface y — used by the end cutscene. */
    private flagX = 0;
    private castleX = 0;
    private groundSurfaceY = 0;
    /** The pennant on the flagpole — slides down with Mario during the cutscene. */
    private flagPennant?: Phaser.GameObjects.Image;
    /** The centred overlay message (LEVEL COMPLETE! / GAME OVER / …), if shown. */
    private banner?: Phaser.GameObjects.Text;
    /** Shared procedural audio engine (Milestone 8). */
    private readonly audio = getAudio();

    constructor() {
        super('Game');
    }

    create() {
        this.resetting = false;
        this.levelComplete = false;
        this.timeAccumMs = 0;
        // Cleared on every (re)build so a flag-less course can't inherit a stale
        // (destroyed) reference across a scene.restart().
        this.flagPennant = undefined;
        this.banner = undefined;

        // Persistent run state (score, coins, lives, level) survives death
        // restarts — it lives in the registry, so we only seed it on the very
        // first boot. The per-attempt countdown timer resets on every (re)start.
        if (this.registry.get('lives') === undefined) {
            this.registry.set('score', 0);
            this.registry.set('coins', 0);
            this.registry.set('lives', START_LIVES);
            this.registry.set('levelIndex', 0);
        }
        this.registry.set('time', START_TIME);

        // Pick the current course from the progression index. A death restart
        // keeps the same index (retry); the flagpole advances it (levelCleared).
        const index = this.registry.get('levelIndex') as number;
        const def = LEVELS[index];
        this.registry.set('world', def.name); // HUD + title read this label.

        // Per-level sky colour (defaults to the classic SMB 1-1 blue).
        this.cameras.main.setBackgroundColor(def.backgroundColor ?? '#5c94fc');

        // Build the authored level: static solids + spawn data.
        const level = new TileMapBuilder(this, def.rows).build();

        // The camera is clamped to the level, but the physics world extends below
        // it so Mario can actually fall *through* a pit (rather than parking on
        // the world floor). Crossing `deathY` triggers a pit death.
        this.deathY = level.pixelHeight;
        this.physics.world.setBounds(0, 0, level.pixelWidth, level.pixelHeight + 6 * TILE);
        this.cameras.main.setBounds(0, 0, level.pixelWidth, level.pixelHeight);
        // Top surface of the two-row ground strip — where the cutscene lands Mario.
        this.groundSurfaceY = level.pixelHeight - 2 * TILE;

        // Input seam + player. Entities consume PlayerIntent, never raw keys.
        // On touch devices, keyboard and on-screen controls drive Mario at once
        // (PLAN §12) — both feed one merged PlayerIntent, so this stays additive.
        const useTouch = this.sys.game.device.input.touch;
        this.controller = useTouch
            ? new CompositeController([new KeyboardController(this), new TouchController()])
            : new KeyboardController(this);
        this.player = new Player(this, level.playerSpawn.x, level.playerSpawn.y);
        // Player signals its own jumps; the scene owns the sfx (Player stays audio-free).
        this.player.on('jump', () => this.audio.play('jump'));

        // End-of-level flagpole (with its trigger) and castle backdrop.
        if (level.flagPosition) {
            this.setupFlagpole(level.flagPosition);
        }
        if (level.castlePosition) {
            this.setupCastle(level.castlePosition);
        }

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

        // Interactive blocks (question + power-up + 1-up + brick): solid,
        // bump-reactive. Power-up/1-up blocks look like plain question blocks.
        const blocks = this.add.group();
        this.blocks = blocks;
        for (const spawn of level.questionSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'question'));
        }
        for (const spawn of level.powerupSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'powerup'));
        }
        for (const spawn of level.oneupSpawns) {
            blocks.add(new Block(this, spawn.x, spawn.y, 'oneup'));
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

        // On touch devices, raise the on-screen controls overlay next to the HUD.
        if (useTouch && !this.scene.isActive('Touch')) {
            this.scene.launch('Touch');
        }

        // Pause on P / ESC: overlay the Pause scene and freeze this one. The
        // Pause scene owns "resume", so a frozen GameScene needn't keep polling.
        this.input.keyboard?.on('keydown-P', this.pauseGame, this);
        this.input.keyboard?.on('keydown-ESC', this.pauseGame, this);

        // Kick off the looping background tune (idempotent if already playing).
        this.audio.startMusic();

        // Release the controller's keys and hush the music when the scene tears down.
        this.events.once('shutdown', () => {
            this.controller.destroy();
            this.audio.stopMusic();
        });
    }

    /** Freeze the level and raise the pause overlay (P / ESC). */
    private pauseGame(): void {
        if (this.levelComplete || this.resetting) {
            return;
        }
        this.audio.play('pause');
        this.audio.stopMusic();
        this.scene.launch('Pause');
        this.scene.pause();
    }

    update(_time: number, delta: number) {
        // During the death reset or the flagpole cutscene, tweens run but the
        // world is frozen (no input, AI, or timer).
        if (this.resetting || this.levelComplete) {
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

        this.tickTimer(delta);

        // Pit death plane: fell below the level floor with no ground to catch him.
        if (this.player.y > this.deathY) {
            this.killPlayer();
        }
    }

    /** Count the SMB game-timer down in real time; hitting zero is fatal. */
    private tickTimer(delta: number): void {
        this.timeAccumMs += delta;
        if (this.timeAccumMs < TIME_TICK_MS) {
            return;
        }
        this.timeAccumMs -= TIME_TICK_MS;
        const remaining = (this.registry.get('time') as number) - 1;
        this.registry.set('time', Math.max(0, remaining));
        if (remaining <= 0) {
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
     * Power-up pickup: mushrooms grow Mario, fire flowers arm his fireballs,
     * and a green 1-up mushroom grants an extra life.
     */
    private onCollectPowerUp: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        _player,
        powerupObj,
    ) => {
        const powerup = powerupObj as PowerUp;
        if (powerup.kind === 'oneup') {
            this.grantOneUp(powerup.x, powerup.y);
        } else if (powerup.kind === 'mushroom') {
            this.audio.play('powerup');
            this.player.grow();
            this.addScore(POWERUP_SCORE);
        } else {
            this.audio.play('powerup');
            this.player.upgradeToFire();
            this.addScore(POWERUP_SCORE);
        }
        powerup.destroy();
    };

    /**
     * Player↔block: only an underside bonk (`touching.up`) counts. Question
     * blocks yield a coin, power-up blocks yield an item, bricks may shatter.
     *
     * A run of adjacent blocks is one continuous ceiling, and Arcade separates
     * Mario against whichever block comes first in the group. Because blocks are
     * grouped by kind, that is often a neighbour rather than the one over his
     * head — which made a power-up block flanked by question blocks (`B?U?B`)
     * unreachable. So we redirect the bonk to the block above his head centre.
     */
    private onPlayerHitBlock: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
        playerObj,
        blockObj,
    ) => {
        const player = playerObj as Player;
        const pBody = player.body as Phaser.Physics.Arcade.Body;
        if (!pBody.touching.up) {
            return;
        }
        const block = this.blockOverHead(pBody) ?? (blockObj as Block);
        this.audio.play('bump');
        this.rewardBlockBump(block, block.bump(player.isBig));
    };

    /**
     * The interactive block Mario just bonked: the one whose column his
     * horizontal centre falls under, at the height of his head. Falls back to
     * `null` when nothing lines up (the caller then uses the collided block).
     */
    private blockOverHead(pBody: Phaser.Physics.Arcade.Body): Block | null {
        const headX = pBody.center.x;
        const headTop = pBody.top;
        let best: Block | null = null;
        let bestDx = Infinity;
        for (const obj of this.blocks.getChildren()) {
            const b = obj as Block;
            const bb = b.body as Phaser.Physics.Arcade.StaticBody;
            // Must sit just above his head (the row he bonked), not lower or on
            // another level, and his centre must fall within its column.
            if (bb.bottom > headTop + TILE / 2) continue;
            if (bb.bottom < headTop - TILE) continue;
            if (headX < bb.left || headX > bb.right) continue;
            const dx = Math.abs(bb.center.x - headX);
            if (dx < bestDx) {
                bestDx = dx;
                best = b;
            }
        }
        return best;
    }

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
        } else if (result === 'oneup') {
            this.spawnOneUp(block.x, block.y);
        } else if (result === 'break') {
            this.audio.play('brick');
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
            this.audio.play('stomp');
            this.addScore(STOMP_SCORE);
        } else if (player.damage()) {
            this.killPlayer();
        } else {
            this.audio.play('powerdown');
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
                    this.audio.play('stomp');
                    this.addScore(STOMP_SCORE);
                } else if (player.damage()) {
                    this.killPlayer();
                } else {
                    this.audio.play('powerdown');
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
                    this.audio.play('stomp');
                    this.addScore(SHELL_KICK_SCORE);
                }
                break;

            case 'sliding':
                if (stomp) {
                    koopa.stopShell();
                    player.bounce();
                    this.audio.play('stomp');
                } else if (!koopa.inGrace && player.damage()) {
                    this.killPlayer();
                } else if (!koopa.inGrace) {
                    this.audio.play('powerdown');
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

    /** Spawn a green 1-up mushroom from a bumped 1-up block (Milestone 7). */
    private spawnOneUp(x: number, y: number): void {
        this.powerups.add(new PowerUp(this, x, y, 'oneup'));
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
        this.audio.play('fireball');
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
        this.audio.play('coin');
        this.addScore(COIN_SCORE);
        // Every COINS_PER_1UP coins earns a 1-UP, then the counter rolls over.
        const coins = (this.registry.get('coins') as number) + 1;
        if (coins >= COINS_PER_1UP) {
            this.registry.set('coins', coins - COINS_PER_1UP);
            this.grantOneUp();
        } else {
            this.registry.set('coins', coins);
        }
    }

    /** Grant an extra life and float a little "1UP" where it was earned. */
    private grantOneUp(x?: number, y?: number): void {
        this.audio.play('oneup');
        this.registry.set('lives', (this.registry.get('lives') as number) + 1);
        const px = x ?? this.player.x;
        const py = y ?? this.player.y;
        const label = this.add
            .text(px, py, '1UP', { fontFamily: 'monospace', fontSize: '8px', color: '#2ecc40' })
            .setOrigin(0.5)
            .setDepth(20);
        this.tweens.add({
            targets: label,
            y: py - TILE * 2,
            alpha: 0,
            duration: 700,
            onComplete: () => label.destroy(),
        });
    }

    private addScore(points: number): void {
        this.registry.set('score', (this.registry.get('score') as number) + points);
    }

    /** Death: play the hop, dock a life, then respawn — or end the game at zero. */
    private killPlayer(): void {
        if (this.resetting || this.levelComplete) {
            return;
        }
        this.resetting = true;
        this.audio.stopMusic();
        this.audio.play('die');
        this.player.kill();
        this.cameras.main.stopFollow();

        const lives = (this.registry.get('lives') as number) - 1;
        this.registry.set('lives', Math.max(0, lives));
        this.time.delayedCall(RESPAWN_DELAY_MS, () => {
            if (lives <= 0) {
                this.gameOver();
            } else {
                this.scene.restart();
            }
        });
    }

    /** Out of lives: wipe the run state, show GAME OVER, then back to the title. */
    private gameOver(): void {
        this.returnToTitle('GAME OVER', 2500);
    }

    /** Cleared the final course: celebrate, wipe the run state, back to the title. */
    private victory(): void {
        this.returnToTitle('THANK YOU!', 3500);
    }

    /**
     * Shared end-of-run teardown (game over or final victory): reset the
     * persistent run state — including the progression index, so the next run
     * starts at the first course — hush the music, show a banner, then drop the
     * overlays and return to the title.
     */
    private returnToTitle(banner: string, delayMs: number): void {
        this.registry.set('score', 0);
        this.registry.set('coins', 0);
        this.registry.set('lives', START_LIVES);
        this.registry.set('levelIndex', 0);
        this.audio.stopMusic();
        this.showBanner(banner);
        this.time.delayedCall(delayMs, () => {
            this.scene.stop('UI');
            this.scene.stop('Touch');
            this.scene.start('Title');
        });
    }

    /**
     * Build the end-of-level flagpole at the `F` marker (near the top of the
     * screen): a tall pole with a ball finial and a pennant, plus an overlap
     * trigger spanning its height. Touching the trigger starts the win cutscene.
     */
    private setupFlagpole(pos: Phaser.Math.Vector2): void {
        this.flagX = pos.x;
        const topY = pos.y;
        const baseY = this.groundSurfaceY;
        const midY = (topY + baseY) / 2;

        // Pole (thin bar) + ball finial, drawn behind the pennant.
        this.add.rectangle(pos.x, midY, 4, baseY - topY, 0xbfefbf).setDepth(0);
        this.add.circle(pos.x, topY, 4, 0xe8f8e8).setDepth(1);
        this.flagPennant = this.add.image(pos.x, topY + 8, 'flag').setDepth(1);

        // Overlap trigger covering the pole: touching it clears the level.
        const zone = this.add.zone(pos.x, midY, 10, baseY - topY);
        this.physics.add.existing(zone, true);
        this.physics.add.overlap(this.player, zone, this.onReachFlag, undefined, this);
    }

    /** Place the end-of-level castle (bottom-centre origin, sitting on the ground). */
    private setupCastle(pos: Phaser.Math.Vector2): void {
        this.castleX = pos.x;
        this.add.image(pos.x, this.groundSurfaceY, 'castle').setOrigin(0.5, 1).setDepth(0);
    }

    /**
     * Mario touched the flagpole: freeze the world and drive the win cutscene
     * with tweens (`update()` already bails while `levelComplete`). He slides
     * down the pole, marches to the castle, then the level is tallied.
     */
    private onReachFlag: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = () => {
        if (this.levelComplete || this.resetting) {
            return;
        }
        this.levelComplete = true;
        this.audio.stopMusic();
        this.audio.play('flag');

        // Hand Mario over to the tweens: stop physics, snap him onto the pole.
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.stop();
        body.enable = false;
        this.player.setX(this.flagX);
        this.cameras.main.stopFollow();

        // Slide Mario (and the pennant) down to the ground, then walk to the castle.
        const landY = this.groundSurfaceY - this.player.displayHeight / 2;
        this.tweens.add({
            targets: this.player,
            y: landY,
            duration: 700,
            ease: 'Sine.easeIn',
            onComplete: () => this.marchToCastle(),
        });
        if (this.flagPennant) {
            this.tweens.add({
                targets: this.flagPennant,
                y: this.groundSurfaceY - 8,
                duration: 700,
                ease: 'Sine.easeIn',
            });
        }
    };

    /** Step off the pole and walk into the castle, then tally the level. */
    private marchToCastle(): void {
        this.player.setFlipX(false); // face the castle (to the right)
        this.tweens.add({
            targets: this.player,
            x: this.castleX,
            duration: 1200,
            ease: 'Linear',
            onComplete: () => {
                this.player.setVisible(false); // vanish into the castle
                this.levelCleared();
            },
        });
    }

    /**
     * Convert remaining time into bonus points, celebrate, then advance: rebuild
     * at the next course, or run the victory path after the final one. The run
     * state (score/coins/lives) persists across the restart.
     */
    private levelCleared(): void {
        this.audio.play('clear');
        const time = this.registry.get('time') as number;
        if (time > 0) {
            this.addScore(time * TIME_BONUS);
            this.registry.set('time', 0);
        }

        const next = (this.registry.get('levelIndex') as number) + 1;
        this.showBanner('LEVEL COMPLETE!');
        this.time.delayedCall(3000, () => {
            if (next >= LEVELS.length) {
                this.victory(); // cleared the final course
            } else {
                this.registry.set('levelIndex', next);
                this.scene.restart(); // rebuilds GameScene with the new index
            }
        });
    }

    /**
     * Center a big message fixed to the viewport, replacing any prior banner so
     * a sequence (e.g. LEVEL COMPLETE! → THANK YOU!) never overlaps.
     */
    private showBanner(text: string): void {
        const cam = this.cameras.main;
        this.banner?.destroy();
        this.banner = this.add
            .text(cam.width / 2, cam.height / 2, text, {
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#ffffff',
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(100);
    }
}

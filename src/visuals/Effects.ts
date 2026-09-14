import type { Scene } from 'phaser';
import type { Player } from '../entities/Player';
import type { Goomba } from '../entities/Goomba';
import type { Koopa } from '../entities/Koopa';

/** Scene-owned, purely cosmetic effects. Nothing here writes to physics or input. */
export class Effects {
    private elapsed = 0;
    private lastDust = 0;
    private grounded = false;
    private particles = 0;

    constructor(private readonly scene: Scene) {}

    burst(x: number, y: number, color = 0xffdc82, count = 9): void {
        for (let i = 0; i < count && this.particles < 80; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = 10 + (i % 3) * 6;
            const spark = this.scene.add.image(x, y, i % 3 ? 'mote' : 'spark')
                .setTint(color).setDepth(6);
            this.particles++;
            this.scene.tweens.add({
                targets: spark, x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 8, alpha: 0, scale: 0.3,
                duration: 320 + (i % 3) * 80, ease: 'Quad.easeOut',
                onComplete: () => { spark.destroy(); this.particles--; },
            });
        }
    }

    dust(x: number, y: number): void {
        this.burst(x, y, 0xb2d8c1, 5);
    }

    /** Cutscene poses use the same untrimmed frames, without touching body state. */
    pose(player: Player, pose: '' | 'Walk1' | 'Walk2' | 'Jump'): void {
        const base = player.isFire ? 'marioFire' : player.isBig ? 'marioBig' : 'mario';
        if (player.texture.key !== base + pose) player.setTexture(base + pose);
    }

    march(player: Player, progress: number): void {
        this.pose(player, Math.floor(progress * 10) % 2 ? 'Walk1' : 'Walk2');
    }

    update(player: Player, goombas: Phaser.GameObjects.Group, koopas: Phaser.GameObjects.Group,
        fireballs: Phaser.GameObjects.Group, delta: number): void {
        this.elapsed += delta;
        const body = player.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down || body.touching.down;
        const moving = Math.abs(body.velocity.x) > 12;
        const pose = !onGround ? 'Jump' : moving ? (Math.floor(this.elapsed / 110) % 2 ? 'Walk1' : 'Walk2') : '';
        if (!player.isDead) this.pose(player, pose);
        const dustDue = this.elapsed - this.lastDust > 140;
        if ((!this.grounded && onGround) || (onGround && moving && dustDue)) {
            this.dust(player.x - player.facing * 4, body.bottom - 1);
            this.lastDust = this.elapsed;
        }
        this.grounded = onGround;
        for (const object of goombas.getChildren()) {
            const enemy = object as Goomba;
            if (!enemy.isDead) enemy.setTexture(Math.floor((this.elapsed + enemy.x * 3) / 180) % 2 ? 'goombaWalk' : 'goomba');
        }
        for (const object of koopas.getChildren()) {
            const enemy = object as Koopa;
            if (!enemy.isDead && enemy.phase === 'walking') enemy.setTexture(Math.floor((this.elapsed + enemy.x * 3) / 180) % 2 ? 'koopaWalk' : 'koopa');
        }
        if (dustDue && fireballs.countActive(true)) {
            for (const object of fireballs.getChildren()) {
                const fireball = object as Phaser.Physics.Arcade.Sprite;
                if (fireball.active) this.burst(fireball.x, fireball.y, 0xffa080, 3);
            }
            this.lastDust = this.elapsed;
        }
    }
}

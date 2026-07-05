import { Scene } from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

/**
 * BootScene runs first and generates every placeholder texture at runtime as a
 * colored rectangle (see PLAN.md §6) — so the game needs zero external art.
 *
 * Texture keys are STABLE (`mario`, `ground`, `brick`, `question`, `pipe`,
 * `coin`, `goomba`, `flag`); real 16×16 sprites can be dropped in later with no
 * code changes. Milestone 1 only needs `mario` + `ground`, but the rest are
 * generated now so M2/M3 spawn code has its textures ready.
 */
export class BootScene extends Scene {
    constructor() {
        super('Boot');
    }

    create() {
        this.generatePlaceholderTextures();
        this.scene.start('Preload');
    }

    private generatePlaceholderTextures() {
        // Mario — drawn readably so facing (the eye) and jump arcs are easy to
        // judge while tuning. Faces right by default; the Player flips it.
        this.makeTexture('mario', 16, 16, (g) => {
            g.fillStyle(0xe52521); g.fillRect(0, 0, 16, 4);   // hat
            g.fillStyle(0xffa24c); g.fillRect(0, 4, 16, 5);   // face
            g.fillStyle(0x000000); g.fillRect(11, 5, 2, 2);   // eye (right => faces right)
            g.fillStyle(0x1f6feb); g.fillRect(0, 9, 16, 5);   // overalls
            g.fillStyle(0x6a3805); g.fillRect(0, 14, 16, 2);  // shoes
        });

        // Ground — warm SMB brown with a lighter top edge; tiles seamlessly.
        this.makeTexture('ground', 16, 16, (g) => {
            g.fillStyle(0xc84c0c); g.fillRect(0, 0, 16, 16);
            g.fillStyle(0xe08a4c); g.fillRect(0, 0, 16, 3);
            g.lineStyle(1, 0x7a2d06); g.strokeRect(0, 0, 16, 16);
        });

        // Brick.
        this.makeTexture('brick', 16, 16, (g) => {
            g.fillStyle(0xb5651d); g.fillRect(0, 0, 16, 16);
            g.lineStyle(1, 0x3d2208); g.strokeRect(0, 0, 16, 16);
            g.lineBetween(0, 8, 16, 8);
            g.lineBetween(8, 0, 8, 8);
            g.lineBetween(4, 8, 4, 16);
            g.lineBetween(12, 8, 12, 16);
        });

        // Question block.
        this.makeTexture('question', 16, 16, (g) => {
            g.fillStyle(0xfcb400); g.fillRect(0, 0, 16, 16);
            g.lineStyle(1, 0x7a3d00); g.strokeRect(0, 0, 16, 16);
            g.fillStyle(0xffffff); g.fillRect(7, 4, 2, 5); g.fillRect(7, 11, 2, 2);
        });

        // Used/empty block — a dim brown once a question block is spent.
        this.makeTexture('blockUsed', 16, 16, (g) => {
            g.fillStyle(0x8a5a2b); g.fillRect(0, 0, 16, 16);
            g.lineStyle(1, 0x3d2208); g.strokeRect(0, 0, 16, 16);
            g.fillStyle(0x6f4622);
            g.fillRect(3, 3, 2, 2); g.fillRect(11, 3, 2, 2);
            g.fillRect(3, 11, 2, 2); g.fillRect(11, 11, 2, 2);
        });

        // Pipe (green) with a highlight stripe.
        this.makeTexture('pipe', 16, 16, (g) => {
            g.fillStyle(0x00a800); g.fillRect(0, 0, 16, 16);
            g.fillStyle(0x39d939); g.fillRect(2, 0, 3, 16);
            g.lineStyle(1, 0x004a00); g.strokeRect(0, 0, 16, 16);
        });

        // Coin (round, so corners stay transparent).
        this.makeTexture('coin', 16, 16, (g) => {
            g.fillStyle(0xfbd000); g.fillCircle(8, 8, 6);
            g.lineStyle(1, 0xb38b00); g.strokeCircle(8, 8, 6);
        });

        // Goomba.
        this.makeTexture('goomba', 16, 16, (g) => {
            g.fillStyle(0x8b5a2b); g.fillEllipse(8, 7, 14, 12);                       // body
            g.fillStyle(0x3a2412); g.fillRect(2, 12, 4, 4); g.fillRect(10, 12, 4, 4); // feet
            g.fillStyle(0xffffff); g.fillRect(5, 5, 2, 3); g.fillRect(9, 5, 2, 3);    // eye whites
            g.fillStyle(0x000000); g.fillRect(6, 6, 1, 2); g.fillRect(10, 6, 1, 2);   // pupils
        });

        // Flag.
        this.makeTexture('flag', 16, 16, (g) => {
            g.fillStyle(0xeeeeee); g.fillRect(7, 0, 2, 16);            // pole
            g.fillStyle(0x2ecc40); g.fillTriangle(9, 2, 9, 8, 15, 5); // pennant
        });

        // Koopa Troopa — 16x24, green shell + yellow head. Faces right; flipped
        // by the entity when it turns. Feet sit at the bottom of the 24px box.
        this.makeTexture('koopa', 16, 24, (g) => {
            g.fillStyle(0xf8d030); g.fillEllipse(9, 5, 9, 9);           // head
            g.fillStyle(0x000000); g.fillRect(11, 3, 2, 2);            // eye
            g.fillStyle(0xf8b000); g.fillRect(13, 6, 3, 2);           // snout
            g.fillStyle(0x00a800); g.fillEllipse(8, 15, 15, 15);      // shell
            g.fillStyle(0x006000); g.fillEllipse(8, 15, 9, 9);        // shell centre
            g.fillStyle(0xf8d030); g.fillRect(2, 20, 4, 4); g.fillRect(10, 20, 4, 4); // feet
        });

        // Shell — the retracted Koopa: a squat green dome, 16x16.
        this.makeTexture('shell', 16, 16, (g) => {
            g.fillStyle(0x00a800); g.fillEllipse(8, 9, 15, 12);
            g.fillStyle(0x006000); g.fillEllipse(8, 9, 9, 7);
            g.fillStyle(0xf8f8f8); g.fillRect(1, 10, 14, 2);          // rim
            g.lineStyle(1, 0x004a00); g.strokeRect(1, 10, 14, 2);
        });

        // Big Mario — 16x32, same palette as small Mario but two tiles tall.
        this.makeTexture('marioBig', 16, 32, (g) => {
            g.fillStyle(0xe52521); g.fillRect(0, 0, 16, 6);    // hat
            g.fillStyle(0xffa24c); g.fillRect(0, 6, 16, 8);    // face
            g.fillStyle(0x000000); g.fillRect(11, 8, 2, 2);    // eye
            g.fillStyle(0x1f6feb); g.fillRect(0, 14, 16, 12);  // overalls
            g.fillStyle(0xe52521); g.fillRect(0, 14, 4, 12);   // arm
            g.fillStyle(0x6a3805); g.fillRect(0, 26, 16, 6);   // shoes/legs
        });

        // Fire Mario — big silhouette, white + red palette.
        this.makeTexture('marioFire', 16, 32, (g) => {
            g.fillStyle(0xffffff); g.fillRect(0, 0, 16, 6);    // hat (white)
            g.fillStyle(0xffa24c); g.fillRect(0, 6, 16, 8);    // face
            g.fillStyle(0x000000); g.fillRect(11, 8, 2, 2);    // eye
            g.fillStyle(0xe52521); g.fillRect(0, 14, 16, 12);  // overalls (red)
            g.fillStyle(0xffffff); g.fillRect(0, 14, 4, 12);   // arm (white)
            g.fillStyle(0x6a3805); g.fillRect(0, 26, 16, 6);   // shoes
        });

        // Mushroom — red cap, white spots, tan stalk.
        this.makeTexture('mushroom', 16, 16, (g) => {
            g.fillStyle(0xf0d8b0); g.fillRect(3, 8, 10, 8);    // stalk
            g.fillStyle(0xe52521); g.fillEllipse(8, 7, 16, 12); // cap
            g.fillStyle(0xffffff); g.fillCircle(5, 6, 2); g.fillCircle(11, 6, 2);
        });

        // Fire flower — green stalk, orange/yellow bloom.
        this.makeTexture('fireFlower', 16, 16, (g) => {
            g.fillStyle(0x2ecc40); g.fillRect(7, 9, 2, 7);     // stalk
            g.fillStyle(0xff7b00); g.fillCircle(8, 6, 5);      // petals
            g.fillStyle(0xfff200); g.fillCircle(8, 6, 2);      // centre
        });

        // Fireball — small orange/white ball.
        this.makeTexture('fireball', 8, 8, (g) => {
            g.fillStyle(0xff5000); g.fillCircle(4, 4, 4);
            g.fillStyle(0xffe000); g.fillCircle(4, 4, 2);
        });
    }

    /** Draw into an off-list Graphics, bake it to a texture, then discard it. */
    private makeTexture(key: string, w: number, h: number, draw: DrawFn) {
        const g = this.make.graphics();
        draw(g);
        g.generateTexture(key, w, h);
        g.destroy();
    }
}

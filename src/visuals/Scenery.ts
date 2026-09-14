import type { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE } from '../config/constants';

interface Theme {
    name: string;
    skyTop: number;
    skyBottom: number;
    far: number;
    middle: number;
    near: number;
    accent: number;
    night: boolean;
}

const THEMES: Theme[] = [
    { name: 'EMERALD DAWN', skyTop: 0x243c60, skyBottom: 0xe9be98, far: 0x727f98, middle: 0x416e7d, near: 0x244e59, accent: 0xffdf9c, night: false },
    { name: 'MISTWOOD TRAIL', skyTop: 0x284c68, skyBottom: 0xb3d4c5, far: 0x789eab, middle: 0x447f87, near: 0x245963, accent: 0xd7f2cc, night: false },
    { name: 'STARFALL RIDGE', skyTop: 0x151e43, skyBottom: 0x726992, far: 0x55567c, middle: 0x373f69, near: 0x252e50, accent: 0xc7e8f1, night: true },
    { name: 'MOONLIT KEEP', skyTop: 0x101e30, skyBottom: 0x4b797a, far: 0x395b6c, middle: 0x2b475d, near: 0x1e3547, accent: 0xa8eddb, night: true },
    { name: 'AMBER CANOPY', skyTop: 0x424c70, skyBottom: 0xf2c19a, far: 0x99899a, middle: 0x647583, near: 0x3e5863, accent: 0xffdb9e, night: false },
    { name: 'FIREFLY HOLLOW', skyTop: 0x102337, skyBottom: 0x367477, far: 0x356376, middle: 0x24495e, near: 0x183645, accent: 0x9ceacb, night: true },
    { name: 'VIOLET SUMMIT', skyTop: 0x302448, skyBottom: 0xc48b9e, far: 0x876d95, middle: 0x5a507d, near: 0x383e60, accent: 0xffd2b1, night: true },
    { name: 'THE EMBER CITADEL', skyTop: 0x292139, skyBottom: 0xcc796a, far: 0x8d5e73, middle: 0x5b405b, near: 0x342e48, accent: 0xffc081, night: true },
];

export function themeFor(index: number): Theme {
    return THEMES[index] ?? THEMES[0];
}

function mix(a: number, b: number, t: number): number {
    const channel = (shift: number) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
    return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** Deterministic decoration never consumes the game's random number stream. */
function noise(n: number): number {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
}

function pixelCircle(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha = 1): void {
    g.fillStyle(color, alpha);
    for (let dy = -r; dy <= r; dy++) {
        const half = Math.floor(Math.sqrt(r * r - dy * dy));
        g.fillRect(x - half, y + dy, half * 2 + 1, 1);
    }
}

function bake(scene: Scene, key: string, width: number, height: number,
    draw: (g: Phaser.GameObjects.Graphics) => void): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics();
    draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
}

/** Cached, pixel-painted backdrops. Only three screen-sized layers move per frame. */
export function createBackdrop(scene: Scene, index: number): void {
    const theme = themeFor(index);
    const prefix = `scenery-${THEMES.indexOf(theme)}`;
    bake(scene, `${prefix}-sky`, GAME_WIDTH, GAME_HEIGHT, g => {
        for (let y = 0; y < GAME_HEIGHT; y += 2) {
            g.fillStyle(mix(theme.skyTop, theme.skyBottom, Math.min(y / 205, 1)));
            g.fillRect(0, y, GAME_WIDTH, 2);
        }
        // The halo is baked, rather than requiring an expensive postprocessing pass.
        for (let r = 42; r > 17; r -= 5) pixelCircle(g, 199, 66, r, theme.accent, 0.025);
        pixelCircle(g, 199, 66, 17, theme.accent);
        if (theme.night) {
            pixelCircle(g, 193, 60, 14, mix(theme.skyTop, theme.skyBottom, 0.29));
            for (let i = 0; i < 48; i++) {
                g.fillStyle(theme.accent, 0.25 + noise(i + 9) * 0.6);
                g.fillRect(Math.floor(noise(i) * 256), 30 + Math.floor(noise(i + 50) * 102), 1, 1);
            }
        } else {
            g.fillStyle(theme.skyBottom, 0.45);
            g.fillRect(170, 68, 58, 2);
            g.fillRect(175, 75, 50, 3);
        }
        // Long, softly layered cloud ribbons frame the distant peaks.
        for (let i = 0; i < 9; i++) {
            const x = Math.floor(noise(i + 62) * 256);
            const y = 46 + Math.floor(noise(i + 77) * 67);
            const width = 25 + Math.floor(noise(i + 19) * 64);
            g.fillStyle(theme.accent, theme.night ? 0.045 : 0.12);
            g.fillRect(x, y, width, 2);
            g.fillRect(x + 8, y - 2, width - 17, 2);
        }
    });
    scene.add.image(0, 0, `${prefix}-sky`).setOrigin(0).setScrollFactor(0).setDepth(-100);

    const layers: { images: Phaser.GameObjects.Image[]; factor: number }[] = [];
    for (let layer = 0; layer < 3; layer++) {
        const key = `${prefix}-layer-${layer}`;
        bake(scene, key, 512, GAME_HEIGHT, g => {
            const color = [theme.far, theme.middle, theme.near][layer];
            if (layer < 2) {
                // Faceted, irregular alpine silhouettes, with restrained lit faces.
                for (let i = -1; i < 8; i++) {
                    const x = i * 88 + (layer ? 40 : 0);
                    const peak = 91 + layer * 42 + Math.floor(noise(i + layer * 17) * 35);
                    const height = 218 - peak;
                    g.fillStyle(color);
                    g.fillTriangle(x - 74, 240, x + 18, peak, x + 112, 240);
                    g.fillStyle(mix(color, theme.skyBottom, 0.13));
                    g.fillTriangle(x + 18, peak, x - 30, 218, x + 37, 218);
                    if (!layer) {
                        g.fillStyle(mix(color, theme.accent, 0.38));
                        g.fillTriangle(x + 18, peak, x + 2, peak + height * 0.2, x + 23, peak + height * 0.14);
                    }
                }
            } else {
                g.fillStyle(color).fillRect(0, 213, 512, 27);
                for (let i = 0; i < 28; i++) {
                    const x = i * 20;
                    const height = 23 + Math.floor(noise(i + 27) * 37);
                    const y = 222 - height;
                    g.fillStyle(color);
                    g.fillRect(x, y + 12, 3, height);
                    for (let tier = 0; tier < 3; tier++) {
                        g.fillTriangle(x - 8 - tier * 3, y + 20 + tier * 10, x + 1, y + tier * 8, x + 10 + tier * 3, y + 20 + tier * 10);
                    }
                    g.fillStyle(mix(color, theme.middle, 0.35));
                    g.fillRect(x, y + 14, 1, height - 8);
                }
            }
        });
        layers.push({
            factor: [0.12, 0.28, 0.48][layer],
            images: [0, 1].map(i => scene.add.image(i * 512, 0, key).setOrigin(0)
                .setScrollFactor(0).setDepth(-90 + layer * 10)),
        });
    }

    const motes = Array.from({ length: 18 }, (_, i) => {
        const image = scene.add.image(0, 0, i % 6 === 0 ? 'spark' : 'mote')
            .setScrollFactor(0).setDepth(-5).setAlpha(0.4);
        return { image, x: noise(i + 11) * GAME_WIDTH, y: 60 + noise(i + 36) * 145, phase: noise(i + 22) * Math.PI * 2 };
    });
    let elapsed = 0;
    const update = (_time: number, delta: number) => {
        elapsed += delta;
        const scroll = scene.cameras.main.scrollX;
        for (const layer of layers) {
            const offset = ((scroll * layer.factor) % 512 + 512) % 512;
            layer.images.forEach((image, i) => image.setX(Math.round(i * 512 - offset)));
        }
        for (const mote of motes) {
            mote.image.setPosition(
                ((mote.x + elapsed * 0.003 - scroll * 0.65) % 272 + 272) % 272 - 8,
                mote.y + Math.sin(elapsed * 0.0008 + mote.phase) * 7,
            ).setAlpha(0.15 + (Math.sin(elapsed * 0.002 + mote.phase) + 1) * 0.23);
        }
    };
    update(0, 0);
    scene.events.on('update', update);
    scene.events.once('shutdown', () => scene.events.off('update', update));
}

/** All foreground dressing is non-physical and kept behind the gameplay silhouettes. */
export function dressTerrain(scene: Scene, rows: string[], solids: Phaser.Physics.Arcade.StaticGroup): void {
    bake(scene, 'scenery-fern', 24, 20, g => {
        for (let i = 0; i < 5; i++) {
            const x = 3 + i * 4;
            const top = 5 + Math.abs(i - 2) * 3;
            g.fillStyle(0x245963).fillRect(x, top, 1, 20 - top);
            for (let y = top; y < 18; y += 4) {
                g.fillStyle(y % 3 ? 0x438e83 : 0x78b59a);
                g.fillRect(x - 2, y, 2, 2);
                g.fillRect(x + 1, y + 1, 3, 1);
            }
        }
    });
    bake(scene, 'scenery-bloom', 16, 16, g => {
        g.fillStyle(0x438e83).fillRect(7, 6, 1, 10).fillRect(4, 10, 3, 2).fillRect(8, 8, 3, 2);
        pixelCircle(g, 7, 5, 3, 0xec927d);
        g.fillStyle(0xffdc82).fillRect(7, 4, 2, 2);
        g.fillStyle(0xfff2cf).fillRect(6, 3, 1, 1);
    });
    for (const object of solids.getChildren()) {
        const tile = object as Phaser.Physics.Arcade.Image;
        const col = Math.floor(tile.x / TILE);
        const row = Math.floor(tile.y / TILE);
        const char = rows[row]?.[col];
        const above = rows[row - 1]?.[col];
        if (char === 'X' && above === 'X') tile.setTexture('groundInner');
        if (char === 'P' && above !== 'P') tile.setTexture('pipeTop');
        if (char !== 'X' || !['-', ' '].includes(above ?? '') || col % 3 !== 0) continue;
        const bloom = noise(col + row) > 0.72;
        scene.add.image(tile.x, tile.y - TILE / 2, bloom ? 'scenery-bloom' : 'scenery-fern')
            .setOrigin(0.5, 1).setDepth(-2).setAlpha(0.85);
    }
}

import { Math as PhaserMath } from 'phaser';
import type { Physics, Scene } from 'phaser';
import { TILE } from '../config/constants';

/**
 * Result of building a level: the solid colliders plus the spawn data the scene
 * needs. Coin/goomba/flag spawns are plain coordinates (no sprites) so this
 * milestone can wire up solids + camera while Milestone 3 consumes the spawns
 * without any change here.
 */
export interface LevelBuildResult {
    /** Static group of all inert solid tiles (ground + pipe). */
    solids: Physics.Arcade.StaticGroup;
    /** Level size in world pixels — drives world + camera bounds. */
    pixelWidth: number;
    pixelHeight: number;
    /** Where to place Mario (tile centre of the `M` marker). */
    playerSpawn: PhaserMath.Vector2;
    /** Goomba spawn points (Milestone 3). */
    goombaSpawns: PhaserMath.Vector2[];
    /** Coin pickup points (Milestone 3). */
    coinSpawns: PhaserMath.Vector2[];
    /** Question-block spawn points — interactive, bumped for coins (Milestone 4). */
    questionSpawns: PhaserMath.Vector2[];
    /** Breakable brick spawn points (Milestone 4). */
    brickSpawns: PhaserMath.Vector2[];
    /** Flag position, if the level has one. */
    flagPosition: PhaserMath.Vector2 | null;
}

/**
 * Inert solid tile chars → placeholder texture key. Bricks (`B`) and question
 * blocks (`?`) are NOT here: they are interactive `Block` entities spawned by the
 * scene, so the builder only reports their positions (like goombas/coins).
 */
const SOLID_TEXTURES: Record<string, string> = {
    X: 'ground',
    P: 'pipe',
};

/**
 * Turns an authored string map (see `level-1-1.ts`) into Arcade static bodies
 * and spawn points. Each non-empty char maps to one 16×16 tile placed at its
 * grid cell. Migrating to Tiled later (Option B, PLAN.md §7) means swapping this
 * builder's internals while keeping `build()` / `LevelBuildResult` intact.
 */
export class TileMapBuilder {
    constructor(
        private readonly scene: Scene,
        private readonly rows: string[],
    ) {}

    build(): LevelBuildResult {
        const solids = this.scene.physics.add.staticGroup();
        const goombaSpawns: PhaserMath.Vector2[] = [];
        const coinSpawns: PhaserMath.Vector2[] = [];
        const questionSpawns: PhaserMath.Vector2[] = [];
        const brickSpawns: PhaserMath.Vector2[] = [];
        let playerSpawn = new PhaserMath.Vector2(TILE * 2, TILE * 2);
        let flagPosition: PhaserMath.Vector2 | null = null;

        const cols = this.rows.reduce((max, row) => Math.max(max, row.length), 0);

        this.rows.forEach((row, ry) => {
            for (let cx = 0; cx < row.length; cx++) {
                const char = row[cx];
                if (char === '-' || char === ' ') {
                    continue;
                }

                // Tile centre in world pixels (static sprites use origin 0.5).
                const x = cx * TILE + TILE / 2;
                const y = ry * TILE + TILE / 2;

                const texture = SOLID_TEXTURES[char];
                if (texture) {
                    // create() gives the tile a static body sized to the texture;
                    // no refreshBody() needed since we never scale/re-origin it.
                    solids.create(x, y, texture);
                    continue;
                }

                switch (char) {
                    case 'M':
                        playerSpawn = new PhaserMath.Vector2(x, y);
                        break;
                    case 'G':
                        goombaSpawns.push(new PhaserMath.Vector2(x, y));
                        break;
                    case 'o':
                        coinSpawns.push(new PhaserMath.Vector2(x, y));
                        break;
                    case '?':
                        questionSpawns.push(new PhaserMath.Vector2(x, y));
                        break;
                    case 'B':
                        brickSpawns.push(new PhaserMath.Vector2(x, y));
                        break;
                    case 'F':
                        flagPosition = new PhaserMath.Vector2(x, y);
                        break;
                }
            }
        });

        return {
            solids,
            pixelWidth: cols * TILE,
            pixelHeight: this.rows.length * TILE,
            playerSpawn,
            goombaSpawns,
            coinSpawns,
            questionSpawns,
            brickSpawns,
            flagPosition,
        };
    }
}

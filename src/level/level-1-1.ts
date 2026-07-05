/**
 * Authored slice of World 1-1 (PLAN.md §7, Option A: hand-authored string map).
 *
 * One char = one 16×16 tile. The grid is 52 tiles wide × 15 tall (the NES
 * viewport is 16×15 tiles, so this scrolls horizontally but not vertically).
 * `TileMapBuilder` turns this into static colliders + entity spawn points, so we
 * can migrate to Tiled (Option B) later behind the same interface.
 *
 * Legend:
 *   X  ground (solid)      B  brick (solid)       ?  question block (coin)
 *   U  power-up block      P  pipe (solid)        -  empty / sky
 *   M  Mario spawn         G  goomba spawn        K  koopa spawn
 *   o  coin                F  flag
 *
 * Solids (X/P) are inert tiles. Bricks/blocks (B/?/U) are interactive entities;
 * other spawns (M/G/K/o/F) are placed by the scene.
 */
export const LEVEL_1_1: string[] = [
    '----------------------------------------------------',
    '----------------------------------------------------',
    '----------------------------------------------------',
    '----------------------------------------------------',
    '----------------------------------------------------',
    '----------------------------------------------------',
    '----------------------------------------------------',
    '----------------o----o-o----------------------------',
    '-------------------------------ooo----------------F-',
    '----------------U---B?U?B----------------------B----',
    '-------------------------------------PP-------BB----',
    '---------------------------PP--------PP------BBB----',
    '--M-------G-------K--------PP--------PP-G---BBBB----',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXX',
];

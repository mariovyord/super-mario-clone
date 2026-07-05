/**
 * Authored slice of World 1-1 (PLAN.md §7, Option A: hand-authored string map).
 *
 * One char = one 16×16 tile. The grid is 96 tiles wide × 15 tall (the NES
 * viewport is 16×15 tiles, so this scrolls horizontally but not vertically).
 * `TileMapBuilder` turns this into static colliders + entity spawn points, so we
 * can migrate to Tiled (Option B) later behind the same interface.
 *
 * Legend:
 *   X  ground / step (solid)   B  brick (solid)     ?  question block (coin)
 *   U  power-up block          L  1-up block        P  pipe (solid)
 *   -  empty / sky             o  coin
 *   M  Mario spawn   G  goomba spawn   K  koopa spawn   F  flagpole   C  castle
 *
 * Solids (X/P) are inert tiles. Bricks/blocks (B/?/U/L) are interactive
 * entities; other spawns (M/G/K/o/F/C) are placed by the scene. The right end
 * has an ascending staircase up to the flagpole and the end-of-level castle.
 */
export const LEVEL_1_1: string[] = [
    '------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------F-----',
    '------------------------------------------------------------------------------------------------',
    '---------------------------------------------------------------------------------------X--------',
    '--------------------------------------------------------------------------------------XX--------',
    '--------------oo-----o-o--------------------------ooo---------------oo---------------XXX--------',
    '-------------------------------------------oo---------------------------------------XXXX--------',
    '----------------?---B?U?B---------------PP----PP------------B?BLB?B----------------XXXXX--------',
    '---------------------------------PP-----PP----PP----------------------------------XXXXXX--------',
    '--------------------------PP-----PP-----PP----PP---------------------------------XXXXXXX--------',
    '---M--------G-------------PP--G--PP--K--PP----PP--------------G-G---------------XXXXXXXX-----C--',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXX',
];

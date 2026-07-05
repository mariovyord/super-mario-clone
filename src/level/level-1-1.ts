/**
 * Authored slice of World 1-1 (PLAN.md §7, Option A: hand-authored string map).
 *
 * One char = one 16×16 tile. The grid is 52 tiles wide × 15 tall (the NES
 * viewport is 16×15 tiles, so this scrolls horizontally but not vertically).
 * `TileMapBuilder` turns this into static colliders + entity spawn points, so we
 * can migrate to Tiled (Option B) later behind the same interface.
 *
 * Legend:
 *   X  ground (solid)      B  brick (solid)       ?  question block (solid)
 *   P  pipe (solid)        -  empty / sky
 *   M  Mario spawn         G  goomba spawn        o  coin           F  flag
 *
 * Solids (X/B/P/?) collide this milestone. Spawns (M/G/o/F) are recorded now;
 * goombas and coins are instantiated in Milestone 3, so they are invisible here.
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
    '----------------?---B?B?B----------------------B----',
    '-------------------------------------PP-------BB----',
    '---------------------------PP--------PP------BBB----',
    '--M-------G----------------PP--------PP-G---BBBB----',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXX',
];

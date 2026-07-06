/**
 * World 1-2 — "Twin Pits". A short second course built from the same vocabulary
 * as 1-1 (see the legend in `level-1-1.ts`): a Goomba gauntlet, two 4-tile pits
 * with coin arcs overhead, a flanked `B?U?B` power-up run, two pipes guarded by
 * a Goomba and a Koopa, a `BBLBB` brick run hiding a 1-up, and a staircase up to
 * the flagpole + castle.
 *
 * 88 tiles wide × 15 tall. One char = one 16×16 tile. The bottom two rows are the
 * ground strip; pits are gaps in *both* of them. Registered in `levels.ts`.
 */
export const LEVEL_1_2: string[] = [
    '----------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------',
    '--------------------------------------------------------------------------------F-------',
    '----------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------',
    '------ooo-----------ooo---------------------------------------BBLBB---------------------',
    '----------?-?--------------------B?U?B-------------------------------------X------------',
    '----------------------------oooo------------PP----------oooo--------------XX------------',
    '------------------PP------------------------PP---------------------------XXX------------',
    '--M-----------G---PP----G---------------G---PP--K-------------------G---XXXX--------C---',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
];

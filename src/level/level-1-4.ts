/**
 * World 1-4 — "Castle Ramparts". The dark final course, using the same tile
 * vocabulary as 1-1 (legend in `level-1-1.ts`): an early flanked `B?U?B`
 * power-up run, a short pipe hiding a penned Koopa, three coin-crowned pits, a
 * long middle rampart patrolled by a Goomba and two Koopas beneath a `BBLBB`
 * brick run hiding a 1-up (`L`), a taller pipe, then a grand eight-step
 * staircase up to the flagpole + castle. Clearing it triggers the victory path.
 *
 * 92 tiles wide × 15 tall. One char = one 16×16 tile. The bottom two rows are the
 * ground strip; pits are gaps in *both* of them. Registered in `levels.ts`.
 */
export const LEVEL_1_4: string[] = [
    '--------------------------------------------------------------------------------------------',
    '--------------------------------------------------------------------------------------------',
    '--------------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------F---',
    '--------------------------------------------------------------------------------------------',
    '-------------------------------------------------------------------------------------X------',
    '------------------------------------------------------------------------------------XX------',
    '-----------------------------------------------------------------------------------XXX------',
    '------------------------------------------------BBLBB-----------------------------XXXX------',
    '---------B?U?B-------------------------------------------------------------------XXXXX------',
    '------ooo-------------------ooo-----oooo----------------ooo-------oooo----PP----XXXXXX------',
    '------------------PP------------------------------------------------------PP---XXXXXXX------',
    '--M---------------PP----K-------------------G---------K-----K-------------PP--XXXXXXXX----C-',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXX',
];

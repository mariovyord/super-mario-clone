/**
 * World 1-3 — "Pipe Heights". The finale course, a little longer and tougher
 * than 1-2 (same tile vocabulary; legend in `level-1-1.ts`): an early `B?U?B`
 * power-up run, a Goomba/Koopa pair behind a pipe, a 3-tile pit, a floating
 * brick platform with a coin ledge on top, a Koopa guarding a wider 5-tile pit,
 * a tall pipe hiding a 1-up (`L`) that only reveals from the pipe top, then a
 * five-step staircase to the flagpole + castle.
 *
 * 96 tiles wide × 15 tall. One char = one 16×16 tile. The bottom two rows are the
 * ground strip; pits are gaps in *both* of them. Registered in `levels.ts`.
 */
export const LEVEL_1_3: string[] = [
    '------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------F-----',
    '------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------L-------------------------',
    '------------------------------------------------------------------------------------------------',
    '----------------------------------------------oooo------------------------------------X---------',
    '--------B?U?B---------------------------------BBBB-----------------------------------XX---------',
    '----------------ooo---------------------ooo-----------------ooooo-----PP------------XXX---------',
    '----------------------PP----------------------------------------------PP-----------XXXX---------',
    '--M-------------------PP----G-----K-------------G-------K-------------PP----------XXXXX------C--',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXX-----XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXX-----XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
];

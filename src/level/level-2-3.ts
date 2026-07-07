/**
 * World 2-3 — "Enemy Rush". The density spike (legend in `level-1-1.ts`): eight
 * enemies in tight Goomba/Koopa clusters, two four-tile pits, and the course's
 * only power-up (`?U?`) parked on top of a floating brick platform, so you have
 * to climb to it while the crowd closes in. A pipe splits the midfield; past the
 * second pit a final Koopa guards the run-up to the staircase, flagpole + castle.
 * Played on a twilight sky.
 *
 * 108 tiles wide × 15 tall. One char = one 16×16 tile. The bottom two rows are
 * the ground strip; pits are gaps in *both* of them. Registered in `levels.ts`.
 */
export const LEVEL_2_3: string[] = [
    '------------------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------------------',
    '-----------------------------------------------------------------------------------------------------F------',
    '------------------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------------------',
    '------------------------------------?U?-----------------------------------------------------------X---------',
    '------------------------oooo---------------------------------------------------------------------XX---------',
    '--------oooo----------------------------------------oooo----------------------------oooo--------XXX---------',
    '----------------------------------BXXXXXB------------------------------------------------------XXXX---------',
    '------------------------------------------------------------------oooo------------------------XXXXX---------',
    '------------------------------------------------------------PP-------------------------------XXXXXX---------',
    '--M-----G-G-----------K-------G-----------------------G-K---PP------G----------------K------XXXXXXX------C--',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXX----XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
];

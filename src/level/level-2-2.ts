/**
 * World 2-2 — "Stair World". A vertical-play course (legend in `level-1-1.ts`):
 * a staircase climbs onto a raised plateau where a Koopa perches right at the
 * edge — stomp it and the shell slides off into the pit below. A `B?U?B` power-up
 * run sits mid-course before a walk-over hill, then a second Koopa paces the lip
 * of the far pit. A short pipe and a Goomba precede the tall staircase up to the
 * flagpole + castle. Played on a dark, underground-ish sky.
 *
 * 100 tiles wide × 15 tall. One char = one 16×16 tile. The bottom two rows are
 * the ground strip; pits are gaps in *both* of them. Registered in `levels.ts`.
 */
export const LEVEL_2_2: string[] = [
    '----------------------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------------------',
    '---------------------------------------------------------------------------------------------F------',
    '----------------------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------X---------',
    '-----------------------------------------------------------------------------------------XX---------',
    '------oooo------------------------------------------------------ooo---------------------XXX---------',
    '---------------------------------Koooo--------B?U?B------XX---------oooo---------------XXXX---------',
    '-----------------------------XXXXXXXXX------------------XXXX--------------------------XXXXX---------',
    '----------------------------XXXXXXXXXX-----------------XXXXXX-------------PP---------XXXXXX---------',
    '--M-----G------------------XXXXXXXXXXX------G---------XXXXXXXXK---------G-PP--------XXXXXXX------C--',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
];

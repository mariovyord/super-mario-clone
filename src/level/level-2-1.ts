/**
 * World 2-1 — "Wider Plains". World 2 opens by recombining the 1-x vocabulary
 * (legend in `level-1-1.ts`) at a higher baseline: enemies arrive in pairs, the
 * two pits are a full three tiles wide, and an overhead brick maze sits above an
 * early flanked `B?U?B` power-up run so you go in equipped. Two pipes guard the
 * midfield, a lone Koopa patrols past them, then a Goomba and some breathing
 * room lead into the staircase up to the flagpole + castle.
 *
 * 104 tiles wide × 15 tall. One char = one 16×16 tile. The bottom two rows are
 * the ground strip; pits are gaps in *both* of them. Registered in `levels.ts`.
 */
export const LEVEL_2_1: string[] = [
    '--------------------------------------------------------------------------------------------------------',
    '--------------------------------------------------------------------------------------------------------',
    '--------------------------------------------------------------------------------------------------------',
    '------------------------------------------------------------------------------------------------F-------',
    '--------------------------------------------------------------------------------------------------------',
    '----------------------------------------------------------------------------------------------X---------',
    '--------------------B---B---B----------------------------------------------------------------XX---------',
    '---------------------------------------------oooo-------------------------------------------XXX---------',
    '-----ooo--------------------------ooo---------------------------------ooo------------------XXXX---------',
    '----------------------B?U?B---------------------------------------------------------------XXXXX---------',
    '------------------------------------------------------------PP-oooo----------------------XXXXXX---------',
    '-------------------------------------------------------PP---PP--------------------------XXXXXXX---------',
    '--M------G-G---------------------------------G-G-------PP---PP--K---------------G------XXXXXXXX-----C---',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
];

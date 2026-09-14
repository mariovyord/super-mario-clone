import type { Scene } from 'phaser';

// One deliberately restrained palette ties stone, foliage and characters together.
// Every mark is an integer-aligned rectangle: no antialiasing or external assets.
const PALETTE: Record<string, number> = {
    N: 0x17263e, D: 0x293650, S: 0x414868, B: 0x596587,
    V: 0x827a9e, H: 0xadb2bd, I: 0xfff2cf,
    G: 0xe9b44f, Y: 0xffdc82, O: 0xa46b3c,
    R: 0xec655d, r: 0xa73550, P: 0xffa080,
    F: 0xf5cd9c, f: 0xd99375, b: 0x70465a,
    T: 0x54c8bb, J: 0x2d968a, j: 0x20565f, L: 0xb2e6bb,
};

type Pose = 'idle' | 'walk1' | 'walk2' | 'jump';
type Palette = typeof PALETTE;

/** Small pixel brush shared by authored sprites and layered architectural art. */
class PixelBrush {
    constructor(private readonly graphics: Phaser.GameObjects.Graphics) {}

    rect(x: number, y: number, w: number, h: number, color: number) {
        this.graphics.fillStyle(color, 1);
        this.graphics.fillRect(x, y, w, h);
    }

    stamp(rows: readonly string[], x = 0, y = 0, palette: Palette = PALETTE) {
        rows.forEach((row, dy) => {
            // Coalesce equal pixels into runs to keep the one-time bake inexpensive.
            for (let dx = 0; dx < row.length;) {
                const symbol = row[dx];
                let end = dx + 1;
                while (row[end] === symbol) end++;
                if (symbol !== '.') {
                    this.rect(x + dx, y + dy, end - dx, 1, palette[symbol]);
                }
                dx = end;
            }
        });
    }
}

const SMALL_HEAD = [
    '.....NNNNNN.....',
    '....NRPPPRRN....',
    '...NRPRRRRRRN...',
    '...NPRRRrrrrRN..',
    '...NRrNNFFFFN...',
    '...NrNbIFNFIN...',
    '....NbFFfNFFfN..',
    '....NrNFFFFFN...',
    '..NNrRRRGINN....',
];

const SMALL_BODY: Record<Pose, string[]> = {
    idle: [
        '.NRRrNTTTJFN....',
        '..NNNNJTJNFN....',
        '....NFJGGJNN....',
        '....NNJJJJN.....',
    ],
    walk1: [
        'NRRrNNTTTJNN....',
        '.NNNFFJTJJNFN...',
        '...NNNJGGJNFN...',
        '....NNJJJJNN....',
    ],
    walk2: [
        '..NRrNTTTJNFN...',
        '...NNFJTJJNFN...',
        '....NFJGGJNN....',
        '....NNJJJJN.....',
    ],
    jump: [
        'NRRrNNTTTJNFFN..',
        '.NNNFFJTJJNNN...',
        '...NNNJGGJN.....',
        '....NNJJJJNN....',
    ],
};

const SMALL_LEGS: Record<Pose, string[]> = {
    idle: ['.....NDNNDN.....', '....NbONNbON....', '....NNNNNNNN....'],
    walk1: ['...NDDNN.NDDN...', '..NbONN...NbON..', '..NNNN....NNNN..'],
    walk2: ['.....NDDDN......', '.....NbObON.....', '.....NNNNNN.....'],
    jump: ['...NDDNNNDDN....', '...NbON..NbON...', '...NNNN..NNNN...'],
};

const TALL_HEAD = [
    '......NNNNN.....',
    '.....NRPPPRN....',
    '....NRPIIRRRN...',
    '...NRPRRRRRRRN..',
    '...NPRRRRRrrrN..',
    '...NRRRrNNNNNN..',
    '...NRrrNbFFFFN..',
    '...NRrNbFIFFIN..',
    '...NRrNbFNFFNN..',
    '....NrNbFNFFNfN.',
    '....NrNbFFfFFFN.',
    '....NNrNFFFFFN..',
    '...NNRRRNGINN...',
    '..NRPRRRRGN.....',
];

const TALL_BODY: Record<Pose, string[]> = {
    idle: [
        '..NRrrNTTTTJN...', '..NNNNNTTTJJNN..',
        '....NRNTITJJRFN.', '....NRNTTTJJRFN.',
        '....NrNTTTJJrFN.', '....NrNTTJbJrFN.',
        '....NFFJGGGJNN..', '....NFFJGOIJN...',
        '.....NJJJJJJN...', '.....NJJjjJJN...',
    ],
    walk1: [
        'NRPRrrNTTTTJN...', '.NRrrNNTTTJJNN..',
        '..NNNRNTITJJRFN.', '...NRRNTTTJJRFN.',
        '..NFFNNTTTJJrFN.', '..NFFNNTTJbJNN..',
        '...NNNJGGGGJN...', '.....NJGGOIJN...',
        '.....NJJJJJJN...', '....NJJjjJJJN...',
    ],
    walk2: [
        '..NRrrNTTTTJN...', '...NNNNTTTJJNN..',
        '.....RNTITJNRFN.', '.....RNTTTNRRFN.',
        '.....rNTTNFFNN..', '.....rNTTNFFN...',
        '.....NFJGGNNN...', '.....NFJGOIJN...',
        '.....NJJJJJJN...', '.....NJJjjJJN...',
    ],
    jump: [
        'NRPRrrNTTTTJNFN.', '.NRrrNNTTTJJNFN.',
        '..NNNRNTITJNRFN.', '...NFFNTTTJNRN..',
        '...NFFNTTTJJN...', '....NNNTTJbJN...',
        '.....NJGGGGJN...', '.....NJGGOIJN...',
        '....NJJJJJJJN...', '...NJJJjjJJJN...',
    ],
};

const TALL_LEGS: Record<Pose, string[]> = {
    idle: [
        '.....NDDNNDDN...', '.....NBDNNBDN...', '.....NBDNNBDN...', '.....NDDNNDDN...',
        '.....NbONNbON...', '.....NbONNbON...', '....NbOONNbOON..', '....NNNNNNNNNN..',
    ],
    walk1: [
        '....NDDNNNDDN...', '...NBDDN.NDDN...', '..NBDDN..NBDDN..', '..NDDN....NDDN..',
        '..NbON....NbON..', '.NbOON....NbON..', '.NNNNN....NbOON.', '.NNNN.....NNNNN.',
    ],
    walk2: [
        '.....NDDNNDDN...', '......NDDNDDN...', '......NBDDDN....', '......NDDDN.....',
        '......NbONN.....', '.....NbOObON....', '.....NNNbOON....', '........NNNN....',
    ],
    jump: [
        '..NDDDN.NDDDN...', '..NBDN..NBDDN...', '..NbON...NDDDN..', '..NbOON...NbON..',
        '..NNNNN...NbOON.', '...........NNNN.', '................', '................',
    ],
};

function explorer(p: PixelBrush, tall: boolean, fire: boolean, pose: Pose) {
    // Ember form keeps the red scarf but wears an ivory hood and coral coat.
    const palette = fire ? {
        ...PALETTE, P: PALETTE.I, R: PALETTE.Y, r: PALETTE.O,
        T: PALETTE.R, J: PALETTE.r, j: PALETTE.b,
    } : PALETTE;
    p.stamp(tall ? TALL_HEAD : SMALL_HEAD, 0, 0, palette);
    p.stamp(tall ? TALL_BODY[pose] : SMALL_BODY[pose], 0, tall ? 14 : 9, palette);
    p.stamp(tall ? TALL_LEGS[pose] : SMALL_LEGS[pose], 0, tall ? 24 : 13, palette);
    if (fire) {
        p.stamp(['RRRGI', 'rrRRG', '.rrNN'], 3, 12);
    }
}

function ground(p: PixelBrush, moss: boolean) {
    p.stamp([
        'SSSSSSSSNSSSSSSS',
        'BVVVBBBSNBVVVBBS',
        'VHBBSSBSNVBBSSBS',
        'VBSSSSBSNVBSSSBS',
        'BBSSSDDSNBSSSDDS',
        'SSSDDDDNNSSDDDDN',
        'NNNNNNNNNNNNNNNN',
        'SSSSNSSSSSSSSSSS',
        'BVBSNBVVVVBBBBBS',
        'VHBSNVHBBSBBSSBS',
        'VBSSNVBSSSSSSSBS',
        'SBDSNBBSSSBSSSDS',
        'SDDNNSSDDDDDDDDN',
        'NNNNNNNNNNNNNNNN',
        'SSSSSSSSSSNSSSSS',
        'BBVVVBBBBSNBVVBS',
    ]);
    if (moss) {
        p.stamp([
            'LLTTLTLTTLLTTLTL',
            'TJTJTTJJTJTJJTJT',
            'JJjJJjJJJJjJJjJJ',
            'jJjjJjJJjjJjjJjj',
            '.j..j.Jj..j..J..',
            '......j......j..',
        ]);
        p.rect(2, 1, 1, 1, PALETTE.I);
        p.rect(12, 2, 1, 1, PALETTE.G);
    }
}

function pipe(p: PixelBrush, cap: boolean) {
    p.stamp([
        'NjLTJJJJJJjjjjDN', 'NjITJJJJJJjjjjDN',
        'NjLTJJJJJJjjjjDN', 'NjLTJJJJJJjjjjDN',
        'NjLTJJJJJJjjjjDN', 'NjLTJJTJJJjjjjDN',
        'NjLTJTJTJJjjjjDN', 'NjLTJTjTJJjjjjDN',
        'NjLTJJTJJJjjjjDN', 'NjLTJJjJJJjjjjDN',
        'NjLTJJJJJJjjjjDN', 'NjLTJJJJJJjjjjDN',
        'NjLTJJJJJJjjjjDN', 'NjLTJJJJJJjjjjDN',
        'NjLTJJJJJJjjjjDN', 'NjLTJJJJJJjjjjDN',
    ]);
    if (cap) {
        p.stamp([
            'NNNNNNNNNNNNNNNN',
            'NILLLLLLLLLLLTJN',
            'NLTTTTTTTTTTJJjN',
            'NLTJJJJJJJJJjjjN',
            'NYGOJJJJJJJJOGYN',
            'NjjjjjjjjjjjjjDN',
            'NNNNNNNNNNNNNNNN',
        ]);
    }
}

function forestMushroom(p: PixelBrush, critter: boolean, walk = false, green = false) {
    const palette = green
        ? { ...PALETTE, R: PALETTE.T, r: PALETTE.J, P: PALETTE.L }
        : critter
            ? { ...PALETTE, R: PALETTE.O, r: PALETTE.b, P: PALETTE.G }
            : PALETTE;
    p.stamp([
        '.....NNNNNN.....',
        '...NNRPPPRRNN...',
        '..NRPIIRRRRRRN..',
        '..NPIIIRRRIRRN..',
        '.NRPIIRRRIIPRrN.',
        '.NPRRRRRRIIRRrN.',
        'NRRRIIRRRRRRRrrN',
        'NrrPIIRRRrrRRrrN',
        'NNrrrRRrrrrrrrNN',
        '.NYYYYYYYYYYYON.',
        '..NNNFFFFFNNNN..',
        '....NFINFIFN....',
        '....NFFNFNFN....',
        '....NfFFFFfN....',
    ], 0, 0, palette);
    p.stamp(critter
        ? (walk ? ['..NbONNNNbONN...', '..NNNN..NNNNN...'] : ['...NbONNNbONN...', '...NNNN.NNNNN...'])
        : ['....NfFIIIfN....', '.....NNNNNN.....'], 0, 14);
    if (critter) {
        // Low brows and amber cap make the walking woodland enemy distinct.
        p.stamp(['NN.F.NN', 'IN.F.IN'], 5, 10);
    }
}

const SHELL = [
    '.....NNNNNN.....',
    '...NNLTTTJJNN...',
    '..NLTTJjJJJJjN..',
    '.NLTTJTTjJJJjjN.',
    '.NTTJTTTJjJJjjN.',
    'NLTJTTTTTJjJJjjN',
    'NTJTTTTTTJjJJjjN',
    'NTJTTTTTTJjjJjjN',
    'NJJJJJJJJJjjjjjN',
    'NjTJTTTJTTJjjjjN',
    'NYIIIIIIIIIYYOON',
    '.NYYYYYYYYOOOON.',
    '..NNNNNNNNNNNN..',
];

function koopa(p: PixelBrush, walk: boolean) {
    p.stamp([
        '........NNNN....',
        '.......NYIIYN...',
        '......NYIIFFYN..',
        '......NYFINFIN..',
        '......NYFNNFNN..',
        '.......NFFFFFfN.',
        '.......NYFFFFFN.',
        '.......NYfNNNN..',
        '.......NYfN.....',
    ]);
    p.stamp(SHELL, 0, 8);
    p.stamp(walk ? [
        '..NYFN....NYFN..', '.NYFON.....NYFN.', '.NNNNN.....NNNN.',
    ] : [
        '...NYFN..NYFN...', '..NYFON..NYFON..', '..NNNNN..NNNNN..',
    ], 0, 21);
    p.stamp(['YFN', 'YfN', '.NN'], 12, 15);
}

/** A tiny moonlit observatory: copper dome, lantern windows, vines and masonry. */
function castle(p: PixelBrush) {
    const c = PALETTE;
    // Silhouette, stepped roof and central gold finial.
    p.rect(23, 0, 2, 6, c.N);
    p.rect(23, 1, 1, 3, c.I);
    p.rect(21, 4, 6, 2, c.N);
    p.rect(22, 4, 3, 1, c.G);
    for (let row = 0; row < 7; row++) {
        const left = 20 - row;
        p.rect(left, 6 + row, 48 - left * 2, 1, c.N);
        p.rect(left + 1, 6 + row, 46 - left * 2, 1, row < 3 ? c.T : c.J);
        p.rect(left + 2, 6 + row, 2, 1, c.L);
        p.rect(26 + row, 6 + row, 1, 1, c.j);
    }
    p.rect(12, 13, 24, 3, c.N);
    p.rect(13, 13, 22, 1, c.Y);
    p.rect(14, 14, 20, 1, c.O);
    p.rect(15, 16, 18, 27, c.N);
    p.rect(16, 16, 16, 27, c.B);
    p.rect(17, 16, 3, 26, c.V);
    p.rect(29, 16, 3, 27, c.S);
    // Flanking towers sit on the ground, their crenellations topped in moss.
    for (const x of [3, 33]) {
        p.rect(x, 23, 12, 23, c.N);
        p.rect(x + 1, 24, 10, 22, c.S);
        p.rect(x + 1, 25, 7, 19, c.B);
        for (const dx of [0, 5, 9]) {
            p.rect(x + dx, 20, 3, 5, c.N);
            p.rect(x + dx, 20, 3, 1, c.L);
            p.rect(x + dx + 1, 21, 2, 3, c.V);
        }
        p.rect(x, 24, 12, 1, c.H);
        for (let y = 28; y < 44; y += 5) {
            p.rect(x + 1, y, 10, 1, c.S);
            p.rect(x + (y % 2 ? 4 : 7), y + 1, 1, 4, c.S);
            p.rect(x + 2, y + 1, 2, 1, c.H);
        }
        p.stamp(['..NN..', '.NOYN.', '.NYIN.', '.NYGN.', '.NYGN.', 'NNNNNN', '.HOOH.'], x + 3, 27);
    }
    // Fine masonry joints in the keep.
    for (let y = 18; y < 44; y += 5) {
        p.rect(16, y, 16, 1, c.S);
        p.rect(y % 2 ? 20 : 27, y + 1, 1, 4, c.S);
        p.rect(17, y + 1, 2, 1, c.H);
    }
    // Gold-ringed rose window, with an ivory four-point star behind the mullions.
    p.stamp([
        '...NNNN...', '..NOYYON..', '.NOIYIYON.', 'NOIYNYIYON',
        'NYIYNYIYYN', 'NYNNINNNYN', 'NOIYNYIYON', '.NOIYIYON.',
        '..NOYYON..', '...NNNN...',
    ], 19, 17);
    // Recessed arched doorway and copper inlay.
    p.stamp([
        '....HHHH....', '...HOOOON...', '..HOYYYYON..', '.HOYNNNNYON.',
        '.HOYNbbNYON.', '.HOYNbbNYON.', '.HOYNbbNYON.', '.HOYNbbNYON.',
        '.HOYNbbNYON.', '.HOYNbGNYON.', '.HOYNbbNYON.', '.HOYNbbNYON.',
        '.HOYNbbNYON.', '.HOYNNNNYON.',
    ], 18, 31);
    // Vines weave down opposite walls, rather than obscuring the lit entrance.
    for (const [x, y] of [[4, 25], [38, 36], [13, 33]]) {
        p.stamp(['.j...', 'jTL..', '.j.TL', '.jJj.', 'LTj..', '..j..', '..jTL', '.Jj..'], x, y);
    }
    p.rect(2, 45, 44, 3, c.N);
    p.rect(3, 45, 42, 1, c.H);
    p.rect(4, 46, 40, 1, c.S);
    p.rect(17, 45, 14, 1, c.I);
    p.rect(16, 46, 16, 1, c.V);
    p.rect(15, 47, 18, 1, c.H);
}

/** Stable texture sizes are part of the collision contract; never trim sprites. */
export function generateTextures(scene: Scene) {
    const g = scene.make.graphics();
    const p = new PixelBrush(g);
    const bake = (key: string, width: number, height: number, draw: () => void) => {
        g.clear();
        draw();
        g.generateTexture(key, width, height);
    };

    try {
        for (const [key, tall, fire] of [
            ['mario', false, false], ['marioBig', true, false], ['marioFire', true, true],
        ] as const) {
            for (const [suffix, pose] of [
                ['', 'idle'], ['Walk1', 'walk1'], ['Walk2', 'walk2'], ['Jump', 'jump'],
            ] as const) {
                bake(key + suffix, 16, tall ? 32 : 16, () => explorer(p, tall, fire, pose));
            }
        }

        bake('ground', 16, 16, () => ground(p, true));
        bake('groundInner', 16, 16, () => ground(p, false));
        bake('pipe', 16, 16, () => pipe(p, false));
        bake('pipeTop', 16, 16, () => pipe(p, true));
        bake('brick', 16, 16, () => p.stamp([
            'NNNNNNNNNNNNNNNN', 'NVHHVVVNVBHHBBBN', 'NVVVVBVNVBBBBBSN', 'NVBVBBBNVBBBSBSN',
            'NVBBBBSNVBBSSSSN', 'NBBBBSSNBSSSSSSN', 'NSSSSSDNSSSSSSDN', 'NNNNNNNNNNNNNNNN',
            'VHHBNVHHVVVVNVBH', 'VVBBNVVVVBBBNVBB', 'VBBSNVVBBSBBNVBB', 'BBSSNVBBSBBBNVBS',
            'BSSSNBBSSSBSNBSS', 'SSSDNSSSSSSDNSSD', 'NNNNNNNNNNNNNNNN', 'BVVVVVVNVBVVVVVN',
        ]));
        bake('question', 16, 16, () => p.stamp([
            'NNNNNNNNNNNNNNNN', 'NIYYYYYYYYYYYYON', 'NYOGGGGGGGGGGOON', 'NYGNNGGGGGGNNGON',
            'NYGGGOIIIIGGGGON', 'NYGGOIIOOIIGGGON', 'NYGGGOOGOIIGGGON', 'NYGGGGGOIIOGGGON',
            'NYGGGGOIIOGGGGON', 'NYGGGGOIOGGGGGON', 'NYGGGGGOOGGGGGON', 'NYGGGGOIIGGGGGON',
            'NYGNNGGOOGGNNGON', 'NYOOOOOOOOOOOObN', 'NOOOOOOOOOOOObbN', 'NNNNNNNNNNNNNNNN',
        ]));
        bake('blockUsed', 16, 16, () => p.stamp([
            'NNNNNNNNNNNNNNNN', 'NVHHHHHHHHHHHBSN', 'NVBSSSSSSSSSSSDN', 'NVSONSSSSSSNOSDN',
            'NVBNNSSSSSSNNSDN', 'NVBSSSSSSSSSSSDN', 'NVBSSSSDDSSSSSDN', 'NVBSSSDBBDSSSSDN',
            'NVBSSSDBBDSSSSDN', 'NVBSSSSDDSSSSSDN', 'NVBSSSSSSSSSSSDN', 'NVBNNSSSSSSNNSDN',
            'NVBONSSSSSSNOSDN', 'NSDDDDDDDDDDDDDN', 'NDDDDDDDDDDDDDDN', 'NNNNNNNNNNNNNNNN',
        ]));
        bake('coin', 16, 16, () => p.stamp([
            '......NNNN......', '....NNYIYONN....', '...NYIYGGGOON...', '...NIYGOOOGOON..',
            '..NYIGOYIGGOON..', '..NIGGOYIGGObN..', '..NYGGOYIGGObN..', '..NYGGOYIGGObN..',
            '..NYGGOYIGGObN..', '..NYGGOYIGGObN..', '..NOGGOYIGGObN..', '..NOGGOOOGGObN..',
            '...NOGGGGGObN...', '...NNOOOOObNN...', '.....NNNNNN.....', '................',
        ]));

        bake('goomba', 16, 16, () => forestMushroom(p, true));
        bake('goombaWalk', 16, 16, () => forestMushroom(p, true, true));
        bake('mushroom', 16, 16, () => forestMushroom(p, false));
        bake('mushroom1up', 16, 16, () => forestMushroom(p, false, false, true));
        bake('koopa', 16, 24, () => koopa(p, false));
        bake('koopaWalk', 16, 24, () => koopa(p, true));
        bake('shell', 16, 16, () => p.stamp(SHELL, 0, 3));
        bake('flag', 16, 16, () => p.stamp([
            '......NYN.......', '......NIN.......', '......NINNNNN...', '......NINRPPPN..',
            '......NINRRIIRN.', '......NINRGIRRN.', '......NINRRGRN..', '......NINRRRN...',
            '......NINNNN....', '......NIN.......', '......NIN.......', '......NYN.......',
            '......NIN.......', '......NIN.......', '......NIN.......', '......NYN.......',
        ]));
        bake('fireFlower', 16, 16, () => p.stamp([
            '......NNNN......', '....NNRYYRNN....', '...NRPIIIYRRN...', '...NPIYYYYIRN...',
            '..NRIIYNYYIYRN..', '..NRIYYNYYIYRN..', '...NRYYYYYIRN...', '...NRRYYYRRRN...',
            '....NNRRRRNN....', '..NN..NJJN..NN..', '.NLTN.NTJN.NTLN.', '.NJLTNNTJNNTLJN.',
            '..NJLTNTJNTLJN..', '...NJTTTJTTJN...', '....NNJJJJNN....', '......NNNN......',
        ]));
        bake('fireball', 8, 8, () => p.stamp([
            '..RRR...', '.RPYRR..', 'RPIIYRR.', 'RYIIYPrR', 'RPYYYRrR', '.RRPRrr.', '..Rrrr..', '...rr...',
        ]));
        bake('castle', 48, 48, () => castle(p));
        bake('spark', 5, 5, () => p.stamp(['..Y..', '..I..', 'YIIIY', '..I..', '..Y..']));
        bake('mote', 2, 2, () => p.stamp(['IY', 'YG']));
        bake('leaf', 5, 3, () => p.stamp(['.LTT.', 'LTJJj', '.jj..']));
    } finally {
        g.destroy();
    }
}

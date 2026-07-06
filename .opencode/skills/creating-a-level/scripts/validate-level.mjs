#!/usr/bin/env node
// Validate authored level files for this Super Mario clone.
//
// Usage:
//   node validate-level.mjs [file ...]   # validate the given level-*.ts files
//   node validate-level.mjs              # validate every src/level/level-*.ts
//
// It parses the quoted tile rows straight out of the .ts source and checks the
// structural invariants TileMapBuilder / GameScene rely on. It CANNOT judge jump
// feel or reachability — always playtest as well. See ../SKILL.md.

import { readFileSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';

const LEGEND = new Set([...'-XPB?ULoMGKFC ']); // space = empty, like '-'
const SOLID = new Set(['X', 'P']); // inert static colliders (ground/step/pipe)
const H = 15; // GAME_HEIGHT(240) / TILE(16)

/** Pull the level's quoted rows out of a `level-*.ts` source string. */
function extractRows(src) {
    // Rows are single-quoted strings of legend chars, one tile per char.
    const matches = [...src.matchAll(/'([-XPB?ULoMGKFC ]{8,})'/g)];
    return matches.map((m) => m[1]);
}

/** Validate one file; return { file, errors[], warnings[], info }. */
function validate(file) {
    const errors = [];
    const warnings = [];
    const rows = extractRows(readFileSync(file, 'utf8'));

    if (rows.length === 0) {
        errors.push('no tile rows found (expected quoted rows of legend chars)');
        return { file, errors, warnings, info: '' };
    }
    if (rows.length !== H) errors.push(`row count ${rows.length}, expected ${H}`);

    // Width: ragged rows are legal (builder uses the longest) but discouraged.
    const width = Math.max(...rows.map((r) => r.length));
    if (rows.some((r) => r.length !== width)) {
        warnings.push(`ragged rows (widths ${Math.min(...rows.map((r) => r.length))}..${width}); pad to ${width} for readability`);
    }
    // Pad a working copy so column indexing past a short row reads as empty.
    const grid = rows.map((r) => r.padEnd(width, '-'));

    // Unknown characters (ignored by the parser, but usually a typo).
    grid.forEach((r, y) => {
        [...r].forEach((ch, x) => {
            if (!LEGEND.has(ch)) warnings.push(`unknown char '${ch}' at col ${x}, row ${y}`);
        });
    });

    const all = grid.join('');
    const countOf = (ch) => [...all].filter((c) => c === ch).length;
    for (const ch of ['M', 'F', 'C']) {
        const n = countOf(ch);
        if (n !== 1) errors.push(`expected exactly one '${ch}', found ${n}`);
    }

    const colOf = (ch) => {
        for (let y = 0; y < grid.length; y++) {
            const x = grid[y].indexOf(ch);
            if (x >= 0) return x;
        }
        return -1;
    };
    if (countOf('F') === 1 && countOf('C') === 1 && colOf('F') >= colOf('C')) {
        errors.push(`flag (col ${colOf('F')}) must be left of castle (col ${colOf('C')})`);
    }

    // Ground strip = bottom two rows. A pit is a gap in BOTH; a gap in only one
    // is a stray one-tile ledge, not a pit — flag the mismatch.
    if (grid.length >= 2) {
        const lower = grid[grid.length - 1];
        const upper = grid[grid.length - 2];
        for (let x = 0; x < width; x++) {
            if (SOLID.has(lower[x]) !== SOLID.has(upper[x])) {
                errors.push(`ground strip misaligned at col ${x}: '${upper[x]}' over '${lower[x]}' (a pit must gap both rows)`);
            }
        }
    }

    // Every actor that stands (M/G/K/C) needs a solid tile directly below it.
    grid.forEach((r, y) => {
        [...r].forEach((ch, x) => {
            if ('MGKC'.includes(ch)) {
                const below = y + 1 < grid.length ? grid[y + 1][x] : '-';
                if (!SOLID.has(below)) errors.push(`'${ch}' at col ${x}, row ${y} has no floor below (found '${below}')`);
            }
        });
    });

    const info = `${width}x${rows.length}, F@${colOf('F')} C@${colOf('C')}, enemies=${countOf('G') + countOf('K')}`;
    return { file, errors, warnings, info };
}

// --- entry point -------------------------------------------------------------
let files = process.argv.slice(2);
if (files.length === 0) {
    files = readdirSync('src/level')
        .filter((f) => /^level-.*\.ts$/.test(f))
        .map((f) => `src/level/${f}`);
}
if (files.length === 0) {
    console.error('no level files found (pass a path, or run from the repo root)');
    process.exit(2);
}

let failed = 0;
for (const file of files) {
    const { errors, warnings, info } = validate(file);
    const name = basename(file);
    if (errors.length === 0) {
        console.log(`OK   ${name}  (${info})`);
    } else {
        failed++;
        console.log(`FAIL ${name}`);
        for (const e of errors) console.log(`  - ${e}`);
    }
    for (const w of warnings) console.log(`  ! ${w}`);
}

console.log(`\n${files.length - failed}/${files.length} level(s) passed.`);
process.exit(failed ? 1 : 0);

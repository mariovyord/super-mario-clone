import { LEVEL_1_1 } from './level-1-1';
import { LEVEL_1_2 } from './level-1-2';

/**
 * A single playable course: a display label, the authored tile rows (see the
 * legend in `level-1-1.ts`), and an optional per-level sky colour. `GameScene`
 * builds `rows` through `TileMapBuilder`, so this stays purely declarative —
 * adding a course is appending an entry here, never touching scene wiring.
 */
export interface LevelDefinition {
    /** Display label shown in the HUD + title, e.g. "1-1". */
    name: string;
    /** Authored tile rows (see level-1-1.ts legend). */
    rows: string[];
    /** Optional per-level sky colour; defaults to classic SMB blue. */
    backgroundColor?: string;
}

/**
 * Ordered course list — the index is the progression order and matches the
 * `levelIndex` registry key GameScene reads in `create()`. Clearing a flagpole
 * advances the index; clearing the last course triggers the victory path.
 */
export const LEVELS: LevelDefinition[] = [
    { name: '1-1', rows: LEVEL_1_1 },
    { name: '1-2', rows: LEVEL_1_2, backgroundColor: '#6ab0ff' },
];

import type { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { createBackdrop } from './Scenery';

/** Shared, asset-free presentation for the woodland edition. */
export const UI = {
    ink: 0x0b1825,
    panel: 0x112632,
    gold: 0xe7bd75,
    jade: 0x87c9ad,
    coral: 0xec927d,
    ivory: '#f5edd9',
    muted: '#aac1b9',
    goldText: '#e7bd75',
    jadeText: '#87c9ad',
    coralText: '#ec927d',
};

export function label(scene: Scene, x: number, y: number, text: string, size = 8,
    color = UI.ivory): Phaser.GameObjects.Text {
    return scene.add.text(x, y, text, {
        fontFamily: 'monospace', fontSize: `${size}px`, color,
        padding: { top: 1, bottom: 1 },
        shadow: { offsetX: 0, offsetY: 1, color: '#07121d', blur: 0, fill: true },
    }).setOrigin(0.5).setDepth(30);
}

export function heading(scene: Scene, y: number, text: string, size = 24,
    color = UI.ivory): Phaser.GameObjects.Text {
    return label(scene, GAME_WIDTH / 2, y, text, size, color)
        .setFontFamily('Georgia, serif').setFontStyle('bold');
}

/** A tiny four-point trail marker, with hairline rules on either side. */
export function ornament(scene: Scene, y: number, width = 90, color = UI.gold): void {
    const cx = GAME_WIDTH / 2;
    const g = scene.add.graphics().setDepth(25);
    g.fillStyle(color, 0.35);
    g.fillRect(cx - width / 2, y, width / 2 - 8, 1);
    g.fillRect(cx + 8, y, width / 2 - 8, 1);
    g.fillStyle(color, 1);
    g.fillRect(cx - 1, y - 3, 2, 7);
    g.fillRect(cx - 3, y - 1, 6, 3);
}

export function card(scene: Scene, x: number, y: number, width: number, height: number,
    accent = UI.gold): void {
    const g = scene.add.graphics().setDepth(20);
    g.fillStyle(UI.ink, 0.4).fillRect(x + 3, y + 4, width, height);
    g.fillStyle(UI.panel, 0.94).fillRect(x, y, width, height);
    g.lineStyle(1, accent, 0.35).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    g.fillStyle(accent, 0.9);
    for (const edge of [x, x + width - 7]) {
        g.fillRect(edge, y, 7, 1);
        g.fillRect(edge, y + height - 1, 7, 1);
    }
}

export function menuBackdrop(scene: Scene, index = 0): void {
    createBackdrop(scene, index);
    scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, UI.ink, 0.38)
        .setOrigin(0).setDepth(10);
    const frame = scene.add.graphics().setDepth(15);
    frame.lineStyle(1, UI.gold, 0.23).strokeRect(8.5, 8.5, GAME_WIDTH - 17, GAME_HEIGHT - 17);
    frame.fillStyle(UI.gold, 0.8);
    for (const x of [8, GAME_WIDTH - 9]) {
        for (const y of [8, GAME_HEIGHT - 9]) frame.fillRect(x - 1, y - 1, 3, 3);
    }
}

import { AUTO, Game, Scale } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ZOOM, GRAVITY_Y } from './config/constants';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { PauseScene } from './scenes/PauseScene';
import { TouchControlsScene } from './scenes/TouchControlsScene';
import { LevelIntroScene } from './scenes/LevelIntroScene';
import { GameOverScene } from './scenes/GameOverScene';
import { EndingScene } from './scenes/EndingScene';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#5c94fc',

    // Chunky retro pixels: no smoothing, snap to integer positions.
    pixelArt: true,
    roundPixels: true,

    // NES viewport (256x240) scaled up 3x -> 768x720, fitted + centered to any
    // viewport so the renderer is already device-agnostic (mobile-ready).
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        zoom: ZOOM,
    },

    // Fixed timestep so tuned constants feel identical on 60/120/144 Hz displays.
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: GRAVITY_Y },
            fps: 60,
            fixedStep: true,
            debug: false,
        },
    },

    // Solo front-end scenes are appended after the parallel overlays (UI, Pause,
    // Touch) so the overlays' render order is undisturbed. LevelIntro / GameOver
    // / Ending each own the whole screen, so their list position doesn't matter.
    scene: [
        BootScene,
        PreloadScene,
        TitleScene,
        GameScene,
        UIScene,
        PauseScene,
        TouchControlsScene,
        LevelIntroScene,
        GameOverScene,
        EndingScene,
    ],
};

const game = new Game(config);

// Keep the canvas fitted on window resize / orientation change.
window.addEventListener('resize', () => game.scale.refresh());

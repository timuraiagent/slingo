import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MatchScene } from './scenes/MatchScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { BASE_W, BASE_H } from './constants.js';

const config = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  parent: 'game-wrapper',
  backgroundColor: '#0D0D1A',
  resolution: window.devicePixelRatio || 1,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, MenuScene, MatchScene, ResultsScene],
  input: {
    activePointers: 3,
  },
};

const game = new Phaser.Game(config);

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MatchScene } from './scenes/MatchScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1080,
  height: 2340,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  resolution: window.devicePixelRatio || 1,
  scene: [BootScene, PreloadScene, MenuScene, MatchScene, ResultsScene],
  audio: {
    disableWebAudio: false,
  },
};

const game = new Phaser.Game(config);
window.game = game;

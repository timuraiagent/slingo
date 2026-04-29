import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MatchScene } from './scenes/MatchScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-wrapper',
  backgroundColor: '#0D0D1A',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 360, height: 640 },
  },
  scene: [BootScene, PreloadScene, MenuScene, MatchScene, ResultsScene],
  input: {
    activePointers: 3,
  },
};

const game = new Phaser.Game(config);

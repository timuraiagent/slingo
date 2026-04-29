import Phaser from 'phaser';
import { COLOR } from '../constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  preload() {
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1E1E3A, 1);
    barBg.lineStyle(1, 0x3A3A60, 1);
    barBg.fillRoundedRect(240, 940, 600, 24, 12);

    const barFill = this.add.graphics();
    this.load.on('progress', (v) => {
      barFill.clear();
      barFill.fillStyle(0xFFD700, 1);
      barFill.fillRoundedRect(240, 940, 600 * v, 24, 12);
    });

    // Images — adapted to actual asset filenames (G01–G13, flat directory)
    this.load.image('logo',                'G01.png');
    this.load.image('btn-spin-normal',     'G02-normal.png');
    this.load.image('btn-spin-pressed',    'G02-pressed.png');
    this.load.image('btn-jackpot-empty',   'G03-empty.png');
    this.load.image('btn-jackpot-charged', 'G03-charged.png');
    this.load.image('btn-speed-normal',    'G04-normal.png');
    this.load.image('btn-speed-double',    'G04-double.png');
    this.load.image('sym-jackpot',         'G05.png');
    this.load.image('sym-wild',            'G06.png');
    this.load.image('sym-multiplier',      'G07.png');
    this.load.image('overlay-bingo',       'G08.png');
    this.load.spritesheet('confetti',      'G09.png', { frameWidth: 20, frameHeight: 20 });
    this.load.image('particle-sparkle',    'G10.png');
    this.load.image('particle-spark',      'G11.png');
    this.load.image('reel-result-row',     'G12.png');
    this.load.image('popup-jackpot',       'G13.png');

    // Audio — 10 SFX pairs (mp3 + ogg)
    const audioKeys = [
      'reel-spin', 'reel-stop', 'useful-hit', 'near-hit',
      'jackpot-segment', 'jackpot-earned', 'perfect-timing',
      'cell-close', 'bingo-win', 'pressure-start',
    ];
    audioKeys.forEach((k) => {
      this.load.audio(k, `assets/audio/${k}.mp3`);
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}

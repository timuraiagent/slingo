import Phaser from 'phaser';
import { COLOR } from '../constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;
    const sf = Math.min(W / 1080, H / 2340);

    const barW = Math.round(600 * sf);
    const barH = Math.round(24 * sf);
    const barX = (W - barW) / 2;
    const barY = H * 0.4;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1E1E3A, 1);
    barBg.lineStyle(1, 0x3A3A60, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 12);

    const barFill = this.add.graphics();
    this.load.on('progress', (v) => {
      barFill.clear();
      barFill.fillStyle(0xFFD700, 1);
      barFill.fillRoundedRect(barX, barY, barW * v, barH, 12);
    });

    // Images
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
  }

  create() {
    this.scene.start('MatchScene');
  }
}

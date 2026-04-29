import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1E1E3A, 1);
    barBg.lineStyle(1, 0x3A3A60, 1);
    barBg.fillRoundedRect(cx - 300, cy - 12, 600, 24, 12);
    barBg.strokeRoundedRect(cx - 300, cy - 12, 600, 24, 12);

    const barFill = this.add.graphics();
    this.load.on('progress', v => {
      barFill.clear();
      barFill.fillStyle(0xFFD700, 1);
      barFill.fillRoundedRect(cx - 300, cy - 12, 600 * v, 24, 12);
    });

    // Images — flat assets/ directory, ID-based filenames
    this.load.image('logo', 'assets/G01.png');
    this.load.image('btn-spin-normal', 'assets/G02-normal.png');
    this.load.image('btn-spin-pressed', 'assets/G02-pressed.png');
    this.load.image('btn-jackpot-empty', 'assets/G03-empty.png');
    this.load.image('btn-jackpot-charged', 'assets/G03-charged.png');
    this.load.image('btn-speed-normal', 'assets/G04-normal.png');
    this.load.image('btn-speed-double', 'assets/G04-double.png');
    this.load.image('sym-jackpot', 'assets/G05.png');
    this.load.image('sym-wild', 'assets/G06.png');
    this.load.image('sym-multiplier', 'assets/G07.png');
    this.load.image('overlay-bingo', 'assets/G08.png');
    this.load.spritesheet('confetti', 'assets/G09.png', { frameWidth: 20, frameHeight: 20 });
    this.load.image('particle-sparkle', 'assets/G10.png');
    this.load.image('particle-spark', 'assets/G11.png');
    this.load.image('reel-result-row', 'assets/G12.png');
    this.load.image('popup-jackpot', 'assets/G13.png');

    // Audio (10 pairs)
    const audioKeys = [
      'reel-spin', 'reel-stop', 'useful-hit', 'near-hit',
      'jackpot-segment', 'jackpot-earned', 'perfect-timing',
      'cell-close', 'bingo-win', 'pressure-start',
    ];
    for (const k of audioKeys) {
      this.load.audio(k, [`assets/audio/${k}.mp3`, `assets/audio/${k}.ogg`]);
    }

    this.load.on('loaderror', (file) => {
      // Gracefully ignore missing audio files until Phase 10
      console.warn('Asset load failed (ignored):', file.key, file.type);
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}

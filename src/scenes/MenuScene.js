import Phaser from 'phaser';
import { drawBackground, makeTextButton } from '../utils/draw.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    drawBackground(this);

    const logo = this.add.image(this.scale.width / 2, 600, 'logo');
    logo.setScale(0.9);

    const playBtn = makeTextButton(this, this.scale.width / 2, 1400, 400, 120, 'PLAY', {
      fontSize: '48px',
    });

    playBtn.on('pointerdown', () => {
      this.scene.start('MatchScene');
    });
  }
}

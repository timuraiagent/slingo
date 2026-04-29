import Phaser from 'phaser';
import { drawBackground, makeTextButton } from '../utils/draw.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    drawBackground(this);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.image(cx, cy - 300, 'logo').setOrigin(0.5);

    makeTextButton(this, cx, cy + 200, 320, 100, 'PLAY', { fontSize: '40px' }, () => {
      this.scene.start('MatchScene');
    });
  }
}

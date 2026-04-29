import Phaser from 'phaser';
import { drawBackground, makeTextButton } from '../utils/draw.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    drawBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const sf = Math.min(W / 1080, H / 2340);
    const cx = W / 2;

    const logo = this.add.image(cx, H * 0.25, 'logo');
    logo.setScale(0.9 * sf);

    const playBtn = makeTextButton(this, cx, H * 0.6,
      Math.round(400 * sf), Math.round(120 * sf), 'PLAY', {
        fontSize: `${Math.round(48 * sf)}px`,
      });

    playBtn.on('pointerdown', () => {
      this.scene.start('MatchScene');
    });
  }
}

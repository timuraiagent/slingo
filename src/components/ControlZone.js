import Phaser from 'phaser';
import { bus } from '../utils/eventBus.js';

export class ControlZone {
  constructor(scene, x, y, onSpin, onJackpot, onSpeed) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.onSpin = onSpin;
    this.onJackpot = onJackpot;
    this.onSpeed = onSpeed;

    this.hasJackpotBall = false;
    this.fastMode = false;

    this._createButtons();
  }

  _createButtons() {
    // SPIN button
    this.spinBtn = this.scene.add.image(this.x, this.y, 'btn-spin-normal')
      .setOrigin(0.5)
      .setInteractive();
    this.spinBtn.on('pointerdown', () => {
      this.spinBtn.setTexture('btn-spin-pressed');
    });
    this.spinBtn.on('pointerup', () => {
      this.spinBtn.setTexture('btn-spin-normal');
      if (this.onSpin) this.onSpin();
    });
    this.spinBtn.on('pointerout', () => {
      this.spinBtn.setTexture('btn-spin-normal');
    });

    // JACKPOT button
    this.jackpotBtn = this.scene.add.image(this.x - 260, this.y + 20, 'btn-jackpot-empty')
      .setOrigin(0.5)
      .setInteractive();
    this.jackpotBtn.on('pointerup', () => {
      if (this.onJackpot) this.onJackpot();
    });

    // SPEED button
    this.speedBtn = this.scene.add.image(this.x + 260, this.y + 20, 'btn-speed-normal')
      .setOrigin(0.5)
      .setInteractive();
    this.speedBtn.on('pointerup', () => {
      this.fastMode = !this.fastMode;
      this.speedBtn.setTexture(this.fastMode ? 'btn-speed-double' : 'btn-speed-normal');
      if (this.onSpeed) this.onSpeed(this.fastMode);
    });

    // Wild badge (hidden by default)
    this.wildBadge = this.scene.add.text(this.x - 340, this.y - 20, '🌟', {
      fontSize: '28px',
    }).setOrigin(0.5).setVisible(false);
  }

  setJackpotAvailable(hasBall) {
    this.hasJackpotBall = hasBall;
    this.jackpotBtn.setTexture(hasBall ? 'btn-jackpot-charged' : 'btn-jackpot-empty');
    this.jackpotBtn.setAlpha(hasBall ? 1 : 0.6);
  }

  setWildAvailable(hasWild) {
    this.wildBadge.setVisible(hasWild);
  }

  disableAll() {
    this.spinBtn.disableInteractive();
    this.jackpotBtn.disableInteractive();
    this.speedBtn.disableInteractive();
    this.spinBtn.setAlpha(0.4);
    this.jackpotBtn.setAlpha(0.4);
    this.speedBtn.setAlpha(0.4);
  }

  enableAll() {
    this.spinBtn.setInteractive();
    this.jackpotBtn.setInteractive();
    this.speedBtn.setInteractive();
    this.spinBtn.setAlpha(1);
    this.setJackpotAvailable(this.hasJackpotBall);
    this.speedBtn.setAlpha(1);
  }

  enableSpinOnly() {
    this.spinBtn.setInteractive();
    this.spinBtn.setAlpha(1);
    this.jackpotBtn.disableInteractive();
    this.jackpotBtn.setAlpha(0.4);
    this.speedBtn.disableInteractive();
    this.speedBtn.setAlpha(0.4);
  }

  destroy() {
    this.spinBtn.destroy();
    this.jackpotBtn.destroy();
    this.speedBtn.destroy();
    this.wildBadge.destroy();
  }
}

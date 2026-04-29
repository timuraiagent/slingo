import { COLOR, FONT } from '../constants.js';

export class ControlZone {
  constructor(scene, x, y, W) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.W = W;
    this.fastMode = false;
    this.hasWildBall = false;

    const btnY = y + 80;
    const spinX = x + W / 2;
    const jackpotX = x + W * 0.2;
    const speedX = x + W * 0.8;

    // SPIN button — fires on pointerdown for faster feel
    this.spinBtn = scene.add.image(spinX, btnY, 'btn-spin-normal')
      .setInteractive({ useHandCursor: true })
      .setDepth(5);

    this.spinBtn.on('pointerdown', () => {
      this.spinBtn.setTexture('btn-spin-pressed');
      if (this.onSpin) this.onSpin();
    });
    this.spinBtn.on('pointerup', () => {
      this.spinBtn.setTexture('btn-spin-normal');
    });
    this.spinBtn.on('pointerupoutside', () => {
      this.spinBtn.setTexture('btn-spin-normal');
    });

    // JACKPOT button
    this.jackpotBtn = scene.add.image(jackpotX, btnY, 'btn-jackpot-empty')
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.4)
      .setDepth(5);

    this.jackpotBtn.on('pointerdown', () => {
      if (this.onJackpot) this.onJackpot();
    });

    // Speed toggle
    this.speedBtn = scene.add.image(speedX, btnY, 'btn-speed-normal')
      .setInteractive({ useHandCursor: true })
      .setDepth(5);

    this.speedBtn.on('pointerdown', () => {
      this.fastMode = !this.fastMode;
      this.speedBtn.setTexture(this.fastMode ? 'btn-speed-double' : 'btn-speed-normal');
      if (this.onSpeedToggle) this.onSpeedToggle(this.fastMode);
    });

    // Wild ball indicator (initially hidden)
    this.wildBadge = scene.add.text(jackpotX + 60, btnY - 40, '🌟', {
      fontSize: '28px',
    }).setOrigin(0.5).setAlpha(0).setDepth(6).setInteractive({ useHandCursor: true });

    this.wildBadge.on('pointerdown', () => {
      if (this.hasWildBall && this.onWildBall) this.onWildBall();
    });
  }

  setSpinEnabled(enabled) {
    this.spinBtn.setAlpha(enabled ? 1 : 0.4);
    if (enabled) {
      this.spinBtn.setInteractive();
    } else {
      this.spinBtn.disableInteractive();
    }
  }

  setJackpotHasBall(hasBall) {
    this.jackpotBtn.setTexture(hasBall ? 'btn-jackpot-charged' : 'btn-jackpot-empty');
    this.jackpotBtn.setAlpha(hasBall ? 1 : 0.4);
    if (hasBall) {
      this.jackpotBtn.setInteractive();
    } else {
      this.jackpotBtn.disableInteractive();
    }
  }

  setWildBadge(visible) {
    this.hasWildBall = visible;
    this.wildBadge.setAlpha(visible ? 1 : 0);
    if (visible) {
      this.wildBadge.setInteractive({ useHandCursor: true });
    } else {
      this.wildBadge.disableInteractive();
    }
  }

  disableAll() {
    this.spinBtn.disableInteractive().setAlpha(0.4);
    this.jackpotBtn.disableInteractive().setAlpha(0.4);
    this.speedBtn.disableInteractive().setAlpha(0.4);
    this.wildBadge.disableInteractive().setAlpha(0);
  }

  destroy() {}
}

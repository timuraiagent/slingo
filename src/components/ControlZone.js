import { COLOR, FONT } from '../constants.js';

export class ControlZone {
  constructor(scene, x, y, W, L) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.W = W;
    this.L = L;
    this.fastMode = false;
    this.hasWildBall = false;

    const sf = L.sf;
    const ch = L.CONTROL_HEIGHT;
    const btnY = y + ch * 0.5;
    const spinX = x + W / 2;
    const jackpotX = x + W * 0.18;
    const speedX = x + W * 0.82;

    // SPIN button
    const spinW = Math.round(280 * sf);
    const spinH = Math.round(120 * sf);
    this.spinBtn = scene.add.image(spinX, btnY, 'btn-spin-normal')
      .setDisplaySize(spinW, spinH)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);

    this.spinBtn.on('pointerdown', () => {
      this.spinBtn.setTexture('btn-spin-pressed');
      if (this._spinTween) { this._spinTween.stop(); this._spinTween = null; }
      this.spinBtn.setScale(1);
      if (this.onSpin) this.onSpin();
    });
    this.spinBtn.on('pointerup', () => {
      this.spinBtn.setTexture('btn-spin-normal');
    });
    this.spinBtn.on('pointerupoutside', () => {
      this.spinBtn.setTexture('btn-spin-normal');
    });

    // JACKPOT button
    const jackpotW = Math.round(180 * sf);
    const jackpotH = Math.round(100 * sf);
    this.jackpotBtn = scene.add.image(jackpotX, btnY, 'btn-jackpot-empty')
      .setDisplaySize(jackpotW, jackpotH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.4)
      .setDepth(5);

    this.jackpotBtn.on('pointerdown', () => {
      if (this.onJackpot) this.onJackpot();
    });

    // Speed toggle
    const speedW = Math.round(100 * sf);
    const speedH = Math.round(80 * sf);
    this.speedBtn = scene.add.image(speedX, btnY, 'btn-speed-normal')
      .setDisplaySize(speedW, speedH)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);

    this.speedBtn.on('pointerdown', () => {
      this.fastMode = !this.fastMode;
      this.speedBtn.setTexture(this.fastMode ? 'btn-speed-double' : 'btn-speed-normal');
      if (this.onSpeedToggle) this.onSpeedToggle(this.fastMode);
    });

    // Wild ball indicator — centered between JACKPOT and SPIN buttons
    const wildX = (jackpotX + spinX) / 2;
    this.wildBadge = scene.add.text(wildX, btnY, '🌟', {
      fontSize: `${Math.round(70 * sf)}px`,
    }).setOrigin(0.5).setAlpha(0).setDepth(6).setInteractive({ useHandCursor: true });

    this.wildBadge.on('pointerdown', () => {
      if (this.hasWildBall && this.onWildBall) this.onWildBall();
    });
  }

  setSpinEnabled(enabled) {
    this.spinBtn.setTexture('btn-spin-normal');
    this.spinBtn.setAlpha(enabled ? 1 : 0.4);

    // Stop existing pulse tween if any
    if (this._spinTween) {
      this._spinTween.stop();
      this._spinTween = null;
      this.spinBtn.setScale(1);
    }

    if (enabled) {
      this.spinBtn.setInteractive();
      this._spinTween = this.scene.tweens.add({
        targets: this.spinBtn,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.spinBtn.disableInteractive();
      this.spinBtn.setScale(1);
    }
  }

  setJackpotHasBall(hasBall) {
    this.jackpotBtn.setTexture(hasBall ? 'btn-jackpot-charged' : 'btn-jackpot-empty');
    this.jackpotBtn.setAlpha(hasBall ? 1 : 0.4);

    // Stop existing throbbing tween if any
    if (this._jackpotTween) {
      this._jackpotTween.stop();
      this._jackpotTween = null;
    }

    if (hasBall) {
      this.jackpotBtn.setInteractive();
      this._jackpotTween = this.scene.tweens.add({
        targets: this.jackpotBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.jackpotBtn.disableInteractive();
      this.jackpotBtn.setScale(1);
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
    if (this._spinTween) { this._spinTween.stop(); this._spinTween = null; }
    if (this._jackpotTween) { this._jackpotTween.stop(); this._jackpotTween = null; }
    this.spinBtn.disableInteractive().setAlpha(0.4).setScale(1);
    this.jackpotBtn.disableInteractive().setAlpha(0.4).setScale(1);
    this.speedBtn.disableInteractive().setAlpha(0.4);
    this.wildBadge.disableInteractive().setAlpha(0);
  }

  destroy() {}
}

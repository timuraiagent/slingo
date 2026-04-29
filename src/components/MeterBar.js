import Phaser from 'phaser';
import { COLOR, FONT } from '../constants.js';
import { bus } from '../utils/eventBus.js';

const SEG_W = 140;
const SEG_H = 36;
const SEG_GAP = 8;

export class MeterBar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.segments = [];
    this._handlers = [];

    this._createSegments();
    this._createLabels();

    this._on('meter:jackpot:updated', (v) => this._drawSegments(Math.floor(v / 20)), this);
    this._on('meter:jackpot:earned', () => this._onEarned(), this);
    this._on('streak:updated', (count) => this._updateStreak(count), this);
    this._on('streak:broken', () => this._updateStreak(0), this);
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
    this.segments.forEach((g) => g.destroy());
    this.segments = [];
    if (this.streakText) this.streakText.destroy();
    if (this.streakBg) this.streakBg.destroy();
    if (this.jackpotLabel) this.jackpotLabel.destroy();
  }

  _createSegments() {
    this.jackpotLabel = this.scene.add.text(this.x, this.y - 32, 'JACKPOT', {
      ...FONT.UI, fontSize: '28px', color: '#FFD700',
    }).setOrigin(0, 0.5);

    for (let i = 0; i < 5; i++) {
      const gfx = this.scene.add.graphics();
      this.segments.push(gfx);
    }
    this._drawSegments(0);
  }

  _drawSegments(filledCount) {
    this.segments.forEach((gfx, i) => {
      gfx.clear();
      const xPos = this.x + i * (SEG_W + SEG_GAP);
      const filled = i < filledCount;
      gfx.fillStyle(filled ? COLOR.GOLD : COLOR.BG_LIGHT, 1);
      gfx.lineStyle(2, filled ? COLOR.GOLD : COLOR.BORDER, 1);
      gfx.fillRoundedRect(xPos, this.y, SEG_W, SEG_H, 8);
      gfx.strokeRoundedRect(xPos, this.y, SEG_W, SEG_H, 8);
    });
  }

  _onEarned() {
    this.segments.forEach((gfx) => {
      gfx.setAlpha(0);
      this.scene.tweens.add({ targets: gfx, alpha: 1, duration: 100, yoyo: true, repeat: 3 });
    });
    this.scene.time.delayedCall(600, () => this._drawSegments(0));
  }

  _createLabels() {
    this.streakBg = this.scene.add.graphics();
    const sx = this.x + 5 * (SEG_W + SEG_GAP) + 40;
    this.streakX = sx;
    this.streakBg.fillStyle(COLOR.BG_LIGHT, 1);
    this.streakBg.lineStyle(1.5, COLOR.BORDER, 1);
    this.streakBg.fillRoundedRect(sx, this.y, 110, SEG_H, 18);
    this.streakBg.strokeRoundedRect(sx, this.y, 110, SEG_H, 18);

    this.streakText = this.scene.add.text(sx + 55, this.y + SEG_H / 2, 'STREAK x0', {
      ...FONT.UI, fontSize: '18px', color: '#FFFFFF',
    }).setOrigin(0.5);
  }

  _updateStreak(count) {
    this.streakText.setText(`STREAK x${count}`);
    this.streakBg.clear();
    const fill = count >= 3 ? COLOR.ORANGE_HOT : COLOR.BG_LIGHT;
    const border = count >= 3 ? COLOR.ORANGE_HOT : COLOR.BORDER;
    this.streakBg.fillStyle(fill, 1);
    this.streakBg.lineStyle(1.5, border, 1);
    this.streakBg.fillRoundedRect(this.streakX, this.y, 110, SEG_H, 18);
    this.streakBg.strokeRoundedRect(this.streakX, this.y, 110, SEG_H, 18);
  }
}

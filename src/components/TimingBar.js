import Phaser from 'phaser';
import { COLOR, FONT } from '../constants.js';
import { bus } from '../utils/eventBus.js';
import { TimingManager } from '../managers/TimingManager.js';

const BAR_W = 960;
const BAR_H = 80;

export class TimingBar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.manager = new TimingManager();
    this.tween = null;
    this.active = false;

    this._drawBar();
    this._createMarker();
    this._createLabel();
  }

  _drawBar() {
    const zones = [
      { pct: 0.10, color: COLOR.GREY },
      { pct: 0.20, color: COLOR.GOLD_DARK },
      { pct: 0.12, color: COLOR.ORANGE_HOT },
      { pct: 0.16, color: COLOR.GOLD },
      { pct: 0.12, color: COLOR.ORANGE_HOT },
      { pct: 0.20, color: COLOR.GOLD_DARK },
      { pct: 0.10, color: COLOR.GREY },
    ];
    let xCursor = this.x;
    const barGfx = this.scene.add.graphics();
    zones.forEach(z => {
      const zW = BAR_W * z.pct;
      barGfx.fillStyle(z.color, 1);
      barGfx.fillRect(xCursor, this.y, zW, BAR_H);
      xCursor += zW;
    });
    barGfx.lineStyle(2, COLOR.BORDER, 1);
    barGfx.strokeRoundedRect(this.x, this.y, BAR_W, BAR_H, 40);
  }

  _createMarker() {
    this.marker = this.scene.add.graphics();
    this.marker.fillStyle(COLOR.WHITE, 1);
    this.marker.fillRoundedRect(-8, -48, 16, 96, 8);
    this.marker.x = this.x;
    this.marker.y = this.y + BAR_H / 2;
  }

  _createLabel() {
    this.label = this.scene.add.text(this.x, this.y - 20, '', {
      ...FONT.UI, fontSize: '28px', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 1).setAlpha(0);
  }

  activate(fast = false) {
    this.active = true;
    this.marker.x = this.x;
    const duration = fast ? 1500 : 3000;
    if (this.tween) this.tween.stop();
    this.tween = this.scene.tweens.add({
      targets: this.marker,
      x: this.x + BAR_W,
      duration,
      ease: 'Linear',
      repeat: -1,
    });
  }

  lock() {
    if (!this.active) return null;
    this.active = false;
    if (this.tween) { this.tween.pause(); }
    const position = Phaser.Math.Clamp((this.marker.x - this.x) / BAR_W, 0, 1);
    const zone = this.manager.getZone(position);
    const bias = this.manager.getBiasMultiplier(zone);
    this._showLabel(zone);
    if (zone === 'PERFECT') bus.emit('timing:perfect');
    return { position, zone, bias };
  }

  reset() {
    this.active = false;
    if (this.tween) { this.tween.stop(); this.tween = null; }
    this.marker.x = this.x;
    this.label.setAlpha(0);
  }

  _showLabel(zone) {
    const LABELS = {
      PERFECT: ['PERFECT!', '#FFD700'],
      GREAT: ['GREAT', '#FF8C00'],
      GOOD: ['GOOD', '#B8860B'],
      MISS: ['MISS', '#4A4A6A'],
    };
    const [text, color] = LABELS[zone];
    this.label.setText(text);
    this.label.setColor(color);
    this.label.x = this.marker.x;
    this.label.setAlpha(1);
    this.scene.tweens.add({
      targets: this.label,
      alpha: 0,
      delay: 400,
      duration: 200,
    });
  }

  setSpeedFactor(factor) {
    // factor 1.2 = pressure phase speed-up
    if (this.tween && this.active) {
      const currentProgress = (this.marker.x - this.x) / BAR_W;
      const remaining = 1 - currentProgress;
      const baseDuration = 3000;
      const newDuration = (baseDuration * remaining) / factor;
      this.tween.stop();
      this.tween = this.scene.tweens.add({
        targets: this.marker,
        x: this.x + BAR_W,
        duration: newDuration,
        ease: 'Linear',
      });
    }
  }

  destroy() {
    if (this.tween) this.tween.stop();
    this.marker.destroy();
    this.label.destroy();
  }
}

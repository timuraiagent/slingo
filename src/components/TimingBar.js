import Phaser from 'phaser';
import { COLOR, FONT } from '../constants.js';
import { TimingManager } from '../managers/TimingManager.js';
import { bus } from '../utils/eventBus.js';

const BAR_W = 960;
const BAR_H = 60;
const MARKER_H = 76;

const ZONES = [
  { pct: 0.10, color: COLOR.GREY },
  { pct: 0.20, color: COLOR.GOLD_DARK },
  { pct: 0.12, color: COLOR.ORANGE_HOT },
  { pct: 0.16, color: COLOR.GOLD },
  { pct: 0.12, color: COLOR.ORANGE_HOT },
  { pct: 0.20, color: COLOR.GOLD_DARK },
  { pct: 0.10, color: COLOR.GREY },
];

const ZONE_LABELS = {
  PERFECT: ['PERFECT!', '#FFD700'],
  GREAT:   ['GREAT', '#FF8C00'],
  GOOD:    ['GOOD', '#B8860B'],
  MISS:    ['MISS', '#4A4A6A'],
};

export class TimingBar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.barX = x - BAR_W / 2;
    this.barY = y;
    this.timingManager = new TimingManager();
    this.active = false;
    this.locked = false;
    this.markerTween = null;
    this.baseDuration = 3000;

    // Draw zones
    this.barGfx = scene.add.graphics();
    let xCursor = this.barX;
    ZONES.forEach(z => {
      const zW = BAR_W * z.pct;
      this.barGfx.fillStyle(z.color, 1);
      this.barGfx.fillRect(xCursor, this.barY, zW, BAR_H);
      xCursor += zW;
    });
    this.barGfx.lineStyle(2, COLOR.BORDER, 1);
    this.barGfx.strokeRoundedRect(this.barX, this.barY, BAR_W, BAR_H, 30);

    // Marker
    this.marker = scene.add.graphics();
    this.marker.fillStyle(COLOR.WHITE, 1);
    this.marker.fillRoundedRect(-8, -MARKER_H / 2, 16, MARKER_H, 8);
    this.marker.setPosition(this.barX, this.barY + BAR_H / 2);
    this.marker.setDepth(5);

    // Zone label
    this.zoneLabel = scene.add.text(0, 0, '', {
      ...FONT.UI, fontSize: '28px', color: '#FFD700',
      stroke: '#0D0D1A', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0).setDepth(6);
  }

  activate(fastMode = false) {
    this.active = true;
    this.locked = false;
    const duration = fastMode ? this.baseDuration / 2 : this.baseDuration;

    this.marker.setPosition(this.barX, this.barY + BAR_H / 2);

    this.markerTween = this.scene.tweens.add({
      targets: this.marker,
      x: { from: this.barX, to: this.barX + BAR_W },
      duration,
      ease: 'Linear',
      repeat: -1,
    });
  }

  lock() {
    if (!this.active || this.locked) return null;
    this.locked = true;

    if (this.markerTween) {
      this.markerTween.stop();
      this.markerTween = null;
    }

    const position = (this.marker.x - this.barX) / BAR_W;
    const clampedPos = Phaser.Math.Clamp(position, 0, 1);
    const zone = this.timingManager.getZone(clampedPos);

    const [label, color] = ZONE_LABELS[zone];
    this.zoneLabel.setText(label).setColor(color);
    this.zoneLabel.setPosition(this.marker.x, this.barY - 20);
    this.zoneLabel.setAlpha(1);

    this.scene.tweens.add({
      targets: this.zoneLabel,
      alpha: 0,
      duration: 500,
      delay: 300,
    });

    if (zone === 'PERFECT') {
      bus.emit('timing:perfect');
    }

    bus.emit('timing:zone', { zone, position: clampedPos });
    return { zone, position: clampedPos };
  }

  reset() {
    this.active = false;
    this.locked = false;
    if (this.markerTween) {
      this.markerTween.stop();
      this.markerTween = null;
    }
    this.marker.setPosition(this.barX, this.barY + BAR_H / 2);
  }

  setSpeed(fastMode) {
    if (this.markerTween && this.active && !this.locked) {
      this.markerTween.stop();
      const duration = fastMode ? this.baseDuration / 2 : this.baseDuration;
      // Reset marker to start before starting new tween
      this.marker.x = this.barX;
      this.markerTween = this.scene.tweens.add({
        targets: this.marker,
        x: { from: this.barX, to: this.barX + BAR_W },
        duration,
        ease: 'Linear',
        repeat: -1,
      });
    }
  }

  deactivate() {
    this.reset();
  }

  destroy() {
    if (this.markerTween) {
      this.markerTween.stop();
    }
  }
}

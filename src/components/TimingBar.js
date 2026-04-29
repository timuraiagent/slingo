import Phaser from 'phaser';
import { COLOR, FONT } from '../constants.js';
import { TimingManager } from '../managers/TimingManager.js';
import { bus } from '../utils/eventBus.js';

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
  constructor(scene, x, y, L) {
    this.scene = scene;
    this.L = L;
    this.timingManager = new TimingManager();
    this.active = false;
    this.locked = false;
    this.baseDuration = 3000;
    this._elapsed = 0;
    this._fastMode = false;
    this._direction = 1; // 1 = forward (left→right), -1 = backward (right→left)
    this._pendingAutoLock = false;

    const BAR_W = Math.round(Math.min(L.W - 60, 960 * L.sf));
    const BAR_H = L.TIMING_HEIGHT;
    const MARKER_H = BAR_H + Math.round(20 * L.sf);

    this.BAR_W = BAR_W;
    this.BAR_H = BAR_H;
    this.MARKER_H = MARKER_H;

    this.barX = x - BAR_W / 2;
    this.barY = y;

    // Draw zones clipped to pill shape
    this.barGfx = scene.add.graphics();
    const radius = BAR_H / 2;

    // Fill rounded pill background first (acts as clip via layering)
    this.barGfx.fillStyle(COLOR.GREY, 1);
    this.barGfx.fillRoundedRect(this.barX, this.barY, BAR_W, BAR_H, radius);

    // Overwrite with zone colors using fillRect (will be masked by a geometry mask)
    let xCursor = this.barX;
    ZONES.forEach(z => {
      const zW = BAR_W * z.pct;
      this.barGfx.fillStyle(z.color, 1);
      this.barGfx.fillRect(xCursor, this.barY, zW, BAR_H);
      xCursor += zW;
    });

    // Clip the zone fills to the pill shape using a geometry mask
    const maskGfx = scene.add.graphics();
    maskGfx.fillStyle(0xFFFFFF, 1);
    maskGfx.fillRoundedRect(this.barX, this.barY, BAR_W, BAR_H, radius);
    maskGfx.setAlpha(0);
    const barMask = maskGfx.createGeometryMask();
    this.barGfx.setMask(barMask);

    // Rounded pill border overlay
    const borderGfx = scene.add.graphics();
    borderGfx.lineStyle(2, COLOR.BORDER, 1);
    borderGfx.strokeRoundedRect(this.barX, this.barY, BAR_W, BAR_H, radius);
    borderGfx.setDepth(4);

    // Marker
    this.marker = scene.add.graphics();
    this.marker.fillStyle(COLOR.WHITE, 1);
    const markerW = Math.round(20 * L.sf);
    this.marker.fillRoundedRect(-markerW / 2, -MARKER_H / 2, markerW, MARKER_H, markerW / 2);
    this.marker.setPosition(this.barX, this.barY + BAR_H / 2);
    this.marker.setDepth(5);

    // Zone label
    this.zoneLabel = scene.add.text(0, 0, '', {
      ...FONT.UI, fontSize: `${Math.round(BAR_H * 0.5)}px`, color: '#FFD700',
      stroke: '#0D0D1A', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(6);
  }

  activate(fastMode = false) {
    this.active = true;
    this.locked = false;
    this._pendingAutoLock = false;
    this._fastMode = fastMode;

    const currentPosition = Phaser.Math.Clamp(
      (this.marker.x - this.barX) / this.BAR_W, 0, 1
    );

    const duration = fastMode ? this.baseDuration / 2 : this.baseDuration;

    // Calculate _elapsed so the marker continues from its current position
    // in the same direction it was going
    if (this._direction === 1) {
      this._elapsed = currentPosition * duration;
    } else {
      this._elapsed = duration + (1 - currentPosition) * duration;
    }
  }

  lock() {
    if (!this.active || this.locked) return null;
    this.locked = true;

    const position = (this.marker.x - this.barX) / this.BAR_W;
    const clampedPos = Phaser.Math.Clamp(position, 0, 1);
    const zone = this.timingManager.getZone(clampedPos);

    const [label, color] = ZONE_LABELS[zone];
    this.zoneLabel.setText(label).setColor(color);
    this.zoneLabel.setPosition(this.marker.x, this.barY - this.BAR_H * 0.4);
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
    this._pendingAutoLock = false;
  }

  setSpeed(fastMode) {
    this._fastMode = fastMode;
    // Recalculate _elapsed so position is preserved with new speed
    if (this.active && !this.locked) {
      const currentPosition = Phaser.Math.Clamp(
        (this.marker.x - this.barX) / this.BAR_W, 0, 1
      );
      const duration = fastMode ? this.baseDuration / 2 : this.baseDuration;
      if (this._direction === 1) {
        this._elapsed = currentPosition * duration;
      } else {
        this._elapsed = duration + (1 - currentPosition) * duration;
      }
    }
  }

  update(delta) {
    if (!this.active || this.locked) return;

    // Cap delta to prevent large jumps (e.g., after loading)
    this._elapsed += Math.min(delta, 100);
    const duration = this._fastMode ? this.baseDuration / 2 : this.baseDuration;
    const cycleTime = this._elapsed % (duration * 2);

    let position;
    if (cycleTime < duration) {
      position = cycleTime / duration;
      this._direction = 1;
    } else {
      position = 1 - (cycleTime - duration) / duration;
      this._direction = -1;
    }

    this.marker.setPosition(
      this.barX + position * this.BAR_W,
      this.barY + this.BAR_H / 2
    );

    // Auto-lock: when requested, lock as soon as marker enters MISS zone
    if (this._pendingAutoLock) {
      const zone = this.timingManager.getZone(position);
      if (zone === 'MISS') {
        this._pendingAutoLock = false;
        const result = this.lock();
        if (result) {
          bus.emit('timing:autoLocked', result);
        }
      }
    }
  }

  deactivate() {
    this.reset();
  }

  requestAutoLock() {
    this._pendingAutoLock = true;
  }

  destroy() {}
}

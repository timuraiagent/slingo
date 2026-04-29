import { COLOR, FONT, METER_HEIGHT } from '../constants.js';
import { bus } from '../utils/eventBus.js';

const SEGMENTS = 5;
const SEG_W = 140;
const SEG_H = 36;
const SEG_GAP = 8;

export class MeterBar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this._handlers = [];
    this.segments = [];

    // JACKPOT label
    scene.add.text(x, y - 8, 'JACKPOT', {
      ...FONT.UI, fontSize: '18px', color: '#FFD700',
    }).setOrigin(0, 1);

    // Segments
    for (let i = 0; i < SEGMENTS; i++) {
      const gfx = scene.add.graphics();
      gfx.setPosition(x + i * (SEG_W + SEG_GAP), y + 4);
      this._drawSegment(gfx, false);
      this.segments.push(gfx);
    }

    // Streak badge
    const badgeX = x + SEGMENTS * (SEG_W + SEG_GAP) + 20;
    const badgeGfx = scene.add.graphics();
    badgeGfx.fillStyle(COLOR.BG_LIGHT, 1);
    badgeGfx.lineStyle(1.5, COLOR.BORDER, 1);
    badgeGfx.fillRoundedRect(badgeX, y + 4, 160, SEG_H, 18);
    badgeGfx.strokeRoundedRect(badgeX, y + 4, 160, SEG_H, 18);
    this.streakBg = badgeGfx;

    this.streakText = scene.add.text(badgeX + 80, y + 4 + SEG_H / 2, '🔥 ×0', {
      ...FONT.UI, fontSize: '20px', color: '#FFFFFF',
    }).setOrigin(0.5);

    // Bus listeners
    this._on('meter:jackpot:updated', (value) => this._onJackpotUpdated(value));
    this._on('meter:jackpot:earned', () => this._onJackpotEarned());
    this._on('streak:updated', (count) => this._onStreakUpdated(count));
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }

  _drawSegment(gfx, filled) {
    gfx.clear();
    gfx.fillStyle(filled ? COLOR.GOLD : COLOR.GREY, 1);
    gfx.lineStyle(1, filled ? COLOR.GOLD : COLOR.BORDER, 1);
    gfx.fillRoundedRect(0, 0, SEG_W, SEG_H, 8);
    gfx.strokeRoundedRect(0, 0, SEG_W, SEG_H, 8);
  }

  _onJackpotUpdated(value) {
    const filledCount = Math.floor(value / 20);
    this.segments.forEach((gfx, i) => {
      this._drawSegment(gfx, i < filledCount);
    });
  }

  _onJackpotEarned() {
    // Flash all segments 3 times, then reset
    let flashes = 0;
    const flashInterval = this.scene.time.addEvent({
      delay: 150,
      repeat: 5,
      callback: () => {
        const show = flashes % 2 === 0;
        this.segments.forEach(gfx => gfx.setAlpha(show ? 1 : 0.3));
        flashes++;
        if (flashes >= 6) {
          this.segments.forEach(gfx => {
            gfx.setAlpha(1);
            this._drawSegment(gfx, false);
          });
        }
      },
    });
  }

  _onStreakUpdated(count) {
    this.streakText.setText(`🔥 ×${count}`);
    // Color at 3+
    if (count >= 3) {
      this.streakBg.clear();
      this.streakBg.fillStyle(COLOR.ORANGE_HOT, 1);
      this.streakBg.lineStyle(1.5, COLOR.GOLD_DARK, 1);
      const badgeX = this.x + SEGMENTS * (SEG_W + SEG_GAP) + 20;
      this.streakBg.fillRoundedRect(badgeX, this.y + 4, 160, SEG_H, 18);
      this.streakBg.strokeRoundedRect(badgeX, this.y + 4, 160, SEG_H, 18);
    } else {
      this.streakBg.clear();
      this.streakBg.fillStyle(COLOR.BG_LIGHT, 1);
      this.streakBg.lineStyle(1.5, COLOR.BORDER, 1);
      const badgeX = this.x + SEGMENTS * (SEG_W + SEG_GAP) + 20;
      this.streakBg.fillRoundedRect(badgeX, this.y + 4, 160, SEG_H, 18);
      this.streakBg.strokeRoundedRect(badgeX, this.y + 4, 160, SEG_H, 18);
    }
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
  }
}

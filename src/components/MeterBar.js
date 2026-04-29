import { COLOR, FONT } from '../constants.js';
import { bus } from '../utils/eventBus.js';

const SEGMENTS = 5;

export class MeterBar {
  constructor(scene, x, y, L) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.L = L;
    this._handlers = [];
    this.segments = [];

    const CARD_W = L.CARD_W;
    const SEG_H = Math.round(36 * L.sf);
    const SEG_W = Math.round((CARD_W - (SEGMENTS - 1) * 8 * L.sf) / SEGMENTS);
    const SEG_GAP = Math.round(8 * L.sf);
    this.SEG_W = SEG_W;
    this.SEG_H = SEG_H;
    this.SEG_GAP = SEG_GAP;

    // JACKPOT label — gold, centered, larger
    scene.add.text(x + CARD_W / 2, y - 4, 'JACKPOT', {
      ...FONT.UI, fontSize: `${Math.round(SEG_H * 0.55)}px`, color: '#FFD700',
    }).setOrigin(0.5, 1);

    // Segments
    for (let i = 0; i < SEGMENTS; i++) {
      const gfx = scene.add.graphics();
      gfx.setPosition(x + i * (SEG_W + SEG_GAP), y + 4);
      this._drawSegment(gfx, false);
      this.segments.push(gfx);
    }

    // Bus listeners (streak is now in HUD, not here)
    this._on('meter:jackpot:updated', (value) => this._onJackpotUpdated(value));
    this._on('meter:jackpot:earned', () => this._onJackpotEarned());
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }

  _drawSegment(gfx, filled) {
    const SEG_W = this.SEG_W;
    const SEG_H = this.SEG_H;
    gfx.clear();
    gfx.fillStyle(filled ? COLOR.GOLD : COLOR.GREY, 1);
    gfx.lineStyle(1, filled ? COLOR.GOLD : COLOR.BORDER, 1);
    gfx.fillRoundedRect(0, 0, SEG_W, SEG_H, 8);
    gfx.strokeRoundedRect(0, 0, SEG_W, SEG_H, 8);

    // Inner highlight stroke for empty segments
    if (!filled) {
      gfx.lineStyle(1, 0x5A5A7A, 0.3);
      gfx.strokeRoundedRect(2, 2, SEG_W - 4, SEG_H - 4, 6);
    }
  }

  _onJackpotUpdated(value) {
    const filledCount = Math.floor(value / 20);
    this.segments.forEach((gfx, i) => {
      this._drawSegment(gfx, i < filledCount);
    });
  }

  _onJackpotEarned() {
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

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
    this.segments = [];
  }
}

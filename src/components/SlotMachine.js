import { COLOR, FONT } from '../constants.js';
import { bus } from '../utils/eventBus.js';
import { SYMBOLS } from '../data/symbolDefinitions.js';

const REEL_COUNT = 5;
const STRIP_LENGTH = 16;

export class SlotMachine {
  constructor(scene, x, y, rng, L) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.rng = rng;
    this.L = L;
    this.reels = [];
    this.spinning = false;
    this.results = null;

    const SYMBOL_W = L.SYMBOL_W;
    const SYMBOL_H = L.SYMBOL_H;
    const REEL_W = SYMBOL_W;
    const REEL_H = SYMBOL_H * 3;
    const REEL_GAP = Math.round(8 * L.sf);
    const PADDING = Math.floor(Math.min(40 * L.sf, (L.W - REEL_COUNT * REEL_W - (REEL_COUNT - 1) * REEL_GAP) / 2));
    const SLOT_W = REEL_COUNT * REEL_W + (REEL_COUNT - 1) * REEL_GAP + PADDING * 2;
    const SLOT_H = REEL_H;
    const CLIP_TOP = 0;
    const CLIP_BOT = 0;

    this.SYMBOL_W = SYMBOL_W;
    this.SYMBOL_H = SYMBOL_H;
    this.REEL_W = REEL_W;
    this.REEL_H = REEL_H;
    this.REEL_GAP = REEL_GAP;
    this.PADDING = PADDING;
    this.SLOT_W = SLOT_W;
    this.SLOT_H = SLOT_H;

    const slotX = x - SLOT_W / 2;
    const slotY = y;
    this.slotX = slotX;
    this.slotY = slotY;

    // Outer frame background
    this.frame = scene.add.graphics();
    this.frame.fillStyle(COLOR.BG_DARK, 1);
    this.frame.fillRoundedRect(slotX, slotY, SLOT_W, SLOT_H, 24);

    // Per-reel backgrounds + masks + strips
    const innerX = slotX + PADDING;

    for (let i = 0; i < REEL_COUNT; i++) {
      const reelX = innerX + i * (REEL_W + REEL_GAP);

      // Reel bg
      const rbg = scene.add.graphics();
      rbg.fillStyle(0x13131F, 1);
      rbg.lineStyle(1, 0x2A2A50, 1);
      rbg.fillRect(reelX, slotY + CLIP_TOP, REEL_W, SLOT_H - CLIP_TOP - CLIP_BOT);
      rbg.strokeRect(reelX, slotY + CLIP_TOP, REEL_W, SLOT_H - CLIP_TOP - CLIP_BOT);

      // Geometry mask — positioned at strip location, drawn in local coords
      const maskGfx = scene.add.graphics();
      maskGfx.setPosition(reelX + REEL_W / 2, slotY + CLIP_TOP);
      maskGfx.setAlpha(0);
      maskGfx.fillRect(-REEL_W / 2, 0, REEL_W, SLOT_H - CLIP_TOP - CLIP_BOT);
      const mask = maskGfx.createGeometryMask();

      // Scrolling strip container
      const strip = scene.add.container(reelX + REEL_W / 2, slotY + CLIP_TOP);
      strip.setDepth(5);

      const symbols = [];
      for (let s = 0; s < STRIP_LENGTH; s++) {
        const sym = this._makeSymbol(s, null);
        symbols.push(sym);
        strip.add(sym);
      }

      strip.setMask(mask);

      // Flash overlay
      const flash = scene.add.graphics();
      flash.fillStyle(0xFFFFFF, 1);
      flash.fillRect(reelX, slotY + CLIP_TOP + SYMBOL_H, REEL_W, SYMBOL_H);
      flash.setAlpha(0);
      flash.setDepth(6);

      // Result row highlight
      const resultHighlight = scene.add.graphics();
      resultHighlight.lineStyle(2, COLOR.GOLD, 0.8);
      resultHighlight.lineBetween(reelX, slotY + CLIP_TOP + SYMBOL_H, reelX + REEL_W, slotY + CLIP_TOP + SYMBOL_H);
      resultHighlight.lineBetween(reelX, slotY + CLIP_TOP + SYMBOL_H * 2, reelX + REEL_W, slotY + CLIP_TOP + SYMBOL_H * 2);
      resultHighlight.fillStyle(COLOR.GOLD, 0.08);
      resultHighlight.fillRect(reelX, slotY + CLIP_TOP + SYMBOL_H, REEL_W, SYMBOL_H);
      resultHighlight.setDepth(10);

      this.reels.push({
        strip, symbols, mask, maskGfx, flash, rbg, resultHighlight,
        reelX, slotY,
        resultSymbol: null,
      });
    }

    // Foreground covers — hide reel content that overflows the frame edges
    this.covers = scene.add.graphics();
    this.covers.setDepth(8);
    this.covers.fillStyle(COLOR.BG_DARK, 1);

    // Top edge cover (inside frame, above visible area)
    this.covers.fillRect(slotX, slotY, SLOT_W, CLIP_TOP);

    // Bottom edge cover (inside frame, below visible area)
    this.covers.fillRect(slotX, slotY + SLOT_H - CLIP_BOT, SLOT_W, CLIP_BOT);

    // Left padding cover
    this.covers.fillRect(slotX, slotY + CLIP_TOP, PADDING, SLOT_H - CLIP_TOP - CLIP_BOT);

    // Right padding cover
    this.covers.fillRect(slotX + SLOT_W - PADDING, slotY + CLIP_TOP, PADDING, SLOT_H - CLIP_TOP - CLIP_BOT);

    // Between-reel gap covers
    for (let i = 0; i < REEL_COUNT - 1; i++) {
      const gapX = innerX + i * (REEL_W + REEL_GAP) + REEL_W;
      this.covers.fillRect(gapX, slotY + CLIP_TOP, REEL_GAP, SLOT_H - CLIP_TOP - CLIP_BOT);
    }

    // Frame border on top
    const frameBorder = scene.add.graphics();
    frameBorder.lineStyle(3, COLOR.BORDER, 1);
    frameBorder.strokeRoundedRect(slotX, slotY, SLOT_W, SLOT_H, 24);
    frameBorder.setDepth(11);
    this.frameBorder = frameBorder;
  }

  _makeSymbol(index, symbolDef) {
    const SYMBOL_W = this.SYMBOL_W;
    const SYMBOL_H = this.SYMBOL_H;
    const container = this.scene.add.container(0, index * SYMBOL_H + SYMBOL_H / 2);

    if (symbolDef && symbolDef.id === 'jackpot') {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x2A1A00, 1);
      bg.lineStyle(2, COLOR.GOLD, 0.8);
      bg.fillRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      bg.strokeRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      container.add(bg);
      container.add(this.scene.add.text(0, 0, '★', {
        ...FONT.UI, fontSize: `${Math.round(SYMBOL_H * 0.5)}px`, color: '#FFD700',
      }).setOrigin(0.5));
    } else if (symbolDef && symbolDef.id === 'wild') {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x1A0030, 1);
      bg.lineStyle(2, COLOR.PURPLE, 0.8);
      bg.fillRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      bg.strokeRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      container.add(bg);
      container.add(this.scene.add.text(0, 0, 'W', {
        ...FONT.UI, fontSize: `${Math.round(SYMBOL_H * 0.5)}px`, color: '#B060E0',
      }).setOrigin(0.5));
    } else if (symbolDef && symbolDef.id === 'multiplier') {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x2A1500, 1);
      bg.lineStyle(2, COLOR.ORANGE_HOT, 0.8);
      bg.fillRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      bg.strokeRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      container.add(bg);
      container.add(this.scene.add.text(0, 0, '×2', {
        ...FONT.UI, fontSize: `${Math.round(SYMBOL_H * 0.5)}px`, color: '#FF8C00',
      }).setOrigin(0.5));
    } else {
      const bg = this.scene.add.graphics();
      bg.fillStyle(COLOR.BG_LIGHT, 1);
      bg.lineStyle(1, COLOR.BORDER, 1);
      bg.fillRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      bg.strokeRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      container.add(bg);

      const label = symbolDef ? String(symbolDef.label) : String(this.rng.intBetween(1, 75));
      const txt = this.scene.add.text(0, 0, label, {
        ...FONT.NUMBER, fontSize: `${Math.round(SYMBOL_H * 0.4)}px`, color: '#F0F0FF',
      }).setOrigin(0.5);
      container.add(txt);
    }

    return container;
  }

  spin(results) {
    if (this.spinning) return;
    this.spinning = true;
    this.results = results;

    bus.emit('slot:spinning');

    let stoppedCount = 0;

    for (let i = 0; i < REEL_COUNT; i++) {
      const reel = this.reels[i];
      const resultSymbol = results[i];

      // Rebuild strip with result at position that will land in the middle row
      reel.strip.removeAll(true);
      const resultIndex = STRIP_LENGTH - 3;

      for (let s = 0; s < STRIP_LENGTH; s++) {
        let sym;
        if (s === resultIndex) {
          sym = this._makeSymbol(s, resultSymbol);
        } else if (s === resultIndex - 1 || s === resultIndex + 1) {
          sym = this._makeSymbol(s, { id: 'number', label: this.rng.intBetween(1, 75) });
        } else {
          sym = this._makeSymbol(s, null);
        }
        reel.symbols[s] = sym;
        reel.strip.add(sym);
      }

      // Reset strip position
      const startY = this.slotY;
      reel.strip.y = startY;

      // Target y so resultIndex lands at the middle row
      const targetY = startY - (resultIndex - 1) * this.SYMBOL_H;

      // Staggered start
      this.scene.time.delayedCall(i * 80, () => {
        this.scene.tweens.add({
          targets: reel.strip,
          y: targetY + 8,
          duration: 800 + i * 200,
          ease: 'Power2.easeOut',
          onComplete: () => {
            this.scene.tweens.add({
              targets: reel.strip,
              y: targetY,
              duration: 120,
              ease: 'Bounce.easeOut',
              onComplete: () => {
                reel.flash.setAlpha(0.5);
                // Result symbol wobble
                const resultSym = reel.symbols[13];
                if (resultSym) {
                  resultSym.setAngle(-2);
                  this.scene.tweens.add({ targets: resultSym, angle: 0, duration: 150, ease: 'Back.easeOut' });
                }
                this.scene.tweens.add({
                  targets: reel.flash,
                  alpha: 0,
                  duration: 100,
                });

                bus.emit('reel:stopped', { reelIndex: i, symbol: resultSymbol });
                stoppedCount++;

                if (stoppedCount === REEL_COUNT) {
                  this.spinning = false;
                  bus.emit('slot:complete', { results });
                }
              },
            });
          },
        });
      });
    }
  }

  highlightReel(index) {
    const reel = this.reels[index];
    if (!reel) return;
    reel.flash.clear();
    reel.flash.fillStyle(0xFFD700, 1);
    reel.flash.fillRect(0, 0, this.REEL_W, this.SYMBOL_H);
    reel.flash.setAlpha(0.6);
    this.scene.tweens.add({ targets: reel.flash, alpha: 0, duration: 300, ease: 'Sine.easeOut' });
    const midSymbol = reel.symbols[13];
    if (midSymbol) {
      this.scene.tweens.add({ targets: midSymbol, scaleX: 1.1, scaleY: 1.1, duration: 75, yoyo: true, ease: 'Sine.easeOut' });
    }
  }

  destroy() {
    this.reels.forEach(r => {
      r.strip.destroy();
      r.mask.destroy();
      r.maskGfx.destroy();
      r.flash.destroy();
      r.rbg.destroy();
      r.resultHighlight.destroy();
    });
    this.reels = [];
    if (this.frame) this.frame.destroy();
    if (this.frameBorder) this.frameBorder.destroy();
    if (this.covers) this.covers.destroy();
  }
}

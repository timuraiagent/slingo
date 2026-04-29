import { COLOR, FONT } from '../constants.js';
import { bus } from '../utils/eventBus.js';
import { SYMBOLS } from '../data/symbolDefinitions.js';

const REEL_COUNT = 5;
const SYMBOL_H = 140;
const SYMBOL_W = 168;
const REEL_W = SYMBOL_W;
const REEL_H = SYMBOL_H * 3;
const STRIP_LENGTH = 16;
const SLOT_W = REEL_COUNT * REEL_W + (REEL_COUNT - 1) * 12 + 80;

export class SlotMachine {
  constructor(scene, x, y, rng) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.rng = rng;
    this.reels = [];
    this.spinning = false;
    this.results = null;

    const slotX = x - SLOT_W / 2;
    const slotY = y;
    const slotH = REEL_H;

    // Outer frame
    this.frame = scene.add.graphics();
    this.frame.fillStyle(COLOR.BG_DARK, 1);
    this.frame.lineStyle(3, COLOR.BORDER, 1);
    this.frame.fillRoundedRect(slotX, slotY, SLOT_W, slotH, 24);
    this.frame.strokeRoundedRect(slotX, slotY, SLOT_W, slotH, 24);

    // Per-reel backgrounds + masks
    const innerX = slotX + 40;

    for (let i = 0; i < REEL_COUNT; i++) {
      const reelX = innerX + i * (REEL_W + 12);

      // Reel bg
      const rbg = scene.add.graphics();
      rbg.fillStyle(0x13131F, 1);
      rbg.lineStyle(1, 0x2A2A50, 1);
      rbg.fillRect(reelX, slotY + 10, REEL_W, slotH - 20);

      // Mask for the reel area
      const maskGfx = scene.make.graphics();
      maskGfx.fillRect(reelX, slotY + 10, REEL_W, slotH - 20);
      const mask = maskGfx.createGeometryMask();

      // Create the scrolling strip container
      const strip = scene.add.container(reelX + REEL_W / 2, slotY + 10);

      // Build initial symbols for the strip
      const symbols = [];
      for (let s = 0; s < STRIP_LENGTH; s++) {
        const sym = this._makeSymbol(s, null);
        symbols.push(sym);
        strip.add(sym);
      }
      strip.y = slotY + 10;

      // Apply mask
      strip.setMask(mask);

      // Flash overlay
      const flash = scene.add.graphics();
      flash.fillStyle(0xFFFFFF, 1);
      flash.fillRect(reelX, slotY + 10 + SYMBOL_H, REEL_W, SYMBOL_H);
      flash.setAlpha(0);

      this.reels.push({
        strip, symbols, mask, maskGfx, flash, rbg,
        reelX, slotY,
        resultSymbol: null,
      });
    }

    // Result row indicator image
    const resultRowY = slotY + 10 + SYMBOL_H - 8;
    if (scene.textures.exists('reel-result-row')) {
      this.resultRowImg = scene.add.image(slotX + SLOT_W / 2, resultRowY + SYMBOL_H / 2 + 8, 'reel-result-row')
        .setDisplaySize(SLOT_W - 20, SYMBOL_H + 16)
        .setDepth(10);
    }
  }

  _makeSymbol(index, symbolDef) {
    const container = this.scene.add.container(0, index * SYMBOL_H + SYMBOL_H / 2);

    if (symbolDef && symbolDef.id === 'jackpot') {
      container.add(this.scene.add.image(0, 0, 'sym-jackpot').setScale(0.85));
    } else if (symbolDef && symbolDef.id === 'wild') {
      container.add(this.scene.add.image(0, 0, 'sym-wild').setScale(0.85));
    } else if (symbolDef && symbolDef.id === 'multiplier') {
      container.add(this.scene.add.image(0, 0, 'sym-multiplier').setScale(0.85));
    } else {
      const bg = this.scene.add.graphics();
      bg.fillStyle(COLOR.BG_LIGHT, 1);
      bg.lineStyle(1, COLOR.BORDER, 1);
      bg.fillRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      bg.strokeRoundedRect(-SYMBOL_W / 2 + 8, -SYMBOL_H / 2 + 5, SYMBOL_W - 16, SYMBOL_H - 10, 10);
      container.add(bg);

      const label = symbolDef ? String(symbolDef.label) : String(this.rng.intBetween(1, 75));
      const txt = this.scene.add.text(0, 0, label, {
        ...FONT.NUMBER, fontSize: '36px', color: '#F0F0FF',
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
      const startY = this.y + 10;
      reel.strip.y = startY;

      // Target y so resultIndex lands at the middle row
      const targetY = startY - (resultIndex - 1) * SYMBOL_H;

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
              duration: 100,
              ease: 'Sine.easeOut',
              onComplete: () => {
                reel.flash.setAlpha(0.5);
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

  destroy() {
    this.reels.forEach(r => {
      r.strip.destroy();
      r.mask.destroy();
      r.maskGfx.destroy();
      r.flash.destroy();
      r.rbg.destroy();
    });
    this.reels = [];
    if (this.frame) this.frame.destroy();
    if (this.resultRowImg) this.resultRowImg.destroy();
  }
}

import Phaser from 'phaser';
import { COLOR, FONT } from '../constants.js';
import { bus } from '../utils/eventBus.js';
import { rollSymbolType } from '../data/symbolDefinitions.js';
import { COLUMN_RANGES } from '../constants.js';

export const REEL_W = 152;
export const REEL_H = 340;
const SYMBOL_H = 100;
const SYMBOL_GAP = 10;
const REEL_GAP = 10;
export const SLOT_W = 5 * REEL_W + 4 * REEL_GAP + 40;
export const SLOT_H = REEL_H + 40;

export class SlotMachine {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.reels = [];
    this.flashGraphics = [];
    this.masks = [];
    this.payline = null;

    this._createChrome();
    this._createReels();
  }

  _createChrome() {
    const frame = this.scene.add.graphics();
    frame.fillStyle(COLOR.BG_DARK, 1);
    frame.lineStyle(3, COLOR.BORDER, 1);
    frame.fillRoundedRect(this.x, this.y, SLOT_W, SLOT_H, 24);
    frame.strokeRoundedRect(this.x, this.y, SLOT_W, SLOT_H, 24);

    for (let i = 0; i < 5; i++) {
      const reelBg = this.scene.add.graphics();
      reelBg.fillStyle(0x13131F, 1);
      const rx = this.x + 20 + i * (REEL_W + REEL_GAP);
      const ry = this.y + 20;
      reelBg.fillRect(rx, ry, REEL_W, REEL_H);
    }

    const paylineY = this.y + 20 + REEL_H / 2;
    this.payline = this.scene.add.graphics();
    this.payline.lineStyle(2, COLOR.GOLD, 0.9);
    this.payline.lineBetween(this.x + 16, paylineY, this.x + SLOT_W - 16, paylineY);
  }

  _createReels() {
    const reelCenterY = this.y + 20 + REEL_H / 2;
    for (let i = 0; i < 5; i++) {
      const reelX = this.x + 20 + i * (REEL_W + REEL_GAP) + REEL_W / 2;
      const rx = this.x + 20 + i * (REEL_W + REEL_GAP);
      const ry = this.y + 20;

      const maskShape = this.scene.add.graphics();
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(rx, ry, REEL_W, REEL_H);
      maskShape.setVisible(false);
      const mask = maskShape.createGeometryMask();
      this.masks.push(maskShape);

      const container = this.scene.add.container(reelX, reelCenterY);
      container.setMask(mask);

      const flash = this.scene.add.graphics();
      flash.fillStyle(COLOR.WHITE, 1);
      flash.fillRect(rx, reelCenterY - SYMBOL_H / 2, REEL_W, SYMBOL_H);
      flash.setAlpha(0);
      this.flashGraphics.push(flash);

      this.reels.push({ container, symbols: [], reelIndex: i });

      // Initial placeholder symbols
      for (let r = -1; r <= 1; r++) {
        const [min, max] = COLUMN_RANGES[i];
        const num = Phaser.Math.Between(min, max);
        const sym = this._makeSymbol({ id: 'number', label: num }, num);
        sym.y = r * (SYMBOL_H + SYMBOL_GAP);
        container.add(sym);
      }
    }
  }

  _makeSymbol(symbolDef, label) {
    const container = this.scene.add.container(0, 0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x252545, 1);
    bg.lineStyle(2, 0x5A5A8A, 0.9);
    bg.fillRoundedRect(-REEL_W / 2 + 4, -SYMBOL_H / 2, REEL_W - 8, SYMBOL_H, 10);
    bg.strokeRoundedRect(-REEL_W / 2 + 4, -SYMBOL_H / 2, REEL_W - 8, SYMBOL_H, 10);
    container.add(bg);

    if (symbolDef.id === 'number') {
      const txt = this.scene.add.text(0, 0, String(label), {
        ...FONT.NUMBER, fontSize: '52px', color: '#F0F0FF',
      }).setOrigin(0.5);
      container.add(txt);
    } else if (symbolDef.id === 'jackpot') {
      const img = this.scene.add.image(0, 0, 'sym-jackpot').setOrigin(0.5);
      img.setDisplaySize(SYMBOL_H - 20, SYMBOL_H - 20);
      container.add(img);
    } else if (symbolDef.id === 'wild') {
      const img = this.scene.add.image(0, 0, 'sym-wild').setOrigin(0.5);
      img.setDisplaySize(SYMBOL_H - 20, SYMBOL_H - 20);
      container.add(img);
    } else if (symbolDef.id === 'multiplier') {
      const img = this.scene.add.image(0, 0, 'sym-multiplier').setOrigin(0.5);
      img.setDisplaySize(SYMBOL_H - 20, SYMBOL_H - 20);
      container.add(img);
    }
    return container;
  }

  spin(results, fast = false) {
    bus.emit('slot:spinning');

    const spinDuration = fast ? 800 : 1500;
    const stopDelay = fast ? 100 : 200;
    const stripLength = 16;
    const reelCenterY = this.y + 20 + REEL_H / 2;

    this.reels.forEach((reel, i) => {
      reel.container.removeAll(true);
      reel.symbols = [];

      const targetSymbol = results[i];
      const strip = [];
      for (let s = 0; s < stripLength; s++) {
        if (s === stripLength - 2) {
          strip.push(targetSymbol);
        } else {
          const randId = rollSymbolType({ next: () => Math.random() });
          let randLabel = null;
          if (randId === 'number') {
            const [min, max] = COLUMN_RANGES[i];
            randLabel = Phaser.Math.Between(min, max);
          }
          strip.push({ id: randId, label: randLabel });
        }
      }

      const targetIndex = stripLength - 2;
      strip.forEach((sym, idx) => {
        const sy = (idx - targetIndex) * (SYMBOL_H + SYMBOL_GAP);
        const s = this._makeSymbol(sym, sym.label);
        s.y = sy;
        reel.container.add(s);
        reel.symbols.push(s);
      });

      const startOffset = (0 - targetIndex) * (SYMBOL_H + SYMBOL_GAP);
      reel.container.y = reelCenterY - startOffset;

      this.scene.tweens.add({
        targets: reel.container,
        y: reelCenterY,
        duration: spinDuration + i * stopDelay,
        ease: Phaser.Math.Easing.Cubic.Out,
        onComplete: () => {
          bus.emit('reel:stopped', { reelIndex: i, symbol: targetSymbol });
          this._flashReel(i);
        },
      });
    });

    const totalTime = spinDuration + 4 * stopDelay + 300;
    this.scene.time.delayedCall(totalTime, () => {
      bus.emit('slot:complete', { results });
    });
  }

  _flashReel(i) {
    const flash = this.flashGraphics[i];
    flash.setAlpha(0.6);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 100 });
  }

  destroy() {
    this.reels.forEach(r => r.container.destroy());
    this.reels = [];
    this.flashGraphics.forEach(g => g.destroy());
    this.flashGraphics = [];
    this.masks.forEach(m => m.destroy());
    this.masks = [];
    if (this.payline) this.payline.destroy();
  }
}

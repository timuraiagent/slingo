import Phaser from 'phaser';
import { COLOR, FONT, CELL_SIZE, CELL_GAP, DEBUG_FLAGS } from '../constants.js';
import { bus } from '../utils/eventBus.js';

export class BingoCard {
  constructor(scene, x, y, cardManager) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.cardManager = cardManager;
    this.cells = [];
    this.overlayTweens = new Map();
    this.lineGraphics = null;
    this._handlers = [];

    this._createCard();
    this._on('card:cell-closed', this._onCellClosedRemote, this);
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
    this.overlayTweens.forEach(t => t.stop());
    this.overlayTweens.clear();
    if (this.lineGraphics) this.lineGraphics.destroy();
    this.cells.forEach(c => c.container.destroy());
    this.cells = [];
    if (this.panel) this.panel.destroy();
  }

  _createCard() {
    const panel = this.scene.add.graphics();
    const cardW = 5 * CELL_SIZE + 4 * CELL_GAP;
    const cardH = 5 * CELL_SIZE + 4 * CELL_GAP;
    panel.fillStyle(COLOR.BG_MID, 1);
    panel.lineStyle(2, COLOR.BORDER, 1);
    panel.fillRoundedRect(this.x - 10, this.y - 10, cardW + 20, cardH + 20, 20);
    panel.strokeRoundedRect(this.x - 10, this.y - 10, cardW + 20, cardH + 20, 20);
    this.panel = panel;

    const HEADERS = ['B', 'I', 'N', 'G', 'O'];
    const COLORS = ['#3498DB', '#9B59B6', '#2ECC71', '#FF8C00', '#E74C3C'];
    HEADERS.forEach((letter, i) => {
      this.scene.add.text(
        this.x + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
        this.y - 30,
        letter,
        { fontFamily: 'Nunito', fontSize: '28px', fontStyle: 'bold', color: COLORS[i] }
      ).setOrigin(0.5);
    });

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        this.cells.push(this._makeCell(col, row, this.cardManager.grid[row][col]));
      }
    }
  }

  _makeCell(col, row, number) {
    const cx = this.x + col * (CELL_SIZE + CELL_GAP);
    const cy = this.y + row * (CELL_SIZE + CELL_GAP);
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLOR.BG_LIGHT, 1);
    bg.lineStyle(1.5, COLOR.BORDER, 1);
    bg.fillRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);
    bg.strokeRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);

    const isFree = number === 0;
    const label = this.scene.add.text(
      CELL_SIZE / 2, CELL_SIZE / 2,
      isFree ? '★\nFREE' : String(number),
      { ...FONT.NUMBER, fontSize: isFree ? '22px' : '28px', color: '#F0F0FF', align: 'center' }
    ).setOrigin(0.5);

    const overlay = this.scene.add.graphics();

    const container = this.scene.add.container(cx, cy, [bg, label, overlay]);
    container.setSize(CELL_SIZE, CELL_SIZE);

    const cellObj = { container, bg, label, overlay, col, row, number };

    if (DEBUG_FLAGS.cellTap) {
      container.setInteractive();
      container.on('pointerdown', () => this.closeCell(col, row, false));
    }

    return cellObj;
  }

  closeCell(col, row, isJackpot = false) {
    const key = `${col},${row}`;
    const cell = this.cells.find(c => c.col === col && c.row === row);
    if (!cell) return;
    if (this.cardManager.closed.has(key)) return;

    this.cardManager.closeCell(col, row);
    this._redrawCell(cell, 'CLOSED');

    this.scene.tweens.add({
      targets: cell.container,
      scaleX: 1.2, scaleY: 1.2,
      duration: 100,
      yoyo: true,
      onComplete: () => cell.container.setScale(1),
    });

    const emitter = this.scene.add.particles(cell.container.x + CELL_SIZE / 2, cell.container.y + CELL_SIZE / 2, 'particle-sparkle', {
      speed: { min: 60, max: 160 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: isJackpot ? COLOR.GOLD : COLOR.GREEN_HIT,
    });
    emitter.explode();
    this.scene.time.delayedCall(600, () => emitter.destroy());

    bus.emit('card:cell-closed', { col, row });

    const completed = this.cardManager.getCompletedLines();
    if (completed.length > 0) {
      completed.forEach(c => this.flashLineComplete(c.line));
      bus.emit('card:line-complete', { line: completed[0].line });
    }
  }

  _onCellClosedRemote({ col, row }) {
    // Could be used for remote sync; local closeCell already redraws
  }

  _redrawCell(cell, state) {
    cell.bg.clear();
    if (state === 'OPEN') {
      cell.bg.fillStyle(COLOR.BG_LIGHT, 1);
      cell.bg.lineStyle(1.5, COLOR.BORDER, 1);
      cell.bg.fillRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);
      cell.bg.strokeRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);
      cell.label.setColor('#F0F0FF');
    } else if (state === 'CLOSED') {
      cell.bg.fillStyle(COLOR.GREEN_HIT, 1);
      cell.bg.lineStyle(1.5, COLOR.GREEN_DARK, 1);
      cell.bg.fillRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);
      cell.bg.strokeRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);
      cell.label.setColor('#FFFFFF');
    }
  }

  setOverlay(col, row, type) {
    const cell = this.cells.find(c => c.col === col && c.row === row);
    if (!cell) return;
    const key = `${col},${row}`;

    if (this.overlayTweens.has(key)) {
      this.overlayTweens.get(key).stop();
      this.overlayTweens.delete(key);
    }
    cell.overlay.clear();

    if (type === 'hot') {
      cell.overlay.lineStyle(3, COLOR.ORANGE_HOT, 1);
      cell.overlay.strokeRoundedRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4, 10);
      const t = this.scene.tweens.add({
        targets: cell.overlay,
        alpha: { from: 0.4, to: 1 },
        yoyo: true,
        repeat: -1,
        duration: 600,
      });
      this.overlayTweens.set(key, t);
    } else if (type === 'nearwin') {
      cell.overlay.lineStyle(3, COLOR.GOLD, 1);
      cell.overlay.strokeRoundedRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4, 10);
      const t = this.scene.tweens.add({
        targets: cell.overlay,
        alpha: { from: 0.4, to: 1 },
        yoyo: true,
        repeat: -1,
        duration: 600,
      });
      this.overlayTweens.set(key, t);
    } else if (type === 'jackpot') {
      cell.overlay.lineStyle(4, COLOR.GOLD, 1);
      cell.overlay.strokeRoundedRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4, 10);
      this.scene.tweens.add({
        targets: cell.container,
        scaleX: { from: 1, to: 1.1 },
        scaleY: { from: 1, to: 1.1 },
        yoyo: true,
        repeat: 2,
        duration: 300,
      });
    }
  }

  clearOverlays() {
    this.overlayTweens.forEach(t => t.stop());
    this.overlayTweens.clear();
    this.cells.forEach(cell => {
      cell.overlay.clear();
      cell.container.setScale(1);
    });
  }

  flashLineComplete(line) {
    if (this.lineGraphics) this.lineGraphics.destroy();
    this.lineGraphics = this.scene.add.graphics();
    this.lineGraphics.lineStyle(4, COLOR.GOLD, 1);

    const pts = line.cells.map(([c, r]) => ({
      x: this.x + c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
      y: this.y + r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    }));

    this.lineGraphics.beginPath();
    this.lineGraphics.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) this.lineGraphics.lineTo(pts[i].x, pts[i].y);
    this.lineGraphics.strokePath();
    this.lineGraphics.setAlpha(1);

    this.scene.tweens.add({
      targets: this.lineGraphics,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        if (this.lineGraphics) { this.lineGraphics.destroy(); this.lineGraphics = null; }
      },
    });
  }
}

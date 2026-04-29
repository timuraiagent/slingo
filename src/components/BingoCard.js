import { COLOR, FONT, DEBUG_FLAGS } from '../constants.js';
import { drawPanel } from '../utils/draw.js';
import { bus } from '../utils/eventBus.js';

const CARD_SIZE = 5;
const HEADER_COLORS = ['#3498DB', '#9B59B6', '#2ECC71', '#FF8C00', '#E74C3C'];
const HEADERS = ['B', 'I', 'N', 'G', 'O'];

export class BingoCard {
  constructor(scene, x, y, cardManager, L) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.cardManager = cardManager;
    this.L = L;
    this.cells = [];
    this.overlayTweens = [];
    this._handlers = [];

    const CELL_SIZE = L.CELL_SIZE;
    const CELL_GAP = L.CELL_GAP;
    const HALF = CELL_SIZE / 2;
    this.HALF = HALF;

    const CARD_W = L.CARD_W;
    const sf = L.sf;

    // Card panel with border (offsets scaled by sf)
    const panelPad = Math.round(16 * sf);
    const panelHeader = Math.round(50 * sf);
    const panelExtra = Math.round(70 * sf);
    this.panel = scene.add.graphics();
    drawPanel(this.panel, x - panelPad, y - panelHeader, CARD_W + panelPad * 2, CARD_W + panelExtra, 20, COLOR.BG_MID, COLOR.BORDER);

    // Column headers
    this.headerTexts = [];
    for (let c = 0; c < 5; c++) {
      const hx = x + c * (CELL_SIZE + CELL_GAP) + HALF;
      this.headerTexts.push(
        scene.add.text(hx, y - Math.round(18 * sf), HEADERS[c], {
          ...FONT.UI, fontSize: `${Math.round(CELL_SIZE * 0.35)}px`, color: HEADER_COLORS[c],
        }).setOrigin(0.5)
      );
    }

    // Create cells
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        this.cells.push(this._makeCell(c, r, cardManager.grid[r][c]));
      }
    }

    // Start hidden for curtain reveal
    this.cells.forEach(cell => {
      cell.container.setAlpha(0).setScale(0.8, 0.8);
    });
    this.headerTexts.forEach(t => t.setAlpha(0));
    this.panel.setAlpha(0);

    // Debug tap handler
    if (DEBUG_FLAGS.cellTap) {
      this.cells.forEach((cell) => {
        if (cell.number !== 0) {
          cell.container.on('pointerdown', () => {
            if (this.cardManager.isOpen(cell.col, cell.row)) {
              this.closeCell(cell.col, cell.row, false);
              this.cardManager.closeCell(cell.col, cell.row);
              if (this.cardManager.isWon()) {
                bus.emit('card:line-complete', { line: this.cardManager.getCompletedLines()[0] });
              }
            }
          });
        }
      });
    }
  }

  _makeCell(col, row, number) {
    const CELL_SIZE = this.L.CELL_SIZE;
    const CELL_GAP = this.L.CELL_GAP;
    const HALF = this.HALF;

    const cx = this.x + col * (CELL_SIZE + CELL_GAP) + HALF;
    const cy = this.y + row * (CELL_SIZE + CELL_GAP) + Math.round(20 * this.L.sf) + HALF;

    const bg = this.scene.add.graphics();
    if (number === 0) {
      this._drawFree(bg);
    } else {
      this._drawOpen(bg);
    }

    const label = this.scene.add.text(0, 0,
      number === 0 ? '★\nFREE' : String(number),
      {
        ...FONT.NUMBER,
        fontSize: number === 0 ? `${Math.round(CELL_SIZE * 0.25)}px` : `${Math.round(CELL_SIZE * 0.35)}px`,
        color: number === 0 ? '#FFD700' : '#F0F0FF',
        align: 'center',
      }
    ).setOrigin(0.5);

    const overlay = this.scene.add.graphics();

    const container = this.scene.add.container(cx, cy, [bg, label, overlay]);
    container.setSize(CELL_SIZE, CELL_SIZE);
    if (number !== 0) container.setInteractive();

    return { container, bg, label, overlay, col, row, number, state: number === 0 ? 'FREE' : 'OPEN' };
  }

  _drawOpen(bg) {
    const HALF = this.HALF;
    const CELL_SIZE = this.L.CELL_SIZE;
    bg.clear();
    bg.fillStyle(COLOR.BG_LIGHT, 1);
    bg.lineStyle(1.5, COLOR.BORDER, 1);
    bg.fillRoundedRect(-HALF, -HALF, CELL_SIZE, CELL_SIZE, 12);
    bg.strokeRoundedRect(-HALF, -HALF, CELL_SIZE, CELL_SIZE, 12);
  }

  _drawClosed(bg) {
    const HALF = this.HALF;
    const CELL_SIZE = this.L.CELL_SIZE;
    bg.clear();
    bg.fillStyle(COLOR.GREEN_HIT, 1);
    bg.lineStyle(1.5, COLOR.GREEN_DARK, 1);
    bg.fillRoundedRect(-HALF, -HALF, CELL_SIZE, CELL_SIZE, 12);
    bg.strokeRoundedRect(-HALF, -HALF, CELL_SIZE, CELL_SIZE, 12);
  }

  _drawFree(bg) {
    const HALF = this.HALF;
    const CELL_SIZE = this.L.CELL_SIZE;
    bg.clear();
    bg.fillStyle(COLOR.GREEN_HIT, 1);
    bg.lineStyle(1.5, COLOR.GREEN_DARK, 1);
    bg.fillRoundedRect(-HALF, -HALF, CELL_SIZE, CELL_SIZE, 12);
    bg.strokeRoundedRect(-HALF, -HALF, CELL_SIZE, CELL_SIZE, 12);
  }

  getCell(col, row) {
    return this.cells.find(c => c.col === col && c.row === row);
  }

  closeCell(col, row, isJackpot) {
    const cell = this.getCell(col, row);
    if (!cell || cell.state === 'CLOSED' || cell.state === 'FREE') return;

    cell.state = 'CLOSED';
    this._drawClosed(cell.bg);
    cell.label.setColor('#FFFFFF');

    this.scene.tweens.add({
      targets: cell.container,
      scaleX: 1.2, scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    const px = cell.container.x;
    const py = cell.container.y;
    const tint = isJackpot ? COLOR.GOLD : COLOR.GREEN_HIT;
    const key = isJackpot ? 'particle-spark' : 'particle-sparkle';

    if (this.scene.textures.exists(key)) {
      const emitter = this.scene.add.particles(px, py, key, {
        speed: { min: 60, max: 200 },
        scale: { start: 0.6, end: 0 },
        lifespan: 400,
        quantity: 8,
        tint: tint,
        emitting: false,
      });
      emitter.explode(8);
      this.scene.time.delayedCall(500, () => emitter.destroy());
    }

    bus.emit('card:cell-closed', { col, row });
  }

  setOverlay(col, row, type) {
    const cell = this.getCell(col, row);
    if (!cell) return;
    cell.overlay.clear();
    this.scene.tweens.killTweensOf(cell.overlay);

    if (!type) return;

    let color, lineW;
    if (type === 'hot') {
      color = COLOR.ORANGE_HOT; lineW = 2;
    } else if (type === 'nearwin') {
      color = COLOR.GOLD; lineW = 2;
    } else if (type === 'jackpot') {
      color = COLOR.GOLD; lineW = 4;
    } else {
      return;
    }

    const HALF = this.HALF;
    const CELL_SIZE = this.L.CELL_SIZE;
    cell.overlay.lineStyle(lineW, color, 1);
    cell.overlay.strokeRoundedRect(-HALF + 4, -HALF + 4, CELL_SIZE - 8, CELL_SIZE - 8, 10);
    cell.overlay.setAlpha(0.4);

    const tween = this.scene.tweens.add({
      targets: cell.overlay,
      alpha: { from: 0.4, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    this.overlayTweens.push(tween);
  }

  clearAllOverlays() {
    this.cells.forEach(c => {
      c.overlay.clear();
      c.overlay.setAlpha(1);
    });
    this.scene.tweens.killTweensOf(this.cells.map(c => c.overlay));
    this.overlayTweens = [];
  }

  flashLineComplete(line) {
    const gfx = this.scene.add.graphics();
    gfx.lineStyle(6, COLOR.GOLD, 1);

    const first = line[0];
    const last = line[line.length - 1];
    const fCell = this.getCell(first.col, first.row);
    const lCell = this.getCell(last.col, last.row);

    if (fCell && lCell) {
      gfx.lineBetween(fCell.container.x, fCell.container.y, lCell.container.x, lCell.container.y);
    }

    this.scene.tweens.add({
      targets: gfx,
      alpha: { from: 1, to: 0 },
      duration: 600,
      onComplete: () => gfx.destroy(),
    });
  }

  revealAnimation(onComplete) {
    // Panel + headers fade in
    this.scene.tweens.add({
      targets: this.panel,
      alpha: 1,
      duration: 300,
    });
    this.headerTexts.forEach((t, i) => {
      this.scene.tweens.add({
        targets: t,
        alpha: 1,
        delay: i * 60,
        duration: 200,
      });
    });

    // Cells appear column-by-column, top-to-bottom
    let maxDelay = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = this.getCell(c, r);
        if (!cell) continue;
        const delay = c * 120 + r * 80;
        if (delay > maxDelay) maxDelay = delay;
        this.scene.tweens.add({
          targets: cell.container,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          delay,
          duration: 150,
          ease: 'Back.easeOut',
        });
      }
    }

    if (onComplete) {
      this.scene.time.delayedCall(maxDelay + 250, onComplete);
    }
  }

  destroy() {
    this.overlayTweens.forEach(t => t.stop());
    this.overlayTweens = [];
    this.cells.forEach(c => c.container.destroy());
    this.cells = [];
    if (this.panel) this.panel.destroy();
    this.headerTexts.forEach(t => t.destroy());
    this.headerTexts = [];
  }
}

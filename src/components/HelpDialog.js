import { COLOR, FONT } from '../constants.js';

export class HelpDialog {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.elements = [];
    this._autoCloseMs = opts.autoClose || 0;

    const W = scene.scale.width;
    const H = scene.scale.height;
    const sf = Math.min(W / 1080, H / 2340);
    this.sf = sf;

    // Dark overlay
    const overlay = scene.add.rectangle(W / 2, H / 2, W, H, COLOR.BG_DARK, 0.8);
    overlay.setDepth(55).setInteractive();
    overlay.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
    });
    this._add(overlay);

    // Panel — fits screen with margins
    const panelW = Math.min(Math.round(900 * sf), W - 30);
    const maxPanelH = H - 200;
    const panelX = (W - panelW) / 2;
    const panelY = 50;

    const panel = scene.add.graphics();
    panel.fillStyle(COLOR.BG_MID, 1);
    panel.lineStyle(2, COLOR.BORDER, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, maxPanelH, 24);
    panel.strokeRoundedRect(panelX, panelY, panelW, maxPanelH, 24);
    panel.setDepth(56);
    this._add(panel);

    // Content container
    this.content = scene.add.container(panelX + panelW / 2, panelY);
    this.content.setDepth(57);
    this._add(this.content);

    // Covers to hide content overflow — sit above/below panel, don't overlap borders
    const topCover = scene.add.rectangle(W / 2, panelY / 2, W, panelY, COLOR.BG_DARK, 1);
    topCover.setDepth(58);
    this._add(topCover);
    const bottomCoverTop = panelY + maxPanelH + 3;
    const bottomCoverH = H - bottomCoverTop;
    const bottomCover = scene.add.rectangle(W / 2, bottomCoverTop + bottomCoverH / 2, W, bottomCoverH + 4, COLOR.BG_DARK, 1);
    bottomCover.setDepth(58);
    this._add(bottomCover);

    const pad = Math.round(24 * sf);
    const usableW = panelW - pad * 2;

    // Close X button
    const closeSize = Math.round(96 * sf);
    const closeX = panelX + panelW - Math.round(14 * sf) - closeSize / 2;
    const closeY = panelY + Math.round(14 * sf) + closeSize / 2;
    const closeBg = scene.add.graphics();
    closeBg.fillStyle(COLOR.BG_DARK, 0.6);
    closeBg.fillRoundedRect(closeX - closeSize / 2, closeY - closeSize / 2, closeSize, closeSize, closeSize / 2);
    closeBg.setDepth(59);
    this._add(closeBg);
    const closeTxt = scene.add.text(closeX, closeY, '✕', {
      ...FONT.UI, fontSize: `${Math.round(64 * sf)}px`, color: '#A0A0C0',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeTxt.setDepth(59);
    closeTxt.on('pointerdown', () => this.destroy());
    this._add(closeTxt);

    let y = Math.round(50);

    // Title
    const title = this._addText('HOW TO PLAY', 0, y, {
      ...FONT.UI, fontSize: `${Math.round(48 * sf)}px`, color: '#FFD700',
    });
    y = title.y + title.height + Math.round(16 * sf);

    // Spin & Match
    y = this._addMiniSection('SPIN & MATCH', [
      'Match slot numbers to your bingo card',
      'Complete a row, column or diagonal to win',
      'Place 1st out of 8 players for max coins!',
    ], y, usableW, sf);

    y = this._addDivider(y, usableW);

    // Timing bar
    y = this._addSectionHeader('TIMING BAR', 0, y);
    y += Math.round(4 * sf);
    const zones = [
      ['PERFECT', '55% hit chance', '#2ECC71'],
      ['GREAT',   '45% hit chance', '#FFD700'],
      ['GOOD',    '35% hit chance', '#FF8C00'],
      ['MISS',    '25% hit chance', '#E74C3C'],
    ];
    zones.forEach(([label, desc, color]) => {
      const lbl = this.scene.add.text(0, y, `${label} — ${desc}`, {
        ...FONT.UI, fontSize: `${Math.round(44 * sf)}px`, color,
      }).setOrigin(0.5, 0);
      lbl.setDepth(57);
      this.content.add(lbl);
      this._add(lbl);
      y += lbl.height + Math.round(10 * sf);
    });

    y += Math.round(6 * sf);
    y = this._addDivider(y, usableW);

    // Jackpot meter
    y = this._addSectionHeader('JACKPOT METER', 0, y);
    y += Math.round(4 * sf);
    const meterNote = this._addText('Match numbers to fill meter → jackpot ball!', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(44 * sf)}px`, color: '#A0A0C0',
      wordWrap: { width: usableW },
    });
    y = meterNote.y + meterNote.height + Math.round(12 * sf);
    const jackpotNote = this._addText('Jackpot ball closes ANY open cell', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(44 * sf)}px`, color: '#FFD700',
    });
    y = jackpotNote.y + jackpotNote.height + Math.round(8 * sf);

    y = this._addDivider(y, usableW);

    // Special symbols
    y = this._addSectionHeader('SPECIAL SYMBOLS', 0, y);
    y += Math.round(4 * sf);
    const symbols = [
      { text: '★ JACKPOT', desc: 'Fills 30% of jackpot meter', color: '#FFD700' },
      { text: 'W WILD', desc: 'Pick column — guaranteed match', color: '#B060E0' },
      { text: '×2 MULTI', desc: 'Doubles next meter fill', color: '#FF8C00' },
    ];
    symbols.forEach(s => {
      const row = this.scene.add.container(0, y);
      const sym = this.scene.add.text(0, 0, s.text, {
        ...FONT.UI, fontSize: `${Math.round(44 * sf)}px`, color: s.color,
      }).setOrigin(0.5, 0);
      const desc = this.scene.add.text(0, sym.height + Math.round(4 * sf), s.desc, {
        ...FONT.LABEL, fontSize: `${Math.round(40 * sf)}px`, color: '#A0A0C0',
        wordWrap: { width: usableW },
      }).setOrigin(0.5, 0);
      row.add([sym, desc]);
      this.content.add(row);
      this._add(row);
      y += sym.height + desc.height + Math.round(10 * sf);
    });

    y += Math.round(12 * sf);

    this.contentHeight = y + Math.round(20 * sf);

    // Touch scrolling
    this._dragY = 0;
    this._contentY = panelY;
    this._panelY = panelY;
    this._panelH = maxPanelH;
    this._maxScroll = Math.max(0, this.contentHeight - maxPanelH + Math.round(20 * sf));

    overlay.on('pointerdown', (p) => this._onDragStart(p));
    scene.input.on('pointermove', (p) => this._onDragMove(p));
    scene.input.on('pointerup', () => this._dragging = false);
    this._overlay = overlay;
    this._onClose = opts.onClose || null;

    this._autoCloseTimer = null;
    if (this._autoCloseMs > 0) {
      this._autoCloseTimer = scene.time.delayedCall(this._autoCloseMs, () => this.destroy());
    }
  }

  _add(el) {
    this.elements.push(el);
    return el;
  }

  _addText(text, x, y, style) {
    const t = this.scene.add.text(x, y, text, style).setOrigin(0.5, 0);
    t.setDepth(57);
    this.content.add(t);
    this._add(t);
    return t;
  }

  _addSectionHeader(text, x, y) {
    const sf = this.sf;
    const t = this.scene.add.text(x, y, text, {
      ...FONT.UI, fontSize: `${Math.round(38 * sf)}px`, color: '#F0F0FF',
    }).setOrigin(0.5, 0);
    t.setDepth(57);
    this.content.add(t);
    this._add(t);
    return t.y + t.height + Math.round(10 * sf);
  }

  _addMiniSection(title, lines, startY, usableW, sf) {
    let y = this._addSectionHeader(title, 0, startY);
    lines.forEach(line => {
      const t = this.scene.add.text(0, y, line, {
        ...FONT.LABEL, fontSize: `${Math.round(44 * sf)}px`, color: '#C0C0E0',
        wordWrap: { width: usableW },
      }).setOrigin(0.5, 0);
      t.setDepth(57);
      this.content.add(t);
      this._add(t);
      y += t.height + Math.round(8 * sf);
    });
    return y;
  }

  _addDivider(y, usableW) {
    const line = this.scene.add.graphics();
    line.lineStyle(1, COLOR.BORDER, 0.5);
    line.lineBetween(-usableW / 2, 0, usableW / 2, 0);
    line.setPosition(0, y);
    line.setDepth(57);
    this.content.add(line);
    this._add(line);
    return y + Math.round(12 * this.sf);
  }

  _makeButton(x, y, w, h, label) {
    const sf = this.sf;
    const btn = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1E2A3A, 1);
    bg.lineStyle(2, COLOR.BLUE, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    btn.add(bg);
    const txt = this.scene.add.text(0, 0, label, {
      ...FONT.UI, fontSize: `${Math.round(36 * sf)}px`, color: '#F0F0FF',
    }).setOrigin(0.5);
    btn.add(txt);
    btn.setSize(w, h);
    btn.setInteractive();
    btn.setDepth(57);
    btn.on('pointerdown', () => this.destroy());
    return btn;
  }

  _onDragStart(pointer) {
    this._dragging = true;
    this._dragY = pointer.y;
    if (this._autoCloseTimer) {
      this._autoCloseTimer.remove(false);
      this._autoCloseTimer = null;
    }
  }

  _onDragMove(pointer) {
    if (!this._dragging) return;
    const delta = pointer.y - this._dragY;
    this._dragY = pointer.y;
    this._contentY = Phaser.Math.Clamp(
      this._contentY + delta,
      this._panelY - this._maxScroll,
      this._panelY
    );
    this.content.setY(this._contentY);
  }

  destroy() {
    this.scene.input.off('pointermove', this._onDragMove, this);
    this.scene.input.off('pointerup', null, this);
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
    if (this._onClose) this._onClose();
  }
}

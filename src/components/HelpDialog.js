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

    // Panel
    const panelW = Math.min(Math.round(900 * sf), W - 40);
    const panelH = Math.round(1900 * sf);
    const panelX = (W - panelW) / 2;
    const panelY = Math.round(60 * sf);
    const cornerR = 24;

    const panel = scene.add.graphics();
    panel.fillStyle(COLOR.BG_MID, 1);
    panel.lineStyle(2, COLOR.BORDER, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, cornerR);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, cornerR);
    panel.setDepth(56);
    this._add(panel);

    // Content container
    this.content = scene.add.container(panelX + panelW / 2, panelY);
    this.content.setDepth(57);
    this._add(this.content);

    // Covers to hide content overflow — placed outside panel border
    // Top cover: covers area from top of screen to just inside panel top border
    const topCoverH = panelY + 3;
    const topCover = scene.add.rectangle(
      panelX + panelW / 2, topCoverH / 2,
      panelW + 20, topCoverH + 4,
      COLOR.BG_DARK, 1
    );
    topCover.setDepth(58);
    this._add(topCover);

    // Bottom cover: covers area from just inside panel bottom to bottom of screen
    const bottomCoverTop = panelY + panelH - 3;
    const bottomCoverH = H - bottomCoverTop + 4;
    const bottomCover = scene.add.rectangle(
      panelX + panelW / 2, bottomCoverTop + bottomCoverH / 2,
      panelW + 20, bottomCoverH + 4,
      COLOR.BG_DARK, 1
    );
    bottomCover.setDepth(58);
    this._add(bottomCover);

    const halfW = panelW / 2;
    const pad = Math.round(32 * sf);

    // Close X button
    const closeSize = Math.round(60 * sf);
    const closeX = panelX + panelW - Math.round(20 * sf) - closeSize / 2;
    const closeY = panelY + Math.round(20 * sf) + closeSize / 2;
    const closeBg = scene.add.graphics();
    closeBg.fillStyle(COLOR.BG_DARK, 0.6);
    closeBg.fillRoundedRect(closeX - closeSize / 2, closeY - closeSize / 2, closeSize, closeSize, closeSize / 2);
    closeBg.setDepth(59);
    this._add(closeBg);
    const closeTxt = scene.add.text(closeX, closeY, '✕', {
      ...FONT.UI, fontSize: `${Math.round(40 * sf)}px`, color: '#A0A0C0',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeTxt.setDepth(59);
    closeTxt.on('pointerdown', () => this.destroy());
    this._add(closeTxt);

    let y = Math.round(40 * sf);

    // Title
    const title = this._addText('HOW TO PLAY', 0, y, {
      ...FONT.UI, fontSize: `${Math.round(50 * sf)}px`, color: '#FFD700',
    });
    y = title.y + title.height + Math.round(28 * sf);

    // Spin & Match
    y = this._addMiniSection('SPIN & MATCH', [
      'Match slot numbers to your bingo card',
      'Complete a row, column or diagonal to win',
      'Place 1st out of 8 players for max coins!',
    ], y, halfW, sf);

    y = this._addDivider(y, halfW);

    // Timing bar
    y = this._addSectionHeader('TIMING BAR', 0, y);
    const timingHint = this._addText('Better timing = better chance to hit your open cells:', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(36 * sf)}px`, color: '#A0A0C0',
      wordWrap: { width: panelW - pad * 2 },
    });
    y = timingHint.y + timingHint.height + Math.round(10 * sf);

    const zones = [
      ['PERFECT', '55% hit chance', '#2ECC71'],
      ['GREAT',   '45% hit chance', '#FFD700'],
      ['GOOD',    '35% hit chance', '#FF8C00'],
      ['MISS',    '25% hit chance', '#E74C3C'],
    ];
    zones.forEach(([label, desc, color]) => {
      const lbl = this.scene.add.text(0, y, label, {
        ...FONT.UI, fontSize: `${Math.round(38 * sf)}px`, color,
      }).setOrigin(0.5, 0);
      lbl.setDepth(57);
      this.content.add(lbl);
      this._add(lbl);
      y += lbl.height + Math.round(4 * sf);

      const dsc = this.scene.add.text(0, y, desc, {
        ...FONT.LABEL, fontSize: `${Math.round(34 * sf)}px`, color: '#A0A0C0',
      }).setOrigin(0.5, 0);
      dsc.setDepth(57);
      this.content.add(dsc);
      this._add(dsc);
      y += dsc.height + Math.round(10 * sf);
    });

    y += Math.round(10 * sf);
    y = this._addDivider(y, halfW);

    // Jackpot meter
    y = this._addSectionHeader('JACKPOT METER', 0, y);
    const meterNote = this._addText('Matching numbers fills the meter — full meter = jackpot ball!', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(38 * sf)}px`, color: '#A0A0C0',
      wordWrap: { width: panelW - pad * 2 },
    });
    y = meterNote.y + meterNote.height + Math.round(10 * sf);
    const jackpotNote = this._addText('Jackpot ball closes ANY open cell on your card', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(38 * sf)}px`, color: '#FFD700',
      wordWrap: { width: panelW - pad * 2 },
    });
    y = jackpotNote.y + jackpotNote.height + Math.round(12 * sf);

    y = this._addDivider(y, halfW);

    // Special symbols — two rows each: symbol+name on first, description on second
    y = this._addSectionHeader('SPECIAL SYMBOLS', 0, y);
    const symbols = [
      { symbol: '★', color: '#FFD700', name: 'JACKPOT', desc: 'Fills 30% of the jackpot meter' },
      { symbol: 'W', color: '#B060E0', name: 'WILD', desc: 'Pick a column — next spin guaranteed match' },
      { symbol: '×2', color: '#FF8C00', name: 'MULTIPLIER', desc: 'Doubles next spin\'s meter fill' },
    ];
    symbols.forEach(s => {
      const row = this.scene.add.container(0, y);
      const sym = this.scene.add.text(0, 0, s.symbol + ' ' + s.name, {
        ...FONT.UI, fontSize: `${Math.round(38 * sf)}px`, color: s.color,
      }).setOrigin(0.5, 0);
      const desc = this.scene.add.text(0, sym.height + Math.round(4 * sf), s.desc, {
        ...FONT.LABEL, fontSize: `${Math.round(34 * sf)}px`, color: '#A0A0C0',
        wordWrap: { width: panelW - pad * 2 },
      }).setOrigin(0.5, 0);
      row.add([sym, desc]);
      this.content.add(row);
      this._add(row);
      y += sym.height + desc.height + Math.round(16 * sf);
    });

    y += Math.round(20 * sf);

    // OK button (centered, below content)
    const btnW = Math.round(340 * sf);
    const btnH = Math.round(96 * sf);
    const btn = this._makeButton(0, y, btnW, btnH, 'OK');
    this._add(btn);

    this.contentHeight = y + btnH + Math.round(30 * sf);

    // Touch scrolling
    this._dragY = 0;
    this._contentY = panelY;
    this._panelY = panelY;
    this._panelH = panelH;
    this._maxScroll = Math.max(0, this.contentHeight - panelH + Math.round(30 * sf));

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
    return t.y + t.height + Math.round(12 * sf);
  }

  _addMiniSection(title, lines, startY, halfW, sf) {
    let y = this._addSectionHeader(title, 0, startY);
    const pad = Math.round(32 * sf);
    lines.forEach(line => {
      const t = this.scene.add.text(0, y, line, {
        ...FONT.LABEL, fontSize: `${Math.round(38 * sf)}px`, color: '#C0C0E0',
        wordWrap: { width: (halfW - pad) * 2 },
      }).setOrigin(0.5, 0);
      t.setDepth(57);
      this.content.add(t);
      this._add(t);
      y += t.height + Math.round(10 * sf);
    });
    return y;
  }

  _addDivider(y, halfW) {
    const line = this.scene.add.graphics();
    line.lineStyle(1, COLOR.BORDER, 0.5);
    line.lineBetween(-halfW + 10, 0, halfW - 10, 0);
    line.setPosition(0, y);
    line.setDepth(57);
    this.content.add(line);
    this._add(line);
    return y + Math.round(20 * this.sf);
  }

  _makeButton(x, y, w, h, label) {
    const sf = this.sf;
    const btn = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1E2A3A, 1);
    bg.lineStyle(2, COLOR.BLUE, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20);
    btn.add(bg);
    const txt = this.scene.add.text(0, 0, label, {
      ...FONT.UI, fontSize: `${Math.round(44 * sf)}px`, color: '#F0F0FF',
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

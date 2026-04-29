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

    // Dark overlay — must use rectangle for proper input blocking
    const overlay = scene.add.rectangle(W / 2, H / 2, W, H, COLOR.BG_DARK, 0.8);
    overlay.setDepth(55).setInteractive();
    overlay.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
    });
    this._add(overlay);

    // Scrollable panel
    const panelW = Math.min(Math.round(900 * sf), W - 40);
    const panelH = Math.round(2060 * sf);
    const panelX = (W - panelW) / 2;
    const panelY = Math.round(60 * sf);

    const panel = scene.add.graphics();
    panel.fillStyle(COLOR.BG_MID, 1);
    panel.lineStyle(2, COLOR.BORDER, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 24);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 24);
    panel.setDepth(56);
    this._add(panel);

    // Content container
    this.content = scene.add.container(panelX + panelW / 2, panelY);
    this.content.setDepth(57);
    this._add(this.content);

    // Top cover to hide content overflow above panel
    const topCover = scene.add.rectangle(panelX + panelW / 2, panelY / 2, panelW + 40, panelY + 4, COLOR.BG_DARK, 1);
    topCover.setDepth(58);
    this._add(topCover);

    // Bottom cover to hide content overflow below panel
    const bottomCoverY = panelY + panelH + (H - panelY - panelH) / 2;
    const bottomCover = scene.add.rectangle(panelX + panelW / 2, bottomCoverY, panelW + 40, H - panelY - panelH + 4, COLOR.BG_DARK, 1);
    bottomCover.setDepth(58);
    this._add(bottomCover);

    // Half-content width for positioning text that shouldn't exceed panel
    const halfW = panelW / 2;
    const pad = Math.round(30 * sf);

    let y = Math.round(50 * sf);

    // Title
    const title = this._addText('HOW TO PLAY', 0, y, {
      ...FONT.UI, fontSize: `${Math.round(56 * sf)}px`, color: '#FFD700',
    });
    y = title.y + title.height + Math.round(30 * sf);

    y = this._addSection('SPIN & MATCH', [
      'Spin the slot machine to get numbers',
      'Match numbers to your bingo card',
      'Close all cells in a row, column, or diagonal to win',
      'Compete against 7 bots — place 1st for max coins!',
    ], y, halfW);

    y = this._addDivider(y);

    // Timing bar section
    y = this._addSectionHeader('TIMING BAR', 0, y);
    const timingDesc = this._addText('Hit SPIN when the marker is in the zone:', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(34 * sf)}px`, color: '#A0A0C0',
      wordWrap: { width: panelW - pad * 2 },
    });
    y = timingDesc.y + timingDesc.height + Math.round(12 * sf);

    const zones = [
      { label: 'PERFECT', color: '#2ECC71', desc: 'Best charge & hit rate' },
      { label: 'GREAT', color: '#FFD700', desc: 'Strong charge' },
      { label: 'GOOD', color: '#FF8C00', desc: 'Decent charge' },
      { label: 'MISS', color: '#E74C3C', desc: 'Minimal charge' },
    ];

    zones.forEach(z => {
      const { rowY, rowH } = this._addKeyValueRow(y, z.label, z.desc, z.color, halfW, sf);
      y = rowY + rowH + Math.round(8 * sf);
    });

    y += Math.round(8 * sf);
    y = this._addDivider(y);

    // Jackpot meter section
    y = this._addSectionHeader('JACKPOT METER', 0, y);
    const meterDesc = this._addText('Fill 5 segments to earn a jackpot ball!', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(34 * sf)}px`, color: '#A0A0C0',
      wordWrap: { width: panelW - pad * 2 },
    });
    y = meterDesc.y + meterDesc.height + Math.round(14 * sf);

    // Charge rate table
    const charges = [
      ['PERFECT', '+25', '#2ECC71'],
      ['GREAT',   '+18', '#FFD700'],
      ['GOOD',    '+12', '#FF8C00'],
      ['MISS',    '+8',  '#E74C3C'],
    ];

    charges.forEach(([label, value, color]) => {
      const row = this.scene.add.container(0, y);
      const lbl = this.scene.add.text(-halfW + pad, 0, label, {
        ...FONT.UI, fontSize: `${Math.round(34 * sf)}px`, color,
      }).setOrigin(0, 0);
      const val = this.scene.add.text(halfW - pad, 0, value, {
        ...FONT.UI, fontSize: `${Math.round(34 * sf)}px`, color,
      }).setOrigin(1, 0);
      row.add([lbl, val]);
      this.content.add(row);
      this._add(row);
      const rowH = Math.max(lbl.height, val.height);
      y += rowH + Math.round(10 * sf);
    });

    y += Math.round(8 * sf);
    const jackNote1 = this._addText('★ Jackpot symbol instantly adds +30', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(32 * sf)}px`, color: '#FFD700',
      wordWrap: { width: panelW - pad * 2 },
    });
    y = jackNote1.y + jackNote1.height + Math.round(8 * sf);
    const jackNote2 = this._addText('Use a jackpot ball to close ANY open cell', 0, y, {
      ...FONT.LABEL, fontSize: `${Math.round(32 * sf)}px`, color: '#A0A0C0',
      wordWrap: { width: panelW - pad * 2 },
    });
    y = jackNote2.y + jackNote2.height + Math.round(10 * sf);

    y = this._addDivider(y);

    // Special symbols section
    y = this._addSectionHeader('SPECIAL SYMBOLS', 0, y);

    const symbolW = Math.round(70 * sf);
    const symbolH = Math.round(52 * sf);

    // Jackpot badge
    y = this._addSymbolBadge(y, symbolW, symbolH, halfW, pad, {
      fill: 0x2A1A00, border: COLOR.GOLD, text: '★', textColor: '#FFD700',
      name: 'JACKPOT', desc: 'Instantly adds +30 meter charge',
    });

    // Wild badge
    y = this._addSymbolBadge(y, symbolW, symbolH, halfW, pad, {
      fill: 0x1A0030, border: COLOR.PURPLE, text: 'W', textColor: '#B060E0',
      name: 'WILD', desc: 'Choose a column — next spin guarantees a match',
    });

    // Multiplier badge
    y = this._addSymbolBadge(y, symbolW, symbolH, halfW, pad, {
      fill: 0x2A1500, border: COLOR.ORANGE_HOT, text: '×2', textColor: '#FF8C00',
      name: 'MULTIPLIER', desc: 'Doubles next spin\'s meter charge',
    });

    y += Math.round(30 * sf);

    // Close button
    const btnW = Math.round(360 * sf);
    const btnH = Math.round(100 * sf);
    const btn = this._makeButton(0, y, btnW, btnH, 'GOT IT!');
    this._add(btn);

    // Update content container height for scrolling
    this.contentHeight = y + btnH + Math.round(40 * sf);

    // Touch scrolling
    this._dragY = 0;
    this._contentY = panelY;
    this._panelY = panelY;
    this._panelH = panelH;
    this._maxScroll = Math.max(0, this.contentHeight - panelH + Math.round(40 * sf));

    overlay.on('pointerdown', (p) => this._onDragStart(p));
    scene.input.on('pointermove', (p) => this._onDragMove(p));
    scene.input.on('pointerup', () => this._dragging = false);

    this._overlay = overlay;

    // Auto-close timer
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
      ...FONT.UI, fontSize: `${Math.round(42 * sf)}px`, color: '#F0F0FF',
    }).setOrigin(0.5, 0);
    t.setDepth(57);
    this.content.add(t);
    this._add(t);
    return t.y + t.height + Math.round(12 * sf);
  }

  _addSection(title, bullets, startY, halfW) {
    const sf = this.sf;
    const pad = Math.round(30 * sf);
    let y = this._addSectionHeader(title, 0, startY);

    bullets.forEach(bullet => {
      const t = this.scene.add.text(0, y, `• ${bullet}`, {
        ...FONT.LABEL, fontSize: `${Math.round(32 * sf)}px`, color: '#C0C0E0',
        wordWrap: { width: (halfW - pad) * 2 },
      }).setOrigin(0.5, 0);
      t.setDepth(57);
      this.content.add(t);
      this._add(t);
      y += t.height + Math.round(6 * sf);
    });

    return y;
  }

  _addDivider(y) {
    const sf = this.sf;
    const halfW = this.scene.scale.width < 500 ? Math.round(200 * sf) : Math.round(360 * sf);
    const line = this.scene.add.graphics();
    line.lineStyle(1, COLOR.BORDER, 0.5);
    line.lineBetween(-halfW, 0, halfW, 0);
    line.setPosition(0, y);
    line.setDepth(57);
    this.content.add(line);
    this._add(line);
    return y + Math.round(20 * sf);
  }

  _addKeyValueRow(y, label, desc, labelColor, halfW, sf) {
    const pad = Math.round(30 * sf);
    const row = this.scene.add.container(0, y);

    const lbl = this.scene.add.text(-halfW + pad, 0, label, {
      ...FONT.UI, fontSize: `${Math.round(32 * sf)}px`, color: labelColor,
    }).setOrigin(0, 0);
    const dsc = this.scene.add.text(-halfW + pad + lbl.width + Math.round(14 * sf), 0, desc, {
      ...FONT.LABEL, fontSize: `${Math.round(30 * sf)}px`, color: '#A0A0C0',
    }).setOrigin(0, 0);

    row.add([lbl, dsc]);
    this.content.add(row);
    this._add(row);

    const rowH = Math.max(lbl.height, dsc.height);
    return { rowY: y, rowH };
  }

  _addSymbolBadge(y, w, h, halfW, pad, opts) {
    const sf = this.sf;
    const badgeX = -halfW + pad + w / 2;
    const textX = badgeX + w / 2 + Math.round(14 * sf);
    const descWidth = (halfW - pad) * 2 - (textX + halfW);

    const row = this.scene.add.container(0, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(opts.fill, 1);
    bg.lineStyle(2, opts.border, 0.8);
    bg.fillRoundedRect(badgeX - w / 2, 0, w, h, 10);
    bg.strokeRoundedRect(badgeX - w / 2, 0, w, h, 10);
    row.add(bg);
    this._add(bg);

    const symText = this.scene.add.text(badgeX, h / 2, opts.text, {
      ...FONT.UI, fontSize: `${Math.round(h * 0.55)}px`, color: opts.textColor,
    }).setOrigin(0.5);
    row.add(symText);
    this._add(symText);

    const name = this.scene.add.text(textX, 0, opts.name, {
      ...FONT.UI, fontSize: `${Math.round(30 * sf)}px`, color: '#F0F0FF',
    }).setOrigin(0, 0);
    row.add(name);
    this._add(name);

    const desc = this.scene.add.text(textX, name.height + Math.round(4 * sf), opts.desc, {
      ...FONT.LABEL, fontSize: `${Math.round(26 * sf)}px`, color: '#A0A0C0',
      wordWrap: { width: Math.max(descWidth, 100) },
    }).setOrigin(0, 0);
    row.add(desc);
    this._add(desc);

    const rowH = Math.max(h, name.height + Math.round(4 * sf) + desc.height);
    this.content.add(row);
    this._add(row);
    return y + rowH + Math.round(12 * sf);
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
  }
}

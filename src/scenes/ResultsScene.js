import Phaser from 'phaser';
import { drawBackground, makeTextButton, drawPanel } from '../utils/draw.js';
import { COLOR, FONT, POSITION_REWARDS } from '../constants.js';
import { addCoins } from '../utils/storage.js';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('ResultsScene'); }

  create(data) {
    drawBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const sf = Math.min(W / 1080, H / 2340);

    const data_ = data || {
      position: 1, totalPlayers: 8, cellsClosed: 0,
      bestStreak: 0, jackpotsUsed: 0, coinsEarned: 75,
    };

    // Main panel
    const panelW = Math.min(Math.round(900 * sf), W - 40);
    const panelH = Math.round(1500 * sf);
    const panelX = (W - panelW) / 2;
    const panelY = Math.round(180 * sf);
    const panel = this.add.graphics();
    drawPanel(panel, panelX, panelY, panelW, panelH, 24);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeOut',
    });

    // "YOU PLACED"
    const youPlaced = this.add.text(cx, panelY + Math.round(60 * sf), 'YOU PLACED', {
      ...FONT.UI, fontSize: `${Math.round(54 * sf)}px`, color: '#F0F0FF',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: youPlaced,
      alpha: 1,
      duration: 300,
      delay: 200,
    });

    // Position display
    const trophyMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const trophy = trophyMap[data_.position] || '';
    if (trophy) {
      const trophyText = this.add.text(cx, panelY + Math.round(160 * sf), trophy, {
        fontSize: `${Math.round(144 * sf)}px`,
      }).setOrigin(0.5).setScale(0).setAlpha(0);
      this.tweens.add({
        targets: trophyText,
        scaleX: 1, scaleY: 1, alpha: 1,
        duration: 500,
        delay: 400,
        ease: 'Back.easeOut',
      });
    }

    const ord = this._ordinal(data_.position);
    const posText = this.add.text(cx, panelY + Math.round(260 * sf), `${ord} / ${data_.totalPlayers}`, {
      ...FONT.UI, fontSize: `${Math.round(72 * sf)}px`, color: '#F0F0FF',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: posText,
      alpha: 1,
      duration: 300,
      delay: 600,
    });

    // Stat rows
    const statStartY = panelY + Math.round(360 * sf);
    const stats = [
      ['💰', 'Coins earned',  data_.coinsEarned],
      ['⬜', 'Cells closed',  `${data_.cellsClosed} / 24`],
      ['🔥', 'Best streak',   String(data_.bestStreak)],
      ['★',  'Jackpots used', String(data_.jackpotsUsed)],
    ];

    stats.forEach(([icon, label, value], i) => {
      const sy = statStartY + i * Math.round(120 * sf);

      const row = this.add.container(cx, sy);
      row.setAlpha(0);

      const iconTxt = this.add.text(Math.round(-320 * sf), 0, icon, {
        fontSize: `${Math.round(64 * sf)}px`,
      }).setOrigin(0, 0.5);
      const labelTxt = this.add.text(Math.round(-220 * sf), 0, label, {
        ...FONT.LABEL, fontSize: `${Math.round(48 * sf)}px`, color: '#A0A0C0',
      }).setOrigin(0, 0.5);
      const valueTxt = this.add.text(Math.round(300 * sf), 0, String(value), {
        ...FONT.UI, fontSize: `${Math.round(54 * sf)}px`, color: '#F0F0FF',
      }).setOrigin(1, 0.5);

      row.add([iconTxt, labelTxt, valueTxt]);

      this.tweens.add({
        targets: row,
        alpha: 1,
        x: cx,
        duration: 300,
        delay: 700 + i * 120,
        ease: 'Back.easeOut',
      });
      row.setX(cx + 60);

      if (i === 0 && typeof value === 'number') {
        const counter = this.tweens.addCounter({
          from: 0,
          to: value,
          duration: 800,
          delay: 700 + i * 120 + 300,
          onUpdate: (tween) => {
            valueTxt.setText(String(Math.floor(tween.getValue())));
          },
        });
      }
    });

    // Save coins
    addCoins(data_.coinsEarned);

    // Buttons
    const btnW = Math.round(400 * sf);
    const btnH = Math.round(100 * sf);
    const btnY = panelY + panelH - Math.round(280 * sf);
    const playAgain = makeTextButton(this, cx, btnY, btnW, btnH, 'PLAY AGAIN', {
      fontSize: `${Math.round(48 * sf)}px`,
    });
    playAgain.setAlpha(0);
    this.tweens.add({
      targets: playAgain,
      alpha: 1,
      duration: 300,
      delay: 1400,
    });

    const mainMenu = makeTextButton(this, cx, btnY + Math.round(140 * sf), btnW, btnH, 'MAIN MENU', {
      fontSize: `${Math.round(48 * sf)}px`,
    });
    mainMenu.setAlpha(0);
    this.tweens.add({
      targets: mainMenu,
      alpha: 1,
      duration: 300,
      delay: 1500,
    });

    playAgain.on('pointerdown', () => {
      this.scene.start('MatchScene');
    });
    mainMenu.on('pointerdown', () => {
      this.scene.start('MatchScene');
    });
  }

  _ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}

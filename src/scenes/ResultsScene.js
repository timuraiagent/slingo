import Phaser from 'phaser';
import { drawBackground, makeTextButton, drawPanel } from '../utils/draw.js';
import { COLOR, FONT, POSITION_REWARDS } from '../constants.js';
import { addCoins } from '../utils/storage.js';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('ResultsScene'); }

  create(data) {
    drawBackground(this);

    const W = this.scale.width;
    const cx = W / 2;
    const data_ = data || {
      position: 1, totalPlayers: 8, cellsClosed: 0,
      bestStreak: 0, jackpotsUsed: 0, coinsEarned: 75,
    };

    // Main panel
    const panelX = 90;
    const panelY = 300;
    const panelW = 900;
    const panelH = 1300;
    const panel = this.add.graphics();
    drawPanel(panel, panelX, panelY, panelW, panelH, 24);

    // "YOU PLACED"
    this.add.text(cx, panelY + 60, 'YOU PLACED', {
      ...FONT.UI, fontSize: '36px', color: '#F0F0FF',
    }).setOrigin(0.5);

    // Position display
    const trophyMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const trophy = trophyMap[data_.position] || '';
    if (trophy) {
      this.add.text(cx, panelY + 160, trophy, {
        fontSize: '96px',
      }).setOrigin(0.5);
    }

    const ord = this._ordinal(data_.position);
    this.add.text(cx, panelY + 260, `${ord} / ${data_.totalPlayers}`, {
      ...FONT.UI, fontSize: '40px', color: '#F0F0FF',
    }).setOrigin(0.5);

    // Stat rows
    const statStartY = panelY + 360;
    const stats = [
      ['💰', 'Coins earned',  data_.coinsEarned],
      ['⬜', 'Cells closed',  `${data_.cellsClosed} / 24`],
      ['🔥', 'Best streak',   String(data_.bestStreak)],
      ['★',  'Jackpots used', String(data_.jackpotsUsed)],
    ];

    stats.forEach(([icon, label, value], i) => {
      const sy = statStartY + i * 100;
      const rowAlpha = { from: 0, to: 1 };

      const row = this.add.container(cx, sy);
      row.setAlpha(0);

      const iconTxt = this.add.text(-300, 0, icon, { fontSize: '36px' }).setOrigin(0, 0.5);
      const labelTxt = this.add.text(-240, 0, label, {
        ...FONT.LABEL, fontSize: '26px', color: '#A0A0C0',
      }).setOrigin(0, 0.5);
      const valueTxt = this.add.text(300, 0, String(value), {
        ...FONT.UI, fontSize: '30px', color: '#F0F0FF',
      }).setOrigin(1, 0.5);

      row.add([iconTxt, labelTxt, valueTxt]);

      this.tweens.add({
        targets: row,
        alpha: 1,
        duration: 200,
        delay: i * 100,
      });

      // Animate coins counter
      if (i === 0 && typeof value === 'number') {
        const counter = this.tweens.addCounter({
          from: 0,
          to: value,
          duration: 800,
          delay: i * 100 + 200,
          onUpdate: (tween) => {
            valueTxt.setText(String(Math.floor(tween.getValue())));
          },
        });
      }
    });

    // Save coins
    addCoins(data_.coinsEarned);

    // Buttons
    const btnY = panelY + panelH - 200;
    const playAgain = makeTextButton(this, cx, btnY, 400, 100, 'PLAY AGAIN');
    const mainMenu = makeTextButton(this, cx, btnY + 130, 400, 100, 'MAIN MENU');

    playAgain.on('pointerdown', () => {
      this.scene.start('MatchScene');
    });
    mainMenu.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  _ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}

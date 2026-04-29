import Phaser from 'phaser';
import { drawBackground, makeTextButton } from '../utils/draw.js';
import { COLOR, FONT, POSITION_REWARDS } from '../constants.js';
import { addCoins } from '../utils/storage.js';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  create(data) {
    drawBackground(this);

    const coinsEarned = POSITION_REWARDS[data.position] || 75;
    addCoins(coinsEarned);

    const W = this.scale.width;
    const H = this.scale.height;
    const panelX = 90;
    const panelY = 300;
    const panelW = 900;
    const panelH = 1300;

    const panel = this.add.graphics();
    panel.fillStyle(COLOR.BG_MID, 1);
    panel.lineStyle(2, COLOR.BORDER, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 24);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 24);

    this.add.text(W / 2, panelY + 80, 'YOU PLACED', {
      ...FONT.UI, fontSize: '36px', color: '#F0F0FF',
    }).setOrigin(0.5);

    const trophyMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const suffixMap = { 1: 'st', 2: 'nd', 3: 'rd' };
    const suffix = suffixMap[data.position] || 'th';

    if (trophyMap[data.position]) {
      this.add.text(W / 2, panelY + 180, trophyMap[data.position], {
        fontSize: '96px',
      }).setOrigin(0.5);
    }
    this.add.text(W / 2, panelY + 280, `${data.position}${suffix} / ${data.totalPlayers}`, {
      ...FONT.UI, fontSize: '52px', color: '#FFD700',
    }).setOrigin(0.5);

    const rows = [
      ['💰', 'Coins earned', coinsEarned],
      ['⬜', 'Cells closed', `${data.cellsClosed} / 24`],
      ['🔥', 'Best streak', data.bestStreak],
      ['★', 'Jackpots used', data.jackpotsUsed],
    ];

    rows.forEach(([icon, label, value], i) => {
      const y = panelY + 420 + i * 80;
      const rowText = this.add.text(W / 2, y, `${icon} ${label}: ${value}`, {
        ...FONT.UI, fontSize: '30px', color: '#F0F0FF',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: rowText,
        alpha: 1,
        delay: 200 + i * 100,
        duration: 300,
      });
    });

    makeTextButton(this, W / 2, panelY + panelH - 180, 320, 80, 'PLAY AGAIN', { fontSize: '32px' }, () => {
      this.scene.start('MatchScene');
    });

    makeTextButton(this, W / 2, panelY + panelH - 80, 320, 80, 'MAIN MENU', { fontSize: '32px' }, () => {
      this.scene.start('MenuScene');
    });
  }
}

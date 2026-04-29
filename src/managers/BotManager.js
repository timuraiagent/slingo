import { bus } from '../utils/eventBus.js';
import { BingoCardManager } from './BingoCardManager.js';
import { generateCard } from '../data/cardLayouts.js';
import { SeededRandom } from '../utils/seededRandom.js';
import { BOT_PROFILES } from '../data/botProfiles.js';

export class BotManager {
  constructor(scene, seedBase) {
    this.scene = scene;
    this.bots = [];
    this.startTime = 0;
    this._events = [];

    BOT_PROFILES.forEach((profile, i) => {
      const rng = new SeededRandom(seedBase + i + 1);
      const card = generateCard(rng);
      const cardManager = new BingoCardManager(card);
      this.bots.push({
        ...profile,
        cardManager,
        nextSpin: 0,
        closedCount: 1, // FREE counts
      });
    });
  }

  start() {
    this.startTime = this.scene.time.now;
    this.bots.forEach((bot) => {
      const [min, max] = bot.spinInterval;
      bot.nextSpin = this.scene.time.now + Math.floor(Math.random() * (max - min + 1)) + min;
    });

    this._updateEvent = this.scene.time.addEvent({
      delay: 100,
      callback: () => this._update(),
      loop: true,
    });
  }

  _update() {
    const now = this.scene.time.now;
    const elapsed = now - this.startTime;

    this.bots.forEach((bot) => {
      if (now >= bot.nextSpin) {
        const [min, max] = bot.spinInterval;
        bot.nextSpin = now + Math.floor(Math.random() * (max - min + 1)) + min;
        this._simulateSpin(bot, elapsed);
      }
    });
  }

  _simulateSpin(bot, elapsedMs) {
    const open = bot.cardManager.getOpenNumbers();
    const roll = Math.random();
    const hit = roll < bot.skill && open.length > 0;
    const number = hit
      ? open[Math.floor(Math.random() * open.length)]
      : Math.floor(Math.random() * 75) + 1;
    const closed = bot.cardManager.closeNumber(number);
    if (closed) bot.closedCount = bot.cardManager.getClosedCount();

    // Grace period: no bot wins in first 30s
    if (elapsedMs < 30000) return;

    if (bot.cardManager.isWon()) {
      bus.emit('bot:won', bot);
    }
    bus.emit('leaderboard:update');
  }

  hasAnyBotNearWin() {
    return this.bots.some((b) => b.cardManager.getNearWinLines().length > 0);
  }

  getStandings(playerCardManager) {
    const all = this.bots.map((b) => ({
      name: b.name,
      closedCount: b.closedCount,
      nearWin: b.cardManager.getNearWinLines().length,
      isPlayer: false,
    }));

    const playerNearWin = playerCardManager.getNearWinLines().length;
    all.push({
      name: 'You',
      closedCount: playerCardManager.getClosedCount(),
      nearWin: playerNearWin,
      isPlayer: true,
    });

    all.sort((a, b) => {
      const scoreA = a.closedCount + a.nearWin * 0.5;
      const scoreB = b.closedCount + b.nearWin * 0.5;
      return scoreB - scoreA;
    });

    return all;
  }

  destroy() {
    if (this._updateEvent) this._updateEvent.remove();
    this._updateEvent = null;
  }
}

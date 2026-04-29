import { bus } from '../utils/eventBus.js';
import { generateCard } from '../data/cardLayouts.js';
import { BingoCardManager } from './BingoCardManager.js';
import { BOT_PROFILES } from '../data/botProfiles.js';
import { SeededRandom } from '../utils/seededRandom.js';

export class BotManager {
  constructor(scene, rngSeed) {
    this.scene = scene;
    this.bots = [];
    this.timers = [];
    this.matchStartTime = 0;
    this._handlers = [];

    BOT_PROFILES.forEach((profile, i) => {
      const rng = new SeededRandom(rngSeed + i + 1000);
      const grid = generateCard(rng);
      const cardManager = new BingoCardManager(grid);
      this.bots.push({
        ...profile,
        cardManager,
        rng,
        closedCount: 0,
      });
    });
  }

  start() {
    this.matchStartTime = this.scene.time.now;
    this.bots.forEach((bot, i) => {
      const [lo, hi] = bot.spinInterval;
      const delay = lo + Math.floor(bot.rng.next() * (hi - lo));
      const timer = this.scene.time.addEvent({
        delay,
        callback: () => this.simulateSpin(bot, i),
        loop: true,
      });
      this.timers.push(timer);
    });
  }

  simulateSpin(bot, botIndex) {
    const openNumbers = bot.cardManager.getOpenNumbers();
    const roll = bot.rng.next();

    let number;
    if (roll < bot.skill && openNumbers.length > 0) {
      number = bot.rng.pickFrom(openNumbers);
    } else {
      number = bot.rng.intBetween(1, 75);
    }

    const result = bot.cardManager.closeNumber(number);
    if (result) {
      bot.closedCount = bot.cardManager.getClosedCount();
      // Only emit bot:won after 30-second grace period
      if (bot.cardManager.isWon() && this.scene.time.now - this.matchStartTime >= 30000) {
        bus.emit('bot:won', { bot, botIndex });
        // Stop only this bot's timer
        if (this.timers[botIndex]) {
          this.timers[botIndex].remove();
        }
      }
    }

    bus.emit('leaderboard:update');
  }

  hasAnyBotNearWin() {
    return this.bots.some(b => b.cardManager.getNearWinLines().length > 0);
  }

  getStandings() {
    return this.bots.map(b => ({
      name: b.name,
      closedCount: b.cardManager.getClosedCount(),
      lineProgress: this._bestLineProgress(b.cardManager),
    }));
  }

  _bestLineProgress(cm) {
    const progresses = cm.getLineProgress();
    return Math.max(...progresses.map(p => p.closedCount));
  }

  destroy() {
    this.timers.forEach(t => t.remove());
    this.timers = [];
  }
}

import { bus } from '../utils/eventBus.js';

export class MeterManager {
  constructor() {
    this.jackpotValue = 0;
    this.jackpotBalls = 0;
    this._handlers = [];
    this.nextSpinMultiplier = 1;
    this.streakBonusActive = false;
  }

  onUsefulHit(timingZone) {
    let charge = { PERFECT: 25, GREAT: 18, GOOD: 12, MISS: 8 }[timingZone] || 8;
    charge *= this.nextSpinMultiplier;
    this.nextSpinMultiplier = 1;
    if (this.streakBonusActive) {
      charge = Math.round(charge * 1.2);
    }
    this.addJackpot(charge);
  }

  onNearHit(timingZone) {
    let charge = { PERFECT: 10, GREAT: 7, GOOD: 4, MISS: 2 }[timingZone] || 2;
    if (this.streakBonusActive) {
      charge = Math.round(charge * 1.2);
    }
    this.addJackpot(charge);
  }

  onFullMiss(pityCounter) {
    if (pityCounter >= 4) {
      this.addJackpot(3);
    }
  }

  onJackpotSymbol() {
    this.addJackpot(30);
  }

  setNextMultiplier(mult) {
    this.nextSpinMultiplier = mult;
  }

  setStreakBonus(active) {
    this.streakBonusActive = active;
  }

  addJackpot(amount) {
    this.jackpotValue += amount;

    // Overflow rolls into next ball
    while (this.jackpotValue >= 100 && this.jackpotBalls < 1) {
      this.jackpotValue -= 100;
      this.jackpotBalls++;
      bus.emit('meter:jackpot:earned');
    }

    // Cap at 100 if already holding a ball (don't lose overflow, just cap display)
    if (this.jackpotBalls >= 1) {
      this.jackpotValue = Math.min(this.jackpotValue, 99);
    }

    bus.emit('meter:jackpot:updated', this.jackpotValue);
  }

  useJackpotBall() {
    if (this.jackpotBalls > 0) {
      this.jackpotBalls--;
      bus.emit('meter:jackpot:used');
      return true;
    }
    return false;
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
  }
}

import { bus } from '../utils/eventBus.js';

export class MeterManager {
  constructor() {
    this.jackpotValue = 0;
    this.jackpotBalls = 0;
    this._handlers = [];
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
  }

  onUsefulHit(timingZone) {
    const charge = { PERFECT: 25, GREAT: 18, GOOD: 12, MISS: 8 }[timingZone];
    this.addJackpot(charge);
  }

  onNearHit(timingZone) {
    const charge = { PERFECT: 10, GREAT: 7, GOOD: 4, MISS: 2 }[timingZone];
    this.addJackpot(charge);
  }

  onMiss() {
    this.addJackpot(3);
  }

  onJackpotSymbol() {
    this.addJackpot(30);
  }

  addJackpot(amount) {
    this.jackpotValue = Math.min(100, this.jackpotValue + amount);
    bus.emit('meter:jackpot:updated', this.jackpotValue);
    if (this.jackpotValue >= 100) {
      this.jackpotValue = 0;
      this.jackpotBalls++;
      bus.emit('meter:jackpot:earned');
    }
  }

  useJackpotBall() {
    if (this.jackpotBalls > 0) {
      this.jackpotBalls--;
      bus.emit('meter:jackpot:used');
      return true;
    }
    return false;
  }
}

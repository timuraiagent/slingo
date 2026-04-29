import { bus } from '../utils/eventBus.js';

export class StreakManager {
  constructor(meterManager) {
    this.current = 0;
    this.best = 0;
    this.meterManager = meterManager;
    this._handlers = [];
  }

  onUsefulHit() {
    this.current++;
    this.best = Math.max(this.best, this.current);
    bus.emit('streak:updated', this.current);

    // Persistent bonus at streak 5+
    if (this.current >= 5 && !this.meterManager.streakBonusActive) {
      this.meterManager.setStreakBonus(true);
    }

    this.checkMilestone();
  }

  onFullMiss() {
    if (this.current > 0) {
      bus.emit('streak:broken', this.current);
      this.current = 0;
      bus.emit('streak:updated', 0);
      // Remove streak bonus
      this.meterManager.setStreakBonus(false);
    }
  }

  checkMilestone() {
    if (this.current === 5) {
      this.meterManager.addJackpot(20);
      bus.emit('streak:milestone', 5);
    }
    if (this.current === 10) {
      this.meterManager.addJackpot(50);
      bus.emit('streak:milestone', 10);
    }
  }

  destroy() {}
}

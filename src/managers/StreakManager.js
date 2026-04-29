import { bus } from '../utils/eventBus.js';

export class StreakManager {
  constructor(meterManager) {
    this.current = 0;
    this.best = 0;
    this.meterManager = meterManager;
    this._handlers = [];
    this._on('card:useful-hit', () => this.onUsefulHit(), this);
    this._on('card:full-miss', () => this.onFullMiss(), this);
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
  }

  onUsefulHit() {
    this.current++;
    this.best = Math.max(this.best, this.current);
    bus.emit('streak:updated', this.current);
    this.checkMilestone();
  }

  onFullMiss() {
    if (this.current > 0) {
      bus.emit('streak:broken', this.current);
      this.current = 0;
      bus.emit('streak:updated', 0);
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
}

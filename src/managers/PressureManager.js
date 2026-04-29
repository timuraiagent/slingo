import { bus } from '../utils/eventBus.js';

export class PressureManager {
  constructor(cardManager, botManager) {
    this.cardManager = cardManager;
    this.botManager = botManager;
    this.active = false;
    this._handlers = [];
  }

  checkPressure() {
    const playerNearWin = this.cardManager.getNearWinLines().length > 0;
    const botNearWin = this.botManager.hasAnyBotNearWin();
    const newState = playerNearWin || botNearWin;

    if (newState !== this.active) {
      this.active = newState;
      bus.emit(newState ? 'pressure:start' : 'pressure:end', {
        source: playerNearWin ? 'player' : 'bot',
      });
    }
  }

  destroy() {}
}

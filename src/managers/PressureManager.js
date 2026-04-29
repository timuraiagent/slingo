import { bus } from '../utils/eventBus.js';

export class PressureManager {
  constructor(cardManager, botManager) {
    this.cardManager = cardManager;
    this.botManager = botManager;
    this.active = false;
    this.source = null;
  }

  checkPressure() {
    const playerNearWin = this.cardManager.getNearWinLines().length > 0;
    const botNearWin = this.botManager.hasAnyBotNearWin();

    const newState = playerNearWin || botNearWin;
    const newSource = playerNearWin ? 'player' : botNearWin ? 'bot' : null;

    if (newState !== this.active) {
      this.active = newState;
      this.source = newSource;
      bus.emit(newState ? 'pressure:start' : 'pressure:end', {
        source: newSource,
      });
    }
  }
}

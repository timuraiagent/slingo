export class LeaderboardManager {
  constructor(playerCardManager, botManager) {
    this.playerCardManager = playerCardManager;
    this.botManager = botManager;
  }

  getPosition() {
    const standings = this.botManager.getStandings(this.playerCardManager);
    const idx = standings.findIndex((s) => s.isPlayer);
    return idx + 1;
  }

  getAllSorted() {
    return this.botManager.getStandings(this.playerCardManager);
  }
}

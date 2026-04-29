export class LeaderboardManager {
  constructor(playerCardManager, botManager) {
    this.playerCardManager = playerCardManager;
    this.botManager = botManager;
  }

  _playerScore() {
    const closed = this.playerCardManager.getClosedCount();
    const nearWinLines = this.playerCardManager.getNearWinLines();
    const nearWinBonus = nearWinLines.length * 0.5;
    return { score: closed + nearWinBonus, closed };
  }

  _botScore(bot) {
    const closed = bot.cardManager.getClosedCount();
    const nearWinLines = bot.cardManager.getNearWinLines();
    const nearWinBonus = nearWinLines.length * 0.5;
    return { score: closed + nearWinBonus, closed };
  }

  getAllSorted() {
    const ps = this._playerScore();
    const entries = [
      { name: 'You', ...ps, isPlayer: true },
      ...this.botManager.bots.map(b => ({
        name: b.name,
        ...this._botScore(b),
        isPlayer: false,
      })),
    ];
    // Sort by score desc, tie-break by closed count desc
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.closed - a.closed;
    });
    return entries;
  }

  getPosition() {
    const sorted = this.getAllSorted();
    const idx = sorted.findIndex(e => e.isPlayer);
    return idx + 1;
  }

  destroy() {}
}

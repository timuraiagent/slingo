export class BingoCardManager {
  constructor(grid) {
    this.grid = grid; // number[][] row-major
    this.closed = new Set();
    this.closed.add('2,2'); // FREE
  }

  canClose(number) {
    if (number === 0) return false;
    const pos = this._find(number);
    if (!pos) return false;
    return !this.closed.has(`${pos.col},${pos.row}`);
  }

  closeNumber(number) {
    const pos = this._find(number);
    if (!pos) return null;
    const key = `${pos.col},${pos.row}`;
    if (this.closed.has(key)) return null;
    this.closed.add(key);
    return pos;
  }

  closeCell(col, row) {
    const key = `${col},${row}`;
    if (this.closed.has(key)) return false;
    this.closed.add(key);
    return true;
  }

  getOpenNumbers() {
    const out = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const key = `${c},${r}`;
        if (!this.closed.has(key) && this.grid[r][c] !== 0) {
          out.push(this.grid[r][c]);
        }
      }
    }
    return out;
  }

  getClosedCount() {
    return this.closed.size;
  }

  getProgressByLine() {
    const lines = this._allLines();
    return lines.map(line => {
      const closedCount = line.cells.filter(([c, r]) => this.closed.has(`${c},${r}`)).length;
      return { line, closedCount };
    });
  }

  getNearWinLines() {
    return this.getProgressByLine().filter(p => p.closedCount === 4);
  }

  getCompletedLines() {
    return this.getProgressByLine().filter(p => p.closedCount === 5);
  }

  isWon() {
    return this.getCompletedLines().length > 0;
  }

  _find(number) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.grid[r][c] === number) return { col: c, row: r };
      }
    }
    return null;
  }

  _allLines() {
    const lines = [];
    // Rows
    for (let r = 0; r < 5; r++) {
      lines.push({ type: 'row', index: r, cells: [[0, r], [1, r], [2, r], [3, r], [4, r]] });
    }
    // Cols
    for (let c = 0; c < 5; c++) {
      lines.push({ type: 'col', index: c, cells: [[c, 0], [c, 1], [c, 2], [c, 3], [c, 4]] });
    }
    // Diagonals
    lines.push({ type: 'diag', index: 0, cells: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]] });
    lines.push({ type: 'diag', index: 1, cells: [[4, 0], [3, 1], [2, 2], [1, 3], [0, 4]] });
    return lines;
  }
}

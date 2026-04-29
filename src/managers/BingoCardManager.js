import { bus } from '../utils/eventBus.js';

export class BingoCardManager {
  constructor(grid) {
    this.grid = grid;           // number[][] (row-major)
    this.closed = new Set();    // "col,row" strings
    this.closed.add('2,2');     // FREE center
  }

  _key(col, row) { return `${col},${row}`; }

  canClose(number) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.grid[r][c] === number && !this.closed.has(this._key(c, r))) {
          return true;
        }
      }
    }
    return false;
  }

  closeNumber(number) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.grid[r][c] === number && !this.closed.has(this._key(c, r))) {
          this.closed.add(this._key(c, r));
          return { col: c, row: r };
        }
      }
    }
    return null;
  }

  closeCell(col, row) {
    const key = this._key(col, row);
    if (!this.closed.has(key)) {
      this.closed.add(key);
      return true;
    }
    return false;
  }

  isOpen(col, row) {
    return !this.closed.has(this._key(col, row));
  }

  getOpenNumbers() {
    const nums = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!this.closed.has(this._key(c, r)) && this.grid[r][c] !== 0) {
          nums.push(this.grid[r][c]);
        }
      }
    }
    return nums;
  }

  getClosedCount() {
    return this.closed.size - 1; // exclude FREE
  }

  _getLineCells() {
    const lines = [];
    // Rows
    for (let r = 0; r < 5; r++) {
      const cells = [];
      for (let c = 0; c < 5; c++) cells.push({ col: c, row: r });
      lines.push(cells);
    }
    // Columns
    for (let c = 0; c < 5; c++) {
      const cells = [];
      for (let r = 0; r < 5; r++) cells.push({ col: c, row: r });
      lines.push(cells);
    }
    // Diagonals
    lines.push([{ col: 0, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 3 }, { col: 4, row: 4 }]);
    lines.push([{ col: 4, row: 0 }, { col: 3, row: 1 }, { col: 2, row: 2 }, { col: 1, row: 3 }, { col: 0, row: 4 }]);
    return lines;
  }

  getCompletedLines() {
    return this._getLineCells().filter(line =>
      line.every(({ col, row }) => this.closed.has(this._key(col, row)))
    );
  }

  getNearWinLines() {
    return this._getLineCells().filter(line => {
      const closedCount = line.filter(({ col, row }) => this.closed.has(this._key(col, row))).length;
      return closedCount === 4;
    });
  }

  isWon() {
    return this.getCompletedLines().length > 0;
  }

  getLineProgress() {
    return this._getLineCells().map(line => {
      const closedCount = line.filter(({ col, row }) => this.closed.has(this._key(col, row))).length;
      return { line, closedCount };
    });
  }

  isNearNumber(number, range = 5) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!this.closed.has(this._key(c, r)) && this.grid[r][c] !== 0) {
          if (Math.abs(this.grid[r][c] - number) <= range) {
            return { col: c, row: r };
          }
        }
      }
    }
    return null;
  }

  destroy() {}
}

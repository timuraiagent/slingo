const COLUMN_RANGES = [
  [1, 15],   // B
  [16, 30],  // I
  [31, 45],  // N
  [46, 60],  // G
  [61, 75],  // O
];

export function generateCard(rng) {
  const grid = [];
  for (let col = 0; col < 5; col++) {
    const [lo, hi] = COLUMN_RANGES[col];
    const pool = [];
    for (let n = lo; n <= hi; n++) pool.push(n);
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = rng.intBetween(0, i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    grid.push(pool.slice(0, 5));
  }
  // Transpose to row-major: grid[row][col]
  const rowMajor = [];
  for (let row = 0; row < 5; row++) {
    rowMajor.push([]);
    for (let col = 0; col < 5; col++) {
      rowMajor[row].push(grid[col][row]);
    }
  }
  // Center = FREE (0)
  rowMajor[2][2] = 0;
  return rowMajor;
}

export function getColumnForNumber(number) {
  if (number >= 1 && number <= 15) return 0;
  if (number >= 16 && number <= 30) return 1;
  if (number >= 31 && number <= 45) return 2;
  if (number >= 46 && number <= 60) return 3;
  if (number >= 61 && number <= 75) return 4;
  return -1;
}

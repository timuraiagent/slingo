import { COLUMN_RANGES } from '../constants.js';

export function generateCard(rng) {
  const grid = [];
  for (let col = 0; col < 5; col++) {
    const [min, max] = COLUMN_RANGES[col];
    const nums = new Set();
    while (nums.size < 5) {
      nums.add(rng.intBetween(min, max));
    }
    const arr = Array.from(nums).sort((a, b) => a - b);
    for (let row = 0; row < 5; row++) {
      if (!grid[row]) grid[row] = [];
      grid[row][col] = arr[row];
    }
  }
  grid[2][2] = 0; // FREE
  return grid;
}

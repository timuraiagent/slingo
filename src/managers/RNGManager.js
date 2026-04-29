import { SeededRandom } from '../utils/seededRandom.js';

export class RNGManager {
  constructor(seed) {
    this.rng = new SeededRandom(seed);
    this.pityCounter = 0;
  }

  getSpinNumber(cardManager, timingZone) {
    const neededNumbers = cardManager.getOpenNumbers();
    const base = this.rng.next();

    const biasTable = { PERFECT: 0.55, GREAT: 0.45, GOOD: 0.35, MISS: 0.25 };
    const pityBoost = Math.max(0, this.pityCounter - 3) * 0.10;
    const targetBias = Math.min(biasTable[timingZone] + pityBoost, 0.60);

    if (base < targetBias && neededNumbers.length > 0) {
      return this.rng.pickFrom(neededNumbers);
    }
    return this.rng.intBetween(1, 75);
  }

  recordUsefulHit() { this.pityCounter = 0; }
  recordMiss() { this.pityCounter++; }

  getRng() { return this.rng; }
}

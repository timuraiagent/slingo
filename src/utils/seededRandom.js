export class SeededRandom {
  constructor(seed = Date.now()) {
    this.seed = seed;
  }

  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  intBetween(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pickFrom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[this.intBetween(0, arr.length - 1)];
  }
}

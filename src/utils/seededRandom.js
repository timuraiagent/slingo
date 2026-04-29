export class SeededRandom {
  constructor(seed) {
    this.state = seed | 0;
    if (this.state === 0) this.state = 1;
  }

  next() {
    // mulberry32
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  intBetween(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pickFrom(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  weightedPick(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = this.next() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }
}

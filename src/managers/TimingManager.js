export class TimingManager {
  getZone(position) {
    // position: 0.0–1.0
    // MISS: 0.0–0.10, GOOD: 0.10–0.30, GREAT: 0.30–0.42, PERFECT: 0.42–0.58
    // GREAT: 0.58–0.70, GOOD: 0.70–0.90, MISS: 0.90–1.0
    if (position >= 0.42 && position <= 0.58) return 'PERFECT';
    if (position >= 0.30 && position < 0.42) return 'GREAT';
    if (position >= 0.58 && position < 0.70) return 'GREAT';
    if (position >= 0.10 && position < 0.30) return 'GOOD';
    if (position >= 0.70 && position < 0.90) return 'GOOD';
    return 'MISS';
  }

  getBiasValue(zone) {
    return { PERFECT: 0.55, GREAT: 0.45, GOOD: 0.35, MISS: 0.25 }[zone] || 0.25;
  }
}

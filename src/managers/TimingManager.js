export class TimingManager {
  getZone(position) {
    // position 0.0–1.0
    if (position >= 0.42 && position < 0.58) return 'PERFECT';
    if (position >= 0.30 && position < 0.70) return 'GREAT';
    if (position >= 0.10 && position < 0.90) return 'GOOD';
    return 'MISS';
  }

  getBiasMultiplier(zone) {
    return { PERFECT: 0.55, GREAT: 0.45, GOOD: 0.35, MISS: 0.25 }[zone];
  }
}

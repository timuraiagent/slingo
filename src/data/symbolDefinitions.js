export const SYMBOLS = [
  { id: 'number', weight: 82, label: null },
  { id: 'jackpot', weight: 8, label: '★' },
  { id: 'wild', weight: 5, label: '🌟' },
  { id: 'multiplier', weight: 5, label: '×2' },
];

export function rollSymbolType(rng) {
  const total = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  let roll = rng.next() * total;
  for (const sym of SYMBOLS) {
    roll -= sym.weight;
    if (roll <= 0) return sym.id;
  }
  return 'number';
}

export function getCoins() {
  const raw = localStorage.getItem('slingo_coins');
  return raw ? parseInt(raw, 10) : 0;
}

export function addCoins(amount) {
  const current = getCoins();
  const next = current + amount;
  localStorage.setItem('slingo_coins', String(next));
  return next;
}

export function getVolume() {
  const raw = localStorage.getItem('slingo_volume');
  return raw !== null ? parseFloat(raw) : 0.7;
}

export function setVolume(v) {
  localStorage.setItem('slingo_volume', String(v));
}

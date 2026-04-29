const STORAGE_KEY = 'slingo_mvp';

function _load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function _save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTotalCoins() {
  return _load().coins || 0;
}

export function addCoins(amount) {
  const data = _load();
  data.coins = (data.coins || 0) + amount;
  _save(data);
  return data.coins;
}

export function getVolume() {
  return _load().volume ?? 0.7;
}

export function setVolume(v) {
  const data = _load();
  data.volume = v;
  _save(data);
}

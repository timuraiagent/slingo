// Layout constants — sizes are computed dynamically in scenes using computeLayout()

export const BASE_W = 1080;
export const BASE_H = 2340;

export const POSITION_REWARDS = {
  1: 500, 2: 350, 3: 250,
  4: 150, 5: 150,
  6: 75, 7: 75, 8: 75,
};

export const COLOR = {
  BG_DARK:    0x0D0D1A,
  BG_MID:     0x161628,
  BG_LIGHT:   0x1E1E3A,
  GOLD:       0xFFD700,
  GOLD_DARK:  0xB8860B,
  GREEN_HIT:  0x2ECC71,
  GREEN_DARK: 0x1A7A44,
  ORANGE_HOT: 0xFF8C00,
  RED_PRESS:  0xE74C3C,
  BLUE:       0x3498DB,
  PURPLE:     0x9B59B6,
  WHITE:      0xFFFFFF,
  GREY:       0x4A4A6A,
  BORDER:     0x3A3A60,
};

export const FONT = {
  NUMBER: { fontFamily: 'Rajdhani', fontStyle: 'bold' },
  UI:     { fontFamily: 'Nunito',   fontStyle: 'bold' },
  LABEL:  { fontFamily: 'Nunito' },
};

export const DEBUG_FLAGS = {
  cellTap: false,
};

const params = new URLSearchParams(window.location.search);
export const DEBUG_MODE = params.has('debug') && params.get('debug') === '1';

// Dynamic layout — bottom sections get minimum usable sizes,
// card fills whatever space remains.
export function computeLayout(W, H) {
  const sf = Math.min(W / BASE_W, H / BASE_H);

  // Fixed sections with minimums for usability
  const SAFE_TOP = Math.max(Math.round(40 * sf), 16);
  const SAFE_BOTTOM = Math.max(Math.round(60 * sf), 24);
  const HUD_HEIGHT = Math.max(Math.round(70 * sf), 36);
  const GAP = Math.max(Math.round(24 * sf), 8);

  const CONTROL_HEIGHT = Math.max(Math.round(220 * sf), 100);
  const SLOT_HEIGHT = Math.max(Math.round(420 * sf), 156);
  const TIMING_HEIGHT = Math.max(Math.round(140 * sf), 48);
  const METER_HEIGHT = Math.max(Math.round(80 * sf), 32);

  // Bottom-up layout — these are fixed
  const controlY = H - SAFE_BOTTOM - CONTROL_HEIGHT;
  const slotY = controlY - SLOT_HEIGHT - GAP;
  const timingY = slotY - TIMING_HEIGHT - GAP;
  const meterY = timingY - METER_HEIGHT - GAP;

  // Card fills remaining space between HUD and meter
  const cardTop = SAFE_TOP + HUD_HEIGHT + GAP;
  const cardAvailH = meterY - cardTop - GAP; // space for card + small margin
  const cardAvailW = W - Math.round(16 * sf) * 2;

  // Compute cell size to fit within available space
  const CARD_SIZE = 5;
  const CELL_GAP = Math.max(Math.round(14 * sf), 4);
  // Card is square (5×5), so size = min(availW, availH)
  const maxCardSide = Math.min(cardAvailW, cardAvailH);
  const CELL_SIZE = Math.max(Math.floor((maxCardSide - (CARD_SIZE - 1) * CELL_GAP) / CARD_SIZE), 40);
  const CARD_W = CARD_SIZE * CELL_SIZE + (CARD_SIZE - 1) * CELL_GAP;

  const cardX = (W - CARD_W) / 2;
  const cardY = cardTop;

  // Slot symbol sizing
  const SYMBOL_W = Math.round(CELL_SIZE);
  const SYMBOL_H = Math.round(SLOT_HEIGHT / 3);

  const cx = W / 2;

  return {
    W, H, sf, cx,
    SAFE_TOP, SAFE_BOTTOM, HUD_HEIGHT, GAP,
    CELL_SIZE, CELL_GAP, CARD_SIZE, CARD_W,
    CONTROL_HEIGHT, SLOT_HEIGHT, TIMING_HEIGHT, METER_HEIGHT,
    SYMBOL_W, SYMBOL_H,
    controlY, slotY, timingY, meterY,
    cardX, cardY,
  };
}

// Layout constants — sizes are computed dynamically in scenes using computeLayout()
// These are BASE reference values for the 1080×2340 design spec

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

// Dynamic layout computation — call from scene.create() after getting W, H
export function computeLayout(W, H) {
  const sf = Math.min(W / BASE_W, H / BASE_H);

  const SAFE_TOP = Math.round(40 * sf);
  const SAFE_BOTTOM = Math.round(60 * sf);
  const HUD_HEIGHT = Math.round(70 * sf);
  const GAP = Math.round(32 * sf);

  const CELL_SIZE = Math.round(180 * sf * 1.12); // 12% bigger cells
  const CELL_GAP = Math.round(14 * sf);
  const CARD_SIZE = 5;
  const CARD_W = CARD_SIZE * CELL_SIZE + (CARD_SIZE - 1) * CELL_GAP;

  const CONTROL_HEIGHT = Math.round(220 * sf);
  const SLOT_HEIGHT = Math.round(420 * sf); // taller slots for readability
  const TIMING_HEIGHT = Math.round(140 * sf); // proper 140px height
  const METER_HEIGHT = Math.round(80 * sf);

  // Slot symbol sizing
  const SYMBOL_W = Math.round(CELL_SIZE);
  const SYMBOL_H = Math.round(SLOT_HEIGHT / 3);

  // Bottom-up layout
  const controlY = H - SAFE_BOTTOM - CONTROL_HEIGHT;
  const slotY = controlY - SLOT_HEIGHT - GAP;
  const timingY = slotY - TIMING_HEIGHT - GAP;
  const meterY = timingY - METER_HEIGHT - GAP;

  const cardX = (W - CARD_W) / 2;
  const cardY = SAFE_TOP + HUD_HEIGHT + GAP;

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

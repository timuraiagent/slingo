export const BASE_W = 1080;
export const BASE_H = 2340;

export const SAFE_TOP = 80;
export const SAFE_BOTTOM = 60;

export const HUD_HEIGHT = 120;
export const CARD_TOP = SAFE_TOP + HUD_HEIGHT + 40;

export const CARD_SIZE = 5;
export const CELL_SIZE = 180;
export const CELL_GAP = 14;

export const CONTROL_HEIGHT = 220;
export const SLOT_HEIGHT = 380;
export const TIMING_HEIGHT = 140;
export const METER_HEIGHT = 80;

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

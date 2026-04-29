import { COLOR } from '../constants.js';

export function drawPanel(gfx, x, y, w, h, radius = 16, fill = COLOR.BG_MID, border = COLOR.BORDER) {
  gfx.fillStyle(fill, 1);
  gfx.lineStyle(2, border, 1);
  gfx.fillRoundedRect(x, y, w, h, radius);
  gfx.strokeRoundedRect(x, y, w, h, radius);
}

export function drawBackground(scene) {
  const g = scene.add.graphics();
  g.fillGradientStyle(COLOR.BG_DARK, COLOR.BG_DARK, 0x12102A, 0x12102A, 1);
  g.fillRect(0, 0, scene.scale.width, scene.scale.height);
  return g;
}

export function makeTextButton(scene, x, y, w, h, label, style = {}, onClick = null) {
  const g = scene.add.graphics();
  drawPanel(g, -w / 2, -h / 2, w, h, 20, 0x1E2A3A, 0x3498DB);
  const t = scene.add.text(0, 0, label, {
    fontFamily: 'Nunito', fontSize: '32px', fontStyle: 'bold',
    color: '#F0F0FF', ...style
  }).setOrigin(0.5);
  const container = scene.add.container(x, y, [g, t]);
  container.setSize(w, h);
  container.setInteractive();
  if (onClick) {
    container.on('pointerdown', onClick);
  }
  return { container, graphics: g, text: t };
}

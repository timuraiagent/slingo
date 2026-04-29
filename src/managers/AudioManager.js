import { bus } from '../utils/eventBus.js';
import { SoundSynth } from '../utils/SoundSynth.js';

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.synth = null;
    this._handlers = [];
  }

  init() {
    const ctx = this.scene.sound.context;
    if (ctx) {
      this.synth = new SoundSynth(ctx);
    }
    this.wireEvents();
  }

  wireEvents() {
    this._on('slot:spinning',         () => this._reelSpin());
    this._on('reel:stopped',          () => this._reelStop());
    this._on('card:useful-hit',       () => this._usefulHit());
    this._on('card:near-hit',         () => this._nearHit());
    this._on('card:cell-closed',      () => this._cellClose());
    this._on('meter:jackpot:updated', () => this._jackpotSegment());
    this._on('meter:jackpot:earned',  () => this._jackpotEarned());
    this._on('timing:perfect',        () => this._perfectTiming());
    this._on('match:bingo',           () => this._bingoWin());
    this._on('pressure:start',        () => this._pressureStart());
    this._on('button:press',          () => this._buttonPress());
    this._on('countdown:tick',        () => this._countdownTick());
    this._on('countdown:go',          () => this._countdownGo());
  }

  _reelSpin() {
    if (!this.synth) return;
    this.synth.playSweep(200, 800, 0.2, 'triangle');
  }

  _reelStop() {
    if (!this.synth) return;
    this.synth.playTone(150, 0.06, 'sine', 0.002, 0.04);
  }

  _usefulHit() {
    if (!this.synth) return;
    this.synth.playTone(880, 0.3, 'sine', 0.005, 0.15);
  }

  _nearHit() {
    if (!this.synth) return;
    this.synth.playNoiseSweep(400, 600, 0.15);
  }

  _cellClose() {
    if (!this.synth) return;
    this.synth.playPitchDrop(600, 200, 0.08);
  }

  _jackpotSegment() {
    if (!this.synth) return;
    this.synth.playTone(1000, 0.03, 'square', 0.002, 0.02);
  }

  _jackpotEarned() {
    if (!this.synth) return;
    this.synth.playChord([523, 659, 784], 0.5, 'sine');
  }

  _perfectTiming() {
    if (!this.synth) return;
    this.synth.playTone(1200, 0.4, 'sine', 0.005, 0.2);
    this.synth.playTone(1800, 0.3, 'sine', 0.01, 0.15);
  }

  _bingoWin() {
    if (!this.synth) return;
    this.synth.playMelody([523, 659, 784, 1047], 0.18, 0.04);
  }

  _pressureStart() {
    if (!this.synth) return;
    this.synth.playTone(80, 0.3, 'sine', 0.01, 0.15);
    this.synth.playNoise(0.2, 0.01);
  }

  _buttonPress() {
    if (!this.synth) return;
    this.synth.playTone(600, 0.04, 'square', 0.002, 0.03);
  }

  _countdownTick() {
    if (!this.synth) return;
    this.synth.playTone(440, 0.15, 'sine', 0.005, 0.1);
  }

  _countdownGo() {
    if (!this.synth) return;
    this.synth.playTone(880, 0.3, 'sine', 0.005, 0.15);
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
    this.synth = null;
  }
}

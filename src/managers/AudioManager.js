import { bus } from '../utils/eventBus.js';

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this._handlers = [];
  }

  init() {
    const keys = [
      'reel-spin', 'reel-stop', 'useful-hit', 'near-hit',
      'jackpot-segment', 'jackpot-earned', 'perfect-timing',
      'cell-close', 'bingo-win', 'pressure-start',
    ];
    keys.forEach(k => {
      if (this.scene.cache.audio.exists(k)) {
        this.sounds[k] = this.scene.sound.add(k, { volume: 0.7 });
      }
    });
    this.wireEvents();
  }

  wireEvents() {
    this._on('slot:spinning',         () => this.play('reel-spin'));
    this._on('reel:stopped',          () => this.play('reel-stop'));
    this._on('card:useful-hit',       () => this.play('useful-hit'));
    this._on('card:near-hit',         () => this.play('near-hit'));
    this._on('meter:jackpot:updated', () => this.play('jackpot-segment'));
    this._on('meter:jackpot:earned',  () => this.play('jackpot-earned'));
    this._on('timing:perfect',        () => this.play('perfect-timing'));
    this._on('card:cell-closed',      () => this.play('cell-close'));
    this._on('match:bingo',           () => this.play('bingo-win'));
    this._on('pressure:start',        () => this.play('pressure-start'));
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }

  play(key) {
    if (this.sounds[key]) {
      this.sounds[key].play();
    }
  }

  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
    Object.values(this.sounds).forEach(s => s.destroy());
    this.sounds = {};
  }
}

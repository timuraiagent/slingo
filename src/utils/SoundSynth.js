export class SoundSynth {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.ctx.destination);
  }

  _now() {
    return this.ctx.currentTime;
  }

  _osc(freq, type, startTime, duration) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    return { osc, gain };
  }

  playTone(freq, duration, type = 'sine', attack = 0.005, decay = 0.1) {
    const t = this._now();
    const { osc, gain } = this._osc(freq, type, t, duration);
    gain.gain.linearRampToValueAtTime(0.8, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  }

  playSweep(startFreq, endFreq, duration, type = 'triangle') {
    const t = this._now();
    const { osc, gain } = this._osc(startFreq, type, t, duration);
    osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  }

  playNoise(duration, attack = 0.005) {
    const t = this._now();
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(t);
  }

  playChord(freqs, duration, type = 'sine') {
    freqs.forEach(f => this.playTone(f, duration, type, 0.01, 0.15));
  }

  playMelody(notes, noteDuration, gap = 0.05) {
    notes.forEach((freq, i) => {
      const t = this._now() + i * (noteDuration + gap);
      const { osc, gain } = this._osc(freq, 'sine', t, noteDuration);
      gain.gain.linearRampToValueAtTime(0.7, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration);
    });
  }

  playPitchDrop(startFreq, endFreq, duration) {
    const t = this._now();
    const { osc, gain } = this._osc(startFreq, 'sine', t, duration);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t + duration);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  }

  playNoiseSweep(startFreq, endFreq, duration) {
    this.playSweep(startFreq, endFreq, duration, 'triangle');
    this.playNoise(duration * 0.6, 0.005);
  }

  setMasterVolume(v) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }
}

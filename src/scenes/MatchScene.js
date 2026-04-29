import Phaser from 'phaser';
import { drawBackground, makeTextButton } from '../utils/draw.js';
import { bus } from '../utils/eventBus.js';
import { SeededRandom } from '../utils/seededRandom.js';
import { generateCard } from '../data/cardLayouts.js';
import { rollSymbolType } from '../data/symbolDefinitions.js';
import { BingoCardManager } from '../managers/BingoCardManager.js';
import { RNGManager } from '../managers/RNGManager.js';
import { MeterManager } from '../managers/MeterManager.js';
import { StreakManager } from '../managers/StreakManager.js';
import { BotManager } from '../managers/BotManager.js';
import { LeaderboardManager } from '../managers/LeaderboardManager.js';
import { PressureManager } from '../managers/PressureManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { MatchStateMachine, STATE } from '../managers/MatchStateMachine.js';
import { BingoCard } from '../components/BingoCard.js';
import { SlotMachine, SLOT_W } from '../components/SlotMachine.js';
import { TimingBar } from '../components/TimingBar.js';
import { MeterBar } from '../components/MeterBar.js';
import { ControlZone } from '../components/ControlZone.js';
import {
  COLOR, FONT, BASE_W, SAFE_TOP,
  HUD_HEIGHT, CELL_SIZE, CELL_GAP,
  SLOT_HEIGHT, TIMING_HEIGHT, METER_HEIGHT, COLUMN_RANGES,
} from '../constants.js';

export class MatchScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MatchScene' });
  }

  create() {
    if (this._handlers) this.shutdown();
    drawBackground(this);
    this.matchStartTime = this.time.now;
    this.matchActive = true;
    this.matchEnding = false;
    this.pressureActive = false;
    this.nextSpinMultiplier = 1;
    this.hasWildBall = false;
    this.jackpotUsedCount = 0;
    this.debugStats = { PERFECT: { hits: 0, total: 0 }, GREAT: { hits: 0, total: 0 }, GOOD: { hits: 0, total: 0 }, MISS: { hits: 0, total: 0 } };

    const seed = Date.now();
    const rng = new SeededRandom(seed);
    const grid = generateCard(rng);
    this.cardManager = new BingoCardManager(grid);
    this.rngManager = new RNGManager(seed + 100);
    this.meterManager = new MeterManager();
    this.streakManager = new StreakManager(this.meterManager);
    this.botManager = new BotManager(this, seed + 200);
    this.leaderboard = new LeaderboardManager(this.cardManager, this.botManager);
    this.pressureManager = new PressureManager(this.cardManager, this.botManager);
    this.audioManager = new AudioManager(this);
    this.audioManager.init();
    this.stateMachine = new MatchStateMachine();

    this._buildLayout();
    this._createHUD();
    this._createCountdown();
    this._startBotTimer();
    this._setupAutoFire();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug')) {
      this._createDebugOverlay();
    }

    this._on('bot:won', (bot) => this._onBotWon(bot), this);
    this._on('slot:complete', (data) => this._onSlotComplete(data), this);
    this._on('meter:jackpot:earned', () => this._onJackpotEarned(), this);
    this._on('leaderboard:update', () => this._updateHUD(), this);
  }

  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    if (!this._handlers) this._handlers = [];
    this._handlers.push([event, fn, ctx]);
  }

  _buildLayout() {
    const W = this.scale.width;
    const H = this.scale.height;

    const cardW = 5 * CELL_SIZE + 4 * CELL_GAP;
    const cardX = (W - cardW) / 2;
    const cardY = SAFE_TOP + HUD_HEIGHT + 50;
    const cardBottom = cardY + cardW;

    const meterY = cardBottom + 40;
    const timingY = meterY + METER_HEIGHT + 12;
    const slotY = timingY + TIMING_HEIGHT + 12;
    const controlY = slotY + SLOT_HEIGHT + 20;

    this.bingoCard = new BingoCard(this, cardX, cardY, this.cardManager);
    this.meterBar = new MeterBar(this, cardX, meterY);
    this.timingBar = new TimingBar(this, (W - 960) / 2, timingY + 20);
    this.slotMachine = new SlotMachine(this, (W - SLOT_W) / 2, slotY);
    this.controlZone = new ControlZone(this, W / 2, controlY + 40, W,
      () => this._onSpinTap(),
      () => this._onJackpotTap(),
      (fast) => this._onSpeedToggle(fast)
    );

    this.controlZone.disableAll();
  }

  _createHUD() {
    const hudBar = this.add.graphics();
    hudBar.fillStyle(COLOR.BG_DARK, 0.85);
    hudBar.fillRect(0, 0, this.scale.width, SAFE_TOP + HUD_HEIGHT);
    hudBar.lineStyle(1, 0x2A2A50, 0.6);
    hudBar.lineBetween(0, SAFE_TOP + HUD_HEIGHT, this.scale.width, SAFE_TOP + HUD_HEIGHT);

    this.hudPosBg = this.add.graphics();
    drawPanel(this.hudPosBg, 40, SAFE_TOP + 16, 280, 72, 32, COLOR.BG_MID, COLOR.BORDER);
    this.hudPosText = this.add.text(180, SAFE_TOP + 52, '1st / 8', {
      ...FONT.UI, fontSize: '32px', color: '#F0F0FF',
    }).setOrigin(0.5);

    this.hudTimeBg = this.add.graphics();
    drawPanel(this.hudTimeBg, this.scale.width - 320, SAFE_TOP + 16, 280, 72, 32, COLOR.BG_MID, COLOR.BORDER);
    this.hudTimeText = this.add.text(this.scale.width - 180, SAFE_TOP + 52, '0:00', {
      ...FONT.UI, fontSize: '32px', color: '#F0F0FF',
    }).setOrigin(0.5);

    this.hudUpdateEvent = this.time.addEvent({
      delay: 3000,
      callback: () => this._updateHUD(),
      loop: true,
    });
  }

  _updateHUD() {
    if (!this.matchActive) return;
    const pos = this.leaderboard.getPosition();
    const suffix = ['th', 'st', 'nd', 'rd'];
    const s = pos <= 3 ? suffix[pos] : suffix[0];
    this.hudPosText.setText(`${pos}${s} / 8`);

    const elapsed = Math.floor((this.time.now - this.matchStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.hudTimeText.setText(`${mins}:${String(secs).padStart(2, '0')}`);
  }

  _createCountdown() {
    this.controlZone.disableAll();

    this.countdownOverlay = this.add.graphics();
    this.countdownOverlay.fillStyle(COLOR.BG_DARK, 0.7);
    this.countdownOverlay.fillRect(0, 0, this.scale.width, this.scale.height);

    this.countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, '3', {
      ...FONT.NUMBER, fontSize: '120px', color: '#FFD700',
    }).setOrigin(0.5).setScale(1.4);

    // Card cells flip in column-by-column
    this.bingoCard.cells.forEach((cell, idx) => {
      cell.container.setScale(0);
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      this.tweens.add({
        targets: cell.container,
        scaleX: 1, scaleY: 1,
        delay: col * 60 + row * 40,
        duration: 300,
        ease: Phaser.Math.Easing.Back.Out,
      });
    });

    let step = 2; // 3 is already shown
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (step > 0) {
          this.countdownText.setText(String(step));
          this.countdownText.setAlpha(1);
          this.countdownText.setScale(1.4);
          this.tweens.add({ targets: this.countdownText, scaleX: 1, scaleY: 1, duration: 300 });
          step--;
        } else if (step === 0) {
          this.countdownText.setText('GO!');
          this.countdownText.setAlpha(1);
          this.countdownText.setScale(1.4);
          this.tweens.add({ targets: this.countdownText, scaleX: 1, scaleY: 1, duration: 300 });
          step--;
        } else {
          this.tweens.add({
            targets: [this.countdownOverlay, this.countdownText],
            alpha: 0,
            duration: 200,
            onComplete: () => {
              this.countdownOverlay.destroy();
              this.countdownText.destroy();
              this.stateMachine.setState(STATE.IDLE);
              this.controlZone.enableAll();
              this.timingBar.activate(this.controlZone.fastMode);
              this._addAutoFire();
            },
          });
          this.countdownEvent.remove();
        }
      },
      repeat: 3,
    });
  }

  _startBotTimer() {
    this.botManager.start();
  }

  _setupAutoFire() {
    this._addAutoFire();
  }

  _addAutoFire() {
    if (this.autoFireEvent) this.autoFireEvent.remove();
    this.autoFireEvent = this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (this.stateMachine.state === STATE.IDLE && this.matchActive) {
          this._onSpinTap();
        }
      },
      loop: true,
    });
  }

  _onSpinTap() {
    if (this.stateMachine.state !== STATE.IDLE) return;
    this.stateMachine.setState(STATE.SPINNING);
    this.controlZone.disableAll();

    const timing = this.timingBar.lock();
    if (!timing) {
      this.stateMachine.setState(STATE.IDLE);
      this.controlZone.enableAll();
      this._addAutoFire();
      return;
    }

    const primaryNumber = this.rngManager.getSpinNumber(this.cardManager, timing.zone);
    const results = this._buildResults(primaryNumber);
    this.currentTiming = timing;
    this.currentPrimary = primaryNumber;

    this.slotMachine.spin(results, this.controlZone.fastMode);
  }

  _buildResults(primaryNumber) {
    let resultReel = 0;
    for (let i = 0; i < 5; i++) {
      const [min, max] = COLUMN_RANGES[i];
      if (primaryNumber >= min && primaryNumber <= max) {
        resultReel = i;
        break;
      }
    }

    const out = [];
    for (let i = 0; i < 5; i++) {
      if (i === resultReel) {
        out.push({ id: 'number', label: primaryNumber });
      } else {
        const symId = rollSymbolType(this.rngManager.rng);
        let label = null;
        if (symId === 'number') {
          const [min, max] = COLUMN_RANGES[i];
          label = this.rngManager.rng.intBetween(min, max);
        }
        out.push({ id: symId, label });
      }
    }
    return out;
  }

  _onSlotComplete({ results }) {
    if (this.stateMachine.state !== STATE.SPINNING) return;
    this.stateMachine.setState(STATE.RESOLVING);

    const number = this.currentPrimary;
    const timing = this.currentTiming;
    const closedPos = this.cardManager.closeNumber(number);

    // Side effects from non-result reels
    let resultReel = 0;
    for (let i = 0; i < 5; i++) {
      const [min, max] = COLUMN_RANGES[i];
      if (number >= min && number <= max) { resultReel = i; break; }
    }

    let hadJackpotSymbol = false;
    let hadMultiplier = false;
    results.forEach((res, idx) => {
      if (idx === resultReel) return;
      if (res.id === 'jackpot') { this.meterManager.onJackpotSymbol(); hadJackpotSymbol = true; }
      if (res.id === 'wild') { this.hasWildBall = true; this.controlZone.setWildAvailable(true); }
      if (res.id === 'multiplier') { hadMultiplier = true; }
    });

    if (hadMultiplier) this.nextSpinMultiplier = 2;

    if (closedPos) {
      const isJackpot = false;
      this.bingoCard.closeCell(closedPos.col, closedPos.row, isJackpot);
      bus.emit('card:useful-hit', { col: closedPos.col, row: closedPos.row, number });
      this.rngManager.recordUsefulHit();
      let charge = { PERFECT: 25, GREAT: 18, GOOD: 12, MISS: 8 }[timing.zone];
      if (this.nextSpinMultiplier > 1) { charge *= this.nextSpinMultiplier; this.nextSpinMultiplier = 1; }
      if (this.streakManager.current >= 5) charge += 20;
      this.meterManager.addJackpot(charge);
      this._recordDebug(timing.zone, true);
    } else {
      const needed = this.cardManager.getOpenNumbers();
      const near = needed.some((n) => Math.abs(n - number) <= 5);
      if (near && timing.zone !== 'MISS') {
        bus.emit('card:near-hit', { number });
        this.meterManager.onNearHit(timing.zone);
        this.rngManager.recordMiss();
      } else {
        bus.emit('card:full-miss', { number });
        this.meterManager.onMiss();
        this.rngManager.recordMiss();
      }
      this._recordDebug(timing.zone, false);
    }

    this.pressureManager.checkPressure();
    if (this.pressureManager.active && !this.pressureActive) {
      this.pressureActive = true;
      this._startPressureVisuals();
    } else if (!this.pressureManager.active && this.pressureActive) {
      this.pressureActive = false;
      this._stopPressureVisuals();
    }

    if (this.cardManager.isWon()) {
      this._endMatch('player');
      return;
    }

    if (this.stateMachine.queuedBotWin) {
      this._endMatch(this.stateMachine.queuedBotWin);
      return;
    }

    this.stateMachine.setState(STATE.IDLE);
    this.controlZone.enableAll();
    this.timingBar.reset();
    this.timingBar.activate(this.controlZone.fastMode);
    this._addAutoFire();
  }

  _recordDebug(zone, hit) {
    this.debugStats[zone].total++;
    if (hit) this.debugStats[zone].hits++;
  }

  _onJackpotTap() {
    if (this.stateMachine.state !== STATE.IDLE) return;
    if (this.meterManager.jackpotBalls <= 0) return;
    this.stateMachine.setState(STATE.JACKPOT_SELECTING);
    this.controlZone.disableAll();

    this.jackpotOverlay = this.add.graphics();
    this.jackpotOverlay.fillStyle(COLOR.BG_DARK, 0.5);
    this.jackpotOverlay.fillRect(0, 0, this.scale.width, this.scale.height);

    this.jackpotCancel = makeTextButton(this, this.scale.width / 2, this.scale.height - 100, 240, 80, 'CANCEL', { fontSize: '28px' }, () => {
      this._cancelJackpot();
    });

    this.cardManager.getOpenNumbers().forEach((num) => {
      const pos = this.cardManager._find(num);
      if (pos) this.bingoCard.setOverlay(pos.col, pos.row, 'jackpot');
    });

    // Bind cell tap for jackpot selection
    this._jackpotCellHandler = (col, row) => {
      if (this.stateMachine.state !== STATE.JACKPOT_SELECTING) return;
      this._placeJackpot(col, row);
    };
    this.bingoCard.cells.forEach((cell) => {
      cell.container.setInteractive();
      cell.container.on('pointerdown', () => this._jackpotCellHandler(cell.col, cell.row));
    });
  }

  _placeJackpot(col, row) {
    if (!this.meterManager.useJackpotBall()) return;
    this.jackpotUsedCount++;

    this.bingoCard.clearOverlays();
    this.bingoCard.closeCell(col, row, true);

    if (this.jackpotOverlay) { this.jackpotOverlay.destroy(); this.jackpotOverlay = null; }
    if (this.jackpotCancel) { this.jackpotCancel.container.destroy(); this.jackpotCancel = null; }

    this.bingoCard.cells.forEach((cell) => {
      cell.container.off('pointerdown');
      if (!this.cardManager.closed.has(`${cell.col},${cell.row}`)) {
        cell.container.disableInteractive();
      }
    });

    this.controlZone.setJackpotAvailable(this.meterManager.jackpotBalls > 0);

    if (this.cardManager.isWon()) {
      this._endMatch('player');
      return;
    }
    this.stateMachine.setState(STATE.IDLE);
    this.controlZone.enableAll();
    this._addAutoFire();
  }

  _cancelJackpot() {
    if (this.stateMachine.state !== STATE.JACKPOT_SELECTING) return;
    this.bingoCard.clearOverlays();
    if (this.jackpotOverlay) { this.jackpotOverlay.destroy(); this.jackpotOverlay = null; }
    if (this.jackpotCancel) { this.jackpotCancel.container.destroy(); this.jackpotCancel = null; }
    this.bingoCard.cells.forEach((cell) => {
      cell.container.off('pointerdown');
      if (!this.cardManager.closed.has(`${cell.col},${cell.row}`)) {
        cell.container.disableInteractive();
      }
    });
    this.stateMachine.setState(STATE.IDLE);
    this.controlZone.enableAll();
    this._addAutoFire();
  }

  _onSpeedToggle(fast) {
    // Timing bar will pick up fast mode on next activate
  }

  _onJackpotEarned() {
    this.controlZone.setJackpotAvailable(true);
  }

  _onBotWon(bot) {
    if (this.stateMachine.state === STATE.SPINNING || this.stateMachine.state === STATE.JACKPOT_SELECTING || this.stateMachine.state === STATE.RESOLVING) {
      this.stateMachine.queueBotWin(bot);
      return;
    }
    if (this.stateMachine.state === STATE.MATCH_END || this.stateMachine.state === STATE.RESULTS_PENDING) return;
    this._endMatch(bot);
  }

  _startPressureVisuals() {
    if (this.pressureEdge) return;
    this.pressureEdge = this.add.graphics();
    this.pressureEdge.lineStyle(60, COLOR.RED_PRESS, 1);
    this.pressureEdge.strokeRect(0, 0, this.scale.width, this.scale.height);
    this.pressureEdge.setAlpha(0);
    this.pressureTween = this.tweens.add({
      targets: this.pressureEdge,
      alpha: 0.5,
      yoyo: true,
      repeat: -1,
      duration: 750,
    });
    this.timingBar.setSpeedFactor(1.2);
  }

  _stopPressureVisuals() {
    if (this.pressureTween) { this.pressureTween.stop(); this.pressureTween = null; }
    if (this.pressureEdge) { this.pressureEdge.destroy(); this.pressureEdge = null; }
    this.timingBar.setSpeedFactor(1.0);
  }

  _endMatch(winner) {
    if (this.matchEnding) return;
    if (this.stateMachine.state === STATE.MATCH_END || this.stateMachine.state === STATE.RESULTS_PENDING) return;
    this.matchEnding = true;
    this.stateMachine.setState(STATE.MATCH_END);
    this.matchActive = false;
    this.timingBar.reset();
    this.controlZone.disableAll();
    if (this.autoFireEvent) this.autoFireEvent.remove();
    this.botManager.destroy();

    if (winner === 'player') {
      bus.emit('match:bingo');
      this._showBingoAnimation(() => this._goToResults());
    } else {
      this._showBotWinNotice(winner.name, () => this._goToResults());
    }
  }

  _showBingoAnimation(onComplete) {
    const lines = this.cardManager.getCompletedLines();
    lines.forEach((l) => {
      l.line.cells.forEach(([c, r]) => this.bingoCard.setOverlay(c, r, 'nearwin'));
    });

    const vignette = this.add.graphics();
    vignette.fillStyle(COLOR.BG_DARK, 0.6);
    vignette.fillRect(0, 0, this.scale.width, this.scale.height);
    vignette.setAlpha(0);
    this.tweens.add({ targets: vignette, alpha: 1, duration: 300 });

    const bingoImg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'overlay-bingo')
      .setOrigin(0.5)
      .setScale(0.3);
    this.tweens.add({
      targets: bingoImg,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: Phaser.Math.Easing.Back.Out,
    });

    const emitter = this.add.particles(this.scale.width / 2, 0, 'confetti', {
      frame: { frames: [0, 1, 2, 3, 4, 5], cycle: true },
      speed: { min: 200, max: 500 },
      angle: { min: 60, max: 120 },
      scale: { start: 2.5, end: 0 },
      lifespan: 2000,
      gravityY: 300,
      quantity: 2,
      frequency: 50,
    });
    emitter.start();
    this.time.delayedCall(1500, () => {
      emitter.stop();
      this.time.delayedCall(1000, () => emitter.destroy());
    });

    this.time.delayedCall(1800, () => {
      vignette.destroy();
      bingoImg.destroy();
      onComplete();
    });
  }

  _showBotWinNotice(name, onComplete) {
    const banner = this.add.graphics();
    const bw = 800, bh = 100;
    const bx = (this.scale.width - bw) / 2;
    const by = SAFE_TOP + 40;
    banner.fillStyle(0x1A0A0A, 0.9);
    banner.lineStyle(2, COLOR.RED_PRESS, 1);
    banner.fillRoundedRect(bx, by, bw, bh, 12);
    banner.strokeRoundedRect(bx, by, bw, bh, 12);
    banner.setAlpha(0);

    const txt = this.add.text(bx + bw / 2, by + bh / 2, `${name} got BINGO!`, {
      ...FONT.UI, fontSize: '30px', color: '#FF6B6B',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [banner, txt], alpha: 1, duration: 200 });
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: [banner, txt],
        alpha: 0,
        duration: 300,
        onComplete: () => { banner.destroy(); txt.destroy(); onComplete(); },
      });
    });
  }

  _goToResults() {
    this.stateMachine.setState(STATE.RESULTS_PENDING);
    const data = {
      position: this.leaderboard.getPosition(),
      totalPlayers: 8,
      cellsClosed: this.cardManager.getClosedCount(),
      bestStreak: this.streakManager.best,
      jackpotsUsed: this.jackpotUsedCount,
      coinsEarned: 0, // filled in ResultsScene
    };
    this.scene.start('ResultsScene', data);
  }

  _createDebugOverlay() {
    this.debugText = this.add.text(20, this.scale.height - 120, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#00FF00',
      backgroundColor: '#000000',
    }).setScrollFactor(0);

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        let s = 'Debug Stats (useful-hit rate):\n';
        for (const zone of ['PERFECT', 'GREAT', 'GOOD', 'MISS']) {
          const st = this.debugStats[zone];
          const pct = st.total > 0 ? Math.round((st.hits / st.total) * 100) : 0;
          s += `${zone}: ${st.hits}/${st.total} = ${pct}%\n`;
        }
        this.debugText.setText(s);
      },
      loop: true,
    });
  }

  shutdown() {
    if (this._handlers) {
      this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
      this._handlers = [];
    }
    if (this.hudUpdateEvent) this.hudUpdateEvent.remove();
    if (this.autoFireEvent) this.autoFireEvent.remove();
    if (this.countdownEvent) this.countdownEvent.remove();
    this.botManager.destroy();
    this.audioManager.destroy();
    this.bingoCard.destroy();
    this.slotMachine.destroy();
    this.timingBar.destroy();
    this.meterBar.destroy();
    this.controlZone.destroy();
    this.meterManager.destroy();
    this.streakManager.destroy();
    if (this.pressureTween) this.pressureTween.stop();
    if (this.pressureEdge) this.pressureEdge.destroy();
  }
}

function drawPanel(gfx, x, y, w, h, radius = 16, fill = 0x161628, border = 0x3A3A60) {
  gfx.fillStyle(fill, 1);
  gfx.lineStyle(2, border, 1);
  gfx.fillRoundedRect(x, y, w, h, radius);
  gfx.strokeRoundedRect(x, y, w, h, radius);
}

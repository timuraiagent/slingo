import Phaser from 'phaser';
import { drawBackground, makeTextButton } from '../utils/draw.js';
import {
  COLOR, FONT, BASE_W, BASE_H,
  SAFE_TOP, SAFE_BOTTOM, HUD_HEIGHT,
  CELL_SIZE, CELL_GAP, CARD_SIZE,
  CONTROL_HEIGHT, SLOT_HEIGHT, TIMING_HEIGHT, METER_HEIGHT,
  DEBUG_FLAGS, POSITION_REWARDS, DEBUG_MODE,
} from '../constants.js';
import { bus } from '../utils/eventBus.js';
import { SeededRandom } from '../utils/seededRandom.js';
import { generateCard, getColumnForNumber } from '../data/cardLayouts.js';
import { BingoCardManager } from '../managers/BingoCardManager.js';
import { BingoCard } from '../components/BingoCard.js';
import { SlotMachine } from '../components/SlotMachine.js';
import { TimingBar } from '../components/TimingBar.js';
import { ControlZone } from '../components/ControlZone.js';
import { MeterBar } from '../components/MeterBar.js';
import { RNGManager } from '../managers/RNGManager.js';
import { MeterManager } from '../managers/MeterManager.js';
import { StreakManager } from '../managers/StreakManager.js';
import { BotManager } from '../managers/BotManager.js';
import { LeaderboardManager } from '../managers/LeaderboardManager.js';
import { PressureManager } from '../managers/PressureManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { MatchStateMachine, STATES } from '../managers/MatchStateMachine.js';
import { SYMBOLS } from '../data/symbolDefinitions.js';

const CARD_W = CARD_SIZE * CELL_SIZE + (CARD_SIZE - 1) * CELL_GAP;

export class MatchScene extends Phaser.Scene {
  constructor() { super('MatchScene'); }

  create() {
    drawBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // Landscape orientation blocker
    this._buildOrientationBlocker();

    // State machine
    this.stateMachine = new MatchStateMachine();

    // RNG
    this.rngManager = new RNGManager(Date.now());

    // Card
    const grid = generateCard(this.rngManager.getRng());
    this.cardManager = new BingoCardManager(grid);

    // Layout
    const controlY = H - SAFE_BOTTOM - CONTROL_HEIGHT;
    const slotY = controlY - SLOT_HEIGHT - 24;
    const timingY = slotY - TIMING_HEIGHT - 24;
    const meterY = timingY - METER_HEIGHT - 16;
    const cardX = (W - CARD_W) / 2;
    const cardY = SAFE_TOP + HUD_HEIGHT + 60;

    // Managers
    this.meterManager = new MeterManager();
    this.streakManager = new StreakManager(this.meterManager);
    this.botManager = new BotManager(this, Date.now() + 999);
    this.leaderboardManager = new LeaderboardManager(this.cardManager, this.botManager);
    this.pressureManager = new PressureManager(this.cardManager, this.botManager);
    this.audioManager = new AudioManager(this);
    this.audioManager.init();

    // Components
    this.bingoCard = new BingoCard(this, cardX, cardY, this.cardManager);
    this.meterBar = new MeterBar(this, cardX, meterY);
    this.timingBar = new TimingBar(this, cx, timingY);
    this.slotMachine = new SlotMachine(this, cx, slotY, this.rngManager.getRng());
    this.controlZone = new ControlZone(this, 0, controlY, W);

    // HUD
    this._buildHUD(W);

    // Countdown
    this._startCountdown();

    // Spin timer (auto-fire)
    this.spinTimer = null;

    // Track stats
    this.jackpotUsedCount = 0;
    this.matchTimer = 0;
    this.matchActive = false;
    this.spinCount = 0;

    // Jackpot selection state
    this.jackpotSelecting = false;
    this.cancelBtn = null;
    this.jackpotOverlay = null;

    // Wild ball state
    this.hasWildBall = false;
    this.wildSelecting = false;
    this.wildOverlay = null;

    // Pressure visuals
    this.pressureActive = false;
    this.pressureEdge = null;

    // Telemetry
    this.spinLog = [];

    // Debug overlay
    this._buildDebugOverlay();
  }

  _buildHUD(W) {
    const hudBar = this.add.graphics();
    hudBar.fillStyle(COLOR.BG_DARK, 0.85);
    hudBar.fillRect(0, 0, W, SAFE_TOP + HUD_HEIGHT);
    hudBar.lineStyle(1, 0x2A2A50, 0.6);
    hudBar.lineBetween(0, SAFE_TOP + HUD_HEIGHT, W, SAFE_TOP + HUD_HEIGHT);

    this.posText = this.add.text(40, SAFE_TOP + 30, '1st / 8', {
      ...FONT.UI, fontSize: '26px', color: '#F0F0FF',
    });

    this.timerText = this.add.text(W - 40, SAFE_TOP + 30, '0:00', {
      ...FONT.UI, fontSize: '26px', color: '#F0F0FF',
    }).setOrigin(1, 0);

    // Update position + timer every 3 seconds
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (!this.matchActive) return;
        const pos = this.leaderboardManager.getPosition();
        const ord = this._ordinal(pos);
        this.posText.setText(`${ord} / 8`);
      },
      loop: true,
    });

    // Update timer every second
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.matchActive) return;
        this.matchTimer++;
        const min = Math.floor(this.matchTimer / 60);
        const sec = this.matchTimer % 60;
        this.timerText.setText(`${min}:${String(sec).padStart(2, '0')}`);
      },
      loop: true,
    });
  }

  _ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  _buildDebugOverlay() {
    if (!DEBUG_MODE) return;
    this.debugText = this.add.text(10, SAFE_TOP + 70, '', {
      ...FONT.LABEL, fontSize: '18px', color: '#00FF00',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(60);

    this.time.addEvent({
      delay: 2000,
      callback: () => this._updateDebugOverlay(),
      loop: true,
    });
  }

  _updateDebugOverlay() {
    if (!this.debugText || !this.spinLog.length) return;
    const zones = ['PERFECT', 'GREAT', 'GOOD', 'MISS'];
    const stats = {};
    zones.forEach(z => {
      const zoneSpins = this.spinLog.filter(s => s.zone === z);
      const hits = zoneSpins.filter(s => s.hit).length;
      const total = zoneSpins.length;
      stats[z] = total > 0 ? `${hits}/${total} (${Math.round(hits / total * 100)}%)` : '—';
    });
    this.debugText.setText(
      `PERFECT: ${stats.PERFECT}  GREAT: ${stats.GREAT}\n` +
      `GOOD: ${stats.GOOD}  MISS: ${stats.MISS}\n` +
      `Pity: ${this.rngManager.pityCounter}  Bus listeners: ${bus.eventNames().length}`
    );
  }

  _startCountdown() {
    this.stateMachine.setState(STATES.COUNTDOWN);

    // Wire controls immediately
    this.controlZone.onSpin = () => this._onSpin();
    this.controlZone.onJackpot = () => this._onJackpotButton();
    this.controlZone.onSpeedToggle = (fast) => this._onSpeedToggle(fast);
    this.controlZone.onWildBall = () => this._onWildBallButton();
    this.controlZone.setSpinEnabled(false);

    // Bus listeners
    this._busHandlers = [];
    this._busOn('slot:complete', (data) => this._onSlotComplete(data));
    this._busOn('bot:won', (data) => this._onBotWon(data));
    this._busOn('meter:jackpot:earned', () => this._onJackpotEarned());
    this._busOn('streak:milestone', (level) => this._onStreakMilestone(level));
    this._busOn('pressure:start', (data) => this._onPressureStart(data));
    this._busOn('pressure:end', () => this._onPressureEnd());

    // Countdown overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(COLOR.BG_DARK, 0.7);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setDepth(50);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const countdownText = this.add.text(cx, cy, '3', {
      ...FONT.UI, fontSize: '120px', color: '#FFD700',
      stroke: '#8B6914', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(51);

    const steps = ['3', '2', '1', 'GO!'];
    let step = 0;

    const tick = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        step++;
        if (step < steps.length) {
          countdownText.setText(steps[step]);
          countdownText.setScale(1.4);
          this.tweens.add({
            targets: countdownText,
            scaleX: 1, scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
          });
        }
        if (step >= steps.length - 1) {
          // "GO!" — wait 400ms then fade overlay
          this.time.delayedCall(400, () => {
            this.tweens.add({
              targets: [overlay, countdownText],
              alpha: 0,
              duration: 200,
              onComplete: () => {
                overlay.destroy();
                countdownText.destroy();
                this._onCountdownComplete();
              },
            });
          });
        }
      },
    });

    // Initial scale animation
    countdownText.setScale(1.4);
    this.tweens.add({
      targets: countdownText,
      scaleX: 1, scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  _onCountdownComplete() {
    this.stateMachine.setState(STATES.IDLE);
    this.matchActive = true;
    this._enableSpin();
    this.botManager.start();
    this.timingBar.activate(this.controlZone.fastMode);
  }

  _busOn(event, fn) {
    bus.on(event, fn, this);
    this._busHandlers.push([event, fn]);
  }

  _enableSpin() {
    this.controlZone.setSpinEnabled(true);
    this._resetAutoFire();
  }

  _resetAutoFire() {
    if (this.spinTimer) this.spinTimer.remove();
    this.spinTimer = this.time.delayedCall(3000, () => {
      if (this.stateMachine.isIdle() && this.matchActive) {
        this._onSpin();
      }
    });
  }

  _onSpin() {
    if (!this.stateMachine.isIdle()) return;
    this.stateMachine.setState(STATES.SPINNING);

    // Lock timing bar
    const timingResult = this.timingBar.lock();
    if (!timingResult) {
      this.stateMachine.setState(STATES.IDLE);
      return;
    }

    this.controlZone.setSpinEnabled(false);
    if (this.spinTimer) this.spinTimer.remove();

    const { zone } = timingResult;

    // Roll number — check for wild ball guarantee
    let number;
    if (this.wildGuaranteedColumn !== undefined && this.wildGuaranteedColumn !== null) {
      const ranges = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
      const [lo, hi] = ranges[this.wildGuaranteedColumn];
      const openInCol = this.cardManager.getOpenNumbers().filter(n => n >= lo && n <= hi);
      if (openInCol.length > 0) {
        number = this.rngManager.getRng().pickFrom(openInCol);
      } else {
        number = this.rngManager.getSpinNumber(this.cardManager, zone);
      }
      this.wildGuaranteedColumn = null; // consumed
    } else {
      number = this.rngManager.getSpinNumber(this.cardManager, zone);
    }

    // Build reel results
    const results = this._buildResults(number);

    // Spin slot machine
    this.slotMachine.spin(results);

    // Store for resolution
    this._pendingResult = { number, zone, results };
  }

  _buildResults(primaryNumber) {
    const resultReelIndex = getColumnForNumber(primaryNumber);
    const results = [];

    for (let i = 0; i < 5; i++) {
      if (i === resultReelIndex) {
        results.push({ id: 'number', label: primaryNumber });
      } else {
        const symbolType = this.rngManager.getRng().weightedPick(SYMBOLS);
        if (symbolType.id === 'number') {
          const ranges = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
          const [lo, hi] = ranges[i];
          results.push({ id: 'number', label: this.rngManager.getRng().intBetween(lo, hi) });
        } else {
          results.push({ id: symbolType.id, label: symbolType.id });
        }
      }
    }

    return results;
  }

  _onSlotComplete(data) {
    if (!this.stateMachine.isSpinning()) return;
    this.stateMachine.setState(STATES.RESOLVING);
    this.spinCount++;

    const { number, zone, results } = this._pendingResult;
    const closeResult = this.cardManager.closeNumber(number);

    // Process side effects from non-result reels
    // Multiplier applies to NEXT spin; jackpot symbols and wilds are processed immediately
    const resultReelIndex = getColumnForNumber(number);
    for (let i = 0; i < results.length; i++) {
      if (i === resultReelIndex) continue;
      const sym = results[i];
      if (sym.id === 'jackpot') {
        this.meterManager.onJackpotSymbol();
      } else if (sym.id === 'wild') {
        if (!this.hasWildBall) {
          this.hasWildBall = true;
          this.controlZone.setWildBadge(true);
        }
      } else if (sym.id === 'multiplier') {
        this.meterManager.setNextMultiplier(2);
      }
    }

    if (closeResult) {
      // Useful hit!
      this.bingoCard.closeCell(closeResult.col, closeResult.row, false);
      this.meterManager.onUsefulHit(zone);
      this.streakManager.onUsefulHit();
      this.rngManager.recordUsefulHit();
      bus.emit('card:useful-hit', closeResult);

      this.spinLog.push({ zone, hit: true });

      // Check win
      if (this.cardManager.isWon()) {
        const completedLines = this.cardManager.getCompletedLines();
        completedLines.forEach(line => {
          this.bingoCard.flashLineComplete(line);
        });
        this._endMatch('player');
        return;
      }
    } else {
      // Check for near-hit (any zone — near-hits never break streak per §7.1)
      const nearHit = this.cardManager.isNearNumber(number, 5);
      if (nearHit) {
        // Near-hit: partial meter charge, does NOT break streak
        this.meterManager.onNearHit(zone);
        this.bingoCard.setOverlay(nearHit.col, nearHit.row, 'hot');
        this.time.delayedCall(1500, () => {
          this.bingoCard.setOverlay(nearHit.col, nearHit.row, null);
        });
        bus.emit('card:near-hit', { number });
        this.spinLog.push({ zone, hit: false, nearHit: true });
      } else {
        // Full miss: breaks streak, increments pity
        this.streakManager.onFullMiss();
        this.rngManager.recordMiss();
        this.meterManager.onFullMiss(this.rngManager.pityCounter);
        bus.emit('card:full-miss', { number });
        this.spinLog.push({ zone, hit: false, nearHit: false });
      }
    }

    // Pressure check
    this.pressureManager.checkPressure();

    // Near-win highlighting
    const nearWinLines = this.cardManager.getNearWinLines();
    this.bingoCard.clearAllOverlays();
    nearWinLines.forEach(line => {
      line.forEach(({ col, row }) => {
        if (this.cardManager.isOpen(col, row)) {
          this.bingoCard.setOverlay(col, row, 'nearwin');
        }
      });
    });

    // Reset for next spin
    this.timingBar.reset();
    this.timingBar.activate(this.controlZone.fastMode);
    this.stateMachine.setState(STATES.IDLE);
    this._enableSpin();

    // 50-spin limit or 5-minute limit — force match end
    if (this.spinCount >= 50 || this.matchTimer >= 300) {
      this._endMatch('bot', null);
      return;
    }

    // Check deferred bot win
    if (this._pendingBotWin) {
      const botWin = this._pendingBotWin;
      this._pendingBotWin = null;
      this._endMatch('bot', botWin.bot);
    }
  }

  _onJackpotEarned() {
    this.controlZone.setJackpotHasBall(true);
  }

  _onJackpotButton() {
    if (!this.stateMachine.isIdle()) return;
    if (this.meterManager.jackpotBalls <= 0) return;

    this.stateMachine.setState(STATES.JACKPOT_SELECTING);
    this.jackpotSelecting = true;
    this.controlZone.setSpinEnabled(false);

    // Highlight all open cells
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.cardManager.isOpen(c, r)) {
          this.bingoCard.setOverlay(c, r, 'jackpot');
        }
      }
    }

    // Overlay
    this.jackpotOverlay = this.add.graphics();
    this.jackpotOverlay.fillStyle(COLOR.BG_DARK, 0.5);
    this.jackpotOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
    this.jackpotOverlay.setDepth(20);

    // Cancel button
    this.cancelBtn = makeTextButton(this, this.scale.width / 2,
      this.scale.height - 200, 300, 80, 'CANCEL');
    this.cancelBtn.setDepth(30);
    this.cancelBtn.on('pointerdown', () => {
      this._cancelJackpotSelection();
    });

    // Listen for cell taps
    this._jackpotTapHandler = (pointer) => {
      this.bingoCard.cells.forEach(cell => {
        if (cell.number === 0) return;
        if (!this.cardManager.isOpen(cell.col, cell.row)) return;

        const bounds = cell.container.getBounds();
        if (bounds.contains(pointer.x, pointer.y)) {
          this._useJackpotBall(cell.col, cell.row);
        }
      });
    };
    this.input.on('pointerdown', this._jackpotTapHandler);
  }

  _useJackpotBall(col, row) {
    if (!this.jackpotSelecting) return;

    // Close cell
    this.cardManager.closeCell(col, row);
    this.bingoCard.closeCell(col, row, true);
    this.meterManager.useJackpotBall();
    this.jackpotUsedCount++;
    this.controlZone.setJackpotHasBall(this.meterManager.jackpotBalls > 0);

    // Cleanup selection mode
    this._cleanupJackpotSelection();

    // Check win
    if (this.cardManager.isWon()) {
      const completedLines = this.cardManager.getCompletedLines();
      completedLines.forEach(line => this.bingoCard.flashLineComplete(line));
      this._endMatch('player');
      return;
    }

    this.stateMachine.setState(STATES.IDLE);
    this._enableSpin();
  }

  _cancelJackpotSelection() {
    this._cleanupJackpotSelection();
    this.stateMachine.setState(STATES.IDLE);
    this._enableSpin();
  }

  _cleanupJackpotSelection() {
    this.jackpotSelecting = false;
    this.bingoCard.clearAllOverlays();

    if (this.jackpotOverlay) {
      this.jackpotOverlay.destroy();
      this.jackpotOverlay = null;
    }
    if (this.cancelBtn) {
      this.cancelBtn.destroy();
      this.cancelBtn = null;
    }
    if (this._jackpotTapHandler) {
      this.input.off('pointerdown', this._jackpotTapHandler);
      this._jackpotTapHandler = null;
    }

    // Re-apply near-win highlights
    const nearWinLines = this.cardManager.getNearWinLines();
    nearWinLines.forEach(line => {
      line.forEach(({ col, row }) => {
        if (this.cardManager.isOpen(col, row)) {
          this.bingoCard.setOverlay(col, row, 'nearwin');
        }
      });
    });
  }

  _onStreakMilestone(level) {
    const txt = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100,
      `STREAK ×${level}!`, {
        ...FONT.UI, fontSize: '48px', color: '#FFD700',
        stroke: '#8B6914', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      alpha: 0,
      duration: 1000,
      delay: 400,
      onComplete: () => txt.destroy(),
    });
  }

  _onPressureStart(data) {
    if (this.pressureActive) return;
    this.pressureActive = true;

    // Screen edge pulse
    this.pressureEdge = this.add.graphics();
    this.pressureEdge.lineStyle(40, COLOR.RED_PRESS, 1);
    this.pressureEdge.strokeRect(0, 0, this.scale.width, this.scale.height);
    this.pressureEdge.setAlpha(0);
    this.tweens.add({
      targets: this.pressureEdge,
      alpha: { from: 0, to: 0.4 },
      duration: 750,
      yoyo: true,
      repeat: -1,
    });

    // Speed up timing bar
    this.timingBar.setSpeed(true); // temporary speed boost

    // Banner
    const source = data.source === 'player' ? 'You are' : 'A player is';
    const banner = this.add.text(this.scale.width / 2, 250,
      `⚡ ${source} one cell away!`, {
        ...FONT.UI, fontSize: '28px', color: '#FF6B6B',
        stroke: '#0D0D1A', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 2000,
      onComplete: () => banner.destroy(),
    });
  }

  _onPressureEnd() {
    this.pressureActive = false;
    if (this.pressureEdge) {
      this.tweens.killTweensOf(this.pressureEdge);
      this.pressureEdge.destroy();
      this.pressureEdge = null;
    }
    this.timingBar.setSpeed(this.controlZone.fastMode);
  }

  _onBotWon(data) {
    if (this.stateMachine.isMatchEnd()) return;
    // Defer if player is mid-spin
    if (this.stateMachine.isSpinning()) {
      this._pendingBotWin = data;
      return;
    }
    this._endMatch('bot', data.bot);
  }

  _endMatch(winner, bot) {
    this.stateMachine.setState(STATES.MATCH_END);
    this.matchActive = false;
    this.timingBar.deactivate();
    this.controlZone.disableAll();
    this.botManager.destroy();

    if (this.spinTimer) this.spinTimer.remove();

    if (winner === 'player') {
      this._showBingoAnimation(() => {
        this.stateMachine.setState(STATES.RESULTS_PENDING);
        this.scene.start('ResultsScene', this._buildResults());
      });
    } else {
      this._showBotWinNotice(bot ? bot.name : 'Bot', () => {
        this.stateMachine.setState(STATES.RESULTS_PENDING);
        this.scene.start('ResultsScene', this._buildResults());
      });
    }
  }

  _showBingoAnimation(callback) {
    bus.emit('match:bingo');

    // Vignette
    const vignette = this.add.graphics();
    vignette.fillStyle(COLOR.BG_DARK, 0.6);
    vignette.fillRect(0, 0, this.scale.width, this.scale.height);
    vignette.setAlpha(0).setDepth(40);

    this.tweens.add({
      targets: vignette,
      alpha: 0.6,
      duration: 300,
    });

    // BINGO overlay
    const bingoImg = this.add.image(this.scale.width / 2, this.scale.height / 2 - 200,
      'overlay-bingo').setDepth(41).setScale(0.3).setAlpha(0);

    this.tweens.add({
      targets: bingoImg,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Confetti
    if (this.textures.exists('confetti')) {
      const confettiColors = [0xFFD700, 0x2ECC71, 0xFF8C00, 0xE74C3C, 0x3498DB, 0x9B59B6];
      const emitter = this.add.particles(this.scale.width / 2, 0, 'confetti', {
        speed: { min: 100, max: 400 },
        angle: { min: 60, max: 120 },
        gravity: 300,
        scale: { start: 2.5, end: 0 },
        lifespan: 3000,
        quantity: 150,
        tint: confettiColors,
        emitting: false,
      }).setDepth(42);
      emitter.explode(150);
      this.time.delayedCall(3000, () => emitter.destroy());
    }

    this.time.delayedCall(1500, callback);
  }

  _showBotWinNotice(botName, callback) {
    const bannerGfx = this.add.graphics();
    const bx = this.scale.width / 2 - 400;
    const by = 200;
    bannerGfx.fillStyle(0x1A0A0A, 0.9);
    bannerGfx.lineStyle(2, COLOR.RED_PRESS, 1);
    bannerGfx.fillRoundedRect(bx, by, 800, 100, 12);
    bannerGfx.strokeRoundedRect(bx, by, 800, 100, 12);
    bannerGfx.setDepth(40).setAlpha(0);

    const bannerText = this.add.text(this.scale.width / 2, by + 50,
      `${botName} got BINGO!`, {
        ...FONT.UI, fontSize: '30px', color: '#FF6B6B',
      }).setOrigin(0.5).setDepth(41).setAlpha(0);

    this.tweens.add({
      targets: [bannerGfx, bannerText],
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1200,
      onComplete: () => {
        bannerGfx.destroy();
        bannerText.destroy();
        callback();
      },
    });
  }

  _buildResults() {
    const position = this.leaderboardManager.getPosition();
    return {
      position,
      totalPlayers: 8,
      cellsClosed: this.cardManager.getClosedCount(),
      bestStreak: this.streakManager.best,
      jackpotsUsed: this.jackpotUsedCount,
      coinsEarned: POSITION_REWARDS[position] || 75,
    };
  }

  _onSpeedToggle(fast) {
    if (this.timingBar.active && !this.timingBar.locked) {
      this.timingBar.setSpeed(fast);
    }
  }

  _onWildBallButton() {
    if (!this.stateMachine.isIdle() || !this.hasWildBall) return;

    this.stateMachine.setState(STATES.JACKPOT_SELECTING);
    this.wildSelecting = true;
    this.controlZone.setSpinEnabled(false);

    // Show column headers as selectable — highlight column headers
    const HEADER_COLORS_HEX = [0x3498DB, 0x9B59B6, 0x2ECC71, 0xFF8C00, 0xE74C3C];
    this.wildOverlay = this.add.graphics();
    this.wildOverlay.fillStyle(COLOR.BG_DARK, 0.5);
    this.wildOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
    this.wildOverlay.setDepth(20);

    // "Pick a column" text
    this.wildPickText = this.add.text(this.scale.width / 2, 200, 'Pick a column!', {
      ...FONT.UI, fontSize: '36px', color: '#FFD700',
      stroke: '#0D0D1A', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(25);

    // Cancel button
    this.wildCancelBtn = makeTextButton(this, this.scale.width / 2,
      this.scale.height - 200, 300, 80, 'CANCEL');
    this.wildCancelBtn.setDepth(25);
    this.wildCancelBtn.on('pointerdown', () => {
      this._cancelWildSelection();
    });

    // Column header tap handler
    this._wildTapHandler = (pointer) => {
      const CARD_W = CARD_SIZE * CELL_SIZE + (CARD_SIZE - 1) * CELL_GAP;
      const cardX = (this.scale.width - CARD_W) / 2;
      for (let c = 0; c < 5; c++) {
        const colX = cardX + c * (CELL_SIZE + CELL_GAP);
        const colW = CELL_SIZE;
        const colY = SAFE_TOP + HUD_HEIGHT + 20;
        const colH = CARD_W + 40;
        if (pointer.x >= colX && pointer.x <= colX + colW &&
            pointer.y >= colY && pointer.y <= colY + colH) {
          this._selectWildColumn(c);
          return;
        }
      }
    };
    this.input.on('pointerdown', this._wildTapHandler);
  }

  _selectWildColumn(colIndex) {
    if (!this.wildSelecting) return;

    // Check if column has open cells
    const ranges = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
    const [lo, hi] = ranges[colIndex];
    const openInCol = this.cardManager.getOpenNumbers().filter(n => n >= lo && n <= hi);

    if (openInCol.length === 0) {
      // Warn — consuming wild for nothing
      this.hasWildBall = false;
      this.controlZone.setWildBadge(false);
    } else {
      // Guarantee next spin rolls a needed number from this column
      this.wildGuaranteedColumn = colIndex;
      this.hasWildBall = false;
      this.controlZone.setWildBadge(false);
    }

    this._cleanupWildSelection();
    this.stateMachine.setState(STATES.IDLE);
    this._enableSpin();
  }

  _cancelWildSelection() {
    this._cleanupWildSelection();
    this.stateMachine.setState(STATES.IDLE);
    this._enableSpin();
  }

  _cleanupWildSelection() {
    this.wildSelecting = false;
    if (this.wildOverlay) { this.wildOverlay.destroy(); this.wildOverlay = null; }
    if (this.wildPickText) { this.wildPickText.destroy(); this.wildPickText = null; }
    if (this.wildCancelBtn) { this.wildCancelBtn.destroy(); this.wildCancelBtn = null; }
    if (this._wildTapHandler) {
      this.input.off('pointerdown', this._wildTapHandler);
      this._wildTapHandler = null;
    }
  }

  _buildOrientationBlocker() {
    const blocker = this.add.container(0, 0).setDepth(100).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(COLOR.BG_DARK, 0.95);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);
    blocker.add(bg);

    const txt = this.add.text(this.scale.width / 2, this.scale.height / 2,
      '📱 Please rotate to portrait', {
        ...FONT.UI, fontSize: '40px', color: '#F0F0FF',
      }).setOrigin(0.5);
    blocker.add(txt);

    this._orientationBlocker = blocker;

    // Check orientation on resize
    this.scale.on('resize', () => {
      const isLandscape = this.scale.width > this.scale.height;
      this._orientationBlocker.setVisible(isLandscape);
    });

    // Initial check
    if (this.scale.width > this.scale.height) {
      this._orientationBlocker.setVisible(true);
    }
  }

  shutdown() {
    this.bingoCard.destroy();
    this.meterBar.destroy();
    this.timingBar.destroy();
    this.slotMachine.destroy();
    this.audioManager.destroy();
    this.meterManager.destroy();
    this.pressureManager.destroy();
    this.leaderboardManager.destroy();
    this.stateMachine.destroy();

    if (this._busHandlers) {
      this._busHandlers.forEach(([e, fn]) => bus.off(e, fn, this));
    }
  }
}

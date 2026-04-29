export const STATE = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  SPINNING: 'SPINNING',
  RESOLVING: 'RESOLVING',
  JACKPOT_SELECTING: 'JACKPOT_SELECTING',
  MATCH_END: 'MATCH_END',
  RESULTS_PENDING: 'RESULTS_PENDING',
  DESTROYED: 'DESTROYED',
};

const TRANSITIONS = {
  [STATE.COUNTDOWN]: [STATE.IDLE],
  [STATE.IDLE]: [STATE.SPINNING, STATE.JACKPOT_SELECTING, STATE.MATCH_END],
  [STATE.SPINNING]: [STATE.RESOLVING, STATE.MATCH_END],
  [STATE.RESOLVING]: [STATE.IDLE, STATE.MATCH_END],
  [STATE.JACKPOT_SELECTING]: [STATE.RESOLVING, STATE.IDLE],
  [STATE.MATCH_END]: [STATE.RESULTS_PENDING],
  [STATE.RESULTS_PENDING]: [],
  [STATE.DESTROYED]: [],
};

export class MatchStateMachine {
  constructor() {
    this.state = STATE.COUNTDOWN;
    this.queuedBotWin = null;
  }

  setState(next) {
    if (this.state === STATE.DESTROYED) return false;
    const allowed = TRANSITIONS[this.state] || [];
    if (!allowed.includes(next)) {
      console.warn(`Invalid transition: ${this.state} -> ${next}`);
      return false;
    }
    console.log(`State: ${this.state} -> ${next}`);
    this.state = next;
    return true;
  }

  queueBotWin(bot) {
    this.queuedBotWin = bot;
  }
}

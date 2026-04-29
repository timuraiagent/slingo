const STATES = {
  COUNTDOWN: 'COUNTDOWN',
  IDLE: 'IDLE',
  SPINNING: 'SPINNING',
  RESOLVING: 'RESOLVING',
  JACKPOT_SELECTING: 'JACKPOT_SELECTING',
  MATCH_END: 'MATCH_END',
  RESULTS_PENDING: 'RESULTS_PENDING',
  DESTROYED: 'DESTROYED',
};

const TRANSITIONS = {
  COUNTDOWN: [STATES.IDLE],
  IDLE: [STATES.SPINNING, STATES.JACKPOT_SELECTING, STATES.MATCH_END],
  SPINNING: [STATES.RESOLVING, STATES.MATCH_END],
  RESOLVING: [STATES.IDLE, STATES.MATCH_END],
  JACKPOT_SELECTING: [STATES.RESOLVING, STATES.IDLE, STATES.MATCH_END],
  MATCH_END: [STATES.RESULTS_PENDING],
  RESULTS_PENDING: [STATES.DESTROYED],
  DESTROYED: [],
};

export class MatchStateMachine {
  constructor() {
    this.state = STATES.COUNTDOWN;
  }

  setState(next) {
    if (this.state === next) return true; // already there
    const allowed = TRANSITIONS[this.state];
    if (!allowed || !allowed.includes(next)) {
      console.warn(`[StateMachine] Invalid transition: ${this.state} → ${next}`);
      return false;
    }
    const prev = this.state;
    this.state = next;
    console.log(`[StateMachine] ${prev} → ${next}`);
    return true;
  }

  is(state) { return this.state === state; }
  isIdle() { return this.state === STATES.IDLE; }
  isSpinning() { return this.state === STATES.SPINNING; }
  isResolving() { return this.state === STATES.RESOLVING; }
  isJackpotSelecting() { return this.state === STATES.JACKPOT_SELECTING; }
  isMatchEnd() { return this.state === STATES.MATCH_END; }

  destroy() { this.state = STATES.DESTROYED; }
}

export { STATES };

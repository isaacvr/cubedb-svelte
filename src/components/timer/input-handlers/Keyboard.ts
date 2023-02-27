import { Penalty, TimerState, type InputContext, type Session, type Solve, type TimerInput, type TimerInputHandler } from "@interfaces";
import type { Unsubscriber } from "svelte/store";

export class KeyboardInput implements TimerInputHandler {
  private _type: TimerInput;
  private _description: string;
  private active: boolean;
  private decimals: boolean;
  private isRunning: boolean;
  private time: number;
  private ref: number;
  private refPrevention: number;
  private itv: NodeJS.Timer | null;
  private isValid: boolean;

  // Subscriptions
  private context: InputContext;
  private _state: TimerState;
  private _ready: boolean;
  private _session: Session | null;
  private _lastSolve: Solve | null;
  private subs: Unsubscriber[];

  constructor(context: InputContext) {
    this._type = 'Keyboard';
    this._description = 'Keyboard handler';
    this.active = false;
    this.decimals = false;
    this.isRunning = false;
    this.time = 0;
    this.ref = 0;
    this.refPrevention = 0;
    this.itv = null;
    this.isValid = true;

    this.context = context;
    this._state = TimerState.CLEAN;
    this._ready = false;
    this._session = null;
    this._lastSolve = null;
    this.subs = [];
  }

  get type(): TimerInput {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  init() {
    if ( this.active ) return;
    this.active = true;
  
    const { state, ready, session, time, lastSolve, isRunning } = this.context;

    this.subs.push( state.subscribe((st) => { this._state = st; }) );
    this.subs.push( ready.subscribe((rd) => { this._ready = rd; }) );
    this.subs.push( session.subscribe((ss) => { this._session = ss; }) );
    this.subs.push( lastSolve.subscribe((ls) => { this._lastSolve = ls; }) );
    this.subs.push( time.subscribe((t) => { this.time = t; }) );
    this.subs.push( isRunning.subscribe((ir) => { this.isRunning = ir; }) );
  }

  keyUpHandler(e: KeyboardEvent) {
    if ( !this.active ) return;

    const { code } = e;
    const { state, ready, time, createNewSolve } = this.context;

    this.isValid = true;

    if ( code === 'Space' ) {
      if ( this._state === TimerState.PREVENTION ) {
        if ( this._ready ) {
          createNewSolve();
          
          if ( this._session?.settings.hasInspection ) {
            state.update(() => TimerState.INSPECTION);
            this.decimals = false;
            time.update(() => 0);
            ready.update(() => false);
            this.ref = performance.now() + (this._session?.settings.inspection || 15) * 1000;
            this.runTimer(-1, true);
          } else {
            state.update(() => TimerState.RUNNING);
            ready.update(() => false);
            this.ref = performance.now();
            this.decimals = true;
            this.stopTimer();

            if ( (this._lastSolve as Solve).penalty === Penalty.P2 ) {
              this.ref -= 2000;
            }

            this.runTimer(1);
          }
        } else {
          state.update(() => TimerState.CLEAN);
        }
      } else if ( this._state === TimerState.INSPECTION ) {
        state.update(() => TimerState.RUNNING);
        this.ref = performance.now();
        this.decimals = true;
        this.stopTimer();

        if ( (this._lastSolve as Solve).penalty === Penalty.P2 ) {
          this.ref -= 2000;
        }

        this.runTimer(1);
      }
    }
  }

  keyDownHandler(e: KeyboardEvent) {
    if ( !this.active ) return;

    const { code } = e;
    const { state, ready, time, reset, initScrambler, addSolve } = this.context;

    if ( code === 'Space' ) {
      if ( !this.isValid && this._state === TimerState.RUNNING ) {
        return;
      }
      this.isValid = false;

      if ( this._state === TimerState.STOPPED || this._state === TimerState.CLEAN ) {
        state.update(() => TimerState.PREVENTION);
        time.update(() => 0);
        this.refPrevention = performance.now();
      } else if ( this._state === TimerState.PREVENTION ) {
        if ( performance.now() - this.refPrevention > 500 ) {
          ready.update(() => true);
        }
      } else if ( this._state === TimerState.RUNNING ) {
        this.stopTimer();
        time.update(() => ~~(performance.now() - this.ref) );
        addSolve();
        state.update(() => TimerState.STOPPED);
        ready.update(() => false);
        (this._lastSolve as Solve).time = this.time;
        // !battle &&
        initScrambler();
      }
    } else if ( ['KeyR', 'Escape', 'KeyS'].indexOf(code) > -1 /*&& !battle*/ ) {
      if ( (code === 'KeyS' && e.ctrlKey && !this.isRunning) ||
        (code === 'Escape' && this.isRunning && this._session?.settings.scrambleAfterCancel ) ) {
        reset();
        initScrambler();
      } else {
        reset();
      }
      // prevExpanded = false;
    } else if ( this._state === TimerState.RUNNING ) {
      this.stopTimer();
      time.update(() => ~~(performance.now() - this.ref));
      addSolve();
      state.update(() => TimerState.STOPPED);
      ready.update(() => false);
      (this._lastSolve as Solve).time = this.time;
      // !battle &&
      initScrambler();
    }
  }

  runTimer(direction: number, roundUp ?: boolean) {
    if ( !this.active ) return;

    const { state, time } = this.context;

    this.itv = setInterval(() => {
      let t = (direction < 0) ? this.ref - performance.now() : performance.now() - this.ref;

      if ( roundUp ) {
        t = Math.ceil(t / 1000) * 1000;
      }

      if ( t < -2 ) {
        this.stopTimer();
        state.update(() => TimerState.STOPPED);
        (this._lastSolve as Solve).penalty = Penalty.DNS;
        return;
      }

      if ( t <= 0 ) {
        time.update(() => 0);
        this.stopTimer();
        (this._lastSolve as Solve).penalty = Penalty.P2;
        return;
      }

      time.update(() => ~~t);
    }, 47);
  }

  stopTimer() {
    if ( !this.active ) return;

    const { time } = this.context;
    if ( this.time != 0 ) {
      time.update(() => performance.now() - this.ref);
    }
    clearInterval(this.itv as any);
  }

  disconnect() {
    if ( !this.active ) return;
    this.active = false;
    this.subs.forEach(s => s());
  }

}
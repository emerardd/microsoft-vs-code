import { FRAME_DURATION } from '../utils/gameLogic';

/** A bounded fixed-step clock. Excess wall time is discarded for every system alike. */
export class SimulationClock {
  time = 0;
  private remainder = 0;

  advance(deltaMs: number, update: (time: number) => boolean | void): void {
    this.remainder += Math.min(250, Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0));
    while (this.remainder + 1e-7 >= FRAME_DURATION) {
      this.remainder -= FRAME_DURATION;
      this.time += FRAME_DURATION;
      if (update(this.time) === false) {
        this.remainder = 0;
        break;
      }
    }
  }

  reset(time = 0): void {
    this.time = time;
    this.remainder = 0;
  }
}

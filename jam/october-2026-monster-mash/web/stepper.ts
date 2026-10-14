// Fixed physics ticks; cap catch-up after stalls. Lost wall time never becomes a large dt.
export class FixedStepper {
  static readonly dt = 1 / 60;
  private accumulator = 0;
  droppedSeconds = 0;
  reset() { this.accumulator = 0; }
  advance(seconds: number, tick: () => void): number {
    const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const accepted = Math.min(elapsed, 0.1);
    this.droppedSeconds += elapsed - accepted;
    this.accumulator += accepted;
    let steps = 0;
    while (this.accumulator + 1e-10 >= FixedStepper.dt && steps < 6) {
      tick(); this.accumulator = Math.max(0, this.accumulator - FixedStepper.dt); ++steps;
    }
    return this.accumulator / FixedStepper.dt;
  }
}

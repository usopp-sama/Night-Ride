import { loadModule } from './core';
import type { CoreModule } from './core';
export type DriveInput = { throttle: number; brake: number; steer: number; reverse: boolean; handbrake: boolean };
export class DriveCore {
  readonly current = new Float32Array(64);
  readonly previous = new Float32Array(64);
  readonly track: Float32Array;
  private inputPointer: number;
  private snapshotPointer: number;
  private constructor(private core: CoreModule) {
    if (core._nr_drive_version() !== 1) throw new Error('Unsupported vehicle simulation version.');
    this.inputPointer = core._nr_drive_input();
    this.snapshotPointer = core._nr_drive_snapshot();
    const ptr = core._nr_track_data();
    this.track = new Float32Array(core.HEAPU8.buffer, ptr, core._nr_track_count() * 8).slice();
    this.sync();
  }
  static async load() { return new DriveCore(await loadModule()); }
  private read() { this.current.set(new Float32Array(this.core.HEAPU8.buffer, this.snapshotPointer, 64)); }
  private sync() { this.read(); this.previous.set(this.current); }
  step(input: DriveInput) {
    const view = new Float32Array(this.core.HEAPU8.buffer, this.inputPointer, 8);
    view[0] = 1; view[1] = input.throttle; view[2] = input.brake; view[3] = input.steer;
    view[4] = Number(input.reverse); view[5] = Number(input.handbrake);
    this.previous.set(this.current);
    if (this.core._nr_drive_step() !== 0) throw new Error('Vehicle input version mismatch.');
    this.read();
  }
  reset() { this.core._nr_drive_reset(); this.sync(); }
  recover() { this.core._nr_drive_recover(); this.sync(); }
}

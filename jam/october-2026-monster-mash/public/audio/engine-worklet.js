// engine-sim (GM LS or Ferrari F136 V8) runs inside the AudioWorklet: audio never waits on a
// rendering frame. The simulator synthesizes at 44.1 kHz; if the context runs
// at another rate we resample linearly.
const SIM_RATE = 44100;
class NightEngine extends AudioWorkletProcessor {
  constructor(options) {
    super();
    let memory;
    // Raw bytes (not a compiled Module): cloning a Module into a worklet isn't supported everywhere.
    const instance = new WebAssembly.Instance(new WebAssembly.Module(options.processorOptions.wasm), {
      env: { emscripten_notify_memory_growth: () => {} },
      wasi_snapshot_preview1: {
        // Only used by engine-sim's frame timing statistics.
        clock_time_get: (_id, _precision, ptr) => {
          new DataView(memory.buffer).setBigUint64(ptr, BigInt(Math.round(currentTime * 1e9)), true);
          return 0;
        },
      },
    });
    this.engine = instance.exports;
    memory = this.engine.memory;
    this.engine._initialize?.();
    this.engine.nr_es_init(options.processorOptions.engine ?? 0);
    this.rpm = 800; this.throttle = 0; this.active = false; this.gain = 0;
    this.step = SIM_RATE / sampleRate;
    this.buffer = new Float32Array(1024); this.available = 0; this.position = 0; this.last = 0;
    this.alive = true;
    this.port.onmessage = ({ data }) => {
      if (data.dispose) { this.alive = false; return; }
      this.rpm = data.rpm; this.throttle = data.load; this.active = data.active;
    };
    this.reportTimer = 0;
  }
  refill(needed) {
    // Keep consumed samples out of the buffer and append fresh 44.1 kHz audio.
    const keep = this.available - Math.floor(this.position);
    this.buffer.copyWithin(0, Math.floor(this.position), this.available);
    this.position -= Math.floor(this.position); this.available = keep;
    while (this.available < needed) {
      const frames = 128;
      const ptr = this.engine.nr_es_render(frames);
      this.buffer.set(new Float32Array(this.engine.memory.buffer, ptr, frames), this.available);
      this.available += frames;
    }
  }
  process(_inputs, outputs) {
    if (!this.alive) return false;
    const out = outputs[0], left = out[0], frames = left.length;
    this.engine.nr_es_control(this.rpm, this.active ? this.throttle : 0);
    this.refill(Math.ceil(frames * this.step) + 2);
    const target = this.active ? 1 : 0;
    for (let i = 0; i < frames; ++i) {
      const index = Math.floor(this.position), fraction = this.position - index;
      const sample = this.buffer[index] * (1 - fraction) + this.buffer[index + 1] * fraction;
      this.gain += (target - this.gain) * 0.0008;
      left[i] = sample * this.gain;
      this.position += this.step;
    }
    for (let c = 1; c < out.length; ++c) out[c].set(left);
    if (++this.reportTimer >= 30) { this.reportTimer = 0; this.port.postMessage({ rpm: this.engine.nr_es_rpm() }); }
    return true;
  }
}
registerProcessor('night-engine', NightEngine);

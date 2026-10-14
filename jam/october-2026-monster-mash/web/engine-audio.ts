// Engine sound from engine-sim's V8 simulations (see core/src/engine_sim_audio.cpp).
// The worklet produces the dry exhaust signal; the engine's upstream exhaust
// impulse response is applied here with an FFT ConvolverNode, which is
// what engine-sim's synthesizer does with a 10k-tap time-domain filter.
export type EngineId = 'gm-ls' | 'ferrari-f136';
// gain: matches the synthesizer's leveled output for that IR (measured offline
// with build/native/night_engine_render).
const ENGINES: Record<EngineId, { index: number; ir: string; gain: number }> = {
  'gm-ls': { index: 0, ir: 'audio/ls-exhaust-ir.wav', gain: 0.0457 },
  'ferrari-f136': { index: 1, ir: 'audio/f136-exhaust-ir.wav', gain: 0.0161 },
};
export class EngineAudio {
  private context?: AudioContext;
  private node?: AudioWorkletNode;
  private master?: GainNode;
  private wasm?: Promise<ArrayBuffer>;
  private muted = false;
  private pending?: Promise<void>;
  private active = false;
  private last = { rpm: 800, load: 0, active: false };
  /** Crankshaft RPM reported back by engine-sim (for debugging/telemetry). */
  simulatedRpm = 0;
  constructor(private engine: EngineId = 'ferrari-f136') {}
  async start() {
    // AudioWorklet exists only in secure contexts (127.0.0.1/localhost or HTTPS), not a LAN address over http.
    if (!window.isSecureContext || typeof AudioWorkletNode === 'undefined') {
      throw new Error(`Engine sound needs a secure page. Open http://127.0.0.1:${location.port || '5173'}${location.pathname} on this computer (or serve over HTTPS) instead of ${location.host}.`);
    }
    if (!this.context) {
      // engine-sim synthesizes at 44.1 kHz; asking for it avoids resampling.
      try { this.context = new AudioContext({ latencyHint: 'interactive', sampleRate: 44100 }); }
      catch { this.context = new AudioContext({ latencyHint: 'interactive' }); }
    }
    await this.context.resume();
    if (!this.pending) this.pending = this.initialize().catch(error => { this.pending = undefined; throw error; });
    await this.pending;
  }
  private async initialize() {
    const context = this.context!;
    const base = new URL(import.meta.env.BASE_URL, document.baseURI);
    this.wasm ??= fetch(new URL('wasm/engine_audio.wasm', base)).then(response => {
      if (!response.ok) throw new Error(`Engine audio module missing (${response.status}). Rebuild with npm run dev.`);
      return response.arrayBuffer();
    });
    await context.audioWorklet.addModule(new URL('audio/engine-worklet.js', base));
    this.master = new GainNode(context, { gain: this.muted ? 0 : 0.8 });
    const limiter = new DynamicsCompressorNode(context, { threshold: -6, knee: 4, ratio: 12, attack: 0.003, release: 0.15 });
    this.master.connect(limiter).connect(context.destination);
    await this.connectEngine();
  }
  private async connectEngine() {
    const context = this.context!, spec = ENGINES[this.engine];
    const irResponse = await fetch(new URL(spec.ir, new URL(import.meta.env.BASE_URL, document.baseURI)));
    if (!irResponse.ok) throw new Error(`Exhaust impulse response missing (${irResponse.status}).`);
    const [wasm, ir] = await Promise.all([this.wasm!, context.decodeAudioData(await irResponse.arrayBuffer())]);
    const node = new AudioWorkletNode(context, 'night-engine', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { wasm, engine: spec.index } });
    node.onprocessorerror = () => console.error('Engine audio processor failed.');
    node.port.onmessage = ({ data }) => { this.simulatedRpm = data.rpm; };
    const convolution = new ConvolverNode(context, { disableNormalization: true });
    convolution.buffer = trimImpulse(context, ir);
    const wet = new GainNode(context, { gain: spec.gain });
    node.connect(convolution).connect(wet).connect(this.master!);
    this.node?.port.postMessage({ dispose: true }); this.node?.disconnect();
    this.node = node;
    node.port.postMessage(this.last);
  }
  /** Swap engines (each car has its own engine-sim definition). */
  async setEngine(engine: EngineId) {
    if (engine === this.engine) return;
    this.engine = engine;
    if (this.pending) { await this.pending; await this.connectEngine(); }
  }
  update(rpm: number, load: number, active: boolean) {
    this.active = active;
    if (Math.abs(rpm - this.last.rpm) < 1 && Math.abs(load - this.last.load) < 0.01 && active === this.last.active) return;
    this.last = { rpm, load, active };
    this.node?.port.postMessage(this.last);
  }
  silence() { this.update(this.last.rpm, 0, false); }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.context.currentTime, 0.04);
    return this.muted;
  }
  get running() { return !!this.node && this.context?.state === 'running' && this.active && !this.muted; }
}

// Synthesizer::initializeImpulseResponse keeps samples up to the last |x| > 100/32767, capped at 10k.
function trimImpulse(context: BaseAudioContext, ir: AudioBuffer) {
  const data = ir.getChannelData(0);
  let length = 0;
  for (let i = 0; i < data.length; ++i) if (Math.abs(data[i]!) > 100 / 32767) length = i + 1;
  length = Math.max(1, Math.min(length, Math.round(10000 * context.sampleRate / 44100)));
  const trimmed = context.createBuffer(1, length, ir.sampleRate);
  trimmed.copyToChannel(data.subarray(0, length), 0);
  return trimmed;
}

import './drive.css';
import { DriveCore } from './drive-core';
import type { DriveInput } from './drive-core';
import { DriveScene } from './drive-scene';
import { FixedStepper } from './stepper';
import { loadModels } from './models';
import { EngineAudio } from './engine-audio';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('scene');
const start = el<HTMLButtonElement>('start');
const pauseButton = el<HTMLButtonElement>('pause');
const keys = new Set<string>(), touch = new Map<number, string>();
let mode: 'loading' | 'ready' | 'driving' | 'paused' | 'error' = 'loading';
let reverse = false, core: DriveCore, scene: DriveScene;
let lastTime = 0, hudTime = 0, physicsMs = 0, frameMs = 16.7, renderMs = 0;
let gamepadArmed = false, padButtons: boolean[] = [];
let padPauseHeld = false;
const stepper = new FixedStepper();
const audio = new EngineAudio();
let audioError = '';
function enableAudio() {
  void audio.start().catch(error => {
    audioError = error instanceof Error ? error.message : String(error);
    console.error('Engine audio unavailable:', error);
    el('audio').textContent = 'Audio unavailable'; el('audio').title = audioError;
    el('drive-status').textContent = `Audio unavailable: ${audioError}`;
  });
}
const drivingKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space']);

function clearInput() { keys.clear(); touch.clear(); document.querySelectorAll('[data-control]').forEach(b => b.classList.remove('active')); }
function setMode(next: typeof mode) {
  mode = next; document.body.dataset.mode = mode; stepper.reset(); clearInput(); gamepadArmed = false; padButtons = [];
  if (mode !== 'driving') audio.silence();
  el('overlay').hidden = mode === 'driving';
  if (mode !== 'driving') { el('telemetry').hidden = true; el('diagnostics').setAttribute('aria-expanded', 'false'); }
  pauseButton.textContent = mode === 'paused' ? 'Resume · P' : 'Pause · P';
  pauseButton.disabled = mode !== 'paused' && mode !== 'driving';
  el<HTMLButtonElement>('recover').disabled = mode !== 'driving';
  el<HTMLButtonElement>('reverse').disabled = mode !== 'driving';
  if (mode === 'paused') {
    el('overlay-title').textContent = 'A moment of stillness.';
    el('overlay-copy').textContent = 'Your drive is paused. Resume when you’re ready, or head back to the seed atlas.';
    start.textContent = 'Back to the road →'; start.focus();
  }
  if (mode === 'driving') start.blur();
}
function pause() { if (mode === 'driving') setMode('paused'); else if (mode === 'paused') setMode('driving'); }
function recover() {
  if (mode !== 'driving') return;
  core.recover(); reverse = false; updateReverse(); stepper.reset(); clearInput(); scene.snapCamera();
}
function updateReverse() { el('reverse').setAttribute('aria-pressed', String(reverse)); }
function toggleReverse() { if (mode === 'driving') { reverse = !reverse; updateReverse(); } }
function pollControllerPause() {
  const pad = [...(navigator.getGamepads?.() ?? [])].find(p => p?.mapping === 'standard');
  const pressed = pad?.buttons[9]?.pressed ?? false;
  if (pressed && !padPauseHeld) {
    if (mode === 'ready') setMode('driving'); else pause();
  }
  padPauseHeld = pressed;
}
function sampleInput(): DriveInput {
  const held = (code: string, arrow: string, action: string) => keys.has(code) || keys.has(arrow) || [...touch.values()].includes(action);
  let throttle = Number(held('KeyW', 'ArrowUp', 'throttle'));
  let brake = Number(held('KeyS', 'ArrowDown', 'brake'));
  let steer = Number(held('KeyD', 'ArrowRight', 'right')) - Number(held('KeyA', 'ArrowLeft', 'left'));
  let handbrake = keys.has('Space');
  const pad = [...(navigator.getGamepads?.() ?? [])].find(p => p?.mapping === 'standard');
  if (pad) {
    const axis = pad.axes[0] ?? 0, rt = pad.buttons[7]?.value ?? 0, lt = pad.buttons[6]?.value ?? 0;
    // Require neutral controls after resume; disconnect never leaves cached throttle behind.
    if (!gamepadArmed && Math.abs(axis) < 0.15 && rt < 0.05 && lt < 0.05 && !pad.buttons[0]?.pressed && !pad.buttons[2]?.pressed && !pad.buttons[3]?.pressed) gamepadArmed = true;
    if (gamepadArmed) {
      const analog = Math.abs(axis) < 0.15 ? 0 : Math.sign(axis) * ((Math.abs(axis) - 0.15) / 0.85) ** 1.3;
      if (Math.abs(analog) > Math.abs(steer)) steer = analog;
      throttle = Math.max(throttle, rt); brake = Math.max(brake, lt); handbrake ||= pad.buttons[0]?.pressed ?? false;
      if (pad.buttons[3]?.pressed && !padButtons[3]) toggleReverse();
      if (pad.buttons[2]?.pressed && !padButtons[2]) recover();
    }
    padButtons = pad.buttons.map(b => b.pressed);
  } else { gamepadArmed = false; padButtons = []; }
  return { throttle, brake, steer, reverse, handbrake };
}
document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.metaKey || event.ctrlKey || event.altKey) return;
  if (mode === 'driving' && drivingKeys.has(event.code)) { event.preventDefault(); keys.add(event.code); }
  if (event.repeat) return;
  if (event.code === 'KeyP' || event.code === 'Escape') { event.preventDefault(); pause(); }
  if (event.code === 'KeyR') recover();
  if (event.code === 'KeyV') toggleReverse();
});
document.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { clearInput(); if (mode === 'driving') setMode('paused'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'driving') setMode('paused'); lastTime = 0; });
window.addEventListener('gamepaddisconnected', () => { gamepadArmed = false; padButtons = []; if (mode === 'driving') setMode('paused'); });
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); setMode('error'); start.disabled = true;
  el('overlay-title').textContent = 'The view was interrupted.';
  el('drive-status').textContent = 'Graphics context lost. Reload this page to restart safely.';
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-control]')) {
  button.addEventListener('pointerdown', event => {
    if (mode !== 'driving') return; event.preventDefault(); button.setPointerCapture(event.pointerId); touch.set(event.pointerId, button.dataset.control!); button.classList.add('active');
  });
  const release = (event: PointerEvent) => { touch.delete(event.pointerId); button.classList.remove('active'); };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
}
start.addEventListener('click', () => { if (mode === 'ready' || mode === 'paused') { enableAudio(); setMode('driving'); } });
el('audio').addEventListener('click', () => { enableAudio(); const muted = audio.toggleMute(); el('audio').textContent = audioError ? 'Audio unavailable' : muted ? 'Sound off' : 'Sound on'; el('audio').setAttribute('aria-pressed', String(!muted)); });
pauseButton.addEventListener('click', pause);
el('recover').addEventListener('click', recover); el('reverse').addEventListener('click', toggleReverse);
el('diagnostics').addEventListener('click', () => { const panel = el('telemetry'); panel.hidden = !panel.hidden; el('diagnostics').setAttribute('aria-expanded', String(!panel.hidden)); });
el('restart').addEventListener('click', () => {
  if (!core || mode === 'error') return; core.reset(); reverse = false; updateReverse(); scene.snapCamera(); setMode('paused');
});

function clock(seconds: number) { return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, '0')}`; }
function hud() {
  const s = core.current, speed = Math.abs(s[15]!) * 3.6;
  audio.update(s[16]!, s[43]!, mode === 'driving'); document.body.dataset.audio = audio.running ? 'running' : 'silent';
  el('speed').textContent = Math.round(speed).toString(); el('gear').textContent = s[17]! < 0 ? 'R' : `D${s[17]}`;
  el('rpm-bar').style.width = `${Math.min(100, s[16]! / 6200 * 100)}%`;
  const surface = ['ASPHALT', 'GRAVEL', 'SHOULDER'][s[19]!] ?? 'ASPHALT'; el('surface').textContent = surface;
  el('lap-label').textContent = s[22] === 0 ? 'Your first lap' : `Lap ${s[22]! + 1}`;
  el('lap-time').textContent = clock(s[23]!); el('last-lap').textContent = s[24]! > 0 ? `Last lap ${clock(s[24]!)}` : '';
  el('route-cue').textContent = reverse && s[17]! > 0 ? 'Brake to a stop to engage reverse' : s[40]! < 0.5 ? 'Press R to return to the road' : s[19] === 1 ? 'Gravel stretch · ease into the grip' : s[21]! > 145 && s[21]! < 330 ? 'Lakeside rise · follow the curve' : 'Follow the loop · take your time';
  const values = el('telemetry-values');
  // Read-only diagnostics for playtests and browser regression checks.
  values.dataset.tick = String(s[1]); values.dataset.speed = String(s[15]); values.dataset.distance = String(s[41]); values.dataset.recoveries = String(s[25]); values.dataset.throttle = String(s[43]);
  values.textContent = `Speed       ${speed.toFixed(1)} km/h\nRPM / gear  ${Math.round(s[16]!)} / ${s[17]}\nSurface     ${surface.toLowerCase()}\nContacts    ${s[20]} / 4\nTravel mm   ${Array.from(s.subarray(28, 32), n => (n * 1000).toFixed(0)).join(' / ')}\nSlip        ${Array.from(s.subarray(36, 40), n => n.toFixed(2)).join(' / ')}\nEnergy      ${(s[27]! / 1000).toFixed(1)} kJ\nPhysics     ${physicsMs.toFixed(2)} ms/tick\nRender CPU  ${renderMs.toFixed(2)} ms\nFrame       ${frameMs.toFixed(1)} ms (${(1000 / frameMs).toFixed(0)} fps)\nDropped     ${stepper.droppedSeconds.toFixed(2)} s\nTicks       ${s[1]}\nRecoveries  ${s[25]}   Impacts ${s[26]}`;
  const map = el<HTMLCanvasElement>('minimap'), ctx = map.getContext('2d')!;
  ctx.clearRect(0, 0, map.width, map.height);
  const mx = (x: number) => 80 + x * 0.7, my = (z: number) => 105 - z * 0.7;
  ctx.beginPath(); const track = core.track;
  for (let i = 0; i < track.length; i += 8) { if (i === 0) ctx.moveTo(mx(track[i]!), my(track[i + 2]!)); else ctx.lineTo(mx(track[i]!), my(track[i + 2]!)); }
  ctx.strokeStyle = '#c8d8c88c'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#d6deb6'; ctx.fillRect(mx(55) - 3, my(-75) - 2, 6, 4);
  ctx.beginPath(); ctx.arc(mx(s[2]!), my(s[4]!), 4, 0, Math.PI * 2); ctx.fillStyle = '#fff1c0'; ctx.fill();
}
function frame(time: number) {
  pollControllerPause();
  const elapsed = lastTime ? (time - lastTime) / 1000 : 0; lastTime = time;
  frameMs += (Math.max(1, elapsed * 1000) - frameMs) * 0.04;
  let alpha = 1;
  if (mode === 'driving') alpha = stepper.advance(elapsed, () => {
    const input = sampleInput(), begin = performance.now(); core.step(input); physicsMs += (performance.now() - begin - physicsMs) * 0.05;
  });
  const begin = performance.now();
  scene.render(core.previous, core.current, alpha, mode === 'driving' ? Math.min(elapsed, 0.1) : 0);
  renderMs += (performance.now() - begin - renderMs) * 0.05;
  if (time - hudTime > 100) { hud(); hudTime = time; }
  if (mode !== 'error') requestAnimationFrame(frame);
}
async function boot() {
  const [simulation, kit] = await Promise.all([DriveCore.load(), loadModels()]);
  core = simulation; scene = new DriveScene(canvas, core.track, kit);
  setMode('ready'); start.disabled = false; start.textContent = 'Start driving →';
  el('drive-status').textContent = 'Authored test loop · seed worlds remain in the atlas.';
  document.documentElement.dataset.driveReady = 'true'; hud(); requestAnimationFrame(frame);
}
boot().catch(error => {
  setMode('error'); start.disabled = true; start.textContent = 'Driving unavailable';
  el('overlay-title').textContent = 'We couldn’t start the car.';
  el('drive-status').textContent = `${error instanceof Error ? error.message : String(error)}. Try a WebGL2-capable browser with hardware acceleration, or rebuild and reload. The seed atlas is still available.`;
});

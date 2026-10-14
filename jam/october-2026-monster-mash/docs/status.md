# Build status — October 14, 2026 (evening update)

## Delivered this session: engine-sim audio, real assets, seeded 3D worlds

**1. engine-sim is integrated for audio.** The actual engine-sim simulation (combustion, gas dynamics, exhaust, synthesizer) is vendored and compiled to a 108 KB standalone WASM module. It runs inside an AudioWorklet. Two upstream engine definitions are translated to C++: **GM LS V8** (`07_gm_ls.mr`) and **Ferrari F136 V8** (`08_ferrari_f136_v8.mr`). engine-sim's dynamometer holds the crank at the RPM our drivetrain reports, and the player's throttle drives combustion. Each engine's upstream exhaust impulse response is applied with a WebAudio ConvolverNode. The earlier build only borrowed three filter classes and used a hand-made pulse model; that file is removed.
- WASM renders about 3.0x faster than realtime; native renders 3.3–3.5x.
- New CTests `engine_sim_gm_ls` and `engine_sim_ferrari_f136` sweep idle → redline → lift-off. They require audible output and RPM tracking within 5%. Measured worst tracking error: LS 2.7%, F136 4.0%.
- In-browser check: the worklet reported 2160 rpm while the tour requested about 2200.

**2. Real 3D assets replace the cone trees.**
- Car: the Ferrari 458 Italia is now the default (paired with the F136 engine); the Camaro SS with the LS remains selectable. **The Ferrari model's license could not be re-verified; see provenance.**
- Trees: EZ-Tree procedural oaks, ashes, pines and bushes are grown from the world seed.
- Textures: CC0 Poly Haven ground, asphalt, gravel and sand textures.
- Water: the three.js reflective water shader.

**3. Seeded world viewer (`/world.html`).** The C++ scene generator (v2) is new. From a seed it produces:
- a mountain-ringed valley;
- rolling hills, with the road corridor graded flat;
- lakes at a proper water level;
- a forest-cover field with meadow clearings;
- about 30k placed trees, shrubs and rocks, with per-chunk random streams.

Generation takes about 85 ms in WASM. The viewer is a night scene with a starry sky, moon, Ferrari headlights, and an overview plus a guided tour. Trees use chunked LOD with baked impostors. Measured 6.4 ms/frame at ground level and 11 ms for the full-region overview at 1536×1152 on the M4 Pro. A car/engine picker switches model and engine-sim definition together.

## Verification (this session)

- `npm test`: **4/4 CTests** pass (world contract, vehicle contract, two engine-sim tests). Native/WASM parity for **109 seeds** and the 60 s vehicle replay still pass. The world generator and its golden hashes are unchanged; only the separate scene preview is now v2.
- `npm run build`: strict TypeScript and Vite build pass.
- `npm run test:browser`: **20/20 pass** in Chromium and WebKit (3 consecutive runs, about 10 s each). Headless Chromium now uses hardware GL (`--use-angle=metal`); with software GL the detailed Ferrari slowed the frame-paced sim enough to time out.
- Engine audio needs a secure context. It works on `127.0.0.1`/`localhost` or over HTTPS, and fails over `http://<LAN-IP>` (the "Network" URL Vite prints). The page now explains this instead of a bare "Audio unavailable". The compiled WASM is passed to the AudioWorklet as bytes, not as a `WebAssembly.Module`.

## Known gaps / next steps

- Nobody has listened to the engine sound yet. Check it by ear: in `/world.html`, choose "Engine sound" and then "Tour the road", for both cars.
- The drive loop still uses the Kenney low-poly nature kit. Port the forest and textures there next, or start driving the generated roads (Step 3).
- The car's own drivetrain shifts at 4,900 rpm, so the F136 never reaches its 9,000 rpm range while driving. Retune per car (this changes the vehicle golden replay).
- The bundle grew to 19 MB raw, mostly textures and EZ-Tree's embedded bark and leaf images. Compress textures (KTX2) before submission.
- **Replace or verify the Ferrari model license before any public release.**

---

# Earlier status — October 14, 2026 (afternoon)

## Delivered

The project now includes a **playable Step 2 authored-road prototype** at `/drive.html`, alongside the seed atlas at `/`. Step 1's graph-generation gate and Step 0's local toolchain/native/WASM gates remain green. RUN CLI/SDK/account integration and a private hosted compatibility probe remain open.

The 646 m lakeside loop contains asphalt, gravel, a hill, a bump and guardrails. C++ owns the fixed 60 Hz six-DOF chassis, quaternion orientation, four suspension rays, tire forces, engine/automatic gears, reverse, collision response, recovery and lap state. Three.js consumes packed snapshots for the car, wheels and chase camera. The UI offers speed/gear/surface, minimap, lap timing, pause, restart and developer telemetry. Keyboard, standard-controller mappings and narrow-screen touch controls are implemented. Blur/visibility/controller disconnect pause safely.

The loop is authored, **not generated from the selected seed**. The separate atlas still shows deterministic C++ graphs, palettes, weather, fingerprints and JSON manifests. No seed output or golden hash changed. Procedural 3D roads, world streaming, audio, saves, car condition and monsters are not implemented yet.

## Verification evidence

Commands executed successfully:

- `npm test`: world tests remain green (1,000 seed graphs); vehicle tests cover equilibrium, acceleration/braking, reverse, steering direction, guardrail contact, rollover recovery, invalid inputs, road/collider agreement and deterministic replay.
- Automated pursuit driver: **ten consecutive laps**, zero impacts/recoveries, maximum 14.09 m/s, minimum upright dot .9972 and no airborne ticks. It traversed the hill, bump and gravel. This does not establish first-time human playability.
- Native/WASM: **109 seeds** remain byte-identical; a **60-second vehicle replay** passes explicit numerical tolerances at one-second checkpoints. Maximum sampled position discrepancy .000008 m. ABI rejection, recovery and memory-growth checks pass.
- `npm run build`: Release WASM, strict TypeScript and Vite production build pass. A nonfatal >500 kB chunk warning reflects the Three.js driving bundle; the atlas does not load that chunk.
- `npm run test:browser`: **20 tests passed** in Chromium and WebKit. Atlas regressions, driving startup, acceleration/braking, pause/recover/restart, input clearing, simulated standard-controller controls, touch, nested paths and missing-WASM errors. Fixed-clock tests cover 15/30/60/144 Hz and bounded stall catch-up.
- In-app browser: desktop/narrow layout, manual acceleration and corrected right steering inspected. Production screenshots are retained under ignored `test-results/`.
- `git diff --check`: no tracked whitespace errors. Changes remain local; no commit, push or publication.

Production bundle: **620,844 raw bytes / 175,180 gzip-estimate bytes** across both entries, WASM and notices. WASM is 76,874 bytes; the driving JS is 504,514 raw / 126,450 gzip-estimate bytes. Actual hosting compression and sustained device performance remain unmeasured.

## Open Step 2 gates

1. A new keyboard player completes a first lap and reports handling/camera feel.
2. A physical controller feels continuous with no unwanted drift; current controller regression uses simulated inputs.
3. Sustained 1080p performance and lower-power-device profiling. Telemetry reports CPU/frame time, not GPU timer-query measurements.

Automated stability and parity gates pass; Step 2 is **not fully signed off** until human/device checks are complete. Use the [five-minute playtest](playtest-2026-10-14.md). Physics scope and ABI are in the [vehicle contract](vehicle-contract.md).

## What comes next

Tune the car from playtest feedback, then begin Step 3: smooth seeded graph edges into sampled roads, derive visible road/collision from the same samples, add spatial queries and validate curvature/grade/junction seams before driving generated worlds. Preserve seed regressions and increment the generator version when manifest output changes.

Complete the private RUN compatibility probe when account access is available. The local build does not establish hosted compatibility or jam submission eligibility. No public release has occurred. Original roadmap dates remain targets, not measured delivery rates.


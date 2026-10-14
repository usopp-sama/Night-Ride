# Decisions — October 14, 2026

| ID | Decision | Reason / consequence |
| --- | --- | --- |
| D001 | C++20 library with CMake native and Emscripten targets | One generator implementation; native tests stay fast. |
| D002 | Strict TypeScript/Vite, SVG atlas at Step 1 | Inspect graph facts before introducing 3D scenery. Three.js enters at the authored-road milestone. |
| D003 | ABI 1: synchronous seed-in, validated JSON-out | Small inspectable debug boundary. No JSON in a future 60 Hz simulation tick. |
| D004 | Graph coordinates and distances use integer arithmetic | Native/WASM byte parity without platform-dependent transcendental math. Road smoothing will require its own quantization contract and version change. |
| D005 | Named xorshift32 streams; length-delimited FNV32 seeds | Topology, roads, palette, and landmarks are isolated. Decorators must use chunk-specific streams. |
| D006 | ASCII trim + valid UTF-8; case preserved, no Unicode folding | Explicit reproducible normalization; maximum 128 normalized bytes. |
| D007 | Two required detours, optional third; four possible abstract reconnection variants | Small content kit with actual topology variation. Spatial placement offers further variation. |
| D008 | Up to 8 attempts, each using an explicit attempt namespace | Validation failure cannot hang the UI or introduce unseeded randomness. |
| D009 | Graph acceptance is distinct from driveability acceptance | Current tests do not establish grade, smoothness, collision, visual variety, or a 10–15 minute session. |
| D010 | Project-local Emscripten cache; select Python >=3.10 | Homebrew's CMake invocation bypassed its Python wrapper. Do not edit global Python/PATH to repair this. |
| D011 | RUN integration requires an actual hosted probe | Generic browser/WASM support is insufficient evidence for sandbox compatibility. |
| D012 | Retain a bounded project-owned solver for the authored-road spike | Analytic heightfield + two continuous rail boundaries keep the collision problem small. The prototype passed ten automated laps and native/WASM replay without a general-purpose library. This does not justify extending it to arbitrary mesh collision; reassess if Step 3 contact requirements exceed sampled-road primitives. |
| D013 | Independent simulation ABI 1 with preallocated float32 buffers | Eight input slots and 64 snapshot slots; no per-tick JSON. Generator API/version stays unchanged. |
| D014 | Separate `drive.html` from the atlas | Car handling can be reviewed on an authored road without implying generated graph driveability. Three.js loads only on the driving entry. |
| D015 | Fixed 60 Hz, maximum six catch-up ticks, drop excess elapsed wall time | Avoid long-frame instability; report dropped seconds. Pause/focus/visibility clears input and accumulator. |
| D016 | Explicit reverse and forgiving speed-sensitive steering | Braking never unexpectedly reverses; driver-right accounts for +Z-forward coordinates. Recovery is always available. |
| D017 | Functional keyboard/controller/touch input; human feel gate remains open | Simulated controller tests establish mapping/dead-zone behavior, not hardware feel. Automated laps establish stability, not first-time-player usability. |
| D018 | Engine sound = real engine-sim, held at the drivetrain's RPM by its dynamometer | Our solver stays authoritative for motion. engine-sim simulates combustion, gas flow and exhaust at that RPM and throttle, so the sound is the simulation's output, not a resynthesis. |
| D019 | Translate `.mr` engine scripts to C++ by hand (spec table) | Avoids shipping the Piranha compiler (flex/bison/boost). LS and F136 share one object graph and differ only in data. |
| D020 | Exhaust IR convolution in WebAudio `ConvolverNode`, not engine-sim's time-domain filter | The 10k-tap filter was ~55% of CPU. Both channels use the same IR, so convolving after the mix is equivalent. The result runs about 3x faster than realtime in WASM. |
| D021 | engine-sim runs in its own standalone WASM inside the AudioWorklet | Audio never waits on rendering frames; the 108 KB module needs no JS glue. |
| D022 | Hero car is the Ferrari 458 with the F136 V8; Camaro + LS remains selectable | Each car is paired with an engine that has an upstream engine-sim definition. The Ferrari model's license must be verified before release. |
| D023 | Scene v2: C++ owns terrain, mountains, lakes, forest cover and all placements | Woodland uses per-250 m-chunk streams (`scene-v2/forest/x,z`), so one area can change without reshuffling others. The browser only grows tree *shapes* from the seed. |
| D024 | Trees: EZ-Tree variants per seed, chunked LOD, baked impostors beyond ~440 m | About 30k trees. Measured 6.4 ms/frame at ground level and 11 ms for the full-region overview on the M4 Pro. ez-tree's leaf shader drops `instanceMatrix`; our wrapper patches it. |

The roadmap's dates are targets; acceptance tests determine progress. No automatic publication, remote push, or paid asset generation is part of this milestone.


# Night Ride — October Jam

C++20 world generation and vehicle simulation, compiled natively and to WebAssembly. The seed atlas and a playable **Step 2 authored-road prototype** run in a TypeScript/Vite shell with Three.js presentation.

The [jam roadmap](../../docs/jam/october-2026-monster-mash-roadmap.md) defines the milestones. The car can now drive an authored loop; generated worlds are still abstract graphs. Finish human handling playtests before connecting the two at Step 3.

## Run locally

Prerequisites: CMake >=3.20, a C++20 compiler, Node >=22.12, Python >=3.10, and Emscripten. On this Mac the installed toolchain was provisioned with `brew install cmake emscripten` (Emscripten includes Node and Python dependencies). An activated official `emsdk` environment is also supported through its `EMSDK_PYTHON` setting. Windows/native MSVC support has not been tested yet.

```sh
cd '/Users/anagverm/Documents/ChatGPT/Night-Ride/jam/october-2026-monster-mash'
npm ci
npm run dev
```

`npm run dev` and `npm run build` download the Ferrari model from the three.js examples on first run (it isn't committed; see `docs/provenance.md`). Engine audio requires a secure page: use `http://localhost:5173` or `127.0.0.1`, not the Network URL.

Open the localhost URL printed by Vite. Seed input goes into the compiled C++ generator. The browser only presents its result. The default development server is bound to `127.0.0.1:5173`.

Open `/drive.html`, or choose **Take a test drive** in the atlas. WASD/arrows accelerate, steer and brake; Space handbrakes; V selects reverse (stop before it engages); R recovers; P/Escape pauses. Standard controllers use left stick, RT/LT, A handbrake, X recover, Y reverse, Menu pause. Narrow screens expose touch controls. Physical controller feel still needs a hands-on test. See [playtest instructions](docs/playtest-2026-10-14.md).

| Command | Result |
| --- | --- |
| `npm run dev` | Build WASM and open a Vite development server |
| `npm test` | Native CTest suite + Node-hosted WASM/native byte-parity suite |
| `npm run typecheck` | Strict TypeScript checks |
| `npm run build` | Release WASM + checked browser production bundle + size report |
| `npm run preview` | Serve the last production bundle on `127.0.0.1:4173` |
| `npx playwright install chromium webkit` | One-time browser-test setup |
| `npm run test:browser` | Chromium + WebKit tests against `dist/` (build first) |
| `npm run deploy:prepare` | Native/WASM tests, production build, browser tests; no upload |
| `npm run toolchain` | Print actual build-tool versions |

Stop a server with Ctrl-C. C++ changes require rebuilding WASM: stop and rerun `npm run dev`; TypeScript/CSS edits hot-reload. Build caches, dependencies, generated WASM, and `dist/` are ignored by Git.

Native-only testing without Node or Emscripten:

```sh
cmake -S . -B build/native -DCMAKE_BUILD_TYPE=Debug
cmake --build build/native --parallel 4
ctest --test-dir build/native --output-on-failure
./build/native/night_manifest 'moonlit-run'
```

## Structure

```text
core/include/night/     World data types and C ABI
core/src/               C++ generation, vehicle physics, analytic test road, ABI, CLI
web/                    WASM bridge, atlas, input/clock, Three.js presentation
tests/                  Native tests, golden seeds, WASM parity, browser tests
scripts/                Repeatable build/test commands
docs/                   Decisions, risk register, toolchain, test evidence
public/wasm/            Generated ES loader and WASM (ignored)
dist/                   Production browser bundle (ignored)
```

## What the first generator guarantees

- A connected main route of 3.9–6.5 km graph distance with start, service, approach, and destination.
- Two or three landmark detours that reconnect to the road network.
- Seed-dependent reconnection choices, node coordinates, palette, and weather.
- Stable semantic IDs, integer graph coordinates, versioned random streams, bounded retries.
- Repeated normalized seeds produce byte-identical manifests across the tested native/WASM targets.
- A manifest is published to the browser only after graph validation succeeds.

The atlas uses straight lines and a nonuniform schematic scale. Distances are graph estimates; driving duration, terrain grade, road curvature, junction geometry, collision safety, and monster fairness are **not validated at this milestone**. Those gates begin in Steps 2–3 and 5. The five preset seeds are regression fixtures and exploration examples; they are not yet curated gameplay showcase seeds.

## Seed and bridge contract

Seed text is valid UTF-8, case-sensitive, with leading/trailing **ASCII whitespace** removed. Internal controls, NUL, malformed UTF-8, and normalized values longer than 128 bytes are rejected. Unicode normalization/case folding is intentionally absent: composed and decomposed strings are different seeds. Maximum raw input is 256 bytes. Empty input returns an actionable error.

PRNG: xorshift32, initialized with FNV-1a32 over a length-delimited generator/seed/domain/attempt namespace. Range selection uses rejection sampling. Manifest fingerprint: FNV-1a64 over the canonical payload bytes, rendered as 16 hex digits; this is a regression checksum, not a security primitive or guarantee against all hash collisions. Algorithms and serialization field ordering are part of generator version `0.1.0-graph`.

The generator C ABI is documented in `core/include/night/bridge.h`. Outputs belong to the module and expire on the next generation call. JS copies the UTF-8 manifest immediately and reacquires heap views after calls that may grow memory. The independent vehicle ABI uses fixed float32 input/snapshot buffers, no JSON per tick, and a native fixed `1/60 s` timestep. See [simulation contract](docs/vehicle-contract.md).

## RUN deployment status

The bundle uses relative URLs and same-origin assets, requires no SharedArrayBuffer/threads, and does not call browser storage or pointer lock. A nested hosting path is covered by browser tests. RUN's documentation describes these browser restrictions but does **not** independently prove that this particular Emscripten build will load under the production sandbox.

RUN CLI/account setup, SDK adapter, host safe-area/lifecycle behavior, and a private hosted WASM compatibility probe are pending. `deploy:prepare` is a local check; it does not create a RUN project, spend credits, publish, or enter the jam. Verify WASM compilation/CSP, correct asset MIME, actual SDK initialization, pause/resume and host UI before claiming RUN compatibility or investing in full gameplay.

## Continuation

Start with `docs/status.md`, the decision log, and the roadmap. Playtest the authored loop on keyboard and a real controller, then add sampled procedural roads with shared visible/collision geometry. Finish the private hosted compatibility probe when account access is available.


# Night Drive: Monster Mash — Jam Build Contract

**Jam window:** October 8–November 2, 2026  
**Execution window for this project:** October 14–November 2, 2026  
**Target:** a public RUN.world game that delivers a satisfying 10–15 minute night drive through a reproducible seeded world.  
**Working title:** *Night Drive: The Moonlit Run* (replace before public launch if a stronger title emerges).

This document is the implementation contract for the jam. It deliberately narrows the full *Night Drive* design without discarding its identity. If a proposed feature conflicts with this document, the feature waits until after the jam unless it fixes a failed acceptance gate.

**Implementation update (October 14):** the [C++/WebAssembly project](../../jam/october-2026-monster-mash/README.md) passes the local foundation and Step 1 abstract-graph gates, and includes a playable Step 2 authored driving loop with C++ suspension/vehicle simulation and Three.js presentation. Ten automated laps and native/WASM replay pass; human first-lap/controller feel and sustained device-performance checks remain open. See [verification and open gates](../../jam/october-2026-monster-mash/docs/status.md). RUN-hosted WASM compatibility is not yet verified. Seeded graph driveability remains a Step 3 gate.

## 1. Product promise

Enter a seed, receive a coherent night region, prepare one car, and make a calm but increasingly uncanny drive to a destination before the road changes around you.

The jam version must prove three things:

1. A seed can produce a world that feels authored rather than random.
2. A simple physical car can be enjoyable for an entire session.
3. The Monster Mash theme can inhabit *Night Drive* without turning it into a generic combat or chase game.

## 2. Scope ceiling

The build contains:

- one driveable car;
- one seeded region per run;
- one connected primary route, two or three branches, and one loop or reconnect;
- one start site, one service stop, two landmarks, one destination, and a small number of optional roadside encounters;
- three terrain/road moods assembled from a small reusable kit;
- a fixed-timestep 3D physics simulation;
- one preparation choice and one recoverable vehicle failure state;
- one escalating monster system tied to the generated route;
- a result screen with seed, travel time, discoveries, car condition, and an invitation to replay or share the seed.

The build does **not** contain multiple cars, an inventory economy, construction, on-foot exploration, traffic simulation, a three-country world, multiplayer, combat, vehicle customization trees, procedural mesh generation for every asset, or the full Night Line story.

## 3. Technical contract

### Runtime stack

- C++20 simulation core compiled to WebAssembly with Emscripten.
- CMake as the single source of truth for native tests and WebAssembly builds.
- RUN.world-compatible Vite shell with strict TypeScript kept intentionally thin.
- Three.js for browser presentation. React is optional; the simulation must not depend on React state or lifecycle.
- Project-owned fixed-step vehicle solver in C++; do not add a general-purpose physics dependency unless the Step 2 gate proves the bounded solver insufficient.
- RUN SDK only where it adds clear player value: identity, saved best result, leaderboard, or published deployment.
- Build output goes to `dist/` and all deployed asset paths are relative.

Pin dependency versions after the first green build. Do not upgrade dependencies during the final five days unless the current version blocks release.

### C++ / browser boundary

The project is C++-first, but RUN is a browser runtime. The build therefore produces a WebAssembly module plus a small JavaScript loader. Native C++ is not deployed directly to RUN.

**C++ owns:**

- seed normalization input after UTF-8 text is passed across the boundary;
- hashing, named PRNG streams, generation, validation, and manifest IDs;
- authoritative game state and state-machine transitions;
- fixed-step vehicle physics, collision queries, recovery, and car condition;
- encounter scheduling and monster simulation state;
- deterministic tests, seed-corpus tests, and simulation regression tests.

**TypeScript/browser owns:**

- page boot, RUN SDK calls, storage, sharing, and deployment integration;
- keyboard/controller sampling before values are copied into a plain input struct;
- Three.js scene creation, asset loading, instancing, rendering, camera, particles, and UI;
- Web Audio playback and mixing from read-only simulation parameters;
- safe-area and host lifecycle handling.

The boundary uses flat, versioned data—not callbacks per entity. TypeScript sends one `InputFrame` per simulation update and receives one packed `RenderSnapshot` containing transforms and events. Avoid per-frame JSON parsing; use typed-array views over WebAssembly memory for hot data. JSON is allowed for debug manifest dumps and save migration tools.

The C++ core must also compile and run natively on macOS for fast tests. WebAssembly is a target, not the only environment in which the logic can execute.

### Deterministic world generation

The world seed owns **world facts**, not frame timing.

Given the same normalized seed and generator version, the game must reproduce:

- route graph and node IDs;
- road control points and widths;
- terrain bands and biome assignments;
- start, destination, service stop, landmark, prop-cluster, and encounter placement;
- monster archetypes, escalation schedule, and initial states;
- weather preset, sky palette, and non-interactive ambient variation;
- item and repair pickup locations, if pickups survive scope review.

The generator must use a project-owned seeded PRNG. `Math.random()` is forbidden in generation code. Random draws must be namespaced or derived from stable IDs so adding one decorative draw cannot reshuffle the whole world.

Example streams:

```text
world/<seed>/topology
world/<seed>/roads
world/<seed>/landmarks
world/<seed>/encounters
world/<seed>/decoration/<chunk-id>
```

World generation must create a serializable `WorldManifest` before rendering. Rendering code may consume the manifest but may not decide world facts.

### Physics

- The C++ simulation core is the authoritative owner of car position, orientation, linear/angular velocity, contacts, and collision response.
- Physics uses a fixed `1/60 s` timestep. Variable-timestep physics is forbidden.
- Player input is sampled for each physics tick; visual transforms interpolate between completed ticks.
- The car is a single six-degree-of-freedom rigid chassis with four raycast suspension points. Visual wheels follow suspension results; they are not four independent rigid bodies.
- The physical model includes mass, center of mass, engine force, braking force, steering angle, suspension rest length, spring stiffness, damping, lateral grip, longitudinal grip, rolling resistance, and aerodynamic drag.
- The engine model is a small torque curve with RPM, idle control, forward gears, final drive, and automatic shifting. It is not a combustion simulation.
- Surface definitions affect grip, rolling resistance, vibration, particles, and audio using the same surface ID.
- Static collision is deliberately bounded: sampled road/terrain surfaces, guardrail/barrier primitives, and authored encounter colliders. Do not build a generic mesh-physics engine during the jam.
- Broad-phase queries use route/chunk spatial buckets; the car never tests every world collider.
- Simulation math uses `float` in hot state, explicit units (metres, seconds, kilograms, radians), finite-value assertions in debug builds, and no heap allocation inside the fixed tick.
- Normal play always has a recovery action. A rollover, missed corner, or stuck chassis cannot end the run permanently.
- Physics parameters live in typed data, not scattered magic numbers.

Initial handling target: stable and readable at keyboard input, richer with analog controller input, capable of mild weight transfer and recoverable oversteer, and forgiving enough that a first-time player reaches the destination.

### Performance

- Primary target: smooth play in a current desktop browser at 1080p.
- Minimum acceptance target: sustained 30 fps on a representative lower-power device and 60 fps on this M4 Pro under the benchmark seed.
- No visible generation hitch longer than 100 ms during ordinary driving after initial load.
- Reuse geometry and materials; instance repeated foliage, rocks, reflectors, and lamps.
- Limit active dynamic rigid bodies to the car and a very small number of encounter objects.
- Lighting budget: moon/ambient light, headlights, and only a few important local lights. Decorative emissive materials should carry most distant lighting.
- Every milestone is tested in a production build, not only the development server.

## 4. World design rules

### Region topology

Each valid manifest must satisfy all of these invariants:

1. The destination is reachable from the start.
2. The main route distance is within the target session length.
3. At least one meaningful route choice occurs before the midpoint.
4. At least one branch reconnects or provides a worthwhile landmark; no dead end exists only to waste time.
5. The service stop is reachable before the first mandatory escalation.
6. The final approach has a distinct silhouette and cannot be mistaken for an ordinary road segment.
7. Road curvature and grade stay within car-handling limits.
8. Spawn and landmark exclusion radii prevent overlaps.
9. Every encounter has enough road visibility and recovery space.
10. A validator rejects invalid manifests and retries with a derived attempt seed, up to a fixed cap.

### Generation order

Generation always runs in this order:

1. Normalize player seed and attach `generatorVersion`.
2. Select region palette and weather.
3. Create abstract route graph.
4. Assign start, destination, service stop, branches, and landmarks.
5. Embed graph into world coordinates.
6. Smooth and sample road splines.
7. Validate curvature, grade, clearance, reachability, and route length.
8. Create terrain envelope around roads.
9. Place structural props and encounter anchors.
10. Place decoration from per-chunk derived seeds.
11. Serialize manifest and manifest hash.
12. Render only after validation succeeds.

### Seed UX

- The title screen accepts a text seed and offers a clearly visible random-seed button.
- Seeds normalize consistently: trim whitespace, preserve a display string, and hash to the internal integer state.
- The current seed remains visible in pause/results screens.
- Restarting the same seed is one action.
- The result screen provides copyable seed text.
- At least five curated showcase seeds ship as fallback choices, but they use the same generator as user seeds.

## 5. Monster Mash design rules

The theme is expressed through the road system, not pasted on as decoration.

The recommended mechanic is **The Procession**: nocturnal road creatures and strange vehicle-like beings emerge from seed-defined encounter anchors. Some are solitary silhouettes; later ones gather into a moving procession whose behavior changes the safest route.

Rules:

- Monsters create curiosity, route-reading, and atmosphere before they create danger.
- The first sighting cannot damage the player.
- Every hostile behavior is telegraphed through silhouette, eye/light pattern, sound, road markings, or radio warning.
- Monsters do not require weapons or combat.
- The player's verbs remain drive, slow down, stop, observe, detour, use headlights, and recover.
- At least two monster archetypes interact or combine during the final third, satisfying the “mash” idea mechanically.
- Encounters are generated from stable anchors with authored rule sets; do not generate arbitrary behavior trees.
- Collision consequences are loss of time, temporary handling disturbance, or repairable condition—not instant failure.
- Quiet road time must occupy at least half of a normal run.
- The ending restores stillness. The emotional landing is wonder and relief, not victory over a boss.

Initial archetype budget:

1. **Watcher:** stays off-road and turns its lights/eyes toward the car; teaches visual language.
2. **Crossing herd:** occupies or crosses a road on a predictable rhythm; asks the player to slow, stop, or detour.
3. **Mimic vehicle:** resembles distant tail lights or an oncoming vehicle, then reveals a nonhuman movement rule.
4. **Procession form:** a late combination of earlier archetypes that moves along part of the road graph and changes the final route decision.

Cut to three archetypes before weakening their silhouettes, audio, and rules.

## 6. Player-experience rules

- The player is driving within 20 seconds of starting a seed after assets are cached.
- Keyboard and controller both work; neither is treated as an afterthought.
- Steering, throttle, and braking have separate response curves.
- The camera never adds uncontrolled shake. Camera lag and field-of-view changes are clamped and configurable.
- Important information is readable without opening a menu.
- The HUD is minimal: route cue, speed/gear when useful, car-condition warning, and current objective.
- Audio communicates RPM/load, surface, grip loss, weather, encounter proximity, and damage.
- Headlights materially affect visibility and monster response.
- The first minute is calm and teaches driving without text walls.
- The run contains a beginning, escalation, choice, climax, and quiet arrival.
- Failure returns the player to the most recent safe road anchor with a small time/condition penalty.
- No procedural result is allowed to be unfair merely because it is rare.

## 7. Step-by-step roadmap

### Step 0 — Freeze the contract and establish evidence (October 14)

**Build**

- Put the jam game under `jam/october-2026-monster-mash/`.
- Add a decision log, risk register, asset/provenance ledger, and daily playtest notes.
- Record exact Node, RUN CLI, SDK, Emscripten, CMake, compiler, template, and dependency versions.
- Create the C++/WebAssembly/browser boundary and prove one native and one browser call through it.
- Define the benchmark seed list and the target browsers/devices.

**Design rules**

- No feature enters the backlog without supporting the seed promise, driving feel, Monster Mash mechanic, or ship readiness.
- Every third-party asset records source, license, author, and modifications before entering the build.
- The full-game documents are references, not the jam backlog.

**Exit gate**

- Clean production build and a blank RUN-compatible scene that loads the WebAssembly module locally.
- Native C++ tests and WebAssembly smoke test both pass.
- One command each for dev, test, build, and deploy preparation.

### Step 1 — Prove seed determinism before making scenery (October 14–15)

**Build**

- Implement seed normalization, stable hashing, named PRNG streams, core manifest types, generator versioning, and manifest serialization in C++.
- Generate an abstract route graph and fixed landmark roles.
- Add native automated tests: same seed equals same manifest; different seeds produce meaningful differences; stream isolation prevents decorative changes from altering topology.
- Add a browser developer manifest viewer or debug overlay fed by the C++ debug export.

**Design rules**

- Generator output contains plain C++ data only—no Three.js objects, DOM state, or browser handles.
- IDs derive from stable semantic paths, not array indices created incidentally.
- Each generator stage consumes one named stream and produces an inspectable result.
- A seed may be retried only with `attempt/N`; silent nondeterministic retries are forbidden.

**Exit gate**

- 100 generated seeds pass reachability and schema validation.
- Reloading any benchmark seed produces the same manifest hash.

### Step 2 — Prove the car on one authored test road (October 15–17)

**Build**

- Implement the bounded C++ physics world, fixed timestep, chassis integrator, quaternion orientation, raycast suspension, tire-force model, engine/gear model, static surface/barrier queries, input bridge, chase camera snapshot, and recovery action.
- Create one authored test loop with asphalt, gravel, grade, corner, bump, and guardrail.
- Add native simulation regression tests and a browser debug panel for speed, RPM, gear, slip, wheel contact, suspension travel, kinetic energy, fixed-tick cost, and render-frame cost.

**Design rules**

- Do not connect procedural terrain until the car passes the authored-road gate.
- Browser render transforms never overwrite authoritative C++ state.
- Driving assists modify inputs or forces transparently; they do not teleport or rotate the car secretly.
- Tune in this order: stability, steering readability, braking, suspension, grip transition, engine response, then camera feel.
- If the solver cannot pass this gate by the end of October 17, freeze feature work and choose one fallback: simplify collision further or integrate a proven WebAssembly physics library behind the same C++ interface. Do not rewrite the renderer.

**Exit gate**

- Ten consecutive laps without spontaneous flips, tunneling, or unrecoverable stalls.
- Keyboard player can finish a lap on the first attempt.
- Controller input feels continuous with no dead-zone drift.
- Physics remains stable during frame-rate throttling.
- Native and WebAssembly builds remain within agreed numerical tolerances on the recorded input replay.

### Step 3 — Turn manifests into driveable worlds (October 17–20)

**Build**

- Embed and smooth roads, build road mesh/colliders, generate terrain envelope, place landmarks and service stop, and create spawn/destination logic.
- Add chunk activation around the car with deterministic per-chunk decoration.
- Add map/route guidance based on the manifest graph.

**Design rules**

- Collision road and visible road derive from the same sampled centerline.
- Road collision remains continuous across chunk boundaries.
- Terrain exists to frame the road; it does not need continent-scale simulation.
- Chunk load order cannot affect generated content or IDs.
- Distant decoration is visual only and never participates in expensive physics.

**Exit gate**

- Twenty benchmark seeds are driveable start-to-destination.
- No missing road collision, impossible corner, landmark overlap, or visible chunk seam.
- A U-turn and backtrack do not duplicate or remove world objects.

### Step 4 — Establish the complete calm-driving loop (October 20–22)

**Build**

- Title/seed screen, loading state, start sequence, destination, result screen, restart, pause, settings, and save of best result.
- Add sky, fog, headlights, reflectors, service-stop interaction, surface audio, engine audio, and one weather preset.
- Add the preparation choice: for example tires versus brighter lights, with both paths viable.

**Design rules**

- The game must already be enjoyable with monsters disabled.
- A setting is exposed only if players understand its effect.
- Preparation choices trade advantages; one option cannot dominate all seeds.
- No story text longer than can be read safely while stopped.

**Exit gate**

- A new player can start, drive, make the preparation choice, reach the destination, understand results, and replay without explanation.
- Three testers voluntarily complete a second seed or replay the first.

### Step 5 — Add Monster Mash as a systemic layer (October 22–25)

**Build**

- Implement Watcher, crossing herd, and Mimic/Procession behaviors from manifest encounter anchors.
- Add escalation director driven by route progress and discovered anchors, not wall-clock time alone.
- Add encounter audio language, radio cues, headlight reactions, and recoverable collision effects.

**Design rules**

- Each monster gets one unmistakable silhouette, one sound family, and one behavior rule before variants.
- Encounter logic reads road graph and car state; it does not assume a particular hand-authored coordinate.
- The same seed produces the same encounter plan. Player timing may change the precise physical interaction.
- No encounter may block every valid path indefinitely.
- Do not add combat, health bars, loot rarity, or chase AI unrelated to route decisions.

**Exit gate**

- Players can explain how to read and respond to every encountered archetype after one run.
- The final procession combines earlier rules rather than introducing an unexplained boss mechanic.
- At least half the run remains calm.

### Step 6 — Make five seeds feel intentionally different (October 25–27)

**Build**

- Curate five showcase seeds after generator rules are stable.
- Tune palette, topology, landmark combination, weather, and encounter schedule to produce distinct journeys without special-case maps.
- Add seed-sharing UX and optional daily/featured seed if RUN integration is low-risk.

**Design rules**

- Showcase seeds may be selected, never hand-edited after generation.
- Variety comes first from route decisions and landmark composition, not random prop density.
- Every seed keeps the same control language and fairness rules.
- Reject boring seeds in validation through measurable properties, not a hidden curated whitelist.

**Exit gate**

- Testers can distinguish the five seeds by route or event, not only color.
- No showcase seed is clearly easier, richer, or more complete than arbitrary valid seeds.

### Step 7 — UX, accessibility, and device pass (October 27–29)

**Build**

- Complete rebinding if feasible, steering sensitivity, camera motion reduction, master/music/effects levels, subtitles for radio, contrast-safe route cues, and graphics presets.
- Test mouse/keyboard, controller, browser focus loss, resizing, muted autoplay restrictions, and pause/resume.
- Profile production builds on desktop and at least one lower-power or mobile-class browser.

**Design rules**

- Accessibility fixes outrank new content.
- Reduced camera motion cannot reduce control information.
- Low graphics mode preserves road readability, monster silhouettes, headlights, and audio cues.
- Touch controls are added only if they can pass the complete run; a broken mobile promise is worse than an explicit desktop-first jam entry.

**Exit gate**

- Complete controller-only run.
- Complete keyboard-only run.
- No progression blocker after focus loss, resize, pause, or graphics change.
- Benchmark seed meets agreed frame-time and memory gates.

### Step 8 — Content lock and public candidate (October 29–31)

**Build**

- Freeze features and generator schema.
- Fix only correctness, clarity, fairness, performance, audio, and release issues.
- Deploy private candidate to RUN and conduct blind playtests.
- Prepare title, description, screenshots, short gameplay capture, credits, and asset disclosures.

**Design rules**

- No new archetype, biome, route feature, or physics parameter category after lock.
- A bug fix may not silently alter every existing seed; if generator output changes, increment `generatorVersion` and retest the corpus.
- First-run clarity and completion rate outrank visual additions.

**Exit gate**

- Five blind players: at least four reach the ending without developer intervention.
- No crash, lost input, impassable seed, infinite loading, missing collider, or unrecoverable car state.
- Credits and provenance ledger are complete.

### Step 9 — Publish, submit, and hold a recovery buffer (November 1–2 PT)

**Build**

- Publish the approved build publicly on RUN.
- Enter it through Creator Hub; publishing alone is not submission.
- Verify the public build from a clean browser session and another device/network.
- Keep a known-good build artifact and tagged source revision.

**Design rules**

- Do not make deadline-day architectural changes.
- Do not promote a build that has not completed the benchmark seed from start to results.
- Submission verification is part of done.

**Exit gate**

- Public URL works while signed out where supported.
- Jam entry appears in Creator Hub/leaderboard state as expected.
- Source tag, build ID, generator version, and public version are recorded together.

## 8. Daily operating rules

Every implementation session follows this loop:

1. Restate the milestone and one measurable outcome.
2. Inspect current code, tests, and working-tree changes before editing.
3. Implement the smallest vertical change that can be played.
4. Add or update deterministic tests for generator work.
5. Run typecheck, unit tests, production build, and the relevant playtest route.
6. Record the result and any parameter changes.
7. Commit only a coherent, runnable state.

Do not spend more than half a day fixing a nonessential visual or tooling issue. Replace, simplify, or cut it and record the decision.

## 9. Quality gates that cannot be waived

- Same seed and generator version reproduce the same world manifest.
- Every accepted seed is reachable and finishable.
- Physics uses a fixed timestep and stays stable under render slowdown.
- The player can recover from ordinary mistakes.
- The game is pleasurable before the monster layer begins.
- Monster rules are readable and do not require combat.
- Keyboard and controller can each complete the game.
- Production build passes; development-server success is insufficient.
- Public deployment is tested from outside the development session.
- All shipped assets and dependencies have known provenance.

## 10. Cut order if schedule slips

Cut in this order:

1. Daily/featured seed backend.
2. Optional pickups and secondary repair items.
3. One weather variant.
4. Fourth monster archetype.
5. Decorative landmark interiors or interactions.
6. Advanced transmission/temperature/wear simulation.
7. One branch pattern, while preserving a meaningful route choice.

Never cut seed determinism, manifest validation, stable driving, recovery, the complete beginning-to-ending loop, theme readability, or deployment verification.

## 11. First implementation prompt

After switching to Astra, begin with this instruction:

> Implement Step 0 and Step 1 of `docs/jam/october-2026-monster-mash-roadmap.md`. Use a C++20 core compiled natively and to WebAssembly with CMake and Emscripten, plus the thinnest practical strict-TypeScript/Vite RUN shell. Do not implement vehicle physics, production rendering, or monsters yet. Establish the versioned C++/browser boundary, deterministic seed utilities, typed `WorldManifest`, named random streams, route-graph generator, validator, stable manifest hashing, native tests, WebAssembly smoke tests, and browser debug output. Stop only when the Step 1 exit gate passes, then report changed files, commands, test evidence, bundle size, and remaining risks.


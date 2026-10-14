# Vehicle physics rework — plan

*October 14, 2026. Status: proposed, not started.*

Playtest verdict: the car "glides". You can't feel the road, and the engine sound doesn't react to what the tires are doing, which makes the sound feel worse, not better. This plan explains why, then rebuilds the car in stages. Every stage is testable on its own and keeps the C++-owns-simulation contract.

## 1. Why it feels like gliding (diagnosis of `core/src/vehicle.cpp`)

| # | Current behaviour | Effect you feel |
|---|---|---|
| 1 | **Wheels have no spin state.** Engine force is pushed straight into the chassis (`engine/4`), and brakes cancel velocity directly. There is no wheel angular velocity, so no slip ratio, no wheelspin and no lock-up. | Throttle and brake feel like a magic hand pushing the car. No traction limit to play with, no squat, no chirp. |
| 2 | **RPM is computed from car speed** (`rpm = speed / r * ratio * final`). There is no engine inertia, clutch or drivetrain. | The engine can never flare on wheelspin, bog on a hill, bounce off the limiter, blip on a downshift or brake the car on overrun. engine-sim is fed a number that ignores the road; this is the "sound makes it worse" problem. |
| 3 | **Lateral grip is linear in sideways *velocity*** (`fy = -lateral * 1900`), not in slip *angle*. | Very grippy when slow and vague when fast. Cornering force barely rises with speed, so the car drifts wide without ever breaking away. There is no peak and drop-off to feel at the limit. |
| 4 | **A big artificial angular damper** (`moment += omega * -350`) plus speed-scaled steering (`/(1 + 0.065 v)`). | Yaw is smothered. The car "rotates on rails" with no weight transfer response and no oversteer/understeer character. |
| 5 | **The road is mathematically smooth.** A cosine hill and one 14 cm bump; surface type only scales grip. | Nothing comes up through the suspension. No texture, joints, crown, ruts, or difference between asphalt and gravel except grip. |
| 6 | **The camera ignores the chassis.** It follows horizontal heading with exponential lag and removes pitch, roll and vibration on purpose. | Even when the body does move, you don't see it. Speed isn't conveyed (no FOV, shake or g-load). |
| 7 | **No tire or road audio.** The only sound is the engine, whose input is #2. | Sliding, gravel and speed are silent. |
| 8 | **One generic car.** 1,200 kg, 50/50 split, 5-speed box shifting at 4,900 rpm, a made-up torque curve. | The Ferrari never sees 9,000 rpm; the engine-sim F136 and the physics disagree about what engine is in the car. |

Points 1, 2 and 3 are the core of "it glides". Points 5, 6 and 7 are "I can't feel the road".

## 2. Target feel

- Throttle squats the car. Too much throttle in 1st/2nd spins the rear tires, the engine flares, and the tail steps out. Lifting mid-corner tucks the nose in.
- Braking pitches the nose down, and locking the wheels lengthens the stop and kills steering.
- Grip rises with slip angle up to a peak, then falls off. You feel the limit through yaw, sound and camera before you exceed it.
- Every surface has a signature through suspension, camera and audio: asphalt hum, painted-line ticks, joint thumps, gravel rumble and crunch, grass wallow.
- The engine sound is the drivetrain's real state: clutch slip at launch, limiter bounce, downshift blips, overrun on lift, bogging uphill in a tall gear.
- Keyboard players still finish a lap on their first try (assists are configurable, never secret pose correction).

## 3. Architecture changes

All simulation stays in C++ (deterministic, native and WASM). The browser only consumes snapshots.

```text
Input ─▶ Driver aids (steer filter, optional TC/ABS) ─▶ Drivetrain ─▶ Wheels (ω) ─▶ Tires (slip→force) ─▶ Chassis 6-DOF
                                                         ▲                                │
                     Road surface query (height, normal, surface, micro-texture) ◀────────┘
Snapshot ─▶ Renderer (wheels spin from ω, body roll/pitch) ─▶ Camera rig (springs, shake, FOV)
         ─▶ engine-sim (RPM + crank torque/load from drivetrain) + tire/road/wind audio layers ─▶ Gamepad rumble
```

### 3.1 Physics substeps
The tire model needs a small timestep. Keep the public **60 Hz tick** (input/snapshot ABI unchanged) but integrate **4 deterministic substeps at 240 Hz** inside `Vehicle::tick`, with no allocation.

### 3.2 Drivetrain (new `drivetrain.hpp/.cpp`)
- **Engine:** angular velocity state with flywheel inertia. Torque comes from a **2-D map (RPM × throttle) generated offline from engine-sim itself** by a new `tools/engine_dyno.cpp`. It sweeps the LS and F136 at 0–100% throttle on engine-sim's dynamometer and writes `engine_maps.inc`. The car then pulls exactly like the engine you hear. Includes friction/pumping losses (engine braking), idle control and a rev limiter cut.
- **Clutch:** a torque-limited friction coupling. It slips at launch and during shifts and locks when speeds match. An automatic launch/anti-stall controller handles keyboard players.
- **Gearbox:** per-car ratios, shift time with torque cut, and a downshift rev-match blip.
  - Ferrari 458: 7-speed DCT 3.08/2.19/1.63/1.29/1.03/0.84/0.69, final drive 4.44, ~150 ms shifts.
  - Camaro SS: 6-speed 2.66/1.78/1.30/1.00/0.74/0.50, final drive 3.73.
- **Shifting:** automatic shifts near peak power (F136 ~8,700 rpm). Optional manual paddles (`Q`/`E`, LB/RB).
- **Differential:** rear clutch-type limited slip (preload + ramp), so power-on oversteer is controllable.
- **Brakes:** torque on each wheel with front/rear bias, plus a handbrake on the rear wheels. Optional ABS (on by default for keyboard).

### 3.3 Wheels and tires
- Each wheel gets spin inertia and angular velocity. Drive/brake torque in, tire force times radius out. Integrated per substep.
- **Tire model:** simplified Pacejka "magic formula" for longitudinal force (slip ratio) and lateral force (slip angle), with:
  - load sensitivity (μ falls slightly as load rises, so weight transfer matters);
  - combined slip via friction ellipse weighting;
  - **relaxation length**, so the tire builds force over distance (stable at low speed, no jitter);
  - low-speed blending so the parked car doesn't creep or vibrate.
- Surface table (μ, stiffness, rolling resistance, roughness amplitude/wavelength, audio ID): asphalt, worn asphalt, painted line, gravel, grass/shoulder, wet (future weather).

### 3.4 Chassis and suspension
- Per-car mass, centre-of-mass height, weight split and inertia derived from dimensions (458: 1,485 kg, 42/58).
- Separate front/rear spring rates, dampers (bump/rebound), **anti-roll bars** and bump stops.
- **Remove the −350 angular damper.** Keep only small physical bushing losses.
- Aero drag plus a little downforce at speed.
- Steering: rack ratio with a speed-dependent *maximum* lock (keyboard only), an analog pass-through for controllers, and caster/self-aligning torque computed from the tire model. Exposed later for force feedback/rumble.

### 3.5 The road you can feel
- A `RoadQuery` interface gives the height, normal, surface ID and micro-height at (x, z). The authored loop implements it now. The generated-world roads (Step 3) implement the same interface later, so this work carries over to your new world generation.
- Deterministic road texture that the suspension actually feels:
  - low-amplitude noise for asphalt (2–4 mm);
  - expansion joints every ~25 m (6 mm step);
  - a slight crown;
  - painted edge lines (grip change, tick);
  - optional rumble strips on bends;
  - gravel with larger random bumps (2–3 cm) and lower, noisier grip.
- Wheels sample this per substep, with each tire's contact patch averaging a few samples so it isn't a needle.

### 3.6 Feedback layers (browser, driven only by snapshot data)
New snapshot slots (no ABI break: reserved slots 44–63 are free; bump `nr_drive_version` to 2):
- per-wheel angular speed, slip ratio and slip angle;
- engine torque and clutch slip;
- chassis local acceleration (longitudinal/lateral/vertical);
- per-wheel surface ID and road micro-height.

The browser uses them as follows:
1. **Engine sound:** engine-sim's dyno target becomes the *drivetrain engine RPM*, not wheel-derived RPM. Its throttle becomes the drivetrain's effective throttle (including the limiter cut and the downshift blip), so overrun, flare and bog are real.
2. **Tire audio:** WebAudio layers modulated by slip and speed: rolling noise (filtered noise, gain ∝ speed, colour by surface), squeal (band-passed tone ∝ slip energy), gravel crunch (granular noise ∝ speed on gravel), joint thumps (impulses from vertical wheel velocity spikes), wind (∝ v²).
3. **Camera rig:** spring-damper chase camera that inherits a fraction of chassis pitch/roll, lags under g-load, has speed-based FOV (60°→72°) and adds high-frequency shake from wheel vertical velocity, scaled by surface. Plus a bonnet/cockpit camera toggle (`C`).
4. **Visuals:** wheels spin at their own ω (you see wheelspin and lock-up), suspension travel per wheel, tire smoke and gravel dust from slip.
5. **Gamepad rumble** (`vibrationActuator`) from road texture and slip.

## 4. Stages and acceptance

Each stage lands with native tests, WASM parity, a 60 s replay baseline update and an in-browser check.

| Stage | Work | Acceptance (automated unless noted) |
|---|---|---|
| **P0 Instruments** | Telemetry overlay graphs (RPM, slip per wheel, lateral g). Scripted manoeuvres: 0–100 km/h launch, 100–0 braking, 40 m skidpad, step-steer, lift-off in a corner. CSV output from native harness. | Baselines recorded for the current car so changes are measurable. |
| **P1 Engine maps** | `tools/engine_dyno` sweeps engine-sim LS/F136; generated maps checked in; native test compares map to engine-sim within 5% at 10 RPM points. | Map peak torque/power ≈ engine-sim's own dyno. |
| **P2 Drivetrain + wheels** | Engine/clutch/gearbox/diff/brakes, wheel ω, substeps. | Launch from rest without stalling (keyboard); 0–100 km/h for the 458 roughly 3.4–4 s with launch control on; limiter holds RPM ≤ redline+100; engine braking decelerates on lift; standstill is creep-free for 60 s. |
| **P3 Tire model** | Magic formula, load sensitivity, combined slip, relaxation. Remove the angular damper and steering hacks. | Skidpad 0.95–1.05 g on asphalt, ~0.6 g gravel; braking 100–0 in 34–38 m with ABS; step-steer settles without oscillation; lift-off in a corner produces measurable yaw increase; no spontaneous instability over 10 automated laps. |
| **P4 Chassis & suspension** | Per-axle springs/dampers, ARBs, bump stops, per-car mass/inertia/aero. | Body roll 2–4° at 0.9 g; pitch under braking visible; equilibrium & rollover-recovery tests still pass. |
| **P5 Road surface** | `RoadQuery`, micro-texture, joints, crown, lines, rumble strips, gravel bumps. | Suspension travel spectrum differs measurably per surface; no penetration; replay deterministic. |
| **P6 Feedback** | Snapshot v2, engine-sim coupling, tire/road/wind audio, camera rig, wheel/smoke visuals, rumble. | Browser tests: audio receives drivetrain RPM (flare during forced wheelspin test), camera FOV rises with speed; **human playtest: "can you feel the road?"** |
| **P7 Tuning & assists** | Per-car tuning, assist presets (Keyboard: ABS+TC+stability on; Controller: TC low; Purist: off). Update vehicle contract doc. | First-time keyboard player finishes a lap (human); 10-lap autopilot passes; 20/20 browser tests. |

Rough size: P0–P3 are the bulk (the drivetrain and tire model). P5–P6 are where the "feel" lands. I'd show you a playable build after P3 and again after P6.

## 5. Risks and decisions to confirm

- **Determinism:** substeps and new state change the golden 60 s replay. The native/WASM tolerance test stays; the baseline is regenerated intentionally.
- **Keyboard drivability:** a real tire model is harder on binary input. Assists are explicit and togglable, never a secret pose correction.
- **engine-sim is still for audio only.** Running it as the actual torque source in the physics thread would make the simulation non-deterministic and ~3× too slow for 240 Hz. The offline maps give the same torque curve without that cost. (Revisit later if you want a full "engine-sim drives the car" mode.)
- **Scope with your new world-generation plan:** the `RoadQuery` interface is the seam. Whatever the new generator produces only has to answer height/normal/surface, and all of this physics works on it.

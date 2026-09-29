# 03 — Vehicle physics, Engine Simulator, and audio

## The target sensation

Driving should feel weighty, mechanically understandable, and pleasant for long sessions. The player should hear and feel the engine work on a grade, see suspension settle over a poor surface, and sense grip change between asphalt and gravel. Realism is a tool for attachment; it is not a demand that every player become a mechanic.

## What Engine Simulator is

[Ange Yaghi's Engine Simulator](https://github.com/ange-yaghi/engine-sim) is a real-time combustion-engine simulation built to produce engine audio and response characteristics. Its README explicitly says it is **not a scientific engineering or tuning tool** and describes the code as demonstration software. Its repository is [MIT licensed](https://github.com/ange-yaghi/engine-sim/blob/master/LICENSE), subject to preserving the copyright/license notice. These facts support a focused prototype, not an assumption that the project is ready to become a game's full car simulation. Check licenses and provenance for dependencies, engine definitions, recordings, and art separately before shipping.

## Simulation layers

| Layer | Responsibility | Initial implementation |
| --- | --- | --- |
| Engine | RPM, throttle response, idle, torque, combustion sound | Engine Simulator adapter candidate; compare with lookup-curve fallback |
| Drivetrain | clutch/automatic coupling, ratios, differential, drive torque | Game-owned C++ model |
| Wheels/tires | normal force, longitudinal/lateral grip, slip, rolling resistance | Physics engine or game-owned wheel model after spike |
| Suspension | spring, damper, travel, anti-roll | Physics engine component; tune against reference tests |
| Chassis | rigid-body mass, center of gravity, inertia, collisions | Engine physics system |
| Environment | surface grip, slope, weather, temperature | World query interface |
| Wear/damage | thermal load, tire wear, impact damage, faults | Slow game-state model, not high-frequency simulation |
| Audio | engine source, intake/exhaust, road/tire, cabin, weather, radio | Audio mixer consumes read-only state |

The torque path is `throttle → engine torque → clutch/gear/differential → wheel torque → tire force → chassis`. Wheel speed and load feed back to the engine. Audio consumes engine state but never becomes the source of vehicle motion. Pick one authoritative RPM/torque owner; a visual tachometer, sound generator, and physics solver must not each invent their own RPM.

## Integration decision gate

Run a bounded two-week C++ spike:

1. Pin a specific Engine Simulator commit and build it on the target Windows toolchain.
2. Isolate only the engine response and sound code needed for one test engine behind `IEngineModel`. Document copied files and dependency notices.
3. Create a second `IEngineModel` using a measured torque curve, idle controller, and lightweight audio layers.
4. Drive the same greybox route with both models. Record RPM stability, latency after throttle/gear input, engine-audio quality, CPU/audio cost, integration effort, and crash behavior.
5. Keep the Engine Simulator path only if it improves the experience at an acceptable runtime cost and can run with stable data ownership. Otherwise use it offline to create reference sounds or tuning data, subject to licenses.

This is a decision gate, not a promise to fork the entire Engine Simulator application. The upstream README says the code may change frequently; pinning and isolating it reduces that risk. [Upstream README](https://github.com/ange-yaghi/engine-sim)

## Fixed-step ownership

Initial target: vehicle simulation at 60 Hz with rendering interpolation. Audio runs at its own callback cadence. If tire contact is unstable on seams, evaluate bounded substeps in the vehicle layer. Do not let low frame rate change fuel use, tire wear, or engine heat; those update using simulation time. Avoid dynamic allocation and file I/O in the audio callback.

At each vehicle step:

1. Read a timestamped input command (steer, throttle, brake, clutch/gear, ignition).
2. Query road surface and ambient conditions at each wheel.
3. Update engine and drivetrain; clamp physically invalid values.
4. Compute wheel/suspension contact and tire forces.
5. Integrate chassis with the physics engine.
6. Update slower wear/thermal state at a lower cadence.
7. Publish one immutable vehicle snapshot to cameras, UI, audio, and save systems.

The user can select Comfort, Standard, or Detailed assist presets. Assists affect inputs and recovery, not the underlying world truth: e.g., auto-clutch, steering stabilization, suggested gears, brake assist, and forgiving damage. Physics presets and saved vehicles need stable version IDs.

## Minimum credible physical model

- Correct mass, wheelbase, axle loads, center of gravity, and inertia for each car.
- Road gradient changes required engine torque and braking distance.
- Tire grip depends on surface, load, slip, wear, and broad weather state; avoid fake per-frame random slipping.
- Suspension has believable compression, extension, and damping; road seams do not launch the car.
- Braking and throttle transfer load; cargo mass and placement change handling in a readable way.
- Engine heat rises with load and poor cooling, but has clear warnings and a reasonable time to react.
- Fuel consumption depends on power demand and idle, within a tuned gameplay range.
- Damage and part wear are slower, legible systems layered over motion physics. The most common failures can be fixed with common supplies.

Do not model individual fluid dynamics, component metallurgy, or thousands of engine parts for the first release. Those costs have little relationship to the player's felt driving quality.

## Audio design

The engine sound should respond to RPM, load, throttle transients, gear shifts, and cabin/window state. Road noise responds to speed and surface. Rain, wipers, radio, and distant towns create the calm layer. The mixer receives smoothed parameter snapshots and produces audio independently of rendering; missing or late physics snapshots must hold or interpolate safely.

If the Engine Simulator synthesis path is used live, profile its CPU use with rain, traffic, radio, and multiple nearby cars. Remote cars can use simpler audio proxies. Provide an audio-quality option so sound synthesis does not monopolize a modest CPU.

## Verification scenes

- Start, idle, stall/restart, reverse, and three clean gear changes.
- 0–60 km/h, steady 60 km/h, and 60–0 km/h on level dry asphalt; compare tuned targets, not imagined realism.
- Same hill with empty and loaded trunk; predictable difference in acceleration and braking.
- Asphalt → gravel transition with readable sound/grip change.
- Kerb, pothole, junction seam, and streamed tile boundary at low and high speed.
- Thirty-minute steady drive with no audio underruns, unbounded heat drift, or memory growth.
- Recovery from a flat tire, overheated engine, and empty fuel tank without losing the save.

Only after the road feels good should additional engine types and detailed tuning be added. Physics success is judged by repeatable tests and player perception together.

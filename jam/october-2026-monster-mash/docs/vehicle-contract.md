# Vehicle prototype / simulation ABI 1

The C++ core owns car state and the authored 645.575 m stadium loop. Browser code samples input, requests fixed ticks and renders snapshots. Generator `0.1.0-graph` and its golden hashes are unchanged. The test road is not derived from the selected seed.

## Model and scope

- One 1,200 kg six-DOF rigid chassis, quaternion orientation and body-space diagonal inertia. Semi-implicit integration at exactly 60 Hz; gyroscopic term included.
- Four downward suspension rays against an analytic heightfield. Spring/damper load, tire-force friction circle, separate asphalt/gravel/shoulder grip and rolling resistance, aerodynamic drag, engine torque curve, five forward gears and explicit reverse.
- Keyboard steering is filtered and attenuated with speed. Tire forces, suspension and passive angular damping change the motion; normal driving never sets the pose directly.
- The authored track has 150 m straights, 55 m-radius turns, a 4 m hill, a 14 cm bump and a gravel stretch. Both guardrails are continuous analytic boundaries 9 m from the centerline. Body projection bounds rail contact; chassis corners prevent ground penetration.
- C++ exports sampled road centers, elevations, normals, surface and width. Rendering builds road ribbons and rails from those samples. No separate browser road equations.
- Only reset/recovery place the car directly. Recovery uses the nearest road centerline, clears motion, increments its counter and never advances lap credit. Forward cumulative progress awards laps; crossing the start backwards does not.
- No allocation in `Vehicle::tick`. The analytic road query is constant-time and does not scan scenery. Terrain props are visual, beyond the rails; there are no generic mesh contacts, dynamic objects, suspension wheel bodies, damage, audio or saved results.

This solver is intentionally specialized. Before Step 3, replace the analytic road queries with a shared sampled-road spatial query and validate seams/junctions. Revisit a proven C++ physics library if the required collision scope outgrows the bounded model. Do not imply this loop validates arbitrary terrain.

## Boundary

`nr_drive_version()` returns 1. The module owns all buffers; never free them. Reacquire views after calls that can grow memory. The browser copies completed snapshots into two preallocated arrays for interpolation.

- `nr_drive_input()`: eight float32 slots. Version, throttle [0,1], brake [0,1], steering [-1 left,+1 right], reverse flag, handbrake flag, two reserved zeros. Inputs are sanitized and clamped by C++.
- `nr_drive_step()`: exactly one tick; returns 1 without advancing for a version mismatch, otherwise 0.
- `nr_drive_snapshot()`: 64 float32 slots, layout documented in `core/include/night/vehicle.hpp`. Position, orientation, velocities, RPM/gear, surface, contacts, progress, lap times, counters, energy, four suspension travels/loads/slips, upright measure and throttle.
- `nr_drive_reset()`: clear session and start at the stripe. `nr_drive_recover()`: return to safe centerline at current progress.
- `nr_track_data()` / `nr_track_count()`: 649 samples of eight float32 slots: x,y,z,outward-x,outward-z,distance,surface,half-width. Last sample closes the loop.

Coordinates: metres, seconds, kg, radians; Y up and local +Z forward. Driver-right is local -X. Quaternions are xyzw. Surface IDs: 0 asphalt, 1 gravel, 2 shoulder. No cross-platform bitwise physics promise: the 60-second replay checks 2 cm position tolerance, .001 orientation-component tolerance and .1%/.02 bounds on other floats. Same-build identical-input replay must match exactly.

## Browser clock / lifecycle

Rendering interpolates the last two completed snapshots. The accumulator runs up to six fixed ticks per render frame and explicitly drops excess elapsed time beyond .1 s. A stall therefore slows game time rather than creating a variable timestep or a catch-up spiral. Telemetry reports dropped time. Pause/visibility/focus changes clear input and the accumulator; resuming requires an explicit action. Controller input must be neutral before arming after resume. Context loss stops the frame loop with a reload message.

The camera follows horizontal heading with bounded exponential lag; chassis pitch/roll do not tilt the view. Pixel ratio caps at 1.75, trees/rails/reflectors are instanced, geometry is constructed once, and shadows use a simple contact disk. Telemetry measures CPU tick/render time and frame intervals, not GPU timer-query cost. The current loop is preloaded; world streaming and device performance acceptance are later work.

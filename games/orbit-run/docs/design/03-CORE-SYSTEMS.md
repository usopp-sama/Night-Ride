# 03 — Core systems

Everything the player's hands touch between chapters: state, time, scale, flight, cruise, fuel, depots, routing, orbit, the lander, docking, and the vehicle controllers. Values are start values with a tuning range in brackets where one applies. "Prototype" means the current browser build; "native" means the production build.

Where the native build changes a prototype rule, the line is marked **Δ** and gives the reason.

## 1. Expedition state machine

One authoritative state. Exactly one active vehicle, one camera rig, one input context and one HUD layout per state. Only the coordinator (file 09 §3) changes state.

| State | Active vehicle | Input context | Time rate | Entered from | Leaves to |
| --- | --- | --- | ---: | --- | --- |
| `title` | — | `menu` | 0 | launch, quit to title | `solar_flight`, `orbit_ready`, `surface` (by save) |
| `solar_flight` | Kestrel | `ship` | 60× | depart orbit, undock depot, cruise end | `cruise`, `depot_docked`, `orbit_capture`, `cabin` |
| `cruise` | Kestrel (course hold) | `ship_cruise` | 8,640× | `solar_flight` | `solar_flight`, `cabin` |
| `cabin` | — (seated) | `cabin` | inherits parent | `cruise`, `solar_flight` (throttle 0), `orbit_ready`, `depot_docked` | parent state |
| `depot_docked` | Kestrel (clamped) | `depot` | 60× | `solar_flight` | `solar_flight`, `cabin` |
| `orbit_capture` | Kestrel (authored) | `cinematic` | 60× | `solar_flight` | `orbit_ready` |
| `orbit_ready` | Kestrel (parked) | `orbit` | 60× | `orbit_capture`, `docked_latch` | `descent`, `solar_flight`, `cabin` |
| `descent` | Wren (authored) | `cinematic` | 60× | `orbit_ready` | `surface` |
| `surface` | local vehicle | per controller | 60× | `descent` | `launch` |
| `launch` | Wren (authored) | `cinematic` | 60× | `surface` | `docking` |
| `docking` | Wren | `lander` | 60× | `launch` | `docked_latch` |
| `docked_latch` | Wren (authored, 6 s) | `cinematic` | 60× | `docking` | `orbit_ready` |
| `paused` | unchanged | `menu` | 0 | any except `title` | previous |

Rules:

- A transition request while another is in progress is discarded, not queued.
- `paused` is an overlay; it never changes the underlying state.
- Opening the system map does **not** pause. **Δ** (prototype froze time.) The map is a live chart; freezing it would make cruise mail and planet motion incoherent. The pause menu is the only thing that stops the clock.
- Each state has an allowed-action list in file 08 §2. Anything not listed is ignored silently.

## 2. Time

### 2.1 One clock
`t_fic` is fiction time in seconds since 06:00 Hearth local on Expedition Day 1, stored as a 64-bit float. Everything that moves or is scheduled reads `t_fic`: body positions, day and night, mail delivery, the seedling, crew routines.

| Situation | Rate (fiction seconds per real second) |
| --- | ---: |
| Paused, title, settings, photo mode | 0 |
| Everything else outside cruise | 60 (one real minute is one fiction hour) |
| Cruise | 8,640 (one real second is 2.4 fiction hours; ten real seconds are one fiction day) |

Simulation steps at a fixed 60 Hz of real time. In cruise, body positions are evaluated analytically from `t_fic`, never integrated, so the high rate cannot destabilise anything.

### 2.2 What the clock is for
The day counter in the cabin, the seedling's growth, the Sun's angle on Mars and Venus, the phases of the planets, and the "sent … ago" stamp on mail. **Nothing is failed by the clock.** Vigil's emergency has no simulated deadline; file 06 gives the lines used if the player arrives very late.

### 2.3 Cinematics and focus loss
Authored sequences run at 60×. Losing window focus pauses the game in every state (setting, default on). On resume, the first simulation step uses a zero interval; the accumulator is cleared. This is also the fix for the reported start-up jitter class of bug: **no step ever receives an interval greater than 1/30 s.**

## 3. Scale and frames **Δ**

### 3.1 Three frames (unchanged in principle)
| Frame | Unit | Origin | Used for |
| --- | --- | --- | --- |
| Solar | su; 1 AU = 60,000 su | Sun | `solar_flight`, `cruise`, map |
| Orbital | metre | Kestrel's docking port | `orbit_ready`, `docking`, `descent`/`launch` first and last shots |
| Surface | metre | site datum | `surface` |

Nothing is ever converted by scaling geometry. At a boundary the coordinator passes a small record (body ID, site ID, sun direction, `t_fic`) and the next scene builds its own picture.

### 3.2 Why 60,000 su per AU
The prototype's 3,000 units/AU with a 1,200 units/s cruise crosses the whole system in under two minutes. That cannot carry pillar P1. The native solar frame is twenty times larger, simulated in 64-bit, and rendered with a floating origin (the ship is always at the render origin; everything else is positioned relative to it each frame). The browser trial keeps its existing numbers.

### 3.3 Bodies
Distances are real ratios. Radii are exaggerated so that bodies read at approach speeds. The Sun alone is true to scale, so its apparent size is correct from everywhere.

| Body | Mean distance (AU) | Orbit radius (su) | Period (fiction days) | Visible radius (su) | Longitude on Day 0 (°) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sun | — | — | — | 279 (true) | — |
| Mercury | 0.387 | 23,220 | 88.0 | 500 | 350.1 |
| Venus | 0.723 | 43,380 | 224.7 | 1,150 | 182.5 |
| Earth | 1.000 | 60,000 | 365.25 | 1,200 | 246.2 |
| Mars | 1.524 | 91,440 | 687.0 | 650 | 0.0 |
| Ceres | 2.770 | 166,200 | 1,683 | 200 | 83.7 |
| Jupiter | 5.203 | 312,180 | 4,333 | 6,000 | 57.6 |
| Saturn | 9.582 | 574,920 | 10,834 | 5,000 (rings to 11,500) | 242.3 |
| Uranus | 19.201 | 1,152,060 | 30,732 | 2,600 | 266.8 |
| Neptune | 30.047 | 1,802,820 | 60,160 | 2,500 | 284.5 |

Orbits are circular, coplanar and prograde. Period = 365.25 × AU^1.5 days. Longitude at time t = longitude₀ + 360° × t / period.

| Moon | Parent | Orbit radius about parent (su, exaggerated) | Period (fiction days, real) | Visible radius (su) | Direction |
| --- | --- | ---: | ---: | ---: | --- |
| Europa | Jupiter | 22,000 | 3.55 | 300 | prograde |
| Titan | Saturn | 30,000 | 15.95 | 500 | prograde |
| Miranda | Uranus | 9,000 | 1.41 | 120 | prograde |
| Triton | Neptune | 11,000 | 5.88 | 280 | **retrograde** (true) |

In cruise a moon visibly circles its parent (Europa laps Jupiter every 35 real seconds). That is correct and should be left alone.

### 3.4 The Sun
- Exclusion sphere: 6,000 su (0.1 AU). The route planner never crosses it. A ship flown into it by hand is turned away by an authored 3 s "heat limit" yaw with a radio line. No damage.
- Apparent diameter from any point: 0.533° ÷ distance in AU. Use it in every frame, including surface skies.
- Illuminance relative to Earth: 1 ÷ distance². Exposure handling is in file 07 §3.

## 4. Reference trajectory

The Day-0 longitudes above were solved so that a player moving at the intended pace meets these leg lengths. They were checked for players running 15, 40 and 90 days late; every leg stays within the bounds shown.

| Leg | Drive tier | Depart (day) | Arrive (day) | Length (AU) | Bounds if late (AU) | Cruise, real time |
| --- | --- | ---: | ---: | ---: | --- | ---: |
| Mars → Jupiter/Europa | I | 1 | 19 | 4.6 | 3.8–4.6 | 3 min 04 s |
| Jupiter → Ceres | I | 22 | 35 | 3.2 | 3.2–3.7 | 2 min 08 s |
| Ceres → Mercury | I | 39 | 51 | 2.9 | 2.8–3.1 | 1 min 56 s |
| Mercury → Venus | II | 56 | 57 | 0.6 | 0.4–1.1 | 16 s |
| Venus → Earth | II | 59 | 61 | 0.5 | 0.3–0.5 | 13 s |
| Earth → Saturn/Titan | II | 65 | 89 | 9.2 | 9.2–10.5 | 4 min 05 s |
| Saturn → Uranus/Miranda | III | 94 | 116 | 11.0 | 10.8–11.0 | 3 min 40 s |
| Uranus → Neptune/Triton | III | 122 | 148 | 13.0 | 12.9–13.0 | 4 min 20 s |
| Neptune → Mars | III | 152 | 215 | 31.6 | 31.0–31.6 | 10 min 31 s |

The line home passes 0.18 AU from the Sun, outside the 0.1 AU exclusion. From there the Sun's disc is 3° across, six times its width from Earth. This perihelion pass is an authored beat (file 06 §7).

Cruise totals about 30 minutes. Depot stops, approaches, waysides and cabin time bring travel to roughly 110 minutes of the game.

**Required test (file 09 §9, `T-TRAJ-01`):** simulate the table with the shipped constants and assert each leg within its bounds. If constants change, re-solve the longitudes with the same method (for each leg in order, choose the destination's Day-0 longitude so that the distance from the origin at departure to the destination at arrival equals the target).

The two short inner legs are deliberate: after Mercury the player has a faster drive and the inner planets are close. Venus should feel like it arrives before the player is ready.

## 5. The *Kestrel* in solar flight

### 5.1 Model
Assisted Newtonian. The ship has a velocity vector. Flight assist continuously bends velocity toward (nose direction × commanded speed) with a time constant of 0.8 s [0.5–1.2], so the ship flies where it points with a little slide.

| Parameter | Start value | Range |
| --- | ---: | --- |
| Commanded speed at 100% throttle | 220 su/s | 180–260 |
| Boost speed | 480 su/s | 400–560 |
| Boost energy | 8 s full, recharges in 14 s | — |
| Throttle step (key) | 10% | — |
| Pitch / yaw rate | 55°/s at low speed, 35°/s at boost | — |
| Roll | Auto-levels to the ecliptic in 1.5 s when no roll input | — |
| Brake (`Brake` held) | Decelerates at 160 su/s² toward the velocity of the nearest body or depot within 20,000 su, else toward zero | — |
| Vertical soft limit | Beyond ±4,000 su from the ecliptic, a gentle return force | — |

**Δ No hull meter.** The prototype's hull damage is removed (anti-goal: no survival meters). Hitting an asteroid or a depot structure: a spark, a thud, velocity reflected at 30%, cruise locked out for 3 s. Nothing to repair.

### 5.2 Camera
Chase camera 3.2 ship-lengths behind, 0.6 above, with 0.25 s positional lag and free look on the right stick or mouse-drag (springs back after 2 s idle). Field of view 60°, widening to 68° at boost. A cockpit-window view is available on `Toggle View`.

### 5.3 Idle HUD fade
After 4 s with no input in `solar_flight`, `cruise`, `orbit_ready` or `surface`, all HUD elements fade out over 0.6 s. Any input restores them in 0.15 s. (Pillar P6.)

## 6. Cruise — "the Quiet"

### 6.1 Conditions to engage
All must hold; if not, the HUD names the first failing one.

1. A route leg is plotted.
2. Fuel above 2%.
3. More than 1.5 × capture radius from any body centre, and more than 600 su from any depot.
4. Nose within 25° of the leg's lead direction (press `Align` to turn there automatically in ≤ 3 s).

### 6.2 Sequence
| Phase | Duration | What happens |
| --- | ---: | --- |
| Spool | 4.0 s | Drive tone rises; plume lengthens; HUD clock begins to run faster. Cancel with `Brake`. |
| Acceleration | 6.0 s | Speed ramps to cruise speed; time rate ramps 60× → 8,640×. |
| Hold | — | **Course hold**: heading tracks the lead-intercept of the leg target, recomputed every real second. The player may leave the controls. |
| Approach glide | 10.0 s | Begins at the drop-out distance. Speed ramps to 220 su/s, time rate to 60×. The destination grows from a point to a disc. |

Stars do not streak. Nothing warps. The sense of speed comes from the clock, the plume, the slow wheel of the planets on the map, and the Sun's disc changing size. (Pillar P5.)

### 6.3 Speeds and range
| Drive tier | Given at | Cruise speed | AU per real minute | Fiction days per AU |
| --- | --- | ---: | ---: | ---: |
| I | start | 1,500 su/s | 1.5 | 4.0 |
| II | Mercury (Yusuf's crew) | 2,250 su/s | 2.25 | 2.67 |
| III | Titan (harbour crew) | 3,000 su/s | 3.0 | 2.0 |

| Tank | Given at | Cruise range on a full tank |
| --- | --- | ---: |
| Standard | start | 8 AU |
| Auxiliary bladder | Ceres (Cooperative) | 10 AU |
| Drop tanks, one use | Triton (Vigil) | 34 AU for the single leg home; jettisoned on arrival at Mars |

The tank is kept small on purpose. With 10 AU the two outer legs each need exactly one stop at a dark depot, which is what makes the Commons matter (file 04 §8).

Five gifts are the only upgrades in the game: the auxiliary bladder (Ceres), drive tier II (Mercury), the **outer chart** (Earth: Tomás's copy of the Registry's depot ledger, which shows every dark depot on the map with the date it was last heard from), drive tier III (Titan), and the drop tanks (Triton). Each is fitted or handed over in an authored 20 s scene and announced by one radio line. There is no upgrade menu.

### 6.4 Leaving cruise
- **Automatic:** at the drop-out distance from the leg target: max(8,000 su, 10 × visible radius) for a body; 2,500 su for a depot.
- **By hand:** `Brake`, or throttle to zero. A 10 s glide as above.
- **Obstacle:** swept test every step against all bodies and depots. If the next 2 s of path enters a keep-out sphere that is not the target, course hold steers around it; if it cannot, it drops out.
- **Fuel:** at 0% the drive cuts to a 40 su/s drift thruster and the tow call is offered (§8.4).

### 6.5 Nudge
While `Steer` is deflected in cruise, the ship deviates up to 15° from the held course; on release it returns over 3 s. This is for looking at something, and for reaching waysides.

### 6.6 What the player does during the Quiet
Any of: watch from outside; go to the cabin (file 04 §1) to read mail, tend the seedling, look out of the window, play the radio; open the map; use Look Home; answer a wayside ping. None is required. A leg with no input at all completes correctly.

## 7. Fuel

- Fuel is a 0–100 quantity. Cruise consumption = distance ÷ tank range × 100.
- Local flight is nearly free: 100% throttle uses 1 unit per real minute; boost uses 3.
- The HUD shows **range in AU**, not a percentage, with the percentage as a thin bar.
- The map draws the reachable radius as a ring from the ship.
- **Fuel comes only from depots.** Sites do not refuel the *Kestrel*; every planet has an anchorage a minute's flight away, and that is where a visit normally begins and ends. The one exception is Vigil's drop tanks.
- There is no price. There is no other resource.

## 8. Depots — the Commons

### 8.1 Network
The prototype's 269 sites are kept: thirteen bands at 0.55, 1.4, 2.6, 4.4, 6.6, 9, 12, 15.5, 19.5, 23.5, 27.5, 31.5 and 35 AU; four named belt sites; one anchorage near each planet. Generation stays deterministic (seed 1129).

**Δ Light and dark.** Every depot has a `lit` flag.
- Bands at 9 AU and inward (39 sites), all named sites and all planetary anchorages: lit from the start.
- Bands at 12 AU and beyond (218 sites): **dark** from the start. The Uranus and Neptune anchorages are lit.
- Each planetary anchorage sits 25,000 su ahead of its planet on the planet's orbit, clear of any moon.
- A dark depot can still be docked. It will not pump until restarted (file 04 §8). Restarting takes about a minute, cannot fail and sets `lit` permanently.

The route planner may route through dark depots and marks them with a hollow symbol. A dark depot costs the planner an extra 30,000 su, so it prefers lit ones, including those the player has restarted. The three authored depots below carry no stop overhead, so that when one lies on the line it is always the planner's choice.

Three outer depots are **authored**, not procedural. They replace the nearest generated site in their band and keep fixed positions so that the story routes always find them:

| ID | Name | Band (AU) | Longitude on Day 0 (°) | Role |
| --- | --- | ---: | ---: | --- |
| `depot_tern` | Tern Light | 15.5 | 261.5 | The stop on Saturn → Uranus, 7 AU out. The first dark depot the player meets. |
| `depot_petrel` | Petrel Light | 23.5 | 276.2 | The stop on Uranus → Neptune, 5.5 AU out. |
| `depot_albatross` | Albatross Light | 19.5 | 283.3 | On the line home. Dark when the player goes out. Lit, by someone else, when they come back. |

**Required test `T-ROUTE-02`:** with a 10 AU tank and the reference trajectory, the planner routes Saturn → Uranus through Tern and Uranus → Neptune through Petrel, and the straight line Neptune → Mars passes within 3,000 su of both Petrel's and Albatross's positions on Day 152–175 (adjust their longitudes if constants change).

### 8.2 Depot scale (native)
Rock body radius 60–140 su; refinery frame with one lit docking cradle; a rotating amber beacon when lit, a dead beacon and frost when dark. Each depot shows its name and a three-line **beacon note** (file 04 §8.5) on approach.

### 8.3 Docking the *Kestrel* at a depot
Deliberately simple; the hand-flown docking is reserved for *Wren*.

1. Within 2,500 su, `Brake` matches the depot's velocity.
2. Fly to within 300 su of the cradle at ≤ 12 su/s relative. The cradle shows a green chevron lane.
3. Hold `Interact` 1.0 s. An authored 5 s clamp sequence plays.
4. State becomes `depot_docked`. Fuel transfers at 25 points per real second. The player may open the cabin, read the beacon note, do the tending task, or depart at any time with `Interact`.
5. Docking sets the **rescue anchor** to this depot and writes a checkpoint.

### 8.4 Running dry
At 0% fuel: drive off, drift thruster only, and a prompt: *"Call a Commons tow — hold `Interact`."* A tug arrives in 20 real seconds (it is seen approaching), clamps on, and the screen fades to the nearest lit depot with a full tank. Fiction time advances two days. The tug pilot's beacon note reads: *"No charge. Tend one for me."* There is no other penalty and no limit on tows.

## 9. Routing and the system map

### 9.1 Planner
Unchanged from the prototype in method: Dijkstra over current positions, first leg limited by actual fuel less 3 points, later legs by 85% of a full tank, Sun exclusion respected, a fixed stop overhead (now 12,000 su) to discourage needless stops. Replanned every 3 real seconds and on any dock.

### 9.2 Map behaviour
- Live: bodies and depots move while it is open.
- Views: whole system, inner system, ship-centred; zoom, pan.
- Shows: route legs, each stop, reachable ring, lit and dark depots, the ship, the Day counter, and for the selected destination: distance in AU, **light-time from here**, **light-time from Mars**, cruise time in real minutes and fiction days.
- Toggle: light-time rings centred on Mars at 1, 10, 60 and 240 light-minutes.
- Selecting a destination plots a route and leaves the map open. Closing it returns to flight.
- Only destinations that exist are selectable. Parent giants are selectable as viewpoints; their entry says which moon has the port.

## 10. Arrival: approach, capture, orbit

### 10.1 Approach
| Quantity | Value |
| --- | --- |
| Capture radius R_cap (from body centre) | 3.0 × visible radius |
| Prompt radius | 6.0 × visible radius |
| Keep-out radius | 1.6 × visible radius. The ship cannot be flown inside it; assist bends the path tangent. No damage. |

Inside the prompt radius at ≤ 400 su/s relative: *"Request orbit — hold `Interact`"* (1.0 s hold). If the body has no site: *"No port here"* and, for a parent giant, a marker toward its moon.

### 10.2 Capture (authored, 12 s, skippable after first viewing at that body)
Three shots: (1) 4 s wide, the ship crossing the limb with the Sun on the correct side; (2) 4 s close on the *Kestrel*'s retro burn; (3) 4 s settling pull-back with the landing region turning into view. Ends in `orbit_ready`. Writes a checkpoint.

### 10.3 Orbit-ready
The orbital frame. The *Kestrel* is parked; the body fills the lower part of the view and turns slowly (one revolution per 180 real seconds, for the eye only). For a moon, the parent is in the sky at its authored angular size (file 07 §4).

Four actions on a small radial menu: **Descend to ‹site›** · **Cabin** · **Depart** · **Map**. Depart places the ship at R_cap moving with the body and returns to `solar_flight`.

## 11. *Wren*: descent and launch

One craft does both (settles DECISION-04). Nine metres, four landing legs, one ascent engine, a dorsal docking collar, room for the pilot and six cores on an external rack.

### 11.1 Descent (authored)
| Beat | Time | Content | Loading |
| --- | ---: | --- | --- |
| Release | 0–6 s | *Wren* drops from the ventral dock; the *Kestrel* recedes overhead. | Surface scene loads in the background from the moment Descend is confirmed. |
| Fall | 6–18 s | The body's limb flattens to a horizon. World-specific (file 05/06). | — |
| Reveal | 18–32 s | The site's landmark appears, then its layout. Same sun direction as orbit. | Must be loaded by 18 s; otherwise the Fall shot holds on a loop of cloud, haze or terrain until it is. No black frame, no spinner. |
| Touchdown | 32–40 s | Dust or frost; legs compress; engine stops; three seconds of silence. | Save written before control is given. |

First visit to a site: full length. Repeat visits: a 12 s version (Release 3 s, Reveal 6 s, Touchdown 3 s). `Skip` (hold 1.0 s) is offered on repeat visits only and lands at the identical end state.

### 11.2 Launch (authored)
Boarding prompt at the berth lists what is on the cargo rack. Confirm (hold 1.0 s) → ignition 3 s → ascent past the site's landmark 10 s → sky darkening 8 s → the *Kestrel* as a light, then a shape, 8 s → engine cut; *Wren* is at the docking start pose (§12.2), at rest relative to the port. Control is handed over with one radio line and the docking HUD fades in. Total 30–35 s; repeat version 12 s; skip lands at the same pose. **Launch never docks for the player.**

### 11.3 Failure
If the surface scene cannot load: the Fall shot ends in a climb-out back to `orbit_ready` with the message *"Site not ready. Standing by in orbit."* and a retry option. If the save before touchdown fails: retry three times silently, then land anyway and show a persistent *"Not saved"* mark until a save succeeds.

## 12. Docking *Wren* to the *Kestrel*

This is hinge H1 and recurs after every surface visit: ten times in a full playthrough. It must stay a pleasure on the tenth.

### 12.1 Frame and model
Orbital frame, metres. The *Kestrel* does not move. Port frame: origin at the centre of the *Kestrel*'s docking ring face; +Z out of the port along the approach axis; +Y toward the *Kestrel*'s dorsal side; +X to the right when looking back at the port along −Z.

*Wren* is a point with attitude: per-axis translational acceleration, rate-commanded rotation, no orbital mechanics, no fuel.

### 12.2 Start pose
Position (+38, −22, +215) m. Velocity zero. Attitude: yaw −10°, pitch +6° from facing the port, roll 0°. The port's ring light is visible on screen. A deterministic small variation is applied per visit from the site ID: ±12 m in X and Y, ±4° yaw.

### 12.3 Controls
| Quantity | Value | Range |
| --- | ---: | --- |
| Translation acceleration, each axis | 0.20 m/s² | 0.15–0.30 |
| Precision modifier (held) | ×0.25 | — |
| Rotation rate, pitch and yaw | 8°/s max, holds attitude on release | 6–12 |
| Roll | Automatic in Guided and Standard; 8°/s in Manual | — |
| `Brake` held | All relative velocity → 0 at 0.30 m/s² | — |
| Speed cap | 6.0 m/s | — |
| `Align` (Standard) | Rotates to face the port in ≤ 6 s, then holds | — |
| `Reset` held 1.5 s | Returns to the start pose | — |

### 12.4 Assist levels (setting; default Standard)
| Level | Attitude | Translation | Tolerances |
| --- | --- | --- | --- |
| **Guided** | Always held on the port automatically | Lateral velocity is damped to zero whenever there is no lateral input | × 1.5 |
| **Standard** | `Align` on request; roll automatic | All by hand | × 1.0 |
| **Manual** | All three axes by hand | All by hand | × 1.0 |

No level docks for the player. In every level the player closes the distance and makes the contact.

### 12.5 Stages and guidance
| Stage | Range | Guidance shown |
| --- | --- | --- |
| Far | > 60 m | Port marker, range, closing speed |
| Corridor | 60–10 m | A cone of four thin rings, half-angle 8°; advised speed ≤ 1.5 m/s; lateral offset as a dot in a circle |
| Final | < 10 m | Docking camera cross and target; advised speed ≤ 0.30 m/s; offset and angle numerals |

Advice is shown, never enforced.

### 12.6 Capture
Soft capture occurs when all hold for 0.2 s:

| Condition | Standard tolerance |
| --- | ---: |
| Axial distance between ring faces | ≤ 0.25 m |
| Lateral offset | ≤ 0.30 m |
| Pitch and yaw error | ≤ 4° |
| Roll error | ≤ 8° |
| Closing speed | 0.03–0.30 m/s |
| Lateral speed | ≤ 0.08 m/s |

On capture: input is taken away; `docked_latch` plays (ring retracts, twelve hooks close with twelve clicks, 6 s); cargo and visit results transfer **once** (keyed by the transition ID); the game saves; state becomes `orbit_ready`.

### 12.7 Rejection
If the ring faces come within 0.25 m with any condition unmet: a soft bump sound, *Wren* is given 0.25 m/s outward along +Z, lateral velocity is halved, input is locked for 1.5 s, and one line names the first unmet condition: *"Too fast."* / *"Off centre."* / *"Not square."* / *"Sliding sideways."* Contact with any other part of the hull: the same bump along the surface normal. No damage, ever.

After three rejections in one attempt, a one-time prompt offers Guided **for this docking only**. Declining never asks again that attempt.

### 12.8 Wandering
Beyond 600 m: velocity is zeroed and a marker shows the way back. Beyond 1,000 m: fade, return to the start pose.

### 12.9 Camera
Default: *Wren*'s docking window, looking along its collar axis, field of view 50°, with a cross engraved on the glass. `Toggle View`: external chase at 18 m. A picture-in-picture of the other view (160 px) may be enabled in settings.

### 12.10 Targets
| Measure | Target |
| --- | --- |
| First docking, with tutorial | 3–5 min, ≥ 95% of players succeed without leaving |
| Later dockings, Standard | median 70–150 s |
| Players who switch to Guided permanently | ≤ 30% |
| Rejections per docking after the third visit | median ≤ 1 |

### 12.11 Variation, to keep the tenth fresh
The mechanics never change. What changes: the light (each body's Sun size and colour), what is in the sky behind the *Kestrel* (file 07 §4), the cargo on the rack, and twice a small authored twist — at Titan the approach begins in the planet's shadow with only ring lights; at Triton there is no twist at all and no music, and the six empty rack positions are in view.

## 13. Vehicle controllers

Five controllers cover the game (decision D13). A chapter may retune parameters but may not add a sixth.

| Controller | Used by |
| --- | --- |
| **Ship** | *Kestrel* (§5–6) |
| **Lander** | *Wren* docking (§12) |
| **Ground** | Nomad (Mars), Skate (Europa), Mule (Ceres), Hopper (Miranda), Sledge (Triton) |
| **Skiff** | Titan |
| **Rail** | Mercury rim tram, Venus gantry pod, Earth tether car |

### 13.1 Ground
The prototype's rover model, kept and extended. State: position, heading, speed, vertical offset, airborne flag. Per fixed step: throttle and brake set a target speed and a rate; heading turns at `turnRate × min(|speed| ÷ 7, 1)`; **grip** bends the direction of travel toward the heading at `grip × 4` per second (grip 1.0 reproduces the prototype exactly); slopes steeper than 0.8 rise per run block; axis-separated collision against simplified boxes; a hard circular site limit that reads as terrain, never as an invisible wall.

Airborne (low-gravity worlds): if the ground falls away faster than gravity can follow, the vehicle becomes airborne, keeps its horizontal velocity, falls at the vehicle's **effective gravity**, and lands without damage. No steering in the air.

| Vehicle | World | Max speed (m/s) | Reverse | Accel (m/s²) | Brake | Drag | Turn (rad/s) | Grip | Effective gravity | Special |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Nomad | Mars | 18 | 7 | 5.5 | 19 | 1.7 | 0.88 | 1.0 | 3.7 | Cargo bed, one item |
| Skate | Europa | 12 | 5 | 3.0 | 6.0 | 0.8 | 0.70 | 0.45 | 1.3 | Hydrophone mast; winch |
| Mule | Ceres | 9 | 4 | 2.0 | 2.5 | 0.3 | 0.60 | 0.60 | 0.8 | Carries up to three canisters; loaded: accel × 0.6, brake × 0.5 |
| Hopper | Miranda | 10 | 4 | 3.0 | 4.0 | 0.5 | 0.70 | 0.70 | 0.6 | Hop: 3 m/s upward, 2 s recharge |
| Sledge | Triton | 8 | 3 | 2.5 | 5.0 | 1.0 | 0.60 | 0.80 | 0.8 | Six-core rack |

Effective gravity is a vehicle-handling value. Real surface gravity (Ceres 0.28, Miranda 0.079, Triton 0.78 m/s²) would make vehicles unmanageable; the fiction is ballast thrusters. Loose props and dust use each world's **real** gravity so the place still looks right.

All ground vehicles share: `Recover` (hold 1.5 s; returns to the last safe node with cargo intact), interaction requires speed below 1.6 m/s within 13 m of a beacon, chase camera with orbit and zoom, survey camera.

### 13.2 Skiff (Titan)
A ducted-fan flyer in a thick atmosphere and low gravity. It cannot stall and cannot crash.

| Quantity | Value |
| --- | --- |
| Speed | 0–35 m/s forward; hover capable |
| Climb / descent | ± 6 m/s |
| Yaw | 40°/s; banks visually up to 25° |
| Altitude band | 4–400 m above the surface or sea; soft floor and ceiling |
| Terrain or structure contact | Soft bounce at 2 m/s, no damage |
| Altitude hold | On by default; vertical input changes the held altitude |
| Sonar ping | `Interact` in flight: one ping every 3 s; returns as sound and a 2 s ring on the HUD |
| Visibility | Fog to 180 m; lit beacons glow to 900 m |

### 13.3 Rail
The vehicle is a parameter along an authored spline. `Throttle` forward and back at up to 3 m/s² to a line speed set per track (Mercury 14 m/s, Venus 4 m/s, Earth 9 m/s). It stops by itself at stations, where `Interact` opens the station's activity. The camera is free to look anywhere. Rail is how the game gives the player a place to *be* without building a walking system.

## 14. Checkpoints and rescue

A checkpoint is written at: each depot dock; orbit capture; touchdown; every completed activity step; boarding for launch; the docking start pose; latch; and every 60 real seconds in `solar_flight` and `surface`. Loading always resumes at a stable state: a save made during any authored sequence resumes at that sequence's end state; a save during docking resumes at the start pose.

`Pause → Return to last port` restores the ship to the rescue anchor with a full tank. It never changes story progress or cargo.

## 15. What the prototype's parallels become

| Prototype | Native |
| --- | --- |
| 3,000 units/AU; cruise 1,200 | 60,000 su/AU; cruise 1,500 / 2,250 / 3,000 |
| Cruise needs manual alignment | Course hold |
| Map freezes time | Map is live |
| Hull damage and repair | Removed |
| Landing pads on every planet | Removed; only authored sites, giants are viewpoints |
| Fade bridge to Mars | Capture → descent → surface → launch → docking → latch |
| Pause-menu rescue | Commons tow, plus Return to last port |
| All depots identical | Lit and dark; beacon notes; tending |

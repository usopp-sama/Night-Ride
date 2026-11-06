# World scale and fuel network

Implemented on `codex/solar-expedition`, after checkpoint `7d47a88`.

The [first Mars surface build](MARS-SURFACE.md) now provides Hearth Crater, a rover, a local service activity and surface saves. The [planet exploration checklist](DEVELOPMENT-CHECKLIST.md) tracks the next transport revision: cinematic lander descent/launch and manual return docking. Planetary contacts now hold the ship outside the body instead of applying the original impact damage. The distance ratios and refuelling network remain the baseline; ship proportions and travel pacing will be reviewed together.

## The scale decision

Preserve real mean Sun-distance ratios on a **linear** world map. Use **1 AU = 3,000 gameplay units**. This gives the outer system room for the later story while keeping coordinates small enough for this browser renderer.

| Planet | Mean Sun distance (AU) | Orbit radius (units) | Visible radius (units) |
| --- | ---: | ---: | ---: |
| Mercury | 0.387 | 1,161 | 34 |
| Venus | 0.723 | 2,169 | 56 |
| Earth | 1.000 | 3,000 | 60 |
| Mars | 1.524 | 4,572 | 44 |
| Jupiter | 5.203 | 15,609 | 180 |
| Saturn | 9.582 | 28,746 | 150 |
| Uranus | 19.201 | 57,603 | 108 |
| Neptune | 30.047 | 90,141 | 104 |

Neptune's orbit was previously 1,240 units, so its new radius is about 72.7 times larger. The chart extends to 38 AU (114,000 units) rather than the old 1,650-unit boundary. Refuelling sites extend to 35 AU.

Source for the rounded AU values: [NASA's table of mean planet distances](https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-2019/). See also [NASA's Solar System chapter](https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/).

This is a gameplay model, not an ephemeris. Orbits remain circular and coplanar, phases are fictional, and the visible sizes of the Sun and planets are exaggerated. All map views use the same linear world coordinates; zooming does not change the distance ratios.

Earth completes an orbit in 1,500 simulation seconds. Other periods follow the Kepler-style ratio `period = 1500 * AU^1.5`: inner planets move faster and outer planets more slowly. Time freezes in the system map and while paused. This preserves relative periods, not real elapsed travel times or physical spacecraft trajectories.

## Flight and travel

- Start in Mars departure orbit.
- Manoeuvring speed: up to 160 units/second.
- Boost: 340 units/second, limited by rechargeable boost energy, with 35% greater fuel cost per unit travelled.
- Cruise: 1,200 units/second, toggled with C or the header button. R aligns the ship toward the current route leg; it is not a continuous autopilot.
- Cruise needs 650 units of planetary surface clearance and 300 units of depot clearance. It slows on approach to the current leg or a nearby body. Shift also disengages cruise and brakes.
- A full tank covers 8 AU at normal/cruise efficiency. The HUD labels the estimate as cruise range because boost costs extra.
- Fuel use is distance-based. Zero fuel leaves a very slow reserve thruster; Pause also provides rescue to the last checkpoint with a full tank. Running dry cannot permanently strand a session.
- Mars surface visits are available within 650 units through the Visit Hearth interaction. Other planets retain the prototype landing transition within 55 units and at no more than 28 units/second relative speed.

## The 269-depot network

The game has 257 named/procedural network sites plus 12 special sites: four named minor bodies and eight local planetary anchorages. They all move on solar orbits. This network is fictional infrastructure, not an astronomical asteroid catalogue.

The procedural sites use 13 orbital bands from 0.55 to 35 AU, with enough angular samples to keep adjacent gaps under a tank's range. Inner regions use asteroid depots and the outer regions use icy waystations. The four named facilities are Ceres Anchorage, Vesta Shipyard, Pallas Rest, and Hygiea Exchange, with approximate mean orbital distances and invented facilities/phases. Imported propellant supports facilities such as Vesta; the game does not imply that every asteroid is naturally water-rich.

Depots are visible rock/refinery assemblies with a clear docking aperture. Within 120 units, slow below 35 units/second relative to the depot, then press F. Docking links the rescue beacon. Fuel transfers at 25 percentage points per simulation second; hull and boost are restored too. The player can depart before transfer finishes. Merely flying through a ring no longer instantly refills the ship.

## Navigation

Selecting a final destination keeps the map open so the player can inspect the plotted route. Close the map to fly.

The route planner finds fuel stops with Dijkstra's algorithm, using current orbital positions and a predicted final intercept. The first leg respects current fuel with a small margin, later legs reserve 15% of a full tank, and links through the Sun's exclusion zone are rejected. Stop overhead discourages unnecessary detours. During flight, the route is recalculated every three seconds as bodies move and fuel changes. The flight HUD guides the next fuel stop while retaining the final destination.

This is a flight aid, not an autopilot or a collision-free trajectory guarantee. Fuel estimates assume normal/cruise efficiency; extra boost, detours, manual steering, or remaining in flight use additional fuel.

The map provides full-system, inner-system, and ship-centred presets; wheel/button zoom; drag/touch pan; remaining-fuel radius; and route legs. The local minimap spans 8 AU. The sidebar lists all planets and the nearest eight depots, with name/type search for more sites. N tracks the closest fuel depot.

## Browser architecture and verification

- Static ES modules and the existing bundled Three.js; no game server or database is required.
- Fixed 1/60-second simulation steps and swept collision segments prevent cruise from skipping small bodies.
- The background belt uses a single instanced mesh for 1,200 asteroids. Distant refinery meshes are hidden beyond 6,000 units while their navigation data remains active. HUD markers are limited to nearby sites.
- Rendering range, stars, orbital paths, map bounds, markers, intercept prediction, and solar/boundary checks all use the expanded world.
- Tests cover scale ratios, orbital velocity, long-range interception, deterministic depot generation, graph connectivity at five orbital epochs, every planet's routes from Mars at three epochs, solar avoidance, low-fuel routing, fuel use, collision sweeps, and docking speed limits.
- Browser checks cover route selection, map presets, cruise approach, moving-depot docking, partial-to-full fuel transfer, and departure/rescue controls.

Mars now has a settlement, a local rover activity and browser-local surface saves. Full expedition persistence, other planetary scenes, moons, authored transport cinematics, manual mothership docking and the larger story chapters remain future work.

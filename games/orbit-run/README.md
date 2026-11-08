# Orbit Run — solar expedition

**ORBIT RUN — Solar Explorer** is the browser-game foundation for the proposed **The Third Ring** story. Commit `7d47a88` preserves the original solar-system prototype. The current version expands the world using real mean orbital-distance ratios and adds cruise flight, fuel, and an orbiting asteroid-depot network. See [world scale and fuel policy](docs/WORLD-SCALE.md) for the numbers, sources, and gameplay compromises.

## Long-term target: desktop and Steam

The full game's longer-term goal is an installable desktop release and eventual Steam launch. The user has ruled out Electron for that release: the [native desktop plan](docs/NATIVE-DESKTOP-PLAN.md) proposes a focused Godot port experiment, with the browser retained as a free online trial. The production engine is not yet selected. The current browser build remains our working prototype and a possible demo. The [desktop and Steam roadmap](docs/DESKTOP-AND-STEAM-ROADMAP.md) adds platform/save/input foundations, an early Windows desktop feasibility milestone, a measured runtime/engine decision, and release preparation. Windows-first is the planning default; the final stack and release date are still open.

We will evaluate the desktop path before producing the remaining worlds at scale. The [shared desktop prototype](docs/DESKTOP-PROTOTYPE.md) now packages this same game in Electron, with native Mars field logs and offline assets. A Mac ARM64 app has been built; Windows gameplay verification remains pending. That Electron build is retained only as a historical playtest baseline; it is not the Steam release path.

## Next content focus

We are preparing [other destination foundations](docs/DESTINATION-FOUNDATIONS.md), starting with Europa, then Ceres and Mercury. Small local-world blockouts can proceed alongside the queued startup polish, orbital scene, cinematics, manual docking and full expedition saves. These new locations are planned, not yet playable.

## Mars is now playable

Choose **Explore Mars** for [Hearth Crater](docs/MARS-SURFACE.md): a 4.4 km playable crater region with 16 stops, 19 pressure habitat modules, 12 named EVA residents, a 216-array solar farm and a six-wheel rover. New districts include homes, medical/EVA services, crop houses, water works, oxygen production, freight, science, a shelter, a print yard and remote power. Collect a controller at the workshop, restore the east solar field, and inspect the construction site. Rover position, cargo/activity stage and waypoint are saved locally across visits.

The [settlement research and layout notes](docs/MARS-SETTLEMENT-RESEARCH.md) explain the NASA/architecture references and fictional compromises. Park near crew and press **T** for radio conversations. Visiting service beacons records discovery stamps.

Use WASD/arrow keys to drive, Space to brake, F at a parked service beacon, V for the survey view, M for the site atlas and R to recover the rover. The lander beacon returns you to space; Mars can also be entered with F within 650 units of its surface. `/?scene=mars` opens the surface directly.

The [maintained checklist](docs/DEVELOPMENT-CHECKLIST.md) records completed surface work and the next transport milestone: authored descent/launch and **manual docking** with the main ship. This build uses a fade and radio bridge between orbit and the surface. The [detailed transition plan](docs/SCENE-BRIDGES.md) covers continuous arrival/departure presentation; authored transport cinematics and docking remain pending.

## Run locally

From this directory:

```sh
python3 dev_server.py
```

Open http://127.0.0.1:4173/ and choose **Explore Mars** or **Fly the solar system**. Stop the server with Ctrl+C. A static HTTP server is required for JavaScript modules; opening the HTML as a file will not work reliably.

No npm install or build step is required. The development server disables caching so code changes appear on reload. Use `--port 4174` if the default port is occupied. The renderer requires WebGL. All required assets are local; Three.js is bundled and fonts use system fallbacks. For the installable app, see the [desktop setup and Windows checklist](docs/DESKTOP-PROTOTYPE.md).

## Current playable foundation

- Expanded Mars terrain, settlement, residents, rover activity and discovery saves.
- Shared desktop packaging, native field logs with backup recovery, and offline assets.
- Mars departure and eight moving planets, with Neptune's orbit now about 73 times its previous radius.
- Real mean Sun-distance ratios; visible body sizes and orbital time remain exaggerated for playability.
- Kestrel spacecraft with steering, throttle, boost, cruise, braking, and intercept alignment.
- 269 orbiting asteroid/icy depots: slow docking, gradual fuel transfer, repairs, and rescue checkpoints.
- Fuel use, an 8 AU cruise tank range, and automatic route suggestions with intermediate fuel stops.
- Linear system map with zoom, pan, inner-system and ship views, fuel range, and searchable depots.
- Prototype planet approaches and a fade bridge for Mars; transport cinematics remain planned.
- Hull damage, collision handling, synthesized audio, and touch controls.

The Mars surface activity, rover state and discovered stops are saved in browser storage on the web and native files on desktop. The wider expedition/flight state still lasts only for the current page session. Other planets retain their prototype landing sites. Full story chapters, moons, descent/launch cinematics, manual mothership docking and complete expedition saves remain future work.

Plot a destination on the map, inspect its fuel stops, then close the map to fly. R aligns toward the current leg. After clearing nearby bodies, C engages cruise; it disengages on approach. Hold Shift to match a depot's speed, and press F within 120 units to dock. Refuelling takes up to four simulation seconds. N finds the closest depot. Pause offers rescue to the last port if needed.

| Control | Action |
| --- | --- |
| WASD | Steer |
| Q / E | Adjust throttle |
| Space | Boost |
| C / header Cruise button | Toggle deep-space cruise |
| Shift | Brake / match orbital speed |
| M | System map |
| R | Align with intercept |
| N / Find nearest fuel | Track closest fuel depot |
| F | Land / dock / depart |
| P / Escape | Pause |

## Proposed story direction

Mars settlement Hearth Crater needs rare-metal reactor cores to expand its habitat. The player follows leads through Europa, Ceres, and Mercury. A patrol seizes the finished cores at Venus, beginning a second journey through Earth, Titan, Miranda, and Triton before returning to Mars. Each destination should provide a different activity and a human reason to visit. Larger distances and refuelling waystations should make the expedition feel substantial.

This is a planning direction, not current game behavior. The Night Drive documents elsewhere in the repository belong to the original car game.

## Files and hosting

- `dist/index.html`: game interface and entry point.
- `dist/game.js`: controls, flight state, navigation, landing, and UI.
- `dist/scene.js`: Three.js scene, spacecraft, planets, and effects.
- `dist/simulation.js`: orbital positions, intercepts, and collision helpers.
- `dist/navigation.js`: map views, destination browser, and route display.
- `dist/mars.js`: Mars scene, rover rendering, surface UI and lifecycle.
- `dist/mars-world.js`: local layout, terrain, rover simulation, activity and save policy.
- `dist/mars.css`: surface interface styles.
- `dist/style.css`: interface styling.
- `dist/vendor/three.module.js`: bundled Three.js r169 (MIT).

Any static host can serve `dist/`. For a future Vercel project, use `games/orbit-run` as the project root, the Other framework preset, no build command, and `dist` as the output directory. This version does not create or change a deployment.

Run the simulation regression suite with Node.js 20+:

```sh
npm test
```

For transition design, read [Scene bridges](docs/SCENE-BRIDGES.md). For the settlement references, see [Mars research](docs/MARS-SETTLEMENT-RESEARCH.md).

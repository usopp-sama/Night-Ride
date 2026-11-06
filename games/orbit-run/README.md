# Orbit Run — solar expedition

**ORBIT RUN — Solar Explorer** is the browser-game foundation for the proposed **The Third Ring** story. Commit `7d47a88` preserves the original solar-system prototype. The current version expands the world using real mean orbital-distance ratios and adds cruise flight, fuel, and an orbiting asteroid-depot network. See [world scale and fuel policy](docs/WORLD-SCALE.md) for the numbers, sources, and gameplay compromises.

## Next milestone: Mars surface exploration

The [planet exploration implementation checklist](docs/DEVELOPMENT-CHECKLIST.md) tracks the next work: an expanding Mars settlement, drivable rovers, large solar fields, safe orbital capture, cinematic lander descent/launch, and player-controlled return docking with the main ship. It also covers destination loading, later planet activities, persistent saves and browser performance.

This is a planning backlog. The current game still uses the prototype orbital landing platforms; the new surface/lander flow is not implemented yet.

## Run locally

From this directory:

```sh
python3 dev_server.py
```

Open http://127.0.0.1:4173/ and choose **Begin expedition**. Stop the server with Ctrl+C. A static HTTP server is required for JavaScript modules; opening the HTML as a file will not work reliably.

No npm install or build step is required. The development server disables caching so code changes appear on reload. Use `--port 4174` if the default port is occupied. The renderer requires WebGL. Google Fonts are optional external requests; Three.js is bundled locally.

## Current playable foundation

- Mars departure and eight moving planets, with Neptune's orbit now about 73 times its previous radius.
- Real mean Sun-distance ratios; visible body sizes and orbital time remain exaggerated for playability.
- Kestrel spacecraft with steering, throttle, boost, cruise, braking, and intercept alignment.
- 269 orbiting asteroid/icy depots: slow docking, gradual fuel transfer, repairs, and rescue checkpoints.
- Fuel use, an 8 AU cruise tank range, and automatic route suggestions with intermediate fuel stops.
- Linear system map with zoom, pan, inner-system and ship views, fuel range, and searchable depots.
- Planet approach, landing, and takeoff transitions.
- Hull damage, collision handling, synthesized audio, and touch controls.

Progress currently lasts only for the current page session. Landing sites show descriptions and restore the ship. Story missions, settlements, moons, and persistent saves are not implemented yet.

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
- `dist/style.css`: interface styling.
- `dist/vendor/three.module.js`: bundled Three.js r169 (MIT).

Any static host can serve `dist/`. For a future Vercel project, use `games/orbit-run` as the project root, the Other framework preset, no build command, and `dist` as the output directory. This version does not create or change a deployment.

Run the simulation regression suite with Node.js 20+:

```sh
npm test
```

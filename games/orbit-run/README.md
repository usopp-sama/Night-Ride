# Orbit Run — solar expedition checkpoint

This is the existing **ORBIT RUN — Solar Explorer** browser game, preserved before implementing the proposed **The Third Ring** story. The playable files are copied unchanged from the local solar-system prototype.

## Run locally

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173/ and choose **Begin expedition**. Stop the server with Ctrl+C. A static HTTP server is required for JavaScript modules; opening the HTML as a file will not work reliably.

No npm install or build step is required. The renderer requires WebGL. Google Fonts are optional external requests; Three.js is bundled locally.

## Current playable checkpoint

- Eight moving planets and a live solar-system map.
- Kestrel spacecraft with steering, throttle, boost, braking, and intercept alignment.
- Five asteroid waystations with repair and respawn checkpoints.
- Planet approach, landing, and takeoff transitions.
- Hull damage, collision handling, synthesized audio, and touch controls.

Progress currently lasts only for the current page session. Landing sites show descriptions and restore the ship. Story missions, settlements, persistent saves, expanded distances, and a fuel economy are not implemented yet.

| Control | Action |
| --- | --- |
| WASD | Steer |
| Q / E | Adjust throttle |
| Space | Boost |
| Shift | Brake / match orbital speed |
| M | System map |
| R | Align with intercept |
| F | Land / take off |
| P / Escape | Pause |

## Proposed story direction

Mars settlement Hearth Crater needs rare-metal reactor cores to expand its habitat. The player follows leads through Europa, Ceres, and Mercury. A patrol seizes the finished cores at Venus, beginning a second journey through Earth, Titan, Miranda, and Triton before returning to Mars. Each destination should provide a different activity and a human reason to visit. Larger distances and refuelling waystations should make the expedition feel substantial.

This is a planning direction, not current game behavior. The Night Drive documents elsewhere in the repository belong to the original car game.

## Files and hosting

- `dist/index.html`: game interface and entry point.
- `dist/game.js`: controls, flight state, navigation, landing, and UI.
- `dist/scene.js`: Three.js scene, spacecraft, planets, and effects.
- `dist/simulation.js`: orbital positions, intercepts, and collision helpers.
- `dist/style.css`: interface styling.
- `dist/vendor/three.module.js`: bundled Three.js r169 (MIT).

Any static host can serve `dist/`. For a future Vercel project, use `games/orbit-run` as the project root, the Other framework preset, no build command, and `dist` as the output directory. This checkpoint does not create or change a deployment.

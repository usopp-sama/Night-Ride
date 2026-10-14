# Asset and dependency ledger

Third-party art and audio now ship with the world and drive pages; see the asset table below and `public/third-party-notices.txt`. System fonts are used. There are no live AI generation calls or credit-consuming APIs.

## Assets and vendored code (added October 14, evening)

| Item | Source | License | Notes |
| --- | --- | --- | --- |
| engine-sim core (`vendor/engine-sim`) | github.com/ange-yaghi/engine-sim @ 85f7c3b | MIT | Simulation library only; no UI or Piranha scripting. Patches: clang fixes in `ring_buffer.h`, `gas_system.h`, `units.h`/`constants.h` (`inline constexpr`), backslash include paths; built with `NDEBUG` (an upstream assert names a removed member). |
| simple-2d-constraint-solver | github.com/ange-yaghi/simple-2d-constraint-solver @ e009f4f | MIT | Patch: `sparse_matrix.h` includes `matrix.h` (clang two-phase lookup). |
| GM LS / Ferrari F136 engine definitions | `assets/engines/atg-video-2/07_gm_ls.mr`, `08_ferrari_f136_v8.mr` | MIT | Translated by hand into `core/src/engine_sim_audio.cpp`; originals kept in `vendor/engine-sim/engines/`. |
| Exhaust impulse responses | engine-sim `es/sound-library` (`smooth_39.wav`, `new/mild_exhaust_reverb.wav`) | MIT | `public/audio/ls-exhaust-ir.wav`, `f136-exhaust-ir.wav`. |
| Ferrari 458 Italia model | three.js r180 examples (`ferrari.glb`, `ferrari_ao.png`), model by vicent091036 | **Unverified.** The original Sketchfab listing returns 404 | Believed CC-BY. **Verify or replace before any public release.** |
| Camaro SS LP | poly.pizza, Mihail Burduja | CC-BY 3.0 | Alternative car. |
| EZ-Tree 1.1.0 (`@dgreenheck/ez-tree`) | npm | MIT | Procedural trees; bark textures from Poly Haven/texturecan (CC0). Rock GLBs from its repo app folder (origin not stated; covered by the repo's MIT license). |
| Ground/road textures (1k) | polyhaven.com | CC0 | sparse_grass, forest_leaves_04, aerial_grass_rock, coast_sand_01, asphalt_02, gravel_road. |
| Water normal map | three.js examples | MIT | |
| Draco decoder | three.js `examples/jsm/libs/draco` | Apache-2.0 | Decodes the Draco-compressed Ferrari. |
| Kenney Nature Kit | kenney.nl | CC0 | Still used on the authored drive loop. |

| Component | Version | Source | License / use |
| --- | --- | --- | --- |
| Project C++ and browser source | 0.1.0 | This repository, created October 14, 2026 | Owner's project; public project license remains undecided |
| Emscripten | 6.0.12 | https://github.com/emscripten-core/emscripten | MIT / University of Illinois-NCSA; emitted loader and compiler runtime |
| CMake | 4.4.4 | https://cmake.org | BSD-3-Clause, build tooling |
| Vite | 8.3.4 | https://github.com/vitejs/vite | MIT, development/build tooling |
| TypeScript | 7.0.2 | https://github.com/microsoft/TypeScript | Apache-2.0, build tooling |
| Playwright | 1.64.1 | https://github.com/microsoft/playwright | Apache-2.0, test tooling; browsers are not shipped |
| Node.js | 26.11.1 | https://nodejs.org | MIT and bundled notices, build/test runtime |
| Three.js | 0.180.0 | https://github.com/mrdoob/three.js | MIT; browser 3D renderer; notice included in `public/third-party-notices.txt` |
| @dgreenheck/ez-tree | 1.1.0 | https://github.com/dgreenheck/ez-tree | MIT; procedural trees |
| @types/three | 0.180.0 | https://github.com/DefinitelyTyped/DefinitelyTyped | MIT; development types only |

`package-lock.json` pins the complete npm dependency graph. Retain dependency license files and review emitted-runtime notice requirements before publication. No RUN SDK package is shipped in this local prototype; the observed available SDK version was 5.29.1, queried October 14. Add its pinned version and license when integrating.

Technical references consulted:

- https://emscripten.org/docs/compiling/Building-Projects.html
- https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html
- https://github.com/series-ai/venus-sdk-docs/blob/main/rundot-developer-platform/runtime-environment.md
- https://threejs.org/docs/ — renderer and instancing APIs


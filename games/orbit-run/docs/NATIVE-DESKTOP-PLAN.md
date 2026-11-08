# From browser prototype to native desktop game

Updated 8 November 2026. Applies to the solar-expedition game, provisionally The Third Ring, rather than the separate Night Drive car-game documents.

## User direction and current status

The desktop release must not use Electron. The already-built Electron app remains a historical test artifact; it proved that the prototype can run as an installed package, not that it is our production architecture. Keep its source/history without investing further in it as the release path.

The desired audience path is **free online trial → native Steam demo → complete game**. The browser trial should demonstrate the actual game's appeal without promising every eventual desktop feature.

The current game is JavaScript/Three.js with an HTML/CSS interface and procedural geometry. No Godot/native-engine port has been implemented. Replacing the wrapper does not convert this code into a native engine project.

## Recommended engine experiment

Build one small Godot version of the existing Mars/space slice. Test a rover route, a service interaction, a spacecraft, a scene change and a native save before expanding its scope. Then extend the candidate through orbit, launch and docking. Evaluate on Windows as well as the Mac used for development.

Godot is a recommendation for our stylized exploration scope, not an approved production decision. Its Windows export packages the project with an optimized engine runtime and project data, rather than a browser wrapper. [Official Windows export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_windows.html).

Start gameplay work in GDScript for this experiment. Do not write a custom C++ engine or integrate native extensions merely to make the executable feel native. Native code should solve a measured need, not become a requirement for every mission or UI action.

If the experiment exposes a concrete mismatch in visuals, physics, content authoring or team workflow, compare a relevant engine alternative with that evidence. Avoid building several complete engine implementations.

## What carries over

| Current work | Native treatment |
| --- | --- |
| Destination identities, coordinates, district layouts and tuning values | Extract as versioned data; import them into native scenes with explicit units/axes. |
| Story, contacts, mission steps and discovery IDs | Reuse the content and stable IDs; implement the engine-side event/interaction layer. |
| Solar ratios, fuel rules, rover behavior and tested edge cases | Port the rules and compare numerical fixtures; source code reuse is not assumed. |
| Original models, textures and later source artwork | Use portable source assets and an import pipeline. Godot supports glTF/GLB; test scale, materials and orientation. |
| Procedural Three.js settlement meshes | Either build conversion tooling for suitable static geometry or regenerate them in the native engine. Do not assume a scene export recreates the full game. |
| Renderer shaders/materials and character animation code | Rebuild or adapt and validate visually. |
| HTML/CSS HUD and DOM input handlers | Rebuild as native-engine UI and input actions. |
| Existing field-log contents | Preserve schema knowledge and IDs; explicit import/export may be built later. Browser storage will not automatically transfer to Steam. |

See [Godot's supported 3D formats](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html). Importing a model does not import its Three.js controller, interaction rules, collision policy or DOM interface.

## Proposed native architecture

Use a persistent expedition-state layer with separately loaded local scenes:

- **Solar travel:** moving destinations, navigation, fuel and the sparse interplanetary view. Detailed settlement scenes are unloaded.
- **Local orbit:** main ship, lander, relative movement and docking in a small body-relative coordinate frame.
- **Surface location:** the currently visited settlement, terrain, local vehicle and people. Other destinations' detailed scenes are unloaded.
- **Shared services:** input actions, settings, saves, audio, mission events and optional Steam integration.

The transition coordinator owns the active craft, camera, input context and cargo handoff. Scenes own local presentation. Store stable IDs and plain values in saves, not engine object references.

Engine physics does not automatically supply our intended orbits or spacecraft handling. Keep those as explicit gameplay systems. Similarly, an engine does not remove terrain/detail budgets: only load what the current scene needs, preserve instancing/batching where appropriate, and measure actual frame times.

## Development sequence

1. **Continue the browser trial within a bounded scope.** Use Mars and an early second destination to test exploration, travel pacing and player interest. Fix observed performance problems before making public quality claims.
2. **Prove the native path early.** Build the small native slice alongside the trial; do not finish all planetary chapters in web-specific code first.
3. **Choose the production engine from that slice.** Establish asset conventions and data import, then move ongoing game production there.
4. **Port the reusable foundation.** Controllers, scenes, UI, progress, loading, settings and saves precede a mass content migration.
5. **Produce the native demo from the production project.** Use a curated content list and start/end points, not an unrelated implementation that will be discarded.
6. **Release the complete game after production and platform testing.** Shared demo/full-game progression and content must have explicit compatibility policies.

These are milestones, not calendar estimates. The new destination foundation plan remains useful, but avoid polishing many web-only chapter implementations while the native engine is still unproven.

## How the web trial fits later

There are two practical options:

- Keep the existing Three.js trial as a small, stable introduction, while the native game becomes the primary implementation.
- After proving the native engine, test exporting a reduced trial from the same engine project. Prefer this if the experience, loading and compatibility are good enough; it reduces duplicate gameplay maintenance.

Do not promise that a desktop-quality build will export unchanged to browsers. Current Godot 4 documentation limits web exports to the Compatibility renderer/WebGL 2, and currently excludes C# projects from web export. That is a reason to test a GDScript web slice if shared engine exports matter. [Official web export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html).

Do not permanently constrain the full desktop game to the web trial's quality limits. Conversely, keep the trial representative enough that it does not advertise a different experience.

## Steam demo and release

The browser trial can link to the game's Steam Coming Soon page for wishlisting and to the native demo once it is available. A demo can be available before the full game's release. Steam treats a demo as a separate application ID associated with the full game's application, with its own build and release configuration. [Official Steam demo documentation](https://partner.steamgames.com/doc/store/application/demos).

The demo and full game should be built from the same native code/content pipeline, with explicit available destinations and mission limits. A Steam upload distributes a built game; it does not convert a website into a native game. Achievements, cloud saves and other Steam features need deliberate integration and testing.

Before presenting the native demo publicly, verify the intended Windows hardware, controls/settings, clean offline startup, save/recovery, full visit/return loop and the actual demo start/end experience. The existing Mac Electron checks are not evidence for that native release.

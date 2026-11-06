# Desktop game and long-term Steam roadmap

## Direction

The long-term goal for the solar expedition game, provisionally **The Third Ring**, is a proper installable desktop game with an eventual Steam release. The current browser build remains the working prototype and a candidate public demo. It is useful for fast iteration and accessible playtests; it no longer imposes a requirement that every future desktop feature fit a browser or achieve identical quality there.

**Planning default:** Windows-first release evaluation, with macOS remaining useful for current development. Windows, macOS, Linux and Steam Deck release commitments must be decided from actual build/test coverage. No release date, final engine or desktop runtime has been selected.

This roadmap belongs to `games/orbit-run` on `codex/solar-expedition`. The earlier Night Drive car-game architecture elsewhere in the repository is a separate design.

## What a desktop target changes

The product needs to install, launch and play without a development server, a browser tab or a live hosted page. Local assets, native save files, graphics/audio settings, remappable controls, controller support, reliable pause/quit/recovery and clean updates become product requirements. Steam adds its own distribution and optional platform integrations.

Packaging the current JavaScript/Three.js game in a desktop shell can preserve much of the existing implementation. That packaging alone does not improve the underlying renderer, terrain tools, physics or content authoring. Those capabilities must be measured against the larger game before choosing the final stack.

A desktop release also does not remove memory, frame-time, loading or content-production budgets. Set those budgets against target PCs and representative scenes, rather than assuming an executable can support unlimited world detail.

## Delivery path and decision gates

| Phase | Deliverable | Exit condition |
| --- | --- | --- |
| A — current prototype | Mars settlement, rover activity, space travel, then the lander/orbit/manual-docking loop. | One enjoyable complete visit-and-return loop that represents the intended game. |
| B — portability foundations | Platform services, versioned expedition data, input actions and bundled assets. | Core game rules stop depending directly on browser storage, DOM controls or remote resources. |
| C — desktop feasibility | An installable Windows slice using the representative Mars/space/docking content. A focused engine comparison if required. | Recorded frame times, memory, load times, input behavior, save/reload and offline startup on real target Windows hardware. |
| D — stack decision | Choose the production desktop runtime/engine and record the rationale. | Choose before authoring the remaining planetary chapters at scale; estimate any port explicitly. |
| E — desktop vertical slice/demo | A polished Mars visit, manual docking and a first outward journey in the chosen stack. | Clean-machine install, full input support, persistent progress, stable updates and a useful external playtest. |
| F — Steam audience and production | Store presentation/demo planning, onboarding, more destinations and the complete expedition. | Public claims match the build; content is produced through the chosen pipeline and tested regularly as packaged builds. |
| G — release candidate | Complete, tested desktop game with a supported save/update path and agreed Steam features. | Platform review, release checklist, supported hardware testing and player-facing materials are ready. |

Phases B and early C can run alongside the visit-loop work. Do not interpret this plan as an instruction to rewrite Mars immediately, or to finish eight browser chapters before evaluating desktop feasibility. Store preparation can begin after a convincing slice exists, while production continues; it does not have to wait for the entire game to be finished.

## Runtime and engine choice remains open

These are candidates for a bounded evaluation, not four production implementations.

| Candidate | Reuse and purpose | Questions to settle with the slice |
| --- | --- | --- |
| Electron + the current Three.js game | A direct route to a desktop playtest using the existing JavaScript, scene code and HTML/CSS interface. Electron bundles Chromium and Node.js. | Does this renderer/tooling meet our intended terrain, physics, animation and content needs? Are memory, startup and Steam bridge behavior acceptable? |
| Tauri + the current game, if there is a measured reason to compare | Another desktop-shell candidate; Windows WebView2/runtime distribution needs explicit testing and an offline installation policy. | Does the webview/runtime/bridge combination behave consistently on target PCs? Do the measured benefits justify a second shell evaluation? |
| Godot | A candidate game engine with a Windows export pipeline. Treat it as a real port of scenes/UI/gameplay integration. | Are terrain, vehicle, animation and scene-authoring workflows a good match for our scale and team? What can move as data/assets, and what must be rebuilt? |
| Unreal Engine | A candidate for a game-engine production pipeline with packaged desktop builds. Treat it as a real port, not an automatic export of this web project. | Does the desired visual/physics/content scope justify its production/build workflow and resource costs? Can we package and iterate efficiently on our machines? |

Recommended first experiment: preserve a lightweight desktop version of the existing slice to establish a baseline. If the larger vision demands engine capabilities that would be expensive to recreate, build one representative engine comparison early. Choose one engine for that comparison based on the intended art/physics requirements; do not start two full ports in parallel.

Measure the same work in each candidate: drive the Mars route and solar field, change scenes, run the launch/return staging, perform manual docking, load/save, use a controller and quit/restart offline. The current direct surface/orbit handoff is not an adequate substitute for testing the later docking/cinematic load.

### What survives an engine change

- Story, location design, mission/event IDs, numeric world policy and validated design decisions.
- Asset source files in portable formats, with explicit scale/orientation and provenance.
- Save/mission schemas and behavioral test fixtures where kept engine-independent.
- The browser prototype as a reference for intended behavior and a potential demo.

Procedural Three.js scene code, DOM/CSS HUDs, renderer-specific materials and JavaScript vehicle integration do not automatically become Godot/Unreal scenes or native code. Budget reimplementation, validation and art conversion. Even pure JavaScript rules may need a port if the chosen runtime cannot execute them directly.

## Architecture work to start before the desktop build

### Game state and platform services

Define narrow platform interfaces. Keep a browser implementation for the prototype and add the chosen desktop implementation behind the same game-facing contract.

| Service | Browser prototype | Desktop target |
| --- | --- | --- |
| SaveStore | Existing local surface record, then versioned browser storage/export. | Native per-user save directory, atomic writes, backup/recovery, and optional Steam Cloud integration. |
| InputActions | Keyboard, pointer, touch and browser gamepad input. | Remappable keyboard/mouse/controller actions, device hotplug and consistent prompts. |
| AssetProvider | Static URLs and browser-managed delivery. | Bundled local assets, independent of Vercel/RUN/any hosted page. |
| WindowAndLifecycle | Browser visibility, fullscreen/resize, focus and pause. | Fullscreen/window modes, focus loss, suspend/resume, clean quit and platform-specific lifecycle. |
| PlatformFeatures | No-op/local behavior when Steam is unavailable. | Chosen Steam features behind an optional adapter with failure/offline handling. |

Do not put filesystem, native-process or Steam calls directly into mission logic, physics or every scene. For a web-based shell, use the runtime's intended bridge/process boundary; do not give arbitrary rendered content unrestricted native access.

### Saves and updates

The Mars `localStorage` save is a prototype surface record, not the desktop save architecture. Define a complete expedition schema covering the main ship, lander, rover, location, orbital time, cargo, missions and stable transition checkpoints. Use stable IDs and values, not live Three.js/DOM/native object references.

Separate user settings from progression. Plan schema migrations, interrupted-write recovery, update compatibility and a deliberate browser-save import/export path if useful. Installing or updating the game must preserve user progress. Steam Cloud does not automatically understand a browser's localStorage record; choose real save files or an explicit API-backed storage implementation.

### Input, assets and content workflow

- Represent actions such as Drive, Brake, Interact, Launch, Dock, Pause and Open Map independently of physical key codes.
- Design controller navigation for every required menu and docking action, not only rover movement.
- Keep required UI text separate from scene code so localization and layout changes remain feasible.
- Bundle the fonts, audio, textures and other required assets for offline play. Current external Google Fonts must not be required by the desktop build.
- Decide asset source formats, units, coordinate conventions, authoring/export rules and licensing records before producing many planets.
- Keep physics/mission rules testable separately from the renderer. Use cross-runtime fixtures if an engine port is chosen.
- Preserve the distinction between solar-scale coordinates, local orbital operations and surface scenes in whichever stack wins.

## Desktop quality gate

Before calling a build a desktop demo:

- Install and launch on a clean supported Windows PC without Node.js, Python, an editor, a localhost server or an internet connection being needed to play.
- Play the complete slice using keyboard/mouse and the supported controller configuration, including all required menus.
- Save and reload at every stable phase; test crash/interruption recovery and a normal update from an older supported save.
- Verify graphics presets, resolution/window modes, audio controls, captions and input sensitivity/remapping.
- Test focus loss, alt-tab, pause, suspend/resume where supported, and clean quit without stuck input or runaway audio.
- Record frame-time behavior, memory and load times at the solar field, terrain excursion, scene transition, cinematic and manual docking.
- Verify required assets work offline, with no production dependence on the browser preview server or hosted game URL.
- Retain build symbols/logs appropriate for debugging and a repeatable release artifact pipeline.

Choose minimum/recommended system requirements from measurements later. No hardware specification is promised by this roadmap.

## Steam release track

Steam release and Steamworks API integration are separate planning concerns. Valve documents that integrating the Steamworks API is not a requirement to ship a game on Steam; use the features that support this game rather than assuming every platform feature is mandatory. A web-based desktop shell would still need a suitable, maintained bridge for any native Steam APIs we choose to use.

Planned work:

- Onboard the publisher/project when ready, verify current Steam requirements and allow time for account, store-page and build review. Budget the applicable app fee at that point.
- Establish the game's final name, scope, supported operating systems and store claims once the vertical slice supports them.
- Prepare real gameplay screenshots, a trailer, description, capsule assets, credits and relevant disclosures from the actual product.
- Schedule a Coming Soon page, wishlisting and a demo/playtest strategy with the required platform lead time. Check current rules when scheduling rather than fixing a release date from this planning document.
- Create Steam build/depot configuration, private test branches, an upload pipeline and a reproducible release procedure. Use the Steam build/update route for Steam distribution; avoid an unrelated self-updater conflicting with it.
- Evaluate Steam Cloud: use correctly scoped native save files/Auto-Cloud or the Cloud API, keep machine-specific graphics settings separate and test cross-machine behavior.
- Plan full controller support and evaluate Steam Input, correct prompts, overlay/focus behavior and a supported default configuration.
- Add achievements only for meaningful milestones after mission/event IDs are stable. They are a possible feature, not a blocker to the first desktop slice.
- Test when Steam is unavailable/offline, when cloud data differs, and when the game is launched through the Steam client.
- Evaluate Steam Deck/Proton later as a separate compatibility target; do not claim support from a Windows executable or controller support alone.
- Prepare crash/support information, known limitations, update/save compatibility and the final release checklist.

## Current status and next action

The Mars browser build remains the current implementation (`5420acb`). There is no desktop package, selected engine, Steam integration or release date yet.

Continue the lander/orbit/manual-docking loop while defining the platform interfaces above. Then run the bounded Windows desktop feasibility milestone **before scaling up the remaining planetary content**. Record the chosen stack and measurements in this document when that decision is made.

## Primary references

Checked while preparing this roadmap. Recheck version-specific setup, requirements and release rules when implementing/scheduling.

- [Electron introduction](https://www.electronjs.org/docs/latest/) — desktop use of JavaScript/HTML/CSS and bundled Chromium/Node.js.
- [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model) — rendered game/native functionality boundaries.
- [Tauri Windows distribution](https://v2.tauri.app/distribute/windows-installer/) — WebView2 and installer/runtime options.
- [Godot Windows export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_windows.html) — its Windows packaging path.
- [Unreal packaging](https://dev.epicgames.com/documentation/unreal-engine/packaging-your-project) — packaged executables and platform builds.
- [Steamworks onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding?l=english) — onboarding and release scheduling requirements.
- [Steamworks API overview](https://partner.steamgames.com/doc/sdk/api?l=english) — API integration and available platform features.
- [Steam Cloud](https://partner.steamgames.com/doc/features/cloud?l=english) — Auto-Cloud/API options and save-file behavior.
- [Steam Input developer guide](https://partner.steamgames.com/doc/features/steam_controller/getting_started_for_devs?l=english) — action-based input, prompts and supported control configurations.
